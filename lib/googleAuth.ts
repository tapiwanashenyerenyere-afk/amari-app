import { Platform } from 'react-native';
import { supabase } from './supabase';

let GoogleSignin: any = null;

if (Platform.OS !== 'web') {
  try {
    const module = require('@react-native-google-signin/google-signin');
    GoogleSignin = module.GoogleSignin;
  } catch (e) {
    console.warn('Google Sign-In not available:', e);
  }
}

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function configureGoogleSignIn() {
  if (!GoogleSignin || !WEB_CLIENT_ID) {
    console.warn('Google Sign-In not available or not configured');
    return;
  }
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
  });
}

/**
 * Sign in to Supabase using Google's native sign-in.
 * Gets an ID token from Google, then passes it to Supabase.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!GoogleSignin) {
    throw new Error('Google Sign-In is not available on this platform');
  }

  await GoogleSignin.hasPlayServices();

  // Sign out first to allow account selection
  try { await GoogleSignin.signOut(); } catch {}

  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;

  if (!idToken) {
    throw new Error('No ID token received from Google. Please try again.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) throw error;
}
