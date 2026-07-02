import { useState, useCallback } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { OptionGrid } from '@/components/option-grid';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { POSITIVE_MOODS, NEGATIVE_MOODS, findMood } from '@/data/journal-options';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function formatSessionTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today · ${timeStr}`;
  if (isTomorrow) return `Tomorrow · ${timeStr}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${timeStr}`;
}

function getSessionTag(isoString: string): { tag: string; tagColor: TagColor } {
  const now = new Date();
  const start = new Date(isoString);
  const diffMins = (start.getTime() - now.getTime()) / 60000;
  if (diffMins < 0 && diffMins > -60) return { tag: 'Now', tagColor: 'rose' };
  if (diffMins >= 0 && diffMins <= 120) return { tag: 'Soon', tagColor: 'amber' };
  const isToday = start.toDateString() === now.toDateString();
  if (isToday) return { tag: 'Today', tagColor: 'teal' };
  return { tag: start.toLocaleDateString([], { weekday: 'short' }), tagColor: 'textTertiary' };
}

type TagColor = 'rose' | 'teal' | 'gold' | 'amber' | 'green' | 'textTertiary';

type SessionRow = {
  id: string;
  start_time: string;
  duration: number;
  meeting_link: string | null;
  psychologist_name: string;
};

type AssignmentRow = {
  id: string;
  title: string;
  sub: string;
  icon: 'clipboard-outline' | 'sparkles-outline' | 'pencil' | 'videocam-outline';
  done: boolean;
};

// Courses are still placeholder — no courses table yet
const COURSES = [
  {
    emoji: '❤️',
    title: 'Self Love',
    pct: 70,
    sub: 'Module 5 of 7 · 1 left this week',
    desc: 'Building self-compassion practices for daily life.',
  },
  {
    emoji: '🧠',
    title: 'Anxiety Management',
    pct: 35,
    sub: 'Module 3 of 8 · 2 new lessons',
    desc: 'Understanding the cognitive model of anxiety.',
  },
];

export default function PatientHomeScreen() {
  const [patientName, setPatientName] = useState('');
  const [nextSession, setNextSession] = useState<SessionRow | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [stats, setStats] = useState({ upcoming: 0, pending: 0, entries: 0 });
  const [loading, setLoading] = useState(true);
  const [linkRevealed, setLinkRevealed] = useState(false);
  const [todaysMood, setTodaysMood] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [valenceTab, setValenceTab] = useState<'positive' | 'negative'>('positive');
  const [savingMood, setSavingMood] = useState(false);

  async function loadData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch patient name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    setPatientName(profile?.full_name ?? '');

    // Fetch psychologist name via patient_profiles
    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('psychologist_id')
      .eq('id', user.id)
      .single();

    let psychName = 'Your psychologist';
    if (patientProfile?.psychologist_id) {
      const { data: psychProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', patientProfile.psychologist_id)
        .single();
      if (psychProfile?.full_name) psychName = `Dr. ${psychProfile.full_name.split(' ').slice(-1)[0]}`;
    }

    // Fetch upcoming sessions
    const now = new Date().toISOString();
    const { data: sessData } = await supabase
      .from('sessions')
      .select('id, start_time, duration, meeting_link')
      .eq('patient_id', user.id)
      .gte('start_time', now)
      .order('start_time')
      .limit(5);

    const sessions: SessionRow[] = (sessData ?? []).map((s) => ({
      ...s,
      psychologist_name: psychName,
    }));

    setNextSession(sessions[0] ?? null);
    setUpcomingSessions(sessions.slice(0, 2));

    // Fetch assignments
    const { data: assignData } = await supabase
      .from('assignments')
      .select('id, title, sub, icon, done')
      .eq('patient_id', user.id)
      .eq('done', false)
      .order('created_at');
    setAssignments((assignData as AssignmentRow[]) ?? []);

    // Fetch today's mood check-in
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: moodData } = await supabase
      .from('journal_entries')
      .select('mood_label')
      .eq('patient_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (moodData?.mood_label) setTodaysMood(moodData.mood_label);

    // Fetch stats
    const { count: upcomingCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id)
      .gte('start_time', now);

    const { count: pendingCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id)
      .eq('done', false);

    const { count: entriesCount } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id);

    setStats({
      upcoming: upcomingCount ?? 0,
      pending: pendingCount ?? 0,
      entries: entriesCount ?? 0,
    });

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function confirmMood(label: string) {
    setTodaysMood(label);
    setPickerOpen(false);
    setSavingMood(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const moodInfo = findMood(label);
    if (!moodInfo) return;

    // Check if there's already a check-in today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: existing } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('patient_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .limit(1)
      .single();

    if (existing) {
      // Update today's entry
      await supabase
        .from('journal_entries')
        .update({
          mood_label: moodInfo.label,
          mood_valence: moodInfo.valence,
          mood_score: moodInfo.score,
        })
        .eq('id', existing.id);
    } else {
      // Create new entry
      await supabase
        .from('journal_entries')
        .insert({
          patient_id: user.id,
          mood_label: moodInfo.label,
          mood_valence: moodInfo.valence,
          mood_score: moodInfo.score,
        });
    }

    setSavingMood(false);
  }

  const moodInfo = todaysMood ? findMood(todaysMood) : undefined;

  const openAssignment = (item: AssignmentRow) => {
    router.push({
      pathname: '/assignment',
      params: { title: item.title, desc: item.sub, sub: item.sub, tagColor: 'gold' },
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <TopBar />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>

        <View style={styles.greeting}>
          <ThemedText type="small" themeColor="textSecondary">{getGreeting()}</ThemedText>
          <ThemedText style={styles.greetingName}>{patientName}</ThemedText>
        </View>

        {/* Focus card — next session */}
        {nextSession ? (
          <>
            <Pressable onPress={() => setLinkRevealed((v) => !v)} style={styles.focusCard}>
              <LinearGradient
                colors={[colors.tealDeep, colors.tealDim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.focusInner}>
                <View style={styles.focusGlow} />
                <ThemedText style={styles.focusEyebrow}>NEXT SESSION</ThemedText>
                <ThemedText style={styles.focusTitle}>{nextSession.psychologist_name}</ThemedText>
                <ThemedText style={styles.focusSub}>
                  {formatSessionTime(nextSession.start_time)} · {nextSession.duration} min
                </ThemedText>
              </LinearGradient>
              <View style={styles.focusAction}>
                <ThemedText style={styles.focusActionLabel}>
                  {linkRevealed ? 'Tap to hide meeting link' : 'Tap to reveal meeting link'}
                </ThemedText>
                <Ionicons name="videocam" size={16} color="rgba(255,255,255,0.7)" />
              </View>
            </Pressable>

            {linkRevealed && nextSession.meeting_link && (
              <View style={styles.linkCard}>
                <Ionicons name="videocam" size={18} color={colors.teal} />
                <ThemedText style={styles.linkText}>{nextSession.meeting_link}</ThemedText>
                <Pressable style={styles.linkBtn}>
                  <ThemedText type="small" style={styles.linkBtnText}>Join</ThemedText>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <ThemedView type="backgroundElement" style={styles.noSession}>
            <ThemedText themeColor="textSecondary">No upcoming sessions scheduled.</ThemedText>
          </ThemedView>
        )}

        {/* Mood check-in */}
        <View style={styles.moodCard}>
          <View style={styles.moodTop}>
            <ThemedText style={styles.moodLabel}>HOW ARE YOU FEELING?</ThemedText>
            {savingMood && (
              <ThemedText type="small" themeColor="textTertiary">Saving…</ThemedText>
            )}
          </View>
          {!pickerOpen && (
            <Pressable onPress={() => setPickerOpen(true)} style={styles.moodSummaryRow}>
              {moodInfo ? (
                <>
                  <ThemedText style={styles.moodSummaryEmoji}>{moodInfo.emoji}</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.moodSummaryLabel}>{moodInfo.label}</ThemedText>
                    <ThemedText type="small" themeColor="textTertiary">
                      Tap to update today's check-in
                    </ThemedText>
                  </View>
                </>
              ) : (
                <ThemedText style={styles.moodCheckInPrompt}>Tap to check in →</ThemedText>
              )}
            </Pressable>
          )}
          {pickerOpen && (
            <>
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
                selected={todaysMood}
                onSelect={confirmMood}
                accentColor={valenceTab === 'positive' ? colors.green : colors.rose}
              />
              <Pressable onPress={() => setPickerOpen(false)} style={styles.moodCancelBtn}>
                <ThemedText type="small" themeColor="textTertiary">Cancel</ThemedText>
              </Pressable>
            </>
          )}
        </View>

        {/* Stat strip */}
        <View style={styles.statStrip}>
          {[
            { label: 'Upcoming', value: String(stats.upcoming) },
            { label: 'Pending', value: String(stats.pending) },
            { label: 'Entries', value: String(stats.entries) },
          ].map((stat) => (
            <ThemedView key={stat.label} type="backgroundElement" style={styles.statCard}>
              <ThemedText themeColor="gold" style={styles.statNum}>{stat.value}</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.statLabel}>
                {stat.label}
              </ThemedText>
            </ThemedView>
          ))}
        </View>

        {/* Upcoming sessions */}
        <View style={styles.secLabelRow}>
          <ThemedText style={styles.secMain}>Upcoming sessions</ThemedText>
          <Pressable onPress={() => router.push('/(patient-tabs)/schedule')}>
            <ThemedText type="small" themeColor="teal">See all</ThemedText>
          </Pressable>
        </View>
        {upcomingSessions.length === 0 ? (
          <ThemedText themeColor="textTertiary" style={styles.emptyText}>
            No upcoming sessions.
          </ThemedText>
        ) : (
          upcomingSessions.map((s) => {
            const { tag, tagColor } = getSessionTag(s.start_time);
            return (
              <Pressable key={s.id} onPress={() => router.push('/(patient-tabs)/schedule')}>
                <ThemedView type="backgroundElement" style={styles.rowItem}>
                  <View style={[styles.riWrap, { backgroundColor: `${colors.teal}26` }]}>
                    <Ionicons name="person" size={19} color={colors.teal} />
                  </View>
                  <View style={styles.rowInfo}>
                    <ThemedText style={styles.rowTitle}>{s.psychologist_name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.rowSub}>
                      {formatSessionTime(s.start_time)}
                    </ThemedText>
                  </View>
                  <View style={[styles.tag, { backgroundColor: `${colors[tagColor]}2E` }]}>
                    <ThemedText style={[styles.tagText, { color: colors[tagColor] }]}>{tag}</ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            );
          })
        )}

        {/* Assignments */}
        <View style={[styles.secLabelRow, { marginTop: 4 }]}>
          <ThemedText style={styles.secMain}>Assignments</ThemedText>
          {stats.pending > 0 && (
            <View style={styles.dueBadge}>
              <ThemedText style={styles.dueBadgeText}>{stats.pending} due</ThemedText>
            </View>
          )}
        </View>
        {assignments.length === 0 ? (
          <ThemedText themeColor="textTertiary" style={styles.emptyText}>
            No pending assignments.
          </ThemedText>
        ) : (
          assignments.map((a) => (
            <Pressable key={a.id} onPress={() => openAssignment(a)}>
              <ThemedView type="backgroundElement" style={styles.rowItem}>
                <View style={[styles.riWrap, { backgroundColor: `${colors.gold}26` }]}>
                  <Ionicons name={a.icon ?? 'clipboard-outline'} size={19} color={colors.gold} />
                </View>
                <View style={styles.rowInfo}>
                  <ThemedText style={styles.rowTitle}>{a.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.rowSub}>
                    {a.sub}
                  </ThemedText>
                </View>
              </ThemedView>
            </Pressable>
          ))
        )}

        {/* Courses — placeholder until courses table exists */}
        <View style={styles.secLabelRow}>
          <ThemedText style={styles.secMain}>Your courses</ThemedText>
          <ThemedText type="small" themeColor="teal">Browse</ThemedText>
        </View>
        {COURSES.map((c, i) => (
          <View key={i} style={styles.progItem}>
            <View style={styles.progHeader}>
              <ThemedText style={styles.progIcon}>{c.emoji}</ThemedText>
              <ThemedText style={styles.progTitle}>{c.title}</ThemedText>
              <ThemedText themeColor="gold" style={styles.progPct}>{c.pct}%</ThemedText>
            </View>
            <View style={styles.progBar}>
              <View style={[styles.progFill, { width: `${c.pct}%` }]} />
            </View>
            <ThemedText type="small" themeColor="textTertiary" style={styles.progSub}>
              {c.sub}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
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
  greeting: {
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.half,
    paddingBottom: Spacing.three,
  },
  greetingName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  focusCard: { borderRadius: 22, overflow: 'hidden', marginBottom: Spacing.three },
  focusInner: { paddingVertical: 15, paddingHorizontal: 18, overflow: 'hidden' },
  focusGlow: {
    position: 'absolute', right: -30, top: -30,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.focusCardGlow,
  },
  focusEyebrow: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5,
  },
  focusTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  focusSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  focusAction: {
    backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 9, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  focusActionLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  noSession: { borderRadius: 16, padding: Spacing.three, alignItems: 'center', marginBottom: Spacing.three },
  linkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.backgroundSelected, borderRadius: 14,
    paddingVertical: 11, paddingHorizontal: 16,
    borderWidth: 0.5, borderColor: colors.tealDim, marginBottom: Spacing.three,
  },
  linkText: { flex: 1, fontSize: 13, color: colors.text },
  linkBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  linkBtnText: { color: '#fff', fontWeight: '600' },
  moodCard: {
    backgroundColor: colors.backgroundElement, borderRadius: 18,
    padding: 14, marginBottom: Spacing.three,
    borderWidth: 0.5, borderColor: colors.border,
  },
  moodTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  moodLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  moodSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  moodSummaryEmoji: { fontSize: 30 },
  moodSummaryLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  moodCheckInPrompt: { fontSize: 13, fontWeight: '600', color: colors.gold },
  valenceTabs: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  valenceTab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.backgroundSelected },
  valenceTabOnPositive: { backgroundColor: colors.green },
  valenceTabOnNegative: { backgroundColor: colors.rose },
  valenceTabText: { fontSize: 12, fontWeight: '600', color: colors.textTertiary },
  valenceTabTextOn: { color: '#fff', fontWeight: '700' },
  moodCancelBtn: { alignItems: 'center', paddingTop: 8 },
  statStrip: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.three },
  statCard: {
    flex: 1, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 6,
    alignItems: 'center', borderWidth: 0.5, borderColor: colors.border,
  },
  statNum: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { marginTop: 2, fontWeight: '500' },
  secLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.two, paddingBottom: Spacing.two,
  },
  secMain: { fontSize: 10.5, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.1 },
  dueBadge: { backgroundColor: colors.rose, borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  dueBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyText: { paddingHorizontal: Spacing.two, marginBottom: Spacing.two },
  rowItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 15,
    borderRadius: 16, marginBottom: 7,
    borderWidth: 0.5, borderColor: colors.border,
  },
  riWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  rowSub: { marginTop: 2 },
  tag: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10 },
  tagText: { fontSize: 10.5, fontWeight: '700' },
  progItem: {
    backgroundColor: colors.backgroundElement, borderRadius: 16,
    padding: 14, marginBottom: 7,
    borderWidth: 0.5, borderColor: colors.border,
  },
  progHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  progIcon: { fontSize: 17 },
  progTitle: { fontSize: 13.5, fontWeight: '600', color: colors.text, flex: 1 },
  progPct: { fontSize: 12.5, fontWeight: '700' },
  progBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 2 },
  progSub: { marginTop: 6 },
});
