import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export function useProjectBookmarks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('project_bookmarks')
        .select('*, project:projects(*)')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useToggleBookmark() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Check if already bookmarked
      const { data: existing } = await supabase
        .from('project_bookmarks')
        .select('id')
        .eq('member_id', user.id)
        .eq('project_id', projectId)
        .single();

      if (existing) {
        // Remove bookmark
        const { error } = await supabase
          .from('project_bookmarks')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('project_bookmarks')
          .insert({ member_id: user.id, project_id: projectId });
        if (error) throw error;
        return { action: 'added' as const };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-bookmarks'] });
    },
  });
}
