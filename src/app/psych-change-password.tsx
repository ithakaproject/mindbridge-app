import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function PsychChangePasswordScreen() {
  const theme = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const canSubmit = newPassword.length >= 6 && newPassword === confirmPassword && !saving;

  async function handleSave() {
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
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
              <ThemedText type="title">Change password</ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
                Choose a new password for your account.
              </ThemedText>

              <ThemedText type="small" themeColor="textSecondary">New password</ThemedText>
              <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="At least 6 characters"
                  placeholderTextColor={theme.textTertiary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  style={[styles.input, { color: theme.text, flex: 1 }]}
                />
                <Pressable onPress={() => setShowNew((v) => !v)}>
                  <ThemedText type="small" themeColor="teal">
                    {showNew ? 'Hide' : 'Show'}
                  </ThemedText>
                </Pressable>
              </ThemedView>

              <ThemedText type="small" themeColor="textSecondary">Confirm password</ThemedText>
              <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="Repeat new password"
                  placeholderTextColor={theme.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  style={[styles.input, { color: theme.text, flex: 1 }]}
                />
                <Pressable onPress={() => setShowConfirm((v) => !v)}>
                  <ThemedText type="small" themeColor="teal">
                    {showConfirm ? 'Hide' : 'Show'}
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {error !== '' && (
                <ThemedText type="small" themeColor="error">{error}</ThemedText>
              )}
              {success && (
                <ThemedText type="small" themeColor="teal">Password updated successfully.</ThemedText>
              )}

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: canSubmit ? theme.teal : theme.border }]}
                onPress={handleSave}
                disabled={!canSubmit}>
                <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>
                  {saving ? 'Saving…' : 'Update password'}
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
    flex: 1, width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four, paddingTop: Spacing.three,
  },
  formWrap: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.four },
  card: { width: '100%', maxWidth: MaxFormWidth, gap: Spacing.three },
  subtitle: { marginBottom: Spacing.two },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  input: { fontSize: 14 },
  primaryBtn: {
    paddingVertical: Spacing.three, borderRadius: Spacing.four,
    alignItems: 'center', marginTop: Spacing.two,
  },
});
