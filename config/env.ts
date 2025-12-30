const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const env = {
  API_URL,
  isDevelopment: __DEV__,
} as const;

export function getApiUrl(): string {
  if (!env.API_URL) {
    console.warn('EXPO_PUBLIC_API_URL is not defined');
  }
  return env.API_URL;
}
