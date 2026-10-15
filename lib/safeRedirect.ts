/**
 * Returns a same-origin path to redirect to after login, or the fallback.
 * Blocks javascript: URLs, other origins, protocol-relative (//) and backslash tricks.
 */
export function getSafeCallbackUrl(
  value: string | null | undefined,
  origin: string,
  fallback: string = '/dashboard'
): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
