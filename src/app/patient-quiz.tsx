import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

type ChoiceOption = { id: string; label: string };

type Question =
  | { id: string; type: 'choice'; text: string; options: ChoiceOption[] }
  | { id: string; type: 'text'; text: string; placeholder: string };

const QUESTIONS: Record<string, Question> = {
  q1: {
    id: 'q1',
    type: 'choice',
    text: 'What brings you here today?',
    options: [
      { id: 'anxiety', label: 'Anxiety or constant worry' },
      { id: 'low', label: 'Feeling low, unmotivated, or down' },
      { id: 'relationship', label: 'Relationship or family difficulties' },
      { id: 'other', label: 'Something else' },
    ],
  },
  q1b: {
    id: 'q1b',
    type: 'text',
    text: "Tell us briefly what's going on",
    placeholder: 'Share whatever feels relevant...',
  },
  q2: {
    id: 'q2',
    type: 'choice',
    text: 'How long has this been going on?',
    options: [
      { id: 'building', label: "It's been building for a while" },
      { id: 'recent', label: 'Something recent triggered it' },
      { id: 'comes_goes', label: 'It comes and goes' },
      { id: 'not_sure', label: 'Not sure — I just want someone to talk to' },
    ],
  },
  q3: {
    id: 'q3',
    type: 'choice',
    text: 'What kind of approach sounds most helpful to you?',
    options: [
      { id: 'practical', label: 'Practical strategies and tools' },
      { id: 'talk', label: 'Talking through feelings, digging deeper' },
      { id: 'mindfulness', label: 'Mindfulness, calm, present-focused' },
      { id: 'open', label: 'Not sure — open to whatever works' },
    ],
  },
  q4: {
    id: 'q4',
    type: 'choice',
    text: 'Have you been to therapy before?',
    options: [
      { id: 'helped', label: 'Yes, and it helped' },
      { id: 'didnt_click', label: "Yes, but it didn't really click" },
      { id: 'first_time', label: 'No, this is my first time' },
      { id: 'on_off', label: 'On and off over the years' },
    ],
  },
  q4b: {
    id: 'q4b',
    type: 'choice',
    text: "What didn't feel right about it?",
    options: [
      { id: 'not_heard', label: "Didn't feel heard" },
      { id: 'approach', label: "Approach didn't fit" },
      { id: 'personality', label: 'Personality mismatch' },
      { id: 'other', label: 'Other' },
    ],
  },
  q5: {
    id: 'q5',
    type: 'choice',
    text: 'What matters most to you in a therapist?',
    options: [
      { id: 'warm', label: 'Feels warm and easy to open up to' },
      { id: 'structured', label: 'Direct, structured, goal-oriented' },
      { id: 'specialized', label: "Specializes in exactly what I'm dealing with" },
      { id: 'available', label: 'Just someone with availability soon' },
    ],
  },
  q6: {
    id: 'q6',
    type: 'choice',
    text: 'What time of day works best for sessions?',
    options: [
      { id: 'morning', label: 'Mornings' },
      { id: 'afternoon', label: 'Afternoons' },
      { id: 'evening', label: 'Evenings' },
      { id: 'flexible', label: 'Flexible / varies' },
    ],
  },
  q7: {
    id: 'q7',
    type: 'choice',
    text: "Anything you'd want your psychologist to be especially mindful of?",
    options: [
      { id: 'cultural', label: 'Cultural or religious background' },
      { id: 'lgbtq', label: 'LGBTQ+ identity and experiences' },
      { id: 'life_event', label: 'A specific life event (loss, divorce, career change, etc.)' },
      { id: 'none', label: 'Nothing specific — just general support' },
    ],
  },
  q8: {
    id: 'q8',
    type: 'choice',
    text: 'What age range are you in?',
    options: [
      { id: '18_25', label: '18–25' },
      { id: '26_45', label: '26–45' },
      { id: '46_64', label: '46–64' },
      { id: '65_plus', label: '65+' },
    ],
  },
};

const START_QUESTION = 'q1';

function getNextQuestionId(currentId: string, answers: Record<string, string>): string | null {
  switch (currentId) {
    case 'q1':
      return answers.q1 === 'other' ? 'q1b' : 'q2';
    case 'q1b':
      return 'q2';
    case 'q2':
      return 'q3';
    case 'q3':
      return 'q4';
    case 'q4':
      return answers.q4 === 'didnt_click' ? 'q4b' : 'q5';
    case 'q4b':
      return 'q5';
    case 'q5':
      return 'q6';
    case 'q6':
      return 'q7';
    case 'q7':
      return 'q8';
    case 'q8':
      return null;
    default:
      return null;
  }
}

export default function PatientQuizScreen() {
  const theme = useTheme();
  const [history, setHistory] = useState<string[]>([START_QUESTION]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textDraft, setTextDraft] = useState('');

  const currentId = history[history.length - 1];
  const question = QUESTIONS[currentId];

  function goBack() {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
    } else {
      router.back();
    }
  }

  function advance(updatedAnswers: Record<string, string>) {
    const nextId = getNextQuestionId(currentId, updatedAnswers);
    if (nextId) {
      setHistory((prev) => [...prev, nextId]);
      setTextDraft('');
    } else {
      // TODO: save `updatedAnswers` to Supabase once it's wired up,
      // then eventually run the matching algorithm against psychologist profiles.
      router.push('/patient-preferences');
    }
  }

  function selectOption(optionId: string) {
    const updatedAnswers = { ...answers, [currentId]: optionId };
    setAnswers(updatedAnswers);
    advance(updatedAnswers);
  }

  function submitText() {
    const updatedAnswers = { ...answers, [currentId]: textDraft.trim() };
    setAnswers(updatedAnswers);
    advance(updatedAnswers);
  }

  const progress = Math.min(history.length / 10, 1);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={goBack}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <ThemedView style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <ThemedView style={[styles.progressFill, { backgroundColor: theme.teal, width: `${progress * 100}%` }]} />
        </ThemedView>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">{question.text}</ThemedText>

            {question.type === 'choice' ? (
              <ThemedView style={styles.optionList}>
                {question.options.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => selectOption(opt.id)}
                    style={[styles.optionCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                    <ThemedText type="default">{opt.label}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            ) : (
              <ThemedView style={styles.textBlock}>
                <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                  <TextInput
                    placeholder={question.placeholder}
                    placeholderTextColor={theme.textTertiary}
                    value={textDraft}
                    onChangeText={setTextDraft}
                    multiline
                    style={[styles.input, { color: theme.text }]}
                  />
                </ThemedView>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.teal },
                    textDraft.trim() === '' && styles.disabledBtn,
                  ]}
                  disabled={textDraft.trim() === ''}
                  onPress={submitText}>
                  <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>Continue</ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  progressTrack: {
    height: 6,
    borderRadius: Spacing.one,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxFormWidth,
  },
  progressFill: {
    height: '100%',
    borderRadius: Spacing.one,
  },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: Spacing.four },
  card: { width: '100%', maxWidth: MaxFormWidth, gap: Spacing.four },
  optionList: { gap: Spacing.two },
  optionCard: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  textBlock: { gap: Spacing.three },
  inputWrap: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 100,
  },
  input: { fontSize: 14 },
  primaryBtn: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.4 },
});