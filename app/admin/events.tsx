import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, Alert, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { C, T, S, R, TIERS } from '../../lib/constants';
import type { MembershipTier } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

type EventType = 'vibes' | 'dinner' | 'talk' | 'gala';

interface EventItem {
  id: number;
  type: EventType;
  title: string;
  description: string;
  min_tier: MembershipTier;
  capacity: number | null;
  starts_at: string;
  ends_at: string;
  venue_name: string;
  venue_address: string;
}

const EVENT_TYPES: EventType[] = ['vibes', 'dinner', 'talk', 'gala'];

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formType, setFormType] = useState<EventType>('vibes');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTier, setFormTier] = useState<MembershipTier>('member');
  const [formCapacity, setFormCapacity] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: false })
      .limit(50);
    if (error) console.error('Fetch events error:', error);
    setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreateEvent = async () => {
    if (!formTitle || !formDate || !formTime || !formVenue) {
      Alert.alert('Required', 'Title, date, time, and venue are required.');
      return;
    }

    setSubmitting(true);
    const startsAt = new Date(`${formDate}T${formTime}:00+11:00`);
    const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000); // Default 3 hours

    const { error } = await supabase.from('events').insert({
      type: formType,
      title: formTitle,
      description: formDesc,
      min_tier: formTier,
      capacity: formCapacity ? parseInt(formCapacity, 10) : null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      venue_name: formVenue,
      venue_address: formAddress,
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Created', `Event "${formTitle}" has been created.`);
    setShowForm(false);
    setFormTitle(''); setFormDesc(''); setFormCapacity('');
    setFormVenue(''); setFormAddress(''); setFormDate(''); setFormTime('');
    fetchEvents();
  };

  const handleDeleteEvent = (event: EventItem) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('events').delete().eq('id', event.id);
            if (error) Alert.alert('Error', error.message);
            else fetchEvents();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GrainOverlay opacity={0.03} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEvents} tintColor={C.lightPrimary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Admin</Text>
          </Pressable>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Events</Text>
            <Pressable
              style={styles.addBtn}
              onPress={() => setShowForm(!showForm)}
            >
              <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ New'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Create Form */}
        {showForm && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
          >
            <LiquidGlassCard variant="dark" style={styles.formCard}>
              <Text style={styles.formLabel}>Event Type</Text>
              <View style={styles.typeRow}>
                {EVENT_TYPES.map(t => (
                  <Pressable
                    key={t}
                    style={[styles.typeBtn, formType === t && styles.typeBtnActive]}
                    onPress={() => setFormType(t)}
                  >
                    <Text style={[styles.typeBtnText, formType === t && styles.typeBtnTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.formLabel}>Title</Text>
              <TextInput style={styles.input} value={formTitle} onChangeText={setFormTitle}
                placeholder="Event title" placeholderTextColor={C.lightFaint} />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={[styles.input, { height: 80 }]} value={formDesc} onChangeText={setFormDesc}
                placeholder="Event description" placeholderTextColor={C.lightFaint} multiline />

              <Text style={styles.formLabel}>Min Tier</Text>
              <View style={styles.typeRow}>
                {TIERS.map(t => (
                  <Pressable
                    key={t}
                    style={[styles.typeBtn, formTier === t && styles.typeBtnActive]}
                    onPress={() => setFormTier(t)}
                  >
                    <Text style={[styles.typeBtnText, formTier === t && styles.typeBtnTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput style={styles.input} value={formDate} onChangeText={setFormDate}
                    placeholder="2026-04-15" placeholderTextColor={C.lightFaint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Time (HH:MM)</Text>
                  <TextInput style={styles.input} value={formTime} onChangeText={setFormTime}
                    placeholder="18:00" placeholderTextColor={C.lightFaint} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Capacity</Text>
                  <TextInput style={styles.input} value={formCapacity} onChangeText={setFormCapacity}
                    placeholder="100" placeholderTextColor={C.lightFaint} keyboardType="number-pad" />
                </View>
              </View>

              <Text style={styles.formLabel}>Venue</Text>
              <TextInput style={styles.input} value={formVenue} onChangeText={setFormVenue}
                placeholder="Venue name" placeholderTextColor={C.lightFaint} />

              <Text style={styles.formLabel}>Address</Text>
              <TextInput style={styles.input} value={formAddress} onChangeText={setFormAddress}
                placeholder="Full address" placeholderTextColor={C.lightFaint} />

              <Pressable
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreateEvent}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Creating...' : 'Create Event'}
                </Text>
              </Pressable>
            </LiquidGlassCard>
          </MotiView>
        )}

        {/* Event List */}
        {events.map((event, i) => (
          <MotiView
            key={event.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: i * 50 }}
          >
            <LiquidGlassCard variant="dark" style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventTypeBadge}>
                  <Text style={styles.eventTypeText}>{event.type}</Text>
                </View>
                <Text style={styles.eventTier}>{event.min_tier}+</Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>
                {new Date(event.starts_at).toLocaleDateString('en-AU', {
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
              <Text style={styles.eventVenue}>{event.venue_name}</Text>
              {event.capacity && (
                <Text style={styles.eventCapacity}>Capacity: {event.capacity}</Text>
              )}
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDeleteEvent(event)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            </LiquidGlassCard>
          </MotiView>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  scroll: { flex: 1 },
  content: { paddingBottom: S._40 + 84 },
  header: { paddingHorizontal: S._20, paddingTop: S._8 },
  backBtn: { paddingVertical: S._8, alignSelf: 'flex-start' },
  backText: { ...T.nav, color: C.lightTertiary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...T.title, color: C.lightPrimary },
  addBtn: {
    paddingVertical: S._8, paddingHorizontal: S._16,
    backgroundColor: 'rgba(114,47,55,0.5)',
    borderRadius: R.md, borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.6)',
  },
  addBtnText: { ...T.btn, color: C.lightPrimary, fontSize: 11 },
  formCard: { marginHorizontal: S._12, marginTop: S._16 },
  formLabel: { ...T.label, color: C.lightTertiary, marginTop: S._12, marginBottom: S._6 },
  input: {
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: C.lightPrimary,
    backgroundColor: 'rgba(248,246,243,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(248,246,243,0.1)',
    borderRadius: 10,
    padding: S._12,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S._8 },
  typeBtn: {
    paddingVertical: S._6, paddingHorizontal: S._12,
    borderRadius: R.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  typeBtnActive: { backgroundColor: 'rgba(114,47,55,0.4)', borderColor: 'rgba(114,47,55,0.6)' },
  typeBtnText: { ...T.meta, color: C.lightSecondary },
  typeBtnTextActive: { color: C.lightPrimary },
  row: { flexDirection: 'row', gap: S._12 },
  submitBtn: {
    marginTop: S._20,
    paddingVertical: S._16,
    backgroundColor: 'rgba(114,47,55,0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(196,112,122,0.2)',
    alignItems: 'center',
  },
  submitBtnText: { ...T.btn, color: C.lightPrimary },
  eventCard: { marginHorizontal: S._12, marginTop: S._8 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S._8 },
  eventTypeBadge: {
    paddingVertical: S._4, paddingHorizontal: S._8,
    backgroundColor: 'rgba(201,169,98,0.15)',
    borderRadius: R.sm,
  },
  eventTypeText: { ...T.label, fontSize: 9, color: C.goldOnDark },
  eventTier: { ...T.meta, color: C.lightFaint },
  eventTitle: { ...T.cardTitle, color: C.lightPrimary },
  eventMeta: { ...T.meta, color: C.lightTertiary, marginTop: S._4 },
  eventVenue: { ...T.bodySmall, color: C.lightSecondary, marginTop: S._2 },
  eventCapacity: { ...T.meta, color: C.lightFaint, marginTop: S._4 },
  deleteBtn: { marginTop: S._12, alignSelf: 'flex-start' },
  deleteBtnText: { ...T.meta, color: C.error },
});
