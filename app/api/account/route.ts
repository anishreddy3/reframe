import { deleteUserData, getProfile, listCheckins } from "../../../db/repository";
import { authenticationRequiredResponse, getAuthenticatedOwner } from "../../../lib/authenticated-user";
import { serviceError } from "../../../lib/http";
import { checkinForClient, profileForClient } from "../../../lib/public-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const identity = await getAuthenticatedOwner();
    if (!identity) return authenticationRequiredResponse();
    const [profile, checkins] = await Promise.all([
      getProfile(identity.ownerId),
      listCheckins(identity.ownerId, 1000),
    ]);
    const exportData = {
      exportedAt: new Date().toISOString(),
      account: {
        displayName: identity.user.displayName,
        email: identity.user.email,
      },
      profile: profile ? profileForClient(profile) : null,
      checkins: checkins.map(checkinForClient),
    };
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(JSON.stringify(exportData, null, download ? 2 : 0), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        ...(download
          ? { "Content-Disposition": 'attachment; filename="reframe-data.json"' }
          : {}),
      },
    });
  } catch (error) {
    return Response.json({ error: serviceError(error, "Account export") }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const identity = await getAuthenticatedOwner();
    if (!identity) return authenticationRequiredResponse();
    await deleteUserData(identity.ownerId);
    return Response.json(
      { deleted: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json({ error: serviceError(error, "Account deletion") }, { status: 500 });
  }
}
