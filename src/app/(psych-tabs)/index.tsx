import { useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';

const colors = Colors.dark;

// TODO (Supabase): replace with the authenticated psychologist's real name + greeting data
const DOCTOR_NAME = 'Dr. Anita Patel';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

// TODO (Supabase): replace with real stats + session data once backend is connected
const STATS = [
  { label: 'Patients', value: '8' },
  { label: 'Today', value: '4' },
  { label: 'Pending', value: '2' },
];

const TODAY_SESSIONS = [
  { id: 'aj', time: '3:00 PM', name: 'Alex Johnson', tag: 'Now', tagColor: colors.rose },
  { id: 'mc', time: '5:00 PM', name: 'Maya Chen', tag: 'Later', tagColor: colors.teal },
];

const TOMORROW_SESSIONS = [
  { id: 'dr', time: '9:00 AM', name: 'Daniel Rivera', tag: 'Tmrw', tagColor: colors.textTertiary },
  { id: 'pn', time: '11:30 AM', name: 'Priya Nair', tag: 'Tmrw', tagColor: colors.textTertiary },
];

export default function HomeScreen() {
  const [linkRevealed, setLinkRevealed] = useState(false);

  const openPatient = (id: string) => {
    router.push(`/patient/${id}`);
  };

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
          <ThemedText style={styles.greetingName}>{DOCTOR_NAME}</ThemedText>
        </View>

        {/* Focus card — next session */}
        <Pressable onPress={() => setLinkRevealed((v) => !v)} style={styles.focusCard}>
          <LinearGradient
            colors={[colors.tealDeep, colors.tealDim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.focusInner}>
            <View style={styles.focusGlow} />
            <ThemedText style={styles.focusEyebrow}>NEXT SESSION</ThemedText>
            <ThemedText style={styles.focusTitle}>Alex Johnson</ThemedText>
            <ThemedText style={styles.focusSub}>Today · 3:00 – 3:50 PM · In 2 hours</ThemedText>
          </LinearGradient>
          <View style={styles.focusAction}>
            <ThemedText style={styles.focusActionLabel}>
              {linkRevealed ? 'Tap to hide meeting link' : 'Tap to reveal meeting link'}
            </ThemedText>
            <Ionicons name="videocam" size={16} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>

        {linkRevealed && (
          <View style={styles.linkCard}>
            <Ionicons name="videocam" size={18} color={colors.teal} />
            <ThemedText style={styles.linkText}>meet.google.com/xyz-abcd-efg</ThemedText>
            <Pressable style={styles.linkBtn}>
              <ThemedText type="small" style={styles.linkBtnText}>
                Start
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Stat strip */}
        <View style={styles.statStrip}>
          {STATS.map((stat) => (
            <ThemedView key={stat.label} type="backgroundElement" style={styles.statCard}>
              <ThemedText themeColor="gold" style={styles.statNum}>
                {stat.value}
              </ThemedText>
              <ThemedText type="small" themeColor="textTertiary" style={styles.statLabel}>
                {stat.label}
              </ThemedText>
            </ThemedView>
          ))}
        </View>

        {/* Today */}
        <View style={styles.secLabelRow}>
          <ThemedText style={styles.secMain}>Today</ThemedText>
          <Pressable onPress={() => router.push('/calendar')}>
            <ThemedText type="small" themeColor="teal">
              Full calendar
            </ThemedText>
          </Pressable>
        </View>
        {TODAY_SESSIONS.map((s) => (
          <SessionSlot key={s.id} session={s} onPress={() => openPatient(s.id)} />
        ))}

        {/* Tomorrow */}
        <ThemedText style={[styles.secLabel, { marginTop: Spacing.two }]}>Tomorrow</ThemedText>
        {TOMORROW_SESSIONS.map((s) => (
          <SessionSlot key={s.id} session={s} onPress={() => openPatient(s.id)} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

type Session = { id: string; time: string; name: string; tag: string; tagColor: string };

function SessionSlot({ session, onPress }: { session: Session; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.slotItem}>
        <ThemedText themeColor="gold" style={styles.slotTime}>
          {session.time}
        </ThemedText>
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
