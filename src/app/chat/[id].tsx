import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AssignModal, type AssignmentTemplate } from '@/components/assign-modal';
import { SuccessModal } from '@/components/success-modal';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { PATIENTS, type ChatMessage } from '@/data/patients';

const colors = Colors.dark;

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patient = id ? PATIENTS[id] : undefined;

  const [messages, setMessages] = useState<ChatMessage[]>(patient?.msgs ?? []);
  const [draft, setDraft] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

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

  // TODO (Supabase + real backend): persist messages instead of local-only state
  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { f: 'me', t: text }]);
    setDraft('');
  };

  const handleAssignSend = (template: AssignmentTemplate) => {
    setMessages((prev) => [
      ...prev,
      { f: 'assign', title: template.title, sub: `Assigned · ${template.sub}`, done: false },
    ]);
    setAssignModalOpen(false);
    setSuccessOpen(true);
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.gold} />
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: patient.color }]}>
          <ThemedText style={styles.avatarText}>{patient.initials}</ThemedText>
        </View>
        <View style={styles.headerTitleWrap}>
          <ThemedText style={styles.headerTitle}>{patient.name}</ThemedText>
          <ThemedText type="small" style={styles.headerStatus}>
            {patient.online ? '🟢 Online' : '⚫ Offline'}
          </ThemedText>
        </View>
        <Pressable onPress={() => router.push(`/patient/${patient.id}`)} hitSlop={12} style={{ marginRight: 14 }}>
          <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
        </Pressable>
        <Ionicons name="videocam" size={20} color={colors.gold} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {messages.map((m, i) => {
          if (m.f === 'assign') {
            return (
              <View key={i} style={styles.assignBubble}>
                <ThemedText style={styles.assignLbl}>↑ ASSIGNMENT SENT</ThemedText>
                <ThemedText style={styles.assignTitle}>{m.title}</ThemedText>
                <View style={styles.assignSubRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {m.sub}
                  </ThemedText>
                  <View
                    style={[
                      styles.pill,
                      { backgroundColor: m.done ? `${colors.green}2E` : `${colors.gold}26` },
                    ]}>
                    <ThemedText style={[styles.pillText, { color: m.done ? colors.green : colors.gold }]}>
                      {m.done ? '✓ Done' : 'Pending'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          }
          const isMe = m.f === 'me';
          return (
            <View key={i} style={isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem}>
              <ThemedText type="small" themeColor="textTertiary" style={styles.bubbleSender}>
                {isMe ? 'You' : patient.name.split(' ')[0]}
              </ThemedText>
              <View style={isMe ? styles.bubbleMe : styles.bubbleThem}>
                <ThemedText style={isMe ? styles.bubbleMeText : styles.bubbleThemText}>{m.t}</ThemedText>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputBar}>
        <Pressable onPress={() => setAssignModalOpen(true)} style={styles.iconBtn}>
          <Ionicons name="attach" size={16} color={colors.textSecondary} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message…"
          placeholderTextColor={colors.textTertiary}
          style={styles.inputField}
        />
        <Pressable onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={14} color={colors.background} />
        </Pressable>
      </View>

      <AssignModal visible={assignModalOpen} onClose={() => setAssignModalOpen(false)} onSend={handleAssignSend} />
      <SuccessModal
        visible={successOpen}
        onClose={() => setSuccessOpen(false)}
        icon="📋"
        title="Assignment sent"
        subtitle="The patient has been notified."
      />
    </ThemedView>
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
    gap: 8,
  },
  backBtn: { marginRight: 2 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  headerStatus: {
    color: colors.green,
    marginTop: 1,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  bubbleWrapThem: {
    alignSelf: 'flex-start',
    maxWidth: '76%',
    marginBottom: 10,
  },
  bubbleWrapMe: {
    alignSelf: 'flex-end',
    maxWidth: '76%',
    marginBottom: 10,
  },
  bubbleSender: {
    marginBottom: 4,
  },
  bubbleThem: {
    backgroundColor: colors.backgroundSelected,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  bubbleThemText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  bubbleMe: {
    backgroundColor: colors.tealDim,
    borderRadius: 18,
    borderBottomRightRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMeText: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 19,
  },
  assignBubble: {
    alignSelf: 'flex-start',
    maxWidth: '84%',
    backgroundColor: `${colors.gold}10`,
    borderWidth: 0.5,
    borderColor: `${colors.gold}40`,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  assignLbl: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  assignTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  assignSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  pill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundElement,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.text,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
