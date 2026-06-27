import { StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { BottomSheetModal } from './bottom-sheet-modal';

type SuccessModalProps = {
  visible: boolean;
  onClose: () => void;
  icon?: string;
  title?: string;
  subtitle?: string;
};

export function SuccessModal({
  visible,
  onClose,
  icon = '✅',
  title = 'Done!',
  subtitle = 'Changes saved successfully.',
}: SuccessModalProps) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} ctaLabel="Great" onCta={onClose}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText type="small" style={styles.subtitle}>
        {subtitle}
      </ThemedText>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 19,
  },
});
