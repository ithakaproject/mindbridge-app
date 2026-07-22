import { useState, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { TopBar } from '@/components/top-bar';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

function moodBarColor(v: number) {
  if (v <= 3) return colors.rose;
  if (v <= 5) return colors.amber;
  return colors.green;
}

function formatEntryDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type JournalEntry = {
  id: string;
  created_at: string;
  mood_label: string | null;
  mood_score: number | null;
  mood_valence: string | null;
  thoughts: string | null;
  shared_with_psychologist: boolean;
};

type PendingRequest = {
  id: string;
  body: string | null;
  related_id: string | null; // psychologist's user id
  count: number | null;
};

export default function PatientJournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moodScores, setMoodScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [respondingTo, setRespondingTo] = useState(false);

  async function loadData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: entryData } = await supabase
      .from('journal_entries')
      .select('id, created_at, mood_label, mood_score, mood_valence, thoughts, shared_with_psychologist')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const fetchedEntries = (entryData as JournalEntry[]) ?? [];
    setEntries(fetchedEntries);

    // Last 8 mood scores for sparkline
    const scores = fetchedEntries
      .filter((e) => e.mood_score != null)
      .slice(0, 8)
      .reverse()
      .map((e) => e.mood_score!);
    setMoodScores(scores);

    // Check for an unresolved journal access request from the psychologist
    const { data: requestData, error: requestError } = await supabase
      .from('notifications')
      .select('id, body, related_id, count')
      .eq('user_id', user.id)
      .eq('type', 'journal_request')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (requestError) console.warn('PENDING REQUEST ERROR:', requestError.message);
    setPendingRequest((requestData as PendingRequest) ?? null);

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function respondToRequest(grant: boolean) {
    if (!pendingRequest || respondingTo) return;
    setRespondingTo(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRespondingTo(false);
      return;
    }

    if (grant) {
      const count = pendingRequest.count ?? 10;

      // Grab exactly the most recent `count` entries and mark only those
      // as shared — this is what keeps access scoped to what was actually
      // requested, instead of exposing every entry the patient has ever written.
      const { data: recentEntries, error: fetchError } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(count);

      if (fetchError) {
        console.warn('FETCH RECENT ENTRIES ERROR:', fetchError.message);
        setRespondingTo(false);
        return;
      }

      const idsToShare = (recentEntries ?? []).map((e) => e.id);
      if (idsToShare.length > 0) {
        const { error: shareError } = await supabase
          .from('journal_entries')
          .update({ shared_with_psychologist: true })
          .in('id', idsToShare);
        if (shareError) {
          console.warn('BULK SHARE ERROR:', shareError.message);
          setRespondingTo(false);
          return;
        }
        // Reflect the change locally right away
        setEntries((prev) =>
          prev.map((e) => (idsToShare.includes(e.id) ? { ...e, shared_with_psychologist: true } : e))
        );
      }
    }

    const { error: resolveError } = await supabase
      .from('notifications')
      .update({ resolved: true })
      .eq('id', pendingRequest.id);
    if (resolveError) console.warn('RESOLVE REQUEST ERROR:', resolveError.message);

    if (pendingRequest.related_id) {
      const { error: notifyError } = await supabase.from('notifications').insert({
        user_id: pendingRequest.related_id,
        type: grant ? 'journal_shared' : 'journal_declined',
        title: grant ? 'Journal access granted' : 'Journal access declined',
        body: null,
        related_id: user.id,
      });
      if (notifyError) console.warn('RESPONSE NOTIFICATION ERROR:', notifyError.message);
    }

    setPendingRequest(null);
    setRespondingTo(false);
  }

  const trendUp = moodScores.length >= 2
    ? moodScores[moodScores.length - 1] >= moodScores[moodScores.length - 2]
    : true;

  // Emoji for mood valence
  function moodEmoji(entry: JournalEntry): string {
    if (!entry.mood_label) return '📝';
    if (entry.mood_valence === 'positive') return '😊';
    if (entry.mood_valence === 'negative') return '😔';
    return '😐';
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <TopBar />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>

        <View style={styles.greeting}>
          <ThemedText type="small" themeColor="textSecondary">Your private space</ThemedText>
          <ThemedText style={styles.greetingTitle}>Journal</ThemedText>
        </View>

        {pendingRequest && (
          <View style={styles.requestBanner}>
            <Ionicons name="lock-open-outline" size={17} color={colors.purple} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.requestTitle}>Journal access requested</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.requestSub}>
                {pendingRequest.body ?? 'Your psychologist has requested access to your journal.'}
              </ThemedText>
              <View style={styles.requestActions}>
                <Pressable
                  onPress={() => respondToRequest(true)}
                  disabled={respondingTo}
                  style={styles.grantBtn}>
                  <ThemedText style={styles.grantBtnText}>
                    {respondingTo ? 'Working…' : 'Grant access'}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => respondToRequest(false)}
                  disabled={respondingTo}
                  style={styles.declineBtn}>
                  <ThemedText style={styles.declineBtnText}>Decline</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Mood sparkline */}
        {moodScores.length > 0 && (
          <View style={styles.sparkCard}>
            <View style={styles.sparkHeader}>
              <ThemedText style={styles.sparkTitle}>
                Your mood — last {moodScores.length} entries
              </ThemedText>
              <ThemedText type="small" style={[styles.sparkAvg, { color: trendUp ? colors.green : colors.rose }]}>
                {trendUp ? '↑ Trending better' : '↓ Trending down'}
              </ThemedText>
            </View>
            <View style={styles.sparkline}>
              {moodScores.map((v, i) => (
                <View
                  key={i}
                  style={[styles.sparkBar, { height: `${(v / 10) * 100}%`, backgroundColor: moodBarColor(v) }]}
                />
              ))}
            </View>
          </View>
        )}

        {/* New entry */}
        <Pressable onPress={() => router.push('/journal-write')} style={styles.newEntryBtn}>
          <Ionicons name="pencil" size={17} color={colors.gold} />
          <ThemedText style={styles.newEntryText}>What's on your mind today?</ThemedText>
          <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
        </Pressable>

        {/* Recent entries */}
        <ThemedText style={styles.secLabel}>Recent entries</ThemedText>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>📔</ThemedText>
            <ThemedText style={styles.emptyTitle}>No entries yet</ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.emptySub}>
              Tap above to write your first journal entry.
            </ThemedText>
          </View>
        ) : (
          entries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => router.push({ pathname: '/journal-entry', params: { id: entry.id } })}>
              <View style={styles.jCard}>
                <ThemedText style={styles.jEmoji}>{moodEmoji(entry)}</ThemedText>
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
                {entry.shared_with_psychologist && (
                  <Ionicons name="eye-outline" size={14} color={colors.teal} />
                )}
                <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  greeting: { paddingHorizontal: Spacing.two, paddingBottom: 8 },
  greetingTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  requestBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: `${colors.purple}14`,
    borderWidth: 0.5, borderColor: `${colors.purple}40`,
    borderRadius: 16, padding: 14, marginBottom: Spacing.three,
  },
  requestTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  requestSub: { marginTop: 3, lineHeight: 17 },
  requestActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  grantBtn: {
    backgroundColor: colors.purple, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  grantBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  declineBtn: {
    backgroundColor: colors.backgroundSelected, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: colors.border,
  },
  declineBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  sparkCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 18, padding: 14, marginBottom: Spacing.three,
    borderWidth: 0.5, borderColor: colors.border,
  },
  sparkHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sparkTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.9,
  },
  sparkAvg: { fontWeight: '600' },
  sparkline: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 36 },
  sparkBar: { flex: 1, borderRadius: 4, minHeight: 4 },
  newEntryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: `${colors.gold}10`,
    borderWidth: 0.5, borderColor: `${colors.gold}38`,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16,
    marginBottom: Spacing.three,
  },
  newEntryText: { flex: 1, fontSize: 13.5, fontStyle: 'italic', color: colors.textSecondary },
  secLabel: {
    fontSize: 10.5, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.1, paddingBottom: 8,
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
