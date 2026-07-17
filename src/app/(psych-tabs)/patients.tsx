import { useMemo, useState, useCallback } from 'react';
import { ScrollView, View, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

type FilterKey = 'all' | 'today' | 'pending' | 'watch';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'pending', label: 'Pending' },
  { key: 'watch', label: 'Needs attention' },
];

const FLAG_COLORS: Record<string, 'green' | 'amber' | 'rose'> = {
  progress: 'green',
  watch: 'amber',
  urgent: 'rose',
};

const FLAG_LABELS: Record<string, string> = {
  progress: 'Progress',
  watch: 'Monitor',
  urgent: 'Urgent',
};

// Generates initials from a full name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Picks a consistent color per patient based on their id
const AVATAR_COLORS = [
  colors.tealDim, colors.goldDim, colors.green,
  colors.rose, colors.purple, colors.amber,
];
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type PatientRow = {
  id: string;
  full_name: string;
  flag: string | null;
  notes: string | null;
  next_session: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  has_pending_assignments: boolean;
};

export default function PatientsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPatients() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch all patients assigned to this psychologist
    const { data: patientProfiles, error: patientProfilesError } = await supabase
      .from('patient_profiles')
      .select('id, flag, notes')
      .eq('psychologist_id', user.id);

    if (patientProfilesError) {
      console.warn('PATIENT PROFILES ERROR:', patientProfilesError.message);
    }

    if (!patientProfiles || patientProfiles.length === 0) {
      setPatients([]);
      setLoading(false);
      return;
    }

    const patientIds = patientProfiles.map((p) => p.id);

    // Fetch profile names
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', patientIds);
    if (profilesError) console.warn('PROFILES ERROR:', profilesError.message);

    // Fetch this psychologist's sessions with each patient, so we can map
    // a message notification's related_id (a session id) back to a patient.
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('sessions')
      .select('id, patient_id, start_time')
      .eq('psychologist_id', user.id);
    if (allSessionsError) console.warn('SESSIONS ERROR:', allSessionsError.message);

    const sessionToPatient: Record<string, string> = {};
    for (const s of allSessions ?? []) {
      sessionToPatient[s.id] = s.patient_id;
    }

    // Next upcoming session per patient
    const now = new Date().toISOString();
    const nextSessionMap: Record<string, string> = {};
    for (const s of (allSessions ?? [])
      .filter((s) => s.start_time >= now)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))) {
      if (!nextSessionMap[s.patient_id]) nextSessionMap[s.patient_id] = s.start_time;
    }

    // Fetch latest chat message per patient — chat_messages already has a
    // real patient_id column, so this is a direct query with no nested
    // subquery through sessions, and no incorrect column aliasing.
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('patient_id, sender, body, created_at')
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false });
    if (messagesError) console.warn('MESSAGES ERROR:', messagesError.message);

    // Fetch pending assignments per patient
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('patient_id, done')
      .in('patient_id', patientIds)
      .eq('done', false);
    if (assignmentsError) console.warn('ASSIGNMENTS ERROR:', assignmentsError.message);

    // Fetch unread message notifications for this psychologist, and count
    // them per patient using the session→patient map built above.
    const { data: unreadNotifs, error: unreadError } = await supabase
      .from('notifications')
      .select('related_id')
      .eq('user_id', user.id)
      .eq('type', 'message')
      .eq('read', false);
    if (unreadError) console.warn('UNREAD NOTIFICATIONS ERROR:', unreadError.message);

    const unreadCountMap: Record<string, number> = {};
    for (const n of unreadNotifs ?? []) {
      const patientForThisMsg = n.related_id ? sessionToPatient[n.related_id] : null;
      if (patientForThisMsg) {
        unreadCountMap[patientForThisMsg] = (unreadCountMap[patientForThisMsg] ?? 0) + 1;
      }
    }

    // Build a map for quick lookups
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    const lastMessageMap: Record<string, { body: string; time: string }> = {};
    for (const m of messages ?? []) {
      if (!lastMessageMap[m.patient_id]) {
        lastMessageMap[m.patient_id] = { body: m.body, time: m.created_at };
      }
    }
    const pendingSet = new Set((assignments ?? []).map((a) => a.patient_id));

    const rows: PatientRow[] = patientProfiles.map((pp) => ({
      id: pp.id,
      full_name: profileMap[pp.id]?.full_name ?? 'Unknown',
      flag: pp.flag ?? 'progress',
      notes: pp.notes,
      next_session: nextSessionMap[pp.id] ?? null,
      last_message: lastMessageMap[pp.id]?.body ?? null,
      last_message_time: lastMessageMap[pp.id]?.time ?? null,
      unread_count: unreadCountMap[pp.id] ?? 0,
      has_pending_assignments: pendingSet.has(pp.id),
    }));

    setPatients(rows);
    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadPatients(); }, []));

  const today = new Date();
  const todayStr = today.toDateString();

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return patients.filter((p) => {
      if (s && !p.full_name.toLowerCase().includes(s)) return false;
      if (filter === 'today') {
        if (!p.next_session) return false;
        return new Date(p.next_session).toDateString() === todayStr;
      }
      if (filter === 'pending') return p.has_pending_assignments;
      if (filter === 'watch') return p.flag === 'urgent' || p.flag === 'watch';
      return true;
    });
  }, [search, filter, patients]);

  function formatMessageTime(isoString: string | null): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short' });
  }

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
        <View style={styles.heading}>
          <ThemedText type="small" themeColor="textSecondary">Your roster</ThemedText>
          <ThemedText style={styles.headingTitle}>Patients</ThemedText>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search patients…"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.chipsRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, filter === f.key && styles.chipOn]}>
              <ThemedText type="small" style={[styles.chipText, filter === f.key && styles.chipTextOn]}>
                {f.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>
              {patients.length === 0 ? '🩺' : '🔍'}
            </ThemedText>
            <ThemedText style={styles.emptyTitle}>
              {patients.length === 0 ? 'No patients yet' : 'No patients found'}
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.emptySub}>
              {patients.length === 0
                ? 'Patients will appear here once they are matched with you.'
                : 'Try adjusting your search or filter.'}
            </ThemedText>
          </View>
        ) : (
          filtered.map((p) => {
            const flagColor = colors[FLAG_COLORS[p.flag ?? 'progress'] ?? 'green'];
            const flagLabel = FLAG_LABELS[p.flag ?? 'progress'] ?? 'Progress';
            const initials = getInitials(p.full_name);
            const bgColor = avatarColor(p.id);

            return (
              <Pressable key={p.id} onPress={() => openPatient(p.id)}>
                <ThemedView type="backgroundElement" style={styles.patCard}>
                  <View style={[styles.avatar, { backgroundColor: bgColor }]}>
                    <ThemedText style={styles.avatarText}>{initials}</ThemedText>
                  </View>
                  <View style={styles.patInfo}>
                    <View style={styles.patNameRow}>
                      <ThemedText style={styles.patName}>{p.full_name}</ThemedText>
                      <View style={[styles.flagBadge, { backgroundColor: `${flagColor}2E` }]}>
                        <ThemedText style={[styles.flagText, { color: flagColor }]}>
                          {flagLabel}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.patPreview}
                      numberOfLines={1}>
                      {p.last_message ?? 'No messages yet'}
                    </ThemedText>
                  </View>
                  <View style={styles.patRight}>
                    <ThemedText type="small" themeColor="textTertiary" style={styles.patTime}>
                      {formatMessageTime(p.last_message_time)}
                    </ThemedText>
                    {p.unread_count > 0 && (
                      <View style={styles.unreadDot}>
                        <ThemedText style={styles.unreadText}>{p.unread_count}</ThemedText>
                      </View>
                    )}
                  </View>
                </ThemedView>
              </Pressable>
            );
          })
        )}
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
  heading: { paddingHorizontal: Spacing.two, paddingBottom: Spacing.two },
  headingTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.backgroundElement,
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: colors.border, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text },
  chipsRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 5, paddingHorizontal: 13, borderRadius: 20,
    borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.backgroundElement,
  },
  chipOn: { backgroundColor: colors.tealDim, borderColor: colors.tealDim },
  chipText: { fontWeight: '600', color: colors.textTertiary },
  chipTextOn: { color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 28, marginBottom: 8 },
  emptyTitle: { fontWeight: '700', marginBottom: 4 },
  emptySub: { textAlign: 'center' },
  patCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 15,
    borderRadius: 16, marginBottom: 7,
    borderWidth: 0.5, borderColor: colors.border,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  patInfo: { flex: 1, minWidth: 0 },
  patNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  patName: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  flagBadge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8 },
  flagText: { fontSize: 10, fontWeight: '700' },
  patPreview: { marginTop: 2 },
  patRight: { alignItems: 'flex-end', gap: 5 },
  patTime: {},
  unreadDot: {
    backgroundColor: colors.gold, width: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { color: colors.background, fontSize: 10, fontWeight: '700' },
});
