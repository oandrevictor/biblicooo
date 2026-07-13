import type { FeedbackStatus, GuessFeedback } from "./types";

export const SUMMARY_CATEGORIES = [
  "testament",
  "gender",
  "era",
  "role",
  "firstAppearance",
  "sharedBook"
] as const;

export type SummaryCategory = (typeof SUMMARY_CATEGORIES)[number];

const STATUS_SCORE: Record<FeedbackStatus, number> = {
  match: 3,
  same_book: 3,
  before: 2,
  after: 2,
  miss: 1,
  not_applicable: 0
};

export function getBestResults(attempts: GuessFeedback[]) {
  if (attempts.length === 0) {
    return null;
  }

  return Object.fromEntries(
    SUMMARY_CATEGORIES.map((category) => {
      const best = attempts.reduce((currentBest, attempt) =>
        STATUS_SCORE[attempt[category].status] >=
        STATUS_SCORE[currentBest[category].status]
          ? attempt
          : currentBest
      );

      return [category, best];
    })
  ) as Record<SummaryCategory, GuessFeedback>;
}
