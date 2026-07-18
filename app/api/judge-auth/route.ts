import { createJudgeSessionCookie, clearJudgeSessionCookie, validJudgeCredentials } from "../../../lib/judge-auth";
import { cleanText } from "../../../lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const username = cleanText(body.username, 100);
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!(await validJudgeCredentials(username, password))) {
    return Response.json(
      { error: "The evaluator username or password is incorrect." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(
    { authenticated: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": await createJudgeSessionCookie(),
      },
    },
  );
}

export async function DELETE() {
  return Response.json(
    { authenticated: false },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": clearJudgeSessionCookie(),
      },
    },
  );
}
