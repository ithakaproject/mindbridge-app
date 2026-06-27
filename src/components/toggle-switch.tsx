import { Pressable, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: 'default' | 'small';
};

export function ToggleSwitch({ value, onValueChange, size = 'default' }: ToggleSwitchProps) {
  const isSmall = size === 'small';
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[styles.track, isSmall && styles.trackSmall, value && styles.trackOn]}>
      <View style={[styles.thumb, isSmall && styles.thumbSmall, value && (isSmall ? styles.thumbOnSmall : styles.thumbOn)]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.backgroundSelected,
    justifyContent: 'center',
  },
  trackSmall: {
    width: 32,
    height: 18,
    borderRadius: 9,
  },
  trackOn: {
    backgroundColor: colors.tealDim,
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    position: 'absolute',
    left: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  thumbSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  thumbOn: {
    left: 20,
  },
  thumbOnSmall: {
    left: 16,
  },
});
