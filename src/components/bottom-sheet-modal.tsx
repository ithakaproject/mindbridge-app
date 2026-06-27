import { Modal, View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors, Spacing } from '@/constants/theme';

const colors = Colors.dark;

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  ctaLabel?: string;
  onCta?: () => void;
  ctaDisabled?: boolean;
  cancelLabel?: string;
  sheetStyle?: ViewStyle;
};

export function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  ctaLabel,
  onCta,
  ctaDisabled,
  cancelLabel,
  sheetStyle,
}: BottomSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />
          {title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          ) : null}
          {children}
          {ctaLabel ? (
            <Pressable
              onPress={onCta}
              disabled={ctaDisabled}
              style={[styles.cta, ctaDisabled && styles.ctaDisabled]}>
              <ThemedText style={styles.ctaText}>{ctaLabel}</ThemedText>
            </Pressable>
          ) : null}
          {cancelLabel ? (
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <ThemedText type="small" themeColor="textTertiary">
                {cancelLabel}
              </ThemedText>
            </Pressable>
          ) : null}
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
    maxHeight: '84%',
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
});
