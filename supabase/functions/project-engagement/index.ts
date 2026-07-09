// @ts-nocheck
// Project engagement pushes:
//  mode=contact_request  → owner: someone requested an introduction
//  mode=contact_response → requester: the owner responded
//  mode=digest (daily cron) →
//    - owners whose projects gained followers: aggregated push
//      ("3 members across finance and creative are now following…")
//    - projects quiet for 24+ days: update nudge to the owner
// Attribution: follower identities are aggregated by industry, never named.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PIPELINE_SECRET = Deno.env.get('NEWS_PIPELINE_SECRET') ?? '';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const UPDATE_NUDGE_DAYS = 24; // ~3.5 weeks
const NUDGE_REPEAT_DAYS = 24;

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}

async function pushTo(token: string | null, title: string, body: string, data: Record<string, unknown>) {
  if (!token || !token.startsWith('ExponentPushToken')) return false;
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ to: token, title, body, data, sound: null }]),
  });
  return res.ok;
}

function industriesLabel(industries: (string | null)[]): string {
  const counts = new Map<string, number>();
  industries.filter(Boolean).forEach((i) => counts.set(i!, (counts.get(i!) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k.toLowerCase());
  if (!top.length) return '';
  return top.length === 1 ? ` across ${top[0]}` : ` across ${top[0]} and ${top[1]}`;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.headers.get('x-amari-pipeline-secret') !== PIPELINE_SECRET || !PIPELINE_SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { mode, request_id } = await req.json().catch(() => ({ mode: 'digest' }));

    if (mode === 'contact_request' || mode === 'contact_response') {
      const { data: r } = await svc
        .from('project_contact_requests')
        .select('id, status, project_id, requester_id, owner_id')
        .eq('id', request_id)
        .maybeSingle();
      if (!r) return jsonResponse({ success: false, error: 'request not found' }, 404);

      const { data: project } = await svc.from('projects').select('name').eq('id', r.project_id).maybeSingle();
      const projectName = project?.name ?? 'your project';

      if (mode === 'contact_request') {
        const { data: owner } = await svc.from('members').select('expo_push_token').eq('id', r.owner_id).maybeSingle();
        const sent = await pushTo(
          owner?.expo_push_token ?? null,
          'Introduction requested',
          `A member would like to connect over ${projectName}. Open it to review and approve.`,
          { type: 'project', project_id: r.project_id },
        );
        return jsonResponse({ success: true, sent });
      }

      const approved = r.status === 'approved';
      const { data: requester } = await svc.from('members').select('expo_push_token').eq('id', r.requester_id).maybeSingle();
      const sent = await pushTo(
        requester?.expo_push_token ?? null,
        approved ? 'Introduction approved' : 'Introduction update',
        approved
          ? `The builder of ${projectName} accepted. Open the project to connect.`
          : `The builder of ${projectName} passed this time.`,
        { type: 'project', project_id: r.project_id },
      );
      return jsonResponse({ success: true, sent });
    }

    // ── digest mode ──────────────────────────────────────────────────────
    const { data: projects } = await svc
      .from('projects')
      .select('id, name, creator_id, published_at, update_reminded_at, follows_pushed_at')
      .eq('status', 'approved');

    let followPushes = 0;
    let nudges = 0;

    for (const p of projects ?? []) {
      const since = p.follows_pushed_at ?? p.published_at ?? new Date(0).toISOString();

      const { data: newFollows } = await svc
        .from('project_bookmarks')
        .select('member_id, created_at, members(industry)')
        .eq('project_id', p.id)
        .gt('created_at', since);

      if (newFollows?.length) {
        const { data: owner } = await svc.from('members').select('expo_push_token').eq('id', p.creator_id).maybeSingle();
        const label = industriesLabel(newFollows.map((f: any) => f.members?.industry ?? null));
        const n = newFollows.length;
        const ok = await pushTo(
          owner?.expo_push_token ?? null,
          n === 1 ? 'New follower on your work' : `${n} new followers on your work`,
          `${n === 1 ? 'A member is' : `${n} members${label} are`} now following ${p.name}.`,
          { type: 'project', project_id: p.id },
        );
        if (ok) followPushes += 1;
        await svc.from('projects').update({ follows_pushed_at: new Date().toISOString() }).eq('id', p.id);
      }

      // Update nudge: quiet for ~3.5 weeks, not re-nudged within the window.
      const { data: lastUpdate } = await svc
        .from('project_updates')
        .select('created_at')
        .eq('project_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastActivity = lastUpdate?.created_at ?? p.published_at;
      const lastNudge = p.update_reminded_at;
      const dayMs = 24 * 3600 * 1000;
      const quiet = lastActivity && Date.now() - new Date(lastActivity).getTime() > UPDATE_NUDGE_DAYS * dayMs;
      const nudgeDue = !lastNudge || Date.now() - new Date(lastNudge).getTime() > NUDGE_REPEAT_DAYS * dayMs;

      if (quiet && nudgeDue) {
        const { data: followers } = await svc
          .from('project_bookmarks')
          .select('member_id, members(industry)')
          .eq('project_id', p.id);
        const count = followers?.length ?? 0;
        const label = industriesLabel((followers ?? []).map((f: any) => f.members?.industry ?? null));
        const { data: owner } = await svc.from('members').select('expo_push_token').eq('id', p.creator_id).maybeSingle();
        const ok = await pushTo(
          owner?.expo_push_token ?? null,
          `How is ${p.name} going?`,
          count > 0
            ? `${count} ${count === 1 ? 'member' : `members${label}`} ${count === 1 ? 'is' : 'are'} following. Share a short update in your journal.`
            : 'Share a short update in your journal to keep your work moving.',
          { type: 'project', project_id: p.id },
        );
        if (ok) nudges += 1;
        await svc.from('projects').update({ update_reminded_at: new Date().toISOString() }).eq('id', p.id);
      }
    }

    return jsonResponse({ success: true, follow_pushes: followPushes, update_nudges: nudges });
  } catch (error) {
    console.error('[project-engagement] Error:', error);
    return jsonResponse({ error: 'failed', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});
