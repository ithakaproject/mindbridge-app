import { useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToggleSwitch } from '@/components/toggle-switch';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { PATIENTS } from '@/data/patients';

const colors = Colors.dark;

// TODO (Supabase + auth): look up the logged-in patient instead of hardcoding "aj"
const CURRENT_PATIENT = PATIENTS.aj;

export default function JournalEntryScreen() {
  const { index } = useLocalSearchParams<{ index: string }>();
  const entry = CURRENT_PATIENT.journal[Number(index)];
  // TODO (Supabase): persist this share decision against the entry record
  const [shared, setShared] = useState(false);

  if (!entry) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <ThemedText>Entry not found.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Journal Entry</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="small" themeColor="textTertiary" style={styles.date}>
          {entry.date}
        </ThemedText>
        <ThemedText style={styles.emoji}>{entry.emoji}</ThemedText>
        <View style={styles.tag}>
          <ThemedText style={styles.tagText}>{entry.tag}</ThemedText>
        </View>
        <ThemedText style={styles.body}>{entry.body}</ThemedText>

        <View style={styles.shareCard}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.shareTitle}>Share with Dr. Patel</ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.shareSub}>
              Grants view access to this entry
            </ThemedText>
          </View>
          <ToggleSwitch value={shared} onValueChange={setShared} size="small" />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: 13,
    paddingBottom: 10,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: 14,
    paddingBottom: 24,
  },
  date: {
    marginBottom: 7,
    fontWeight: '500',
  },
  emoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.teal}24`,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 11,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.teal,
  },
  body: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 25,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  shareTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  shareSub: {
    marginTop: 2,
  },
});
