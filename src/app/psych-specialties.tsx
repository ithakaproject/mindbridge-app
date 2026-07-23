import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';
import { SPECIALTY_CATEGORIES, LANGUAGES, type SpecialtyKey } from '@/data/specialties';

const colors = Colors.dark;

export default function PsychSpecialtiesScreen() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<SpecialtyKey, number>>(
    Object.fromEntries(SPECIALTY_CATEGORIES.map((c) => [c.key, 0])) as Record<SpecialtyKey, number>
  );

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  function setScore(key: SpecialtyKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  const canContinue = languages.length > 0;

  function handleContinue() {
    router.push({
      pathname: '/psych-mindspa',
      params: {
        languages: JSON.stringify(languages),
        specialtyScores: JSON.stringify(scores),
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
            <ThemedText type="title">What languages do you work in?</ThemedText>
            <View style={styles.pillWrap}>
              {LANGUAGES.map((lang) => {
                const isSelected = languages.includes(lang);
                return (
                  <Pressable
                    key={lang}
                    onPress={() => toggleLanguage(lang)}
                    style={[styles.pill, isSelected && styles.pillSelected]}>
                    <ThemedText type="small" themeColor={isSelected ? undefined : 'textSecondary'} style={isSelected ? styles.pillTextSelected : undefined}>
                      {lang}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <ThemedText type="title" style={{ marginTop: Spacing.four }}>Rate your specialties</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              0 = not offered, 3 = a specialty area. This is what patients get matched against — you can update it anytime.
            </ThemedText>

            {SPECIALTY_CATEGORIES.map((cat) => (
              <View key={cat.key} style={styles.specRow}>
                <ThemedText type="default" style={styles.specLabel}>{cat.label}</ThemedText>
                <View style={styles.scoreRow}>
                  {[0, 1, 2, 3].map((n) => {
                    const isActive = scores[cat.key] === n;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => setScore(cat.key, n)}
                        style={[styles.scoreBox, isActive && styles.scoreBoxActive]}>
                        <ThemedText type="smallBold" style={isActive ? styles.scoreTextActive : styles.scoreText}>
                          {n}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
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
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 13,
  },
  pillSelected: {
    borderColor: colors.tealDim,
    backgroundColor: colors.tealDim,
  },
  pillTextSelected: { color: '#fff', fontWeight: '600' },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    gap: Spacing.two,
  },
  specLabel: { flex: 1, color: colors.text },
  scoreRow: { flexDirection: 'row', gap: 6 },
  scoreBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBoxActive: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  scoreText: { color: colors.textSecondary },
  scoreTextActive: { color: '#fff' },
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
