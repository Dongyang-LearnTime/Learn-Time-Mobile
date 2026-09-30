function isPrivateDevelopmentHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  const octets = hostname.split('.');
  if (octets.length !== 4 || octets.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return false;
  const first = Number(octets[0]);
  const second = Number(octets[1]);
  return first === 10 || (first === 192 && second === 168)
    || (first === 172 && second >= 16 && second <= 31);
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
