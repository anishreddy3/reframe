import { getChatGPTUser, type ChatGPTUser } from "../app/chatgpt-auth";
import { ownerIdFromEmail } from "./owner-id";

export type AuthenticatedOwner = {
  ownerId: string;
  user: ChatGPTUser;
};

export async function getAuthenticatedOwner(): Promise<AuthenticatedOwner | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  return { ownerId: await ownerIdFromEmail(user.email), user };
}

export function authenticationRequiredResponse(): Response {
  return Response.json(
    { error: "Your session has ended. Sign in with ChatGPT to continue." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}
