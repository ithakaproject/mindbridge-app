import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from './themed-text';
import { BottomSheetModal } from './bottom-sheet-modal';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export type AssignmentTemplate = {
  title: string;
  sub: string;
  icon: 'clipboard' | 'brain' | 'forms' | 'video';
  color: string;
};

const TEMPLATES: AssignmentTemplate[] = [
  { title: 'CBT Thought Record', sub: 'Daily worksheet', icon: 'clipboard', color: colors.gold },
  { title: 'Mindfulness Exercise', sub: 'Guided audio · 10 min', icon: 'brain', color: colors.teal },
  { title: 'Weekly Mood Survey', sub: '5 questions · 3 min', icon: 'forms', color: colors.purple },
  { title: 'Psychoeducation Video', sub: 'CBT Basics · 8 min', icon: 'video', color: colors.green },
];

const ICON_MAP: Record<AssignmentTemplate['icon'], keyof typeof Ionicons.glyphMap> = {
  clipboard: 'clipboard-outline',
  brain: 'sparkles-outline',
  forms: 'document-text-outline',
  video: 'videocam-outline',
};

type AssignModalProps = {
  visible: boolean;
  onClose: () => void;
  onSend: (template: AssignmentTemplate) => void;
};

export function AssignModal({ visible, onClose, onSend }: AssignModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Send to Patient"
      subtitle="Choose what to send."
      ctaLabel="Send Assignment"
      onCta={() => onSend(TEMPLATES[selectedIndex])}
      cancelLabel="Cancel">
      {TEMPLATES.map((t, i) => {
        const selected = i === selectedIndex;
        return (
          <Pressable
            key={t.title}
            onPress={() => setSelectedIndex(i)}
            style={[styles.row, selected && styles.rowSelected]}>
            <View style={[styles.icon, { backgroundColor: `${t.color}26` }]}>
              <Ionicons name={ICON_MAP[t.icon]} size={16} color={t.color} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>{t.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
                {t.sub}
              </ThemedText>
            </View>
            {selected && <Ionicons name="checkmark" size={15} color={colors.gold} />}
          </Pressable>
        );
      })}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  rowSelected: {
    borderColor: `${colors.gold}73`,
    backgroundColor: `${colors.gold}12`,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sub: {
    marginTop: 2,
  },
});
