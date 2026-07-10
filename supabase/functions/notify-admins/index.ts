// @ts-nocheck
// Fan-out pushes to every admin. Currently used for issue reports:
// when a member files an issue, all admin accounts with a push token
// are notified immediately so nothing goes unseen. Tap deep-links to
// the admin issues screen.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PIPELINE_SECRET = Deno.env.get('NEWS_PIPELINE_SECRET') ?? '';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  try {
    if (!PIPELINE_SECRET || req.headers.get('x-amari-pipeline-secret') !== PIPELINE_SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { mode, issue_id } = await req.json().catch(() => ({}));

    if (mode !== 'issue') {
      return jsonResponse({ success: false, error: 'unknown mode' }, 400);
    }

    const { data: issue } = await svc
      .from('issue_reports')
      .select('id, category, message, platform, app_version, reporter_id')
      .eq('id', issue_id)
      .maybeSingle();
    if (!issue) return jsonResponse({ success: false, error: 'issue not found' }, 404);

    // Every admin with a push token.
    const { data: admins } = await svc.from('admin_roles').select('member_id');
    const adminIds = (admins ?? []).map((a) => a.member_id);
    if (!adminIds.length) return jsonResponse({ success: true, sent: 0, note: 'no admins' });

    const { data: members } = await svc
      .from('members')
      .select('id, expo_push_token')
      .in('id', adminIds)
      .not('expo_push_token', 'is', null);

    const tokens = (members ?? [])
      .map((m) => m.expo_push_token)
      .filter((t): t is string => typeof t === 'string' && t.startsWith('ExponentPushToken'));

    if (!tokens.length) return jsonResponse({ success: true, sent: 0, note: 'no admin tokens' });

    const preview = String(issue.message).slice(0, 90);
    const messages = tokens.map((to) => ({
      to,
      title: `New ${issue.category} report`,
      body: preview,
      data: { type: 'issue', issue_id: issue.id },
      sound: null,
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    return jsonResponse({ success: response.ok, sent: response.ok ? tokens.length : 0 });
  } catch (error) {
    console.error('[notify-admins] Error:', error);
    return jsonResponse({ error: 'failed', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});
