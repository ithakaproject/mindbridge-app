import type { SpecialtyScores } from '@/data/specialties';
import { TIME_OF_DAY_OPTIONS, type TimeOfDayId } from '@/data/specialties';

// Rewards a psychologist for being strong exactly where the patient needs
// it, without simply favoring whoever scores high across the board —
// each category only contributes up to what the patient actually weighted it.
export function computeMatchScore(patientWeights: SpecialtyScores, psychScores: SpecialtyScores): number {
  let total = 0;
  for (const key of Object.keys(patientWeights) as (keyof SpecialtyScores)[]) {
    const pWeight = patientWeights[key] ?? 0;
    const sScore = psychScores[key] ?? 0;
    total += Math.min(pWeight, sScore);
  }
  return total;
}

// Fails open (returns true) if either side has no language data recorded,
// so incomplete profiles don't get silently excluded from all matching —
// only an actual language mismatch eliminates a candidate.
export function languagesOverlap(patientLangs: string[], psychLangs: string[]): boolean {
  if (!patientLangs?.length || !psychLangs?.length) return true;
  return patientLangs.some((l) => psychLangs.includes(l));
}

type AvailabilityRow = { day_of_week: number; start_time: string; end_time: string };

// Simplified overlap check: compares local hour-of-day windows directly.
// Like the booking calendar elsewhere in the app, this doesn't adjust for
// timezone-driven day-of-week shifts at the extreme edges (e.g. very late
// evening in one zone becoming early morning the next day in another) —
// a known, documented simplification rather than a silent gap.
export function availabilityOverlaps(timeOfDayId: TimeOfDayId, availability: AvailabilityRow[]): boolean {
  if (!availability?.length) return false;
  const window = TIME_OF_DAY_OPTIONS.find((t) => t.id === timeOfDayId) ?? TIME_OF_DAY_OPTIONS[3];

  return availability.some((a) => {
    const startH = parseInt(a.start_time.split(':')[0], 10);
    const endH = parseInt(a.end_time.split(':')[0], 10);
    return startH < window.endHour && endH > window.startHour;
  });
}

export type PsychCandidate = {
  id: string;
  specialty_scores: SpecialtyScores | null;
  languages: string[] | null;
  availability: AvailabilityRow[];
};

export type RankedMatch = { id: string; score: number };

// Applies both hard filters, then ranks everything that survives.
// Returns best-match-first; take the first 3 for primary + 2 alternates.
export function findTopMatches(
  patientWeights: SpecialtyScores,
  patientLanguages: string[],
  patientTimeOfDay: TimeOfDayId,
  candidates: PsychCandidate[]
): RankedMatch[] {
  const eligible = candidates.filter((c) =>
    languagesOverlap(patientLanguages, c.languages ?? []) &&
    availabilityOverlaps(patientTimeOfDay, c.availability)
  );

  return eligible
    .map((c) => ({ id: c.id, score: computeMatchScore(patientWeights, c.specialty_scores ?? {}) }))
    .sort((a, b) => b.score - a.score);
}
