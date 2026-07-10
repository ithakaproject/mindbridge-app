import { useMemo, useState, useCallback } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { SuccessModal } from '@/components/success-modal';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toDisplayTime(pgTime: string): string {
  const [hourStr, minuteStr] = pgTime.split(':');
  let hour = parseInt(hourStr);
  const minute = minuteStr;
  const period = hour < 12 ? 'AM' : 'PM';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

// Generate 50-min slots between start and end time
function generateSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current + 50 <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const period = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push(`${displayH}:${String(m).padStart(2, '0')} ${period}`);
    current += 60; // 1 hour between slot starts
  }
  return slots;
}

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type SessionRow = {
  id: string;
  start_time: string;
  duration_minutes: number;
  meet_link: string | null;
};

export default function ScheduleScreen() {
  const today = new Date();
  const [mode, setMode] = useState<'book' | 'rebook'>('book');
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [pickedTime, setPickedTime] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookedMeetLink, setBookedMeetLink] = useState<string | null>(null);

  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  const [psychologistName, setPsychologistName] = useState('Your psychologist');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [bookedSessions, setBookedSessions] = useState<SessionRow[]>([]);

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const { leadingBlanks, daysInMonth } = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const days = new Date(viewYear, viewMonth + 1, 0).getDate();
    return { leadingBlanks: firstWeekday, daysInMonth: days };
  }, [viewYear, viewMonth]);

  async function loadData() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }
    setPatientId(user.id);

    // Get psychologist id
    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('psychologist_id')
      .eq('id', user.id)
      .single();

    const psychId = patientProfile?.psychologist_id;
    setPsychologistId(psychId ?? null);

    if (psychId) {
      // Get psychologist name
      const { data: psychProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', psychId)
        .single();
      if (psychProfile?.full_name) {
        setPsychologistName(`Dr. ${psychProfile.full_name.split(' ').slice(-1)[0]}`);
      }

      // Get availability
      const { data: availData } = await supabase
        .from('availability')
        .select('day_of_week, start_time, end_time')
        .eq('psychologist_id', psychId);
      setAvailability((availData as AvailabilityRow[]) ?? []);
    }

    // Get booked sessions for this month
    const monthStart = new Date(viewYear, viewMonth, 1).toISOString();
    const monthEnd = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();
    const { data: sessData } = await supabase
      .from('sessions')
      .select('id, start_time, duration_minutes, meet_link')
      .eq('patient_id', user.id)
      .gte('start_time', monthStart)
      .lte('start_time', monthEnd);
    setBookedSessions((sessData as SessionRow[]) ?? []);

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, [viewYear, viewMonth]));

  const changeMonth = (dir: 1 | -1) => {
    setSelectedDay(null);
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 11) { m = 0; y += 1; }
    else if (m < 0) { m = 11; y -= 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  // Build a set of booked date keys
  const bookedDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of bookedSessions) {
      const d = new Date(s.start_time);
      keys.add(dateKey(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return keys;
  }, [bookedSessions]);

  // Check if a day has availability based on day_of_week
  const hasAvailability = (day: number) => {
    const dow = new Date(viewYear, viewMonth, day).getDay();
    return availability.some((a) => a.day_of_week === dow);
  };

  const selectedKey = selectedDay != null ? dateKey(viewYear, viewMonth, selectedDay) : null;
  const isSelectedBooked = selectedKey ? bookedDateKeys.has(selectedKey) : false;

  // Find the actual booked session for the selected day, so we can show its Join link
  const selectedBookedSession = useMemo(() => {
    if (!selectedKey) return null;
    return bookedSessions.find((s) => {
      const d = new Date(s.start_time);
      return dateKey(d.getFullYear(), d.getMonth(), d.getDate()) === selectedKey;
    }) ?? null;
  }, [selectedKey, bookedSessions]);

  // Get slots for selected day
  const selectedSlots = useMemo(() => {
    if (selectedDay == null) return [];
    const dow = new Date(viewYear, viewMonth, selectedDay).getDay();
    const avail = availability.find((a) => a.day_of_week === dow);
    if (!avail) return [];
    return generateSlots(avail.start_time, avail.end_time);
  }, [selectedDay, availability, viewYear, viewMonth]);

  const pickSlot = (time: string) => {
    setBookingError('');
    setPickedTime(time);
    setConfirmOpen(true);
  };

  async function confirmBooking() {
    if (!selectedDay || !pickedTime || !psychologistId || !patientId) return;
    setBooking(true);
    setBookingError('');

    // Parse picked time into ISO
    const [timePart, period] = pickedTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const sessionDate = new Date(viewYear, viewMonth, selectedDay, hours, minutes, 0);

    const { data: insertedSession, error } = await supabase
      .from('sessions')
      .insert({
        patient_id: patientId,
        psychologist_id: psychologistId,
        start_time: sessionDate.toISOString(),
        duration_minutes: 50,
        status: 'booked',
      })
      .select('id, start_time, duration_minutes, meet_link')
      .single();

    if (error || !insertedSession) {
      setBooking(false);
      setBookingError(error?.message ?? 'Booking failed. Please try again.');
      return;
    }

    // Add to local booked set immediately so the calendar updates right away
    setBookedSessions((prev) => [...prev, insertedSession as SessionRow]);

    let meetLink: string | null = null;

    // Ask the Edge Function to create the Google Calendar event + Meet link.
    // This runs after the booking succeeds, so a slow/failed Meet link never
    // blocks the booking itself from going through.
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'create-meet-link',
        { body: { session_id: insertedSession.id } }
      );

      if (!fnError && fnData?.meet_link) {
        meetLink = fnData.meet_link;
        setBookedSessions((prev) =>
          prev.map((s) =>
            s.id === insertedSession.id ? { ...s, meet_link: meetLink } : s
          )
        );
      } else if (fnError) {
        console.warn('Meet link creation failed:', fnError);
      }
    } catch (fnErr) {
      console.warn('Meet link creation failed:', fnErr);
    }

    setBookedMeetLink(meetLink);
    setBooking(false);
    setConfirmOpen(false);
    setSuccessOpen(true);
  }

  const openMeetLink = (link: string) => {
    Linking.openURL(link);
  };

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <TopBar />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>

        <View style={styles.pillRow}>
          <Pressable onPress={() => setMode('book')} style={[styles.pill, mode === 'book' && styles.pillOn]}>
            <ThemedText style={[styles.pillText, mode === 'book' && styles.pillTextOn]}>
              Book session
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('rebook')} style={[styles.pill, mode === 'rebook' && styles.pillOn]}>
            <ThemedText style={[styles.pillText, mode === 'rebook' && styles.pillTextOn]}>
              Reschedule
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.teal }]} />
            <ThemedText type="small" themeColor="textTertiary">Available</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
            <ThemedText type="small" themeColor="textTertiary">Booked</ThemedText>
          </View>
        </View>

        <View style={styles.monthNav}>
          <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={15} color={colors.textSecondary} />
          </Pressable>
          <ThemedText style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</ThemedText>
          <Pressable onPress={() => changeMonth(1)} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.weekdaysRow}>
          {WEEKDAY_LABELS.map((w, i) => (
            <ThemedText key={i} type="small" themeColor="textTertiary" style={styles.weekdayLabel}>{w}</ThemedText>
          ))}
        </View>

        <View style={styles.grid}>
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = dateKey(viewYear, viewMonth, day);
            const isBooked = bookedDateKeys.has(key);
            const avail = hasAvailability(day);
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
                  avail && !isBooked && !isPast && styles.dayCellHasAvailability,
                  isSelected && styles.dayCellSelected,
                ]}>
                <ThemedText style={[
                  styles.dayText,
                  isPast && styles.dayTextPast,
                  !isPast && styles.dayTextCurrent,
                  isToday && styles.dayTextToday,
                  isBooked && !isPast && styles.dayTextBooked,
                  isSelected && styles.dayTextSelected,
                ]}>
                  {day}
                </ThemedText>
                {!isPast && !isSelected && (isBooked || avail) && (
                  <View style={[styles.dot, { backgroundColor: isBooked ? colors.gold : colors.teal }]} />
                )}
              </Pressable>
            );
          })}
        </View>

        {selectedDay == null ? (
          <ThemedText style={styles.slotsLabelEmpty}>Select a date</ThemedText>
        ) : (
          <ThemedText style={styles.slotsLabel}>
            {MONTH_SHORT[viewMonth]} {selectedDay}
          </ThemedText>
        )}

        {isSelectedBooked && (
          <View style={styles.bookedSlot}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.bookedSlotTime}>Booked</ThemedText>
              <ThemedText style={styles.slotDoc}>{psychologistName}</ThemedText>
            </View>
            {selectedBookedSession?.meet_link ? (
              <Pressable
                onPress={() => openMeetLink(selectedBookedSession.meet_link!)}
                style={styles.joinBtn}>
                <Ionicons name="videocam" size={14} color={colors.background} />
                <ThemedText style={styles.joinBtnText}>Join Session</ThemedText>
              </Pressable>
            ) : (
              <ThemedText style={styles.bookedLabel}>Confirmed ✓</ThemedText>
            )}
          </View>
        )}

        {selectedDay != null && !isSelectedBooked && selectedSlots.length === 0 && (
          <ThemedText type="small" themeColor="textTertiary" style={styles.noSlots}>
            No slots available on this date.
          </ThemedText>
        )}

        {!isSelectedBooked && selectedSlots.map((slot, i) => (
          <Pressable key={i} onPress={() => pickSlot(slot)}>
            <ThemedView type="backgroundElement" style={styles.slotItem}>
              <ThemedText themeColor="gold" style={styles.slotTime}>{slot}</ThemedText>
              <ThemedText style={styles.slotDoc}>{psychologistName}</ThemedText>
              <ThemedText style={styles.slotAvail}>Available</ThemedText>
            </ThemedView>
          </Pressable>
        ))}

        {!psychologistId && (
          <ThemedText themeColor="textTertiary" style={styles.noSlots}>
            You haven't been matched with a psychologist yet.
          </ThemedText>
        )}
      </ScrollView>

      <BottomSheetModal
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm booking"
        subtitle={`You're about to book a session with ${psychologistName}.`}
        ctaLabel={booking ? 'Booking…' : 'Confirm session'}
        onCta={confirmBooking}
        cancelLabel="Cancel">
        <View style={styles.confirmCard}>
          <ThemedText style={styles.confirmTime}>
            {MONTH_SHORT[viewMonth]} {selectedDay} · {pickedTime}
          </ThemedText>
          <ThemedText type="small" themeColor="teal" style={{ marginTop: 4 }}>
            {psychologistName} · 50 min · Video session
          </ThemedText>
        </View>
        {bookingError !== '' && (
          <ThemedText type="small" themeColor="error" style={{ marginTop: 8 }}>
            {bookingError}
          </ThemedText>
        )}
      </BottomSheetModal>

      <SuccessModal
        visible={successOpen}
        onClose={() => setSuccessOpen(false)}
        icon="🗓️"
        title="Session booked!"
        subtitle={`${MONTH_SHORT[viewMonth]} ${selectedDay} · ${pickedTime} with ${psychologistName} is confirmed.`}
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
  pillRow: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  pill: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20, backgroundColor: colors.backgroundElement },
  pillOn: { backgroundColor: colors.gold },
  pillText: { fontSize: 12.5, fontWeight: '600', color: colors.textTertiary },
  pillTextOn: { color: colors.background, fontWeight: '700' },
  legendRow: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  weekdaysRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  dayCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, marginBottom: 3, position: 'relative',
  },
  dayCellCurrent: { backgroundColor: colors.backgroundElement, borderWidth: 0.5, borderColor: colors.border },
  dayCellToday: { borderWidth: 1.5, borderColor: colors.tealDim },
  dayCellBooked: { backgroundColor: `${colors.gold}1F`, borderColor: `${colors.gold}4D` },
  dayCellHasAvailability: { borderColor: `${colors.teal}4D` },
  dayCellSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  dayText: { fontSize: 12.5, fontWeight: '600' },
  dayTextPast: { color: 'rgba(90,122,140,0.3)' },
  dayTextCurrent: { color: colors.text },
  dayTextToday: { color: colors.teal },
  dayTextBooked: { color: colors.gold },
  dayTextSelected: { color: colors.background },
  dot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 5 },
  slotsLabelEmpty: { fontSize: 10.5, fontStyle: 'italic', color: colors.textTertiary, paddingHorizontal: Spacing.two, paddingBottom: 8 },
  slotsLabel: { fontSize: 10.5, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.1, paddingHorizontal: Spacing.two, paddingBottom: 8 },
  noSlots: { paddingHorizontal: Spacing.two, paddingBottom: 14 },
  slotItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 15,
    borderRadius: 16, marginBottom: 7,
    borderWidth: 0.5, borderColor: colors.border,
  },
  slotTime: { fontSize: 14, fontWeight: '700', minWidth: 72 },
  slotDoc: { flex: 1, fontSize: 13, color: colors.text },
  slotAvail: { fontSize: 11, color: colors.green, fontWeight: '500' },
  bookedSlot: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 15,
    borderRadius: 16, marginBottom: 7,
    backgroundColor: `${colors.gold}12`,
    borderWidth: 0.5, borderColor: `${colors.gold}40`,
  },
  bookedSlotTime: { fontSize: 14, fontWeight: '700', color: colors.gold, minWidth: 72 },
  bookedLabel: { fontSize: 11, color: colors.gold, fontWeight: '600' },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.teal, borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  joinBtnText: { fontSize: 12, fontWeight: '700', color: colors.background },
  confirmCard: {
    backgroundColor: `${colors.teal}1A`,
    borderWidth: 0.5, borderColor: `${colors.teal}38`,
    borderRadius: 14, padding: 14, marginBottom: 4,
  },
  confirmTime: { fontSize: 15, fontWeight: '700', color: colors.text },
});
