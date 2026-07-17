/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { getGoogleAccessToken } from "../_shared/google.ts";

Deno.serve(async () => {
  try {
    const accessToken = await getGoogleAccessToken();
    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID");

    if (!calendarId) {
      throw new Error("GOOGLE_CALENDAR_ID is missing.");
    }

    // Create a test event one hour from now.
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const event = {
      summary: "MindBridge Calendar API Test",
      description: "Test event created through a Supabase Edge Function.",
      start: {
        dateTime: start.toISOString(),
        timeZone: "Europe/Prague",
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "Europe/Prague",
      },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID().replaceAll("-", ""),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${
        encodeURIComponent(calendarId)
      }/events`,
    );

    url.searchParams.set("conferenceDataVersion", "1");

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Calendar event creation failed:", data);

      return new Response(
        JSON.stringify(
          {
            success: false,
            error: "Calendar event creation failed",
            details: data,
          },
          null,
          2,
        ),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const meetUrl =
      data.hangoutLink ??
      data.conferenceData?.entryPoints?.find(
        (entry: { entryPointType?: string; uri?: string }) =>
          entry.entryPointType === "video",
      )?.uri ??
      null;

    return new Response(
      JSON.stringify(
        {
          success: true,
          eventId: data.id,
          calendarUrl: data.htmlLink,
          meetUrl,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Google Calendar test failed:", error);

    return new Response(
      JSON.stringify(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unexpected Google Calendar error",
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
});