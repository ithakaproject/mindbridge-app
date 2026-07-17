import { useState, useCallback } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

function formatEntryDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function moodEmoji(valence: string | null): string {
  if (valence === 'positive') return '😊';
  if (valence === 'negative') return '😔';
  return '📝';
}

type EntryRow = {
  id: string;
  created_at: string;
  mood_label: string | null;
  mood_valence: string | null;
  thoughts: string | null;
};

export default function PsychJournalListScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const [patientName, setPatientName] = useState('Patient');
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    if (!patientId) {
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', patientId)
      .single();
    if (profileError) console.warn('PROFILE ERROR:', profileError.message);
    if (profile?.full_name) setPatientName(profile.full_name);

    // RLS restricts this to only entries this psychologist's patient has
    // shared — see the "Psychologists can view shared journal entries" policy.
    const { data: entryData, error: entryError } = await supabase
      .from('journal_entries')
      .select('id, created_at, mood_label, mood_valence, thoughts')
      .eq('patient_id', patientId)
      .eq('shared_with_psychologist', true)
      .order('created_at', { ascending: false });
    if (entryError) console.warn('SHARED ENTRIES ERROR:', entryError.message);
    setEntries((entryData as EntryRow[]) ?? []);

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, [patientId]));

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{patientName}'s Journal</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>📔</ThemedText>
            <ThemedText style={styles.emptyTitle}>No shared entries yet</ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.emptySub}>
              Entries {patientName.split(' ')[0]} shares with you will appear here.
            </ThemedText>
          </View>
        ) : (
          entries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => router.push({ pathname: '/psych-journal-entry', params: { id: entry.id, patientName } })}>
              <View style={styles.jCard}>
                <ThemedText style={styles.jEmoji}>{moodEmoji(entry.mood_valence)}</ThemedText>
                <View style={styles.jInfo}>
                  <ThemedText style={styles.jDate}>{formatEntryDate(entry.created_at)}</ThemedText>
                  {entry.mood_label && (
                    <View style={styles.jTag}>
                      <ThemedText style={styles.jTagText}>{entry.mood_label}</ThemedText>
                    </View>
                  )}
                  <ThemedText type="small" themeColor="textTertiary" style={styles.jPreview} numberOfLines={1}>
                    {entry.thoughts ?? 'No thoughts recorded.'}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
              </View>
            </Pressable>
          ))
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
  backBtn: { marginRight: 2 },
  headerTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: colors.text, flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, paddingTop: 14,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { fontWeight: '700', marginBottom: 4 },
  emptySub: { textAlign: 'center' },
  jCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 15,
    backgroundColor: colors.backgroundElement,
    borderRadius: 16, marginBottom: 7,
    borderWidth: 0.5, borderColor: colors.border,
  },
  jEmoji: { fontSize: 22 },
  jInfo: { flex: 1, minWidth: 0 },
  jDate: { fontSize: 12, fontWeight: '600', color: colors.text },
  jTag: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.teal}24`,
    borderRadius: 7, paddingVertical: 2, paddingHorizontal: 7, marginTop: 2,
  },
  jTagText: { fontSize: 10, fontWeight: '600', color: colors.teal },
  jPreview: { marginTop: 3 },
});
