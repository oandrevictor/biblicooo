import { createPracticeStartResponse } from "@/lib/game/api";

export function POST() {
  return Response.json(createPracticeStartResponse());
}
