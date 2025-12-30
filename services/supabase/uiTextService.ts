import { supabase, isSupabaseConfigured } from "../../config/supabase";

type UITextCache = Map<string, string>;
const cache: UITextCache = new Map();

export async function getUIText(key: string, locale: string = "en"): Promise<string> {
  const cacheKey = `${key}:${locale}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  if (!isSupabaseConfigured) {
    return key;
  }

  try {
    const { data, error } = await supabase
      .from("ui_texts")
      .select("value")
      .eq("key", key)
      .eq("language", locale)
      .single();

    if (data?.value) {
      cache.set(cacheKey, data.value);
      return data.value;
    }

    if (locale !== "en") {
      const { data: fallbackData } = await supabase
        .from("ui_texts")
        .select("value")
        .eq("key", key)
        .eq("language", "en")
        .single();

      if (fallbackData?.value) {
        cache.set(cacheKey, fallbackData.value);
        return fallbackData.value;
      }
    }

    return key;
  } catch {
    return key;
  }
}

export async function getUITexts(keys: string[], locale: string = "en"): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) {
    return keys.reduce((acc, key) => ({ ...acc, [key]: key }), {});
  }

  const uncachedKeys = keys.filter(key => !cache.has(`${key}:${locale}`));
  
  if (uncachedKeys.length > 0) {
    try {
      const { data } = await supabase
        .from("ui_texts")
        .select("key, value")
        .in("key", uncachedKeys)
        .eq("language", locale);

      if (data) {
        data.forEach(item => {
          cache.set(`${item.key}:${locale}`, item.value);
        });
      }
    } catch {
      // Silently fail, return keys as fallback
    }
  }

  return keys.reduce((acc, key) => ({
    ...acc,
    [key]: cache.get(`${key}:${locale}`) ?? key
  }), {});
}

export function clearUITextCache(): void {
  cache.clear();
}
