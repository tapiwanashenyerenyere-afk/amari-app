import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import type {
  OnboardingAxis,
  OnboardingCommunityNeed,
  OnboardingTimeFocus,
  OnboardingWorkStage,
} from '@/types/database';

export type OnboardingScores = Record<OnboardingAxis, number>;

export interface SubmitOnboardingPayload {
  scores: OnboardingScores;
  timeFocus: OnboardingTimeFocus;
  currentStage: OnboardingWorkStage;
  communityNeed: OnboardingCommunityNeed;
  consentVersion: string;
}

export function useSubmitOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitOnboardingPayload) => {
      const { data, error } = await supabase.rpc('submit_member_onboarding', {
        p_investor_score: payload.scores.investor,
        p_founder_score: payload.scores.founder,
        p_operator_score: payload.scores.operator,
        p_creator_score: payload.scores.creator,
        p_domain_specialist_score: payload.scores.domain_specialist,
        p_artist_score: payload.scores.artist,
        p_time_focus: payload.timeFocus,
        p_current_stage: payload.currentStage,
        p_community_need: payload.communityNeed,
        p_consent_version: payload.consentVersion,
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'onboarding_failed');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.member.onboardingStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.member.me });
    },
  });
}
