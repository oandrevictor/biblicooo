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
  const { status, guess } = feedback.firstAppearance;
  if (status === "same_book") {
    return formatBook(guess.book);
  }

  return status === "before"
    ? `${formatBook(guess.book)} ←`
    : `${formatBook(guess.book)} →`;
}

function eraLabel(feedback: GuessFeedback) {
  const label = ERA_LABELS[feedback.era.guess];
  if (feedback.era.status === "match") {
    return label;
  }

  return feedback.era.status === "before" ? `${label} ←` : `${label} →`;
}

function sharedBookLabel(feedback: GuessFeedback) {
  return feedback.sharedBook.books.length === 0 ? "Não" : "Sim";
}

function resultDescription(attempt: GuessFeedback) {
  const type = typeLabel(attempt.guess.type).toLowerCase();
  const role = formatCharacterRole(attempt.role.guess).toLowerCase();
  const era = ERA_LABELS[attempt.era.guess].toLowerCase();

  return `${type}, ${role}, ligado a ${era}.`;
}

function answerDescription(answer: EndGameAnswer) {
  const type = typeLabel(answer.type).toLowerCase();
  const role = formatCharacterRole(answer.role).toLowerCase();
  const era = ERA_LABELS[answer.era].toLowerCase();

  return `${type}, ${role}, ligado a ${era}.`;
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
    return `Resposta: ${revealedAnswer.name}. ${answerDescription(revealedAnswer)}`;
  }

  if (solvedAttempt) {
    return `Resposta: ${solvedAttempt.guess.name}. ${resultDescription(
      solvedAttempt
    )}`;
  }

  const lastAttempt = attempts.at(-1);
  if (!lastAttempt) {
    return "Volte amanhã para uma nova palavra.";
  }

  return `Último palpite: ${lastAttempt.guess.name}. Volte amanhã para uma nova palavra.`;
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
  const [attempts, setAttempts] = useState<StoredAttempt[]>([]);
  const [revealedAnswer, setRevealedAnswer] = useState<EndGameAnswer | null>(
    null
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
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
        setAttempts(parseStoredAttempts(stored));
      }
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
      JSON.stringify(attempts)
    );
  }, [attempts, today]);

  useEffect(() => {
    async function revealAnswer() {
      if (!today || revealedAnswer || attempts.length === 0) {
        return;
      }

      const hasSolved = attempts.some((attempt) => attempt.correct);
      if (!hasSolved) {
        return;
      }

      const response = await fetch("/api/game/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guessIds: attempts.map((attempt) => attempt.guess.id)
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
  }, [attempts, revealedAnswer, today]);

  const guessedIds = useMemo(
    () => new Set(attempts.map((attempt) => attempt.guess.id)),
    [attempts]
  );

  const solved = attempts.some((attempt) => attempt.correct);
  const solvedAttempt = attempts.find((attempt) => attempt.correct);
  const gameOver = solved;

  const selectedEntity = useMemo(() => {
    const normalized = normalizeText(input);
    return entities.find((entity) =>
      [entity.name, ...entity.aliases]
        .map(normalizeText)
        .some((candidate) => candidate === normalized)
    );
  }, [entities, input]);

  async function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setShareStatus("");

    if (!today || solved) {
      return;
    }

    if (!selectedEntity) {
      setError("Escolha um nome da lista.");
      return;
    }

    if (guessedIds.has(selectedEntity.id)) {
      setError("Você já tentou esse nome hoje.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/game/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guessId: selectedEntity.id })
      });
      const payload = (await response.json()) as GuessApiResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      if (payload.answer) {
        setRevealedAnswer(payload.answer);
      }

      setAttempts((current) => [...current, payload.feedback]);
      setInput("");
    } catch {
      setError("Não foi possível enviar o palpite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyShareResult() {
    if (!today) {
      return;
    }

    const shareText = buildShareText(attempts, today.date);

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

  return (
    <main className="shell">
      <header className="topbar">
        <h1 className="brand">
          Biblic<span>.ooo</span>
        </h1>
        <div className="header-actions" aria-label="Ações">
          <button className="icon-button" type="button" aria-label="Ajuda">
            ?
          </button>
          <button
            className="icon-button chart-icon"
            type="button"
            aria-label="Estatísticas"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <section className="game-board">
        <div className="mode-tabs" aria-label="Modo de jogo">
          <button className="mode-tab active" type="button">
            Palavra do dia
          </button>
          <button className="mode-tab" type="button" aria-disabled="true">
            Prática
          </button>
        </div>

        <div className="round-meta">
          <span>Uma nova palavra a cada dia</span>
          <strong>
            {attempts.length} {attempts.length === 1 ? "tentativa" : "tentativas"}
          </strong>
        </div>

        {gameOver ? (
          <section className={solved ? "result-card win" : "result-card"}>
            <span>Fim de jogo</span>
            <h2>{endGameTitle(solvedAttempt, revealedAnswer)}</h2>
            <p>
              {endGameDescription(solvedAttempt, attempts, revealedAnswer)}
            </p>
            <button className="share-button" type="button" onClick={copyShareResult}>
              Compartilhar resultado
            </button>
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
                  list="entity-options"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Digite um nome ou lugar bíblico..."
                  disabled={!today}
                  autoComplete="off"
                />
                <button
                  className="submit"
                  type="submit"
                  disabled={!today || isSubmitting}
                >
                  Adivinhar
                </button>
              </div>
              <datalist id="entity-options">
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.name}>
                    {typeLabel(entity.type)}
                  </option>
                ))}
              </datalist>
              {error ? <p className="error">{error}</p> : null}
            </form>
          </section>
        ) : null}

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
    </main>
  );
}
