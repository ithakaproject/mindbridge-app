// Shared specialty categories, straight from the therapist matching
// dataset. Every psychologist scores 0–3 per category (0 = not offered,
// 3 = specialty); every patient quiz answer contributes a 0–3 weight
// toward one or more categories, using the same scale so they compare
// directly in the matching algorithm.

export const SPECIALTY_CATEGORIES = [
  { key: 'personal_growth', label: 'Personal Growth' },
  { key: 'depression_anxiety', label: 'Depression & Anxiety' },
  { key: 'family_relationships', label: 'Family & Relationships' },
  { key: 'children_adolescents', label: 'Children & Adolescents' },
  { key: 'work_stress', label: 'Work & Stress' },
  { key: 'addictions', label: 'Addictions' },
  { key: 'older_adults', label: 'Older Adults' },
  { key: 'sexuality', label: 'Sexuality' },
  { key: 'legal_institutional', label: 'Legal / Institutional' },
  { key: 'sport_injury', label: 'Sport & Injury' },
  { key: 'crisis_trauma', label: 'Crisis / Trauma' },
  { key: 'clinical_psychology', label: 'Clinical Psychology' },
  { key: 'organizational_coaching', label: 'Organizational / Coaching' },
  { key: 'mindfulness_body', label: 'Mindfulness / Body Confidence' },
] as const;

export type SpecialtyKey = typeof SPECIALTY_CATEGORIES[number]['key'];

export type SpecialtyScores = Partial<Record<SpecialtyKey, number>>;

export const LANGUAGES = [
  'English', 'Italian', 'Spanish', 'Russian',
  'French', 'German', 'Portuguese', 'Other',
];

export const TIME_OF_DAY_OPTIONS = [
  { id: 'morning', label: 'Mornings', startHour: 6, endHour: 12 },
  { id: 'afternoon', label: 'Afternoons', startHour: 12, endHour: 17 },
  { id: 'evening', label: 'Evenings', startHour: 17, endHour: 21 },
  { id: 'flexible', label: 'Flexible / varies', startHour: 6, endHour: 21 },
] as const;

export type TimeOfDayId = typeof TIME_OF_DAY_OPTIONS[number]['id'];
