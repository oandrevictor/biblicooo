import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const curationPath = path.join(root, "data/curation/entity-metadata.json");
const rolesPath = path.join(root, "data/curation/character-roles.json");
const rawPath = path.join(root, "data/import/raw-wikidata.json");
const entitiesPath = path.join(root, "src/data/entities.json");
const reportPath = path.join(root, "data/review-report.json");

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const SKIP_WIKIDATA = process.env.BIBLICOOO_SKIP_WIKIDATA === "1";
const USE_RAW_CACHE = process.env.BIBLICOOO_USE_RAW_CACHE === "1";
let wikidataRateLimited = false;

const bookOrder = [
  "Genesis",
  "Exodo",
  "Levitico",
  "Numeros",
  "Deuteronomio",
  "Josue",
  "Juizes",
  "Rute",
  "1 Samuel",
  "2 Samuel",
  "1 Reis",
  "2 Reis",
  "1 Cronicas",
  "2 Cronicas",
  "Esdras",
  "Neemias",
  "Ester",
  "Jo",
  "Salmos",
  "Proverbios",
  "Eclesiastes",
  "Cantares",
  "Isaias",
  "Jeremias",
  "Lamentacoes",
  "Ezequiel",
  "Daniel",
  "Oseias",
  "Joel",
  "Amos",
  "Obadias",
  "Jonas",
  "Miqueias",
  "Naum",
  "Habacuque",
  "Sofonias",
  "Ageu",
  "Zacarias",
  "Malaquias",
  "Mateus",
  "Marcos",
  "Lucas",
  "Joao",
  "Atos",
  "Romanos",
  "1 Corintios",
  "2 Corintios",
  "Galatas",
  "Efesios",
  "Filipenses",
  "Colossenses",
  "1 Tessalonicenses",
  "2 Tessalonicenses",
  "1 Timoteo",
  "2 Timoteo",
  "Tito",
  "Filemom",
  "Hebreus",
  "Tiago",
  "1 Pedro",
  "2 Pedro",
  "1 Joao",
  "2 Joao",
  "3 Joao",
  "Judas",
  "Apocalipse"
];

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function slugify(value) {
  return normalizeText(value).replaceAll(" ", "-");
}

