import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './client';
import { flushPendingRuns } from './api';
import { AuthContext, type AuthMode, type AuthValue, type Profile } from './context';
import { AuthModal } from './AuthModal';
import { FeedbackModal } from './FeedbackModal';
import { InstallPrompt } from './InstallPrompt';
import { HUB_SLUG } from './config';
import { hydrateStore } from './store';
import './dps.css';

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Wrong email or password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first — check your inbox.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('already registered')) return 'An account with that email already exists. Try signing in.';
  if (m.includes('password') && m.includes('characters')) return 'Password is too short.';
  return message;
}

async function fetchProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id,username,display_name,avatar,xp')
    .eq('id', id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children, site = HUB_SLUG }: { children: ReactNode; site?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  /** False until the session is known AND (if signed in) the account's saved data is loaded. */
  const [ready, setReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackGame, setFeedbackGame] = useState<string | null>(site === HUB_SLUG ? null : site);
  const activeUid = useRef<string | null | undefined>(undefined);

  // Load the account's data, then swap the user in. The app below remounts when the user changes (key={uid}),
  // so every game re-reads its saved data from a store that already holds the right player's data.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const apply = useCallback(
    (next: User | null): Promise<void> => {
      queue.current = queue.current.then(async () => {
        const id = next?.id ?? null;
        if (activeUid.current === id) {
          setUser(next); // same player (token refresh etc.) — no reload needed
          return;
        }
        await hydrateStore(id, site);
        activeUid.current = id;
        setUser(next);
        setReady(true);
      });
      return queue.current;
    },
    [site],
  );

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) void apply(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return; // handled by getSession above
      // never await Supabase calls directly inside this callback
      setTimeout(() => {
        if (!alive) return;
        void apply(session?.user ?? null);
        if (event === 'PASSWORD_RECOVERY') {
          setAuthMode('recovery');
          setAuthOpen(true);
        }
        if (event === 'SIGNED_IN') void flushPendingRuns();
      }, 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [apply]);

  const loading = !ready;

  const uid = user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!uid) return;
    setProfile(await fetchProfile(uid));
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      return;
    }
    let alive = true;
    fetchProfile(uid).then((p) => alive && setProfile(p));
    return () => {
      alive = false;
    };
  }, [uid]);

  useEffect(() => {
    const onXp = () => void refreshProfile();
    window.addEventListener('dps:xp', onXp);
    return () => window.removeEventListener('dps:xp', onXp);
  }, [refreshProfile]);

  const openAuth = useCallback((mode: AuthMode = 'signin') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const openFeedback = useCallback(
    (game?: string | null) => {
      setFeedbackGame(game === undefined ? (site === HUB_SLUG ? null : site) : game);
      setFeedbackOpen(true);
    },
    [site],
  );
  const closeFeedback = useCallback(() => setFeedbackOpen(false), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? friendly(error.message) : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: friendly(error.message), needsConfirm: false };
    // Supabase hides "already registered" by returning a user with no identities.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: 'An account with that email already exists. Try signing in.', needsConfirm: false };
    }
    return { error: null, needsConfirm: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    return error ? friendly(error.message) : null;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return error ? friendly(error.message) : null;
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      site,
      user,
      profile,
      loading,
      authOpen,
      authMode,
      setAuthMode,
      openAuth,
      closeAuth,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      feedbackOpen,
      feedbackGame,
      openFeedback,
      closeFeedback,
    }),
    [site, user, profile, loading, authOpen, authMode, openAuth, closeAuth, signIn, signUp, signOut, resetPassword, updatePassword, refreshProfile, feedbackOpen, feedbackGame, openFeedback, closeFeedback],
  );

  return (
    <AuthContext.Provider value={value}>
      {ready ? (
        <Fragment key={user?.id ?? 'guest'}>{children}</Fragment>
      ) : (
        <div className="dps-splash" role="status" aria-live="polite">
          <span aria-hidden>🐉</span>
          <p>Waking the dragon…</p>
        </div>
      )}
      <AuthModal />
      <FeedbackModal />
      <InstallPrompt />
    </AuthContext.Provider>
  );
}
