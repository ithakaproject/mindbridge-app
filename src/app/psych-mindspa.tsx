import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

export default function PsychMindspaScreen() {
  const theme = useTheme();
  const [hasCourses, setHasCourses] = useState<boolean | null>(null);
  const [courses, setCourses] = useState('');

  const canContinue = hasCourses !== null;

  function handleContinue() {
    // TODO: save `hasCourses` + `courses` to Supabase once it's wired up
    router.push('/psych-hours');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.card}>
            <ThemedText type="title">MindSpa courses</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              Have you created any courses on MindSpa?
            </ThemedText>

            <ThemedView style={styles.choiceRow}>
              <Pressable
                onPress={() => setHasCourses(true)}
                style={[
                  styles.choicePill,
                  {
                    borderColor: hasCourses === true ? theme.teal : theme.border,
                    backgroundColor: hasCourses === true ? theme.tealSoft : theme.backgroundElement,
                  },
                ]}>
                <ThemedText type="smallBold" themeColor={hasCourses === true ? 'teal' : 'textSecondary'}>
                  Yes
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setHasCourses(false);
                  setCourses('');
                }}
                style={[
                  styles.choicePill,
                  {
                    borderColor: hasCourses === false ? theme.teal : theme.border,
                    backgroundColor: hasCourses === false ? theme.tealSoft : theme.backgroundElement,
                  },
                ]}>
                <ThemedText type="smallBold" themeColor={hasCourses === false ? 'teal' : 'textSecondary'}>
                  No
                </ThemedText>
              </Pressable>
            </ThemedView>

            {hasCourses === true && (
              <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="List the course name(s), separated by commas"
                  placeholderTextColor={theme.textTertiary}
                  value={courses}
                  onChangeText={setCourses}
                  multiline
                  style={[styles.input, { color: theme.text }]}
                />
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>

        <ThemedView style={styles.footer}>
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.teal },
              !canContinue && styles.disabledBtn,
            ]}
            disabled={!canContinue}
            onPress={handleContinue}>
            <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>Continue</ThemedText>
          </Pressable>
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
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: Spacing.four },
  card: { width: '100%', maxWidth: MaxFormWidth, gap: Spacing.three },
  subtitle: { marginBottom: Spacing.two },
  choiceRow: { flexDirection: 'row', gap: Spacing.two },
  choicePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 80,
  },
  input: { fontSize: 14 },
  footer: { width: '100%', alignItems: 'center', paddingVertical: Spacing.three },
  primaryBtn: {
    width: '100%',
    maxWidth: MaxFormWidth,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.4 },
});
