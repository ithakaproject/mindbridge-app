export type RiskFlag = 'progress' | 'watch' | 'urgent';

export type JournalEntry = {
  emoji: string;
  date: string;
  tag: string;
  preview: string;
  body: string;
};

export type Assignment = {
  title: string;
  sub: string;
  done: boolean;
  icon: 'clipboard' | 'brain' | 'forms' | 'video';
};

export type ChatMessage =
  | { f: 'them' | 'me'; t: string }
  | { f: 'assign'; title: string; sub: string; done: boolean };

export type Patient = {
  id: string;
  initials: string;
  color: string;
  name: string;
  since: string;
  spec: string;
  online: boolean;
  preview: string;
  time: string;
  unread: number;
  nextSess: string;
  sessTag: string;
  flag: RiskFlag;
  notes: string;
  journalAccess: boolean;
  journalPeriod?: string;
  mood: number[];
  journal: JournalEntry[];
  assignments: Assignment[];
  msgs: ChatMessage[];
};

export const FLAGS: Record<RiskFlag, { label: string; color: 'green' | 'amber' | 'rose' }> = {
  progress: { label: 'Progress', color: 'green' },
  watch: { label: 'Monitor', color: 'amber' },
  urgent: { label: 'Urgent', color: 'rose' },
};

// TODO (Supabase): replace this hardcoded object with a real `patients` table
// query, scoped to the logged-in psychologist's own roster.
export const PATIENTS: Record<string, Patient> = {
  aj: {
    id: 'aj',
    initials: 'AJ',
    color: '#258F80',
    name: 'Alex Johnson',
    since: 'Since March 2025',
    spec: 'Anxiety · CBT · Mindfulness',
    online: true,
    preview: "Looking forward to it! I've been working on the thought records.",
    time: '11:32 AM',
    unread: 0,
    nextSess: 'Today · 3:00 PM',
    sessTag: 'Now',
    flag: 'watch',
    notes:
      'Good progress on CBT techniques. Follow up on sleep hygiene. Assigned thought record this week.',
    journalAccess: true,
    journalPeriod: 'Last 30 days',
    mood: [3, 5, 4, 6, 5, 7, 6, 8],
    journal: [
      {
        emoji: '😌',
        date: '2025.08.25',
        tag: 'Calm',
        preview: 'Today felt lighter than usual…',
        body: 'Today felt lighter than usual. I completed the CBT thought record Dr. Patel asked for, and I noticed the cognitive distortions she pointed out.\n\nEvening walk helped too. No racing thoughts before bed for the first time this week.',
      },
      {
        emoji: '😎',
        date: '2025.08.18',
        tag: 'Confident',
        preview: 'Presented at work and it went really well…',
        body: 'Presented at work and it went really well. The breathing exercises definitely helped me stay grounded.',
      },
      {
        emoji: '😊',
        date: '2025.08.17',
        tag: 'Hopeful',
        preview: 'Had a long talk with my sister…',
        body: 'Had a long talk with my sister and felt genuinely connected for the first time in months.',
      },
      {
        emoji: '😔',
        date: '2025.08.10',
        tag: 'Anxious',
        preview: "Rough morning. Woke up with that dread feeling again…",
        body: "Rough morning. Woke up with that dread feeling again. Tried the grounding exercise but couldn't focus.",
      },
    ],
    assignments: [
      { title: 'CBT Thought Record', sub: 'Due today', done: false, icon: 'clipboard' },
      { title: 'Evening Mindfulness', sub: 'Daily · 10 min', done: true, icon: 'brain' },
      { title: 'Week 3 Reflection', sub: 'Due May 30', done: false, icon: 'forms' },
    ],
    msgs: [
      { f: 'them', t: 'Good morning! How are you feeling ahead of our session today?' },
      { f: 'them', t: "See you at 3pm! Let's continue where we left off. 😊" },
      { f: 'me', t: "Looking forward to it! I've been working on the thought records." },
      { f: 'assign', title: 'CBT Thought Record', sub: 'Assigned · Due today', done: false },
    ],
  },
  mc: {
    id: 'mc',
    initials: 'MC',
    color: '#C8943A',
    name: 'Maya Chen',
    since: 'Since Jan 2025',
    spec: 'Depression · Mindfulness',
    online: true,
    preview: "Thanks for the video, I'll watch it tonight",
    time: '10:14 AM',
    unread: 2,
    nextSess: 'Today · 5:00 PM',
    sessTag: 'Later',
    flag: 'progress',
    notes:
      'Mood improving. Continue sleep journal. Consider introducing behavioural activation.',
    journalAccess: false,
    mood: [4, 3, 5, 4, 6, 5, 4, 6],
    journal: [],
    assignments: [
      { title: 'Psychoeducation Video', sub: 'CBT Basics · 8 min', done: true, icon: 'video' },
      { title: 'Sleep Journal', sub: 'Due tomorrow', done: false, icon: 'forms' },
    ],
    msgs: [
      { f: 'me', t: 'Hi Maya, how are the breathing exercises going?' },
      { f: 'them', t: 'They really help! Especially at night.' },
      {
        f: 'assign',
        title: 'Psychoeducation Video',
        sub: 'Assigned · CBT Basics 8 min',
        done: true,
      },
      { f: 'them', t: "Thanks for the video, I'll watch it tonight 🙏" },
    ],
  },
  dr: {
    id: 'dr',
    initials: 'DR',
    color: '#52C48A',
    name: 'Daniel Rivera',
    since: 'Since Apr 2025',
    spec: 'Anxiety · Trauma',
    online: false,
    preview: 'I completed the survey, felt anxious but manageable.',
    time: 'Yesterday',
    unread: 1,
    nextSess: 'Tomorrow · 9:00 AM',
    sessTag: 'Tmrw',
    flag: 'urgent',
    notes: 'High anxiety scores this week. Monitor closely. Discuss trauma processing next session.',
    journalAccess: false,
    mood: [5, 4, 4, 3, 5, 4, 5, 4],
    journal: [],
    assignments: [{ title: 'Weekly Mood Survey', sub: 'Completed yesterday', done: true, icon: 'forms' }],
    msgs: [
      { f: 'assign', title: 'Weekly Mood Survey', sub: 'Assigned · 5 questions', done: true },
      { f: 'them', t: 'I completed the survey, felt a bit anxious this week but manageable.' },
    ],
  },
  pn: {
    id: 'pn',
    initials: 'PN',
    color: '#A07ED4',
    name: 'Priya Nair',
    since: 'Since Feb 2025',
    spec: 'Relationships · Grief',
    online: false,
    preview: 'See you tomorrow morning! 🌸',
    time: 'Mon',
    unread: 0,
    nextSess: 'Tomorrow · 11:30 AM',
    sessTag: 'Tmrw',
    flag: 'progress',
    notes: 'Excellent engagement. Opening up more about grief. Encourage journaling.',
    journalAccess: false,
    mood: [6, 5, 7, 6, 5, 6, 7, 7],
    journal: [],
    assignments: [],
    msgs: [
      { f: 'them', t: "Dr. Patel, I've been keeping the journal like you suggested." },
      { f: 'me', t: "That's wonderful, Priya. We'll discuss your entries tomorrow." },
      { f: 'them', t: 'See you tomorrow morning! 🌸' },
    ],
  },
};

export const PATIENT_ORDER = ['aj', 'mc', 'dr', 'pn'];
