import { describe, expect, it } from "vitest";
import { normalizeText, slugify } from "../normalize";

describe("normalizeText", () => {
  it("matches accented and unaccented Portuguese names", () => {
    expect(normalizeText("  João   Batista ")).toBe("joao batista");
    expect(normalizeText("Bate-Seba")).toBe("bate seba");
    expect(normalizeText("Éfeso!")).toBe("efeso");
  });

  it("creates stable slugs", () => {
    expect(slugify("Maria de Betânia")).toBe("maria-de-betania");
  });
});
