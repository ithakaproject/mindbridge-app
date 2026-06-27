import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { PATIENTS, type ChatMessage } from '@/data/patients';

const colors = Colors.dark;

// TODO (Supabase + auth): look up the logged-in patient instead of hardcoding "aj"
const CURRENT_PATIENT = PATIENTS.aj;

const AI_PROMPTS = [
  { emoji: '😟', label: 'Feeling anxious', text: "I'm feeling anxious right now" },
  { emoji: '🌿', label: 'Reflect on my week', text: 'Help me reflect on my week' },
  { emoji: '💬', label: 'I need to vent', text: 'I just need to vent' },
];

type AiMessage = { from: 'ai' | 'me'; text: string };

export default function PatientChatScreen() {
  const [pane, setPane] = useState<'psych' | 'ai'>('psych');

  // Psych pane state
  const [psychMessages, setPsychMessages] = useState<ChatMessage[]>(CURRENT_PATIENT.msgs);
  const [psychDraft, setPsychDraft] = useState('');

  // AI pane state
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      from: 'ai',
      text: "Hi Alex 👋 I'm your AI support companion. I'm here to listen, help you reflect, or just chat. How are you feeling right now?",
    },
  ]);
  const [aiDraft, setAiDraft] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);

  const sendPsychMessage = () => {
    const text = psychDraft.trim();
    if (!text) return;
    setPsychMessages((prev) => [...prev, { f: 'me', t: text }]);
    setPsychDraft('');
  };

  const startAssignment = () => {
    router.push({
      pathname: '/assignment',
      params: {
        title: 'CBT Thought Record',
        desc: 'Complete your automatic thoughts log for this week.',
        sub: 'Due today',
        tagColor: 'rose',
      },
    });
  };

  // TODO (Supabase + backend): replace this local placeholder with a real call to a
  // server-side proxy that holds the Anthropic API key securely and applies the
  // crisis-redirect safety logic noted in PROJECT_NOTES.md. Never call the Anthropic
  // API directly from the mobile app — any embedded key would be extractable.
  const sendAiMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setShowPrompts(false);
    setAiMessages((prev) => [...prev, { from: 'me', text: trimmed }]);
    setAiDraft('');
    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        { from: 'ai', text: "I'm here for you. Could you tell me more about that?" },
      ]);
    }, 500);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Pane switcher */}
      <View style={styles.tabRow}>
        <Pressable onPress={() => setPane('psych')} style={styles.tabBtn}>
          <ThemedText
            style={[styles.tabLabel, pane === 'psych' ? styles.tabLabelOn : styles.tabLabelOff]}>
            Dr. Anita Patel
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
              <ThemedText style={styles.psychAvatarText}>AP</ThemedText>
              <View style={styles.onlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.psychName}>Dr. Anita Patel</ThemedText>
              <ThemedText type="small" style={styles.psychStatus}>
                🟢 Online · Session at 3:00 PM
              </ThemedText>
            </View>
            <Ionicons name="videocam" size={20} color={colors.gold} />
          </View>

          <ScrollView style={styles.msgScroll} contentContainerStyle={styles.msgContent}>
            {psychMessages.map((m, i) => {
              if (m.f === 'assign') {
                return (
                  <View key={i} style={styles.assignBubble}>
                    <ThemedText style={styles.assignLbl}>📎 ASSIGNMENT FROM DR. PATEL</ThemedText>
                    <ThemedText style={styles.assignTitle}>{m.title}</ThemedText>
                    <View style={styles.assignSubRow}>
                      <ThemedText type="small" themeColor="textSecondary">
                        {m.sub}
                      </ThemedText>
                      <Pressable onPress={startAssignment} style={styles.assignDoBtn}>
                        <ThemedText style={styles.assignDoBtnText}>Start →</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                );
              }
              const isMe = m.f === 'me';
              return (
                <View key={i} style={isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem}>
                  <ThemedText type="small" themeColor="textTertiary" style={styles.bubbleSender}>
                    {isMe ? 'You' : 'Dr. Anita Patel'}
                  </ThemedText>
                  <View style={isMe ? styles.bubbleMe : styles.bubbleThem}>
                    <ThemedText style={isMe ? styles.bubbleMeText : styles.bubbleThemText}>
                      {m.t}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              value={psychDraft}
              onChangeText={setPsychDraft}
              placeholder="Type a message…"
              placeholderTextColor={colors.textTertiary}
              style={styles.inputField}
            />
            <Pressable onPress={sendPsychMessage} style={styles.sendBtn}>
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

          <ScrollView style={styles.msgScroll} contentContainerStyle={styles.msgContent}>
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
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelOn: {
    color: colors.gold,
    fontWeight: '700',
  },
  tabLabelOnAi: {
    color: colors.teal,
    fontWeight: '700',
  },
  tabLabelOff: {
    color: colors.textTertiary,
  },
  tabUnderline: {
    height: 2,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  pane: {
    flex: 1,
  },
  psychHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  psychAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  psychAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.backgroundElement,
  },
  psychName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  psychStatus: {
    color: colors.green,
    marginTop: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: `${colors.tealDim}40`,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: {
    fontSize: 16,
  },
  aiStatus: {
    color: colors.teal,
    marginTop: 1,
  },
  breatheBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.teal}26`,
    borderWidth: 0.5,
    borderColor: `${colors.teal}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgScroll: { flex: 1 },
  msgContent: {
    padding: 16,
    paddingBottom: 8,
  },
  bubbleWrapThem: {
    alignSelf: 'flex-start',
    maxWidth: '78%',
    marginBottom: 10,
  },
  bubbleWrapMe: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
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
  bubbleAi: {
    backgroundColor: `${colors.teal}10`,
    borderWidth: 0.5,
    borderColor: `${colors.teal}33`,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    maxWidth: '88%',
    backgroundColor: `${colors.purple}10`,
    borderWidth: 0.5,
    borderColor: `${colors.purple}40`,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  assignLbl: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.purple,
    letterSpacing: 1,
    marginBottom: 5,
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
    marginTop: 6,
  },
  assignDoBtn: {
    backgroundColor: colors.purple,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  assignDoBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  promptsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: colors.backgroundElement,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  promptChip: {
    backgroundColor: colors.backgroundSelected,
    borderWidth: 0.5,
    borderColor: `${colors.teal}40`,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  promptChipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.teal,
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
  aiSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tealDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
