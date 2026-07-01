import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function generateTimeOptions() {
  const options: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 22 && minute === 30) continue;
      const period = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      options.push(`${displayHour}:${minute === 0 ? '00' : '30'} ${period}`);
    }
  }
  return options;
}
const TIME_OPTIONS = generateTimeOptions();

type DaySchedule = { enabled: boolean; start: string; end: string };
type ActivePicker = { day: string; field: 'start' | 'end' } | null;

export default function PsychHoursScreen() {
  const theme = useTheme();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(
    DAYS.reduce(
      (acc, day) => ({ ...acc, [day]: { enabled: false, start: '9:00 AM', end: '5:00 PM' } }),
      {} as Record<string, DaySchedule>
    )
  );
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  function toggleDay(day: string) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  }

  function setTime(day: string, field: 'start' | 'end', value: string) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setActivePicker(null);
  }

  function handleContinue() {
    // Pass the schedule as a JSON string to psych-account,
    // where it will be saved to Supabase after the user is created.
    router.push({
      pathname: '/psych-account',
      params: { schedule: JSON.stringify(schedule) },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.card}>
            <ThemedText type="title">Set your hours</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              Set your usual weekly availability. You'll be able to adjust these anytime from your calendar.
            </ThemedText>

            {DAYS.map((day) => {
              const daySchedule = schedule[day];
              return (
                <ThemedView key={day} type="backgroundElement" style={[styles.dayCard, { borderColor: theme.border }]}>
                  <ThemedView style={styles.dayHeader}>
                    <ThemedText type="smallBold">{day}</ThemedText>
                    <Switch
                      value={daySchedule.enabled}
                      onValueChange={() => toggleDay(day)}
                      trackColor={{ false: theme.border, true: theme.teal }}
                      thumbColor={theme.textOnAccent}
                    />
                  </ThemedView>

                  {daySchedule.enabled && (
                    <ThemedView style={styles.timeRow}>
                      <Pressable
                        style={[styles.timePill, { borderColor: theme.border }]}
                        onPress={() => setActivePicker({ day, field: 'start' })}>
                        <ThemedText type="small" themeColor="textSecondary">Start</ThemedText>
                        <ThemedText type="smallBold">{daySchedule.start}</ThemedText>
                      </Pressable>
                      <ThemedText type="small" themeColor="textSecondary">to</ThemedText>
                      <Pressable
                        style={[styles.timePill, { borderColor: theme.border }]}
                        onPress={() => setActivePicker({ day, field: 'end' })}>
                        <ThemedText type="small" themeColor="textSecondary">End</ThemedText>
                        <ThemedText type="smallBold">{daySchedule.end}</ThemedText>
                      </Pressable>
                    </ThemedView>
                  )}
                </ThemedView>
              );
            })}
          </ThemedView>
        </ScrollView>

        <ThemedView style={styles.footer}>
          <Pressable style={[styles.primaryBtn, { backgroundColor: theme.teal }]} onPress={handleContinue}>
            <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>Continue</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>

      <Modal visible={activePicker !== null} transparent animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: theme.overlay }]} onPress={() => setActivePicker(null)}>
          <ThemedView type="backgroundElement" style={styles.modalSheet}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              {activePicker?.field === 'start' ? 'Select start time' : 'Select end time'}
            </ThemedText>
            <ScrollView style={styles.modalScroll}>
              {TIME_OPTIONS.map((time) => (
                <Pressable
                  key={time}
                  style={styles.timeOption}
                  onPress={() => activePicker && setTime(activePicker.day, activePicker.field, time)}>
                  <ThemedText type="default">{time}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: Spacing.four },
  card: { width: '100%', maxWidth: MaxFormWidth, gap: Spacing.three },
  subtitle: { marginBottom: Spacing.two },
  dayCard: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  timePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: 2,
  },
  footer: { width: '100%', alignItems: 'center', paddingVertical: Spacing.three },
  primaryBtn: {
    width: '100%',
    maxWidth: MaxFormWidth,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    width: '85%',
    maxWidth: 320,
    maxHeight: 400,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalTitle: { textAlign: 'center' },
  modalScroll: { maxHeight: 280 },
  timeOption: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
});
