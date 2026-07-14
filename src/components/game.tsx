"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ERA_LABELS,
  TESTAMENT_LABELS,
  formatCharacterRole,
  formatGender
} from "@/lib/game/labels";
import { normalizeText } from "@/lib/game/normalize";
import { buildShareText } from "@/lib/game/share";
import { getBestResults } from "@/lib/game/summary";
import type {
  EndGameAnswer,
  GuessFeedback,
  PublicEntity,
  TodayPayload
} from "@/lib/game/types";

type StoredAttempt = GuessFeedback;

type EntitiesResponse = {
  entities: PublicEntity[];
};

type GuessApiResponse =
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

type RevealApiResponse =
  | {
      ok: true;
      date: string;
      answer: EndGameAnswer;
    }
  | {
      ok: false;
      error: string;
    };

type PracticeStartResponse =
  | {
      ok: true;
      answerId: string;
      answerType: PublicEntity["type"];
    }
  | {
      ok: false;
      error: string;
    };

type GameMode = "daily" | "practice";
type Modal = "help" | "stats" | null;
type Theme = "light" | "dark";

type DailyStats = {
  played: number;
  solved: number;
  currentStreak: number;
  bestStreak: number;
  distribution: number[];
};

const STORAGE_PREFIX = "biblicooo:";
const BOOK_LABELS: Record<string, string> = {
  Genesis: "Gênesis",
  Exodo: "Êxodo",
  Levitico: "Levítico",
  Numeros: "Números",
  Deuteronomio: "Deuteronômio",
  Josue: "Josué",
  Juizes: "Juízes",
  Jo: "Jó",
  Cronicas: "Crônicas",
  Proverbios: "Provérbios",
  Eclesiastes: "Eclesiastes",
  Isaias: "Isaías",
  Lamentacoes: "Lamentações",
  Ezequiel: "Ezequiel",
  Oseias: "Oseias",
  Miqueias: "Miqueias",
  Sofonias: "Sofonias",
  Zacarias: "Zacarias",
  Malaquias: "Malaquias",
  Joao: "João",
  Atos: "Atos",
  Corintios: "Coríntios",
  Galatas: "Gálatas",
  Efesios: "Efésios",
  Filipenses: "Filipenses",
  Colossenses: "Colossenses",
  Tessalonicenses: "Tessalonicenses",
  Timoteo: "Timóteo",
  Filemom: "Filemom"
};

function typeLabel(type: PublicEntity["type"]) {
  return type === "character" ? "Personagem" : "Lugar";
}

function statusClass(status: string) {
  if (status === "match" || status === "same_book") {
    return "match";
  }

  if (status === "not_applicable") {
    return "not-applicable";
  }

  if (status === "before" || status === "after") {
    return "neutral";
  }

  return "miss";
}

function testamentShortLabel(testament: GuessFeedback["testament"]["guess"]) {
  return testament === "old" ? "AT" : "NT";
}

function genderShortLabel(gender: GuessFeedback["gender"]["guess"]) {
  if (gender === "male") {
    return "M";
  }

  if (gender === "female") {
    return "F";
  }

  if (gender === "unknown") {
    return "?";
  }

  return "N/A";
}

function formatBook(book: string) {
  const numberPrefix = book.match(/^(\d) (.+)$/);
  if (!numberPrefix) {
    return BOOK_LABELS[book] ?? book;
  }

  const [, number, name] = numberPrefix;
  return `${number} ${BOOK_LABELS[name] ?? name}`;
}

function firstAppearanceLabel(feedback: GuessFeedback) {
  return formatBook(feedback.firstAppearance.guess.book);
}

function eraLabel(feedback: GuessFeedback) {
  return ERA_LABELS[feedback.era.guess];
}

function relativePositionLabel(status: "before" | "after") {
  return status === "before" ? "Depois" : "Antes";
}

function sharedBookLabel(feedback: GuessFeedback) {
  return feedback.sharedBook.books.length === 0 ? "Não" : "Sim";
}

function resultDescription(attempt: GuessFeedback) {
  const details = [typeLabel(attempt.guess.type)];
  if (attempt.guess.type === "character") {
    details.push(formatCharacterRole(attempt.role.guess));
  }
  details.push(ERA_LABELS[attempt.era.guess]);

  return details.join(" · ");
}

