import { createRevealResponse } from "@/lib/game/api";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON invalido." }, { status: 400 });
  }

  const response = createRevealResponse(
    typeof body === "object" && body !== null ? body : {}
  );

  if (!response.ok) {
    return Response.json(response, { status: 400 });
  }

  return Response.json(response);
}
