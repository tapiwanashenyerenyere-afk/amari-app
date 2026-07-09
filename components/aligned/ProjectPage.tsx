import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, Bookmark, Mail, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientGradient, PressableScale } from '@/components/v2';
import { hapticOutcome } from '@/lib/motion';
import { colors, radius, spacing, typography } from '@/lib/theme';
import {
  useIsProjectOwner,
  useMyProjectRequest,
  usePostProjectUpdate,
  useProjectRequests,
  useProjectUpdates,
  useRequestContact,
  useRespondContact,
} from '@/queries/projects';

export interface ProjectPageProject {
  project_id: string;
  name: string;
  description: string;
  category: string;
  creator_first_name?: string | null;
  creatorEmail?: string | null;
  display_label?: string | null;
  image_url: string | null;
  external_link?: string | null;
  tags?: string[];
}

interface ProjectPageProps {
  onClose: () => void;
  onContact?: () => void;
  onOpenLink: (url: string) => void;
  onToggleBookmark: () => void;
  project: ProjectPageProject;
  saved: boolean;
}

function formatUpdateDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
}

export function ProjectPage({
  onClose,
  onOpenLink,
  onToggleBookmark,
  project,
  saved,
}: ProjectPageProps) {
  const { data: updates = [], isLoading: updatesLoading } = useProjectUpdates(project.project_id);
  const { data: isOwner = false } = useIsProjectOwner(project.project_id);
  const postUpdate = usePostProjectUpdate(project.project_id);
  const [draft, setDraft] = useState('');
  const [introDraft, setIntroDraft] = useState('');
  const [introOpen, setIntroOpen] = useState(false);
  const { data: myRequest } = useMyProjectRequest(project.project_id, isOwner);
  const { data: requests = [] } = useProjectRequests(project.project_id, isOwner);
  const requestContact = useRequestContact(project.project_id);
  const respondContact = useRespondContact(project.project_id);

  const sendIntroRequest = async () => {
    try {
      await requestContact.mutateAsync(introDraft);
      setIntroOpen(false);
      setIntroDraft('');
      hapticOutcome(true);
    } catch (error) {
      hapticOutcome(false);
      Alert.alert('Could not send', error instanceof Error ? error.message : 'Try again shortly.');
    }
  };

  const submitUpdate = async () => {
    if (!draft.trim()) return;
    try {
      await postUpdate.mutateAsync(draft);
      setDraft('');
      hapticOutcome(true);
    } catch {
      hapticOutcome(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <View style={styles.root}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.cover}>
            {project.image_url ? (
              <Image
                contentFit="cover"
                source={{ uri: project.image_url }}
                style={StyleSheet.absoluteFillObject}
                transition={220}
              />
            ) : (
              <View style={styles.coverFallback}>
                <AmbientGradient intensity={0.08} size={320} />
                <Text style={styles.coverInitial}>{project.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <LinearGradient
              colors={['rgba(10,10,10,0.25)', 'rgba(10,10,10,0.0)', 'rgba(10,10,10,0.88)']}
              style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView edges={['top']} style={styles.coverTop}>
              <Pressable hitSlop={8} onPress={onClose} style={styles.closeButton}>
                <X color={colors.white} size={18} strokeWidth={2.1} />
              </Pressable>
            </SafeAreaView>

            <View style={styles.coverText}>
              <Text style={styles.eyebrow}>{project.category.toUpperCase()}</Text>
              <Text style={styles.title}>{project.name}</Text>
              {project.display_label ? (
                <Text style={styles.coverMeta}>
                  {[project.creator_first_name ? `Led by ${project.creator_first_name}` : null, project.display_label]
                    .filter(Boolean)
                    .join('  ·  ')}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.description}>{project.description}</Text>

            {project.tags?.length ? (
              <View style={styles.tagRow}>
                {project.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <PressableScale
                onPress={onToggleBookmark}
                style={[styles.followButton, saved ? styles.followButtonOn : null]}
              >
                <Bookmark
                  color={saved ? colors.black : colors.white}
                  fill={saved ? colors.black : 'transparent'}
                  size={14}
                  strokeWidth={2}
                />
                <Text style={[styles.followText, saved ? styles.followTextOn : null]}>
                  {saved ? 'Following' : 'Follow this work'}
                </Text>
              </PressableScale>

              {project.external_link ? (
                <PressableScale
                  onPress={() => onOpenLink(project.external_link!)}
                  style={styles.linkButton}
                >
                  <ArrowUpRight color={colors.black} size={15} strokeWidth={2.1} />
                  <Text style={styles.linkText}>Visit</Text>
                </PressableScale>
              ) : null}
            </View>

            {isOwner && requests.length ? (
              <View style={styles.requestsPanel}>
                <Text style={styles.journalTitle}>Introduction requests</Text>
                {requests.map((r) => (
                  <View key={r.id} style={styles.requestRow}>
                    <Text style={styles.requestName}>
                      {r.requester_name}
                      {r.requester_industry ? `  \u00B7  ${r.requester_industry}` : ''}
                    </Text>
                    <Text style={styles.requestMessage}>{r.message}</Text>
                    {r.status === 'pending' ? (
                      <View style={styles.requestActions}>
                        <PressableScale
                          onPress={() => respondContact.mutate({ requestId: r.id, approve: true })}
                          style={styles.approveButton}
                        >
                          <Text style={styles.approveText}>Approve</Text>
                        </PressableScale>
                        <PressableScale
                          onPress={() => respondContact.mutate({ requestId: r.id, approve: false })}
                          style={styles.declineButton}
                        >
                          <Text style={styles.declineText}>Decline</Text>
                        </PressableScale>
                      </View>
                    ) : (
                      <Text style={styles.requestStatus}>
                        {r.status === 'approved'
                          ? `Approved \u2014 ${r.requester_email ?? 'email shared'}`
                          : 'Declined'}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.journalHeader}>
              <Text style={styles.journalTitle}>Journal</Text>
              <Text style={styles.journalHint}>
                {isOwner ? 'Your progress, in your words.' : 'Progress notes from the builder.'}
              </Text>
            </View>

            {isOwner ? (
              <View style={styles.composer}>
                <TextInput
                  multiline
                  maxLength={1200}
                  onChangeText={setDraft}
                  placeholder="Share where this work is up to…"
                  placeholderTextColor={colors.grayLight}
                  style={styles.composerInput}
                  value={draft}
                />
                <PressableScale
                  disabled={postUpdate.isPending || !draft.trim()}
                  onPress={submitUpdate}
                  style={[styles.postButton, !draft.trim() ? styles.postButtonDisabled : null]}
                >
                  {postUpdate.isPending ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.postText}>Post update</Text>
                  )}
                </PressableScale>
              </View>
            ) : null}

            {updatesLoading ? (
              <ActivityIndicator color={colors.sand} style={styles.journalLoading} />
            ) : updates.length ? (
              <View style={styles.timeline}>
                {updates.map((update) => (
                  <View key={update.id} style={styles.timelineRow}>
                    <View style={styles.timelineMarker}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineLine} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>{formatUpdateDate(update.created_at)}</Text>
                      <Text style={styles.timelineBody}>{update.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.journalEmpty}>
                {isOwner
                  ? 'No updates yet. The first entry starts the story.'
                  : 'No updates yet. Follow this work to catch the first one.'}
              </Text>
            )}
          </View>
        </ScrollView>

        {!isOwner ? (
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            {myRequest?.status === 'approved' && myRequest.owner_email ? (
              <PressableScale
                onPress={() => onOpenLink(`mailto:${myRequest.owner_email}`)}
                style={styles.contactButton}
              >
                <Mail color={colors.white} size={15} strokeWidth={2} />
                <Text style={styles.contactText}>Email the builder</Text>
              </PressableScale>
            ) : myRequest?.status === 'pending' ? (
              <View style={[styles.contactButton, styles.contactPending]}>
                <Text style={styles.contactPendingText}>Introduction requested \u2014 awaiting approval</Text>
              </View>
            ) : myRequest?.status === 'declined' ? (
              <View style={[styles.contactButton, styles.contactPending]}>
                <Text style={styles.contactPendingText}>The builder passed this time</Text>
              </View>
            ) : introOpen ? (
              <View style={styles.introComposer}>
                <TextInput
                  multiline
                  maxLength={600}
                  onChangeText={setIntroDraft}
                  placeholder="Why do you want to connect? A sentence or two."
                  placeholderTextColor={colors.grayLight}
                  style={styles.introInput}
                  value={introDraft}
                />
                <PressableScale
                  disabled={requestContact.isPending || introDraft.trim().length < 12}
                  onPress={sendIntroRequest}
                  style={[styles.contactButton, introDraft.trim().length < 12 ? styles.contactDisabled : null]}
                >
                  {requestContact.isPending ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.contactText}>Send request</Text>
                  )}
                </PressableScale>
              </View>
            ) : (
              <PressableScale onPress={() => setIntroOpen(true)} style={styles.contactButton}>
                <Mail color={colors.white} size={15} strokeWidth={2} />
                <Text style={styles.contactText}>Request an introduction</Text>
              </PressableScale>
            )}
          </SafeAreaView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  cover: {
    height: 400,
    backgroundColor: colors.cardBase,
    overflow: 'hidden',
  },
  coverFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardWarm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverInitial: {
    fontFamily: typography.body.bold,
    fontSize: 130,
    color: 'rgba(255,255,255,0.07)',
  },
  coverTop: {
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10,10,10,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: 24,
  },
  eyebrow: {
    fontFamily: typography.mono.medium,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  title: {
    fontFamily: typography.body.bold,
    fontSize: 30,
    lineHeight: 35,
    color: colors.white,
    letterSpacing: -0.5,
  },
  coverMeta: {
    marginTop: 8,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.66)',
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: 120,
  },
  description: {
    fontFamily: typography.body.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.black,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: colors.white,
  },
  tagText: {
    fontFamily: typography.body.medium,
    fontSize: 11,
    color: colors.black,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  followButtonOn: {
    backgroundColor: colors.gold,
  },
  followText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12.5,
    color: colors.white,
  },
  followTextOn: {
    color: colors.black,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.14)',
    backgroundColor: colors.white,
  },
  linkText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12.5,
    color: colors.black,
  },
  journalHeader: {
    marginTop: 34,
    marginBottom: 14,
  },
  journalTitle: {
    fontFamily: typography.body.bold,
    fontSize: 19,
    color: colors.black,
    letterSpacing: -0.3,
  },
  journalHint: {
    marginTop: 3,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: colors.gray,
  },
  composer: {
    marginBottom: 20,
  },
  composerInput: {
    minHeight: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typography.body.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.black,
    textAlignVertical: 'top',
  },
  postButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12.5,
    color: colors.white,
  },
  journalLoading: {
    marginVertical: 20,
  },
  timeline: {
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineMarker: {
    alignItems: 'center',
    width: 10,
  },
  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.sand,
    marginTop: 5,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 22,
  },
  timelineDate: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    color: 'rgba(0,0,0,0.35)',
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  timelineBody: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.black,
  },
  journalEmpty: {
    fontFamily: typography.body.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.gray,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: 'rgba(242,237,230,0.96)',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  contactText: {
    fontFamily: typography.body.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  contactPending: {
    backgroundColor: colors.warm,
  },
  contactPendingText: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.gray,
  },
  contactDisabled: {
    opacity: 0.5,
  },
  introComposer: {
    gap: 10,
  },
  introInput: {
    minHeight: 70,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: typography.body.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.black,
    textAlignVertical: 'top',
  },
  requestsPanel: {
    marginTop: 30,
  },
  requestRow: {
    marginTop: 14,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    padding: 14,
  },
  requestName: {
    fontFamily: typography.body.bold,
    fontSize: 13.5,
    color: colors.black,
  },
  requestMessage: {
    marginTop: 5,
    fontFamily: typography.body.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.gray,
  },
  requestStatus: {
    marginTop: 10,
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.goldDark,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  approveButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.md,
    backgroundColor: colors.black,
  },
  approveText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.white,
  },
  declineButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.14)',
  },
  declineText: {
    fontFamily: typography.body.semiBold,
    fontSize: 12,
    color: colors.black,
  },
});
