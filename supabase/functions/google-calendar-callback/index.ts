import { serve } from "https://deno.land/std/http/server.ts";

serve(async (request) => {
  try {
    const requestUrl = new URL(request.url);

    const error = requestUrl.searchParams.get("error");
    if (error) {
      return new Response(`Google authorization failed: ${error}`, {
        status: 400,
      });
    }

    const code = requestUrl.searchParams.get("code");

    if (!code) {
      return new Response("Missing authorization code.", {
        status: 400,
      });
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("GOOGLE_OAUTH_REDIRECT_URI");

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response("Google OAuth configuration is incomplete.", {
        status: 500,
      });
    }

    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google token exchange failed:", tokenData);

      return new Response(
        JSON.stringify({
          error: "Token exchange failed",
          details: tokenData,
        }),
        {
          status: tokenResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    /*
     * TEMPORARY SETUP ONLY:
     * Display the refresh token once so it can be copied into
     * Supabase Edge Function secrets.
     *
     * Do not leave this endpoint publicly exposing tokens.
     */
    return new Response(
      JSON.stringify(
        {
          message: "Google Calendar authorization succeeded.",
          refresh_token: tokenData.refresh_token ?? null,
          access_token_received: Boolean(tokenData.access_token),
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
        },
        null,
        2,
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(error);

    return new Response("Unexpected OAuth callback error.", {
      status: 500,
    });
  }
});
