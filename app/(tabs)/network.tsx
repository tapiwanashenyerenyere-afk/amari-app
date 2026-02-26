import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, RefreshControl, ActivityIndicator, Modal, Linking, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Search, Instagram, X, ChevronRight, ExternalLink } from 'lucide-react-native';
import { COLORS } from '../../lib/constants';
import { api, Connection, ConnectionRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { tapHaptic, selectionHaptic, successHaptic } from '../../lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    await tapHaptic();
    setActionLoading(requestId);
    try {
      await api.acceptConnection(requestId);
      await successHaptic();
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

  const handleMatchOption = async (optionId: string) => {
    await selectionHaptic();
    setSelectedMatch(optionId);
    // Simulate AI matching - would call API in production
    Alert.alert(
      'AI Matching',
      `Finding members based on "${AI_MATCH_OPTIONS.find(o => o.id === optionId)?.label}"...`,
      [{ text: 'OK', onPress: () => setSelectedMatch(null) }]
    );
  };

  const handleOpenInstagram = async () => {
    await tapHaptic();
    const instagramUrl = 'https://www.instagram.com/amari.gala/';
    const appUrl = 'instagram://user?username=amari.gala';

    try {
      // Try to open in Instagram app first
      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) {
        await Linking.openURL(appUrl);
      } else {
        // Fall back to browser
        await Linking.openURL(instagramUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open Instagram');
    }
  };

  const handleSelectConnection = async (connection: Connection) => {
    await selectionHaptic();
    setSelectedConnection(connection);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert('Search', `Searching for members matching "${searchQuery}"...`);
    }
  };

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
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* AI Match Options */}
        <View style={styles.matchOptions}>
          {AI_MATCH_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.matchOption,
                selectedMatch === option.id && styles.matchOptionSelected,
                pressed && styles.matchOptionPressed,
              ]}
              onPress={() => handleMatchOption(option.id)}
              accessibilityLabel={`Find ${option.label}`}
            >
              <Text style={[
                styles.matchLabel,
                selectedMatch === option.id && styles.matchLabelSelected,
              ]}>
                {option.label}
              </Text>
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
                    <Pressable
                      key={connection.id}
                      style={({ pressed }) => [
                        styles.connectionItem,
                        pressed && styles.connectionItemPressed,
                      ]}
                      onPress={() => handleSelectConnection(connection)}
                      accessibilityLabel={`View ${connection.member.name}'s profile`}
                    >
                      <View style={styles.connectionItemContent}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {connection.member.name.charAt(0)}
                          </Text>
                        </View>
                        <Text style={styles.connectionName}>{connection.member.name}</Text>
                      </View>
                      <ChevronRight size={18} color={COLORS.warmGray} strokeWidth={1.5} />
                    </Pressable>
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
                          style={({ pressed }) => [
                            styles.acceptButton,
                            actionLoading === request.id && styles.buttonDisabled,
                            pressed && styles.acceptButtonPressed,
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
                          style={({ pressed }) => [
                            styles.declineButton,
                            actionLoading === request.id && styles.buttonDisabled,
                            pressed && styles.declineButtonPressed,
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

        {/* Instagram Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AMARI GALLERY</Text>
          <View style={styles.instagramEmbed}>
            <View style={styles.instagramEmbedHeader}>
              <Instagram size={20} color={COLORS.cream} strokeWidth={1.5} />
              <Text style={styles.instagramEmbedTitle}>@amari.gala</Text>
            </View>
            <View style={styles.instagramWebviewContainer}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                          background: #000000;
                          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                          overflow: hidden;
                        }
                        .grid {
                          display: grid;
                          grid-template-columns: repeat(3, 1fr);
                          gap: 2px;
                        }
                        .placeholder {
                          aspect-ratio: 1;
                          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        }
                        .placeholder span {
                          font-size: 20px;
                          opacity: 0.3;
                        }
                        .cta {
                          padding: 20px;
                          text-align: center;
                          color: rgba(248, 246, 243, 0.6);
                          font-size: 12px;
                          letter-spacing: 1px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="grid">
                        <div class="placeholder"><span>📸</span></div>
                        <div class="placeholder"><span>🎭</span></div>
                        <div class="placeholder"><span>✨</span></div>
                        <div class="placeholder"><span>🌟</span></div>
                        <div class="placeholder"><span>🎪</span></div>
                        <div class="placeholder"><span>🎉</span></div>
                      </div>
                      <div class="cta">TAP TO VIEW ON INSTAGRAM</div>
                    </body>
                    </html>
                  `
                }}
                style={styles.instagramWebview}
                scrollEnabled={false}
                onTouchEnd={handleOpenInstagram}
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.instagramButton,
                pressed && styles.instagramButtonPressed,
              ]}
              onPress={handleOpenInstagram}
            >
              <Text style={styles.instagramButtonText}>VIEW ON INSTAGRAM</Text>
              <ExternalLink size={14} color={COLORS.cream} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Connection Profile Modal */}
      <Modal
        visible={selectedConnection !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedConnection(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable
              style={styles.modalClose}
              onPress={() => setSelectedConnection(null)}
              accessibilityLabel="Close profile"
            >
              <X size={20} color={COLORS.charcoal} strokeWidth={1.5} />
            </Pressable>
            {selectedConnection && (
              <>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {selectedConnection.member.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.modalName}>{selectedConnection.member.name}</Text>
                {selectedConnection.member.building && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>BUILDING</Text>
                    <Text style={styles.modalSectionText}>
                      "{selectedConnection.member.building}"
                    </Text>
                  </View>
                )}
                {selectedConnection.member.interests && selectedConnection.member.interests.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>INTERESTS</Text>
                    <View style={styles.modalTags}>
                      {selectedConnection.member.interests.map((interest: string) => (
                        <View key={interest} style={styles.modalTag}>
                          <Text style={styles.modalTagText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                <Text style={styles.modalConnectedText}>
                  Connected since {new Date(selectedConnection.connectedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  acceptButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  declineButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  matchOptionSelected: {
    backgroundColor: COLORS.charcoal,
    borderColor: COLORS.charcoal,
  },
  matchOptionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  matchLabelSelected: {
    color: COLORS.white,
  },
  connectionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  connectionItemPressed: {
    backgroundColor: COLORS.creamDark,
  },
  instagramEmbed: {
    backgroundColor: COLORS.charcoal,
    overflow: 'hidden',
  },
  instagramEmbedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 246, 243, 0.1)',
  },
  instagramEmbedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.cream,
    letterSpacing: 1,
  },
  instagramWebviewContainer: {
    height: 180,
    backgroundColor: '#000000',
  },
  instagramWebview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: 'rgba(248, 246, 243, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(248, 246, 243, 0.1)',
  },
  instagramButtonPressed: {
    backgroundColor: 'rgba(248, 246, 243, 0.1)',
  },
  instagramButtonText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.cream,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarText: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '300',
  },
  modalName: {
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.charcoal,
    marginBottom: 24,
  },
  modalSection: {
    width: '100%',
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.warmGray,
    marginBottom: 8,
  },
  modalSectionText: {
    fontSize: 15,
    color: COLORS.charcoal,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTag: {
    backgroundColor: COLORS.creamDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalTagText: {
    fontSize: 13,
    color: COLORS.charcoal,
  },
  modalConnectedText: {
    fontSize: 12,
    color: COLORS.warmGray,
    marginTop: 16,
  },
});
