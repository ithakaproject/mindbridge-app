import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from './themed-text';
import { SwipeableTabs } from './swipeable-tabs';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ROUTES = ['/', '/patients', '/calendar', '/profile'];

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <SwipeableTabs routes={TAB_ROUTES}>
        <TabSlot style={{ flex: 1 }} />
      </SwipeableTabs>
      <TabList
        style={[
          styles.bottomNav,
          { paddingBottom: 15 + (Platform.OS === 'web' ? 0 : insets.bottom) },
        ]}>
        <TabTrigger name="home" href="/" asChild>
          <NavItem label="Home" iconActive="home" iconInactive="home-outline" />
        </TabTrigger>
        <TabTrigger name="patients" href="/patients" asChild>
          <NavItem label="Patients" iconActive="people" iconInactive="people-outline" />
        </TabTrigger>
        <TabTrigger name="calendar" href="/calendar" asChild>
          <NavItem label="Calendar" iconActive="calendar" iconInactive="calendar-outline" />
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
};

function NavItem({ label, iconActive, iconInactive, isFocused, ...props }: NavItemProps) {
  return (
    <Pressable {...props} style={styles.navItem}>
      <View style={[styles.navIconWrap, isFocused && styles.navIconWrapActive]}>
        <Ionicons
          name={isFocused ? iconActive : iconInactive}
          size={22}
          color={isFocused ? colors.gold : colors.tabInactive}
        />
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
});
