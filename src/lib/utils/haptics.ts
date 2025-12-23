/**
 * Haptic Feedback Utility
 * Provides tactile feedback for mobile interactions
 */

/**
 * Check if haptic feedback is available
 */
export const isHapticSupported = (): boolean => {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Haptic feedback patterns
 */
export const haptics = {
  /**
   * Light tap feedback (10ms)
   * Use for: digit entry, list item taps, light interactions
   */
  light: () => {
    if (isHapticSupported()) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium tap feedback (20ms)
   * Use for: button presses, form submissions, standard actions
   */
  medium: () => {
    if (isHapticSupported()) {
      navigator.vibrate(20);
    }
  },

  /**
   * Heavy tap feedback (30ms)
   * Use for: important actions, destructive actions, confirmations
   */
  heavy: () => {
    if (isHapticSupported()) {
      navigator.vibrate(30);
    }
  },

  /**
   * Success pattern (10ms, 50ms pause, 10ms)
   * Use for: successful transactions, completed actions, positive feedback
   */
  success: () => {
    if (isHapticSupported()) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Error pattern (100ms, 50ms pause, 100ms)
   * Use for: errors, validation failures, negative feedback
   */
  error: () => {
    if (isHapticSupported()) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  /**
   * Warning pattern (20ms, 50ms pause, 20ms, 50ms pause, 20ms)
   * Use for: warnings, important notifications, attention grabbers
   */
  warning: () => {
    if (isHapticSupported()) {
      navigator.vibrate([20, 50, 20, 50, 20]);
    }
  },

  /**
   * Notification pattern (15ms)
   * Use for: incoming notifications, updates, new items
   */
  notification: () => {
    if (isHapticSupported()) {
      navigator.vibrate(15);
    }
  },

  /**
   * Selection pattern (5ms)
   * Use for: tab switches, navigation, menu selections
   */
  selection: () => {
    if (isHapticSupported()) {
      navigator.vibrate(5);
    }
  },
};

/**
 * Custom haptic pattern
 * @param pattern - Array of vibration durations in milliseconds
 */
export const customHaptic = (pattern: number | number[]) => {
  if (isHapticSupported()) {
    navigator.vibrate(pattern);
  }
};
