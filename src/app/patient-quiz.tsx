import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';
import { LANGUAGES, TIME_OF_DAY_OPTIONS, type SpecialtyScores } from '@/data/specialties';

const colors = Colors.dark;

type ChoiceOption = { id: string; label: string; weights?: SpecialtyScores };

type Question =
  | { id: string; type: 'language'; text: string }
  | { id: string; type: 'timeOfDay'; text: string }
  | { id: string; type: 'choice'; text: string; multi?: boolean; options: ChoiceOption[] }
  | { id: string; type: 'text'; text: string; placeholder: string };

const QUESTIONS: Question[] = [
  {
    id: 'languages',
    type: 'language',
    text: 'What language(s) are you comfortable speaking in session?',
  },
  {
    id: 'timeOfDay',
    type: 'timeOfDay',
    text: 'What time of day generally works best for you?',
  },
  {
    id: 'reason',
    type: 'choice',
    text: "What's mainly bringing you to therapy right now?",
    options: [
      { id: 'anxiety', label: 'Ongoing anxiety, worry, or low mood', weights: { depression_anxiety: 3 } },
      { id: 'relationship', label: 'A relationship, marriage, or family issue', weights: { family_relationships: 3 } },
      { id: 'work', label: 'Stress from work or life balance', weights: { work_stress: 3 } },
      { id: 'crisis', label: 'A specific crisis or difficult event', weights: { crisis_trauma: 3 } },
    ],
  },
  {
    id: 'child',
    type: 'choice',
    text: 'Is this mainly about supporting a child or teenager?',
    options: [
      { id: 'yes', label: 'Yes, for my child or teen', weights: { children_adolescents: 3 } },
      { id: 'no', label: 'No, this is about me', weights: {} },
    ],
  },
  {
    id: 'addiction',
    type: 'choice',
    text: 'Do substance use or addictive behaviors play a role?',
    options: [
      { id: 'yes', label: 'Yes, significantly', weights: { addictions: 3 } },
      { id: 'some', label: 'A little', weights: { addictions: 1 } },
      { id: 'no', label: 'Not really', weights: {} },
    ],
  },
  {
    id: 'growth',
    type: 'choice',
    text: "Are you looking mainly for personal growth or self-understanding, rather than a specific issue?",
    options: [
      { id: 'yes', label: 'Yes, mainly personal growth', weights: { personal_growth: 3 } },
      { id: 'some', label: 'Somewhat', weights: { personal_growth: 1 } },
      { id: 'no', label: 'No, I have something specific in mind', weights: {} },
    ],
  },
  {
    id: 'other_concerns',
    type: 'choice',
    text: 'Does anything else here apply to you?',
    options: [
      { id: 'older', label: "I'm navigating an older-adult life transition", weights: { older_adults: 3 } },
      { id: 'sexuality', label: 'Questions around sexuality or intimacy', weights: { sexuality: 3 } },
      { id: 'legal', label: 'Legal, workplace, or institutional matters', weights: { legal_institutional: 3 } },
      { id: 'sport', label: 'A sports injury or performance concern', weights: { sport_injury: 3 } },
      { id: 'none', label: 'None of these', weights: {} },
    ],
  },
  {
    id: 'modality',
    type: 'choice',
    text: 'What kind of approach sounds most helpful to you?',
    options: [
      { id: 'structured', label: 'Structured, evidence-based tools (e.g. CBT-style)', weights: { clinical_psychology: 3 } },
      { id: 'mindfulness', label: 'Mindfulness or body-centered', weights: { mindfulness_body: 3 } },
      { id: 'coaching', label: 'Coaching, goal-oriented', weights: { organizational_coaching: 3 } },
      { id: 'unsure', label: 'Not sure — open to whatever fits', weights: {} },
    ],
  },
  {
    id: 'notes',
    type: 'text',
    text: 'Anything else that would help us match you? (optional)',
    placeholder: 'Share whatever feels relevant…',
  },
];

