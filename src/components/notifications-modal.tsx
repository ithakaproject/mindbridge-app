import { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  related_id: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  message: 'chatbubble-outline',
  assignment: 'clipboard-outline',
  journal_request: 'book-outline',
  journal_shared: 'book-outline',
};

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

type Props = {
  visible: boolean;
  onClose: () => void;
  userRole: 'patient' | 'psychologist';
};

export function NotificationsModal({ visible, onClose, userRole }: Props) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, body, related_id, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('NOTIFICATIONS LOAD ERROR:', error.message);
    }
    setNotifications((data as NotificationRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (visible) loadNotifications();
  }, [visible]);

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) console.warn('MARK READ ERROR:', error.message);
  }

  function handlePress(n: NotificationRow) {
    if (!n.read) markAsRead(n.id);
    onClose();

    if (n.type === 'message' && n.related_id) {
      if (userRole === 'psychologist') {
        router.push({ pathname: '/chat/[id]', params: { id: n.related_id } });
      } else {
        router.push('/(patient-tabs)/chat');
      }
    } else if (n.type === 'assignment') {
      if (userRole === 'patient') {
        router.push('/(patient-tabs)');
      }
    } else if ((n.type === 'journal_request' || n.type === 'journal_shared') && n.related_id) {
      if (userRole === 'psychologist') {
        router.push({ pathname: '/patient/[id]', params: { id: n.related_id } });
      }
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <View style={styles.header}>
              <ThemedText type="smallBold">Notifications</ThemedText>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {loading ? (
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <ActivityIndicator color={colors.teal} />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={24} color={colors.textTertiary} />
                <ThemedText type="small" themeColor="textTertiary" style={{ marginTop: 8 }}>
                  No notifications yet.
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.list}>
                {notifications.map((n) => (
                  <Pressable key={n.id} onPress={() => handlePress(n)} style={styles.row}>
                    {!n.read && <View style={styles.unreadDot} />}
                    <View style={[styles.iconWrap, { backgroundColor: n.read ? colors.backgroundSelected : `${colors.teal}26` }]}>
                      <Ionicons
                        name={TYPE_ICONS[n.type] ?? 'notifications-outline'}
                        size={16}
                        color={n.read ? colors.textTertiary : colors.teal}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.rowTitle, !n.read && { fontWeight: '700' }]}>
                        {n.title}
                      </ThemedText>
                      {n.body && (
                        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                          {n.body}
                        </ThemedText>
                      )}
                      <ThemedText type="small" themeColor="textTertiary" style={{ marginTop: 2 }}>
                        {formatTime(n.created_at)}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-start', alignItems: 'flex-end' },
  sheet: {
    width: 320, maxHeight: 440, marginTop: 60, marginRight: Spacing.three,
    borderRadius: Spacing.four, padding: Spacing.three,
    borderWidth: 0.5, borderColor: Colors.dark.border,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  list: { maxHeight: 380 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 10, position: 'relative',
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border,
  },
  unreadDot: {
    position: 'absolute', left: -4, top: 16,
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.dark.rose,
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { fontSize: 13, color: Colors.dark.text },
});
