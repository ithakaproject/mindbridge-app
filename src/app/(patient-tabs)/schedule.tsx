import { useMemo, useState, useCallback, useEffect } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { SuccessModal } from '@/components/success-modal';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { zonedTimeToUtc } from '@/lib/timezone';

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

function formatSessionListTime(isoString: string): string {
  const d = new Date(isoString);
  const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timePart = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${timePart}`;
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

type SlotOption = {
  utcDate: Date;
  label: string;
};

// Builds the list of bookable 50-minute slots for a specific calendar date,
// converting the psychologist's wall-clock availability (e.g. "9:00 AM in
// America/New_York") into real UTC instants, then filters out anything
// that's already in the past. This is what makes cross-timezone booking
// and "can't book a time that's already passed" both work correctly.
function buildSlotsForDate(
  avail: AvailabilityRow,
  year: number,
  month: number,
  day: number,
  psychTimeZone: string
): SlotOption[] {
  const [startH, startM] = avail.start_time.split(':').map(Number);
  const [endH, endM] = avail.end_time.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const selectedLocalMidnight = new Date(year, month, day).toDateString();
  const slots: SlotOption[] = [];
  let current = startMinutes;

  while (current + 50 <= endMinutes) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    const utcDate = zonedTimeToUtc(year, month, day, hour, minute, psychTimeZone);

    if (utcDate.getTime() > Date.now()) {
      let timeLabel = utcDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      // Rare edge case: a large timezone gap can shift a slot onto a
      // different calendar date once converted to the patient's local
      // time. Flag it explicitly rather than showing a misleading time.
      if (utcDate.toDateString() !== selectedLocalMidnight) {
        timeLabel += utcDate.getTime() > new Date(year, month, day).getTime() ? ' (next day)' : ' (prev day)';
      }
      slots.push({ utcDate, label: timeLabel });
    }
    current += 60;
  }
  return slots;
}

export default function ScheduleScreen() {
  const today = new Date();
  const [mode, setMode] = useState<'book' | 'rebook'>('book');
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [pickedSlot, setPickedSlot] = useState<SlotOption | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookedMeetLink, setBookedMeetLink] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<'book' | 'reschedule'>('book');

  const [psychologistId, setPsychologistId] = useState<string | null>(null);
  const [psychologistName, setPsychologistName] = useState('Your psychologist');
  const [psychTimezone, setPsychTimezone] = useState('America/New_York');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [bookedSessions, setBookedSessions] = useState<SessionRow[]>([]);
  const [allUpcomingSessions, setAllUpcomingSessions] = useState<SessionRow[]>([]);
  const [reschedulingSession, setReschedulingSession] = useState<SessionRow | null>(null);

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

      // Get psychologist's timezone
      const { data: psychProfileRow, error: tzError } = await supabase
        .from('psychologist_profiles')
        .select('timezone')
        .eq('id', psychId)
        .single();
      if (tzError) console.warn('PSYCH TIMEZONE ERROR:', tzError.message);
      setPsychTimezone(psychProfileRow?.timezone || 'America/New_York');

      // Get availability
      const { data: availData } = await supabase
        .from('availability')
        .select('day_of_week, start_time, end_time')
        .eq('psychologist_id', psychId);
      setAvailability((availData as AvailabilityRow[]) ?? []);
    }

    // Get booked sessions for this month (used by the calendar grid)
    const monthStart = new Date(viewYear, viewMonth, 1).toISOString();
    const monthEnd = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();
    const { data: sessData } = await supabase
      .from('sessions')
      .select('id, start_time, duration_minutes, meet_link')
      .eq('patient_id', user.id)
      .gte('start_time', monthStart)
      .lte('start_time', monthEnd);
    setBookedSessions((sessData as SessionRow[]) ?? []);

    // Get ALL upcoming sessions regardless of month (used by the reschedule list)
    const nowIso = new Date().toISOString();
    const { data: upcomingData } = await supabase
      .from('sessions')
      .select('id, start_time, duration_minutes, meet_link')
      .eq('patient_id', user.id)
      .gte('start_time', nowIso)
      .order('start_time');
    setAllUpcomingSessions((upcomingData as SessionRow[]) ?? []);

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, [viewYear, viewMonth]));

  // Reset reschedule/selection state whenever the mode pill changes, so
  // stale picks don't leak between booking and rescheduling.
  useEffect(() => {
    setSelectedDay(null);
    setBookingError('');
    if (mode === 'book') {
      setReschedulingSession(null);
    }
  }, [mode]);

  const changeMonth = (dir: 1 | -1) => {
    setSelectedDay(null);
    let m = viewMonth + dir;
    let y = viewYear;
    if (m > 11) { m = 0; y += 1; }
    else if (m < 0) { m = 11; y -= 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  // Build a set of booked date keys. While rescheduling, the session being
  // moved is excluded so its current day frees back up for picking a new slot.
  const bookedDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of bookedSessions) {
      if (reschedulingSession && s.id === reschedulingSession.id) continue;
      const d = new Date(s.start_time);
      keys.add(dateKey(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return keys;
  }, [bookedSessions, reschedulingSession]);

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
      if (reschedulingSession && s.id === reschedulingSession.id) return false;
      const d = new Date(s.start_time);
      return dateKey(d.getFullYear(), d.getMonth(), d.getDate()) === selectedKey;
    }) ?? null;
  }, [selectedKey, bookedSessions, reschedulingSession]);

  // Get slots for selected day — converted into the patient's local time,
  // with anything already in the past filtered out.
  const selectedSlots = useMemo(() => {
    if (selectedDay == null) return [];
    const dow = new Date(viewYear, viewMonth, selectedDay).getDay();
    const avail = availability.find((a) => a.day_of_week === dow);
    if (!avail) return [];
    return buildSlotsForDate(avail, viewYear, viewMonth, selectedDay, psychTimezone);
  }, [selectedDay, availability, viewYear, viewMonth, psychTimezone]);

  const pickSlot = (slot: SlotOption) => {
    setBookingError('');
    setPickedSlot(slot);
    setConfirmOpen(true);
  };

  const startReschedule = (session: SessionRow) => {
    setReschedulingSession(session);
    setSelectedDay(null);
    setBookingError('');
  };

  const cancelReschedule = () => {
    setReschedulingSession(null);
    setSelectedDay(null);
    setBookingError('');
  };

  async function confirmBooking() {
    if (!pickedSlot || !psychologistId || !patientId) return;
    setLastAction('book');
    setBooking(true);
    setBookingError('');

    const { data: insertedSession, error } = await supabase
      .from('sessions')
      .insert({
        patient_id: patientId,
        psychologist_id: psychologistId,
        start_time: pickedSlot.utcDate.toISOString(),
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

    // Add to local booked sets immediately so both views update right away
    setBookedSessions((prev) => [...prev, insertedSession as SessionRow]);
    setAllUpcomingSessions((prev) => [...prev, insertedSession as SessionRow]);

    let meetLink: string | null = null;

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'create-meet-link',
        { body: { session_id: insertedSession.id } }
      );

      if (!fnError && fnData?.meet_link) {
        meetLink = fnData.meet_link;
        setBookedSessions((prev) =>
          prev.map((s) => (s.id === insertedSession.id ? { ...s, meet_link: meetLink } : s))
        );
        setAllUpcomingSessions((prev) =>
          prev.map((s) => (s.id === insertedSession.id ? { ...s, meet_link: meetLink } : s))
        );
      } else if (fnError) {
        let details = fnError.message;
        try {
          const body = await fnError.context?.json();
          if (body?.error) details = body.error;
        } catch (parseErr) {
          // response body wasn't JSON — fall back to the generic message
        }
        console.warn('MEET LINK ERROR DETAILS:', details);
      }
    } catch (fnErr) {
      console.warn('Meet link creation failed:', fnErr);
    }

    setBookedMeetLink(meetLink);
    setBooking(false);
    setConfirmOpen(false);
    setSuccessOpen(true);
  }

  async function confirmReschedule() {
    if (!pickedSlot || !reschedulingSession) return;
    setLastAction('reschedule');
    setBooking(true);
    setBookingError('');

    // Just update the start_time — the existing Google Calendar event and
    // its Meet link get reused (moved to the new time) rather than
    // discarded, so we don't clear meet_link here.
    const { data: updatedSession, error } = await supabase
      .from('sessions')
      .update({
        start_time: pickedSlot.utcDate.toISOString(),
      })
      .eq('id', reschedulingSession.id)
      .select('id, start_time, duration_minutes, meet_link')
      .single();

    if (error || !updatedSession) {
      setBooking(false);
      setBookingError(error?.message ?? 'Reschedule failed. Please try again.');
      return;
    }

    setBookedSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? (updatedSession as SessionRow) : s))
    );
    setAllUpcomingSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? (updatedSession as SessionRow) : s))
    );

    let meetLink: string | null = null;

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'create-meet-link',
        { body: { session_id: updatedSession.id } }
      );

      if (!fnError && fnData?.meet_link) {
        meetLink = fnData.meet_link;
        setBookedSessions((prev) =>
          prev.map((s) => (s.id === updatedSession.id ? { ...s, meet_link: meetLink } : s))
        );
        setAllUpcomingSessions((prev) =>
          prev.map((s) => (s.id === updatedSession.id ? { ...s, meet_link: meetLink } : s))
        );
      } else if (fnError) {
        let details = fnError.message;
        try {
          const body = await fnError.context?.json();
          if (body?.error) details = body.error;
        } catch (parseErr) {
          // response body wasn't JSON — fall back to the generic message
        }
        console.warn('MEET LINK ERROR DETAILS:', details);
      }
    } catch (fnErr) {
      console.warn('Meet link creation failed:', fnErr);
    }

    setBookedMeetLink(meetLink);
    setBooking(false);
    setConfirmOpen(false);
    setSuccessOpen(true);
    setReschedulingSession(null);
  }

  const handleConfirmPress = () => {
    if (reschedulingSession) {
      confirmReschedule();
    } else {
      confirmBooking();
    }
  };

  // On web, Linking.openURL can be silently blocked by popup blockers,
  // especially after an async gap. window.open, called directly inside
  // the press handler, is far more reliable in browsers.
  const openMeetLink = (link: string) => {
    if (Platform.OS === 'web') {
      window.open(link, '_blank');
    } else {
      Linking.openURL(link);
    }
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

  const showCalendarPicker = mode === 'book' || (mode === 'rebook' && reschedulingSession != null);
  const showRescheduleList = mode === 'rebook' && reschedulingSession == null;

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

        {showRescheduleList && (
          <>
            <ThemedText style={styles.slotsLabel}>Your upcoming sessions</ThemedText>
            {allUpcomingSessions.length === 0 ? (
              <ThemedText themeColor="textTertiary" style={styles.noSlots}>
                You don't have any upcoming sessions to reschedule.
              </ThemedText>
            ) : (
              allUpcomingSessions.map((s) => (
                <View key={s.id} style={styles.rescheduleRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.rescheduleRowTime}>
                      {formatSessionListTime(s.start_time)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {psychologistName}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => startReschedule(s)} style={styles.rescheduleBtn}>
                    <ThemedText style={styles.rescheduleBtnText}>Reschedule</ThemedText>
                  </Pressable>
                </View>
              ))
            )}
          </>
        )}

        {showCalendarPicker && (
          <>
            {reschedulingSession && (
              <View style={styles.reschedulingBanner}>
                <ThemedText type="small" themeColor="gold" style={{ fontWeight: '600', flex: 1 }}>
                  Moving your {formatSessionListTime(reschedulingSession.start_time)} session — pick a new date & time below.
                </ThemedText>
                <Pressable onPress={cancelReschedule}>
                  <ThemedText type="small" themeColor="teal">Cancel</ThemedText>
                </Pressable>
              </View>
            )}

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

            {!isSelectedBooked && selectedSlots.map((slot) => (
              <Pressable key={slot.utcDate.toISOString()} onPress={() => pickSlot(slot)}>
                <ThemedView type="backgroundElement" style={styles.slotItem}>
                  <ThemedText themeColor="gold" style={styles.slotTime}>{slot.label}</ThemedText>
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
          </>
        )}
      </ScrollView>

      <BottomSheetModal
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={reschedulingSession ? 'Confirm reschedule' : 'Confirm booking'}
        subtitle={
          reschedulingSession
            ? "You're about to move this session to a new time."
            : `You're about to book a session with ${psychologistName}.`
        }
        ctaLabel={
          booking
            ? (reschedulingSession ? 'Rescheduling…' : 'Booking…')
            : (reschedulingSession ? 'Confirm new time' : 'Confirm session')
        }
        onCta={handleConfirmPress}
        cancelLabel="Cancel">
        <View style={styles.confirmCard}>
          <ThemedText style={styles.confirmTime}>
            {MONTH_SHORT[viewMonth]} {selectedDay} · {pickedSlot?.label}
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
        title={lastAction === 'reschedule' ? 'Session rescheduled!' : 'Session booked!'}
        subtitle={`${MONTH_SHORT[viewMonth]} ${selectedDay} · ${pickedSlot?.label} with ${psychologistName} is confirmed.`}
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
  rescheduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 15,
    borderRadius: 16, marginBottom: 7,
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5, borderColor: colors.border,
  },
  rescheduleRowTime: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  rescheduleBtn: {
    backgroundColor: colors.gold, borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  rescheduleBtnText: { fontSize: 12, fontWeight: '700', color: colors.background },
  reschedulingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: `${colors.gold}12`, borderRadius: 12,
    paddingVertical: 9, paddingHorizontal: 13,
    borderWidth: 0.5, borderColor: `${colors.gold}40`,
    marginBottom: 12,
  },
});
