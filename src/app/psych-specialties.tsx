import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

const SPECIALTIES = [
  'Cognitive Behavioral Therapy (CBT)',
  'Dialectical Behavior Therapy (DBT)',
  'Mindfulness-Based Therapy',
  'Trauma-Informed Care',
  'Anxiety & Stress',
  'Depression',
  'Grief & Loss',
  'Couples Therapy',
  'Family Therapy',
  'Child & Adolescent',
  'Addiction Recovery',
  'ADHD / Autism Spectrum',
];

export default function PsychSpecialtiesScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(item: string) {
    setSelected((prev) => (prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]));
  }

  function handleContinue() {
    // TODO: carry `selected` forward once we wire up Supabase (route params, context, etc.)
    router.push('/psych-mindspa');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.card}>
            <ThemedText type="title">What's your focus?</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              Select the approaches and specialties you mainly use. You can change this later.
            </ThemedText>

            <ThemedView style={styles.pillWrap}>
              {SPECIALTIES.map((item) => {
                const isSelected = selected.includes(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => toggle(item)}
                    style={[
                      styles.pill,
                      {
                        borderColor: isSelected ? theme.teal : theme.border,
                        backgroundColor: isSelected ? theme.tealSoft : theme.backgroundElement,
                      },
                    ]}>
                    <ThemedText type="small" themeColor={isSelected ? 'teal' : 'textSecondary'}>
                      {item}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>
          </ThemedView>
        </ScrollView>

        <ThemedView style={styles.footer}>
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.teal },
              selected.length === 0 && styles.disabledBtn,
            ]}
            disabled={selected.length === 0}
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
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  pill: {
    borderWidth: 1,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
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
