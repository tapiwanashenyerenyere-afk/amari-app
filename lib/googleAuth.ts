import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { completeAuthFromUrl } from './authCallback';
import { getAuthRedirectUrl } from './authRedirect';

let GoogleSignin: any = null;
let statusCodes: any = null;
let nativeGoogleConfigured = false;

if (Platform.OS !== 'web') {
  try {
    const module = require('@react-native-google-signin/google-signin');
    GoogleSignin = module.GoogleSignin;
    statusCodes = module.statusCodes;
  } catch (e) {
    console.warn('Google Sign-In not available:', e);
  }
}

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export function configureGoogleSignIn() {
  if (!GoogleSignin || !WEB_CLIENT_ID) {
    console.warn('Google Sign-In not available or not configured');
    return;
  }

  if (Platform.OS === 'ios' && !IOS_CLIENT_ID) {
    console.warn('Native Google Sign-In is missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; using OAuth fallback.');
    return;
  }

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    ...(Platform.OS === 'ios' ? { iosClientId: IOS_CLIENT_ID } : {}),
    offlineAccess: true,
  });
  nativeGoogleConfigured = true;
}

async function signInWithGoogleOAuthFallback() {
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Google sign-in could not start. Please try email sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success' && result.url) {
    await completeAuthFromUrl(result.url);
    return;
  }

  if (result.type === 'dismiss' || result.type === 'cancel') {
    throw new Error('Google sign-in was cancelled.');
  }

  await Linking.openURL(data.url);
}

/**
 * Sign in to Supabase using Google's native sign-in.
 * Gets an ID token from Google, then passes it to Supabase.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!GoogleSignin || !nativeGoogleConfigured) {
    await signInWithGoogleOAuthFallback();
    return;
  }

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices();
  }

  // Sign out first to allow account selection
  try { await GoogleSignin.signOut(); } catch {}

  let userInfo;
  try {
    userInfo = await GoogleSignin.signIn();
  } catch (error: any) {
    if (error?.code === statusCodes?.SIGN_IN_CANCELLED) {
      throw new Error('Google sign-in was cancelled.');
    }

    await signInWithGoogleOAuthFallback();
    return;
  }

  if (userInfo?.type === 'cancelled') {
    throw new Error('Google sign-in was cancelled.');
  }

  const idToken = userInfo.data?.idToken;

  if (!idToken) {
    await signInWithGoogleOAuthFallback();
    return;
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;
}
