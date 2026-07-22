import { useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { BottomSheetModal } from './bottom-sheet-modal';
import { Colors } from '@/constants/theme';

const colors = Colors.dark;

const PRESET_COUNTS = [5, 10, 20];

type JournalRequestModalProps = {
  visible: boolean;
  onClose: () => void;
  onRequestSent: (count: number) => void;
};

export function JournalRequestModal({ visible, onClose, onRequestSent }: JournalRequestModalProps) {
  const [step, setStep] = useState<'select' | 'sent'>('select');
  const [selectedCount, setSelectedCount] = useState<number>(PRESET_COUNTS[0]);
  const [customText, setCustomText] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleClose = () => {
    onClose();
    setStep('select');
    setUseCustom(false);
    setCustomText('');
  };

  const handleSend = () => {
    const finalCount = useCustom ? parseInt(customText, 10) : selectedCount;
    if (!finalCount || finalCount < 1) return;
    setStep('sent');
    onRequestSent(finalCount);
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

  const customValid = useCustom ? parseInt(customText, 10) > 0 : true;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      title="Request Journal Access"
      subtitle="Choose how many of the patient's most recent journal entries you'd like to view."
      ctaLabel="Send Request"
      onCta={handleSend}
      cancelLabel="Cancel">
      {PRESET_COUNTS.map((count) => {
        const selected = !useCustom && count === selectedCount;
        return (
          <Pressable
            key={count}
            onPress={() => { setUseCustom(false); setSelectedCount(count); }}
            style={[styles.row, selected && styles.rowSelected]}>
            <ThemedText style={styles.label}>Last {count} entries</ThemedText>
            <View style={[styles.radio, selected && styles.radioSelected]} />
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => setUseCustom(true)}
        style={[styles.row, useCustom && styles.rowSelected]}>
        <ThemedText style={styles.label}>Custom amount</ThemedText>
        <View style={[styles.radio, useCustom && styles.radioSelected]} />
      </Pressable>

      {useCustom && (
        <TextInput
          value={customText}
          onChangeText={setCustomText}
          placeholder="Number of entries…"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          style={styles.customInput}
        />
      )}

      {!customValid && (
        <ThemedText type="small" themeColor="error" style={{ marginTop: 4 }}>
          Enter a number greater than 0.
        </ThemedText>
      )}
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
  customInput: {
    backgroundColor: colors.backgroundSelected,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
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
