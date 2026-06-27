import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

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
      </Stack>
    </ThemeProvider>
  );
}