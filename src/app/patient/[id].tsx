import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { AssignModal, type AssignmentTemplate } from '@/components/assign-modal';
import { SuccessModal } from '@/components/success-modal';
import { JournalRequestModal } from '@/components/journal-request-modal';
import { Colors, Spacing, MaxContentWidth, BottomTabInset } from '@/constants/theme';
import { PATIENTS, FLAGS, type Assignment } from '@/data/patients';

const colors = Colors.dark;

const ASSIGN_ICONS: Record<Assignment['icon'], keyof typeof Ionicons.glyphMap> = {
  clipboard: 'clipboard-outline',
  brain: 'sparkles-outline',
  forms: 'document-text-outline',
  video: 'videocam-outline',
};

function moodBarColor(v: number) {
  if (v <= 3) return colors.rose;
  if (v <= 5) return colors.amber;
  return colors.green;
}

export default function PatientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patient = id ? PATIENTS[id] : undefined;

  const [linkRevealed, setLinkRevealed] = useState(false);

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  // TODO (Supabase): persist notes/assignments to the patient's record instead of local-only state
  const [savedNotes, setSavedNotes] = useState(patient?.notes ?? '');
  const [assignments, setAssignments] = useState(patient?.assignments ?? []);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ icon: string; title: string; subtitle: string } | null>(null);

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

  const flag = FLAGS[patient.flag];
  const lastMood = patient.mood[patient.mood.length - 1];
  const prevMood = patient.mood[patient.mood.length - 2];
  const trendUp = lastMood >= prevMood;

  const goToChat = () => router.push({ pathname: '/chat/[id]', params: { id: patient.id } });

  const goToJournal = () => {
    if (!patient.journalAccess) {
      setJournalModalOpen(true);
      return;
    }
    // TODO: build the full Journal viewer screen (entries list + detail) in a later step
    console.log('open journal viewer for', patient.id);
  };

  const openAssignModal = () => setAssignModalOpen(true);

  const handleAssignSend = (template: AssignmentTemplate) => {
    setAssignments((prev) => [
      { title: template.title, sub: 'Assigned today', done: false, icon: template.icon },
      ...prev,
    ]);
    setAssignModalOpen(false);
    setSuccessInfo({
      icon: '📋',
      title: 'Assignment sent',
      subtitle: `${template.title} has been sent to ${patient.name}.`,
    });
  };

  const handleJournalRequestSent = (period: string) => {
    console.log('journal access requested for', period);
  };

  const openNotesModal = () => {
    setDraftNote(savedNotes);
    setNotesModalOpen(true);
  };
  const saveNotes = () => {
    setSavedNotes(draftNote.trim());
    setNotesModalOpen(false);
    setSuccessInfo({ icon: '📝', title: 'Notes saved', subtitle: 'Your session notes have been saved privately.' });
  };

  const goToSchedule = () => router.push('/calendar');

  return (
    <ThemedView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <ThemedText style={styles.headerTitle}>{patient.name}</ThemedText>
          <ThemedText type="small" style={styles.headerStatus}>
            {patient.online ? '🟢 Online' : '⚫ Offline'}
          </ThemedText>
        </View>
        <View style={[styles.flagBadge, { backgroundColor: `${colors[flag.color]}2E` }]}>
          <ThemedText style={[styles.flagText, { color: colors[flag.color] }]}>{flag.label}</ThemedText>
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
          <View style={[styles.avatarLg, { backgroundColor: patient.color }]}>
            <ThemedText style={styles.avatarLgText}>{patient.initials}</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.bannerName}>{patient.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bannerSince}>
              {patient.since}
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.bannerSpec}>
              {patient.spec}
            </ThemedText>
          </View>
        </View>

        {/* Next session */}
        <Pressable onPress={() => setLinkRevealed((v) => !v)} style={styles.sessBanner}>
          <Ionicons name="calendar-outline" size={17} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.sessTitle}>Next: {patient.nextSess}</ThemedText>
            <ThemedText type="small" themeColor="teal" style={styles.sessHint}>
              Tap to reveal meeting link
            </ThemedText>
          </View>
          <View style={[styles.tag, { backgroundColor: `${colors.rose}2E` }]}>
            <ThemedText style={[styles.tagText, { color: colors.rose }]}>{patient.sessTag}</ThemedText>
          </View>
        </Pressable>

        {linkRevealed && (
          <View style={styles.linkCard}>
            <Ionicons name="videocam" size={17} color={colors.teal} />
            <ThemedText style={styles.linkText}>meet.google.com/xyz-abcd-efg</ThemedText>
            <Pressable style={styles.linkBtn}>
              <ThemedText type="small" style={styles.linkBtnText}>
                Start
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Session notes */}
        <View style={styles.notesBox}>
          <ThemedText style={styles.notesLabel}>LAST SESSION NOTES</ThemedText>
          <ThemedText style={styles.notesText}>{savedNotes || 'No notes added yet for this patient.'}</ThemedText>
          <Pressable onPress={openNotesModal} style={styles.notesAdd}>
            <Ionicons name="pencil" size={12} color={colors.teal} />
            <ThemedText type="small" themeColor="teal" style={{ fontWeight: '600' }}>
              {' '}Add note
            </ThemedText>
          </Pressable>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction icon="chatbubble-outline" label="Message" color={colors.teal} onPress={goToChat} />
          <QuickAction
            icon="book-outline"
            label={patient.journalAccess ? 'Journal' : 'Request'}
            color={colors.purple}
            onPress={goToJournal}
          />
          <QuickAction icon="clipboard-outline" label="Assign" color={colors.gold} onPress={openAssignModal} />
          <QuickAction icon="calendar-outline" label="Schedule" color={colors.green} onPress={goToSchedule} />
        </View>

        {/* Mood sparkline */}
        <View style={styles.moodCard}>
          <View style={styles.moodHeader}>
            <ThemedText style={styles.moodLabel}>MOOD TREND — LAST {patient.mood.length} ENTRIES</ThemedText>
            <ThemedText type="small" style={[styles.moodTrend, { color: trendUp ? colors.green : colors.rose }]}>
              {trendUp ? '↑ Improving' : '↓ Declining'}
            </ThemedText>
          </View>
          <View style={styles.sparkline}>
            {patient.mood.map((v, i) => (
              <View
                key={i}
                style={[styles.sparkBar, { height: `${(v / 10) * 100}%`, backgroundColor: moodBarColor(v) }]}
              />
            ))}
          </View>
          <View style={styles.sparkLabels}>
            <ThemedText type="small" themeColor="textTertiary" style={styles.sparkLbl}>
              Aug 1
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={styles.sparkLbl}>
              Aug 25
            </ThemedText>
          </View>
        </View>

        {/* Assignments */}
        <View style={styles.secLabelRow}>
          <ThemedText style={styles.secMain}>Assignments</ThemedText>
          <Pressable onPress={openAssignModal}>
            <ThemedText type="small" themeColor="teal">
              + New
            </ThemedText>
          </Pressable>
        </View>
        {assignments.length === 0 ? (
          <ThemedText type="small" themeColor="textTertiary" style={{ paddingVertical: 4 }}>
            No assignments yet.{' '}
            <ThemedText type="small" themeColor="teal" onPress={openAssignModal} style={{ fontWeight: '600' }}>
              Assign one →
            </ThemedText>
          </ThemedText>
        ) : (
          assignments.map((a, i) => (
            <View key={i} style={styles.assignRow}>
              <View
                style={[
                  styles.assignIcon,
                  { backgroundColor: a.done ? `${colors.green}26` : `${colors.gold}1F` },
                ]}>
                <Ionicons name={ASSIGN_ICONS[a.icon]} size={16} color={a.done ? colors.green : colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.assignTitle}>{a.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.assignSub}>
                  {a.sub}
                </ThemedText>
              </View>
              <View style={[styles.pill, { backgroundColor: a.done ? `${colors.green}2E` : `${colors.gold}26` }]}>
                <ThemedText style={[styles.pillText, { color: a.done ? colors.green : colors.gold }]}>
                  {a.done ? '✓ Done' : 'Pending'}
                </ThemedText>
              </View>
            </View>
          ))
        )}
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
  icon,
  label,
  color,
  onPress,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: 13,
    paddingBottom: 10,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backBtn: { marginRight: 10 },
  headerTitleWrap: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
  },
  headerStatus: { color: colors.green, marginTop: 1 },
  flagBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8 },
  flagText: { fontSize: 11, fontWeight: '700' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  avatarLg: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  avatarLgText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  bannerName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  bannerSince: { marginTop: 3 },
  bannerSpec: { marginTop: 2 },
  sessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${colors.teal}14`,
    borderWidth: 0.5,
    borderColor: `${colors.teal}33`,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  sessTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  sessHint: { marginTop: 2 },
  tag: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 10 },
  tagText: { fontSize: 10.5, fontWeight: '700' },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  linkText: { flex: 1, fontSize: 13, color: colors.text },
  linkBtn: { backgroundColor: colors.teal, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  linkBtnText: { color: '#fff', fontWeight: '600' },
  notesBox: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  notesLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.9, marginBottom: 7 },
  notesText: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  notesAdd: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  notesInput: {
    backgroundColor: colors.backgroundSelected,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  quickActions: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  qaBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  qaIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 10.5, fontWeight: '600' },
  moodCard: {
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  moodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  moodLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.9 },
  moodTrend: { fontWeight: '600' },
  sparkline: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 32 },
  sparkBar: { flex: 1, borderRadius: 4, minHeight: 4 },
  sparkLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  sparkLbl: { fontSize: 9 },
  secLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, marginTop: 4 },
  secMain: { fontSize: 10.5, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.1 },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
    marginBottom: 7,
  },
  assignIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  assignTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  assignSub: { marginTop: 2 },
  pill: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: '700' },
});
