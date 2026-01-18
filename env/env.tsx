import Constants from "expo-constants";

/**
 * Lookup order for configuration values:
 * 1. process.env DUO_* variables (explicit env vars, e.g. loaded from .env.local at runtime/build)
 * 2. Expo config extras (Constants.expoConfig?.extra), set by EAS/Expo builds
 * 3. Defaults derived from `.env.local` (used here as final fallback)
 *
 * Additional behavior:
 * - Normalizes `https://host:PORT` => `http://host:PORT` (and `wss://` => `ws://`) for non-443 ports.
 *   A console warning is emitted in development so you can spot non-TLS endpoints being downgraded.
 */

/* Helpers to read env sources */
const getProcessEnv = (name: string): string | undefined => {
  try {
    if (typeof process !== "undefined" && (process.env as any)) {
      return (process.env as any)[name] || undefined;
    }
  } catch (_e) {
    // ignore access errors
  }
  return undefined;
};

const getExpoExtra = (name: string): string | undefined =>
  (Constants.expoConfig?.extra as any)?.[name];

/* Determine development mode in a robust way */
const isDev = (() => {
  try {
    // React Native / Expo exposes __DEV__ during development
    // Fallback to NODE_ENV check for other environments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const devFlag = (global as any).__DEV__;
    if (typeof devFlag !== "undefined") return Boolean(devFlag);
  } catch (_) {}
  try {
    return (
      (typeof process !== "undefined" &&
        (process.env as any).NODE_ENV !== "production") ||
      false
    );
  } catch (_) {
    return false;
  }
})();

/* Normalizer:
 * - If URL starts with https:// and contains an explicit port that is not 443,
 *   convert to http:// and warn in dev.
 * - Similarly convert wss:// with non-443 ports to ws:// and warn in dev.
 * - Otherwise return the original value unchanged.
 */
const normalizeUrl = (keyName: string, raw?: string): string | undefined => {
  if (!raw) return raw;

  // quick parse via regex to detect protocol and port
  // matches: protocol://host:port/... or protocol://host:port
  const m = raw.match(/^(https?|wss?):\/\/([^\/:]+)(?::(\d+))?(\/.*)?$/i);
  if (!m) {
    // not a simple URL we recognize; return as-is
    return raw;
  }

  const protocol = m[1].toLowerCase();
  const host = m[2];
  const portStr = m[3]; // may be undefined
  const rest = m[4] || "";

  if (!portStr) {
    // no explicit port — nothing to normalize
    return raw;
  }

  const port = Number(portStr);
  if (!Number.isFinite(port)) return raw;

  // Only convert if explicit port is present and not the standard TLS port 443
  if ((protocol === "https" || protocol === "wss") && port !== 443) {
    const downgradedProtocol = protocol === "wss" ? "ws" : "http";
    const newUrl = `${downgradedProtocol}://${host}:${port}${rest}`;
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(
        `[env] Normalized ${keyName} from ${raw} -> ${newUrl} because it used ${protocol.toUpperCase()} on non-443 port (${port}).\n` +
          "This is a development convenience to avoid SSL protocol errors when backend is running without TLS on that port. " +
          "In production you should use proper TLS (HTTPS/WSS) or remove the explicit port.",
      );
    }
    return newUrl;
  }

  // otherwise, return as-is
  return raw;
};

/* Final fallbacks derived from your .env.local preview values */
const FALLBACKS: Record<string, string> = {
  DUO_API_URL: "https://status.bunk-app.in:8080",
  DUO_CHAT_URL: "wss://chat.bunk-app.in:5443",
  DUO_IMAGES_URL: "https://user-images.bunk-app.in:9090",
  DUO_AUDIO_URL: "https://user-audio.bunk-app.in:9090",
  DUO_INVITE_URL: "https://get.bunk-app.in",
  DUO_PARTNER_URL: "https://partner.bunk-app.in",
  DUO_STATUS_URL: "https://status.bunk-app.in:8080",
  DUO_WEB_VERSION: "1.0.0",
  TENOR_API_KEY: "LIVDSRZULELA",
  NOTIFICATION_ICON_URL: "https://bunk-app.in/assets/desktop-notification.png",
  NOTIFICATION_SOUND_URL: "https://bunk-app.in/assets/desktop-notification.wav",
};

/* Helper to resolve configuration values and normalize them when appropriate */
const resolve = (
  envName: string,
  expoKey?: string,
  normalize = true,
): string => {
  const fromProcess = getProcessEnv(envName);
  const fromExpo = expoKey ? getExpoExtra(expoKey) : undefined;
  const fallback = FALLBACKS[envName] ?? "";

  const raw = fromProcess || fromExpo || fallback;

  if (!raw) return raw;

  if (!normalize) return raw;

  // Apply normalization only to URL-like keys (basic heuristic: starts with http or ws)
  if (/^(https?|wss?):\/\//i.test(raw)) {
    return normalizeUrl(envName, raw) || raw;
  }

  return raw;
};

/* Exports — these use the resolve helper to pick process.env -> expo.extra -> fallbacks,
 * and then normalize where applicable.
 */
export const API_URL = resolve("DUO_API_URL", "apiUrl", true);
export const CHAT_URL = resolve("DUO_CHAT_URL", "chatUrl", true);
export const IMAGES_URL = resolve("DUO_IMAGES_URL", "imagesUrl", true);
export const AUDIO_URL = resolve("DUO_AUDIO_URL", "audioUrl", true);
export const STATUS_URL = resolve("DUO_STATUS_URL", "statusUrl", true);
export const INVITE_URL = resolve("DUO_INVITE_URL", "inviteUrl", true);
export const PARTNER_URL = resolve("DUO_PARTNER_URL", "partnerUrl", true);

export const WEB_VERSION =
  resolve("DUO_WEB_VERSION", "webVersion", false) || "1.0.0";
export const TENOR_API_KEY =
  resolve("DUO_TENOR_API_KEY", "tenorApiKey", false) || FALLBACKS.TENOR_API_KEY;

export const NOTIFICATION_ICON_URL =
  resolve("NOTIFICATION_ICON_URL", "notificationIconUrl", false) ||
  FALLBACKS.NOTIFICATION_ICON_URL;

export const NOTIFICATION_SOUND_URL =
  resolve("NOTIFICATION_SOUND_URL", "notificationSoundUrl", false) ||
  FALLBACKS.NOTIFICATION_SOUND_URL;

/* Optionally log resolved values in dev to make debugging easier */
if (isDev) {
  // eslint-disable-next-line no-console
  console.info("[env] Resolved config:", {
    API_URL,
    CHAT_URL,
    IMAGES_URL,
    AUDIO_URL,
    STATUS_URL,
    INVITE_URL,
    PARTNER_URL,
    WEB_VERSION,
  });
}
