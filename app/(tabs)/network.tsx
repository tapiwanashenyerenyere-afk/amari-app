import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Instagram } from 'lucide-react-native';
import { COLORS } from '../../lib/constants';
import { api, Connection, ConnectionRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

const AI_MATCH_OPTIONS = [
  { id: 'similar', label: 'People like me' },
  { id: 'complementary', label: 'Complementary skills' },
  { id: 'location', label: 'By location' },
  { id: 'interest', label: 'By interest' },
];

export default function NetworkScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const [connectionsRes, pendingRes] = await Promise.all([
        api.getConnections(),
        api.getPendingRequests(),
      ]);

      setConnections(connectionsRes.connections);
      setPendingRequests(pendingRes.requests);
    } catch (err) {
      console.error('Failed to fetch network data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.acceptConnection(requestId);
      // Refresh data after accepting
      await fetchData();
    } catch (err) {
      console.error('Failed to accept connection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await api.declineConnection(requestId);
      // Refresh data after declining
      await fetchData();
    } catch (err) {
      console.error('Failed to decline connection:', err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.charcoal}
          />
        }
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

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.charcoal} />
          </View>
        ) : (
          <>
            {/* Your Connections */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>YOUR CONNECTIONS</Text>
                <Text style={styles.connectionCount}>{connections.length}</Text>
              </View>
              {connections.length > 0 ? (
                <View style={styles.connectionsList}>
                  {connections.map((connection) => (
                    <View key={connection.id} style={styles.connectionItem}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {connection.member.name.charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.connectionName}>{connection.member.name}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No connections yet</Text>
                </View>
              )}
            </View>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>PENDING REQUESTS</Text>
                  <Text style={styles.connectionCount}>{pendingRequests.length}</Text>
                </View>
                <View style={styles.requestsList}>
                  {pendingRequests.map((request) => (
                    <View key={request.id} style={styles.requestItem}>
                      <View style={styles.requestInfo}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {request.requester.name.charAt(0)}
                          </Text>
                        </View>
                        <Text style={styles.requestName}>{request.requester.name}</Text>
                      </View>
                      <View style={styles.requestActions}>
                        <Pressable
                          style={[
                            styles.acceptButton,
                            actionLoading === request.id && styles.buttonDisabled,
                          ]}
                          onPress={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                          accessibilityLabel={`Accept connection request from ${request.requester.name}`}
                        >
                          {actionLoading === request.id ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <Text style={styles.acceptText}>Accept</Text>
                          )}
                        </Pressable>
                        <Pressable
                          style={[
                            styles.declineButton,
                            actionLoading === request.id && styles.buttonDisabled,
                          ]}
                          onPress={() => handleDecline(request.id)}
                          disabled={actionLoading === request.id}
                          accessibilityLabel={`Decline connection request from ${request.requester.name}`}
                        >
                          <Text style={styles.declineText}>Decline</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
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
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
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
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.warmGray,
    fontStyle: 'italic',
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
    minWidth: 70,
    alignItems: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
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
