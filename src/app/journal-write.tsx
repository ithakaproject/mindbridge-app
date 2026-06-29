import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { OptionGrid } from '@/components/option-grid';
import { SuccessModal } from '@/components/success-modal';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { POSITIVE_MOODS, NEGATIVE_MOODS, BODY_FEELINGS, REFLECTION_QUESTIONS } from '@/data/journal-options';
import { PATIENTS } from '@/data/patients';

const colors = Colors.dark;

// TODO (Supabase + auth): look up the logged-in patient instead of hardcoding "aj"
const CURRENT_PATIENT = PATIENTS.aj;

export default function JournalWriteScreen() {
  const [valenceTab, setValenceTab] = useState<'positive' | 'negative'>('positive');
  const [mood, setMood] = useState<string | null>(null);
  const [bodyFeeling, setBodyFeeling] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [successOpen, setSuccessOpen] = useState(false);

  const canSave = !!mood && !!bodyFeeling && thoughts.trim().length > 0;

  // TODO (Supabase): persist the full entry (mood, valence, body feeling, thoughts,
  // and any answered reflection questions) instead of just showing a success message
  const handleSave = () => {
    if (!canSave) return;
    setSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    router.back();
  };

  const assignedStandard = REFLECTION_QUESTIONS.filter((q) =>
    CURRENT_PATIENT.assignedJournalQuestions.includes(q.key),
  );
  const hasAnyReflection = assignedStandard.length > 0 || CURRENT_PATIENT.customJournalQuestions.length > 0;
  let qNum = 4;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>New Entry</ThemedText>
        <Pressable onPress={handleSave} disabled={!canSave} style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}>
          <ThemedText style={styles.saveBtnText}>Save</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Q1: mood */}
        <ThemedText style={styles.qLabel}>1. WHAT IS YOUR MOOD TODAY?</ThemedText>
        <View style={styles.valenceTabs}>
          <Pressable
            onPress={() => setValenceTab('positive')}
            style={[styles.valenceTab, valenceTab === 'positive' && styles.valenceTabOnPositive]}>
            <ThemedText style={[styles.valenceTabText, valenceTab === 'positive' && styles.valenceTabTextOn]}>
              Positive
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setValenceTab('negative')}
            style={[styles.valenceTab, valenceTab === 'negative' && styles.valenceTabOnNegative]}>
            <ThemedText style={[styles.valenceTabText, valenceTab === 'negative' && styles.valenceTabTextOn]}>
              Negative
            </ThemedText>
          </Pressable>
        </View>
        <OptionGrid
          options={valenceTab === 'positive' ? POSITIVE_MOODS : NEGATIVE_MOODS}
          selected={mood}
          onSelect={setMood}
          accentColor={valenceTab === 'positive' ? colors.green : colors.rose}
        />

        {/* Q2: body feeling */}
        <ThemedText style={[styles.qLabel, { marginTop: 20 }]}>2. HOW IS YOUR BODY FEELING?</ThemedText>
        <OptionGrid options={BODY_FEELINGS} selected={bodyFeeling} onSelect={setBodyFeeling} accentColor={colors.teal} />

        {/* Q3: thoughts */}
        <ThemedText style={[styles.qLabel, { marginTop: 20 }]}>3. WRITE DOWN YOUR THOUGHTS</ThemedText>
        <TextInput
          value={thoughts}
          onChangeText={setThoughts}
          placeholder="Write freely — this is your space…"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={5}
          style={styles.textarea}
        />

        {/* Q4+: optional reflection questions, filtered to what this patient's psychologist assigned */}
        {!hasAnyReflection ? (
          <>
            <ThemedText style={[styles.qLabel, { marginTop: 20 }]}>
              THERAPEUTIC QUESTIONS FROM YOUR PSYCHOLOGIST
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary">
              Dr. Patel hasn't assigned any reflection questions yet.
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={[styles.qLabel, { marginTop: 20 }]}>
              THERAPEUTIC QUESTIONS FROM YOUR PSYCHOLOGIST (OPTIONAL)
            </ThemedText>
            {assignedStandard.map((q) => {
              const num = qNum++;
              return (
                <View key={q.key} style={styles.reflectionBlock}>
                  <ThemedText style={styles.reflectionQ}>
                    {num}. {q.question}
                  </ThemedText>
                  <TextInput
                    value={answers[q.key] ?? ''}
                    onChangeText={(text) => setAnswers((prev) => ({ ...prev, [q.key]: text }))}
                    placeholder={`Example: ${q.example}`}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    style={styles.reflectionInput}
                  />
                </View>
              );
            })}
            {CURRENT_PATIENT.customJournalQuestions.map((q) => {
              const num = qNum++;
              return (
                <View key={q.id} style={styles.reflectionBlock}>
                  <ThemedText style={styles.reflectionQ}>
                    {num}. {q.question}
                  </ThemedText>
                  <TextInput
                    value={answers[q.id] ?? ''}
                    onChangeText={(text) => setAnswers((prev) => ({ ...prev, [q.id]: text }))}
                    placeholder="Your answer…"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    style={styles.reflectionInput}
                  />
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        onClose={handleSuccessClose}
        icon="📖"
        title="Entry saved!"
        subtitle="Your journal entry has been saved privately."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: 13,
    paddingBottom: 10,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: colors.tealDim,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: 14,
    paddingBottom: 30,
  },
  qLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  valenceTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  valenceTab: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.backgroundElement,
  },
  valenceTabOnPositive: {
    backgroundColor: colors.green,
  },
  valenceTabOnNegative: {
    backgroundColor: colors.rose,
  },
  valenceTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  valenceTabTextOn: {
    color: '#fff',
    fontWeight: '700',
  },
  textarea: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 13,
    fontSize: 13.5,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  reflectionBlock: {
    marginBottom: 14,
  },
  reflectionQ: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  reflectionInput: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 12.5,
    color: colors.textSecondary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
});
