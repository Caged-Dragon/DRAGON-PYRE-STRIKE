import { useCallback } from "react";
import { useAuth as useRealmAuth } from "../dps";

export interface AuthResult {
  ok: boolean;
  message?: string;
  confirmationRequired?: boolean;
}

/** Realm usernames are 3–20 letters, numbers or underscores. Turn a free-form callsign into one. */
export function callsignToUsername(callsign: string, email: string): string {
  const clean = (value: string) => value.replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  let name = clean(callsign.trim());
  if (name.length < 3) name = clean(email.split("@")[0] ?? "");
  if (name.length < 3) name = `Pilot_${Math.floor(1000 + Math.random() * 9000)}`;
  return name.slice(0, 20);
}

/**
 * Same shape the game UI has always used, backed by the central Dragon Realm account
 * (one login for Dragon Strike, Ember Wyrm, Drakebreaker, Dragon Flight and the hub).
 */
export function useAuth() {
  const realm = useRealmAuth();

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const error = await realm.signIn(email, password);
      return error ? { ok: false, message: error } : { ok: true };
    },
    [realm],
  );

  const signUp = useCallback(
    async (email: string, password: string, callsign: string): Promise<AuthResult> => {
      const res = await realm.signUp(email, password, callsignToUsername(callsign, email));
      return res.error ? { ok: false, message: res.error } : { ok: true, confirmationRequired: res.needsConfirm };
    },
    [realm],
  );

  const user = realm.user;
  const displayName = user
    ? realm.profile?.display_name ||
      realm.profile?.username ||
      (user.user_metadata?.username as string) ||
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email ||
      "Clan Pilot"
    : null;
  const provider = (user?.app_metadata?.provider as string | undefined) ?? null;

  return { user, loading: realm.loading, configured: true, signIn, signUp, signOut: realm.signOut, displayName, provider };
}