function answerDescription(answer: EndGameAnswer) {
  const details = [typeLabel(answer.type)];
  if (answer.type === "character") {
    details.push(formatCharacterRole(answer.role));
  }
  details.push(ERA_LABELS[answer.era]);

  return details.join(" · ");
}

function endGameTitle(
  solvedAttempt: GuessFeedback | undefined,
  revealedAnswer: EndGameAnswer | null
) {
  return revealedAnswer?.name ?? solvedAttempt?.guess.name ?? "Não foi dessa vez";
}

function endGameDescription(
  solvedAttempt: GuessFeedback | undefined,
  attempts: StoredAttempt[],
  revealedAnswer: EndGameAnswer | null
) {
  if (revealedAnswer) {
    return answerDescription(revealedAnswer);
  }

  if (solvedAttempt) {
    return resultDescription(solvedAttempt);
  }

  const lastAttempt = attempts.at(-1);
  if (!lastAttempt) {
    return "Volte amanhã para uma nova palavra.";
  }

  return `Último palpite: ${lastAttempt.guess.name}. Volte amanhã para uma nova palavra.`;
}

type SummaryResults = NonNullable<ReturnType<typeof getBestResults>>;

function SummaryCard({ results }: { results: SummaryResults }) {
  const testament = results.testament;
  const gender = results.gender;
  const era = results.era;
  const role = results.role;
  const firstAppearance = results.firstAppearance;
  const sharedBook = results.sharedBook;

  return (
    <section className="summary-card" aria-label="Resumo das melhores pistas">
      <div className="summary-heading">
        <strong>Resumo</strong>
        <span>Melhores pistas</span>
      </div>
      <div className="summary-clues">
        <div
          className={`clue summary-clue ${statusClass(
            testament.testament.status
          )}`}
        >
          <span>Testamento</span>
          <strong title={TESTAMENT_LABELS[testament.testament.guess]}>
            {testamentShortLabel(testament.testament.guess)}
          </strong>
        </div>
        <div
          className={`clue summary-clue ${statusClass(gender.gender.status)}`}
        >
          <span>Gênero</span>
          <strong title={formatGender(gender.gender.guess)}>
            {genderShortLabel(gender.gender.guess)}
          </strong>
        </div>
        <div className={`clue summary-clue ${statusClass(era.era.status)}`}>
          <span>Era</span>
          <strong>{eraLabel(era)}</strong>
          {era.era.status === "before" || era.era.status === "after" ? (
            <small className="direction-badge">
              {relativePositionLabel(era.era.status)}
            </small>
          ) : null}
        </div>
        <div className={`clue summary-clue ${statusClass(role.role.status)}`}>
          <span>Papel</span>
          <strong>{formatCharacterRole(role.role.guess)}</strong>
        </div>
        <div
          className={`clue summary-clue ${statusClass(
            firstAppearance.firstAppearance.status
          )}`}
        >
          <span>Primeira referência</span>
          <strong>{firstAppearanceLabel(firstAppearance)}</strong>
          {firstAppearance.firstAppearance.status === "before" ||
          firstAppearance.firstAppearance.status === "after" ? (
            <small className="direction-badge">
              {relativePositionLabel(
                firstAppearance.firstAppearance.status
              )}
            </small>
          ) : null}
        </div>
        <div
          className={`clue summary-clue ${statusClass(
            sharedBook.sharedBook.status
          )}`}
        >
          <span>Livro em comum</span>
          <strong title={sharedBook.sharedBook.books.join(", ")}>
            {sharedBookLabel(sharedBook)}
          </strong>
        </div>
      </div>
    </section>
  );
}

function parseStoredAttempts(value: string): StoredAttempt[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (attempt): attempt is StoredAttempt =>
        Boolean(attempt?.guess?.id && attempt?.role && attempt?.sharedBook)
    );
  } catch {
    return [];
  }
}

