import { useState, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function PsychEditProfileScreen() {
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function loadProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: baseProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { data: psychProfile } = await supabase
      .from('psychologist_profiles')
      .select('bio')
      .eq('id', user.id)
      .single();

    setFullName(baseProfile?.full_name ?? '');
    setBio(psychProfile?.bio ?? '');
    setLoading(false);
  }

  useFocusEffect(useCallback(() => { loadProfile(); }, []));

  async function handleSave() {
    setError('');
    setSuccess(false);
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: nameError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);

    if (nameError) {
      setError('Could not update name. Please try again.');
      setSaving(false);
      return;
    }

    const { error: bioError } = await supabase
      .from('psychologist_profiles')
      .update({ bio: bio.trim() })
      .eq('id', user.id);

    if (bioError) {
      setError('Could not update bio. Please try again.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
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
              <ThemedText type="title">Edit profile</ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
                Update your name and professional statement.
              </ThemedText>

              <ThemedText type="small" themeColor="textSecondary">Full name</ThemedText>
              <ThemedView style={[styles.inputWrap, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="Full name"
                  placeholderTextColor={theme.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  style={[styles.input, { color: theme.text }]}
                />
              </ThemedView>

              <ThemedText type="small" themeColor="textSecondary">Professional statement</ThemedText>
              <ThemedView style={[styles.inputWrap, styles.textArea, { borderColor: theme.border }]}>
                <TextInput
                  placeholder="Write a short statement about your approach…"
                  placeholderTextColor={theme.textTertiary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, { color: theme.text }]}
                />
              </ThemedView>

              {error !== '' && (
                <ThemedText type="small" themeColor="error">{error}</ThemedText>
              )}
              {success && (
                <ThemedText type="small" themeColor="teal">Profile updated successfully.</ThemedText>
              )}

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: saving ? theme.border : theme.teal }]}
                onPress={handleSave}
                disabled={saving || loading}>
                <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>
                  {saving ? 'Saving…' : 'Save changes'}
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
    borderWidth: 1, borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  textArea: { minHeight: 100 },
  input: { fontSize: 14, flex: 1 },
  primaryBtn: {
    paddingVertical: Spacing.three, borderRadius: Spacing.four,
    alignItems: 'center', marginTop: Spacing.two,
  },
});
