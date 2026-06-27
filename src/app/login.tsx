import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, MaxContentWidth, MaxFormWidth } from '@/constants/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleLogin() {
    // TODO: replace with real auth call once backend exists.
    // For now this just routes into the app so we can test navigation.
    router.replace('/(psych-tabs)');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText type="smallBold" themeColor="teal">← Back</ThemedText>
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formWrap}>
          <ThemedView style={styles.card}>
            <ThemedText type="title">Welcome back</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
              Log in to continue.
            </ThemedText>

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

            <Pressable style={[styles.primaryBtn, { backgroundColor: theme.teal }]} onPress={handleLogin}>
              <ThemedText type="smallBold" style={{ color: theme.textOnAccent }}>Log In</ThemedText>
            </Pressable>

            <Pressable onPress={() => router.push('/role-select')} style={styles.linkRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Don't have an account?{' '}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="gold">Get started</ThemedText>
            </Pressable>
          </ThemedView>
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
  backBtn: { alignSelf: 'flex-start' },
  formWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: MaxFormWidth,
    gap: Spacing.three,
  },
  subtitle: { marginBottom: Spacing.three },
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
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.two },
});
