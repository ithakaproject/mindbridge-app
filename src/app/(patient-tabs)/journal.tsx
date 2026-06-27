import { ThemedText } from '@/components/themed-text';
import { TopBar } from '@/components/top-bar';
import { BottomTabInset, Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { PATIENTS } from '@/data/patients';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

const colors = Colors.dark;

// TODO (Supabase + auth): look up the logged-in patient instead of hardcoding "aj"
const CURRENT_PATIENT = PATIENTS.aj;

function moodBarColor(v: number) {
  if (v <= 3) return colors.rose;
  if (v <= 5) return colors.amber;
  return colors.green;
}

export default function PatientJournalScreen() {
  const mood = CURRENT_PATIENT.mood;
  const trendUp = mood[mood.length - 1] >= mood[mood.length - 2];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>
        <View style={styles.greeting}>
          <ThemedText type="small" themeColor="textSecondary">
            Your private space
          </ThemedText>
          <ThemedText style={styles.greetingTitle}>Journal</ThemedText>
        </View>

        {/* Mood sparkline */}
        <View style={styles.sparkCard}>
          <View style={styles.sparkHeader}>
            <ThemedText style={styles.sparkTitle}>Your mood — last {mood.length} entries</ThemedText>
            <ThemedText type="small" style={[styles.sparkAvg, { color: trendUp ? colors.green : colors.rose }]}>
              {trendUp ? '↑ Trending better' : '↓ Trending down'}
            </ThemedText>
          </View>
          <View style={styles.sparkline}>
            {mood.map((v, i) => (
              <View key={i} style={[styles.sparkBar, { height: `${(v / 10) * 100}%`, backgroundColor: moodBarColor(v) }]} />
            ))}
          </View>
          <View style={styles.sparkLabels}>
            <ThemedText type="small" themeColor="textTertiary">
              Aug 1
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary">
              Aug 25
            </ThemedText>
          </View>
        </View>

        {/* New entry */}
        <Pressable onPress={() => router.push('/journal-write')} style={styles.newEntryBtn}>
          <Ionicons name="pencil" size={17} color={colors.gold} />
          <ThemedText style={styles.newEntryText}>What's on your mind today?</ThemedText>
          <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
        </Pressable>

        {/* Recent entries */}
        <ThemedText style={styles.secLabel}>Recent entries</ThemedText>
        {CURRENT_PATIENT.journal.map((entry, i) => (
          <Pressable key={i} onPress={() => router.push({ pathname: '/journal-entry', params: { index: i } })}>
            <View style={styles.jCard}>
              <ThemedText style={styles.jEmoji}>{entry.emoji}</ThemedText>
              <View style={styles.jInfo}>
                <ThemedText style={styles.jDate}>{entry.date}</ThemedText>
                <View style={styles.jTag}>
                  <ThemedText style={styles.jTagText}>{entry.tag}</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textTertiary" style={styles.jPreview} numberOfLines={1}>
                  {entry.preview}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
            </View>
          </Pressable>
        ))}
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
  greeting: {
    paddingHorizontal: Spacing.two,
    paddingBottom: 8,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
  },
  sparkCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 18,
    padding: 14,
    marginBottom: Spacing.three,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  sparkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sparkTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  sparkAvg: {
    fontWeight: '600',
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 36,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 4,
  },
  sparkLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  newEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${colors.gold}10`,
    borderWidth: 0.5,
    borderColor: `${colors.gold}38`,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: Spacing.three,
  },
  newEntryText: {
    flex: 1,
    fontSize: 13.5,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  secLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingBottom: 8,
  },
  jCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 15,
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    marginBottom: 7,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  jEmoji: {
    fontSize: 22,
  },
  jInfo: {
    flex: 1,
    minWidth: 0,
  },
  jDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  jTag: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.teal}24`,
    borderRadius: 7,
    paddingVertical: 2,
    paddingHorizontal: 7,
    marginTop: 2,
  },
  jTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.teal,
  },
  jPreview: {
    marginTop: 3,
  },
});
