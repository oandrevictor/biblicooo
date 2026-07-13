const MULTISPACE = /\s+/g;
const NON_WORD_SPACES = /[^\p{L}\p{N}\s-]/gu;

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(NON_WORD_SPACES, "")
    .replace(/-/g, " ")
    .replace(MULTISPACE, " ")
    .trim()
    .toLowerCase();
}

export function slugify(value: string) {
  return normalizeText(value).replaceAll(" ", "-");
}
