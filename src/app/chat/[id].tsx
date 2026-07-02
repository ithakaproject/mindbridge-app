import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AssignModal, type AssignmentTemplate } from '@/components/assign-modal';
import { SuccessModal } from '@/components/success-modal';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

type ChatMessage = {
  id: string;
  sender: 'patient' | 'psychologist';
  body: string;
  created_at: string;
  assignment_id: string | null;
};

type PatientInfo = {
  id: string;
  full_name: string;
  initials: string;
  color: string;
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  '#258F80', '#C8943A', '#52C48A',
  '#E07272', '#A07ED4', '#E8A952',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ChatScreen() {
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [psychId, setPsychId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  async function loadChat() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !patientId) return;
    setPsychId(user.id);

    // Fetch patient profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', patientId)
      .single();

    if (profile) {
      setPatient({
        id: patientId,
        full_name: profile.full_name ?? 'Patient',
        initials: getInitials(profile.full_name ?? 'Patient'),
        color: avatarColor(patientId),
      });
    }

    // Get most recent session between this psychologist and patient
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id')
      .eq('psychologist_id', user.id)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const chatSessionId = sessionData?.id ?? null;
    setSessionId(chatSessionId);

    if (chatSessionId) {
      const { data: msgData } = await supabase
        .from('chat_messages')
        .select('id, sender, body, created_at, assignment_id')
        .eq('session_id', chatSessionId)
        .order('created_at');
      setMessages((msgData as ChatMessage[]) ?? []);
    }

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadChat(); }, [patientId]));

  async function sendMessage() {
    const text = draft.trim();
    if (!text || !sessionId || !psychId || sending) return;
    setSending(true);
    setDraft('');

    const { data: newMsg } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'psychologist',
        body: text,
        patient_id: patientId,
      })
      .select()
      .single();

    if (newMsg) {
      setMessages((prev) => [...prev, newMsg as ChatMessage]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }

    setSending(false);
  }

  async function handleAssignSend(template: AssignmentTemplate) {
    if (!patientId || !psychId) return;

    // Insert assignment into assignments table
    const { data: assignment } = await supabase
      .from('assignments')
      .insert({
        patient_id: patientId,
        psychologist_id: psychId,
        title: template.title,
        sub: template.sub,
        icon: template.icon ?? 'clipboard',
        done: false,
      })
      .select()
      .single();

    // Send a chat message referencing the assignment
    if (assignment && sessionId) {
      const { data: newMsg } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender: 'psychologist',
          body: `📋 Assignment: ${template.title}`,
          patient_id: patientId,
          assignment_id: assignment.id,
        })
        .select()
        .single();

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg as ChatMessage]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }

    setAssignModalOpen(false);
    setSuccessOpen(true);
  }

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
          <ThemedText style={styles.headerTitle}>{patient.full_name}</ThemedText>
          <ThemedText type="small" style={styles.headerStatus}>Patient</ThemedText>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/patient/[id]', params: { id: patient.id } })}
          hitSlop={12}
          style={{ marginRight: 14 }}>
          <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
        </Pressable>
        <Ionicons name="videocam" size={20} color={colors.gold} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages.length === 0 && (
          <ThemedText themeColor="textTertiary" style={styles.emptyChat}>
            No messages yet. Start the conversation!
          </ThemedText>
        )}
        {messages.map((m) => {
          const isMe = m.sender === 'psychologist';
          const isAssignment = m.assignment_id != null;

          if (isAssignment) {
            return (
              <View key={m.id} style={styles.assignBubble}>
                <ThemedText style={styles.assignLbl}>↑ ASSIGNMENT SENT</ThemedText>
                <ThemedText style={styles.assignTitle}>{m.body.replace('📋 Assignment: ', '')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 3 }}>
                  {formatTime(m.created_at)}
                </ThemedText>
              </View>
            );
          }

          return (
            <View key={m.id} style={isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem}>
              <ThemedText type="small" themeColor="textTertiary" style={styles.bubbleSender}>
                {isMe ? 'You' : patient.full_name.split(' ')[0]} · {formatTime(m.created_at)}
              </ThemedText>
              <View style={isMe ? styles.bubbleMe : styles.bubbleThem}>
                <ThemedText style={isMe ? styles.bubbleMeText : styles.bubbleThemText}>
                  {m.body}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {!sessionId && (
        <View style={styles.noSessionBanner}>
          <ThemedText type="small" themeColor="textTertiary">
            No session found with this patient yet.
          </ThemedText>
        </View>
      )}

      <View style={styles.inputBar}>
        <Pressable
          onPress={() => setAssignModalOpen(true)}
          style={styles.iconBtn}>
          <Ionicons name="attach" size={16} color={colors.textSecondary} />
        </Pressable>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message…"
          placeholderTextColor={colors.textTertiary}
          style={styles.inputField}
          editable={!!sessionId}
        />
        <Pressable
          onPress={sendMessage}
          disabled={!sessionId || sending}
          style={[styles.sendBtn, (!sessionId || sending) && { opacity: 0.4 }]}>
          <Ionicons name="send" size={14} color={colors.background} />
        </Pressable>
      </View>

      <AssignModal
        visible={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSend={handleAssignSend}
      />
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingTop: 13, paddingBottom: 10,
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 0.5, borderBottomColor: colors.border, gap: 8,
  },
  backBtn: { marginRight: 2 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  headerStatus: { color: colors.textSecondary, marginTop: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyChat: { textAlign: 'center', marginTop: 40 },
  noSessionBanner: {
    padding: 12, alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    borderTopWidth: 0.5, borderTopColor: colors.border,
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three, paddingBottom: Spacing.three,
  },
  bubbleWrapThem: { alignSelf: 'flex-start', maxWidth: '76%', marginBottom: 10 },
  bubbleWrapMe: { alignSelf: 'flex-end', maxWidth: '76%', marginBottom: 10 },
  bubbleSender: { marginBottom: 4 },
  bubbleThem: {
    backgroundColor: colors.backgroundSelected,
    borderRadius: 18, borderBottomLeftRadius: 5,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: colors.border,
  },
  bubbleThemText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  bubbleMe: {
    backgroundColor: colors.tealDim,
    borderRadius: 18, borderBottomRightRadius: 5,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  bubbleMeText: { fontSize: 13, color: '#fff', lineHeight: 19 },
  assignBubble: {
    alignSelf: 'flex-start', maxWidth: '84%',
    backgroundColor: `${colors.gold}10`,
    borderWidth: 0.5, borderColor: `${colors.gold}40`,
    borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 10,
  },
  assignLbl: { fontSize: 9.5, fontWeight: '700', color: colors.gold, letterSpacing: 1, marginBottom: 4 },
  assignTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 0.5, borderTopColor: colors.border,
    backgroundColor: colors.backgroundElement,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.backgroundSelected,
    alignItems: 'center', justifyContent: 'center',
  },
  inputField: {
    flex: 1, backgroundColor: colors.backgroundSelected,
    borderRadius: 22, paddingVertical: 9, paddingHorizontal: 14,
    fontSize: 13, color: colors.text,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
});
