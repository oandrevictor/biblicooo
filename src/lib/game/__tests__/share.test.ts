import { describe, expect, it } from "vitest";
import { getEntityById } from "../entities";
import { evaluateGuess } from "../feedback";
import { buildShareText } from "../share";

function entity(id: string) {
  const found = getEntityById(id);
  if (!found) {
    throw new Error(`Missing entity ${id}`);
  }

  return found;
}

describe("buildShareText", () => {
  it("builds a compact share result with total attempts and at most six rows", () => {
    const answer = entity("josue");
    const attempts = [
      "pedro",
      "tiago-filho-zebedeu",
      "abraao",
      "jaco",
      "noe",
      "isaque",
      "josue"
    ].map((id) => evaluateGuess(entity(id), answer));

    const result = buildShareText(attempts, "2026-07-08");
    const lines = result.split("\n");

    expect(lines[0]).toBe("Biblicooo.com 2026-07-08");
    expect(lines[1]).toBe("Tentativas: 7");
    expect(lines.slice(3)).toHaveLength(6);
    expect(lines.at(-1)).toBe("🟩🟩🟩🟩🟩🟩");
  });
});
