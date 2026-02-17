import * as React from "react"

// Breakpoint constants matching Tailwind defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

type Breakpoint = 'mobile' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Helper to determine breakpoint from width
 */
const getBreakpointFromWidth = (width: number): Breakpoint => {
  if (width < BREAKPOINTS.sm) return 'mobile'
  if (width < BREAKPOINTS.md) return 'sm'
  if (width < BREAKPOINTS.lg) return 'md'
  if (width < BREAKPOINTS.xl) return 'lg'
  if (width < BREAKPOINTS['2xl']) return 'xl'
  return '2xl'
}

/**
 * Enhanced hook providing granular breakpoint information
 * Returns current breakpoint and boolean helpers for responsive logic
 */
export function useBreakpoint() {
  const [width, setWidth] = React.useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(
    typeof window !== 'undefined' ? getBreakpointFromWidth(window.innerWidth) : 'lg'
  )

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const w = window.innerWidth
      setWidth(w)
      setBreakpoint(getBreakpointFromWidth(w))
    }

    // No need to call updateBreakpoint() here as state is initialized correctly
    // But we still need to listen for resize
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    width,
    // Boolean helpers for common checks
    isMobile: breakpoint === 'mobile',           // <640px (very small phones)
    isSmall: breakpoint === 'mobile' || breakpoint === 'sm', // <768px (phones)
    isMedium: breakpoint === 'md',               // 768-1023px (tablets)
    isLarge: breakpoint === 'lg',                // 1024-1279px (small laptops)
    isXLarge: breakpoint === 'xl' || breakpoint === '2xl', // 1280px+ (desktops)
    // Compound helpers
    isMobileOrTablet: ['mobile', 'sm', 'md'].includes(breakpoint), // <1024px
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),           // >=1024px
  }
}
