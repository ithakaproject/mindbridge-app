import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

const colors = Colors.dark;

export default function PsychMindspaScreen() {
  const params = useLocalSearchParams<{ languages?: string; specialtyScores?: string }>();
  const [hasCourses, setHasCourses] = useState<boolean | null>(null);
  const [courses, setCourses] = useState('');

  const canContinue = hasCourses !== null;

  function handleContinue() {
    router.push({
      pathname: '/psych-hours',
      params: {
        languages: params.languages ?? '[]',
        specialtyScores: params.specialtyScores ?? '{}',
      },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <ThemedText type="title">MindSpa courses</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              Have you created any courses on MindSpa?
            </ThemedText>

            <View style={styles.choiceRow}>
              <Pressable
                onPress={() => setHasCourses(true)}
                style={[styles.choicePill, hasCourses === true && styles.choicePillSelected]}>
                <ThemedText type="smallBold" themeColor={hasCourses === true ? undefined : 'textSecondary'} style={hasCourses === true ? styles.choicePillTextSelected : undefined}>
                  Yes
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setHasCourses(false);
                  setCourses('');
                }}
                style={[styles.choicePill, hasCourses === false && styles.choicePillSelected]}>
                <ThemedText type="smallBold" themeColor={hasCourses === false ? undefined : 'textSecondary'} style={hasCourses === false ? styles.choicePillTextSelected : undefined}>
                  No
                </ThemedText>
              </Pressable>
            </View>

            {hasCourses === true && (
              <View style={styles.inputWrap}>
                <TextInput
                  placeholder="List the course name(s), separated by commas"
                  placeholderTextColor={colors.textTertiary}
                  value={courses}
                  onChangeText={setCourses}
                  multiline
                  style={styles.input}
                />
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryBtn, !canContinue && styles.disabledBtn]}
            disabled={!canContinue}
            onPress={handleContinue}>
            <ThemedText type="smallBold" style={styles.primaryBtnText}>Continue</ThemedText>
          </Pressable>
        </View>
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
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  choicePillSelected: {
    borderColor: colors.tealDim,
    backgroundColor: colors.tealDim,
  },
  choicePillTextSelected: { color: '#fff' },
  inputWrap: {
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 80,
  },
  input: { fontSize: 13, color: colors.text },
  footer: { width: '100%', alignItems: 'center', paddingVertical: Spacing.three },
  primaryBtn: {
    width: '100%',
    maxWidth: MaxFormWidth,
    backgroundColor: colors.teal,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff' },
  disabledBtn: { opacity: 0.4 },
});
