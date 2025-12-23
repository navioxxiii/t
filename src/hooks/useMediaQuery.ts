import { useState, useEffect } from 'react';

/**
 * Custom hook to detect screen size changes using media queries
 * @param query - Media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // Initialize with the current match state on mount
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Create media query list
    const media = window.matchMedia(query);

    // Define listener function
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener (modern browsers)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook to detect if screen is mobile size
 * @returns true if screen width is less than 768px
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)');
}
