// PostHog analytics — install posthog-react-native when ready
// npm install posthog-react-native

let posthog: any = null;

try {
  // Only load if the module is available
  const PostHog = require('posthog-react-native').default;
  posthog = new PostHog(
    process.env.EXPO_PUBLIC_POSTHOG_KEY || 'phk_placeholder',
    { host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com' }
  );
} catch {
  // Module not installed — use no-op
  posthog = {
    capture: () => {},
    identify: () => {},
    reset: () => {},
    screen: () => {},
  };
}

export { posthog };

export const analyticsEvents = {
  SCREEN_VIEW: 'screen_view',
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  PULSE_OPEN: 'pulse_open',
  PULSE_READ: 'pulse_read',
  PULSE_CARD_TAP: 'pulse_card_tap',
  EVENT_VIEW: 'event_view',
  EVENT_RSVP: 'event_rsvp',
  EVENT_CHECKIN: 'event_checkin',
  CORRIDOR_VIEW: 'corridor_view',
  CORRIDOR_INTEREST: 'corridor_interest',
  ALIGNED_VIEW: 'aligned_view',
  ALIGNED_ACCEPT: 'aligned_accept',
  ALIGNED_PASS: 'aligned_pass',
  ALIGNED_REVEAL: 'aligned_reveal',
  PRESENCE_TOGGLE: 'presence_toggle',
  BARCODE_VIEW: 'barcode_view',
  BARCODE_SCANNED: 'barcode_scanned',
  WALLET_ADD: 'wallet_add',
  TIER_GATE_HIT: 'tier_gate_hit',
} as const;
