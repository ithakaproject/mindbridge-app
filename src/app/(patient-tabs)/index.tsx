import { useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';

const colors = Colors.dark;

// TODO (Supabase): replace with the authenticated patient's real name + greeting data
const PATIENT_NAME = 'Alex Johnson';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

const MOODS = [
  { key: 'low', emoji: '😔', label: 'Low' },
  { key: 'anxious', emoji: '😟', label: 'Anxious' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'great', emoji: '😄', label: 'Great' },
];

// TODO (Supabase): replace with the patient's real check-in streak
const MOOD_STREAK = 7;

// TODO (Supabase): replace with real counts once backend is connected
const STATS = [
  { label: 'Upcoming', value: '3' },
  { label: 'Pending', value: '2' },
  { label: 'Entries', value: '28' },
];

type TagColor = 'rose' | 'teal' | 'gold' | 'amber' | 'green' | 'textTertiary';

const UPCOMING_SESSIONS: { title: string; sub: string; tag: string; tagColor: TagColor; onPress: () => void }[] = [
  {
    title: 'Dr. Anita Patel',
    sub: 'Today · 3:00 PM · In 2 hrs',
    tag: 'Now',
    tagColor: 'rose',
    onPress: () => router.push('/chat'),
  },
  {
    title: 'Dr. Anita Patel',
    sub: 'Thu May 29 · 10:00 AM',
    tag: 'Thu',
    tagColor: 'textTertiary',
    onPress: () => router.push('/schedule'),
  },
];

const ASSIGNMENTS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  tag: string;
  tagColor: TagColor;
  desc: string;
}[] = [
  {
    icon: 'clipboard-outline',
    title: 'CBT Thought Record',
    sub: 'Due today',
    tag: 'Urgent',
    tagColor: 'rose',
    desc: 'Complete your automatic thoughts log. Identify the situation, your automatic thought, emotion, and a balanced alternative thought.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Evening Mindfulness',
    sub: 'Daily · 10 min',
    tag: 'Daily',
    tagColor: 'teal',
    desc: 'A 10-minute guided breathing exercise. Best done 30 min before sleep. Focus on slow exhales — 4 counts in, 6 out.',
  },
  {
    icon: 'pencil',
    title: 'Week 3 Reflection',
    sub: 'Due May 30',
    tag: 'Soon',
    tagColor: 'amber',
    desc: 'Write a short reflection on patterns you noticed this week. What triggered anxiety? What coping strategies worked?',
  },
];

const COURSES = [
  {
    emoji: '❤️',
    title: 'Self Love',
    pct: 70,
    sub: 'Module 5 of 7 · 1 left this week',
    desc: 'Building self-compassion practices for daily life. This module focuses on inner critic work.',
  },
  {
    emoji: '🧠',
    title: 'Anxiety Management',
    pct: 35,
    sub: 'Module 3 of 8 · 2 new lessons',
    desc: 'Understanding the cognitive model of anxiety and how thoughts drive feelings.',
  },
];

