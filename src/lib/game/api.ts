import { getDailyAnswer, getGameDate } from "./daily";
import { getEntityById } from "./entities";
import { evaluateGuess } from "./feedback";
import type {
  BiblicalEntity,
  EndGameAnswer,
  GuessRequest,
  GuessResponse,
  RevealRequest,
  RevealResponse
} from "./types";

function createAnswerSummary(answer: BiblicalEntity): EndGameAnswer {
  return {
    id: answer.id,
    name: answer.name,
    type: answer.type,
    role: answer.primaryRole,
    era: answer.era
  };
}

export function createGuessResponse(
  body: Partial<GuessRequest>,
  date = new Date()
): GuessResponse {
  const guessId = body.guessId;

  if (!guessId || typeof guessId !== "string") {
    return { ok: false, error: "Palpite invalido." };
  }

  const guess = getEntityById(guessId);
  if (!guess) {
    return { ok: false, error: "Palpite nao encontrado." };
  }

  const gameDate = getGameDate(date);
  const answer = getDailyAnswer(gameDate);
  const feedback = evaluateGuess(guess, answer);

  return {
    ok: true,
    date: gameDate,
    feedback,
    solved: feedback.correct,
    ...(feedback.correct ? { answer: createAnswerSummary(answer) } : {})
  };
}

export function createRevealResponse(
  body: Partial<RevealRequest>,
  date = new Date()
): RevealResponse {
  const guessIds = body.guessIds;

  if (!Array.isArray(guessIds)) {
    return { ok: false, error: "Tentativas invalidas." };
  }

  const gameDate = getGameDate(date);
  const answer = getDailyAnswer(gameDate);
  const hasSolved = guessIds.includes(answer.id);

  if (!hasSolved) {
    return { ok: false, error: "Resposta disponivel apenas no fim do jogo." };
  }

  return {
    ok: true,
    date: gameDate,
    answer: createAnswerSummary(answer)
  };
}
