import "react-native-url-polyfill/auto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith("http")
);

const isSSR = typeof window === "undefined";

const noopStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

async function getStorage() {
  if (isSSR) {
    return noopStorage;
  }
  
  if (Platform.OS === "web") {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }
  
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  return AsyncStorage;
}

let supabaseInstance: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const storage = isSSR ? noopStorage : undefined;

  if (!isSupabaseConfigured) {
    console.warn("Supabase credentials not configured. Using offline/fallback mode.");
    supabaseInstance = createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        storage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    return supabaseInstance;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage,
      autoRefreshToken: !isSSR,
      persistSession: !isSSR,
      detectSessionInUrl: false,
    },
  });
  return supabaseInstance;
}

export const supabase = createSupabaseClient();
