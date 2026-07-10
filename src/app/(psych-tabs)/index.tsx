import { useState, useCallback } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

function getSessionTag(startTime: string): { tag: string; tagColor: string } {
  const now = new Date();
  const start = new Date(startTime);
  const diffMins = (start.getTime() - now.getTime()) / 60000;

  if (diffMins < 0 && diffMins > -60) return { tag: 'Now', tagColor: colors.rose };
  if (diffMins >= 0 && diffMins <= 120) return { tag: 'Soon', tagColor: colors.amber };

  const isToday = start.toDateString() === now.toDateString();
  if (isToday) return { tag: 'Later', tagColor: colors.teal };

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = start.toDateString() === tomorrow.toDateString();
  if (isTomorrow) return { tag: 'Tmrw', tagColor: colors.textTertiary };

  return { tag: start.toLocaleDateString(), tagColor: colors.textTertiary };
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

type SessionRow = {
  id: string;
  start_time: string;
  duration_minutes: number;
  meet_link: string | null;
  patient: {
    id: string;
    full_name: string;
  };
};

export default function HomeScreen() {
  const [linkRevealed, setLinkRevealed] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [todaySessions, setTodaySessions] = useState<SessionRow[]>([]);
  const [tomorrowSessions, setTomorrowSessions] = useState<SessionRow[]>([]);
  const [nextSession, setNextSession] = useState<SessionRow | null>(null);
  const [stats, setStats] = useState({ patients: 0, today: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch doctor name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    if (profile) setDoctorName(profile.full_name ?? '');

    // Date boundaries
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const tomorrowStart = new Date(todayEnd);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Fetch today's sessions
    const { data: todayData } = await supabase
      .from('sessions')
      .select('id, start_time, duration_minutes, meet_link, patient:patient_id(id, full_name)')
      .eq('psychologist_id', user.id)
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString())
      .order('start_time');
    setTodaySessions((todayData as any) ?? []);

    // Fetch tomorrow's sessions
    const { data: tomorrowData } = await supabase
      .from('sessions')
      .select('id, start_time, duration_minutes, meet_link, patient:patient_id(id, full_name)')
      .eq('psychologist_id', user.id)
      .gte('start_time', tomorrowStart.toISOString())
      .lte('start_time', tomorrowEnd.toISOString())
      .order('start_time');
    setTomorrowSessions((tomorrowData as any) ?? []);

    // Next upcoming session
    const { data: nextData } = await supabase
      .from('sessions')
      .select('id, start_time, duration_minutes, meet_link, patient:patient_id(id, full_name)')
      .eq('psychologist_id', user.id)
      .gte('start_time', now.toISOString())
      .order('start_time')
      .limit(1)
      .single();
    setNextSession((nextData as any) ?? null);

    // Stats
    const { count: patientCount } = await supabase
      .from('patient_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', user.id);

    setStats({
      patients: patientCount ?? 0,
      today: todayData?.length ?? 0,
      pending: 0, // TODO: wire up pending assignments count later
    });

    setLoading(false);
  }

  // Reload every time the tab comes into focus
  useFocusEffect(useCallback(() => { loadData(); }, []));

  const openPatient = (id: string) => router.push(`/patient/${id}`);

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + Spacing.four },
        ]}>
        <View style={styles.greeting}>
          <ThemedText type="small" themeColor="textSecondary">
            {getGreeting()}
          </ThemedText>
          <ThemedText style={styles.greetingName}>
            {doctorName || 'Doctor'}
          </ThemedText>
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
                <ThemedText style={styles.focusTitle}>
                  {(nextSession.patient as any)?.full_name ?? 'Patient'}
                </ThemedText>
                <ThemedText style={styles.focusSub}>
                  {formatTime(nextSession.start_time)} · {nextSession.duration_minutes} min
                </ThemedText>
              </LinearGradient>
              <View style={styles.focusAction}>
                <ThemedText style={styles.focusActionLabel}>
                  {linkRevealed ? 'Tap to hide meeting link' : 'Tap to reveal meeting link'}
                </ThemedText>
                <Ionicons name="videocam" size={16} color="rgba(255,255,255,0.7)" />
              </View>
            </Pressable>

            {linkRevealed && nextSession.meet_link && (
              <View style={styles.linkCard}>
                <Ionicons name="videocam" size={18} color={colors.teal} />
                <ThemedText style={styles.linkText}>{nextSession.meet_link}</ThemedText>
                <Pressable style={styles.linkBtn}>
                  <ThemedText type="small" style={styles.linkBtnText}>Start</ThemedText>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <ThemedView type="backgroundElement" style={styles.noSession}>
            <ThemedText themeColor="textSecondary">No upcoming sessions scheduled.</ThemedText>
          </ThemedView>
        )}

        {/* Stat strip */}
        <View style={styles.statStrip}>
          {[
            { label: 'Patients', value: String(stats.patients) },
            { label: 'Today', value: String(stats.today) },
            { label: 'Pending', value: String(stats.pending) },
          ].map((stat) => (
            <ThemedView key={stat.label} type="backgroundElement" style={styles.statCard}>
              <ThemedText themeColor="gold" style={styles.statNum}>{stat.value}</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.statLabel}>
                {stat.label}
              </ThemedText>
            </ThemedView>
          ))}
        </View>

        {/* Today */}
        <View style={styles.secLabelRow}>
          <ThemedText style={styles.secMain}>Today</ThemedText>
          <Pressable onPress={() => router.push('/(psych-tabs)/calendar')}>
            <ThemedText type="small" themeColor="teal">Full calendar</ThemedText>
          </Pressable>
        </View>
        {todaySessions.length === 0 && (
          <ThemedText themeColor="textTertiary" style={{ paddingHorizontal: Spacing.two, marginBottom: Spacing.two }}>
            No sessions today.
          </ThemedText>
        )}
        {todaySessions.map((s) => {
          const { tag, tagColor } = getSessionTag(s.start_time);
          return (
            <SessionSlot
              key={s.id}
              session={{ id: (s.patient as any)?.id, time: formatTime(s.start_time), name: (s.patient as any)?.full_name ?? 'Patient', tag, tagColor }}
              onPress={() => openPatient((s.patient as any)?.id)}
            />
          );
        })}

        {/* Tomorrow */}
        <ThemedText style={[styles.secLabel, { marginTop: Spacing.two }]}>Tomorrow</ThemedText>
        {tomorrowSessions.length === 0 && (
          <ThemedText themeColor="textTertiary" style={{ paddingHorizontal: Spacing.two, marginBottom: Spacing.two }}>
            No sessions tomorrow.
          </ThemedText>
        )}
        {tomorrowSessions.map((s) => {
          const { tag, tagColor } = getSessionTag(s.start_time);
          return (
            <SessionSlot
              key={s.id}
              session={{ id: (s.patient as any)?.id, time: formatTime(s.start_time), name: (s.patient as any)?.full_name ?? 'Patient', tag, tagColor }}
              onPress={() => openPatient((s.patient as any)?.id)}
            />
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

type Session = { id: string; time: string; name: string; tag: string; tagColor: string };

function SessionSlot({ session, onPress }: { session: Session; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.slotItem}>
        <ThemedText themeColor="gold" style={styles.slotTime}>{session.time}</ThemedText>
        <ThemedText style={styles.slotName}>{session.name}</ThemedText>
        <View style={[styles.tag, { backgroundColor: `${session.tagColor}2E` }]}>
          <ThemedText type="small" style={[styles.tagText, { color: session.tagColor }]}>
            {session.tag}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
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
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
  },
  focusCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  focusInner: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  focusGlow: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.focusCardGlow,
  },
  focusEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  focusSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  focusAction: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 9,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  noSession: {
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: colors.tealDim,
    marginBottom: Spacing.three,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  linkBtn: {
    backgroundColor: colors.teal,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  linkBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  statStrip: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  statNum: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    marginTop: 2,
    fontWeight: '500',
  },
  secLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  secLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  secMain: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 7,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 68,
  },
  slotName: {
    flex: 1,
    fontSize: 13,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});
