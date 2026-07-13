import type { BiblicalEntity, GuessFeedback, HistoricalEra } from "./types";

const ERA_ORDER: Record<HistoricalEra, number> = {
  origins: 1,
  patriarchs: 2,
  exodus: 3,
  conquest: 4,
  judges: 5,
  monarchy: 6,
  exile: 7,
  return: 8,
  jesus: 9,
  early_church: 10,
  prophecy: 11
};

export function evaluateGuess(
  guess: BiblicalEntity,
  answer: BiblicalEntity
): GuessFeedback {
  const sharedBooks = guess.books.filter((book) => answer.books.includes(book));
  const sharedRoleTags = guess.roleTags.filter((tag) =>
    answer.roleTags.includes(tag)
  );
  const firstAppearanceStatus =
    guess.firstAppearance.book === answer.firstAppearance.book
      ? "same_book"
      : guess.firstAppearance.order < answer.firstAppearance.order
        ? "before"
        : "after";
  const eraStatus =
    guess.era === answer.era
      ? "match"
      : ERA_ORDER[guess.era] < ERA_ORDER[answer.era]
        ? "before"
        : "after";

  return {
    guess: {
      id: guess.id,
      slug: guess.slug,
      name: guess.name,
      aliases: guess.aliases,
      type: guess.type
    },
    correct: guess.id === answer.id,
    testament: {
      status: guess.testament === answer.testament ? "match" : "miss",
      guess: guess.testament
    },
    gender: {
      status:
        guess.type === "character" && answer.type === "character"
          ? guess.gender === answer.gender
            ? "match"
            : "miss"
          : "not_applicable",
      guess: guess.gender
    },
    role: {
      status:
        guess.type === "character" && answer.type === "character"
          ? guess.primaryRole === answer.primaryRole
            ? "match"
            : "miss"
          : "not_applicable",
      guess: guess.primaryRole,
      sharedTags: sharedRoleTags
    },
    era: {
      status: eraStatus,
      guess: guess.era
    },
    firstAppearance: {
      status: firstAppearanceStatus,
      guess: guess.firstAppearance
    },
    sharedBook: {
      status: sharedBooks.length > 0 ? "match" : "miss",
      books: sharedBooks
    }
  };
}
