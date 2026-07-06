import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { C, T, S } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

interface EventOption {
  id: number;
  title: string;
  starts_at: string;
}

interface CheckinStats {
  confirmed: number;
  waitlisted: number;
  checked_in: number;
  capacity: number | null;
}

interface ScanOutcome {
  kind: 'admitted' | 'repeat' | 'warning' | 'denied';
  headline: string;
  name?: string;
  tier?: string;
  displayId?: string;
  detail?: string;
}

const RESULT_RESET_MS = 3200;

export default function CheckinScreen() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const fetchEvents = useCallback(async () => {
    const windowStart = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('events')
      .select('id, title, starts_at')
      .gte('starts_at', windowStart)
      .order('starts_at', { ascending: true })
      .limit(10);

    const options = (data ?? []) as EventOption[];
    setEvents(options);
    if (options.length && selectedEventId === null) {
      setSelectedEventId(options[0].id);
    }
  }, [selectedEventId]);

  const fetchStats = useCallback(async () => {
    if (selectedEventId === null) {
      setStats(null);
      return;
    }
    const { data } = await supabase.rpc('get_event_checkin_stats', {
      p_event_id: selectedEventId,
    });
    if (data && !data.error) {
      setStats(data as CheckinStats);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const showOutcome = (next: ScanOutcome) => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
    setOutcome(next);
    resetTimer.current = setTimeout(() => {
      setOutcome(null);
      setScanBusy(false);
    }, RESULT_RESET_MS);
  };

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (scanBusy || !result.data || selectedEventId === null) {
        return;
      }

      setScanBusy(true);

      try {
        const { data, error } = await supabase.rpc('verify_barcode', {
          p_token: result.data,
          p_event_id: selectedEventId,
        });

        if (error) {
          throw error;
        }

        const verdict = data as Record<string, any>;

        if (!verdict?.valid) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showOutcome({
            kind: 'denied',
            headline: 'Not admitted',
            detail: verdict?.error ?? 'This pass could not be verified.',
          });
          return;
        }

        if (verdict.already_checked_in) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          showOutcome({
            kind: 'repeat',
            headline: 'Already checked in',
            name: verdict.name,
            tier: verdict.tier,
            displayId: verdict.display_id,
            detail: 'This member was checked in earlier.',
          });
          return;
        }

        if (!verdict.rsvp || verdict.warning) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          showOutcome({
            kind: 'warning',
            headline: verdict.rsvp ? 'Waitlisted' : 'No ticket',
            name: verdict.name,
            tier: verdict.tier,
            displayId: verdict.display_id,
            detail: verdict.warning ?? 'No ticket for this event. Door discretion.',
          });
          return;
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showOutcome({
          kind: 'admitted',
          headline: 'Admitted',
          name: verdict.name,
          tier: verdict.tier,
          displayId: verdict.display_id,
        });
        fetchStats();
      } catch {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showOutcome({
          kind: 'denied',
          headline: 'Scan failed',
          detail: 'The pass could not be verified. Try again.',
        });
      }
    },
    [fetchStats, scanBusy, selectedEventId],
  );

  const outcomeColor =
    outcome?.kind === 'admitted'
      ? C.success
      : outcome?.kind === 'denied'
        ? C.error
        : C.warning;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GrainOverlay opacity={0.03} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.eyebrow}>Door Control</Text>
        <Text style={styles.title}>Check-in</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.eventPicker}
        contentContainerStyle={styles.eventPickerContent}
      >
        {events.length ? (
          events.map((event) => {
            const selected = event.id === selectedEventId;
            return (
              <Pressable
                key={event.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedEventId(event.id);
                }}
                style={[styles.eventChip, selected ? styles.eventChipOn : null]}
              >
                <Text style={[styles.eventChipText, selected ? styles.eventChipTextOn : null]} numberOfLines={1}>
                  {event.title}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.noEvents}>No events in the door window.</Text>
        )}
      </ScrollView>

      {stats ? (
        <View style={styles.statsRow}>
          {[
            { n: stats.checked_in, label: 'Checked in' },
            { n: stats.confirmed, label: stats.capacity ? `Confirmed / ${stats.capacity}` : 'Confirmed' },
            { n: stats.waitlisted, label: 'Waitlist' },
          ].map((entry) => (
            <LiquidGlassCard key={entry.label} variant="dark" style={styles.statCard}>
              <Text style={styles.statNumber}>{entry.n}</Text>
              <Text style={styles.statLabel}>{entry.label}</Text>
            </LiquidGlassCard>
          ))}
        </View>
      ) : null}

      <View style={styles.scannerWrap}>
        {!cameraPermission?.granted ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>
              The door scanner reads member passes with the camera.
            </Text>
            <Pressable onPress={requestCameraPermission} style={styles.permissionButton}>
              <Text style={styles.permissionButtonText}>Enable camera</Text>
            </Pressable>
          </View>
        ) : selectedEvent ? (
          <View style={styles.cameraBox}>
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={outcome || scanBusy ? undefined : handleBarcodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.reticle} pointerEvents="none" />
            <Text style={styles.scanHint}>
              {outcome ? ' ' : `Scanning for ${selectedEvent.title}`}
            </Text>
          </View>
        ) : (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionTitle}>Select an event</Text>
            <Text style={styles.permissionText}>
              Pick the event above to start scanning passes.
            </Text>
          </View>
        )}

        {outcome ? (
          <View style={[styles.resultCard, { borderColor: outcomeColor }]}>
            <Text style={[styles.resultHeadline, { color: outcomeColor }]}>{outcome.headline}</Text>
            {outcome.name ? <Text style={styles.resultName}>{outcome.name}</Text> : null}
            {outcome.tier || outcome.displayId ? (
              <Text style={styles.resultMeta}>
                {[outcome.tier?.toUpperCase(), outcome.displayId].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            {outcome.detail ? <Text style={styles.resultDetail}>{outcome.detail}</Text> : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  header: { paddingHorizontal: S._20, paddingTop: S._12 },
  back: { ...T.label, color: C.lightTertiary, marginBottom: S._12 },
  eyebrow: { ...T.label, color: C.goldOnDark, marginBottom: S._4 },
  title: { ...T.hero, color: C.lightPrimary, fontSize: 32 },
  eventPicker: { flexGrow: 0, marginTop: S._16 },
  eventPickerContent: { paddingHorizontal: S._20, gap: S._8 },
  eventChip: {
    paddingHorizontal: S._16,
    paddingVertical: S._8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    maxWidth: 240,
  },
  eventChipOn: {
    backgroundColor: C.lightPrimary,
    borderColor: C.lightPrimary,
  },
  eventChipText: { ...T.label, fontSize: 10, color: C.lightSecondary },
  eventChipTextOn: { color: C.charcoal },
  noEvents: { ...T.body, color: C.lightTertiary, paddingHorizontal: S._20 },
  statsRow: {
    flexDirection: 'row',
    gap: S._8,
    paddingHorizontal: S._12,
    marginTop: S._16,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNumber: { ...T.stat, color: C.lightPrimary, marginBottom: S._2 },
  statLabel: { ...T.label, fontSize: 9, color: C.lightTertiary, textAlign: 'center' },
  scannerWrap: {
    flex: 1,
    margin: S._20,
    marginBottom: S._40 + 60,
  },
  cameraBox: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  reticle: {
    position: 'absolute',
    alignSelf: 'center',
    top: '22%',
    width: 200,
    height: 200,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  scanHint: {
    ...T.label,
    fontSize: 10,
    color: C.lightSecondary,
    paddingBottom: S._16,
  },
  permissionBox: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S._24,
  },
  permissionTitle: { ...T.cardTitle, color: C.lightPrimary, marginBottom: S._8 },
  permissionText: { ...T.body, color: C.lightTertiary, textAlign: 'center' },
  permissionButton: {
    marginTop: S._16,
    paddingHorizontal: S._24,
    paddingVertical: S._12,
    borderRadius: 12,
    backgroundColor: C.lightPrimary,
  },
  permissionButtonText: { ...T.label, fontSize: 10, color: C.charcoal },
  resultCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(20,20,20,0.96)',
    padding: S._20,
  },
  resultHeadline: { ...T.label, fontSize: 11, marginBottom: S._4 },
  resultName: { ...T.title, fontSize: 22, color: C.lightPrimary },
  resultMeta: { ...T.label, fontSize: 9, color: C.lightTertiary, marginTop: S._4 },
  resultDetail: { ...T.body, color: C.lightSecondary, marginTop: S._8 },
});
