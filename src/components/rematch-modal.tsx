import { useState } from 'react';
import { Modal, View, Pressable, TextInput, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from './themed-text';
import { Colors, Spacing } from '@/constants/theme';

const colors = Colors.dark;

const REASONS = [
  { icon: 'person-outline', label: 'Not the right fit for me' },
  { icon: 'calendar-outline', label: 'Scheduling difficulties' },
  { icon: 'sync-outline', label: 'I want a different speciality' },
  { icon: 'shield-outline', label: 'Personal reasons' },
] as const;

type Step = 'reason' | 'details' | 'info' | 'success';

type RematchModalProps = {
  visible: boolean;
  onClose: () => void;
  // TODO (Supabase): persist this to a real admin-facing rematch-requests table
  onSubmit: (reason: string, details: string) => void;
};

export function RematchModal({ visible, onClose, onSubmit }: RematchModalProps) {
  const [step, setStep] = useState<Step>('reason');
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  const reset = () => {
    setStep('reason');
    setReason(null);
    setDetails('');
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSubmit = () => {
    if (reason) onSubmit(reason, details.trim());
    setStep('success');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />

          {step === 'reason' && (
            <>
              <ThemedText style={styles.title}>Request a new psychologist</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                Help us find your best match. Why are you looking for someone new?
              </ThemedText>
              {REASONS.map((r) => {
                const selected = reason === r.label;
                return (
                  <Pressable
                    key={r.label}
                    onPress={() => setReason(r.label)}
                    style={[styles.reasonBtn, selected && styles.reasonBtnSelected]}>
                    <Ionicons name={r.icon} size={17} color={colors.textSecondary} />
                    <ThemedText style={styles.reasonLabel}>{r.label}</ThemedText>
                  </Pressable>
                );
              })}
              <Pressable
                disabled={!reason}
                onPress={() => setStep('details')}
                style={[styles.cta, !reason && styles.ctaDisabled]}>
                <ThemedText style={styles.ctaText}>Continue</ThemedText>
              </Pressable>
              <Pressable onPress={handleClose} style={styles.cancelBtn}>
                <ThemedText type="small" themeColor="textTertiary">
                  Cancel
                </ThemedText>
              </Pressable>
            </>
          )}

          {step === 'details' && (
            <>
              <ThemedText style={styles.title}>Tell us more</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                Help our care team understand what happened so they can find your best match
                and work toward the right next step.
              </ThemedText>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Share any details that would help us understand the situation…"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={5}
                style={styles.textarea}
              />
              <Pressable
                disabled={!details.trim()}
                onPress={() => setStep('info')}
                style={[styles.cta, !details.trim() && styles.ctaDisabled]}>
                <ThemedText style={styles.ctaText}>Continue</ThemedText>
              </Pressable>
              <Pressable onPress={() => setStep('reason')} style={styles.cancelBtn}>
                <ThemedText type="small" themeColor="textTertiary">
                  Back
                </ThemedText>
              </Pressable>
            </>
          )}

          {step === 'info' && (
            <>
              <ThemedText style={styles.title}>Finding your match</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                Our team will review your request and details, and match you within 48 hours.
                Your current sessions with Dr. Patel remain active until confirmed.
              </ThemedText>
              <View style={styles.infoBox}>
                <ThemedText style={styles.infoLabel}>WHAT HAPPENS NEXT</ThemedText>
                {[
                  'Your request and notes are reviewed by our care team',
                  'We match you based on needs & availability',
                  "You'll be notified to confirm your new match",
                ].map((line) => (
                  <View key={line} style={styles.infoRow}>
                    <Ionicons name="checkmark" size={15} color={colors.teal} />
                    <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
                      {line}
                    </ThemedText>
                  </View>
                ))}
              </View>
              <Pressable onPress={handleSubmit} style={styles.cta}>
                <ThemedText style={styles.ctaText}>Submit request</ThemedText>
              </Pressable>
              <Pressable onPress={handleClose} style={styles.cancelBtn}>
                <ThemedText type="small" themeColor="textTertiary">
                  Cancel
                </ThemedText>
              </Pressable>
            </>
          )}

          {step === 'success' && (
            <>
              <ThemedText style={styles.successIcon}>✅</ThemedText>
              <ThemedText style={styles.successTitle}>Request submitted!</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.successSub}>
                We'll notify you within 48 hours with your new psychologist match.
              </ThemedText>
              <Pressable onPress={handleClose} style={styles.cta}>
                <ThemedText style={styles.ctaText}>Done</ThemedText>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,18,28,0.92)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundElement,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 19,
    marginBottom: 14,
  },
  reasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: colors.backgroundSelected,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  reasonBtnSelected: {
    borderColor: colors.teal,
    backgroundColor: `${colors.teal}14`,
  },
  reasonLabel: {
    fontSize: 13,
    color: colors.text,
  },
  textarea: {
    backgroundColor: colors.backgroundSelected,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 13,
    fontSize: 13,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  infoBox: {
    backgroundColor: colors.backgroundSelected,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  infoLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 9,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 9,
  },
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    color: colors.text,
  },
  successSub: {
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 4,
  },
});
