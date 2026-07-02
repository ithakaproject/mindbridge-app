import { useState, useEffect } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToggleSwitch } from '@/components/toggle-switch';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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
  mood_score: number | null;
  body_feeling: string | null;
  thoughts: string | null;
  shared_with_psychologist: boolean;
};

type AnswerData = {
  id: string;
  question_text: string;
  answer: string;
};

type PsychName = string;

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [answers, setAnswers] = useState<AnswerData[]>([]);
  const [psychName, setPsychName] = useState<PsychName>('your psychologist');
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function loadEntry() {
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch the entry
      const { data: entryData } = await supabase
        .from('journal_entries')
        .select('id, created_at, mood_label, mood_valence, mood_score, body_feeling, thoughts, shared_with_psychologist')
        .eq('id', id)
        .eq('patient_id', user.id)
        .single();

      if (entryData) {
        setEntry(entryData as EntryData);
        setShared(entryData.shared_with_psychologist ?? false);
      }

      // Fetch answers
      const { data: answerData } = await supabase
        .from('journal_entry_answers')
        .select('id, question_text, answer')
        .eq('entry_id', id);
      setAnswers((answerData as AnswerData[]) ?? []);

      // Fetch psychologist name
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('psychologist_id')
        .eq('id', user.id)
        .single();

      if (patientProfile?.psychologist_id) {
        const { data: psychProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', patientProfile.psychologist_id)
          .single();
        if (psychProfile?.full_name) {
          setPsychName(`Dr. ${psychProfile.full_name.split(' ').slice(-1)[0]}`);
        }
      }

      setLoading(false);
    }

    loadEntry();
  }, [id]);

  async function handleToggleShare(value: boolean) {
    if (!entry || toggling) return;
    setToggling(true);
    setShared(value);

    await supabase
      .from('journal_entries')
      .update({ shared_with_psychologist: value })
      .eq('id', entry.id);

    setToggling(false);
  }

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
          <ThemedText>Entry not found.</ThemedText>
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
        <ThemedText style={styles.headerTitle}>Journal Entry</ThemedText>
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

        <View style={styles.shareCard}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.shareTitle}>Share with {psychName}</ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.shareSub}>
              {shared
                ? 'Your psychologist can view this entry'
                : 'Tap to grant view access to this entry'}
            </ThemedText>
          </View>
          <ToggleSwitch value={shared} onValueChange={handleToggleShare} size="small" />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
    fontSize: 15, fontWeight: '700', letterSpacing: -0.2,
    color: colors.text, flex: 1, textAlign: 'center',
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: 14,
    paddingBottom: 24,
  },
  date: { marginBottom: 7, fontWeight: '500' },
  emoji: { fontSize: 30, marginBottom: 8 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.teal}24`,
    borderRadius: 8, paddingVertical: 3, paddingHorizontal: 11,
    marginBottom: 10,
  },
  tagText: { fontSize: 11.5, fontWeight: '600', color: colors.teal },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14,
  },
  body: {
    fontSize: 14, color: colors.text,
    lineHeight: 25, fontStyle: 'italic', marginBottom: 20,
  },
  reflectionLabel: {
    fontSize: 10.5, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 10,
  },
  answerBlock: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 0.5, borderColor: colors.border,
  },
  answerQ: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  answerA: { fontSize: 13, color: colors.text, lineHeight: 20 },
  shareCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: colors.border,
    marginTop: 8,
  },
  shareTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  shareSub: { marginTop: 2 },
});
