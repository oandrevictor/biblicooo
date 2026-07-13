export type EntityType = "character" | "place";
export type Testament = "old" | "new";
export type Gender = "male" | "female" | "unknown" | null;
export type HistoricalEra =
  | "origins"
  | "patriarchs"
  | "exodus"
  | "conquest"
  | "judges"
  | "monarchy"
  | "exile"
  | "return"
  | "jesus"
  | "early_church"
  | "prophecy";
export type CharacterRole =
  | "patriarch_matriarch"
  | "prophet"
  | "priest_levite"
  | "judge_deliverer"
  | "monarch"
  | "apostle"
  | "disciple_follower"
  | "church_leader_missionary"
  | "political_ruler"
  | "opponent"
  | "family_member"
  | "other";

export type SourceRef = {
  name: string;
  url?: string;
  id?: string;
};

export type FirstAppearance = {
  book: string;
  chapter?: number;
  verse?: number;
  order: number;
};

export type BiblicalEntity = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  type: EntityType;
  testament: Testament;
  gender: Gender;
  primaryRole: CharacterRole | null;
  roleTags: string[];
  era: HistoricalEra;
  firstAppearance: FirstAppearance;
  books: string[];
  sources: SourceRef[];
  answerEligible: boolean;
};

export type PublicEntity = Pick<
  BiblicalEntity,
  "id" | "slug" | "name" | "aliases" | "type"
>;

export type FeedbackStatus =
  | "match"
  | "miss"
  | "before"
  | "after"
  | "same_book"
  | "not_applicable";

export type GuessFeedback = {
  guess: PublicEntity;
  correct: boolean;
  testament: {
    status: Extract<FeedbackStatus, "match" | "miss">;
    guess: Testament;
  };
  gender: {
    status: Extract<FeedbackStatus, "match" | "miss" | "not_applicable">;
    guess: Gender;
  };
  role: {
    status: Extract<FeedbackStatus, "match" | "miss" | "not_applicable">;
    guess: CharacterRole | null;
    sharedTags: string[];
  };
  era: {
    status: Extract<FeedbackStatus, "match" | "before" | "after">;
    guess: HistoricalEra;
  };
  firstAppearance: {
    status: Extract<FeedbackStatus, "before" | "after" | "same_book">;
    guess: FirstAppearance;
  };
  sharedBook: {
    status: Extract<FeedbackStatus, "match" | "miss">;
    books: string[];
  };
};

export type TodayPayload = {
  date: string;
  timezone: string;
  attemptsAllowed: number | null;
  answerPoolSize: number;
};

export type EndGameAnswer = {
  id: string;
  name: string;
  type: EntityType;
  role: CharacterRole | null;
  era: HistoricalEra;
};

export type GuessRequest = {
  guessId: string;
};

export type GuessResponse =
  | {
      ok: true;
      date: string;
      feedback: GuessFeedback;
      solved: boolean;
      answer?: EndGameAnswer;
    }
  | {
      ok: false;
      error: string;
    };

export type RevealRequest = {
  guessIds: string[];
};

export type RevealResponse =
  | {
      ok: true;
      date: string;
      answer: EndGameAnswer;
    }
  | {
      ok: false;
      error: string;
    };

export type PracticeStartResponse = {
  ok: true;
  answerId: string;
};

export type PracticeGuessRequest = {
  guessId: string;
  answerId: string;
};
