import { Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const TILE_LARGE_WIDTH = Math.round(SCREEN_WIDTH * 0.69);
export const TILE_SMALL_WIDTH = Math.round(SCREEN_WIDTH * 0.43);
export const TILE_HEIGHT = 340;
export const TILE_GAP = 12;
export const EXPLORE_CACHE_KEY = 'amari:explore-cache:v2';

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
