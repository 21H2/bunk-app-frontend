import Constants from "expo-constants";

/**
 * These values are injected at build time via:
 * - app.config.ts / app.json (expo.extra)
 * - or EAS environment variables
 *
 * This file must NEVER hardcode production domains.
 * It only provides localhost fallbacks for dev.
 */

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:5000";

export const CHAT_URL =
  Constants.expoConfig?.extra?.chatUrl ?? "ws://localhost:5443";

export const IMAGES_URL =
  Constants.expoConfig?.extra?.imagesUrl ??
  "http://localhost:9090/s3-mock-bucket";

export const AUDIO_URL =
  Constants.expoConfig?.extra?.audioUrl ??
  "http://localhost:9090/s3-mock-audio-bucket";

export const STATUS_URL =
  Constants.expoConfig?.extra?.statusUrl ?? "http://localhost:8080";

export const INVITE_URL =
  Constants.expoConfig?.extra?.inviteUrl ?? "https://get.bunk-app.in";

export const PARTNER_URL =
  Constants.expoConfig?.extra?.partnerUrl ?? "https://partner.bunk-app.in";

export const WEB_VERSION = Constants.expoConfig?.extra?.webVersion ?? "dev";

export const TENOR_API_KEY =
  Constants.expoConfig?.extra?.tenorApiKey ?? "LIVDSRZULELA";

export const NOTIFICATION_ICON_URL =
  Constants.expoConfig?.extra?.notificationIconUrl ??
  "https://bunk-app.in/assets/desktop-notification.png";

export const NOTIFICATION_SOUND_URL =
  Constants.expoConfig?.extra?.notificationSoundUrl ??
  "https://bunk-app.in/assets/desktop-notification.wav";
