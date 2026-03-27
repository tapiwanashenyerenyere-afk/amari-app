import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image,
  TextInput, Alert, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import { C, T, S, R, TIERS } from '../../lib/constants';
import type { MembershipTier } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

type EventType = 'gala' | 'networking' | 'dinner' | 'lifestyle' | 'collaboration';

interface EventItem {
  id: number;
  type: EventType;
  title: string;
  description: string | null;
  min_tier: MembershipTier;
  capacity: number | null;
  starts_at: string;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  eventbrite_id: string | null;
  cover_image_path: string | null;
  dress_code: string | null;
  registration_url: string | null;
  is_featured: boolean | null;
}

const EVENT_TYPES: EventType[] = ['gala', 'networking', 'dinner', 'lifestyle', 'collaboration'];

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formType, setFormType] = useState<EventType>('gala');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTier, setFormTier] = useState<MembershipTier>('member');
  const [formCapacity, setFormCapacity] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formDressCode, setFormDressCode] = useState('');
  const [formRegistrationUrl, setFormRegistrationUrl] = useState('');
  const [formEventbriteId, setFormEventbriteId] = useState('');
  const [formImageUri, setFormImageUri] = useState<string | null>(null);
  const [formFeatured, setFormFeatured] = useState(false);
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need photo access to upload an event image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setFormImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const filePath = `event-images/${user?.id ?? 'admin'}/${Date.now()}.jpg`;
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('public')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from('public').getPublicUrl(filePath);
    return { filePath, publicUrl: data.publicUrl };
  };

  const handleCreateEvent = async () => {
    if (!formTitle.trim() || !formDate.trim() || !formTime.trim() || !formVenue.trim()) {
      Alert.alert('Required', 'Title, date, time, and venue are required.');
      return;
    }

    if (!formRegistrationUrl.trim() && !formEventbriteId.trim()) {
      Alert.alert('Required', 'Add a registration URL or an Eventbrite ID.');
      return;
    }

    setSubmitting(true);
    const startsAt = new Date(`${formDate.trim()}T${formTime.trim()}:00`);
    const endsAt = formEndTime.trim()
      ? new Date(`${formDate.trim()}T${formEndTime.trim()}:00`)
      : new Date(startsAt.getTime() + 3 * 60 * 60 * 1000);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      setSubmitting(false);
      Alert.alert('Invalid time', 'Please enter a valid start and end time.');
      return;
    }

    let uploadedFilePath: string | null = null;
    let imageUrl: string | null = null;

    try {
      if (formImageUri) {
        const upload = await uploadImage(formImageUri);
        uploadedFilePath = upload.filePath;
        imageUrl = upload.publicUrl;
      }

      const trimmedRegistrationUrl = formRegistrationUrl.trim();
      const registrationUrl = trimmedRegistrationUrl
        ? (trimmedRegistrationUrl.startsWith('http')
          ? trimmedRegistrationUrl
          : `https://${trimmedRegistrationUrl}`)
        : null;

      const { data: createdEvent, error } = await supabase.from('events').insert({
        type: formType,
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        min_tier: formTier,
        capacity: formCapacity.trim() ? parseInt(formCapacity, 10) : null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        venue_name: formVenue.trim(),
        venue_address: formAddress.trim() || null,
        dress_code: formDressCode.trim() || null,
        registration_url: registrationUrl,
        eventbrite_id: formEventbriteId.trim() || null,
        cover_image_path: imageUrl,
        is_featured: formFeatured,
      }).select('id').single();

      if (error) {
        throw error;
      }

      if (formFeatured && createdEvent?.id) {
        await supabase
          .from('events')
          .update({ is_featured: false })
          .neq('id', createdEvent.id);
      }

      Alert.alert('Created', `Event "${formTitle}" has been created.`);
      setShowForm(false);
      setFormType('gala');
      setFormTitle('');
      setFormDesc('');
      setFormCapacity('');
      setFormVenue('');
      setFormAddress('');
      setFormDate('');
      setFormTime('');
      setFormEndTime('');
      setFormDressCode('');
      setFormRegistrationUrl('');
      setFormEventbriteId('');
      setFormImageUri(null);
      setFormFeatured(false);
      fetchEvents();
    } catch (error: any) {
      if (uploadedFilePath) {
        await supabase.storage.from('public').remove([uploadedFilePath]);
      }
      Alert.alert('Error', error.message || 'Could not create the event.');
    } finally {
      setSubmitting(false);
    }
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
              <Text style={styles.formLabel}>Cover Image</Text>
              <Pressable style={styles.imageUpload} onPress={pickImage}>
                {formImageUri ? (
                  <Image source={{ uri: formImageUri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderIcon}>+</Text>
                    <Text style={styles.imagePlaceholderText}>Tap to upload</Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.formLabel}>Event Type</Text>
              <View style={styles.typeRow}>
                {EVENT_TYPES.map(t => (
                  <Pressable
                    key={t}
                    style={[styles.typeBtn, formType === t && styles.typeBtnActive]}
                    onPress={() => setFormType(t)}
                  >
                    <Text style={[styles.typeBtnText, formType === t && styles.typeBtnTextActive]}>
                      {t === 'networking'
                        ? 'Networking'
                        : t === 'lifestyle'
                          ? 'Lifestyle'
                          : t === 'collaboration'
                            ? 'Collaboration'
                            : t.charAt(0).toUpperCase() + t.slice(1)}
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
                  <Text style={styles.formLabel}>Start (HH:MM)</Text>
                  <TextInput style={styles.input} value={formTime} onChangeText={setFormTime}
                    placeholder="18:00" placeholderTextColor={C.lightFaint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>End (HH:MM)</Text>
                  <TextInput style={styles.input} value={formEndTime} onChangeText={setFormEndTime}
                    placeholder="21:00" placeholderTextColor={C.lightFaint} />
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

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Dress Code</Text>
                  <TextInput style={styles.input} value={formDressCode} onChangeText={setFormDressCode}
                    placeholder="Black Tie" placeholderTextColor={C.lightFaint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Eventbrite ID</Text>
                  <TextInput style={styles.input} value={formEventbriteId} onChangeText={setFormEventbriteId}
                    placeholder="optional" placeholderTextColor={C.lightFaint} autoCapitalize="none" />
                </View>
              </View>

              <Text style={styles.formLabel}>Registration URL</Text>
              <TextInput style={styles.input} value={formRegistrationUrl} onChangeText={setFormRegistrationUrl}
                placeholder="https://eventbrite.com/..." placeholderTextColor={C.lightFaint} autoCapitalize="none" />

              <Pressable
                style={[styles.featuredToggle, formFeatured && styles.featuredToggleActive]}
                onPress={() => setFormFeatured(!formFeatured)}
              >
                <Text style={styles.featuredToggleTitle}>{formFeatured ? 'Featured Hero On' : 'Featured Hero Off'}</Text>
                <Text style={styles.featuredToggleText}>
                  {formFeatured ? 'This event will claim the hero position.' : 'Turn on to push this event into the hero card.'}
                </Text>
              </Pressable>

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
              {event.cover_image_path ? (
                <Image source={{ uri: event.cover_image_path }} style={styles.eventCover} />
              ) : null}
              <View style={styles.eventHeader}>
                <View style={styles.eventTypeBadge}>
                  <Text style={styles.eventTypeText}>
                    {event.type === 'networking'
                      ? 'NETWORKING'
                      : event.type === 'lifestyle'
                        ? 'LIFESTYLE'
                        : event.type === 'collaboration'
                          ? 'COLLABORATION'
                          : event.type.toUpperCase()}
                  </Text>
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
              {event.dress_code ? (
                <Text style={styles.eventDetail}>Dress: {event.dress_code}</Text>
              ) : null}
              {event.registration_url ? (
                <Text style={styles.eventDetail} numberOfLines={1}>Link: {event.registration_url}</Text>
              ) : null}
              {event.is_featured ? (
                <Text style={styles.eventFeatured}>FEATURED HERO</Text>
              ) : null}
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
  imageUpload: {
    width: 140,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  imagePreview: {
    width: 140,
    height: 140,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imagePlaceholderIcon: {
    fontSize: 24,
    color: C.lightPrimary,
  },
  imagePlaceholderText: {
    ...T.meta,
    color: C.lightSecondary,
  },
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
  featuredToggle: {
    marginTop: S._16,
    padding: S._12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.18)',
    backgroundColor: 'rgba(201,169,98,0.06)',
  },
  featuredToggleActive: {
    backgroundColor: 'rgba(201,169,98,0.12)',
    borderColor: 'rgba(201,169,98,0.28)',
  },
  featuredToggleTitle: {
    ...T.btn,
    color: C.lightPrimary,
    fontSize: 12,
  },
  featuredToggleText: {
    ...T.meta,
    color: C.lightSecondary,
    marginTop: 4,
  },
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
  eventCover: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    marginBottom: S._12,
  },
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
  eventDetail: { ...T.meta, color: C.lightSecondary, marginTop: S._4 },
  eventFeatured: { ...T.label, fontSize: 9, color: C.goldOnDark, marginTop: S._6 },
  eventCapacity: { ...T.meta, color: C.lightFaint, marginTop: S._4 },
  deleteBtn: { marginTop: S._12, alignSelf: 'flex-start' },
  deleteBtnText: { ...T.meta, color: C.error },
});
