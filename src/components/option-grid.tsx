import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

type Option = { label: string; emoji: string };

type OptionGridProps = {
  options: Option[];
  selected: string | null;
  onSelect: (label: string) => void;
  accentColor?: string;
};

export function OptionGrid({ options, selected, onSelect, accentColor = colors.gold }: OptionGridProps) {
  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        const isSelected = selected === opt.label;
        return (
          <Pressable
            key={opt.label}
            onPress={() => onSelect(opt.label)}
            style={[
              styles.cell,
              isSelected && { borderColor: accentColor, backgroundColor: `${accentColor}1F` },
            ]}>
            <ThemedText style={styles.emoji}>{opt.emoji}</ThemedText>
            <ThemedText style={[styles.label, isSelected && { color: accentColor, fontWeight: '700' }]}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.backgroundElement,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
