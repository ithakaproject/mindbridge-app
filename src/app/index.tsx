import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth } from '@/constants/theme';

export default function WelcomeScreen() {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <ThemedText type="subtitle" themeColor="gold" style={styles.logo}>
            MindBridge
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.tagline}>
            A calmer way to connect with{'\n'}your psychologist.
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.teal },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/role-select')}>
            <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>
              Get Started
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: theme.border },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/login')}>
            <ThemedText type="smallBold" themeColor="text">
              Log In
            </ThemedText>
          </Pressable>

          {/* TODO: remove this dev-only block once real login + role-based
              redirect exists. It's a temporary way to reach each tab group
              directly while there's no auth wiring yet. */}
          <ThemedView style={styles.devRow}>
            <Pressable onPress={() => router.push('/(psych-tabs)')}>
              <ThemedText type="small" themeColor="textTertiary">
                Dev: Psych tabs
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => router.push('/(patient-tabs)')}>
              <ThemedText type="small" themeColor="textTertiary">
                Dev: Patient tabs
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.six,
  },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three },
  logo: { letterSpacing: -1 },
  tagline: { textAlign: 'center' },
  actions: { gap: Spacing.three },
  primaryBtn: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
  },
  pressed: { opacity: 0.8 },
  devRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
    marginTop: Spacing.three,
  },
});
