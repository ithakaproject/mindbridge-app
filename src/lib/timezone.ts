// Timezone conversion helpers. React Native's Hermes engine (as used by
// Expo) ships with full ICU data, so the Intl.DateTimeFormat APIs below
// behave the same as they would in a browser.

export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/New_York';
  }
}

// Returns how many minutes `timeZone` is ahead of UTC at the instant `date`
// represents. This correctly accounts for Daylight Saving Time because it
// looks at the actual date, not just a fixed offset.
function getTimezoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  // Some environments format midnight as "24" instead of "00" — normalize it.
  const hour = map.hour === '24' ? '0' : map.hour;
  const asUTC = Date.UTC(
    parseInt(map.year, 10),
    parseInt(map.month, 10) - 1,
    parseInt(map.day, 10),
    parseInt(hour, 10),
    parseInt(map.minute, 10),
    parseInt(map.second, 10)
  );
  return (asUTC - date.getTime()) / 60000;
}

// Converts a wall-clock date/time meant to represent a specific moment IN
// `timeZone` (e.g. "9:00 AM in America/New_York") into the actual UTC
// instant it corresponds to. Correctly accounts for DST transitions.
export function zonedTimeToUtc(
  year: number,
  month: number, // 0-indexed, matches JS Date convention
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const guess = Date.UTC(year, month, day, hour, minute, 0);
  const offset1 = getTimezoneOffsetMinutes(new Date(guess), timeZone);
  const utcMillis1 = guess - offset1 * 60000;
  // Re-check the offset at the corrected instant, in case the first guess
  // landed on the wrong side of a DST transition.
  const offset2 = getTimezoneOffsetMinutes(new Date(utcMillis1), timeZone);
  if (offset2 === offset1) {
    return new Date(utcMillis1);
  }
  return new Date(guess - offset2 * 60000);
}

export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Phoenix', label: 'Mountain Time, no DST (Phoenix)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (São Paulo)' },
  { value: 'Europe/London', label: 'UK Time (London)' },
  { value: 'Europe/Paris', label: 'Central European Time (Paris)' },
  { value: 'Europe/Athens', label: 'Eastern European Time (Athens)' },
  { value: 'Asia/Dubai', label: 'Gulf Time (Dubai)' },
  { value: 'Asia/Kolkata', label: 'India Time (Kolkata)' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (Bangkok)' },
  { value: 'Asia/Shanghai', label: 'China Time (Shanghai)' },
  { value: 'Asia/Tokyo', label: 'Japan Time (Tokyo)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (Auckland)' },
];
