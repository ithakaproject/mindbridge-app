import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, Spacing } from '@/constants/theme';

const colors = Colors.dark;

type TopBarProps = {
  showNotification?: boolean;
};

export function TopBar({ showNotification = true }: TopBarProps) {
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
        <View style={styles.notifWrap}>
          <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          <View style={styles.notifDot} />
        </View>
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
