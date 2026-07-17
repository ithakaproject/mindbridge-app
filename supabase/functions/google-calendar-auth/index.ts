import { serve } from "https://deno.land/std/http/server.ts";

serve(async () => {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const redirectUri = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI");

  if (!clientId || !redirectUri) {
    return new Response("Google OAuth configuration is missing.", {
      status: 500,
    });
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    302,
  );
});
