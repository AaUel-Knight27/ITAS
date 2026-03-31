const FALLBACK_SLUG_BASE = "course";
const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const DEFAULT_SUFFIX_LENGTH = 5;

export function normalizeSlugInput(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createSlugCandidate(value: string, suffixLength = DEFAULT_SUFFIX_LENGTH): string {
  const base = normalizeSlugInput(value) || FALLBACK_SLUG_BASE;
  let suffix = "";

  for (let index = 0; index < suffixLength; index += 1) {
    const randomIndex = Math.floor(Math.random() * SUFFIX_ALPHABET.length);
    suffix += SUFFIX_ALPHABET[randomIndex];
  }

  return `${base}-${suffix}`;
}
