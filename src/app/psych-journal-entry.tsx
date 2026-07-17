import { useState, useEffect } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function moodEmoji(valence: string | null): string {
  if (valence === 'positive') return '😊';
  if (valence === 'negative') return '😔';
  return '📝';
}

type EntryData = {
  id: string;
  created_at: string;
  mood_label: string | null;
  mood_valence: string | null;
  body_feeling: string | null;
  thoughts: string | null;
};

type AnswerData = {
  id: string;
  question_text: string;
  answer: string;
};

export default function PsychJournalEntryScreen() {
  const { id, patientName } = useLocalSearchParams<{ id: string; patientName?: string }>();
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntry() {
      if (!id) return;

      // RLS restricts this to entries the patient has shared with this
      // psychologist specifically — no patient_id filter needed here.
      const { data: entryData, error: entryError } = await supabase
        .from('journal_entries')
        .select('id, created_at, mood_label, mood_valence, body_feeling, thoughts')
        .eq('id', id)
        .single();
      if (entryError) console.warn('ENTRY ERROR:', entryError.message);
      setEntry((entryData as EntryData) ?? null);

      const { data: answerData, error: answerError } = await supabase
        .from('journal_entry_answers')
        .select('id, question_text, answer')
        .eq('entry_id', id);
      if (answerError) console.warn('ANSWERS ERROR:', answerError.message);
      setAnswers((answerData as AnswerData[]) ?? []);

      setLoading(false);
    }
    loadEntry();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Journal Entry</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </ThemedView>
    );
  }

  if (!entry) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Journal Entry</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.notFound}>
          <ThemedText>This entry is no longer shared or doesn't exist.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{patientName ?? 'Journal Entry'}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="small" themeColor="textTertiary" style={styles.date}>
          {formatDate(entry.created_at)}
        </ThemedText>

        <ThemedText style={styles.emoji}>{moodEmoji(entry.mood_valence)}</ThemedText>

        {entry.mood_label && (
          <View style={styles.tag}>
            <ThemedText style={styles.tagText}>{entry.mood_label}</ThemedText>
          </View>
        )}

        {entry.body_feeling && (
          <View style={styles.metaRow}>
            <Ionicons name="body-outline" size={14} color={colors.textTertiary} />
            <ThemedText type="small" themeColor="textTertiary">
              Body: {entry.body_feeling}
            </ThemedText>
          </View>
        )}

        {entry.thoughts ? (
          <ThemedText style={styles.body}>{entry.thoughts}</ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textTertiary" style={styles.body}>
            No thoughts recorded.
          </ThemedText>
        )}

        {answers.length > 0 && (
          <>
            <ThemedText style={styles.reflectionLabel}>Reflection answers</ThemedText>
            {answers.map((a) => (
              <View key={a.id} style={styles.answerBlock}>
                <ThemedText style={styles.answerQ}>{a.question_text}</ThemedText>
                <ThemedText style={styles.answerA}>{a.answer}</ThemedText>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingTop: 13, paddingBottom: 10,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 15, fontWeight: '700', letterSpacing: -0.2,
    color: colors.text, flex: 1, textAlign: 'center',
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, paddingTop: 14, paddingBottom: 24,
  },
  date: { marginBottom: 7, fontWeight: '500' },
  emoji: { fontSize: 30, marginBottom: 8 },
  tag: {
    alignSelf: 'flex-start', backgroundColor: `${colors.teal}24`,
    borderRadius: 8, paddingVertical: 3, paddingHorizontal: 11, marginBottom: 10,
  },
  tagText: { fontSize: 11.5, fontWeight: '600', color: colors.teal },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  body: { fontSize: 14, color: colors.text, lineHeight: 25, fontStyle: 'italic', marginBottom: 20 },
  reflectionLabel: {
    fontSize: 10.5, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 10,
  },
  answerBlock: {
    backgroundColor: colors.backgroundElement, borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: colors.border,
  },
  answerQ: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  answerA: { fontSize: 13, color: colors.text, lineHeight: 20 },
});
