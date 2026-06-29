export type Valence = 'positive' | 'negative';

export type MoodOption = {
  label: string;
  emoji: string;
  valence: Valence;
  score: number; // 1 (most distressing) – 10 (most positive)
};

// TODO: sanity-check these with your supervisor. Scores are grouped by row,
// matching the intensity tiers already implied by the mockup's layout
// (mildest at top of each list, most intense at the bottom).
export const POSITIVE_MOODS: MoodOption[] = [
  { label: 'Hopeful', emoji: '😌', valence: 'positive', score: 7 },
  { label: 'Happy', emoji: '🙂', valence: 'positive', score: 7 },
  { label: 'Calm', emoji: '😇', valence: 'positive', score: 7 },
  { label: 'Great', emoji: '😀', valence: 'positive', score: 8 },
  { label: 'Joyful', emoji: '🙃', valence: 'positive', score: 8 },
  { label: 'Inspired', emoji: '🤗', valence: 'positive', score: 8 },
  { label: 'Proud', emoji: '🥳', valence: 'positive', score: 8 },
  { label: 'Motivated', emoji: '🏃', valence: 'positive', score: 8 },
  { label: 'Confident', emoji: '😎', valence: 'positive', score: 8 },
  { label: 'Excited', emoji: '😍', valence: 'positive', score: 9 },
  { label: 'Loved', emoji: '💛', valence: 'positive', score: 9 },
  { label: 'Energetic', emoji: '😜', valence: 'positive', score: 9 },
  { label: 'Amazing', emoji: '😍', valence: 'positive', score: 10 },
  { label: 'Ecstatic', emoji: '🤤', valence: 'positive', score: 10 },
  { label: 'Euphoric', emoji: '🥰', valence: 'positive', score: 10 },
];

export const NEGATIVE_MOODS: MoodOption[] = [
  { label: 'Indifferent', emoji: '😐', valence: 'negative', score: 5 },
  { label: 'Melancholic', emoji: '🥺', valence: 'negative', score: 5 },
  { label: 'Worried', emoji: '👀', valence: 'negative', score: 5 },
  { label: 'Nervous', emoji: '😬', valence: 'negative', score: 4 },
  { label: 'Annoyed', emoji: '🙄', valence: 'negative', score: 4 },
  { label: 'Anxious', emoji: '😳', valence: 'negative', score: 4 },
  { label: 'Frustrated', emoji: '😡', valence: 'negative', score: 3 },
  { label: 'Agitated', emoji: '😰', valence: 'negative', score: 3 },
  { label: 'Irritated', emoji: '😤', valence: 'negative', score: 3 },
  { label: 'Pessimistic', emoji: '😢', valence: 'negative', score: 2 },
  { label: 'Furious', emoji: '🤬', valence: 'negative', score: 2 },
  { label: 'Distressed', emoji: '😟', valence: 'negative', score: 2 },
  { label: 'Awful', emoji: '😩', valence: 'negative', score: 1 },
  { label: 'Panicked', emoji: '😱', valence: 'negative', score: 1 },
  { label: 'Desperate', emoji: '😭', valence: 'negative', score: 1 },
];

export const ALL_MOODS = [...POSITIVE_MOODS, ...NEGATIVE_MOODS];

export function findMood(label: string): MoodOption | undefined {
  return ALL_MOODS.find((m) => m.label === label);
}

export const BODY_FEELINGS = [
  { label: 'Achy', emoji: '😣' },
  { label: 'Weak', emoji: '🤕' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Heavy', emoji: '🤢' },
  { label: 'Numb', emoji: '😑' },
  { label: 'Tense', emoji: '🗿' },
  { label: 'Relaxed', emoji: '🧘' },
  { label: 'Comfortable', emoji: '🧸' },
  { label: 'Nourished', emoji: '🦋' },
  { label: 'Energetic', emoji: '🤸' },
  { label: 'Vibrant', emoji: '⭐' },
  { label: 'Powerful', emoji: '🏋️' },
];

export type ReflectionQuestion = { key: string; question: string; example: string };

// TODO (Supabase): this is the *standard* question bank. Which ones are actually
// shown to a given patient is controlled per-patient via the psychologist's
// "Journal questions" toggle (see Patient.assignedJournalQuestions in patients.ts).
export const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  { key: 'want', question: 'What do you want most right now?', example: 'I desire an exotic vacation' },
  { key: 'mind', question: 'What is in your mind now?', example: 'I am thinking about work' },
  {
    key: 'mentalHealth',
    question: 'What are you planning to do for your mental health today?',
    example: "I'll meditate during my lunch break",
  },
  {
    key: 'bodyCare',
    question: 'How will you take care of your body today?',
    example: "I'll have a walk in the park",
  },
  {
    key: 'futureSelf',
    question: 'What will you do today for your future self?',
    example: "I'll study about xyz",
  },
  {
    key: 'grateful',
    question: 'What are you feeling grateful for today?',
    example: 'I am grateful for my friends support',
  },
];
