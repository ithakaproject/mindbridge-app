import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

export default function PsychAccountScreen() {
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [license, setLicense] = useState('');

  const canSubmit =
    fullName.trim() !== '' && email.trim() !== '' && password.trim() !== '' && license.trim() !== '';

  function handleSubmit() {
    // TODO: once Supabase is wired up:
    // 1. create the auth user (email/password)
    // 2. insert a row into psychologist_profiles with specialties, mindspa info,
    //    hours, license, and status: 'pending'
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

              <Pressable
                style={[
                  styles.primaryBtn,
                  { backgroundColor: theme.teal },
                  !canSubmit && styles.disabledBtn,
                ]}
                disabled={!canSubmit}
                onPress={handleSubmit}>
                <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>
                  Submit for review
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
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  formWrap: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.four },
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
  disabledBtn: { opacity: 0.4 },
});
