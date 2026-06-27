import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

type IconName = keyof typeof Ionicons.glyphMap;

// TODO (Supabase): drive this from real unread-message state once chat has a backend
const HAS_UNREAD_MESSAGES = false;

export default function PatientAppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList
        style={[
          styles.bottomNav,
          { paddingBottom: 15 + (Platform.OS === 'web' ? 0 : insets.bottom) },
        ]}>
        <TabTrigger name="home" href="/" asChild>
          <NavItem label="Home" iconActive="home" iconInactive="home-outline" />
        </TabTrigger>
        <TabTrigger name="schedule" href="/schedule" asChild>
          <NavItem label="Schedule" iconActive="calendar" iconInactive="calendar-outline" />
        </TabTrigger>
        <TabTrigger name="journal" href="/journal" asChild>
          <NavItem label="Journal" iconActive="book" iconInactive="book-outline" />
        </TabTrigger>
        <TabTrigger name="chat" href="/chat" asChild>
          <NavItem
            label="Chat"
            iconActive="chatbubble"
            iconInactive="chatbubble-outline"
            showBadge={HAS_UNREAD_MESSAGES}
          />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <NavItem label="Profile" iconActive="person" iconInactive="person-outline" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

type NavItemProps = TabTriggerSlotProps & {
  label: string;
  iconActive: IconName;
  iconInactive: IconName;
  showBadge?: boolean;
};

function NavItem({ label, iconActive, iconInactive, isFocused, showBadge, ...props }: NavItemProps) {
  return (
    <Pressable {...props} style={styles.navItem}>
      <View style={[styles.navIconWrap, isFocused && styles.navIconWrapActive]}>
        <Ionicons
          name={isFocused ? iconActive : iconInactive}
          size={22}
          color={isFocused ? colors.gold : colors.tabInactive}
        />
        {showBadge && <View style={styles.badge} />}
      </View>
      <ThemedText style={[styles.navLabel, { color: isFocused ? colors.gold : colors.tabInactive }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundElement,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 5,
  },
  navIconWrap: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  navIconWrapActive: {
    backgroundColor: colors.tabActiveGlow,
  },
  navLabel: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.rose,
    borderWidth: 1.5,
    borderColor: colors.backgroundElement,
  },
});
