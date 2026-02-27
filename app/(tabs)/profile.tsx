import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { C, T, S, R, TIER_DISPLAY_NAMES } from '../../lib/constants';
import { useAuth } from '../../providers/AuthProvider';
import { useMyProfile, useUpdateProfile } from '../../queries/members';
import { useTogglePresence, useActiveCityPresence } from '../../queries/cityPresence';
import { useBarcode } from '../../hooks/useBarcode';
import { supabase } from '../../lib/supabase';
import { LiquidGlassCard } from '../../components/ui/LiquidGlassCard';
import { GrainOverlay } from '../../components/ui/GrainOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { session, tier } = useAuth();
  const { data: profile, isLoading, refetch, isRefetching } = useMyProfile();
  const { data: barcode } = useBarcode();
  const updateProfile = useUpdateProfile();
  const togglePresence = useTogglePresence();
  const { data: nearbyPresence } = useActiveCityPresence(profile?.city);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const cityPresenceActive = profile?.city
    ? nearbyPresence?.some((p: any) => p.member_id === session?.user?.id && p.is_active)
    : false;

  const nearbyCount = nearbyPresence?.length || 0;

  const handleTogglePresence = useCallback(async () => {
    if (!profile?.city) {
      Alert.alert('Set your city', 'Add your city to your profile first.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePresence.mutate({
      city: profile.city,
      isActive: !cityPresenceActive,
    });
  }, [profile?.city, cityPresenceActive]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : '??';

  const displayId = profile?.display_id || 'AMARI-2026-XXXX';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={C.lightPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Aurora background blobs */}
      <View style={StyleSheet.absoluteFill}>
        <View style={[styles.blob, { backgroundColor: 'rgba(201,169,98,0.08)', top: -30, right: -50, width: 260, height: 260 }]} />
        <View style={[styles.blob, { backgroundColor: 'rgba(114,47,55,0.05)', bottom: 120, left: -40, width: 200, height: 200 }]} />
      </View>
      <GrainOverlay opacity={0.03} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.lightPrimary}
          />
        }
      >
        {/* Profile Header Card */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.headerCardWrapper}
        >
          <LiquidGlassCard variant="dark" noPadding>
            <View style={styles.darkHeader}>
              <View style={styles.darkGradientLine} />

              <View style={styles.profileRow}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                  {/* Tier badge on avatar */}
                  <View style={styles.tierBadge}>
                    <Text style={styles.tierBadgeText}>
                      {TIER_DISPLAY_NAMES[tier]?.toUpperCase() || 'MEMBER'}
                    </Text>
                  </View>
                </View>

                {/* Name + title */}
                <View>
                  {profile?.full_name?.split(' ').map((part: string, i: number) => (
                    <Text key={i} style={styles.nameText}>
                      {part}
                    </Text>
                  ))}
                  <Text style={styles.roleText}>
                    {profile?.title || 'Member'}
                    {profile?.company ? `, ${profile.company}` : ''}
                  </Text>
                </View>
              </View>

              {/* Barcode */}
              <View style={styles.barcodeSection}>
                <View style={styles.barcodeLines}>
                  {Array.from({ length: 34 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.barcodeLine,
                        {
                          width: [3, 1, 2, 1, 3, 2, 1, 1, 3, 1][i % 10],
                          backgroundColor:
                            i % 9 === 0 ? C.gold : C.lightPrimary,
                          opacity: 0.2 + (i % 4) * 0.12,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.barcodeId}>{displayId}</Text>
              </View>
            </View>
          </LiquidGlassCard>
        </MotiView>

        {/* Content area */}
        <View style={styles.contentArea}>
          {/* City Presence Toggle */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
          >
            <LiquidGlassCard variant="dark" noPadding>
              <Pressable
                style={[
                  styles.presenceCard,
                  cityPresenceActive && styles.presenceCardActive,
                ]}
                onPress={handleTogglePresence}
                accessibilityLabel={`City Presence: ${cityPresenceActive ? 'On' : 'Off'}`}
                accessibilityRole="switch"
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.presenceTitle}>City Presence</Text>
                  <Text
                    style={[
                      styles.presenceDesc,
                      cityPresenceActive && styles.presenceDescActive,
                    ]}
                  >
                    {cityPresenceActive
                      ? `Visible in ${profile?.city || 'your city'} · ${nearbyCount} alchemists nearby`
                      : 'Currently hidden'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggleTrack,
                    cityPresenceActive && styles.toggleTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      cityPresenceActive && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </Pressable>
            </LiquidGlassCard>
          </MotiView>

          {/* Info Cards */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            style={styles.infoCards}
          >
            {[
              {
                label: 'Building',
                value: profile?.company || 'Tap to add',
                color: C.burgundyOnDark,
              },
              {
                label: 'Interested In',
                value: profile?.industry || 'Tap to add',
                color: C.goldOnDark,
              },
              {
                label: 'Open To',
                value: profile?.bio || 'Tap to add',
                color: C.oliveOnDark,
              },
            ].map((card, i) => (
              <LiquidGlassCard key={i} variant="dark" noPadding>
                <Pressable
                  style={({ pressed }) => [
                    styles.infoCard,
                    { borderLeftColor: card.color + '30' },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    // Future: open edit modal
                  }}
                >
                  <Text style={{ ...T.label, color: card.color, marginBottom: S._8 }}>
                    {card.label}
                  </Text>
                  <Text style={{ ...T.body, color: C.lightSecondary }}>{card.value}</Text>
                </Pressable>
              </LiquidGlassCard>
            ))}
          </MotiView>

          {/* Sign Out */}
          <View style={styles.logoutSection}>
            <Pressable
              style={({ pressed }) => [
                styles.logoutBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleLogout}
              disabled={isLoggingOut}
              accessibilityLabel="Sign out"
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color={C.burgundyOnDark} />
              ) : (
                <Text style={styles.logoutText}>Sign Out</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.charcoal },
  scroll: { flex: 1 },
  content: { paddingBottom: S._40 + 84 },
  blob: { position: 'absolute', borderRadius: 999 },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.charcoal,
  },

  // Header card wrapper
  headerCardWrapper: {
    paddingHorizontal: S._12,
    paddingTop: S._12,
  },

  // Dark header
  darkHeader: {
    paddingHorizontal: S._20,
    paddingTop: S._12,
    paddingBottom: S._24,
    position: 'relative',
    overflow: 'hidden',
  },
  darkGradientLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.gold,
  },

  // Profile row
  profileRow: {
    flexDirection: 'row',
    gap: S._16,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: C.burgundy,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontFamily: 'Syne-ExtraBold',
    fontSize: 28,
    fontWeight: '800',
    color: C.lightPrimary,
  },
  tierBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    paddingVertical: S._4,
    paddingHorizontal: S._12,
    backgroundColor: C.gold,
    borderRadius: R.lg,
  },
  tierBadgeText: {
    ...T.label,
    fontSize: 11,
    color: C.warmBlack,
  },
  nameText: {
    ...T.title,
    fontSize: 24,
    color: C.lightPrimary,
  },
  roleText: {
    ...T.bodyItalic,
    color: C.lightSecondary,
    marginTop: S._4,
  },

  // Barcode
  barcodeSection: {
    marginTop: S._20,
    alignItems: 'center',
  },
  barcodeLines: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
    height: 40,
    marginBottom: S._8,
  },
  barcodeLine: {
    height: '100%',
  },
  barcodeId: {
    ...T.labelLg,
    letterSpacing: 5,
    color: C.lightSecondary,
  },

  // Content area (formerly light, now dark)
  contentArea: {
    paddingHorizontal: S._12,
    paddingTop: S._12,
  },

  // Presence card
  presenceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: S._16,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  presenceCardActive: {
    borderLeftColor: 'rgba(201,169,98,0.35)',
  },
  presenceTitle: {
    ...T.cardTitleSm,
    fontSize: 13,
    color: C.lightPrimary,
  },
  presenceDesc: {
    ...T.bodyItalic,
    fontSize: 13,
    color: C.lightTertiary,
    marginTop: S._2,
  },
  presenceDescActive: { color: C.goldOnDark },

  // Toggle
  toggleTrack: {
    width: 48,
    height: 28,
    padding: 3,
    backgroundColor: 'rgba(248,246,243,0.12)',
    borderRadius: R.lg,
    justifyContent: 'center',
  },
  toggleTrackActive: { backgroundColor: C.burgundy },
  toggleThumb: {
    width: 22,
    height: 22,
    backgroundColor: C.lightPrimary,
    borderRadius: 11,
  },
  toggleThumbActive: { alignSelf: 'flex-end' },

  // Info cards
  infoCards: {
    marginTop: S._8,
    gap: S._8,
  },
  infoCard: {
    padding: S._16,
    borderLeftWidth: 3,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  // Logout
  logoutSection: { marginTop: S._24 },
  logoutBtn: {
    backgroundColor: 'rgba(114,47,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.3)',
    borderRadius: 20,
    padding: S._16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  logoutText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    fontWeight: '500',
    color: C.burgundyOnDark,
  },
});
