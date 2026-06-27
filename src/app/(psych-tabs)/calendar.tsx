import { useMemo, useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { ToggleSwitch } from '@/components/toggle-switch';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { PATIENTS } from '@/data/patients';
import { SESSIONS_BY_DATE } from '@/data/sessions';

const colors = Colors.dark;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// TODO (Supabase): replace with the psychologist's real availability settings
const AVAILABILITY = [
  { day: 'Mon', hours: '9:00 AM – 5:00 PM', available: true },
  { day: 'Tue', hours: '9:00 AM – 5:00 PM', available: true },
  { day: 'Wed', hours: '10:00 AM – 3:00 PM', available: true },
  { day: 'Thu', hours: '9:00 AM – 5:00 PM', available: true },
  { day: 'Fri', hours: '9:00 AM – 1:00 PM', available: true },
  { day: 'Sat', hours: 'Not available', available: false },
  { day: 'Sun', hours: 'Not available', available: false },
];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${month + 1}-${day}`;
}

import { useLocalSearchParams } from 'expo-router';

export default function CalendarScreen() {
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();
  const today = new Date();
  const [mode, setMode] = useState<'sessions' | 'availability'>(
    initialMode === 'availability' ? 'availability' : 'sessions',
  );
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [availability, setAvailability] = useState(AVAILABILITY);

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const { leadingBlanks, daysInMonth } = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const days = new Date(viewYear, viewMonth + 1, 0).getDate();
    return { leadingBlanks: firstWeekday, daysInMonth: days };
  }, [viewYear, viewMonth]);

  const changeMonth = (dir: 1 | -1) => {
    setSelectedDay(null);
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 11) {
      m = 0;
      y += 1;
    } else if (m < 0) {
      m = 11;
      y -= 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectedSessions =
    selectedDay != null ? SESSIONS_BY_DATE[dateKey(viewYear, viewMonth, selectedDay)] ?? [] : [];

  const openPatient = (patientId: string) => {
    router.push({ pathname: '/patient/[id]', params: { id: patientId } });
  };

  const toggleAvailability = (index: number) => {
    setAvailability((prev) =>
      prev.map((row, i) => (i === index ? { ...row, available: !row.available } : row)),
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>
        {/* Mode pills */}
        <View style={styles.pillRow}>
          <Pressable
            onPress={() => setMode('sessions')}
            style={[styles.pill, mode === 'sessions' && styles.pillOn]}>
            <ThemedText style={[styles.pillText, mode === 'sessions' && styles.pillTextOn]}>
              Sessions
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setMode('availability')}
            style={[styles.pill, mode === 'availability' && styles.pillOn]}>
            <ThemedText style={[styles.pillText, mode === 'availability' && styles.pillTextOn]}>
              Availability
            </ThemedText>
          </Pressable>
        </View>

        {/* Month nav */}
        <View style={styles.monthNav}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={15} color={colors.textSecondary} />
          </Pressable>
          <ThemedText style={styles.monthLabel}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </ThemedText>
          <Pressable onPress={() => changeMonth(1)} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Weekday header */}
        <View style={styles.weekdaysRow}>
          {WEEKDAY_LABELS.map((w, i) => (
            <ThemedText key={i} type="small" themeColor="textTertiary" style={styles.weekdayLabel}>
              {w}
            </ThemedText>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.grid}>
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasEvents = !!SESSIONS_BY_DATE[dateKey(viewYear, viewMonth, day)];
            const isPast = isCurrentMonth && day < today.getDate();
            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = selectedDay === day;

            return (
              <Pressable
                key={day}
                disabled={isPast}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayCell,
                  !isPast && styles.dayCellCurrent,
                  isToday && styles.dayCellToday,
                  hasEvents && !isPast && styles.dayCellHasEvent,
                  isSelected && styles.dayCellSelected,
                ]}>
                <ThemedText
                  style={[
                    styles.dayText,
                    isPast && styles.dayTextPast,
                    !isPast && styles.dayTextCurrent,
                    isToday && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                  ]}>
                  {day}
                </ThemedText>
                {hasEvents && !isPast && (
                  <View style={[styles.dot, isSelected && styles.dotSelected]} />
                )}
              </Pressable>
            );
          })}
        </View>

        {mode === 'sessions' ? (
          <>
            <ThemedText style={styles.secLabel}>
              {selectedDay != null
                ? `${MONTH_SHORT[viewMonth]} ${selectedDay} — sessions`
                : 'Select a day'}
            </ThemedText>
            {selectedSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyEmoji}>📅</ThemedText>
                <ThemedText style={styles.emptyTitle}>No sessions</ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.emptySub}>
                  No sessions scheduled on this day. Enjoy the quiet!
                </ThemedText>
              </View>
            ) : (
              selectedSessions.map((s, i) => {
                const patient = PATIENTS[s.patientId];
                return (
                  <Pressable key={i} onPress={() => openPatient(s.patientId)}>
                    <ThemedView type="backgroundElement" style={styles.slotItem}>
                      <ThemedText themeColor="gold" style={styles.slotTime}>
                        {s.time}
                      </ThemedText>
                      <ThemedText style={styles.slotName}>{patient?.name ?? 'Unknown patient'}</ThemedText>
                      <ThemedText type="small" themeColor="textTertiary">
                        {s.duration}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })
            )}
          </>
        ) : (
          <>
            <ThemedText style={styles.secLabel}>Available hours</ThemedText>
            {availability.map((row, i) => (
              <View key={row.day} style={styles.availRow}>
                <ThemedText style={styles.availDay}>{row.day}</ThemedText>
                <ThemedText
                  type="small"
                  style={[styles.availHours, !row.available && styles.availHoursOff]}>
                  {row.hours}
                </ThemedText>
                <ToggleSwitch value={row.available} onValueChange={() => toggleAvailability(i)} />
              </View>
            ))}
          </>
        )}
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
  pillRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: colors.backgroundElement,
  },
  pillOn: {
    backgroundColor: colors.gold,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  pillTextOn: {
    color: colors.background,
    fontWeight: '700',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom: 3,
    position: 'relative',
  },
  dayCellCurrent: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.tealDim,
  },
  dayCellHasEvent: {
    borderColor: `${colors.teal}4D`,
  },
  dayCellSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dayText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  dayTextPast: {
    color: 'rgba(90,122,140,0.3)',
  },
  dayTextCurrent: {
    color: colors.text,
  },
  dayTextToday: {
    color: colors.teal,
  },
  dayTextSelected: {
    color: colors.background,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.teal,
    position: 'absolute',
    bottom: 5,
  },
  dotSelected: {
    backgroundColor: colors.background,
  },
  secLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    textAlign: 'center',
    lineHeight: 18,
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
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.backgroundElement,
    borderRadius: 13,
    marginBottom: 7,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  availDay: {
    fontSize: 13,
    fontWeight: '600',
    width: 34,
    color: colors.text,
  },
  availHours: {
    flex: 1,
    color: colors.teal,
  },
  availHoursOff: {
    color: colors.textTertiary,
  },
});
