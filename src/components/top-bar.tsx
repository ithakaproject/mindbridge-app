import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { NotificationsModal } from './notifications-modal';
import { Colors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const colors = Colors.dark;

type TopBarProps = {
  showNotification?: boolean;
};

export function TopBar({ showNotification = true }: TopBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<'patient' | 'psychologist'>('patient');

  async function loadUnreadCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role === 'psychologist' || profile?.role === 'patient') {
      setUserRole(profile.role);
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.warn('UNREAD COUNT ERROR:', error.message);
      return;
    }
    setUnreadCount(count ?? 0);
  }

  useFocusEffect(
    useCallback(() => {
      if (showNotification) loadUnreadCount();
    }, [showNotification])
  );

  const handleClose = () => {
    setModalOpen(false);
    loadUnreadCount();
  };

  return (
    <View style={styles.topBar}>
      <View style={styles.logoWrap}>
        <ThemedView type="gold" style={styles.logoMark}>
          <Ionicons name="diamond" size={15} color={colors.background} />
        </ThemedView>
        <ThemedText type="smallBold" themeColor="gold" style={styles.logoText}>
          MindBridge
        </ThemedText>
      </View>
      {showNotification && (
        <>
          <Pressable onPress={() => setModalOpen(true)} style={styles.notifWrap} hitSlop={10}>
            <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </Pressable>
          <NotificationsModal visible={modalOpen} onClose={handleClose} userRole={userRole} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  notifWrap: {
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.rose,
    borderWidth: 1.5,
    borderColor: colors.backgroundElement,
  },
});
