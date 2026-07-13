import { getAnswerPool } from "./entities";

export const GAME_TIMEZONE = "America/Fortaleza";
export const FIRST_GAME_DATE = "2026-07-13";

function dateOrdinal(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function getGameDate(date = new Date(), timezone = GAME_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not format game date");
  }

  return `${year}-${month}-${day}`;
}

export function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getGameNumber(dateString = getGameDate()) {
  const gameNumber =
    dateOrdinal(dateString) - dateOrdinal(FIRST_GAME_DATE) + 1;

  return Math.max(1, gameNumber);
}

export function getDailyAnswer(dateString = getGameDate()) {
  const pool = getAnswerPool();
  if (pool.length === 0) {
    throw new Error("Answer pool is empty");
  }

  return pool[stableHash(`biblicooo:${dateString}`) % pool.length];
}

export function getTodayPayload(date = new Date()) {
  const gameDate = getGameDate(date);
  const answer = getDailyAnswer(gameDate);

  return {
    date: gameDate,
    timezone: GAME_TIMEZONE,
    attemptsAllowed: null,
    answerPoolSize: getAnswerPool().length,
    answerType: answer.type,
    gameNumber: getGameNumber(gameDate)
  };
}
