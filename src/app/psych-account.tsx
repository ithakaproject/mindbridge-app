import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type DayEntry = { enabled: boolean; start: string; end: string };

function to24Hour(timeStr: string): string {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

export default function PsychAccountScreen() {
  const theme = useTheme();
  const { schedule: scheduleParam } = useLocalSearchParams<{ schedule?: string }>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    password.trim() !== '' &&
    license.trim() !== '' &&
    !loading;

  async function handleSubmit() {
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: 'psychologist',
          full_name: fullName.trim(),
        },
      },
    });

    console.log('SIGNUP DATA:', JSON.stringify(data));
    console.log('SIGNUP ERROR:', JSON.stringify(signUpError));

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

    const { error: psychError } = await supabase
      .from('psychologist_profiles')
      .insert({
        id: userId,
        license_number: license.trim(),
        status: 'pending',
      });

    console.log('PSYCH PROFILE ERROR:', JSON.stringify(psychError));

    if (psychError) {
      setError('Account created but psychologist profile failed. Please contact support.');
      setLoading(false);
      return;
    }

    if (scheduleParam) {
      try {
        const schedule: Record<string, DayEntry> = JSON.parse(scheduleParam);

        const availabilityRows = DAYS
          .map((day, index) => ({ day, index, entry: schedule[day] }))
          .filter(({ entry }) => entry?.enabled)
          .map(({ index, entry }) => ({
            psychologist_id: userId,
            day_of_week: index,
            start_time: to24Hour(entry.start),
            end_time: to24Hour(entry.end),
          }));

        if (availabilityRows.length > 0) {
          await supabase.from('availability').insert(availabilityRows);
        }
      } catch {
        console.warn('Could not save availability during signup');
      }
    }

    setLoading(false);
    router.replace('/psych-pending');
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
              <ThemedText type="title">Almost there</ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
                Create your account. We'll review your application before you can start seeing patients.
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

              <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="License number"
                  placeholderTextColor={theme.textTertiary}
                  value={license}
                  onChangeText={setLicense}
                  style={[styles.input, { color: theme.text }]}
                />
              </ThemedView>

              <ThemedText type="small" themeColor="textTertiary">
                We'll verify this during review.
              </ThemedText>

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
                  {loading ? 'Submitting…' : 'Submit for review'}
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
