import { ReframeApp } from "../components/ReframeApp";
import { chatGPTSignOutPath, requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");
  return (
    <ReframeApp
      user={{
        displayName: user.displayName,
        email: user.email,
        authMethod: user.authMethod,
      }}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
