import { describe, expect, it } from "vitest";
import { getEntityById } from "../entities";
import { evaluateGuess } from "../feedback";

describe("evaluateGuess", () => {
  it("scores matching testament, gender, era, first book, and shared books", () => {
    const guess = getEntityById("pedro");
    const answer = getEntityById("andre");

    expect(guess).toBeDefined();
    expect(answer).toBeDefined();

    const feedback = evaluateGuess(guess!, answer!);

    expect(feedback.testament.status).toBe("match");
    expect(feedback.gender.status).toBe("match");
    expect(feedback.role.status).toBe("match");
    expect(feedback.role.guess).toBe("apostle");
    expect(feedback.era.status).toBe("match");
    expect(feedback.firstAppearance.status).toBe("same_book");
    expect(feedback.sharedBook.status).toBe("match");
  });

  it("marks character-only clues as not applicable when a place is involved", () => {
    const guess = getEntityById("jerusalem");
    const answer = getEntityById("jesus");

    expect(guess).toBeDefined();
    expect(answer).toBeDefined();

    const feedback = evaluateGuess(guess!, answer!);

    expect(feedback.gender.status).toBe("not_applicable");
    expect(feedback.role.status).toBe("not_applicable");
  });

  it("compares first appearance order across books", () => {
    const guess = getEntityById("adam");
    const answer = getEntityById("paulo");

    expect(guess).toBeDefined();
    expect(answer).toBeDefined();

    expect(evaluateGuess(guess!, answer!).firstAppearance.status).toBe("before");
    expect(evaluateGuess(answer!, guess!).firstAppearance.status).toBe("after");
  });

  it("compares era order with before and after hints", () => {
    const earlyGuess = getEntityById("adam");
    const laterAnswer = getEntityById("paulo");

    expect(earlyGuess).toBeDefined();
    expect(laterAnswer).toBeDefined();

    expect(evaluateGuess(earlyGuess!, laterAnswer!).era.status).toBe("before");
    expect(evaluateGuess(laterAnswer!, earlyGuess!).era.status).toBe("after");
  });
});
