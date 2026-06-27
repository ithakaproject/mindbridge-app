import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { RematchModal } from '@/components/rematch-modal';
import { useState } from 'react';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';

const colors = Colors.dark;

// TODO (Supabase): replace with the authenticated patient's real profile data
const PATIENT = {
  initials: 'AJ',
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  sessions: 12,
  entries: 28,
  courses: 5,
};

const PSYCHOLOGIST = {
  initials: 'AP',
  name: 'Dr. Anita Patel',
  specialties: 'Anxiety · CBT · Mindfulness',
  since: 'With you since March 2025',
};

const ACCOUNT_ROWS: {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: 'gold' | 'teal' | 'rose';
  title: string;
  sub?: string;
  onPress: () => void;
}[] = [
  { key: 'personal', icon: 'person-outline', tint: 'gold', title: 'Personal information', onPress: () => console.log('open personal info') },
  { key: 'language', icon: 'globe-outline', tint: 'teal', title: 'Language', sub: 'English', onPress: () => console.log('open language settings') },
  { key: 'notifications', icon: 'notifications-outline', tint: 'gold', title: 'Notifications', onPress: () => console.log('open notifications') },
  { key: 'privacy', icon: 'shield-outline', tint: 'rose', title: 'Privacy & security', onPress: () => console.log('open privacy & security') },
  { key: 'help', icon: 'help-circle-outline', tint: 'teal', title: 'Help & support', onPress: () => console.log('open help & support') },
];

const BILLING_ROWS: {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  highlight?: boolean;
  onPress: () => void;
}[] = [
  { key: 'plan', icon: 'star-outline', title: 'Current plan', sub: 'Premium · $49/mo', highlight: true, onPress: () => console.log('open billing') },
  { key: 'method', icon: 'card-outline', title: 'Payment method', sub: 'Visa •••• 4242', onPress: () => console.log('open billing') },
  { key: 'history', icon: 'receipt-outline', title: 'Billing history', sub: 'Last charge May 1, 2025', onPress: () => console.log('open billing') },
];

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

export default function PatientProfileScreen() {
  const [rematchOpen, setRematchOpen] = useState(false);

  const handleRematchSubmit = (reason: string, details: string) => {
    console.log('rematch request submitted', { reason, details });
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.topBarRow}>
        <TopBar showNotification={false} />
        <Pressable onPress={() => console.log('open edit profile')} style={styles.editBtn}>
          <ThemedText type="small" themeColor="gold" style={{ fontWeight: '600' }}>
            Edit
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.scroll, { paddingBottom: BottomTabInset }]}>
        <View style={styles.scrollContent}>
          {/* Hero card */}
          <View style={styles.hero}>
            <LinearGradient
              colors={[colors.goldDim, colors.gold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroAvatar}>
              <ThemedText style={styles.heroAvatarText}>{PATIENT.initials}</ThemedText>
            </LinearGradient>
            <ThemedText style={styles.heroName}>{PATIENT.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.heroEmail}>
              {PATIENT.email}
            </ThemedText>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <ThemedText themeColor="gold" style={styles.heroStatNum}>
                  {PATIENT.sessions}
                </ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>
                  Sessions
                </ThemedText>
              </View>
              <View style={styles.heroStat}>
                <ThemedText themeColor="gold" style={styles.heroStatNum}>
                  {PATIENT.entries}
                </ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>
                  Entries
                </ThemedText>
              </View>
              <View style={styles.heroStat}>
                <ThemedText themeColor="gold" style={styles.heroStatNum}>
                  {PATIENT.courses}
                </ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>
                  Courses
                </ThemedText>
              </View>
            </View>
          </View>

          {/* My psychologist */}
          <ThemedText style={styles.secLabel}>My psychologist</ThemedText>
          <View style={styles.psychCard}>
            <View style={styles.psychInner}>
              <LinearGradient
                colors={[colors.tealDim, colors.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.psychAvatar}>
                <ThemedText style={styles.psychAvatarText}>{PSYCHOLOGIST.initials}</ThemedText>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.psychName}>{PSYCHOLOGIST.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.psychSpec}>
                  {PSYCHOLOGIST.specialties}
                </ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.psychSince}>
                  {PSYCHOLOGIST.since}
                </ThemedText>
              </View>
              <View style={styles.activeBadge}>
                <ThemedText style={styles.activeBadgeText}>Active</ThemedText>
              </View>
            </View>

            <View style={styles.psychDivider} />

            <View style={styles.psychActions}>
              <Pressable onPress={() => router.push('/chat')} style={styles.psychActionBtn}>
                <Ionicons name="chatbubble-outline" size={15} color={colors.teal} />
                <ThemedText style={[styles.psychActionText, { color: colors.teal }]}>Message</ThemedText>
              </Pressable>
              <Pressable onPress={() => router.push('/schedule')} style={styles.psychActionBtn}>
                <Ionicons name="calendar-outline" size={15} color={colors.gold} />
                <ThemedText style={[styles.psychActionText, { color: colors.gold }]}>Book</ThemedText>
              </Pressable>
              <Pressable onPress={() => console.log('join call')} style={styles.psychActionBtn}>
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
                  {row.sub ? (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.rowSub}>
                      {row.sub}
                    </ThemedText>
                  ) : null}
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
        </View>
      </View>

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
  editBtn: {
    position: 'absolute',
    right: Spacing.three,
    top: Spacing.three,
    backgroundColor: `${colors.gold}24`,
    borderWidth: 0.5,
    borderColor: colors.goldDim,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  hero: {
    backgroundColor: colors.backgroundSelected,
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  heroAvatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.background,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  heroEmail: { marginTop: 3 },
  heroStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 13,
  },
  heroStat: { alignItems: 'center' },
  heroStatNum: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroStatLabel: { marginTop: 2 },
  secLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingBottom: 8,
  },
  psychCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  psychInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  psychAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  psychAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  psychName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  psychSpec: { marginTop: 2 },
  psychSince: { marginTop: 2 },
  activeBadge: {
    backgroundColor: `${colors.green}2E`,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  activeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.green,
  },
  psychDivider: {
    height: 0.5,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  psychActions: {
    flexDirection: 'row',
    gap: 7,
  },
  psychActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  psychActionText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  rematchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  rematchText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#172433',
  },
  rowItem: {
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
  rowItemHighlight: {
    borderColor: `${colors.gold}40`,
  },
  riWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  rowSub: { marginTop: 2 },
});
