import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

const updatesKey = (projectId: string) => ['projects', projectId, 'updates'] as const;
const ownerKey = (projectId: string) => ['projects', projectId, 'owner'] as const;

export function useProjectUpdates(projectId: string | null) {
  return useQuery({
    queryKey: updatesKey(projectId ?? 'none'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as ProjectUpdate[];
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useIsProjectOwner(projectId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ownerKey(projectId ?? 'none'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('creator_id')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data?.creator_id === user?.id;
    },
    enabled: !!projectId && !!user,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePostProjectUpdate(projectId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) throw new Error('Update cannot be empty');
      const { error } = await supabase.from('project_updates').insert({
        project_id: projectId,
        author_id: user!.id,
        body: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: updatesKey(projectId) });
      }
    },
  });
}
