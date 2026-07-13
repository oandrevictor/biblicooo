import { describe, expect, it } from "vitest";
import { getEntityById } from "../entities";
import { evaluateGuess } from "../feedback";
import { getBestResults } from "../summary";

function entity(id: string) {
  const found = getEntityById(id);
  if (!found) {
    throw new Error(`Missing entity ${id}`);
  }

  return found;
}

describe("getBestResults", () => {
  it("returns no summary without attempts", () => {
    expect(getBestResults([])).toBeNull();
  });

  it("keeps the strongest status and uses the latest result for ties", () => {
    const answer = entity("elias");
    const first = evaluateGuess(entity("jaco"), answer);
    const latest = evaluateGuess(entity("pedro"), answer);
    const summary = getBestResults([first, latest]);

    expect(summary?.testament).toBe(first);
    expect(summary?.gender).toBe(latest);
    expect(summary?.era).toBe(latest);
  });

  it("uses the solved attempt as the best result in every category", () => {
    const answer = entity("elias");
    const miss = evaluateGuess(entity("pedro"), answer);
    const solved = evaluateGuess(answer, answer);
    const summary = getBestResults([miss, solved]);

    expect(summary).not.toBeNull();
    expect(Object.values(summary ?? {})).toEqual(
      Array.from({ length: 6 }, () => solved)
    );
  });
});
