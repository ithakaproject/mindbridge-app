import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function PatientAccountScreen() {
  const theme = useTheme();
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

    // 1. Create the auth user, passing role in metadata so the trigger
    //    writes the correct role into the profiles table automatically.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { role: 'patient' },
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

    // 2. Update the profiles row (created by the trigger) with full name.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', userId);

    if (profileError) {
      setError('Account created but profile update failed. Please contact support.');
      setLoading(false);
      return;
    }

    // 3. Create the patient_profiles row.
    //    Quiz answers from earlier screens will be wired in later
    //    when we tackle passing data between onboarding screens.
    const { error: patientError } = await supabase
      .from('patient_profiles')
      .insert({ id: userId });

    if (patientError) {
      setError('Account created but patient profile failed. Please contact support.');
      setLoading(false);
      return;
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
            <ThemedView style={styles.card}>
              <ThemedText type="title">Create your account</ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
                We'll use your answers to find your best psychologist matches.
              </ThemedText>

              <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="Full name"
                  placeholderTextColor={theme.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  style={[styles.input, { color: theme.text }]}
                />
              </ThemedView>

              <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={theme.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: theme.text }]}
                />
              </ThemedView>

              <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: theme.text, flex: 1 }]}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <ThemedText type="small" themeColor="teal">
                    {showPassword ? 'Hide' : 'Show'}
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {error !== '' && (
                <ThemedText type="small" themeColor="error">
                  {error}
                </ThemedText>
              )}

              <Pressable
                style={[
                  styles.primaryBtn,
                  { backgroundColor: canSubmit ? theme.teal : theme.border },
                ]}
                disabled={!canSubmit}
                onPress={handleSubmit}>
                <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>
                  {loading ? 'Creating account…' : 'Create account'}
                </ThemedText>
              </Pressable>
            </ThemedView>
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
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: { fontSize: 14, flex: 1 },
  primaryBtn: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
