import { feedTagLabel, FEED_TOPIC_TAGS, FEED_REGION_TAGS } from '@/constants/feedTags';

describe('feedTagLabel', () => {
  it('returns the declared label for a known topic tag', () => {
    expect(feedTagLabel('food-agribusiness')).toBe('Food & Agribusiness');
  });

  it('returns the declared label for a known region tag', () => {
    expect(feedTagLabel('africa')).toBe('Africa');
  });

  it('returns the special-cased "global" label even though it is not in either tag list', () => {
    expect(feedTagLabel('global')).toBe('Global');
  });

  it('humanises an unrecognised hyphenated tag as a fallback', () => {
    expect(feedTagLabel('some-unknown-tag')).toBe('some unknown tag');
  });
});

describe('tag catalogues', () => {
  it('keeps topic and region tags disjoint', () => {
    const topicTags = new Set(FEED_TOPIC_TAGS.map((t) => t.tag));
    const overlap = FEED_REGION_TAGS.filter((t) => topicTags.has(t.tag));
    expect(overlap).toHaveLength(0);
  });
});
