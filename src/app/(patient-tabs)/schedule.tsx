import { useMemo, useState } from 'react';
import { ScrollView, View, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { SuccessModal } from '@/components/success-modal';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { INITIAL_BOOKED_DATES, AVAILABILITY } from '@/data/schedule';

const colors = Colors.dark;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${month + 1}-${day}`;
}

export default function ScheduleScreen() {
  const today = new Date();
  const [mode, setMode] = useState<'book' | 'rebook'>('book');
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // TODO (Supabase): persist bookings instead of local-only state
  const [bookedDates, setBookedDates] = useState(INITIAL_BOOKED_DATES);
  const [pickedTime, setPickedTime] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

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

  const selectedKey = selectedDay != null ? dateKey(viewYear, viewMonth, selectedDay) : null;
  const isSelectedBooked = selectedKey ? bookedDates.has(selectedKey) : false;
  const selectedSlots = selectedKey ? AVAILABILITY[selectedKey] ?? [] : [];

  const pickSlot = (time: string) => {
    setPickedTime(time);
    setConfirmOpen(true);
  };

  const confirmBooking = () => {
    if (selectedKey) {
      setBookedDates((prev) => new Set(prev).add(selectedKey));
    }
    setConfirmOpen(false);
    setSuccessOpen(true);
  };

  return (
    <ThemedView style={styles.screen}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>
        {/* Mode pills */}
        <View style={styles.pillRow}>
          <Pressable onPress={() => setMode('book')} style={[styles.pill, mode === 'book' && styles.pillOn]}>
            <ThemedText style={[styles.pillText, mode === 'book' && styles.pillTextOn]}>
              Book session
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setMode('rebook')}
            style={[styles.pill, mode === 'rebook' && styles.pillOn]}>
            <ThemedText style={[styles.pillText, mode === 'rebook' && styles.pillTextOn]}>
              Reschedule
            </ThemedText>
          </Pressable>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.teal }]} />
            <ThemedText type="small" themeColor="textTertiary">
              Available
            </ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
            <ThemedText type="small" themeColor="textTertiary">
              Booked
            </ThemedText>
          </View>
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
            const key = dateKey(viewYear, viewMonth, day);
            const isBooked = bookedDates.has(key);
            const hasAvailability = !!AVAILABILITY[key];
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
                  isBooked && !isPast && styles.dayCellBooked,
                  hasAvailability && !isBooked && !isPast && styles.dayCellHasAvailability,
                  isSelected && styles.dayCellSelected,
                ]}>
                <ThemedText
                  style={[
                    styles.dayText,
                    isPast && styles.dayTextPast,
                    !isPast && styles.dayTextCurrent,
                    isToday && styles.dayTextToday,
                    isBooked && !isPast && styles.dayTextBooked,
                    isSelected && styles.dayTextSelected,
                  ]}>
                  {day}
                </ThemedText>
                {!isPast && !isSelected && (isBooked || hasAvailability) && (
                  <View
                    style={[styles.dot, { backgroundColor: isBooked ? colors.gold : colors.teal }]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Slots */}
        {selectedDay == null ? (
          <ThemedText style={styles.slotsLabelEmpty}>Select a date</ThemedText>
        ) : (
          <ThemedText style={styles.slotsLabel}>
            {MONTH_SHORT[viewMonth]} {selectedDay}
          </ThemedText>
        )}

        {isSelectedBooked && (
          <View style={styles.bookedSlot}>
            <ThemedText style={styles.bookedSlotTime}>Booked</ThemedText>
            <ThemedText style={styles.slotDoc}>Dr. Anita Patel</ThemedText>
            <ThemedText style={styles.bookedLabel}>Confirmed ✓</ThemedText>
          </View>
        )}

        {selectedDay != null && !isSelectedBooked && selectedSlots.length === 0 && (
          <ThemedText type="small" themeColor="textTertiary" style={styles.noSlots}>
            No slots on this date.
          </ThemedText>
        )}

        {!isSelectedBooked &&
          selectedSlots.map((slot, i) => (
            <Pressable key={i} onPress={() => pickSlot(slot.time)}>
              <ThemedView type="backgroundElement" style={styles.slotItem}>
                <ThemedText themeColor="gold" style={styles.slotTime}>
                  {slot.time}
                </ThemedText>
                <ThemedText style={styles.slotDoc}>Dr. Anita Patel</ThemedText>
                <ThemedText style={styles.slotAvail}>Available</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
      </ScrollView>

      <BottomSheetModal
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm booking"
        subtitle="You're about to book a session with Dr. Anita Patel."
        ctaLabel="Confirm session"
        onCta={confirmBooking}
        cancelLabel="Cancel">
        <View style={styles.confirmCard}>
          <ThemedText style={styles.confirmTime}>
            {MONTH_SHORT[viewMonth]} {selectedDay} · {pickedTime}
          </ThemedText>
          <ThemedText type="small" themeColor="teal" style={{ marginTop: 4 }}>
            Dr. Anita Patel · 50 min · Video session
          </ThemedText>
        </View>
      </BottomSheetModal>

      <SuccessModal
        visible={successOpen}
        onClose={() => setSuccessOpen(false)}
        icon="🗓️"
        title="Session booked!"
        subtitle={`${MONTH_SHORT[viewMonth]} ${selectedDay} · ${pickedTime} with Dr. Anita Patel is confirmed.`}
      />
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
    marginBottom: 10,
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
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  dayCellBooked: {
    backgroundColor: `${colors.gold}1F`,
    borderColor: `${colors.gold}4D`,
  },
  dayCellHasAvailability: {
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
  dayTextBooked: {
    color: colors.gold,
  },
  dayTextSelected: {
    color: colors.background,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 5,
  },
  slotsLabelEmpty: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: colors.textTertiary,
    paddingHorizontal: Spacing.two,
    paddingBottom: 8,
  },
  slotsLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingHorizontal: Spacing.two,
    paddingBottom: 8,
  },
  noSlots: {
    paddingHorizontal: Spacing.two,
    paddingBottom: 14,
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
    minWidth: 72,
  },
  slotDoc: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  slotAvail: {
    fontSize: 11,
    color: colors.green,
    fontWeight: '500',
  },
  bookedSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 7,
    backgroundColor: `${colors.gold}12`,
    borderWidth: 0.5,
    borderColor: `${colors.gold}40`,
  },
  bookedSlotTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    minWidth: 72,
  },
  bookedLabel: {
    fontSize: 11,
    color: colors.gold,
    fontWeight: '600',
  },
  confirmCard: {
    backgroundColor: `${colors.teal}1A`,
    borderWidth: 0.5,
    borderColor: `${colors.teal}38`,
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  confirmTime: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
