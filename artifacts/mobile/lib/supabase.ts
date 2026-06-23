import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const storage =
  Platform.OS === "web"
    ? undefined
    : {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
      };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

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
  const { error } = await supabase.from("activities").insert(activity);
  if (error) {
    console.warn("Supabase insert failed:", error.message);
  }
}
