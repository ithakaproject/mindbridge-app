import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { findTopMatches, type PsychCandidate } from '@/lib/matching';
import type { TimeOfDayId } from '@/data/specialties';

const colors = Colors.dark;

export default function PatientAccountScreen() {
  const params = useLocalSearchParams<{
    languages?: string;
    timeOfDay?: string;
    weights?: string;
    notes?: string;
  }>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    password.trim() !== '' &&
    !loading;

  async function handleSubmit() {
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: 'patient',
          full_name: fullName.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError('Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    let patientLanguages: string[] = [];
    let patientWeights: Record<string, number> = {};
    const timeOfDay = (params.timeOfDay as TimeOfDayId) ?? 'flexible';
    const notes = params.notes ?? '';

    try {
      if (params.languages) patientLanguages = JSON.parse(params.languages);
      if (params.weights) patientWeights = JSON.parse(params.weights);
    } catch {
      console.warn('Could not parse quiz answers, proceeding without them');
    }

    const { error: patientError } = await supabase
      .from('patient_profiles')
      .insert({
        id: userId,
        languages: patientLanguages,
        quiz_answers: { weights: patientWeights, timeOfDay },
        preference_notes: notes || null,
      });

    if (patientError) {
      setError('Account created but patient profile failed. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      const { data: psychProfiles, error: psychFetchError } = await supabase
        .from('psychologist_profiles')
        .select('id, specialty_scores, languages')
        .eq('status', 'approved');
      if (psychFetchError) console.warn('PSYCH FETCH ERROR:', psychFetchError.message);

      const candidateIds = (psychProfiles ?? []).map((p) => p.id);

      const { data: availData, error: availError } = await supabase
        .from('availability')
        .select('psychologist_id, day_of_week, start_time, end_time')
        .in('psychologist_id', candidateIds.length > 0 ? candidateIds : ['00000000-0000-0000-0000-000000000000']);
      if (availError) console.warn('AVAILABILITY FETCH ERROR:', availError.message);

      const candidates: PsychCandidate[] = (psychProfiles ?? []).map((p) => ({
        id: p.id,
        specialty_scores: p.specialty_scores,
        languages: p.languages,
        availability: (availData ?? []).filter((a) => a.psychologist_id === p.id),
      }));

      const ranked = findTopMatches(patientWeights, patientLanguages, timeOfDay, candidates);

      if (ranked.length > 0) {
        const [top, ...rest] = ranked;
        const alternates = rest.slice(0, 2).map((r) => r.id);

        const { error: matchError } = await supabase
          .from('patient_profiles')
          .update({
            psychologist_id: top.id,
            match_alternates: alternates,
          })
          .eq('id', userId);
        if (matchError) console.warn('MATCH ASSIGNMENT ERROR:', matchError.message);
      }
    } catch (matchingErr) {
      console.warn('Matching failed, patient can be matched manually later:', matchingErr);
    }

    setLoading(false);
    router.replace('/patient-pending');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formWrap}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
              <ThemedText type="title">Create your account</ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
                We'll use your answers to find your best psychologist match.
              </ThemedText>

              <View style={styles.inputWrap}>
                <TextInput
                  placeholder="Full name"
                  placeholderTextColor={colors.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { flex: 1 }]}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <ThemedText type="small" themeColor="teal">
                    {showPassword ? 'Hide' : 'Show'}
                  </ThemedText>
                </Pressable>
              </View>

              {error !== '' && (
                <ThemedText type="small" themeColor="error">
                  {error}
                </ThemedText>
              )}

              <Pressable
                style={[styles.primaryBtn, !canSubmit && styles.disabledBtn]}
                disabled={!canSubmit}
                onPress={handleSubmit}>
                <ThemedText type="smallBold" style={styles.primaryBtnText}>
                  {loading ? 'Creating account…' : 'Create account'}
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  formWrap: { flex: 1, width: '100%' },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  card: { width: '100%', maxWidth: MaxFormWidth, gap: Spacing.three },
  subtitle: { marginBottom: Spacing.two },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { fontSize: 13, flex: 1, color: colors.text },
  primaryBtn: {
    backgroundColor: colors.teal,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryBtnText: { color: '#fff' },
  disabledBtn: { opacity: 0.4 },
});
