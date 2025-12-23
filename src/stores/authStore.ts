import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useEffect } from 'react';

// Types
type NotificationPreferences = {
  email_deposits: boolean;
  email_withdrawals: boolean;
  email_swaps: boolean;
  email_security: boolean;
};

type SecurityPreferences = {
  idle_timeout_minutes: number;
  device_auth_enabled: boolean;
  pin_setup_completed: boolean;
};

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'super_admin';
  is_banned: boolean;
  notification_preferences: NotificationPreferences | null;
  pin_code_hash: string | null;
  last_pin_change_at: string | null;
  security_preferences: SecurityPreferences | null;
  kyc_status: 'not_started' | 'pending' | 'under_review' | 'approved' | 'rejected';
  kyc_tier: 'tier_1_basic' | 'tier_2_advanced' | null;
  kyc_verified_at: string | null;
  kyc_rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

// State interface
interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isLocked: boolean;
  hasPinSetup: boolean;

  // Profile metadata (not persisted)
  profileTimestamp: number | null;
  isFetching: boolean;

  // New: Improved loading state management
  authInitialized: boolean;      // True once initial auth check completes
  profileError: string | null;   // Error message for UI feedback
  fetchAttempts: number;         // Track retry attempts
  isLoggingOut: boolean;         // Prevents error flash during logout

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setIsLocked: (isLocked: boolean) => void;
  lockApp: () => void;
  unlockApp: () => void;
  fetchProfile: (userId: string, userEmail?: string | null) => Promise<void>;
  fetchProfileWithRetry: (userId: string, userEmail?: string | null, maxRetries?: number) => Promise<boolean>;
  silentRefreshProfile: (userId: string, userEmail?: string | null, maxRetries?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearProfileError: () => void;
  signOut: () => Promise<void>;
  forceLogout: () => void;
  initialize: () => Promise<void>;
}

// Helper to sanitize profile (remove sensitive fields)
const sanitizeProfile = (profile: Profile) => {
  const { pin_code_hash, ...safe } = profile;
  return safe;
};