function orderFor(firstAppearance) {
  const bookIndex = bookOrder.indexOf(firstAppearance.book);
  if (bookIndex === -1) {
    throw new Error(`Unknown Bible book: ${firstAppearance.book}`);
  }

  return (
    (bookIndex + 1) * 1_000_000 +
    (firstAppearance.chapter ?? 0) * 1_000 +
    (firstAppearance.verse ?? 0)
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function searchWikidata(query, retryCount = 0) {
  if (wikidataRateLimited) {
    return { error: "Skipped after Wikidata rate limit" };
  }

  const params = new URLSearchParams({
    action: "wbsearchentities",
    format: "json",
    language: "pt",
    uselang: "pt",
    limit: "1",
    search: query
  });

  const response = await fetch(`${WIKIDATA_API}?${params.toString()}`, {
    headers: {
      "User-Agent": "biblicooo/0.1 data import"
    }
  });

  if (response.status === 429) {
    if (retryCount >= 1) {
      wikidataRateLimited = true;
      return { error: "HTTP 429" };
    }

    await wait(1200);
    return searchWikidata(query, retryCount + 1);
  }

  if (!response.ok) {
    return { error: `HTTP ${response.status}` };
  }

  return response.json();
}

async function fetchWikidataCandidate(seed) {
  if (SKIP_WIKIDATA) {
    return null;
  }

  const searchTerms = unique([seed.name, ...seed.aliases]);

  try {
    for (const searchTerm of searchTerms) {
      const data = await searchWikidata(searchTerm);
      if (data.error) {
        return data;
      }

      const candidate = data.search?.[0];
      if (candidate?.id) {
        return {
          id: candidate.id,
          label: candidate.label,
          description: candidate.description,
          concepturi: candidate.concepturi,
          matchedSearch: searchTerm
        };
      }

      await wait(250);
    }

    return null;
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function unique(values) {
  const seen = new Set();
  const output = [];
  for (const value of values.filter(Boolean)) {
    const key = normalizeText(value);
    if (!seen.has(key)) {
      seen.add(key);
      output.push(value);
    }
  }

  return output;
}

function createEntity(seed, wikidata, role) {
  const wikidataLabel = wikidata && !wikidata.error ? wikidata.label : null;
  const name = wikidataLabel || seed.name;
  const aliases = unique([
    ...seed.aliases,
    seed.name,
    wikidataLabel
  ]).filter((alias) => normalizeText(alias) !== normalizeText(name));

  return {
    id: seed.id,
    slug: slugify(seed.name),
    name,
    aliases,
    type: seed.type,
    testament: seed.testament,
    gender: seed.gender,
    primaryRole: seed.type === "character" ? role?.primaryRole ?? null : null,
    roleTags: seed.type === "character" ? role?.roleTags ?? [] : [],
    era: seed.era,
    firstAppearance: {
      ...seed.firstAppearance,
      order: orderFor(seed.firstAppearance)
    },
    books: seed.books,
    sources: [
      {
        name: "Curadoria Biblicooo",
        id: "data/curation/entity-metadata.json"
      },
      ...(seed.type === "character" && role
        ? [
            {
              name: "Curadoria de papeis Biblicooo",
              id: "data/curation/character-roles.json"
            }
          ]
        : []),
      ...(wikidata && !wikidata.error
        ? [
            {
              name: "Wikidata",
              id: wikidata.id,
              url: wikidata.concepturi
            }
          ]
        : [])
    ],
    answerEligible: seed.answerEligible
  };
}

function createReport(entities, rawRecords) {
  const searchKeys = new Map();
  const duplicateLabels = [];

  for (const entity of entities) {
    for (const label of [entity.name, ...entity.aliases]) {
      const key = normalizeText(label);
      const existing = searchKeys.get(key);
      if (existing && existing !== entity.id) {
        duplicateLabels.push({ key, firstId: existing, secondId: entity.id });
      } else {
        searchKeys.set(key, entity.id);
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      curatedSeeds: entities.length,
      appEntities: entities.length,
      answerEligible: entities.filter((entity) => entity.answerEligible).length,
      wikidataMatches: rawRecords.filter(
        (record) => record.wikidata && !record.wikidata.error
      ).length,
      wikidataErrors: rawRecords.filter((record) => record.wikidata?.error)
        .length
    },
    missingGender: entities
      .filter((entity) => entity.type === "character" && !entity.gender)
      .map((entity) => entity.id),
    missingCharacterRoles: entities
      .filter((entity) => entity.type === "character" && !entity.primaryRole)
      .map((entity) => entity.id),
    missingFirstAppearance: entities
      .filter((entity) => !entity.firstAppearance?.book)
      .map((entity) => entity.id),
    duplicateLabels,
    excludedEntities: [],
    notes: [
      "First appearances, books, and historical eras are curated against the 66-book Protestant canon.",
      "Wikidata enrichment is used for auditable labels and source IDs when network access is available."
    ]
  };
}

const seeds = JSON.parse(await readFile(curationPath, "utf8"));
const roles = JSON.parse(await readFile(rolesPath, "utf8"));
let rawRecords = [];

if (USE_RAW_CACHE) {
  const cached = JSON.parse(await readFile(rawPath, "utf8"));
  rawRecords = seeds.map((seed) => {
    const cachedRecord = cached.records.find((record) => record.seedId === seed.id);
    return (
      cachedRecord ?? {
        seedId: seed.id,
        search: seed.name,
        wikidata: { error: "Missing from raw cache" }
      }
    );
  });
} else {
  for (const seed of seeds) {
    const wikidata = await fetchWikidataCandidate(seed);
    rawRecords.push({ seedId: seed.id, search: seed.name, wikidata });
    await wait(350);
  }
}

const entities = seeds.map((seed, index) =>
  createEntity(seed, rawRecords[index].wikidata, roles[seed.id])
);
const report = createReport(entities, rawRecords);

await mkdir(path.dirname(rawPath), { recursive: true });
await mkdir(path.dirname(entitiesPath), { recursive: true });
await writeFile(
  rawPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: USE_RAW_CACHE
        ? "existing raw cache"
        : SKIP_WIKIDATA
          ? "curated-only"
          : WIKIDATA_API,
      records: rawRecords
    },
    null,
    2
  )}\n`
);
await writeFile(entitiesPath, `${JSON.stringify(entities, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `Generated ${entities.length} entities (${report.totals.answerEligible} answer eligible).`
);
