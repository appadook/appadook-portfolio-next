'use client';
import { useSyncExternalStore } from 'react';
const subscribe = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};
export function useBreakpoint() {
  const width = useSyncExternalStore(
    subscribe,
    () => window.innerWidth,
    () => 1024,
  );
  const breakpoint =
    width < 640
      ? 'mobile'
      : width < 768
        ? 'sm'
        : width < 1024
          ? 'md'
          : width < 1280
            ? 'lg'
            : width < 1536
              ? 'xl'
              : '2xl';
  return {
    width,
    breakpoint,
    isMobile: width < 640,
    isSmall: width < 768,
    isMedium: width >= 768 && width < 1024,
    isLarge: width >= 1024 && width < 1280,
    isXLarge: width >= 1280,
    isMobileOrTablet: width < 1024,
    isDesktop: width >= 1024,
  };
}
