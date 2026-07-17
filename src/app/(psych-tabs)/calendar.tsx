import { useMemo, useState, useCallback } from 'react';
import { ScrollView, View, Pressable, StyleSheet, ActivityIndicator, Modal, Linking, Platform } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { ToggleSwitch } from '@/components/toggle-switch';
import { Colors, BottomTabInset, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { getDeviceTimeZone, COMMON_TIMEZONES } from '@/lib/timezone';

const colors = Colors.dark;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIME_OPTIONS: string[] = [];
for (let hour = 6; hour <= 22; hour++) {
  for (const minute of [0, 30]) {
    if (hour === 22 && minute === 30) continue;
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    TIME_OPTIONS.push(`${displayHour}:${minute === 0 ? '00' : '30'} ${period}`);
  }
}

function to24Hour(timeStr: string): string {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
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

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

type AvailabilityRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

// Raw shape from the sessions table — no embedded join, since
// sessions.patient_id has no FK path to profiles (it points to
// patient_profiles instead). Patient names are fetched separately.
type RawSessionRow = {
  id: string;
  start_time: string;
  duration_minutes: number;
  meet_link: string | null;
  patient_id: string;
};

type SessionRow = RawSessionRow & {
  patient_name: string;
};

type ActivePicker = { dayOfWeek: number; field: 'start_time' | 'end_time' } | null;

// Fetches full_name for a list of patient ids in one batched query.
async function fetchPatientNames(patientIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(patientIds));
  if (uniqueIds.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uniqueIds);

  if (error) {
    console.warn('PATIENT NAMES LOOKUP ERROR:', error.message);
    return {};
  }

  const map: Record<string, string> = {};
  (data ?? []).forEach((p) => {
    map[p.id] = p.full_name ?? 'Patient';
  });
  return map;
}

export default function CalendarScreen() {
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();
  const today = new Date();
  const [mode, setMode] = useState<'sessions' | 'availability'>(
    initialMode === 'availability' ? 'availability' : 'sessions'
  );
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, SessionRow[]>>({});
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);
  const [timezoneSaving, setTimezoneSaving] = useState(false);

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
    setUserId(user.id);

    // Load (or auto-detect + save) this psychologist's timezone
    const { data: psychProfileRow, error: psychProfileError } = await supabase
      .from('psychologist_profiles')
      .select('timezone')
      .eq('id', user.id)
      .single();
    if (psychProfileError) console.warn('PSYCH PROFILE TIMEZONE ERROR:', psychProfileError.message);

    if (psychProfileRow?.timezone) {
      setTimezone(psychProfileRow.timezone);
    } else {
      // No timezone on file yet — auto-detect from this device as a
      // sensible default. The psychologist can still change it manually.
      const detected = getDeviceTimeZone();
      setTimezone(detected);
      await supabase
        .from('psychologist_profiles')
        .update({ timezone: detected })
        .eq('id', user.id);
    }

    const { data: availData, error: availError } = await supabase
      .from('availability')
      .select('id, day_of_week, start_time, end_time')
      .eq('psychologist_id', user.id)
      .order('day_of_week');
    if (availError) console.warn('AVAILABILITY ERROR:', availError.message);
    setAvailability((availData as AvailabilityRow[]) ?? []);

    const monthStart = new Date(viewYear, viewMonth, 1).toISOString();
    const monthEnd = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();
    const { data: sessData, error: sessError } = await supabase
      .from('sessions')
      .select('id, start_time, duration_minutes, meet_link, patient_id')
      .eq('psychologist_id', user.id)
      .gte('start_time', monthStart)
      .lte('start_time', monthEnd)
      .order('start_time');
    if (sessError) console.warn('SESSIONS ERROR:', sessError.message);

    const rawSessions = (sessData as RawSessionRow[]) ?? [];
    const nameMap = await fetchPatientNames(rawSessions.map((s) => s.patient_id));

    const byDate: Record<string, SessionRow[]> = {};
    for (const s of rawSessions) {
      const d = new Date(s.start_time);
      const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push({ ...s, patient_name: nameMap[s.patient_id] ?? 'Patient' });
    }
    setSessionsByDate(byDate);

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

  const selectedKey = selectedDay != null ? dateKey(viewYear, viewMonth, selectedDay) : null;
  const selectedSessions = selectedKey ? (sessionsByDate[selectedKey] ?? []) : [];

  const openPatient = (patientId: string) => {
    router.push({ pathname: '/patient/[id]', params: { id: patientId } });
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

  const getAvailForDay = (dow: number) => availability.find((a) => a.day_of_week === dow);

  async function toggleDayAvailability(dow: number) {
    if (!userId) return;
    setSaving(true);
    const existing = getAvailForDay(dow);
    if (existing) {
      await supabase.from('availability').delete().eq('id', existing.id);
      setAvailability((prev) => prev.filter((a) => a.id !== existing.id));
    } else {
      const { data } = await supabase
        .from('availability')
        .insert({
          psychologist_id: userId,
          day_of_week: dow,
          start_time: '09:00:00',
          end_time: '17:00:00',
        })
        .select()
        .single();
      if (data) {
        setAvailability((prev) =>
          [...prev, data as AvailabilityRow].sort((a, b) => a.day_of_week - b.day_of_week)
        );
      }
    }
    setSaving(false);
  }

  async function updateTime(dow: number, field: 'start_time' | 'end_time', displayTime: string) {
    if (!userId) return;
    const existing = getAvailForDay(dow);
    if (!existing) return;
    const pgTime = to24Hour(displayTime);
    setSaving(true);
    await supabase.from('availability').update({ [field]: pgTime }).eq('id', existing.id);
    setAvailability((prev) =>
      prev.map((a) => a.id === existing.id ? { ...a, [field]: pgTime } : a)
    );
    setActivePicker(null);
    setSaving(false);
  }

  async function updateTimezone(tz: string) {
    if (!userId) return;
    setTimezoneSaving(true);
    await supabase.from('psychologist_profiles').update({ timezone: tz }).eq('id', userId);
    setTimezone(tz);
    setTimezoneModalOpen(false);
    setTimezoneSaving(false);
  }

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

  const currentTimezoneLabel = COMMON_TIMEZONES.find((z) => z.value === timezone)?.label ?? timezone;

  return (
    <ThemedView style={styles.screen}>
      <TopBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>
        <View style={styles.pillRow}>
          <Pressable onPress={() => setMode('sessions')} style={[styles.pill, mode === 'sessions' && styles.pillOn]}>
            <ThemedText style={[styles.pillText, mode === 'sessions' && styles.pillTextOn]}>Sessions</ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('availability')} style={[styles.pill, mode === 'availability' && styles.pillOn]}>
            <ThemedText style={[styles.pillText, mode === 'availability' && styles.pillTextOn]}>Availability</ThemedText>
          </Pressable>
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
            const hasEvents = !!sessionsByDate[key];
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
                <ThemedText style={[
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
              {selectedDay != null ? `${MONTH_SHORT[viewMonth]} ${selectedDay} — sessions` : 'Select a day'}
            </ThemedText>
            {selectedSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyEmoji}>📅</ThemedText>
                <ThemedText style={styles.emptyTitle}>No sessions</ThemedText>
                <ThemedText type="small" themeColor="textTertiary" style={styles.emptySub}>
                  No sessions scheduled on this day.
                </ThemedText>
              </View>
            ) : (
              selectedSessions.map((s) => (
                <ThemedView key={s.id} type="backgroundElement" style={styles.slotItem}>
                  <Pressable onPress={() => openPatient(s.patient_id)} style={styles.slotMain}>
                    <ThemedText themeColor="gold" style={styles.slotTime}>
                      {formatTime(s.start_time)}
                    </ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.slotName}>{s.patient_name}</ThemedText>
                      <ThemedText type="small" themeColor="textTertiary">
                        {s.duration_minutes} min
                      </ThemedText>
                    </View>
                  </Pressable>
                  {s.meet_link && (
                    <Pressable onPress={() => openMeetLink(s.meet_link!)} style={styles.joinBtn}>
                      <Ionicons name="videocam" size={14} color={colors.background} />
                      <ThemedText style={styles.joinBtnText}>Join</ThemedText>
                    </Pressable>
                  )}
                </ThemedView>
              ))
            )}
          </>
        ) : (
          <>
            <Pressable onPress={() => setTimezoneModalOpen(true)} style={styles.timezoneRow}>
              <Ionicons name="globe-outline" size={16} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <ThemedText type="small" themeColor="textTertiary" style={styles.timezoneLabel}>
                  Your timezone
                </ThemedText>
                <ThemedText style={styles.timezoneValue}>
                  {currentTimezoneLabel}{timezoneSaving ? ' (saving…)' : ''}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="teal" style={{ fontWeight: '600' }}>Change</ThemedText>
            </Pressable>

            <ThemedText style={styles.secLabel}>
              Available hours{saving ? ' (saving…)' : ''}
            </ThemedText>
            {DAY_NAMES.map((dayName, dow) => {
              const avail = getAvailForDay(dow);
              return (
                <View key={dayName} style={styles.availRow}>
                  <ThemedText style={styles.availDay}>{DAY_SHORT[dow]}</ThemedText>
                  {avail ? (
                    <View style={styles.availTimes}>
                      <Pressable onPress={() => setActivePicker({ dayOfWeek: dow, field: 'start_time' })}>
                        <ThemedText type="small" themeColor="teal">
                          {toDisplayTime(avail.start_time)}
                        </ThemedText>
                      </Pressable>
                      <ThemedText type="small" themeColor="textTertiary"> – </ThemedText>
                      <Pressable onPress={() => setActivePicker({ dayOfWeek: dow, field: 'end_time' })}>
                        <ThemedText type="small" themeColor="teal">
                          {toDisplayTime(avail.end_time)}
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : (
                    <ThemedText type="small" themeColor="textTertiary" style={{ flex: 1 }}>
                      Not available
                    </ThemedText>
                  )}
                  <ToggleSwitch
                    value={!!avail}
                    onValueChange={() => toggleDayAvailability(dow)}
                  />
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}>
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setActivePicker(null)}>
          <ThemedView type="backgroundElement" style={styles.modalSheet}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              {activePicker?.field === 'start_time' ? 'Select start time' : 'Select end time'}
            </ThemedText>
            <ScrollView style={styles.modalScroll}>
              {TIME_OPTIONS.map((time) => (
                <Pressable
                  key={time}
                  style={styles.timeOption}
                  onPress={() =>
                    activePicker && updateTime(activePicker.dayOfWeek, activePicker.field, time)
                  }>
                  <ThemedText type="default">{time}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>

      <Modal
        visible={timezoneModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTimezoneModalOpen(false)}>
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setTimezoneModalOpen(false)}>
          <ThemedView type="backgroundElement" style={styles.modalSheet}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              Select your timezone
            </ThemedText>
            <ScrollView style={styles.modalScroll}>
              {COMMON_TIMEZONES.map((tz) => (
                <Pressable
                  key={tz.value}
                  style={styles.timeOption}
                  onPress={() => updateTimezone(tz.value)}>
                  <ThemedText type="default">{tz.label}</ThemedText>
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
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  pillRow: { flexDirection: 'row', gap: 7, marginBottom: 12 },
  pill: { paddingVertical: 6, paddingHorizontal: 15, borderRadius: 20, backgroundColor: colors.backgroundElement },
  pillOn: { backgroundColor: colors.gold },
  pillText: { fontSize: 12.5, fontWeight: '600', color: colors.textTertiary },
  pillTextOn: { color: colors.background, fontWeight: '700' },
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
  dayCellHasEvent: { borderColor: `${colors.teal}4D` },
  dayCellSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  dayText: { fontSize: 12.5, fontWeight: '600' },
  dayTextPast: { color: 'rgba(90,122,140,0.3)' },
  dayTextCurrent: { color: colors.text },
  dayTextToday: { color: colors.teal },
  dayTextSelected: { color: colors.background },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.teal, position: 'absolute', bottom: 5 },
  dotSelected: { backgroundColor: colors.background },
  secLabel: {
    fontSize: 10.5, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.1, paddingBottom: 8,
  },
  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { fontWeight: '700', marginBottom: 6 },
  emptySub: { textAlign: 'center', lineHeight: 18 },
  slotItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, paddingHorizontal: 15,
    borderRadius: 16, marginBottom: 7,
    borderWidth: 0.5, borderColor: colors.border,
  },
  slotMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  slotTime: { fontSize: 14, fontWeight: '700', minWidth: 68 },
  slotName: { fontSize: 13, color: colors.text },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.teal, borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  joinBtnText: { fontSize: 12, fontWeight: '700', color: colors.background },
  timezoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.backgroundElement,
    borderRadius: 13, paddingVertical: 10, paddingHorizontal: 15,
    borderWidth: 0.5, borderColor: colors.border, marginBottom: 12,
  },
  timezoneLabel: { textTransform: 'uppercase', letterSpacing: 0.8 },
  timezoneValue: { fontWeight: '600', color: colors.text, marginTop: 1 },
  availRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 15,
    backgroundColor: colors.backgroundElement,
    borderRadius: 13, marginBottom: 7,
    borderWidth: 0.5, borderColor: colors.border,
  },
  availDay: { fontSize: 13, fontWeight: '600', width: 34, color: colors.text },
  availTimes: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalSheet: {
    width: '85%', maxWidth: 320, maxHeight: 400,
    borderRadius: Spacing.four, padding: Spacing.four, gap: Spacing.three,
  },
  modalTitle: { textAlign: 'center' },
  modalScroll: { maxHeight: 280 },
  timeOption: { paddingVertical: Spacing.two, alignItems: 'center' },
});