// SSR-safe storage wrapper
const createSSRStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return createJSONStorage(() => localStorage);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      loading: true,
      isLocked: false,
      hasPinSetup: false,
      profileTimestamp: null,
      isFetching: false,

      // New state properties
      authInitialized: false,
      profileError: null,
      fetchAttempts: 0,
      isLoggingOut: false,

      // Simple setters
      setUser: (user) => set({ user }),
      setProfile: (profile) => {
        const hasPinSetup = profile ? !!(
          profile.pin_code_hash ||
          profile.security_preferences?.pin_setup_completed
        ) : false;

        set({
          profile,
          hasPinSetup,
          profileTimestamp: profile ? Date.now() : null
        });
      },
      setLoading: (loading) => set({ loading }),
      setIsLocked: (isLocked) => set({ isLocked }),

      // Lock actions
      lockApp: () => {
        const { hasPinSetup } = get();
        if (!hasPinSetup) {
          console.log('[AuthStore] Skipping lock: PIN not setup');
          return;
        }
        set({ isLocked: true });
      },

      unlockApp: () => {
        set({ isLocked: false });
      },

      // Fetch profile with race condition guard
      fetchProfile: async (userId: string, userEmail?: string | null) => {
        const { isFetching, profile: currentProfile } = get();

        // Race condition guard
        if (isFetching) {
          return;
        }

        set({ isFetching: true, profileError: null });
        console.log(`[AuthStore] fetchProfile: Starting fetch for userId: ${userId}`);

        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, notification_preferences, pin_code_hash, is_banned, last_pin_change_at, security_preferences, kyc_status, kyc_tier, kyc_verified_at, kyc_rejection_reason, created_at, updated_at')
            .eq('id', userId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              console.warn(`[AuthStore] fetchProfile: Profile not found for userId: ${userId}. Creating new profile.`);
              // Profile doesn't exist, create it
              await supabase.from('profiles').insert([{
                id: userId,
                email: userEmail || '',
                role: 'user',
                is_banned: false,
              }]);

              // Retry fetch
              const { data: newData, error: retryError } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, notification_preferences, pin_code_hash, is_banned, last_pin_change_at, security_preferences, kyc_status, kyc_tier, kyc_verified_at, kyc_rejection_reason, created_at, updated_at')
                .eq('id', userId)
                .single();

              if (retryError) {
                console.error(`[AuthStore] fetchProfile: Error retrying fetch after profile creation for userId: ${userId}`, retryError);
                set({ profileError: retryError.message });
                throw retryError;
              }

              get().setProfile(newData);
              console.log(`[AuthStore] fetchProfile: Successfully created and fetched profile for userId: ${userId}`);
              set({ isFetching: false, loading: false, profileError: null, fetchAttempts: 0 });
            } else {
              console.error(`[AuthStore] fetchProfile: Error fetching profile for userId: ${userId}`, error);
              // Set error for UI feedback
              set({ profileError: error.message });
              throw error; // Re-throw to be caught by fetchProfileWithRetry
            }
          } else {
            // Security checks
            if (currentProfile) {
              if (data.is_banned && !currentProfile.is_banned) {
                console.warn(`[AuthStore] fetchProfile: User ${userId} is banned, logging out.`);
                await get().signOut();
                if (typeof window !== 'undefined') {
                  window.location.href = '/login?banned=true';
                }
                return;
              }
            }

            get().setProfile(data);
            console.log(`[AuthStore] fetchProfile: Successfully fetched profile for userId: ${userId}`);
            set({ isFetching: false, loading: false, profileError: null, fetchAttempts: 0 });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[AuthStore] fetchProfile: Final catch error for userId: ${userId}`, message);
          set({ profileError: message });
          throw error; // Re-throw to propagate error to fetchProfileWithRetry
        } finally {
          set({ isFetching: false });
          // Only set loading: false if we have a profile
          if (get().profile) {
            set({ loading: false });
          }
        }
      },

      // Fetch profile with retry and exponential backoff
      fetchProfileWithRetry: async (userId: string, userEmail?: string | null, maxRetries = 3): Promise<boolean> => {
        console.log(`[AuthStore] fetchProfileWithRetry: Starting for userId: ${userId}, maxRetries: ${maxRetries}`);
        // Set loading true at start (provides UI feedback for "Try Again")
        set({ loading: true, profileError: null });

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          set({ fetchAttempts: attempt + 1 });
          console.log(`[AuthStore] fetchProfileWithRetry: Attempt ${attempt + 1} of ${maxRetries + 1} for userId: ${userId}`);

          try {
            await get().fetchProfile(userId, userEmail);

            // Check if profile was fetched successfully
            if (get().profile) {
              console.log(`[AuthStore] fetchProfileWithRetry: Profile successfully loaded on attempt ${attempt + 1} for userId: ${userId}`);
              set({ loading: false, profileError: null, fetchAttempts: 0 });
              return true;
            }
          } catch (error) {
            console.warn(`[AuthStore] fetchProfileWithRetry: Attempt ${attempt + 1} failed for userId: ${userId}. Error: ${get().profileError}`);
          }

          // Exponential backoff: 1s, 2s, 4s
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
            console.log(`[AuthStore] fetchProfileWithRetry: Waiting ${delay / 1000}s before next retry for userId: ${userId}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        // All retries exhausted
        console.error(`[AuthStore] fetchProfileWithRetry: All ${maxRetries + 1} attempts failed for userId: ${userId}.`);
        set({
          loading: false,
          profileError: 'Failed to load profile after multiple attempts'
        });
        return false;
      },
      
      silentRefreshProfile: async (userId: string, userEmail?: string | null, maxRetries = 3): Promise<void> => {
        console.log(`[AuthStore] silentRefreshProfile: Starting for userId: ${userId}`);
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            await get().fetchProfile(userId, userEmail);
            if (get().profile) {
              console.log(`[AuthStore] silentRefreshProfile: Success on attempt ${attempt + 1}`);
              return;
            }
          } catch (error) {
            console.warn(`[AuthStore] silentRefreshProfile: Attempt ${attempt + 1} failed.`);
          }
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        console.error(`[AuthStore] silentRefreshProfile: All attempts failed for userId: ${userId}. The user might see stale data.`);
      },

      // Clear profile error
      clearProfileError: () => set({ profileError: null }),

      // Refresh current profile (with loading state for UI feedback)
      refreshProfile: async () => {
        const { user } = get();
        if (user) {
          set({ loading: true });
          await get().fetchProfileWithRetry(user.id, user.email);
        }
      },

      // Sign out with timeout protection
      signOut: async () => {
        const LOGOUT_TIMEOUT = 5000; // 5 seconds max

        // Set isLoggingOut FIRST to prevent KYCGate from showing error screen
        set({ isLoggingOut: true });

        try {
          const supabase = createClient();

          // Wrap everything in a timeout
          const logoutWithTimeout = Promise.race([
            (async () => {
              await supabase.auth.signOut();

              set({
                user: null,
                profile: null,
                isLocked: false,
                hasPinSetup: false,
                profileTimestamp: null,
                loading: false,
                authInitialized: false
              });

              if (typeof window !== 'undefined') {
                // Clear storage synchronously (fast)
                localStorage.clear();
                sessionStorage.clear();

                // Service worker cleanup with its own timeout
                if ('serviceWorker' in navigator) {
                  try {
                    const swTimeout = new Promise((_, reject) =>
                      setTimeout(() => reject(new Error('SW timeout')), 2000)
                    );

                    await Promise.race([
                      (async () => {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        await Promise.all(registrations.map(reg => reg.unregister()));
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map(name => caches.delete(name)));
                      })(),
                      swTimeout
                    ]);
                  } catch {
                    // SW cleanup timed out, continue anyway
                  }
                }
              }
            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Logout timeout')), LOGOUT_TIMEOUT)
            )
          ]);

          await logoutWithTimeout;
        } catch {
          // Logout failed or timed out
        } finally {
          // ALWAYS redirect, even if cleanup failed
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },

      // Force logout without any async cleanup (for stuck states)
      forceLogout: () => {
        set({ isLoggingOut: true });

        if (typeof window !== 'undefined') {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch {
            // Ignore storage errors
          }
          window.location.href = '/login';
        }
      },

      // Initialize auth (called once on app load)
      initialize: async () => {
        if (typeof window === 'undefined') return;

        const { authInitialized } = get();
        if (authInitialized) {
          console.log('[AuthStore] initialize: Already initialized, skipping.');
          return;
        }

        // Mark as initialized FIRST to prevent race conditions
        set({ authInitialized: true });
        console.log('[AuthStore] initialize: Starting authentication initialization.');

        const INIT_TIMEOUT = 10000; // 10 seconds

        try {
          const supabase = createClient();

          const initWithTimeout = Promise.race([
            (async () => {
              const { data: { session } } = await supabase.auth.getSession();
              console.log('[AuthStore] initialize: Got session data.', { session });

              if (session?.user) {
                set({ user: session.user });
                console.log(`[AuthStore] initialize: User found, attempting to fetch profile for userId: ${session.user.id}`);
                const profileLoaded = await get().fetchProfileWithRetry(session.user.id, session.user.email);

                if (!profileLoaded) {
                  // If profile fails to load, treat as a failed login
                  console.warn('[AuthStore] initialize: Profile failed to load, nulling user and profile.');
                  set({
                    user: null,
                    profile: null,
                    loading: false,
                    profileError: 'Failed to load user profile during initialization.',
                  });
                } else {
                  console.log('[AuthStore] initialize: Profile successfully loaded.');
                }
              } else {
                // No session - clear stale cached profile
                console.log('[AuthStore] initialize: No session found, clearing user and profile.');
                set({ user: null, profile: null, loading: false });
              }
            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Init timeout')), INIT_TIMEOUT)
            )
          ]);

          await initWithTimeout;
          console.log('[AuthStore] initialize: Initialization complete.');

          // Setup auth listener AFTER initial fetch completes
          supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            // Skip INITIAL_SESSION event (already handled above)
            if (event === 'INITIAL_SESSION') {
              console.log('[AuthStore] onAuthStateChange: Skipping INITIAL_SESSION event.');
              return;
            }
            
            if (event === 'SIGNED_IN' && session?.user &&
                get().user?.id === session.user.id &&
                get().profile) {
              console.log(`[AuthStore] onAuthStateChange: Same user with profile, doing silent refresh`);
              set({ user: session.user }); // Update user with new session/tokens
              await get().silentRefreshProfile(session.user.id, session.user.email);
              return;
            }

            console.log(`[AuthStore] onAuthStateChange: Auth state changed. Event: ${event}`, { session });

            if (session?.user) {
              set({ user: session.user });
              console.log(`[AuthStore] onAuthStateChange: User found, attempting to fetch profile for userId: ${session.user.id}`);
              const profileLoaded = await get().fetchProfileWithRetry(session.user.id, session.user.email);
              if (!profileLoaded) {
                console.warn('[AuthStore] onAuthStateChange: Profile failed to load, nulling user and profile.');
                 set({
                    user: null,
                    profile: null,
                    loading: false,
                    profileError: 'Failed to load user profile after auth change.',
                  });
              } else {
                console.log('[AuthStore] onAuthStateChange: Profile successfully loaded.');
              }
            } else {
              console.log('[AuthStore] onAuthStateChange: No session found, clearing user and profile.');
              set({ user: null, profile: null, loading: false });
            }
          });

        } catch (error) {
          console.error('[AuthStore] initialize: Error during initialization or timeout.', error);
          set({ loading: false, profileError: 'Initialization timeout' });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createSSRStorage(),
      partialize: (state) => ({
        // Only persist these fields
        profile: state.profile ? sanitizeProfile(state.profile) : null,
        isLocked: state.isLocked,
      }),
    }
  )
);

// Separate hook for profile freshness check
export const useAuthPeriodicRefresh = () => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const profileTimestamp = useAuthStore((state) => state.profileTimestamp);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    if (!user || !profile) return;

    const checkFreshness = () => {
      if (!profileTimestamp) return;

      const age = Date.now() - profileTimestamp;
      const FIVE_MINUTES = 5 * 60 * 1000;

      if (age > FIVE_MINUTES) {
        console.log('[AuthStore] Profile stale, refreshing...');
        fetchProfile(user.id, user.email);
      }
    };

    // Check immediately
    checkFreshness();

    // Check every 2 minutes
    const interval = setInterval(checkFreshness, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, profile, profileTimestamp, fetchProfile]);
};
