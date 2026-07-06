import { supabase } from '@/lib/supabase';
import type { NewsEventType } from '@/types/database';

// Batched engagement capture for the intelligence feed. Events queue locally
// and flush as a single record_news_events RPC call, so scrolling never
// produces per-row network chatter. Signals are used only to rank the
// member's own feed.

interface QueuedNewsEvent {
  article_id: number;
  event_type: NewsEventType;
  dwell_ms?: number;
}

const FLUSH_INTERVAL_MS = 20000;
const FLUSH_THRESHOLD = 20;

let queue: QueuedNewsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const seenImpressions = new Set<number>();

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (!queue.length) {
    return;
  }

  const batch = queue;
  queue = [];

  const { error } = await supabase.rpc('record_news_events', { p_events: batch });
  if (error) {
    // Engagement capture is best-effort; drop the batch rather than retry-loop.
    console.warn('[newsEvents] flush failed:', error.message);
  }
}

function scheduleFlush() {
  if (queue.length >= FLUSH_THRESHOLD) {
    void flush();
    return;
  }

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);
  }
}

export function recordNewsEvent(articleId: number, eventType: NewsEventType, dwellMs?: number) {
  if (eventType === 'impression') {
    if (seenImpressions.has(articleId)) {
      return;
    }
    seenImpressions.add(articleId);
  }

  queue.push({
    article_id: articleId,
    event_type: eventType,
    ...(dwellMs != null ? { dwell_ms: Math.round(dwellMs) } : {}),
  });
  scheduleFlush();
}

export function flushNewsEvents() {
  void flush();
}
