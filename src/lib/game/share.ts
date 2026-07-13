import type { FeedbackStatus, GuessFeedback } from "./types";

const STATUS_SQUARES: Record<FeedbackStatus, string> = {
  match: "🟩",
  same_book: "🟩",
  before: "🟨",
  after: "🟨",
  miss: "🟥",
  not_applicable: "⬜"
};

function square(status: FeedbackStatus) {
  return STATUS_SQUARES[status];
}

function attemptRow(attempt: GuessFeedback) {
  return [
    square(attempt.testament.status),
    square(attempt.gender.status),
    square(attempt.era.status),
    square(attempt.role.status),
    square(attempt.firstAppearance.status),
    square(attempt.sharedBook.status)
  ].join("");
}

export function buildShareText(attempts: GuessFeedback[], date: string) {
  const visibleAttempts = attempts.slice(-6);
  const rows = visibleAttempts.map(attemptRow);

  return [
    `Biblic.ooo ${date}`,
    `Tentativas: ${attempts.length}`,
    "",
    ...rows
  ].join("\n");
}
