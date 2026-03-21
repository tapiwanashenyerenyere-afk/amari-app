import { Dimensions, Platform } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const TILE_LARGE_WIDTH = Math.round(SCREEN_WIDTH * 0.69);
export const TILE_SMALL_WIDTH = Math.round(SCREEN_WIDTH * 0.43);
export const TILE_HEIGHT = 340;
export const TILE_GAP = 12;

export const getItemWidth = (index: number): number =>
  index < 2 ? TILE_LARGE_WIDTH : TILE_SMALL_WIDTH;

export const computeSnapOffsets = (tileCount: number): number[] => {
  const offsets: number[] = [];
  let offset = 0;
  for (let i = 0; i < tileCount; i++) {
    offsets.push(Math.round(offset));
    offset += getItemWidth(i) + TILE_GAP;
  }
  return offsets;
};

// Fallback content for when no live data is available
export const FALLBACK_TILES: Array<{
  id: string;
  type: 'fallback';
  title: string;
  description: string;
  tag_label: string;
  subtitle: string;
}> = [
  {
    id: 'fallback-1',
    type: 'fallback',
    title: 'What It Means to Be an Alchemist',
    description: 'The AMARI philosophy and what it means for the community.',
    tag_label: 'AMARI',
    subtitle: 'Community \u00b7 Editorial',
  },
  {
    id: 'fallback-2',
    type: 'fallback',
    title: 'The Infrastructure Model',
    description: 'How three divisions compound across generations.',
    tag_label: 'INFRASTRUCTURE',
    subtitle: 'About AMARI',
  },
  {
    id: 'fallback-3',
    type: 'fallback',
    title: 'Enterprise & Growth',
    description: 'Strategic advisory for established leaders.',
    tag_label: 'DIVISION I',
    subtitle: 'Learn More',
  },
];
