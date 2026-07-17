import { DarkTheme, Stack, ThemeProvider, router } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role === 'psychologist') {
            router.replace('/(psych-tabs)');
          } else if (profile?.role === 'patient') {
            router.replace('/(patient-tabs)');
          }
        }
      } catch (e) {
        console.warn('Auth check failed:', e);
      }
    }
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          // router.replace('/') is unreliable when called from deep inside
          // a nested tab group (e.g. (patient-tabs) or (psych-tabs)) — Expo
          // Router can resolve '/' ambiguously against the group's own
          // index route instead of the true root, leaving the user stuck
          // on Home. A full page reload sidesteps that entirely and
          // matches what a manual browser refresh already does reliably.
          if (Platform.OS === 'web') {
            window.location.href = '/';
          } else {
            router.replace('/');
          }
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="patient-quiz" />
        <Stack.Screen name="patient-preferences" />
        <Stack.Screen name="patient-pending" />
        <Stack.Screen name="psych-specialties" />
        <Stack.Screen name="psych-mindspa" />
        <Stack.Screen name="psych-hours" />
        <Stack.Screen name="psych-account" />
        <Stack.Screen name="psych-pending" />
        <Stack.Screen name="(psych-tabs)" />
        <Stack.Screen name="assignment" />
        <Stack.Screen name="journal-entry" />
        <Stack.Screen name="journal-write" />
        <Stack.Screen name="exercises/breathing" />
        <Stack.Screen name="(patient-tabs)" />
        <Stack.Screen name="patient/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="psych-edit-profile" />
        <Stack.Screen name="psych-change-password" />
        <Stack.Screen name="psych-journal/[id]" />
        <Stack.Screen name="psych-journal-entry" />
      </Stack>
    </ThemeProvider>
  );
}
