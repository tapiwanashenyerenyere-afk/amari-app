import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys, staleTimes } from '@/lib/queryClient';
import type { FeedInterest, NewsFeedItem, SavedArticleItem } from '@/types/database';

const FEED_PAGE_SIZE = 20;

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
