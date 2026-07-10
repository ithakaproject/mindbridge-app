import { createClient } from "npm:@supabase/supabase-js@2";
import { google } from "npm:googleapis@144";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: 'session_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: sessionRow, error: fetchError } = await adminClient
      .from('sessions')
      .select('id, patient_id, psychologist_id, start_time, duration_minutes, meet_link, google_event_id')
      .eq('id', session_id)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: `Session lookup failed: ${fetchError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!sessionRow) {
      return new Response(JSON.stringify({ error: `No session found with id ${session_id}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (user.id !== sessionRow.patient_id && user.id !== sessionRow.psychologist_id) {
      return new Response(JSON.stringify({ error: 'Not authorized for this session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
    if (!serviceAccountJson || !calendarId) {
      return new Response(JSON.stringify({ error: 'Google Calendar credentials are not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const credentials = JSON.parse(serviceAccountJson);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const startTime = new Date(sessionRow.start_time);
    const endTime = new Date(startTime.getTime() + sessionRow.duration_minutes * 60000);

    let meetLink: string | null | undefined;
    let googleEventId: string | null | undefined;

    if (sessionRow.google_event_id) {
      // A Google Calendar event already exists for this session (from an
      // earlier booking) — this call is a reschedule, so just move the
      // existing event to its new time instead of creating a duplicate.
      // This keeps the same Meet link valid across reschedules.
      try {
        const updated = await calendar.events.patch({
          calendarId,
          eventId: sessionRow.google_event_id,
          requestBody: {
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
          },
        });
        meetLink = updated.data.hangoutLink ?? sessionRow.meet_link;
        googleEventId = sessionRow.google_event_id;
      } catch (patchErr) {
        // The old event may have been deleted manually on Google's side —
        // fall back to creating a fresh event rather than failing outright.
        console.warn('Failed to patch existing event, creating a new one instead:', patchErr);
      }
    }

    if (!googleEventId) {
      const event = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: 1,
        requestBody: {
          summary: 'MindBridge Session',
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
          conferenceData: {
            createRequest: {
              requestId: `mindbridge-${sessionRow.id}-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
      });
      meetLink = event.data.hangoutLink;
      googleEventId = event.data.id;
    }

    if (!meetLink || !googleEventId) {
      return new Response(JSON.stringify({ error: 'Google Calendar did not return a Meet link' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateError } = await adminClient
      .from('sessions')
      .update({ meet_link: meetLink, google_event_id: googleEventId })
      .eq('id', session_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: `Failed to save meet link: ${updateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ meet_link: meetLink }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
