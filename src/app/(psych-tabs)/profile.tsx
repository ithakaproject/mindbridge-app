import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';

const colors = Colors.dark;

// TODO (Supabase): replace with the authenticated psychologist's real profile data
const DOCTOR = {
  initials: 'AP',
  name: 'Dr. Anita Patel',
  email: 'anita.patel@mindbridge.health',
  patients: 8,
  sessions: 312,
  rating: '4.9★',
  specialties: ['Anxiety', 'CBT', 'Mindfulness'],
  statement:
    'I believe healing is a collaborative journey. With compassion and evidence-based approaches, I help you build clarity, resilience, and lasting change.',
};

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
    onPress: () => console.log('open personal info'),
  },
  {
    key: 'availability',
    icon: 'time-outline',
    tint: 'teal',
    title: 'Availability',
    sub: 'Mon–Fri · 9 AM–5 PM',
    onPress: () => router.push({ pathname: '/calendar', params: { mode: 'availability' } }),
  },
  {
    key: 'notifications',
    icon: 'notifications-outline',
    tint: 'gold',
    title: 'Notifications',
    onPress: () => console.log('open notifications'),
  },
  {
    key: 'privacy',
    icon: 'shield-outline',
    tint: 'rose',
    title: 'Privacy & security',
    onPress: () => console.log('open privacy & security'),
  },
  {
    key: 'help',
    icon: 'help-circle-outline',
    tint: 'teal',
    title: 'Help & support',
    onPress: () => console.log('open help & support'),
  },
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

export default function ProfileScreen() {
  // TODO: wire up to a real edit-profile screen once it exists
  const openEdit = () => console.log('open edit profile');

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.topBarRow}>
        <TopBar showNotification={false} />
        <Pressable onPress={openEdit} style={styles.editBtn}>
          <ThemedText type="small" themeColor="gold" style={{ fontWeight: '600' }}>
            Edit
          </ThemedText>
        </Pressable>
      </View>

      <View
        style={[
          styles.scroll,
          { paddingBottom: BottomTabInset },
        ]}>
        <View style={styles.scrollContent}>
          {/* Hero card */}
          <View style={styles.hero}>
            <LinearGradient
              colors={[colors.tealDim, colors.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroAvatar}>
              <ThemedText style={styles.heroAvatarText}>{DOCTOR.initials}</ThemedText>
            </LinearGradient>
            <ThemedText style={styles.heroName}>{DOCTOR.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.heroEmail}>
              {DOCTOR.email}
            </ThemedText>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <ThemedText themeColor="gold" style={styles.heroStatNum}>
                  {DOCTOR.patients}
                </ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>
                  Patients
                </ThemedText>
              </View>
              <View style={styles.heroStat}>
                <ThemedText themeColor="gold" style={styles.heroStatNum}>
                  {DOCTOR.sessions}
                </ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>
                  Sessions
                </ThemedText>
              </View>
              <View style={styles.heroStat}>
                <ThemedText themeColor="gold" style={styles.heroStatNum}>
                  {DOCTOR.rating}
                </ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.heroStatLabel}>
                  Rating
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Specialties */}
          <ThemedText style={styles.secLabel}>Specialties</ThemedText>
          <View style={styles.specRow}>
            {DOCTOR.specialties.map((s) => (
              <View key={s} style={styles.specTag}>
                <ThemedText type="small" themeColor="teal" style={{ fontWeight: '600' }}>
                  {s}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Statement */}
          <ThemedText style={styles.secLabel}>Statement</ThemedText>
          <View style={styles.statementBox}>
            <ThemedText style={styles.statementText}>{DOCTOR.statement}</ThemedText>
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
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBarRow: {
    position: 'relative',
  },
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
    fontWeight: '700',
    color: '#fff',
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
  },
  heroEmail: {
    marginTop: 3,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatNum: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    marginTop: 2,
  },
  secLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingBottom: 8,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  specTag: {
    backgroundColor: `${colors.teal}1F`,
    borderWidth: 0.5,
    borderColor: `${colors.teal}33`,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  statementBox: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  statementText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
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
  riWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
  },
  rowSub: {
    marginTop: 2,
  },
});
