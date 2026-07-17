import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { AssignModal, type AssignmentTemplate } from '@/components/assign-modal';
import { SuccessModal } from '@/components/success-modal';
import { JournalRequestModal } from '@/components/journal-request-modal';
import { ToggleSwitch } from '@/components/toggle-switch';
import { Colors, Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { REFLECTION_QUESTIONS } from '@/data/journal-options';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

const FLAG_COLORS: Record<string, 'green' | 'amber' | 'rose'> = {
  progress: 'green',
  watch: 'amber',
  urgent: 'rose',
};
const FLAG_LABELS: Record<string, string> = {
  progress: 'Progress',
  watch: 'Monitor',
  urgent: 'Urgent',
};

function moodBarColor(v: number) {
  if (v <= 3) return colors.rose;
  if (v <= 5) return colors.amber;
  return colors.green;
}

function formatSessionTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today · ${timeStr}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${timeStr}`;
}

type PatientData = {
  id: string;
  full_name: string;
  flag: string;
  notes: string | null;
  journal_access: boolean;
};

type AssignmentRow = {
  id: string;
  title: string;
  sub: string;
  icon: string;
  done: boolean;
};

type MoodEntry = {
  mood_score: number;
  created_at: string;
};

type NextSession = {
  id: string;
  start_time: string;
  meet_link: string | null;
};

type AssignedQuestion = { question_key: string };
type CustomQuestion = { id: string; question: string };

export default function PatientDetailScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [moodScores, setMoodScores] = useState<number[]>([]);
  const [nextSession, setNextSession] = useState<NextSession | null>(null);
  const [assignedQuestions, setAssignedQuestions] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [psychId, setPsychId] = useState<string | null>(null);

  const [linkRevealed, setLinkRevealed] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [newCustomQuestion, setNewCustomQuestion] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ icon: string; title: string; subtitle: string } | null>(null);

  async function loadData() {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user || !patientId) {
      setLoading(false);
      return;
    }
    setPsychId(user.id);

    // Fetch patient profile + patient_profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', patientId)
      .single();
    if (profileError) console.warn('PROFILE ERROR:', profileError.message);

    const { data: patientProfile, error: patientProfileError } = await supabase
      .from('patient_profiles')
      .select('flag, notes, journal_access')
      .eq('id', patientId)
      .single();
    if (patientProfileError) console.warn('PATIENT PROFILE ERROR:', patientProfileError.message);

    setPatient({
      id: patientId,
      full_name: profile?.full_name ?? 'Patient',
      flag: patientProfile?.flag ?? 'progress',
      notes: patientProfile?.notes ?? null,
      journal_access: patientProfile?.journal_access ?? false,
    });

    // Fetch assignments
    const { data: assignData, error: assignError } = await supabase
      .from('assignments')
      .select('id, title, sub, icon, done')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (assignError) console.warn('ASSIGNMENTS ERROR:', assignError.message);
    setAssignments((assignData as AssignmentRow[]) ?? []);

    // Fetch mood scores
    const { data: moodData, error: moodError } = await supabase
      .from('journal_entries')
      .select('mood_score, created_at')
      .eq('patient_id', patientId)
      .not('mood_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8);
    if (moodError) console.warn('MOOD SCORES ERROR:', moodError.message);
    setMoodScores(
      ((moodData as MoodEntry[]) ?? [])
        .reverse()
        .map((e) => e.mood_score)
    );

    // Fetch next session — using meet_link (the column bookings actually
    // fill in) instead of the legacy, never-wired-up meeting_link column.
    const now = new Date().toISOString();
    const { data: sessData, error: sessError } = await supabase
      .from('sessions')
      .select('id, start_time, meet_link')
      .eq('patient_id', patientId)
      .eq('psychologist_id', user.id)
      .gte('start_time', now)
      .order('start_time')
      .limit(1)
      .maybeSingle();
    if (sessError) console.warn('NEXT SESSION ERROR:', sessError.message);
    setNextSession((sessData as NextSession) ?? null);

    // Fetch assigned journal questions
    const { data: assignedQData, error: assignedQError } = await supabase
      .from('assigned_journal_questions')
      .select('question_key')
      .eq('patient_id', patientId);
    if (assignedQError) console.warn('ASSIGNED QUESTIONS ERROR:', assignedQError.message);
    setAssignedQuestions((assignedQData as AssignedQuestion[])?.map((q) => q.question_key) ?? []);

    // Fetch custom journal questions
    const { data: customQData, error: customQError } = await supabase
      .from('custom_journal_questions')
      .select('id, question')
      .eq('patient_id', patientId);
    if (customQError) console.warn('CUSTOM QUESTIONS ERROR:', customQError.message);
    setCustomQuestions((customQData as CustomQuestion[]) ?? []);

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadData(); }, [patientId]));

  const goToChat = () => router.push({ pathname: '/chat/[id]', params: { id: patientId } });

  const goToJournal = () => {
    if (!patient?.journal_access) {
      setJournalModalOpen(true);
      return;
    }
    console.log('open journal viewer for', patientId);
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

  async function handleAssignSend(template: AssignmentTemplate) {
    if (!patientId || !psychId) return;

    const { data: newAssign, error } = await supabase
      .from('assignments')
      .insert({
        patient_id: patientId,
        psychologist_id: psychId,
        title: template.title,
        sub: 'Assigned today',
        icon: template.icon ?? 'clipboard',
        done: false,
      })
      .select()
      .single();

    if (error || !newAssign) {
      console.warn('ASSIGNMENT SEND ERROR:', error?.message);
      setAssignModalOpen(false);
      return;
    }

    setAssignments((prev) => [newAssign as AssignmentRow, ...prev]);

    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: patientId,
      type: 'assignment',
      title: 'New assignment',
      body: template.title,
      related_id: newAssign.id,
    });
    if (notifError) console.warn('ASSIGNMENT NOTIFICATION ERROR:', notifError.message);

    setAssignModalOpen(false);
    setSuccessInfo({
      icon: '📋',
      title: 'Assignment sent',
      subtitle: `${template.title} has been sent to ${patient?.full_name?.split(' ')[0]}.`,
    });
  }

  async function saveNotes() {
    if (!patientId) return;

    const { error } = await supabase
      .from('patient_profiles')
      .update({ notes: draftNote.trim() })
      .eq('id', patientId);

    if (error) {
      console.warn('SAVE NOTES ERROR:', error.message);
      return;
    }

    setPatient((prev) => prev ? { ...prev, notes: draftNote.trim() } : prev);
    setNotesModalOpen(false);
    setSuccessInfo({ icon: '📝', title: 'Notes saved', subtitle: 'Your session notes have been saved privately.' });
  }

  async function toggleQuestion(key: string) {
    if (!patientId) return;
    const isOn = assignedQuestions.includes(key);

    if (isOn) {
      const { error } = await supabase
        .from('assigned_journal_questions')
        .delete()
        .eq('patient_id', patientId)
        .eq('question_key', key);
      if (error) {
        console.warn('REMOVE QUESTION ERROR:', error.message);
        return;
      }
      setAssignedQuestions((prev) => prev.filter((k) => k !== key));
    } else {
      const { error } = await supabase
        .from('assigned_journal_questions')
        .insert({ patient_id: patientId, question_key: key });
      if (error) {
        console.warn('ADD QUESTION ERROR:', error.message);
        return;
      }
      setAssignedQuestions((prev) => [...prev, key]);
    }
  }

  async function addCustomQuestion() {
    const text = newCustomQuestion.trim();
    if (!text || !patientId) return;

    const { data: newQ, error } = await supabase
      .from('custom_journal_questions')
      .insert({ patient_id: patientId, question: text })
      .select()
      .single();

    if (error || !newQ) {
      console.warn('ADD CUSTOM QUESTION ERROR:', error?.message);
      return;
    }

    setCustomQuestions((prev) => [...prev, newQ as CustomQuestion]);
    setNewCustomQuestion('');
  }

  async function removeCustomQuestion(id: string) {
    const { error } = await supabase.from('custom_journal_questions').delete().eq('id', id);
    if (error) {
      console.warn('REMOVE CUSTOM QUESTION ERROR:', error.message);
      return;
    }
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  const handleJournalRequestSent = async (period: string) => {
    if (!patientId || !psychId) return;

    const { error } = await supabase.from('notifications').insert({
      user_id: patientId,
      type: 'journal_request',
      title: 'Your psychologist requested journal access',
      body: `Requesting access to entries from: ${period}`,
      related_id: psychId,
    });
    if (error) console.warn('JOURNAL REQUEST NOTIFICATION ERROR:', error.message);
  };

  if (loading) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </ThemedView>
    );
  }

  if (!patient) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.gold} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <ThemedText>Patient not found.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const flagColor = colors[FLAG_COLORS[patient.flag] ?? 'green'];
  const flagLabel = FLAG_LABELS[patient.flag] ?? 'Progress';
  const firstName = patient.full_name.split(' ')[0];
  const initials = patient.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const trendUp = moodScores.length >= 2
    ? moodScores[moodScores.length - 1] >= moodScores[moodScores.length - 2]
    : true;

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <ThemedText style={styles.headerTitle}>{patient.full_name}</ThemedText>
          <ThemedText type="small" style={styles.headerStatus}>Patient</ThemedText>
        </View>
        <View style={[styles.flagBadge, { backgroundColor: `${flagColor}2E` }]}>
          <ThemedText style={[styles.flagText, { color: flagColor }]}>{flagLabel}</ThemedText>
        </View>
        <Pressable onPress={goToChat} hitSlop={12} style={{ marginLeft: 10 }}>
          <Ionicons name="videocam" size={20} color={colors.gold} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: BottomTabInset + Spacing.four }]}>

        {/* Patient banner */}
        <View style={styles.banner}>
          <View style={[styles.avatarLg, { backgroundColor: colors.tealDim }]}>
            <ThemedText style={styles.avatarLgText}>{initials}</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.bannerName}>{patient.full_name}</ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.bannerSpec}>
              {patient.flag === 'urgent' ? 'Needs immediate attention' : patient.flag === 'watch' ? 'Monitor closely' : 'Making good progress'}
            </ThemedText>
          </View>
        </View>

        {/* Next session */}
        {nextSession ? (
          <>
            <Pressable onPress={() => setLinkRevealed((v) => !v)} style={styles.sessBanner}>
              <Ionicons name="calendar-outline" size={17} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.sessTitle}>
                  Next: {formatSessionTime(nextSession.start_time)}
                </ThemedText>
                <ThemedText type="small" themeColor="teal" style={styles.sessHint}>
                  Tap to reveal meeting link
                </ThemedText>
              </View>
            </Pressable>

            {linkRevealed && nextSession.meet_link && (
              <View style={styles.linkCard}>
                <Ionicons name="videocam" size={17} color={colors.teal} />
                <ThemedText style={styles.linkText}>{nextSession.meet_link}</ThemedText>
                <Pressable onPress={() => openMeetLink(nextSession.meet_link!)} style={styles.linkBtn}>
                  <ThemedText type="small" style={styles.linkBtnText}>Join</ThemedText>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <View style={styles.sessBanner}>
            <Ionicons name="calendar-outline" size={17} color={colors.textTertiary} />
            <ThemedText type="small" themeColor="textTertiary">No upcoming sessions scheduled.</ThemedText>
          </View>
        )}

        {/* Session notes */}
        <View style={styles.notesBox}>
          <ThemedText style={styles.notesLabel}>SESSION NOTES</ThemedText>
          <ThemedText style={styles.notesText}>
            {patient.notes || 'No notes added yet for this patient.'}
          </ThemedText>
          <Pressable onPress={() => { setDraftNote(patient.notes ?? ''); setNotesModalOpen(true); }} style={styles.notesAdd}>
            <Ionicons name="pencil" size={12} color={colors.teal} />
            <ThemedText type="small" themeColor="teal" style={{ fontWeight: '600' }}> Edit notes</ThemedText>
          </Pressable>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction icon="chatbubble-outline" label="Message" color={colors.teal} onPress={goToChat} />
          <QuickAction
            icon="book-outline"
            label={patient.journal_access ? 'Journal' : 'Request'}
            color={colors.purple}
            onPress={goToJournal}
          />
          <QuickAction icon="clipboard-outline" label="Assign" color={colors.gold} onPress={() => setAssignModalOpen(true)} />
          <QuickAction icon="calendar-outline" label="Schedule" color={colors.green} onPress={() => router.push('/(psych-tabs)/calendar')} />
        </View>

        {/* Mood sparkline */}
        {moodScores.length > 0 && (
          <View style={styles.moodCard}>
            <View style={styles.moodHeader}>
              <ThemedText style={styles.moodLabel}>MOOD TREND — LAST {moodScores.length} ENTRIES</ThemedText>
              <ThemedText type="small" style={[styles.moodTrend, { color: trendUp ? colors.green : colors.rose }]}>
                {trendUp ? '↑ Improving' : '↓ Declining'}
              </ThemedText>
            </View>
            <View style={styles.sparkline}>
              {moodScores.map((v, i) => (
                <View
                  key={i}
                  style={[styles.sparkBar, { height: `${(v / 10) * 100}%`, backgroundColor: moodBarColor(v) }]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Assignments */}
        <View style={styles.secLabelRow}>
          <ThemedText style={styles.secMain}>Assignments</ThemedText>
          <Pressable onPress={() => setAssignModalOpen(true)}>
            <ThemedText type="small" themeColor="teal">+ New</ThemedText>
          </Pressable>
        </View>
        {assignments.length === 0 ? (
          <ThemedText type="small" themeColor="textTertiary" style={{ paddingVertical: 4 }}>
            No assignments yet.{' '}
            <ThemedText type="small" themeColor="teal" onPress={() => setAssignModalOpen(true)} style={{ fontWeight: '600' }}>
              Assign one →
            </ThemedText>
          </ThemedText>
        ) : (
          assignments.map((a) => (
            <View key={a.id} style={styles.assignRow}>
              <View style={[styles.assignIcon, { backgroundColor: a.done ? `${colors.green}26` : `${colors.gold}1F` }]}>
                <Ionicons name="clipboard-outline" size={16} color={a.done ? colors.green : colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.assignTitle}>{a.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.assignSub}>{a.sub}</ThemedText>
              </View>
              <View style={[styles.pill, { backgroundColor: a.done ? `${colors.green}2E` : `${colors.gold}26` }]}>
                <ThemedText style={[styles.pillText, { color: a.done ? colors.green : colors.gold }]}>
                  {a.done ? '✓ Done' : 'Pending'}
                </ThemedText>
              </View>
            </View>
          ))
        )}

        {/* Journal questions */}
        <ThemedText style={[styles.secLabel, { marginTop: 4 }]}>Journal questions</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 10 }}>
          Choose which reflection prompts appear in {firstName}'s journal.
        </ThemedText>
        {REFLECTION_QUESTIONS.map((q) => {
          const isOn = assignedQuestions.includes(q.key);
          return (
            <View key={q.key} style={styles.questionRow}>
              <ThemedText style={styles.questionText} numberOfLines={2}>{q.question}</ThemedText>
              <ToggleSwitch value={isOn} onValueChange={() => toggleQuestion(q.key)} size="small" />
            </View>
          );
        })}

        {customQuestions.map((q) => (
          <View key={q.id} style={styles.questionRow}>
            <ThemedText style={styles.questionText} numberOfLines={2}>{q.question}</ThemedText>
            <Pressable onPress={() => removeCustomQuestion(q.id)} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.rose} />
            </Pressable>
          </View>
        ))}

        <View style={styles.addQuestionRow}>
          <TextInput
            value={newCustomQuestion}
            onChangeText={setNewCustomQuestion}
            placeholder="Write a custom question…"
            placeholderTextColor={colors.textTertiary}
            style={styles.addQuestionInput}
          />
          <Pressable onPress={addCustomQuestion} style={styles.addQuestionBtn}>
            <Ionicons name="add" size={18} color={colors.background} />
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheetModal
        visible={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        title="Session notes"
        subtitle="Private clinical notes — not visible to the patient."
        ctaLabel="Save notes"
        onCta={saveNotes}
        cancelLabel="Cancel">
        <TextInput
          value={draftNote}
          onChangeText={setDraftNote}
          placeholder="Key observations, homework set, topics to follow up…"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={5}
          style={styles.notesInput}
        />
      </BottomSheetModal>

      <AssignModal visible={assignModalOpen} onClose={() => setAssignModalOpen(false)} onSend={handleAssignSend} />

      <JournalRequestModal
        visible={journalModalOpen}
        onClose={() => setJournalModalOpen(false)}
        onRequestSent={handleJournalRequestSent}
      />

      <SuccessModal
        visible={!!successInfo}
        onClose={() => setSuccessInfo(null)}
        icon={successInfo?.icon}
        title={successInfo?.title}
        subtitle={successInfo?.subtitle}
      />
    </ThemedView>
  );
}

function QuickAction({
  icon, label, color, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.qaBtn}>
      <View style={[styles.qaIcon, { backgroundColor: `${color}26` }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <ThemedText style={[styles.qaLabel, { color }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingTop: 13, paddingBottom: 10,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  backBtn: { marginRight: 10 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  headerStatus: { color: colors.textSecondary, marginTop: 1 },
  flagBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8 },
  flagText: { fontSize: 11, fontWeight: '700' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, paddingTop: Spacing.three,
  },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 20, padding: 15, marginBottom: 10,
    borderWidth: 0.5, borderColor: colors.border,
  },
  avatarLg: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avatarLgText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  bannerName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  bannerSpec: { marginTop: 2 },
  sessBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: `${colors.teal}14`,
    borderWidth: 0.5, borderColor: `${colors.teal}33`,
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 10,
  },
  sessTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  sessHint: { marginTop: 2 },
  linkCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10,
  },
  linkText: { flex: 1, fontSize: 13, color: colors.text },
  linkBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  linkBtnText: { color: '#fff', fontWeight: '600' },
  notesBox: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 0.5, borderColor: colors.border,
  },
  notesLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.9, marginBottom: 7 },
  notesText: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  notesAdd: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  notesInput: {
    backgroundColor: colors.backgroundSelected,
    borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 12, padding: 13, fontSize: 13, color: colors.text,
    fontStyle: 'italic', minHeight: 110, textAlignVertical: 'top', marginBottom: 8,
  },
  quickActions: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  qaBtn: {
    flex: 1, alignItems: 'center', gap: 5,
    backgroundColor: colors.backgroundElement,
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 6,
    borderWidth: 0.5, borderColor: colors.border,
  },
  qaIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 10.5, fontWeight: '600' },
  moodCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 0.5, borderColor: colors.border,
  },
  moodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  moodLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.9 },
  moodTrend: { fontWeight: '600' },
  sparkline: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 32 },
  sparkBar: { flex: 1, borderRadius: 4, minHeight: 4 },
  secLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 8, marginTop: 4,
  },
  secLabel: {
    fontSize: 10.5, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.1, paddingBottom: 8,
  },
  secMain: { fontSize: 10.5, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.1 },
  assignRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13, marginBottom: 7,
  },
  assignIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  assignTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  assignSub: { marginTop: 2 },
  pill: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: '700' },
  questionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13, marginBottom: 7,
  },
  questionText: { flex: 1, fontSize: 12.5, color: colors.text, lineHeight: 17 },
  addQuestionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  addQuestionInput: {
    flex: 1, backgroundColor: colors.backgroundSelected,
    borderWidth: 0.5, borderColor: colors.border,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 13,
    fontSize: 13, color: colors.text,
  },
  addQuestionBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
});
