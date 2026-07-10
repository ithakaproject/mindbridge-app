import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
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
  specialties: string[];
  bio: string | null;
  patient_count: number;
  session_count: number;
  rating: number | null;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: baseProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: psychProfile } = await supabase
      .from('psychologist_profiles')
      .select('specialties, bio')
      .eq('id', user.id)
      .single();

    const { count: patientCount } = await supabase
      .from('patient_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', user.id);

    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', user.id);

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('psychologist_id', user.id);

    const avgRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    setProfile({
      full_name: baseProfile?.full_name ?? 'Doctor',
      email: user.email ?? '',
      specialties: psychProfile?.specialties ?? [],
      bio: psychProfile?.bio ?? null,
      patient_count: patientCount ?? 0,
      session_count: sessionCount ?? 0,
      rating: avgRating,
    });

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  async function handleLogout() {
    await supabase.auth.signOut();
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
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

  const initials = getInitials(profile?.full_name ?? 'Doctor');
  const ratingDisplay = profile?.rating ? `${profile.rating.toFixed(1)}★` : 'N/A';

  const ACCOUNT_ROWS: {
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
    tint: 'gold' | 'teal' | 'rose';
    title: string;
    sub?: string;
    onPress: () => void;
  }[] = [
    { key: 'personal', icon: 'person-outline', tint: 'gold', title: 'Personal information', sub: profile?.full_name, onPress: () => router.push('/psych-edit-profile') },
    { key: 'availability', icon: 'time-outline', tint: 'teal', title: 'Availability', sub: 'Manage your weekly hours', onPress: () => router.push({ pathname: '/(psych-tabs)/calendar', params: { mode: 'availability' } }) },
    { key: 'notifications', icon: 'notifications-outline', tint: 'gold', title: 'Notifications', sub: 'Coming soon', onPress: () => {} },
    { key: 'privacy', icon: 'shield-outline', tint: 'rose', title: 'Privacy & security', sub: 'Change password', onPress: () => router.push('/psych-change-password') },
    { key: 'help', icon: 'help-circle-outline', tint: 'teal', title: 'Help & support', sub: 'Coming soon', onPress: () => {} },
  ];

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.topBarRow}>
        <TopBar showNotification={false} />
        <Pressable onPress={() => router.push('/psych-edit-profile')} style={styles.editBtn}>
          <ThemedText type="small" themeColor="gold" style={{ fontWeight: '600' }}>Edit</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>

        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.tealDim, colors.teal]}
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
              <ThemedText themeColor="gold" style={styles.heroStatNum}>{profile?.patient_count}</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>Patients</ThemedText>
            </View>
            <View style={styles.heroStat}>
              <ThemedText themeColor="gold" style={styles.heroStatNum}>{profile?.session_count}</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>Sessions</ThemedText>
            </View>
            <View style={styles.heroStat}>
              <ThemedText themeColor="gold" style={styles.heroStatNum}>{ratingDisplay}</ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>Rating</ThemedText>
            </View>
          </View>
        </View>

        {profile?.specialties && profile.specialties.length > 0 && (
          <>
            <ThemedText style={styles.secLabel}>Specialties</ThemedText>
            <View style={styles.specRow}>
              {profile.specialties.map((s) => (
                <View key={s} style={styles.specTag}>
                  <ThemedText type="small" themeColor="teal" style={{ fontWeight: '600' }}>{s}</ThemedText>
                </View>
              ))}
            </View>
          </>
        )}

        {profile?.bio && (
          <>
            <ThemedText style={styles.secLabel}>Statement</ThemedText>
            <View style={styles.statementBox}>
              <ThemedText style={styles.statementText}>{profile.bio}</ThemedText>
            </View>
          </>
        )}

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
                  <ThemedText type="small" themeColor="textSecondary" style={styles.rowSub}>{row.sub}</ThemedText>
                )}
              </View>
              <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
            </ThemedView>
          </Pressable>
        ))}

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.rose} />
          <ThemedText type="smallBold" themeColor="rose">Log out</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBarRow: { position: 'relative' },
  editBtn: {
    position: 'absolute', right: Spacing.three, top: Spacing.three,
    backgroundColor: `${colors.gold}24`, borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12,
  },
  scroll: { flex: 1 },
  scrollContent: { alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: Spacing.three },
  hero: {
    backgroundColor: colors.backgroundSelected, borderRadius: 22, paddingVertical: 20, paddingHorizontal: 20,
    alignItems: 'center', marginBottom: 14, borderWidth: 0.5, borderColor: colors.border,
  },
  heroAvatar: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heroAvatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  heroName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, color: colors.text },
  heroEmail: { marginTop: 3 },
  heroStats: { flexDirection: 'row', gap: 16, marginTop: 12 },
  heroStat: { alignItems: 'center' },
  heroStatNum: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  heroStatLabel: { marginTop: 2 },
  secLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.1, paddingBottom: 8 },
  specRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  specTag: { backgroundColor: `${colors.teal}1F`, borderWidth: 0.5, borderColor: `${colors.teal}33`, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  statementBox: { backgroundColor: colors.backgroundElement, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: colors.border },
  statementText: { fontSize: 13, color: colors.textSecondary, lineHeight: 21, fontStyle: 'italic' },
  rowItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 15,
    borderRadius: 16, marginBottom: 7, borderWidth: 0.5, borderColor: colors.border,
  },
  riWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  rowSub: { marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: Spacing.three,
    paddingVertical: Spacing.three, borderRadius: 16, borderWidth: 0.5,
    borderColor: `${colors.rose}40`, backgroundColor: `${colors.rose}10`,
  },
});