function dateOrdinal(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function readLocalDailyStats(todayDate?: string): DailyStats {
  let played = 0;
  let solved = 0;
  const solvedDates: string[] = [];
  const distribution = Array.from({ length: 6 }, () => 0);

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(STORAGE_PREFIX)) {
      continue;
    }

    const date = key.slice(STORAGE_PREFIX.length);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      continue;
    }

    const stored = window.localStorage.getItem(key);
    const attempts = stored ? parseStoredAttempts(stored) : [];
    if (attempts.length === 0) {
      continue;
    }

    played += 1;

    if (attempts.some((attempt) => attempt.correct)) {
      solved += 1;
      solvedDates.push(date);
      distribution[Math.min(attempts.length, 6) - 1] += 1;
    }
  }

  solvedDates.sort();
  let bestStreak = 0;
  let runningStreak = 0;
  let previousOrdinal: number | null = null;

  for (const date of solvedDates) {
    const ordinal = dateOrdinal(date);
    runningStreak = previousOrdinal === ordinal - 1 ? runningStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, runningStreak);
    previousOrdinal = ordinal;
  }

  let currentStreak = runningStreak;
  if (todayDate && previousOrdinal !== null) {
    const daysSinceLastWin = dateOrdinal(todayDate) - previousOrdinal;
    if (daysSinceLastWin > 1) {
      currentStreak = 0;
    }
  }

  return {
    played,
    solved,
    currentStreak,
    bestStreak,
    distribution
  };
}

function copyTextWithSelection(text: string) {
  const activeElement = document.activeElement;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto 0";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (activeElement instanceof HTMLElement) {
    activeElement.focus();
  }

  return copied;
}

async function writeClipboardText(text: string) {
  if (copyTextWithSelection(text)) {
    return;
  }

  if (!navigator.clipboard?.writeText) {
    throw new Error("Copy failed");
  }

  try {
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("Clipboard timeout")), 1000);
      })
    ]);
  } catch {
    throw new Error("Copy failed");
  }
}

