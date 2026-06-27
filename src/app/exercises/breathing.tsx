import { useEffect, useRef, useState } from 'react';
import { Animated, View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';

const colors = Colors.dark;

const PHASES = [
  { label: 'Inhale', count: 4, scale: 1.3, glow: `${colors.teal}66` },
  { label: 'Hold', count: 4, scale: 1.3, glow: `${colors.gold}4D` },
  { label: 'Exhale', count: 4, scale: 1, glow: `${colors.teal}26` },
  { label: 'Hold', count: 4, scale: 1, glow: `${colors.purple}33` },
];

export default function BreathingScreen() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [count, setCount] = useState(PHASES[0].count);
  const scale = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const animateToPhase = (index: number) => {
    Animated.timing(scale, {
      toValue: PHASES[index].scale,
      duration: 4000,
      useNativeDriver: true,
    }).start();
  };

  const start = () => {
    setRunning(true);
    setPhaseIndex(0);
    setCount(PHASES[0].count);
    animateToPhase(0);

    intervalRef.current = setInterval(() => {
      setCount((prevCount) => {
        if (prevCount > 1) return prevCount - 1;
        setPhaseIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % PHASES.length;
          animateToPhase(nextIndex);
          return nextIndex;
        });
        return PHASES[(phaseIndex + 1) % PHASES.length].count;
      });
    }, 1000);
  };

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhaseIndex(0);
    setCount(PHASES[0].count);
    scale.setValue(1);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            stop();
            router.back();
          }}
          hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Box Breathing</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[styles.orb, { backgroundColor: phase.glow, transform: [{ scale }] }]}>
          <ThemedText style={styles.phaseLabel}>{phase.label}</ThemedText>
          <ThemedText style={styles.phaseCount}>{count}</ThemedText>
        </Animated.View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.instructions}>
          Breathe in for 4 · Hold for 4{'\n'}Breathe out for 4 · Hold for 4
        </ThemedText>

        {!running && (
          <Pressable onPress={start} style={styles.startBtn}>
            <ThemedText style={styles.startBtnText}>Start</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1F32' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: 13,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  orb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${colors.teal}4D`,
  },
  phaseLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.teal,
    textAlign: 'center',
  },
  phaseCount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  instructions: {
    marginTop: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  startBtn: {
    marginTop: 28,
    backgroundColor: colors.tealDim,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 40,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
