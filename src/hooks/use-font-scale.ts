import { useWindowDimensions } from 'react-native';

// Your mockups were designed at a 320px-wide phone. At that width (or narrower),
// text stays exactly the size you designed. On wider screens — tablets, laptops —
// text scales up a bit so it doesn't look tiny, capped so desktop never looks
// comically oversized.
const PHONE_MAX_WIDTH = 480;
const DESKTOP_WIDTH = 1200;
const MAX_SCALE = 1.2;

export function useFontScale() {
  const { width } = useWindowDimensions();
  if (width <= PHONE_MAX_WIDTH) return 1;
  if (width >= DESKTOP_WIDTH) return MAX_SCALE;
  const progress = (width - PHONE_MAX_WIDTH) / (DESKTOP_WIDTH - PHONE_MAX_WIDTH);
  return 1 + progress * (MAX_SCALE - 1);
}

export function useScaledFontSize(size: number) {
  return Math.round(size * useFontScale());
}
