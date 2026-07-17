import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import type { FeedInterest, FollowableEntity, NewsFeedItem, SavedArticleItem } from '@/types/database';

const FEED_PAGE_SIZE = 20;
const ENTITY_PAGE_SIZE = 500;

export function useNewsFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.news.feed(),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('get_news_feed', {
        p_limit: FEED_PAGE_SIZE,
        p_offset: pageParam,
      });
      if (error) throw error;
      return (data ?? []) as NewsFeedItem[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === FEED_PAGE_SIZE ? allPages.length * FEED_PAGE_SIZE : undefined,
    staleTime: staleTimes.news,
  });
}

export function useSavedArticles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.news.saved(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_saved_articles', { p_limit: 50 });
      if (error) throw error;
      return (data ?? []) as SavedArticleItem[];
    },
    staleTime: staleTimes.news,
    enabled,
  });
}

export function useFeedInterests() {
  return useQuery({
    queryKey: queryKeys.news.interests(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_feed_interests')
        .select('tag, weight, declared')
        .eq('declared', true);
      if (error) throw error;
      return (data ?? []) as FeedInterest[];
    },
    staleTime: staleTimes.news,
  });
}

export function useSetFeedInterests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tags: string[]) => {
      const { error } = await supabase.rpc('set_feed_interests', { p_tags: tags });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.news.interests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.news.feed() });
    },
  });
}

export function useFollowableEntities(enabled = true) {
  return useQuery({
    queryKey: queryKeys.entities.catalogue(),
    queryFn: async () => {
      const catalogue: FollowableEntity[] = [];
      for (let from = 0; ; from += ENTITY_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('tracked_entities')
          .select('id, kind, name, industry, region')
          .order('name', { ascending: true })
          .order('id', { ascending: true })
          .range(from, from + ENTITY_PAGE_SIZE - 1);
        if (error) throw error;
        const page = (data ?? []) as FollowableEntity[];
        catalogue.push(...page);
        if (page.length < ENTITY_PAGE_SIZE) return catalogue;
      }
    },
    enabled,
    staleTime: staleTimes.news,
  });
}

export function useEntityFollows(enabled = true) {
  return useQuery({
    queryKey: queryKeys.entities.follows(),
    queryFn: async () => {
      const follows: number[] = [];
      for (let from = 0; ; from += ENTITY_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('member_entity_follows')
          .select('entity_id')
          .order('entity_id', { ascending: true })
          .range(from, from + ENTITY_PAGE_SIZE - 1);
        if (error) throw error;
        const page = data ?? [];
        follows.push(...page.map((row) => Number(row.entity_id)));
        if (page.length < ENTITY_PAGE_SIZE) return follows;
      }
    },
    enabled,
    staleTime: staleTimes.news,
  });
}

export function useSetEntityFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityId, follow }: { entityId: number; follow: boolean }) => {
      const { data, error } = await supabase.rpc('set_entity_follow', {
        p_entity_id: entityId,
        p_follow: follow,
      });
      if (error) throw error;
      return { entityId, followed: Boolean(data) };
    },
    onMutate: async ({ entityId, follow }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.entities.follows() });
      const current = queryClient.getQueryData<number[]>(queryKeys.entities.follows()) ?? [];
      const wasFollowed = current.includes(entityId);
      queryClient.setQueryData<number[]>(
        queryKeys.entities.follows(),
        follow
          ? Array.from(new Set([...current, entityId]))
          : current.filter((id) => id !== entityId),
      );
      return { entityId, wasFollowed };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData<number[]>(queryKeys.entities.follows(), (current = []) =>
        context.wasFollowed
          ? Array.from(new Set([...current, context.entityId]))
          : current.filter((id) => id !== context.entityId),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.entities.follows() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entities.follows() });
      queryClient.invalidateQueries({ queryKey: queryKeys.news.feed() });
    },
  });
}

export function useToggleSavedArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: number) => {
      const { data, error } = await supabase.rpc('toggle_saved_article', { p_article_id: articleId });
      if (error) throw error;
      return { articleId, saved: Boolean(data) };
    },
    onSuccess: ({ articleId, saved }) => {
      queryClient.setQueryData(
        queryKeys.news.feed(),
        (existing: { pages: NewsFeedItem[][]; pageParams: unknown[] } | undefined) => {
          if (!existing) return existing;
          return {
            ...existing,
            pages: existing.pages.map((page) =>
              page.map((item) => (item.id === articleId ? { ...item, is_saved: saved } : item)),
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.news.saved() });
    },
  });
}
