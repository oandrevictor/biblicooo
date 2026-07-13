import rawEntities from "@/data/entities.json";
import { normalizeText } from "./normalize";
import type { BiblicalEntity, PublicEntity } from "./types";

const entities = rawEntities as BiblicalEntity[];

export function getEntities() {
  return entities;
}

export function getPublicEntities(): PublicEntity[] {
  return entities.map(({ id, slug, name, aliases, type }) => ({
    id,
    slug,
    name,
    aliases,
    type
  }));
}

export function getEntityById(id: string) {
  return entities.find((entity) => entity.id === id);
}

export function getAnswerPool() {
  return entities.filter((entity) => entity.answerEligible);
}

export function findEntityByInput(input: string) {
  const normalizedInput = normalizeText(input);

  return entities.find((entity) => {
    const candidates = [entity.name, ...entity.aliases].map(normalizeText);
    return candidates.includes(normalizedInput);
  });
}

export function findDuplicateSearchKeys() {
  const seen = new Map<string, string>();
  const duplicates: Array<{ key: string; firstId: string; secondId: string }> =
    [];

  for (const entity of entities) {
    for (const candidate of [entity.name, ...entity.aliases]) {
      const key = normalizeText(candidate);
      const existing = seen.get(key);
      if (existing && existing !== entity.id) {
        duplicates.push({ key, firstId: existing, secondId: entity.id });
      } else {
        seen.set(key, entity.id);
      }
    }
  }

  return duplicates;
}
