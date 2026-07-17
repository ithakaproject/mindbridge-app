import { useRef } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { router, usePathname } from 'expo-router';

const SWIPE_THRESHOLD = 60;
const DIRECTION_RATIO = 1.5; // horizontal movement must dominate vertical by this much

type Props = {
  children: React.ReactNode;
  routes: string[]; // ordered list of tab hrefs, e.g. ['/', '/patients', '/calendar', '/profile']
  disableOnRoutes?: string[]; // routes where swipe should be turned off entirely
};

export function SwipeableTabs({ children, routes, disableOnRoutes = [] }: Props) {
  const pathname = usePathname();
  const screenWidth = Dimensions.get('window').width;

  // Normalize e.g. "/(patient-tabs)/schedule" -> "/schedule" for matching
  // against the plain hrefs used in TabTrigger.
  function normalize(path: string): string {
    const withoutGroup = path.replace(/\/\([^)]+\)/g, '');
    return withoutGroup === '' ? '/' : withoutGroup;
  }

  const currentPath = normalize(pathname);
  const isDisabled = disableOnRoutes.some((r) => normalize(r) === currentPath);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        if (isDisabled) return false;
        const { dx, dy } = gesture;
        return Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * DIRECTION_RATIO;
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (isDisabled) return;
        const { dx, vx } = gesture;
        const isSwipe = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5;
        if (!isSwipe) return;

        const currentIndex = routes.findIndex((r) => normalize(r) === currentPath);
        if (currentIndex === -1) return;

        if (dx < 0 && currentIndex < routes.length - 1) {
          // Swiped left — go to next tab
          router.push(routes[currentIndex + 1] as any);
        } else if (dx > 0 && currentIndex > 0) {
          // Swiped right — go to previous tab
          router.push(routes[currentIndex - 1] as any);
        }
      },
    })
  ).current;

  return (
    <View style={styles.flex} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