export default function PatientHomeScreen() {
  const [linkRevealed, setLinkRevealed] = useState(false);
  // TODO (Supabase): persist today's mood check-in instead of local-only state
  const [selectedMood, setSelectedMood] = useState('good');

  const openAssignment = (item: { title: string; sub: string; tag: string; tagColor: TagColor; desc: string }) => {
    router.push({
      pathname: '/assignment',
      params: { title: item.title, desc: item.desc, sub: item.sub, tagColor: item.tagColor },
    });
  };

  return (
    <ThemedView style={styles.screen}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>
        <View style={styles.greeting}>
          <ThemedText type="small" themeColor="textSecondary">
            {getGreeting()}
          </ThemedText>
          <ThemedText style={styles.greetingName}>{PATIENT_NAME}</ThemedText>
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
            <ThemedText style={styles.focusTitle}>Dr. Anita Patel</ThemedText>
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
                Join
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Mood check-in */}
        <View style={styles.moodCard}>
          <View style={styles.moodTop}>
            <ThemedText style={styles.moodLabel}>HOW ARE YOU FEELING?</ThemedText>
            <ThemedText type="small" style={styles.moodStreak}>
              🔥 {MOOD_STREAK} day streak
            </ThemedText>
          </View>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const selected = selectedMood === m.key;
              return (
                <Pressable key={m.key} onPress={() => setSelectedMood(m.key)} style={styles.moodBtn}>
                  <View style={[styles.moodOrb, selected && styles.moodOrbSelected]}>
                    <ThemedText style={styles.moodEmoji}>{m.emoji}</ThemedText>
                  </View>
                  <ThemedText type="small" style={[styles.moodWord, selected && styles.moodWordSelected]}>
                    {m.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

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

        {/* Upcoming sessions */}
        <View style={styles.secLabelRow}>
          <ThemedText style={styles.secMain}>Upcoming sessions</ThemedText>
          <Pressable onPress={() => router.push('/schedule')}>
            <ThemedText type="small" themeColor="teal">
              See all
            </ThemedText>
          </Pressable>
        </View>
        {UPCOMING_SESSIONS.map((s, i) => (
          <Pressable key={i} onPress={s.onPress}>
            <ThemedView type="backgroundElement" style={styles.rowItem}>
              <View style={[styles.riWrap, { backgroundColor: `${colors.teal}26` }]}>
                <Ionicons name="person" size={19} color={colors.teal} />
              </View>
              <View style={styles.rowInfo}>
                <ThemedText style={styles.rowTitle}>{s.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.rowSub}>
                  {s.sub}
                </ThemedText>
              </View>
              <View style={[styles.tag, { backgroundColor: `${colors[s.tagColor]}2E` }]}>
                <ThemedText style={[styles.tagText, { color: colors[s.tagColor] }]}>{s.tag}</ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        ))}

        {/* Assignments */}
        <View style={[styles.secLabelRow, { marginTop: 4 }]}>
          <ThemedText style={styles.secMain}>Assignments</ThemedText>
          <View style={styles.dueBadge}>
            <ThemedText style={styles.dueBadgeText}>2 due</ThemedText>
          </View>
        </View>
        {ASSIGNMENTS.map((a, i) => (
          <Pressable key={i} onPress={() => openAssignment(a)}>
            <ThemedView type="backgroundElement" style={styles.rowItem}>
              <View style={[styles.riWrap, { backgroundColor: `${colors.gold}26` }]}>
                <Ionicons name={a.icon} size={19} color={colors.gold} />
              </View>
              <View style={styles.rowInfo}>
                <ThemedText style={styles.rowTitle}>{a.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.rowSub}>
                  {a.sub}
                </ThemedText>
              </View>
              <View style={[styles.tag, { backgroundColor: `${colors[a.tagColor]}2E` }]}>
                <ThemedText style={[styles.tagText, { color: colors[a.tagColor] }]}>{a.tag}</ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        ))}

        {/* Courses */}
        <View style={styles.secLabelRow}>
          <ThemedText style={styles.secMain}>Your courses</ThemedText>
          <ThemedText type="small" themeColor="teal">
            Browse
          </ThemedText>
        </View>
        {COURSES.map((c, i) => (
          <Pressable
            key={i}
            onPress={() =>
              openAssignment({ title: c.title, sub: c.sub, tag: '', tagColor: 'gold', desc: c.desc })
            }>
            <View style={styles.progItem}>
              <View style={styles.progHeader}>
                <ThemedText style={styles.progIcon}>{c.emoji}</ThemedText>
                <ThemedText style={styles.progTitle}>{c.title}</ThemedText>
                <ThemedText themeColor="gold" style={styles.progPct}>
                  {c.pct}%
                </ThemedText>
              </View>
              <View style={styles.progBar}>
                <View style={[styles.progFill, { width: `${c.pct}%` }]} />
              </View>
              <ThemedText type="small" themeColor="textTertiary" style={styles.progSub}>
                {c.sub}
              </ThemedText>
            </View>
          </Pressable>
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
  moodCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 18,
    padding: 14,
    marginBottom: Spacing.three,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  moodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  moodStreak: {
    color: colors.amber,
    fontWeight: '600',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    alignItems: 'center',
    gap: 4,
  },
  moodOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodOrbSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}26`,
  },
  moodEmoji: {
    fontSize: 19,
  },
  moodWord: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  moodWordSelected: {
    color: colors.gold,
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
  secMain: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  dueBadge: {
    backgroundColor: colors.rose,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  dueBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  progItem: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: 14,
    marginBottom: 7,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  progHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  progIcon: {
    fontSize: 17,
  },
  progTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  progPct: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  progBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  progSub: {
    marginTop: 6,
  },
});
