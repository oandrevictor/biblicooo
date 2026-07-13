import { describe, expect, it } from "vitest";
import {
  createGuessResponse,
  createPracticeGuessResponse,
  createPracticeStartResponse,
  createRevealResponse
} from "../api";
import { getAnswerPool } from "../entities";
import { getDailyAnswer } from "../daily";

describe("createGuessResponse", () => {
  it("rejects malformed guesses", () => {
    expect(createGuessResponse({}).ok).toBe(false);
    expect(createGuessResponse({ guessId: "missing" }).ok).toBe(false);
  });

  it("does not expose the answer during normal play", () => {
    const answer = getDailyAnswer("2026-07-08");
    const nonAnswerGuess = answer.id === "jesus" ? "pedro" : "jesus";
    const response = createGuessResponse(
      { guessId: nonAnswerGuess },
      new Date("2026-07-08T12:00:00.000Z")
    );

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response).not.toHaveProperty("answer");
      expect(response.feedback.guess.id).toBe(nonAnswerGuess);
      expect(typeof response.solved).toBe("boolean");
    }
  });

  it("exposes the answer after a solved guess", () => {
    const answer = getDailyAnswer("2026-07-08");
    const response = createGuessResponse(
      { guessId: answer.id },
      new Date("2026-07-08T12:00:00.000Z")
    );

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.answer?.name).toBeTruthy();
      expect(response.answer).toHaveProperty("era");
      expect(response.answer).toHaveProperty("role");
    }
  });
});

describe("createRevealResponse", () => {
  it("rejects reveal before game over", () => {
    expect(
      createRevealResponse(
        { guessIds: [] },
        new Date("2026-07-08T12:00:00.000Z")
      ).ok
    ).toBe(false);
  });

  it("reveals after the answer has been guessed", () => {
    const answer = getDailyAnswer("2026-07-08");
    const response = createRevealResponse(
      { guessIds: ["jesus", "pedro", answer.id] },
      new Date("2026-07-08T12:00:00.000Z")
    );

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.answer.name).toBeTruthy();
    }
  });
});

describe("practice responses", () => {
  it("starts a practice game from the answer pool", () => {
    const pool = getAnswerPool();
    const response = createPracticeStartResponse(() => 0);

    expect(response.answerId).toBe(pool[0]?.id);
  });

  it("rejects invalid practice answers", () => {
    expect(
      createPracticeGuessResponse({ guessId: "jesus", answerId: "missing" }).ok
    ).toBe(false);
  });

  it("scores practice guesses against the selected answer", () => {
    const response = createPracticeGuessResponse({
      guessId: "josue",
      answerId: "josue"
    });

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.solved).toBe(true);
      expect(response.answer?.name).toBe("Josue");
    }
  });
});
