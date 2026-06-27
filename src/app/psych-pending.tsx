import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

export default function PsychPendingScreen() {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.center}>
          <ThemedText type="title" themeColor="gold" style={styles.title}>
            Application submitted
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            Thanks! Our team will review your information and license shortly. We'll let you know
            once you're approved to start seeing patients.
          </ThemedText>

          <Pressable style={[styles.primaryBtn, { backgroundColor: theme.teal }]} onPress={() => router.replace('/')}>
            <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>Done</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: Spacing.four },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three, width: '100%' },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: MaxFormWidth },
  primaryBtn: {
    width: '100%',
    maxWidth: MaxFormWidth,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
