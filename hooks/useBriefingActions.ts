import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { recordNewsEvent } from '@/lib/newsEvents';
import { useToggleSavedArticle } from '@/queries/news';
import type { NewsFeedItem } from '@/types/database';

// Shared open + save behaviour for briefing surfaces. Opening an article
// records open + dwell signals; video/audio will route to the player once
// that layer lands (they open the source for now).
export function useBriefingActions() {
  const toggleSaved = useToggleSavedArticle();

  const openArticle = useCallback(async (article: NewsFeedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    recordNewsEvent(article.id, 'open');
    const openedAt = Date.now();
    await WebBrowser.openBrowserAsync(article.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
    recordNewsEvent(article.id, 'dwell', Date.now() - openedAt);
  }, []);

  const handleToggleSave = useCallback(
    (article: NewsFeedItem) => {
      Haptics.selectionAsync();
      toggleSaved.mutate(article.id);
    },
    [toggleSaved],
  );

  return { openArticle, handleToggleSave };
}
