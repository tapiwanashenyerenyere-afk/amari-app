import { useCallback, useState } from 'react';
import type { MapState } from '@rnmapbox/maps';
import { MAP_CONFIG } from '../lib/mapbox';

export interface ViewportBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

interface ViewportState {
  zoom: number;
  center: [number, number];
  bounds: ViewportBounds | null;
}

export function useMapViewport() {
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: MAP_CONFIG.defaultZoom,
    center: MAP_CONFIG.defaultCenter,
    bounds: null,
  });

  const onMapIdle = useCallback((state: MapState) => {
    const zoom = state.properties.zoom ?? MAP_CONFIG.defaultZoom;
    const center = state.properties.center ?? MAP_CONFIG.defaultCenter;
    const bounds = state.properties.bounds
      ? {
          minLat: state.properties.bounds.sw[1],
          minLng: state.properties.bounds.sw[0],
          maxLat: state.properties.bounds.ne[1],
          maxLng: state.properties.bounds.ne[0],
        }
      : null;

    setViewport({
      zoom,
      center: [center[0], center[1]],
      bounds,
    });
  }, []);

  return {
    ...viewport,
    onMapIdle,
  };
}
