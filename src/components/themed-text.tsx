import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useScaledFontSize } from '@/hooks/use-font-scale';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

// Base sizes, designed at phone width. These scale up slightly on wider
// screens via useScaledFontSize, instead of staying frozen at phone size.
const metrics = {
  small: { fontSize: 14, lineHeight: 20 },
  smallBold: { fontSize: 14, lineHeight: 20 },
  default: { fontSize: 16, lineHeight: 24 },
  title: { fontSize: 48, lineHeight: 52 },
  subtitle: { fontSize: 32, lineHeight: 44 },
  link: { fontSize: 14, lineHeight: 30 },
  linkPrimary: { fontSize: 14, lineHeight: 30 },
  code: { fontSize: 12, lineHeight: 16 },
} as const;

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { fontSize, lineHeight } = metrics[type];
  const scaledFontSize = useScaledFontSize(fontSize);
  const scaledLineHeight = useScaledFontSize(lineHeight);

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles[type],
        { fontSize: scaledFontSize, lineHeight: scaledLineHeight },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: { fontFamily: 'Inter_500Medium' },
  smallBold: { fontFamily: 'Inter_700Bold' },
  default: { fontFamily: 'Inter_500Medium' },
  title: { fontFamily: 'Inter_600SemiBold' },
  subtitle: { fontFamily: 'Inter_600SemiBold' },
  link: { fontFamily: 'Inter_400Regular' },
  linkPrimary: { fontFamily: 'Inter_400Regular', color: '#3c87f7' },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
  },
});