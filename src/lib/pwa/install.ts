/**
 * PWA install state shared by the install banner and Settings
 *
 * - Captures `beforeinstallprompt` once, early, so it isn't missed on pages without the banner
 * - Works out whether this browser can actually install (native prompt, iOS Add to Home Screen, or neither)
 * - Tracks engagement and dismissals so the banner backs off instead of nagging
 */

'use client';

import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallPlatform = 'native' | 'ios' | null;

// ─── Native prompt capture ───

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let captureStarted = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Start listening for install events. Safe to call more than once. */
export function initInstallCapture() {
  if (captureStarted || typeof window === 'undefined') return;
  captureStarted = true;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Suppress Chrome's mini-infobar; we decide when to offer install
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Social apps' built-in browsers can't install web apps
const IN_APP_BROWSER = /FBAN|FBAV|Instagram|Line\/|; wv\)|Twitter|TikTok|Snapchat/i;

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support gives it away
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** How this browser can install the app, or null if it can't (or already has) */
export function getInstallPlatform(): InstallPlatform {
  if (typeof window === 'undefined' || installed || isStandalone()) return null;
  if (deferredPrompt) return 'native';
  if (isIOS() && !IN_APP_BROWSER.test(navigator.userAgent)) return 'ios';
  return null;
}

/** Re-renders when install availability changes (e.g. the native prompt arrives) */
export function useInstallPlatform(): InstallPlatform {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getInstallPlatform,
    () => null
  );
}

/**
 * Show the browser's install dialog. The event is single-use, so it's cleared either way.
 * Returns 'unavailable' when there's no native prompt (e.g. iOS - show the guide instead).
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferredPrompt;
  if (!event) return 'unavailable';

  deferredPrompt = null;
  notify();

  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'dismissed') recordDismissal();
    return outcome;
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return 'dismissed';
  }
}

// ─── Banner pacing ───

const STATE_KEY = 'pwa-install-prompt';
const SESSION_KEY = 'pwa-install-session-counted';
const LEGACY_KEYS = ['pwa-install-dismissed', 'pwa-install-dismissed-at'];

const DAY = 24 * 60 * 60 * 1000;
/** Quiet period after the 1st and 2nd dismissal; after the 3rd the banner stops for good */
const BACKOFF = [14 * DAY, 60 * DAY];
const MAX_DISMISSALS = 3;
/** Sessions before the banner is first offered - wait until someone is actually using the app */
const MIN_SESSIONS = 3;

interface PromptState {
  visits: number;
  dismissCount: number;
  lastDismissedAt: number | null;
}

function readState(): PromptState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return { visits: 0, dismissCount: 0, lastDismissedAt: null, ...JSON.parse(raw) };
  } catch {
    // Unavailable or corrupt storage - treat as a fresh user
  }
  return { visits: 0, dismissCount: 0, lastDismissedAt: null };
}

function writeState(state: PromptState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked - pacing just won't persist
  }
}

/** Count this browser session once toward engagement */
export function recordSession() {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    return;
  }
  const state = readState();
  writeState({ ...state, visits: state.visits + 1 });
}

/** User closed the banner or declined the install dialog */
export function recordDismissal() {
  const state = readState();
  writeState({ ...state, dismissCount: state.dismissCount + 1, lastDismissedAt: Date.now() });
}

/** Whether pacing allows the banner right now (platform and page are checked by the caller) */
export function isBannerDue(): boolean {
  const { visits, dismissCount, lastDismissedAt } = readState();
  if (visits < MIN_SESSIONS || dismissCount >= MAX_DISMISSALS) return false;
  if (dismissCount === 0 || lastDismissedAt === null) return true;
  return Date.now() - lastDismissedAt >= BACKOFF[dismissCount - 1];
}
