import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type IssueCategory = 'bug' | 'content' | 'account' | 'payment' | 'suggestion' | 'other';

export interface IssueReport {
  id: number;
  reporter_id: string;
  category: IssueCategory;
  message: string;
  app_version: string | null;
  platform: string | null;
  status: 'open' | 'reviewing' | 'resolved';
  created_at: string;
  reporter?: { full_name: string; email: string } | null;
}

export function useReportIssue() {
  return useMutation({
    mutationFn: async ({ category, message }: { category: IssueCategory; message: string }) => {
      const appVersion = Constants.expoConfig?.version ?? null;
      const { data, error } = await supabase.rpc('report_issue', {
        p_category: category,
        p_message: message,
        p_app_version: appVersion,
        p_platform: Platform.OS,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Could not send report');
    },
  });
}

export function useIssueReports(enabled: boolean) {
  return useQuery({
    queryKey: ['issues', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_reports')
        .select('id, reporter_id, category, message, app_version, platform, status, created_at, reporter:members!issue_reports_reporter_id_fkey(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as IssueReport[];
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useSetIssueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: IssueReport['status'] }) => {
      const { data, error } = await supabase.rpc('set_issue_status', { p_id: id, p_status: status });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Update failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issues', 'all'] }),
  });
}
