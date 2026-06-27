import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ToggleSwitch } from '@/components/toggle-switch';
import { SuccessModal } from '@/components/success-modal';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';

const colors = Colors.dark;

const WRITE_MOODS = [
  { emoji: '😔', label: 'Anxious' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🙂', label: 'Hopeful' },
  { emoji: '😊', label: 'Calm' },
  { emoji: '😄', label: 'Happy' },
];

export default function JournalWriteScreen() {
  const [selectedMood, setSelectedMood] = useState('Hopeful');
  const [text, setText] = useState('');
  const [shared, setShared] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // TODO (Supabase): persist the entry instead of just showing a success message
  const handleSave = () => {
    if (!text.trim()) return;
    setSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    router.back();
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>New Entry</ThemedText>
        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <ThemedText style={styles.saveBtnText}>Save</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.label}>HOW ARE YOU FEELING?</ThemedText>
        <View style={styles.moodRow}>
          {WRITE_MOODS.map((m) => {
            const selected = selectedMood === m.label;
            return (
              <Pressable key={m.label} onPress={() => setSelectedMood(m.label)} style={styles.moodOpt}>
                <View style={[styles.moodOrb, selected && styles.moodOrbSelected]}>
                  <ThemedText style={styles.moodEmoji}>{m.emoji}</ThemedText>
                </View>
                <ThemedText type="small" style={[styles.moodLbl, selected && styles.moodLblSelected]}>
                  {m.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={[styles.label, { marginBottom: 8 }]}>YOUR THOUGHTS</ThemedText>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write freely — this is your space…"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={6}
          style={styles.textarea}
        />

        <View style={styles.shareRow}>
          <ThemedText type="small" themeColor="textTertiary">
            Share with Dr. Patel
          </ThemedText>
          <ToggleSwitch value={shared} onValueChange={setShared} size="small" />
        </View>
        <ThemedText type="small" themeColor="textTertiary" style={styles.shareHint}>
          Private by default · Only shared if you enable the toggle
        </ThemedText>
      </ScrollView>

      <SuccessModal
        visible={successOpen}
        onClose={handleSuccessClose}
        icon="📖"
        title="Entry saved!"
        subtitle="Your journal entry has been saved privately."
      />
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
  saveBtn: {
    backgroundColor: colors.tealDim,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: 14,
    paddingBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  moodOpt: {
    alignItems: 'center',
    gap: 4,
  },
  moodOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodOrbSelected: {
    borderColor: colors.gold,
    backgroundColor: `${colors.gold}24`,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLbl: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  moodLblSelected: {
    color: colors.gold,
  },
  textarea: {
    backgroundColor: colors.backgroundSelected,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 13,
    fontSize: 13.5,
    color: colors.text,
    fontStyle: 'italic',
    minHeight: 130,
    textAlignVertical: 'top',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  shareHint: {
    marginTop: 6,
    lineHeight: 16,
  },
});
