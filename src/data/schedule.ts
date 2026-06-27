export type AvailableSlot = { time: string };

function dateKey(year: number, month: number, day: number) {
  return `${year}-${month + 1}-${day}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const today = new Date();
const k = (offsetDays: number) => {
  const d = addDays(today, offsetDays);
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
};

// TODO (Supabase): replace with the psychologist's real booked sessions for this patient
export const INITIAL_BOOKED_DATES = new Set<string>([k(1), k(4), k(9)]);

// TODO (Supabase): replace with the psychologist's real open availability
export const AVAILABILITY: Record<string, AvailableSlot[]> = {
  [k(3)]: [{ time: '9:00 AM' }, { time: '11:30 AM' }, { time: '4:30 PM' }],
  [k(4)]: [{ time: '10:00 AM' }, { time: '3:00 PM' }],
  [k(10)]: [{ time: '10:00 AM' }, { time: '2:00 PM' }],
  [k(12)]: [{ time: '9:00 AM' }],
  [k(17)]: [{ time: '11:00 AM' }, { time: '3:00 PM' }],
  [k(24)]: [{ time: '9:30 AM' }, { time: '4:00 PM' }],
};
