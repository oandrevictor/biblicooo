import { describe, expect, it } from "vitest";
import {
  getDailyAnswer,
  getGameDate,
  getTodayPayload,
  stableHash
} from "../daily";

describe("daily word selection", () => {
  it("formats the date in the configured timezone", () => {
    const date = new Date("2026-07-08T02:30:00.000Z");

    expect(getGameDate(date)).toBe("2026-07-07");
  });

  it("uses a stable hash", () => {
    expect(stableHash("biblicooo:2026-07-08")).toBe(
      stableHash("biblicooo:2026-07-08")
    );
  });

  it("selects the same answer for the same date", () => {
    expect(getDailyAnswer("2026-07-08").id).toBe(
      getDailyAnswer("2026-07-08").id
    );
  });

  it("exposes the answer type without exposing the answer", () => {
    const date = new Date("2026-07-08T12:00:00.000Z");
    const payload = getTodayPayload(date);
    const answer = getDailyAnswer(payload.date);

    expect(payload.answerType).toBe(answer.type);
    expect(payload).not.toHaveProperty("answerId");
    expect(payload).not.toHaveProperty("answer");
  });
});
