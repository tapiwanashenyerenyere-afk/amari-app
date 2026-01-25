import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Instagram, Users, Sparkles, MapPin, Heart } from 'lucide-react-native';
import { COLORS } from '../../lib/constants';

// Mock data
const MY_CONNECTIONS = [
  { id: '1', name: 'Kalows Abdalla' },
  { id: '2', name: 'Christina Mekonnen' },
  { id: '3', name: 'Olivier Permal' },
];

const PENDING_REQUESTS = [
  { id: '1', name: 'Sarah Okonkwo', type: 'received' },
  { id: '2', name: 'James Mutua', type: 'received' },
];

const AI_MATCH_OPTIONS = [
  { id: 'similar', label: 'People like me', description: 'Similar interests & background' },
  { id: 'complementary', label: 'Complementary skills', description: 'Find collaborators' },
  { id: 'location', label: 'By location', description: 'Near you' },
  { id: 'interest', label: 'By interest', description: 'Shared topics' },
];

export default function NetworkScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Network</Text>
        </View>

        {/* Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FIND CONNECTIONS</Text>
          <View style={styles.searchContainer}>
            <Search size={18} color={COLORS.warmGray} strokeWidth={1.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by tags..."
              placeholderTextColor={COLORS.warmGray}
            />
          </View>
        </View>

        {/* AI Match Options */}
        <View style={styles.matchOptions}>
          {AI_MATCH_OPTIONS.map((option) => (
            <Pressable key={option.id} style={styles.matchOption}>
              <Text style={styles.matchLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Your Connections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR CONNECTIONS</Text>
            <Text style={styles.connectionCount}>{MY_CONNECTIONS.length}</Text>
          </View>
          <View style={styles.connectionsList}>
            {MY_CONNECTIONS.map((connection) => (
              <View key={connection.id} style={styles.connectionItem}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {connection.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.connectionName}>{connection.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pending Requests */}
        {PENDING_REQUESTS.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PENDING REQUESTS</Text>
              <Text style={styles.connectionCount}>{PENDING_REQUESTS.length}</Text>
            </View>
            <View style={styles.requestsList}>
              {PENDING_REQUESTS.map((request) => (
                <View key={request.id} style={styles.requestItem}>
                  <View style={styles.requestInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {request.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.requestName}>{request.name}</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <Pressable
                      style={styles.acceptButton}
                      accessibilityLabel={`Accept connection request from ${request.name}`}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={styles.declineButton}
                      accessibilityLabel={`Decline connection request from ${request.name}`}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instagram Feed Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>@AMABOROGROUP</Text>
          <View style={styles.instagramPlaceholder}>
            <Instagram size={32} color={COLORS.charcoal} strokeWidth={1.5} />
            <Text style={styles.instagramText}>Instagram Feed</Text>
            <Text style={styles.instagramSubtext}>
              Latest posts from AMARI Gala / AMARI Group
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.charcoal,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.warmGray,
  },
  connectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.charcoal,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.charcoal,
  },
  matchOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  matchOption: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  matchLabel: {
    fontSize: 13,
    color: COLORS.charcoal,
  },
  connectionsList: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
  },
  connectionName: {
    fontSize: 15,
    color: COLORS.charcoal,
  },
  requestsList: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestName: {
    fontSize: 15,
    color: COLORS.charcoal,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.charcoal,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  declineButton: {
    backgroundColor: COLORS.creamDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  declineText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.warmGray,
  },
  instagramPlaceholder: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  instagramText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.charcoal,
    marginBottom: 4,
  },
  instagramSubtext: {
    fontSize: 12,
    color: COLORS.warmGray,
    textAlign: 'center',
  },
});
