export type SessionEntry = { time: string; patientId: string; duration: string };

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const today = new Date();

// TODO (Supabase): replace with a real `sessions` table query, scoped to the
// logged-in psychologist, joined against the patients table. Dates here are
// generated relative to "today" so the calendar always has something to show
// while testing, instead of being pinned to fixed mockup dates.
export const SESSIONS_BY_DATE: Record<string, SessionEntry[]> = {
  [dateKey(today)]: [
    { time: '3:00 PM', patientId: 'aj', duration: '50 min' },
    { time: '5:00 PM', patientId: 'mc', duration: '50 min' },
  ],
  [dateKey(addDays(today, 1))]: [
    { time: '9:00 AM', patientId: 'dr', duration: '50 min' },
    { time: '11:30 AM', patientId: 'pn', duration: '50 min' },
  ],
  [dateKey(addDays(today, 3))]: [{ time: '10:00 AM', patientId: 'aj', duration: '50 min' }],
  [dateKey(addDays(today, 4))]: [
    { time: '2:00 PM', patientId: 'mc', duration: '50 min' },
    { time: '4:00 PM', patientId: 'dr', duration: '50 min' },
  ],
};
