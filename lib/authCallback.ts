import { supabase } from './supabase';

type AuthCallbackResult =
  | { handled: false }
  | { handled: true; sessionEstablished: boolean };

function collectParams(url: string) {
  const params = new URLSearchParams();
  const [withoutHash, hash = ''] = url.split('#');
  const query = withoutHash.includes('?') ? withoutHash.slice(withoutHash.indexOf('?') + 1) : '';

  for (const source of [query, hash]) {
    const searchParams = new URLSearchParams(source);
    searchParams.forEach((value, key) => params.set(key, value));
  }

  return params;
}

export async function completeAuthFromUrl(url: string): Promise<AuthCallbackResult> {
  if (!url.includes('auth-callback')) {
    return { handled: false };
  }

  const params = collectParams(url);
  const error = params.get('error') || params.get('error_code');

  if (error) {
    throw new Error(params.get('error_description') || error);
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) throw sessionError;
    return { handled: true, sessionEstablished: true };
  }

  const code = params.get('code');
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return { handled: true, sessionEstablished: true };
  }

  const tokenHash = params.get('token_hash');
  const type = params.get('type') || 'email';

  if (tokenHash) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'email' | 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change',
    });

    if (verifyError) throw verifyError;
    return { handled: true, sessionEstablished: true };
  }

  return { handled: true, sessionEstablished: false };
}
