/**
 * Notification Sound Helper
 * Play sound when new chat messages arrive
 * Includes proper cleanup to prevent memory leaks
 */

let audioInstance: HTMLAudioElement | null = null;

export function playNotificationSound() {
  try {
    // Stop any currently playing sound
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }

    // Create new audio instance
    // You can replace this with a custom notification sound file
    audioInstance = new Audio('/sounds/notification.mp3');
    audioInstance.volume = 0.5; // 50% volume

    audioInstance.play().catch((err) => {
      console.log('[NotificationSound] Could not play sound:', err);
      // Browsers may block autoplay, this is expected
    });
  } catch (err) {
    console.error('[NotificationSound] Error:', err);
  }
}

export function cleanupNotificationSound() {
  if (audioInstance) {
    audioInstance.pause();
    audioInstance.src = '';
    audioInstance = null;
  }
}

// Simple beep using Web Audio API as fallback
export function playBeep() {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.value = 0.1; // Volume

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1); // 100ms beep
  } catch (err) {
    console.error('[NotificationSound] Beep error:', err);
  }
}
