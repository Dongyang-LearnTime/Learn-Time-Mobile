const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

export const config = {
  apiBaseUrl: apiBaseUrl ?? '',
  requestTimeoutMs: 12_000,
  demoMode: process.env.EXPO_PUBLIC_DEMO_MODE === 'true',
} as const;

export const hasApiBaseUrl = config.apiBaseUrl.length > 0;