export function Game() {
  const [today, setToday] = useState<TodayPayload | null>(null);
  const [entities, setEntities] = useState<PublicEntity[]>([]);
  const [mode, setMode] = useState<GameMode>("daily");
  const [dailyAttempts, setDailyAttempts] = useState<StoredAttempt[]>([]);
  const [practiceAttempts, setPracticeAttempts] = useState<StoredAttempt[]>([]);
  const [practiceAnswerId, setPracticeAnswerId] = useState<string | null>(null);
  const [practiceAnswerType, setPracticeAnswerType] = useState<
    PublicEntity["type"] | null
  >(null);
  const [revealedAnswer, setRevealedAnswer] = useState<EndGameAnswer | null>(
    null
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    played: 0,
    solved: 0,
    currentStreak: 0,
    bestStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadGame() {
      const [todayResponse, entitiesResponse] = await Promise.all([
        fetch("/api/game/today"),
        fetch("/api/entities")
      ]);
      const todayPayload = (await todayResponse.json()) as TodayPayload;
      const entitiesPayload = (await entitiesResponse.json()) as EntitiesResponse;

      setToday(todayPayload);
      setEntities(entitiesPayload.entities);

      const stored = window.localStorage.getItem(
        `${STORAGE_PREFIX}${todayPayload.date}`
      );
      if (stored) {
        setDailyAttempts(parseStoredAttempts(stored));
      }
      setDailyStats(readLocalDailyStats(todayPayload.date));
    }

    loadGame().catch(() => {
      setError("Não foi possível carregar o jogo.");
    });
  }, []);

  useEffect(() => {
    if (!today) {
      return;
    }

    window.localStorage.setItem(
      `${STORAGE_PREFIX}${today.date}`,
      JSON.stringify(dailyAttempts)
    );
    setDailyStats(readLocalDailyStats(today.date));
  }, [dailyAttempts, today]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("biblicooo-theme");
    const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const nextTheme = savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : preferredTheme;

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    if (!activeModal) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeModal]);

  useEffect(() => {
    async function revealAnswer() {
      if (
        mode !== "daily" ||
        !today ||
        revealedAnswer ||
        dailyAttempts.length === 0
      ) {
        return;
      }

      const hasSolved = dailyAttempts.some((attempt) => attempt.correct);
      if (!hasSolved) {
        return;
      }

      const response = await fetch("/api/game/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guessIds: dailyAttempts.map((attempt) => attempt.guess.id)
        })
      });
      const payload = (await response.json()) as RevealApiResponse;
      if (payload.ok) {
        setRevealedAnswer(payload.answer);
      }
    }

    revealAnswer().catch(() => {
      setError("Não foi possível revelar a resposta.");
    });
  }, [dailyAttempts, mode, revealedAnswer, today]);

  async function startPracticeRound() {
    setError("");
    setShareStatus("");
    setRevealedAnswer(null);
    setPracticeAttempts([]);
    setPracticeAnswerId(null);
    setPracticeAnswerType(null);
    setInput("");

    try {
      const response = await fetch("/api/game/practice/start", {
        method: "POST"
      });
      const payload = (await response.json()) as PracticeStartResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      setPracticeAnswerId(payload.answerId);
      setPracticeAnswerType(payload.answerType);
    } catch {
      setError("Não foi possível iniciar a prática.");
    }
  }

  useEffect(() => {
    if (mode === "practice" && !practiceAnswerId) {
      startPracticeRound().catch(() => {
        setError("Não foi possível iniciar a prática.");
      });
    }
  }, [mode, practiceAnswerId]);

  const guessedIds = useMemo(
    () =>
      new Set(
        (mode === "daily" ? dailyAttempts : practiceAttempts).map(
          (attempt) => attempt.guess.id
        )
      ),
    [dailyAttempts, mode, practiceAttempts]
  );

  const attempts = mode === "daily" ? dailyAttempts : practiceAttempts;
  const solved = attempts.some((attempt) => attempt.correct);
  const solvedAttempt = attempts.find((attempt) => attempt.correct);
  const gameOver = solved;
  const isPractice = mode === "practice";
  const answerType = isPractice ? practiceAnswerType : today?.answerType;
  const bestResults = useMemo(() => getBestResults(attempts), [attempts]);

  const availableEntities = useMemo(
    () =>
      answerType
        ? entities.filter((entity) => entity.type === answerType)
        : [],
    [answerType, entities]
  );

  const selectedEntity = useMemo(() => {
    const normalized = normalizeText(input);
    return availableEntities.find((entity) =>
      [entity.name, ...entity.aliases]
        .map(normalizeText)
        .some((candidate) => candidate === normalized)
    );
  }, [availableEntities, input]);

  const suggestions = useMemo(() => {
    const normalizedInput = normalizeText(input);
    if (normalizedInput.length < 1) {
      return [];
    }

    return availableEntities
      .filter((entity) => !guessedIds.has(entity.id))
      .map((entity) => {
        const normalizedName = normalizeText(entity.name);
        const candidates = [entity.name, ...entity.aliases].map(normalizeText);

        return {
          entity,
          rank: normalizedName.startsWith(normalizedInput)
            ? 0
            : candidates.some((candidate) => candidate.startsWith(normalizedInput))
              ? 1
              : 2,
          matches: candidates.some((candidate) =>
            candidate.includes(normalizedInput)
          )
        };
      })
      .filter((candidate) => candidate.matches)
      .sort(
        (first, second) =>
          first.rank - second.rank ||
          first.entity.name.localeCompare(second.entity.name, "pt-BR")
      )
      .slice(0, 6)
      .map(({ entity }) => entity);
  }, [availableEntities, guessedIds, input]);

  async function submitEntity(entity: PublicEntity | undefined) {
    setError("");
    setShareStatus("");

    if (!today || solved || isSubmitting) {
      return;
    }

    if (isPractice && !practiceAnswerId) {
      setError("A prática ainda está carregando.");
      return;
    }

    if (!entity) {
      setError("Escolha um nome da lista.");
      return;
    }

    if (guessedIds.has(entity.id)) {
      setError("Você já tentou esse nome nesta partida.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        isPractice ? "/api/game/practice/guess" : "/api/game/guess",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guessId: entity.id,
            ...(isPractice ? { answerId: practiceAnswerId } : {})
          })
        }
      );
      const payload = (await response.json()) as GuessApiResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      if (payload.answer) {
        setRevealedAnswer(payload.answer);
      }

      if (isPractice) {
        setPracticeAttempts((current) => [...current, payload.feedback]);
      } else {
        setDailyAttempts((current) => [...current, payload.feedback]);
      }
      setInput("");
    } catch {
      setError("Não foi possível enviar o palpite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitEntity(selectedEntity);
  }

  async function copyShareResult() {
    if (!today) {
      return;
    }

    const shareText = buildShareText(
      attempts,
      isPractice ? "Prática" : today.gameNumber
    );

    setError("");
    setShareStatus("Copiando...");

    try {
      await writeClipboardText(shareText);
      setShareStatus("Resultado copiado");
    } catch {
      setShareStatus("");
      setError("Não foi possível copiar o resultado.");
    }
  }

  function selectMode(nextMode: GameMode) {
    setMode(nextMode);
    setError("");
    setShareStatus("");
    setInput("");
    setRevealedAnswer(null);
  }

  async function selectSuggestion(entity: PublicEntity) {
    setInput(entity.name);
    setError("");
    await submitEntity(entity);
  }

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("biblicooo-theme", nextTheme);
  }

  const winRate =
    dailyStats.played === 0
      ? 0
      : Math.round((dailyStats.solved / dailyStats.played) * 100);
  const maxDistribution = Math.max(...dailyStats.distribution, 1);

  return (
    <main className="shell">
      <header className="topbar">
        <h1 className="brand">
          <span className="book-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="brand-name">
            Biblicooo<span>.com</span>
          </span>
        </h1>
        <div className="header-actions" aria-label="Ações">
          <button
            className="icon-button"
            type="button"
            aria-label="Ajuda"
            title="Ajuda"
            onClick={() => setActiveModal("help")}
          >
            ?
          </button>
          <button
            className="icon-button chart-icon"
            type="button"
            aria-label="Estatísticas"
            title="Estatísticas"
            onClick={() => setActiveModal("stats")}
          >
            <span />
            <span />
            <span />
          </button>
          <button
            className="icon-button theme-button"
            type="button"
            aria-label={
              theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"
            }
            title={theme === "light" ? "Modo escuro" : "Modo claro"}
            onClick={toggleTheme}
          >
            <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
          </button>
        </div>
      </header>

      <div className="ornament" aria-hidden="true">
        <span />
        <b>✦</b>
        <span />
      </div>

      <section className="game-board">
        <div className="mode-tabs" aria-label="Modo de jogo">
          <button
            className={`mode-tab ${mode === "daily" ? "active" : ""}`}
            type="button"
            aria-pressed={mode === "daily"}
            onClick={() => selectMode("daily")}
          >
            Palavra do dia
          </button>
          <button
            className={`mode-tab ${mode === "practice" ? "active" : ""}`}
            type="button"
            aria-pressed={mode === "practice"}
            onClick={() => selectMode("practice")}
          >
            Prática
          </button>
        </div>

        <div className="round-meta">
          <span>
            {isPractice
              ? "Modo prática - sem limite de partidas"
              : "Uma nova palavra a cada dia"}
          </span>
          <strong>
            {attempts.length} {attempts.length === 1 ? "tentativa" : "tentativas"}
          </strong>
        </div>

        {gameOver ? (
          <section className={solved ? "result-card win" : "result-card"}>
            <span>Resposta correta</span>
            <h2>{endGameTitle(solvedAttempt, revealedAnswer)}</h2>
            <p>
              {endGameDescription(solvedAttempt, attempts, revealedAnswer)}
            </p>
            <div className="result-actions">
              <button
                className="share-button"
                type="button"
                onClick={copyShareResult}
              >
                Compartilhar resultado
              </button>
              {isPractice ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={startPracticeRound}
                >
                  Nova prática
                </button>
              ) : null}
            </div>
            {shareStatus ? <p className="share-status">{shareStatus}</p> : null}
          </section>
        ) : null}

        {!gameOver ? (
          <section className="input-panel">
            <form className="guess-form" onSubmit={submitGuess}>
              <div className="input-row">
                <input
                  id="guess"
                  className="guess-input"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="entity-suggestions"
                  aria-expanded={suggestions.length > 0}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    answerType === "character"
                      ? "Digite um personagem bíblico..."
                      : answerType === "place"
                        ? "Digite um lugar bíblico..."
                        : "Digite um nome bíblico..."
                  }
                  disabled={!today || (isPractice && !practiceAnswerId)}
                  autoComplete="off"
                />
                <button
                  className="submit"
                  type="submit"
                  disabled={
                    !today ||
                    isSubmitting ||
                    (isPractice && !practiceAnswerId)
                  }
                >
                  Adivinhar
                </button>
              </div>
              {suggestions.length > 0 ? (
                <div
                  id="entity-suggestions"
                  className="suggestion-chips"
                  aria-label="Sugestões de nomes"
                >
                  {suggestions.map((entity) => (
                    <button
                      className="suggestion-chip"
                      type="button"
                      key={entity.id}
                      disabled={isSubmitting}
                      onClick={() => selectSuggestion(entity)}
                    >
                      {entity.name}
                    </button>
                  ))}
                </div>
              ) : null}
              {error ? <p className="error">{error}</p> : null}
              {isPractice && !practiceAnswerId && !error ? (
                <p className="form-note">Preparando uma partida prática...</p>
              ) : null}
            </form>
          </section>
        ) : null}

        {bestResults ? <SummaryCard results={bestResults} /> : null}

        <section className="attempts" aria-label="Historico de tentativas">
          {attempts.length === 0 ? (
            <div className="empty-state">
              <p>Faça seu primeiro palpite.</p>
            </div>
          ) : (
            [...attempts].reverse().map((attempt, reversedIndex) => {
              const attemptNumber = attempts.length - reversedIndex;

              return (
                <article
                  className="attempt"
                  key={`${attempt.guess.id}-${attemptNumber}`}
                >
                  <div className="attempt-head">
                    <div className="attempt-title">
                      <span className="attempt-number">{attemptNumber}</span>
                      <h2>{attempt.guess.name}</h2>
                    </div>
                  </div>
                  <div className="clues">
                    <div
                      className={`clue ${statusClass(attempt.testament.status)}`}
                    >
                      <span>Testamento</span>
                      <strong title={TESTAMENT_LABELS[attempt.testament.guess]}>
                        {testamentShortLabel(attempt.testament.guess)}
                      </strong>
                    </div>
                    <div className={`clue ${statusClass(attempt.gender.status)}`}>
                      <span>Gênero</span>
                      <strong title={formatGender(attempt.gender.guess)}>
                        {genderShortLabel(attempt.gender.guess)}
                      </strong>
                    </div>
                    <div className={`clue ${statusClass(attempt.era.status)}`}>
                      <span>Era</span>
                      <strong>{eraLabel(attempt)}</strong>
                      {attempt.era.status === "before" ||
                      attempt.era.status === "after" ? (
                        <small className="direction-badge">
                          {relativePositionLabel(attempt.era.status)}
                        </small>
                      ) : null}
                    </div>
                    <div className={`clue ${statusClass(attempt.role.status)}`}>
                      <span>Papel</span>
                      <strong>{formatCharacterRole(attempt.role.guess)}</strong>
                    </div>
                    <div
                      className={`clue ${statusClass(
                        attempt.firstAppearance.status
                      )}`}
                    >
                      <span>Primeira Referência</span>
                      <strong>{firstAppearanceLabel(attempt)}</strong>
                      {attempt.firstAppearance.status === "before" ||
                      attempt.firstAppearance.status === "after" ? (
                        <small className="direction-badge">
                          {relativePositionLabel(
                            attempt.firstAppearance.status
                          )}
                        </small>
                      ) : null}
                    </div>
                    <div
                      className={`clue ${statusClass(attempt.sharedBook.status)}`}
                    >
                      <span>Livro em comum</span>
                      <strong title={attempt.sharedBook.books.join(", ")}>
                        {sharedBookLabel(attempt)}
                      </strong>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </section>

      {activeModal ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setActiveModal(null)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${activeModal}-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id={`${activeModal}-title`}>
                {activeModal === "help" ? "Como jogar" : "Estatísticas"}
              </h2>
            </div>

            {activeModal === "help" ? (
              <div className="modal-body help-content">
                <p className="help-intro">
                  Descubra o personagem ou lugar bíblico. Você pode tentar quantas
                  vezes precisar; cada palpite é comparado com a resposta em seis
                  pistas.
                </p>

                <dl className="help-definitions">
                  <div>
                    <dt>Testamento</dt>
                    <dd>
                      A parte da Bíblia em que a pessoa ou lugar é apresentado:
                      Antigo Testamento (AT) ou Novo Testamento (NT).
                    </dd>
                  </div>
                  <div>
                    <dt>Gênero</dt>
                    <dd>
                      O gênero do personagem. A comparação só se aplica quando
                      palpite e resposta são personagens; lugares mostram N/A.
                    </dd>
                  </div>
                  <div>
                    <dt>Era</dt>
                    <dd>
                      O período histórico da narrativa principal, como Patriarcas,
                      Êxodo, Monarquia, Exílio, Ministério de Jesus ou Igreja
                      primitiva.
                    </dd>
                  </div>
                  <div>
                    <dt>Papel</dt>
                    <dd>
                      A função principal do personagem, como profeta, monarca,
                      apóstolo, sacerdote ou parente. “Parente” é usado somente
                      quando o vínculo familiar é a principal forma de identificar
                      o personagem. Não se aplica a lugares.
                    </dd>
                  </div>
                  <div>
                    <dt>Primeira referência</dt>
                    <dd>
                      O primeiro livro, na ordem dos 66 livros do cânon protestante,
                      em que a pessoa ou lugar é mencionado.
                    </dd>
                  </div>
                  <div>
                    <dt>Livro em comum</dt>
                    <dd>
                      Indica se palpite e resposta são mencionados em pelo menos um
                      mesmo livro, mesmo que suas primeiras referências sejam
                      diferentes.
                    </dd>
                  </div>
                </dl>

                <p className="help-note">
                  <strong>Antes e Depois</strong> sempre indicam onde está a
                  resposta em relação ao palpite. <b>Antes</b> significa que a
                  resposta vem antes; <b>Depois</b>, que ela vem depois.
                </p>
                <div className="legend-row" aria-label="Legenda das cores">
                  <span><i className="legend-square match" />Igual</span>
                  <span><i className="legend-square neutral" />Com direção</span>
                  <span><i className="legend-square miss" />Diferente</span>
                  <span><i className="legend-square not-applicable" />Não se aplica</span>
                </div>
                <p className="help-summary">
                  <strong>Resumo:</strong> reúne a melhor pista obtida até agora em
                  cada categoria.
                </p>
                <button
                  className="modal-action primary"
                  type="button"
                  onClick={() => setActiveModal(null)}
                >
                  Entendi
                </button>
              </div>
            ) : (
              <div className="modal-body stats-content">
                <div className="stats-summary">
                  <div>
                    <strong>{dailyStats.played}</strong>
                    <span>Jogos</span>
                  </div>
                  <div>
                    <strong>{winRate}%</strong>
                    <span>Vitórias</span>
                  </div>
                  <div>
                    <strong>{dailyStats.currentStreak}</strong>
                    <span>Sequência</span>
                  </div>
                  <div>
                    <strong>{dailyStats.bestStreak}</strong>
                    <span>Melhor</span>
                  </div>
                </div>

                <section className="distribution" aria-label="Distribuição de tentativas">
                  <h3>Distribuição de tentativas</h3>
                  {dailyStats.distribution.map((count, index) => (
                    <div className="distribution-row" key={index}>
                      <span>{index === 5 ? "6+" : index + 1}</span>
                      <div className="distribution-track">
                        <i
                          className={count > 0 ? "has-value" : ""}
                          style={{
                            width: `${Math.max((count / maxDistribution) * 100, count ? 8 : 0)}%`
                          }}
                        />
                      </div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </section>

                <div className="stats-note">
                  <span>Tentativas hoje</span>
                  <strong>{dailyAttempts.length}</strong>
                </div>

                <button
                  className="modal-action"
                  type="button"
                  onClick={() => setActiveModal(null)}
                >
                  Fechar
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
