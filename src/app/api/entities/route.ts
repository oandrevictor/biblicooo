import { getPublicEntities } from "@/lib/game/entities";

export function GET() {
  return Response.json({ entities: getPublicEntities() });
}
