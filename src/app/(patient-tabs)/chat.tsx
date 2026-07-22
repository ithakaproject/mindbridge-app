import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

const AI_PROMPTS = [
  { emoji: '😟', label: 'Feeling anxious', text: "I'm feeling anxious right now" },
  { emoji: '🌿', label: 'Reflect on my week', text: 'Help me reflect on my week' },
  { emoji: '💬', label: 'I need to vent', text: 'I just need to vent' },
];

type AiMessage = { from: 'ai' | 'me'; text: string };

type ChatMessage = {
  id: string;
  sender: 'patient' | 'psychologist';
  body: string;
  created_at: string;
};

export default function PatientChatScreen() {
  const [pane, setPane] = useState<'psych' | 'ai'>('psych');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [psychDraft, setPsychDraft] = useState('');
  const [psychName, setPsychName] = useState('Your Psychologist');
  const [psychInitials, setPsychInitials] = useState('DR');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [psychologistId, setPsychologistId] = useState<string | null>(null);

  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      from: 'ai',
      text: "Hi 👋 I'm your AI support companion. I'm here to listen, help you reflect, or just chat. How are you feeling right now?",
    },
  ]);
  const [aiDraft, setAiDraft] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);

  const scrollRef = useRef<ScrollView>(null);

  async function loadChat() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setPatientId(user.id);

    // Get psychologist info
    const { data: patientProfile } = await supabase
      .from('patient_profiles')
      .select('psychologist_id')
      .eq('id', user.id)
      .single();

    if (!patientProfile?.psychologist_id) {
      setLoading(false);
      return;
    }
    setPsychologistId(patientProfile.psychologist_id);

    const { data: psychProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', patientProfile.psychologist_id)
      .single();

    if (psychProfile?.full_name) {
      const lastName = psychProfile.full_name.split(' ').slice(-1)[0];
      setPsychName(`Dr. ${lastName}`);
      setPsychInitials(
        psychProfile.full_name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      );
    }

    // Get the most recent session — used only to tag new outgoing messages
    // and to gate whether the input is enabled. Message HISTORY is loaded
    // separately below by patient_id, so it survives across however many
    // sessions get booked over time, instead of "disappearing" whenever a
    // new session becomes the most recent one.
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('patient_id', user.id)
      .eq('psychologist_id', patientProfile.psychologist_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const chatSessionId = existingSession?.id ?? null;
    setSessionId(chatSessionId);

    const { data: msgData, error: msgError } = await supabase
      .from('chat_messages')
      .select('id, sender, body, created_at')
      .eq('patient_id', user.id)
      .order('created_at');
    if (msgError) console.warn('CHAT HISTORY ERROR:', msgError.message);
    setMessages((msgData as ChatMessage[]) ?? []);

    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadChat(); }, []));

  async function sendPsychMessage() {
    const text = psychDraft.trim();
    if (!text || !sessionId || !patientId || sending) return;
    setSending(true);
    setSendError('');

    const { data: newMsg, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'patient',
        body: text,
        patient_id: patientId,
      })
      .select()
      .single();

    if (error || !newMsg) {
      // Keep the draft text so nothing is silently lost — the person can
      // see exactly what failed to send and retry.
      setSendError(error?.message ?? 'Message failed to send. Please try again.');
      setSending(false);
      return;
    }

    setPsychDraft('');
    setMessages((prev) => [...prev, newMsg as ChatMessage]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    if (psychologistId) {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: psychologistId,
        type: 'message',
        title: 'New message',
        body: text.length > 80 ? text.slice(0, 80) + '…' : text,
        related_id: sessionId,
      });
      if (notifError) console.warn('MESSAGE NOTIFICATION ERROR:', notifError.message);
    }

    setSending(false);
  }

  const sendAiMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setShowPrompts(false);
    setAiMessages((prev) => [...prev, { from: 'me', text: trimmed }]);
    setAiDraft('');
    // AI response is still a placeholder — real implementation needs server-side proxy
    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        { from: 'ai', text: "I'm here for you. Could you tell me more about that?" },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 500);
  };

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.tabRow}>
          <View style={styles.tabBtn} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.teal} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Pane switcher */}
      <View style={styles.tabRow}>
        <Pressable onPress={() => setPane('psych')} style={styles.tabBtn}>
          <ThemedText style={[styles.tabLabel, pane === 'psych' ? styles.tabLabelOn : styles.tabLabelOff]}>
            {psychName}
          </ThemedText>
          {pane === 'psych' && <View style={[styles.tabUnderline, { backgroundColor: colors.gold }]} />}
        </Pressable>
        <Pressable onPress={() => setPane('ai')} style={styles.tabBtn}>
          <ThemedText style={[styles.tabLabel, pane === 'ai' ? styles.tabLabelOnAi : styles.tabLabelOff]}>
            ✦ AI Support
          </ThemedText>
          {pane === 'ai' && <View style={[styles.tabUnderline, { backgroundColor: colors.teal }]} />}
        </Pressable>
      </View>

      {pane === 'psych' ? (
        <View style={styles.pane}>
          <View style={styles.psychHeader}>
            <View style={styles.psychAvatar}>
              <ThemedText style={styles.psychAvatarText}>{psychInitials}</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.psychName}>{psychName}</ThemedText>
              <ThemedText type="small" style={styles.psychStatus}>
                Your psychologist
              </ThemedText>
            </View>
            <Ionicons name="videocam" size={20} color={colors.gold} />
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.msgScroll}
            contentContainerStyle={styles.msgContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {messages.length === 0 && (
              <ThemedText themeColor="textTertiary" style={styles.emptyChat}>
                No messages yet. Say hello!
              </ThemedText>
            )}
            {messages.map((m) => {
              const isMe = m.sender === 'patient';
              return (
                <View key={m.id} style={isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem}>
                  <ThemedText type="small" themeColor="textTertiary" style={styles.bubbleSender}>
                    {isMe ? 'You' : psychName} · {formatTime(m.created_at)}
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
                You need a scheduled session to start messaging.
              </ThemedText>
            </View>
          )}

          {sendError !== '' && (
            <View style={styles.errorBanner}>
              <ThemedText type="small" themeColor="error">
                {sendError}
              </ThemedText>
            </View>
          )}

          <View style={styles.inputBar}>
            <TextInput
              value={psychDraft}
              onChangeText={setPsychDraft}
              placeholder="Type a message…"
              placeholderTextColor={colors.textTertiary}
              style={styles.inputField}
              editable={!!sessionId}
            />
            <Pressable
              onPress={sendPsychMessage}
              disabled={!sessionId || sending}
              style={[styles.sendBtn, (!sessionId || sending) && { opacity: 0.4 }]}>
              <Ionicons name="send" size={14} color={colors.background} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.pane}>
          <View style={styles.aiHeader}>
            <View style={styles.aiAvatar}>
              <ThemedText style={styles.aiAvatarText}>✦</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.psychName}>MindBridge AI</ThemedText>
              <ThemedText type="small" style={styles.aiStatus}>
                Always here for you · Confidential
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push('/exercises/breathing')} style={styles.breatheBtn}>
              <Ionicons name="leaf-outline" size={16} color={colors.teal} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.msgScroll}
            contentContainerStyle={styles.msgContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
            {aiMessages.map((m, i) => {
              const isMe = m.from === 'me';
              return (
                <View key={i} style={isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem}>
                  <ThemedText type="small" themeColor="textTertiary" style={styles.bubbleSender}>
                    {isMe ? 'You' : 'MindBridge AI'}
                  </ThemedText>
                  <View style={isMe ? styles.bubbleMe : styles.bubbleAi}>
                    <ThemedText style={isMe ? styles.bubbleMeText : styles.bubbleThemText}>
                      {m.text}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {showPrompts && (
            <View style={styles.promptsRow}>
              {AI_PROMPTS.map((p) => (
                <Pressable key={p.label} onPress={() => sendAiMessage(p.text)} style={styles.promptChip}>
                  <ThemedText style={styles.promptChipText}>
                    {p.emoji} {p.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.inputBar}>
            <TextInput
              value={aiDraft}
              onChangeText={setAiDraft}
              placeholder="Ask me anything…"
              placeholderTextColor={colors.textTertiary}
              style={styles.inputField}
            />
            <Pressable onPress={() => sendAiMessage(aiDraft)} style={styles.aiSendBtn}>
              <Ionicons name="send" size={14} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElement,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingTop: 10,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingBottom: 10 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  tabLabelOn: { color: colors.gold, fontWeight: '700' },
  tabLabelOnAi: { color: colors.teal, fontWeight: '700' },
  tabLabelOff: { color: colors.textTertiary },
  tabUnderline: { height: 2, width: '100%', position: 'absolute', bottom: 0 },
  pane: { flex: 1 },
  psychHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  psychAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  psychAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  psychName: { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  psychStatus: { color: colors.textSecondary, marginTop: 1 },
  aiHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: `${colors.tealDim}40`,
    borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  aiAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  aiAvatarText: { fontSize: 16 },
  aiStatus: { color: colors.teal, marginTop: 1 },
  breatheBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: `${colors.teal}26`,
    borderWidth: 0.5, borderColor: `${colors.teal}40`,
    alignItems: 'center', justifyContent: 'center',
  },
  msgScroll: { flex: 1 },
  msgContent: { padding: 16, paddingBottom: 8 },
  emptyChat: { textAlign: 'center', marginTop: 40 },
  noSessionBanner: {
    padding: 12, alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    borderTopWidth: 0.5, borderTopColor: colors.border,
  },
  errorBanner: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.backgroundElement,
    borderTopWidth: 0.5, borderTopColor: colors.border,
  },
  bubbleWrapThem: { alignSelf: 'flex-start', maxWidth: '78%', marginBottom: 10 },
  bubbleWrapMe: { alignSelf: 'flex-end', maxWidth: '78%', marginBottom: 10 },
  bubbleSender: { marginBottom: 4 },
  bubbleThem: {
    backgroundColor: colors.backgroundSelected,
    borderRadius: 18, borderBottomLeftRadius: 5,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: colors.border,
  },
  bubbleThemText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  bubbleAi: {
    backgroundColor: `${colors.teal}10`,
    borderWidth: 0.5, borderColor: `${colors.teal}33`,
    borderRadius: 18, borderBottomLeftRadius: 5,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  bubbleMe: {
    backgroundColor: colors.tealDim,
    borderRadius: 18, borderBottomRightRadius: 5,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  bubbleMeText: { fontSize: 13, color: '#fff', lineHeight: 19 },
  promptsRow: {
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6,
    backgroundColor: colors.backgroundElement,
    borderTopWidth: 0.5, borderTopColor: colors.border,
  },
  promptChip: {
    backgroundColor: colors.backgroundSelected,
    borderWidth: 0.5, borderColor: `${colors.teal}40`,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  promptChipText: { fontSize: 11.5, fontWeight: '500', color: colors.teal },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 0.5, borderTopColor: colors.border,
    backgroundColor: colors.backgroundElement,
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
  aiSendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
});
