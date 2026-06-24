import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type Session, type User } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

/**
 * Single source of truth for auth + cloud-side data.
 *
 * The client is configured to persist its session in AsyncStorage and auto-
 * refresh tokens, so a user stays signed in across launches. Native sign-up /
 * sign-in / sign-out / Google OAuth all live here, plus a small helper to mirror
 * an activity to the `activities` table.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

const storage =
  Platform.OS === "web"
    ? undefined
    : {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
      };

export const supabase = createClient(supabaseUrl || "https://placeholder.invalid", supabaseAnonKey || "placeholder-anon-key", {
  auth: {
    storage: storage as any,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
});

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Authentication isn't configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env, then restart the app."
    );
  }
}

// ─── session helpers ────────────────────────────────────────────────────────

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

// ─── email / password ───────────────────────────────────────────────────────

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  assertConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyAuthError(error.message));
  if (!data.session) throw new Error("Sign-in did not return a session.");
  return data.session;
}

export async function signUpWithPassword(email: string, password: string, name?: string): Promise<Session | null> {
  assertConfigured();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: name ? { name } : undefined },
  });
  if (error) throw new Error(friendlyAuthError(error.message));
  // When email confirmation is on, session may be null until the user confirms.
  return data.session;
}

// ─── Google OAuth via expo-web-browser ──────────────────────────────────────

/**
 * Opens an in-app browser to Supabase's Google OAuth endpoint, then parses the
 * returned tokens from the deep-link redirect and hands them to Supabase.
 *
 * Works in standalone builds (deep link via the `mobile` scheme) and in Expo
 * Go (auth proxy redirect handled by AuthSession.makeRedirectUri).
 */
export async function signInWithGoogle(): Promise<Session> {
  assertConfigured();

  const redirectTo = AuthSession.makeRedirectUri({ scheme: "mobile", path: "auth-callback" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) throw new Error(friendlyAuthError(error.message));
  if (!data?.url) throw new Error("Could not start Google sign-in.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) {
    throw new Error("Google sign-in was cancelled.");
  }

  // Supabase returns tokens in the URL fragment; QueryParams handles both.
  const { params, errorCode } = QueryParams.getQueryParams(result.url);
  if (errorCode) throw new Error("Google sign-in failed: " + errorCode);
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (!accessToken || !refreshToken) {
    // Some configurations return a code instead — exchange it.
    const code = Linking.parse(result.url).queryParams?.code as string | undefined;
    if (code) {
      const { data: ex, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
      if (exErr) throw new Error(friendlyAuthError(exErr.message));
      if (!ex.session) throw new Error("Google sign-in did not return a session.");
      return ex.session;
    }
    throw new Error("Google sign-in did not return a session.");
  }

  const { data: setData, error: setErr } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (setErr) throw new Error(friendlyAuthError(setErr.message));
  if (!setData.session) throw new Error("Could not establish session.");
  return setData.session;
}

// ─── sign out ───────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

// ─── activity mirror (best-effort) ──────────────────────────────────────────

export interface SupabaseActivity {
  id: string;
  user_id: string;
  date: string;
  type: string;
  duration_minutes: number;
  distance_km: number | null;
  pace: string | null;
  notes: string | null;
}

export async function insertActivity(activity: SupabaseActivity): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("activities").insert(activity);
  if (error) console.warn("Supabase insert failed:", error.message);
}

// ─── helpers ────────────────────────────────────────────────────────────────

export function deriveProfile(user: User | null): { id: string; name: string; email: string } | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { name?: string; full_name?: string };
  const name = meta.name || meta.full_name || (user.email ? user.email.split("@")[0] : "Friend");
  return { id: user.id, name, email: user.email ?? "" };
}

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Invalid email or password.";
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists.";
  if (m.includes("password")) return "Password must be at least 6 characters.";
  if (m.includes("network")) return "Network error. Check your connection and try again.";
  return msg;
}

// Required so the WebBrowser redirect resolves cleanly on iOS / Android.
WebBrowser.maybeCompleteAuthSession();
