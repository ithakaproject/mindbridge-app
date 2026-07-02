import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { RematchModal } from '@/components/rematch-modal';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

const TINT_BG: Record<'gold' | 'teal' | 'rose', string> = {
  gold: `${colors.gold}26`,
  teal: `${colors.teal}26`,
  rose: `${colors.rose}26`,
};
const TINT_COLOR: Record<'gold' | 'teal' | 'rose', string> = {
  gold: colors.gold,
  teal: colors.teal,
  rose: colors.rose,
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

type ProfileData = {
  full_name: string;
  email: string;
  session_count: number;
  entry_count: number;
};

type PsychData = {
  id: string;
  full_name: string;
  specialties: string[];
  matched_since: string | null;
} | null;

export default function PatientProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [psychologist, setPsychologist] = useState<PsychData>(null);
  const [loading, setLoading] = useState(true);
  const [rematchOpen, setRematchOpen] = useState(false);

  async function loadData() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch base profile
    const { data: baseProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Fetch session count
    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id);

    // Fetch journal entry count
    const { count: entryCount } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id);

    setProfile({
      full_name: baseProfile?.full_name ?? 'Patient',
      email: user.email ?? '',
      session_count: sessionCount ?? 0,
      entry_count: entryCount ?? 0,
    });

    // Fetch psychologist
    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('psychologist_id, created_at')
      .eq('id', user.id)
      .single();

    if (patientProfile?.psychologist_id) {
      const { data: psychProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', patientProfile.psychologist_id)
        .single();

      const { data: psychDetails } = await supabase
        .from('psychologist_profiles')
        .select('specialties')
        .eq('id', patientProfile.psychologist_id)
        .single();

      setPsychologist({
        id: patientProfile.psychologist_id,
        full_name: psychProfile?.full_name ?? 'Your Psychologist',
        specialties: psychDetails?.specialties ?? [],
        matched_since: patientProfile.created_at ?? null,
      });
    } else {
      setPsychologist(null);
    }

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  async function handleRematchSubmit(reason: string, details: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('rematch_requests').insert({
      patient_id: user.id,
      reason,
      details,
      status: 'pending',
    });
  }

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <TopBar showNotification={false} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </ThemedView>
    );
  }

  const initials = getInitials(profile?.full_name ?? 'Patient');
  const psychInitials = psychologist ? getInitials(psychologist.full_name) : '?';
  const psychDisplayName = psychologist
    ? `Dr. ${psychologist.full_name.split(' ').slice(-1)[0]}`
    : 'Not yet matched';

  const matchedSinceStr = psychologist?.matched_since
    ? `With you since ${new Date(psychologist.matched_since).toLocaleDateString([], { month: 'long', year: 'numeric' })}`
    : '';

  const ACCOUNT_ROWS: {
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
    tint: 'gold' | 'teal' | 'rose';
    title: string;
    sub?: string;
    onPress: () => void;
  }[] = [
    {
      key: 'personal',
      icon: 'person-outline',
      tint: 'gold',
      title: 'Personal information',
      sub: profile?.full_name,
      onPress: () => {},
    },
    {
      key: 'language',
      icon: 'globe-outline',
      tint: 'teal',
      title: 'Language',
      sub: 'English',
      onPress: () => {},
    },
    {
      key: 'notifications',
      icon: 'notifications-outline',
      tint: 'gold',
      title: 'Notifications',
      sub: 'Coming soon',
      onPress: () => {},
    },
    {
      key: 'privacy',
      icon: 'shield-outline',
      tint: 'rose',
      title: 'Privacy & security',
      sub: 'Coming soon',
      onPress: () => {},
    },
    {
      key: 'help',
      icon: 'help-circle-outline',
      tint: 'teal',
      title: 'Help & support',
      sub: 'Coming soon',
      onPress: () => {},
    },
  ];

  const BILLING_ROWS: {
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    sub: string;
    highlight?: boolean;
    onPress: () => void;
  }[] = [
    { key: 'plan', icon: 'star-outline', title: 'Current plan', sub: 'Premium · $49/mo', highlight: true, onPress: () => {} },
    { key: 'method', icon: 'card-outline', title: 'Payment method', sub: 'Not set up yet', onPress: () => {} },
    { key: 'history', icon: 'receipt-outline', title: 'Billing history', sub: 'No charges yet', onPress: () => {} },
  ];

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.topBarRow}>
        <TopBar showNotification={false} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>

        {/* Hero card */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.goldDim, colors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroAvatar}>
            <ThemedText style={styles.heroAvatarText}>{initials}</ThemedText>
          </LinearGradient>
          <ThemedText style={styles.heroName}>{profile?.full_name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.heroEmail}>
            {profile?.email}
          </ThemedText>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <ThemedText themeColor="gold" style={styles.heroStatNum}>
                {profile?.session_count}
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>
                Sessions
              </ThemedText>
            </View>
            <View style={styles.heroStat}>
              <ThemedText themeColor="gold" style={styles.heroStatNum}>
                {profile?.entry_count}
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>
                Entries
              </ThemedText>
            </View>
          </View>
        </View>

        {/* My psychologist */}
        <ThemedText style={styles.secLabel}>My psychologist</ThemedText>
        <View style={styles.psychCard}>
          {psychologist ? (
            <>
              <View style={styles.psychInner}>
                <LinearGradient
                  colors={[colors.tealDim, colors.teal]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.psychAvatar}>
                  <ThemedText style={styles.psychAvatarText}>{psychInitials}</ThemedText>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.psychName}>{psychDisplayName}</ThemedText>
                  {psychologist.specialties.length > 0 && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.psychSpec}>
                      {psychologist.specialties.join(' · ')}
                    </ThemedText>
                  )}
                  {matchedSinceStr !== '' && (
                    <ThemedText type="small" themeColor="textTertiary" style={styles.psychSince}>
                      {matchedSinceStr}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.activeBadge}>
                  <ThemedText style={styles.activeBadgeText}>Active</ThemedText>
                </View>
              </View>

              <View style={styles.psychDivider} />

              <View style={styles.psychActions}>
                <Pressable onPress={() => router.push('/(patient-tabs)/chat')} style={styles.psychActionBtn}>
                  <Ionicons name="chatbubble-outline" size={15} color={colors.teal} />
                  <ThemedText style={[styles.psychActionText, { color: colors.teal }]}>Message</ThemedText>
                </Pressable>
                <Pressable onPress={() => router.push('/(patient-tabs)/schedule')} style={styles.psychActionBtn}>
                  <Ionicons name="calendar-outline" size={15} color={colors.gold} />
                  <ThemedText style={[styles.psychActionText, { color: colors.gold }]}>Book</ThemedText>
                </Pressable>
                <Pressable style={styles.psychActionBtn}>
                  <Ionicons name="videocam-outline" size={15} color={colors.textSecondary} />
                  <ThemedText style={[styles.psychActionText, { color: colors.textSecondary }]}>
                    Join call
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable onPress={() => setRematchOpen(true)} style={styles.rematchBtn}>
                <Ionicons name="sync-outline" size={15} color="#172433" />
                <ThemedText style={styles.rematchText}>Request a new psychologist</ThemedText>
                <Ionicons name="chevron-forward" size={13} color="#172433" />
              </Pressable>
            </>
          ) : (
            <ThemedText themeColor="textTertiary">
              You haven't been matched with a psychologist yet.
            </ThemedText>
          )}
        </View>

        {/* Account */}
        <ThemedText style={[styles.secLabel, { marginTop: 4 }]}>Account</ThemedText>
        {ACCOUNT_ROWS.map((row) => (
          <Pressable key={row.key} onPress={row.onPress}>
            <ThemedView type="backgroundElement" style={styles.rowItem}>
              <View style={[styles.riWrap, { backgroundColor: TINT_BG[row.tint] }]}>
                <Ionicons name={row.icon} size={17} color={TINT_COLOR[row.tint]} />
              </View>
              <View style={styles.rowInfo}>
                <ThemedText style={styles.rowTitle}>{row.title}</ThemedText>
                {row.sub && (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.rowSub}>
                    {row.sub}
                  </ThemedText>
                )}
              </View>
              <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
            </ThemedView>
          </Pressable>
        ))}

        {/* Billing */}
        <ThemedText style={[styles.secLabel, { marginTop: 4 }]}>Billing & payments</ThemedText>
        {BILLING_ROWS.map((row) => (
          <Pressable key={row.key} onPress={row.onPress}>
            <ThemedView
              type="backgroundElement"
              style={[styles.rowItem, row.highlight && styles.rowItemHighlight]}>
              <View style={[styles.riWrap, { backgroundColor: TINT_BG.gold }]}>
                <Ionicons name={row.icon} size={17} color={colors.gold} />
              </View>
              <View style={styles.rowInfo}>
                <ThemedText style={styles.rowTitle}>{row.title}</ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.rowSub, row.highlight && { color: colors.gold, fontWeight: '600' }]}>
                  {row.sub}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
            </ThemedView>
          </Pressable>
        ))}

        {/* Log out */}
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.rose} />
          <ThemedText type="smallBold" themeColor="rose">Log out</ThemedText>
        </Pressable>
      </ScrollView>

      <RematchModal
        visible={rematchOpen}
        onClose={() => setRematchOpen(false)}
        onSubmit={handleRematchSubmit}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBarRow: { position: 'relative' },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  hero: {
    backgroundColor: colors.backgroundSelected,
    borderRadius: 22, paddingVertical: 20, paddingHorizontal: 20,
    alignItems: 'center', marginBottom: 14,
    borderWidth: 0.5, borderColor: colors.border,
  },
  heroAvatar: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  heroAvatarText: { fontSize: 22, fontWeight: '800', color: colors.background },
  heroName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  heroEmail: { marginTop: 3 },
  heroStats: { flexDirection: 'row', gap: 16, marginTop: 13 },
  heroStat: { alignItems: 'center' },
  heroStatNum: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  heroStatLabel: { marginTop: 2 },
  secLabel: {
    fontSize: 10.5, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.1, paddingBottom: 8,
  },
  psychCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 18, padding: 15, marginBottom: 14,
    borderWidth: 0.5, borderColor: colors.border,
  },
  psychInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  psychAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  psychAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  psychName: { fontSize: 14, fontWeight: '700', color: colors.text },
  psychSpec: { marginTop: 2 },
  psychSince: { marginTop: 2 },
  activeBadge: {
    backgroundColor: `${colors.green}2E`,
    borderRadius: 10, paddingVertical: 3, paddingHorizontal: 9,
  },
  activeBadgeText: { fontSize: 10.5, fontWeight: '700', color: colors.green },
  psychDivider: { height: 0.5, backgroundColor: colors.border, marginVertical: 12 },
  psychActions: { flexDirection: 'row', gap: 7 },
  psychActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 12, paddingVertical: 9, paddingHorizontal: 8,
    borderWidth: 0.5, borderColor: colors.border,
  },
  psychActionText: { fontSize: 11.5, fontWeight: '600' },
  rematchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, marginTop: 10,
  },
  rematchText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#172433' },
  rowItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 15,
    borderRadius: 16, marginBottom: 7,
    borderWidth: 0.5, borderColor: colors.border,
  },
  rowItemHighlight: { borderColor: `${colors.gold}40` },
  riWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  rowSub: { marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: Spacing.three, paddingVertical: Spacing.three,
    borderRadius: 16, borderWidth: 0.5,
    borderColor: `${colors.rose}40`, backgroundColor: `${colors.rose}10`,
  },
});
