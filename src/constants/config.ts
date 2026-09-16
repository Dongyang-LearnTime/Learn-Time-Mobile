function isPrivateDevelopmentHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) return true;
  const match = hostname.match(/^172\.(\d+)\./);
  return match !== null && Number(match[1]) >= 16 && Number(match[1]) <= 31;
}

function normalizeApiBaseUrl(value: string | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    const isSecure = url.protocol === 'https:';
    const isLocalDevelopment = __DEV__ && url.protocol === 'http:' && isPrivateDevelopmentHost(url.hostname);
    // Credentials and query/fragment data must never be embedded in a public
    // Expo variable or accidentally included in every request URL.
    if (
      (!isSecure && !isLocalDevelopment)
      || !url.hostname
      || url.username
      || url.password
      || url.search
      || url.hash
    ) return '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

const apiBaseUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

export const config = {
  apiBaseUrl,
  requestTimeoutMs: 12_000,
  demoMode: __DEV__ && process.env.EXPO_PUBLIC_DEMO_MODE === 'true',
} as const;

export const hasApiBaseUrl = config.apiBaseUrl.length > 0;
