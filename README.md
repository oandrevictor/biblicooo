# Biblicooo

Portuguese-first biblical Wordle-style game. The daily word is a Bible character or place, and guesses are scored against testament, gender, historical era, first appearance, and shared books.

## Development

```bash
npm install
npm run dev
```

## Data

The playable dataset is generated at `src/data/entities.json`. Curated biblical metadata lives in `data/curation/entity-metadata.json`, and Wikidata enrichment can be refreshed with:

```bash
npm run import:wikidata
```

That command writes an auditable raw cache to `data/import/raw-wikidata.json`, the normalized app dataset to `src/data/entities.json`, and a review report to `data/review-report.json`.
