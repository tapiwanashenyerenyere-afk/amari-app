import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

export const AUTH_CALLBACK_PATH = 'auth-callback';
export const AUTH_SCHEME = 'amari';

export function getAuthRedirectUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();

  if (configuredUrl && !isLocalhostUrl(configuredUrl)) {
    return configuredUrl;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${AUTH_CALLBACK_PATH}`;
    }

    return `${AUTH_SCHEME}://${AUTH_CALLBACK_PATH}`;
  }

  return Linking.createURL(AUTH_CALLBACK_PATH, { scheme: AUTH_SCHEME });
}

export function isLocalhostUrl(url: string) {
  return /(^|\/\/)(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);
}
