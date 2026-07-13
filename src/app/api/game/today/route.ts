import { getTodayPayload } from "@/lib/game/daily";

export function GET() {
  return Response.json(getTodayPayload());
}