function mergeWeights(base: SpecialtyScores, addition: SpecialtyScores): SpecialtyScores {
  const merged = { ...base };
  for (const key of Object.keys(addition) as (keyof SpecialtyScores)[]) {
    const newVal = addition[key] ?? 0;
    merged[key] = Math.max(merged[key] ?? 0, newVal);
  }
  return merged;
}

export default function PatientQuizScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [languages, setLanguages] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<string | null>(null);
  const [weights, setWeights] = useState<SpecialtyScores>({});
  const [textDraft, setTextDraft] = useState('');

  const question = QUESTIONS[stepIndex];

  function goBack() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    } else {
      router.back();
    }
  }

  function advance() {
    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex((i) => i + 1);
      setTextDraft('');
    } else {
      router.push({
        pathname: '/patient-preferences',
        params: {
          languages: JSON.stringify(languages),
          timeOfDay: timeOfDay ?? 'flexible',
          weights: JSON.stringify(weights),
          notes: textDraft.trim(),
        },
      });
    }
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  function selectTimeOfDay(id: string) {
    setTimeOfDay(id);
    setStepIndex((i) => i + 1);
  }

  function selectChoice(opt: ChoiceOption) {
    if (opt.weights) setWeights((prev) => mergeWeights(prev, opt.weights!));
    advance();
  }

  const progress = (stepIndex + 1) / QUESTIONS.length;
  const canContinueLanguages = languages.length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={goBack}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <ThemedText type="subtitle">{question.text}</ThemedText>

            {question.type === 'language' && (
              <>
                <View style={styles.pillWrap}>
                  {LANGUAGES.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <Pressable
                        key={lang}
                        onPress={() => toggleLanguage(lang)}
                        style={[styles.pill, isSelected && styles.pillSelected]}>
                        <ThemedText type="small" themeColor={isSelected ? undefined : 'textSecondary'} style={isSelected ? styles.pillTextSelected : undefined}>
                          {lang}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  style={[styles.primaryBtn, !canContinueLanguages && styles.disabledBtn]}
                  disabled={!canContinueLanguages}
                  onPress={advance}>
                  <ThemedText type="smallBold" style={styles.primaryBtnText}>Continue</ThemedText>
                </Pressable>
              </>
            )}

            {question.type === 'timeOfDay' && (
              <View style={styles.optionList}>
                {TIME_OF_DAY_OPTIONS.map((opt) => (
                  <Pressable key={opt.id} onPress={() => selectTimeOfDay(opt.id)} style={styles.optionCard}>
                    <ThemedText type="default">{opt.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

            {question.type === 'choice' && (
              <View style={styles.optionList}>
                {question.options.map((opt) => (
                  <Pressable key={opt.id} onPress={() => selectChoice(opt)} style={styles.optionCard}>
                    <ThemedText type="default">{opt.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

            {question.type === 'text' && (
              <View style={styles.textBlock}>
                <View style={styles.inputWrap}>
                  <TextInput
                    placeholder={question.placeholder}
                    placeholderTextColor={colors.textTertiary}
                    value={textDraft}
                    onChangeText={setTextDraft}
                    multiline
                    style={styles.input}
                  />
                </View>
                <Pressable style={styles.primaryBtn} onPress={advance}>
                  <ThemedText type="smallBold" style={styles.primaryBtnText}>
                    {textDraft.trim() === '' ? 'Skip' : 'Continue'}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>
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
    borderRadius: 3,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxFormWidth,
    backgroundColor: colors.backgroundElement,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.teal,
  },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: Spacing.four },
  card: { width: '100%', maxWidth: MaxFormWidth, gap: Spacing.four },
  optionList: { gap: Spacing.two },
  optionCard: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 13,
  },
  pillSelected: {
    borderColor: colors.tealDim,
    backgroundColor: colors.tealDim,
  },
  pillTextSelected: { color: '#fff', fontWeight: '600' },
  textBlock: { gap: Spacing.three },
  inputWrap: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
  },
  input: { fontSize: 13, color: colors.text },
  primaryBtn: {
    backgroundColor: colors.teal,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff' },
  disabledBtn: { opacity: 0.4 },
});
