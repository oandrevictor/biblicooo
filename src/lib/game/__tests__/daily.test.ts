import { describe, expect, it } from "vitest";
import {
  getDailyAnswer,
  getGameDate,
  getGameNumber,
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

  it("numbers the launch word as one and increments each day", () => {
    expect(getGameNumber("2026-07-13")).toBe(1);
    expect(getGameNumber("2026-07-14")).toBe(2);
    expect(getGameNumber("2026-08-12")).toBe(31);
  });

  it("increments the game number at midnight in Fortaleza", () => {
    const beforeMidnight = getTodayPayload(
      new Date("2026-07-14T02:59:00.000Z")
    );
    const afterMidnight = getTodayPayload(
      new Date("2026-07-14T03:01:00.000Z")
    );

    expect(beforeMidnight.date).toBe("2026-07-13");
    expect(beforeMidnight.gameNumber).toBe(1);
    expect(afterMidnight.date).toBe("2026-07-14");
    expect(afterMidnight.gameNumber).toBe(2);
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
