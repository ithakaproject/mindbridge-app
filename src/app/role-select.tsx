import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

export default function RoleSelectScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <ThemedView style={styles.center}>
          <ThemedView style={styles.heading}>
            <ThemedText type="title">Which best describes you?</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              We'll guide you down the right path.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.cardWrap}>
            <Pressable onPress={() => router.push('/patient-quiz')}>
              <ThemedView type="backgroundElement" style={[styles.roleCard, { borderColor: theme.border }]}>
                <ThemedText type="smallBold" themeColor="gold">I'm seeking therapy</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  We'll match you with a psychologist based on your needs.
                </ThemedText>
              </ThemedView>
            </Pressable>

            <Pressable onPress={() => router.push('/psych-specialties')}>
              <ThemedView type="backgroundElement" style={[styles.roleCard, { borderColor: theme.border }]}>
                <ThemedText type="smallBold" themeColor="teal">I'm a psychologist</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Set up your practice profile to start seeing patients.
                </ThemedText>
              </ThemedView>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.five, width: '100%' },
  heading: { alignItems: 'center', gap: Spacing.two },
  subtitle: { textAlign: 'center' },
  cardWrap: { width: '100%', maxWidth: MaxFormWidth, gap: Spacing.three },
  roleCard: {
    borderWidth: 1,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
  },
});