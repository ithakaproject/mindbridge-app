import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { BottomSheetModal } from './bottom-sheet-modal';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

const PERIODS = ['Yesterday', 'Last 7 days', 'Last 30 days', 'Last 3 months'];

type JournalRequestModalProps = {
  visible: boolean;
  onClose: () => void;
  onRequestSent: (period: string) => void;
};

export function JournalRequestModal({ visible, onClose, onRequestSent }: JournalRequestModalProps) {
  const [step, setStep] = useState<'select' | 'sent'>('select');
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);

  const handleClose = () => {
    onClose();
    setStep('select');
  };

  const handleSend = () => {
    setStep('sent');
    onRequestSent(selectedPeriod);
  };

  if (step === 'sent') {
    return (
      <BottomSheetModal visible={visible} onClose={handleClose} ctaLabel="Done" onCta={handleClose}>
        <ThemedText style={styles.sentIcon}>📩</ThemedText>
        <ThemedText style={styles.sentTitle}>Request sent!</ThemedText>
        <ThemedText type="small" style={styles.sentSub}>
          The patient will be notified and can accept or decline.
        </ThemedText>
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title="Request Journal Access"
      subtitle="Patient will receive a consent notification for the selected period."
      ctaLabel="Send Request"
      onCta={handleSend}
      cancelLabel="Cancel">
      {PERIODS.map((period) => {
        const selected = period === selectedPeriod;
        return (
          <Pressable
            key={period}
            onPress={() => setSelectedPeriod(period)}
            style={[styles.row, selected && styles.rowSelected]}>
            <ThemedText style={styles.label}>{period}</ThemedText>
            <View style={[styles.radio, selected && styles.radioSelected]} />
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
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSelected,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  rowSelected: {
    borderColor: colors.purple,
    backgroundColor: `${colors.purple}1A`,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  radioSelected: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  sentIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  sentTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  sentSub: {
    textAlign: 'center',
    lineHeight: 19,
  },
});
