import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ZOOM_TIERS } from '../lib/mapbox';
import type { MapCountryCluster, MapStateCluster, MapProject, ProjectCategory } from '../types/database';

// Viewport bounds for spatial queries
interface ViewportBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

// Determine which zoom tier we're in
function getZoomTier(zoom: number): 'country' | 'state' | 'project' {
  if (zoom <= ZOOM_TIERS.COUNTRY.max) return 'country';
  if (zoom <= ZOOM_TIERS.STATE.max) return 'state';
  return 'project';
}

// ─── Country clusters (zoom 0-4) ───────────────────────────
export function useMapCountries(categoryFilter?: ProjectCategory) {
  return useQuery({
    queryKey: ['map', 'countries', categoryFilter],
    queryFn: async (): Promise<MapCountryCluster[]> => {
      const { data, error } = await supabase.rpc('map_countries', {
        category_filter: categoryFilter ?? null,
      });
      if (error) throw error;
      return (data ?? []) as MapCountryCluster[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour — data refreshes weekly
  });
}

// ─── State clusters (zoom 5-6) ─────────────────────────────
export function useMapStates(
  bounds: ViewportBounds | null,
  categoryFilter?: ProjectCategory,
) {
  return useQuery({
    queryKey: ['map', 'states', bounds, categoryFilter],
    queryFn: async (): Promise<MapStateCluster[]> => {
      if (!bounds) return [];
      const { data, error } = await supabase.rpc('map_states', {
        min_lat: bounds.minLat,
        min_lng: bounds.minLng,
        max_lat: bounds.maxLat,
        max_lng: bounds.maxLng,
        category_filter: categoryFilter ?? null,
      });
      if (error) throw error;
      return (data ?? []) as MapStateCluster[];
    },
    enabled: !!bounds,
    staleTime: 1000 * 60 * 60,
  });
}

// ─── Individual projects (zoom 7-8) ────────────────────────
export function useMapProjects(
  bounds: ViewportBounds | null,
  categoryFilter?: ProjectCategory,
) {
  return useQuery({
    queryKey: ['map', 'projects', bounds, categoryFilter],
    queryFn: async (): Promise<MapProject[]> => {
      if (!bounds) return [];
      const { data, error } = await supabase.rpc('map_projects', {
        min_lat: bounds.minLat,
        min_lng: bounds.minLng,
        max_lat: bounds.maxLat,
        max_lng: bounds.maxLng,
        category_filter: categoryFilter ?? null,
      });
      if (error) throw error;
      return (data ?? []) as MapProject[];
    },
    enabled: !!bounds,
    staleTime: 1000 * 60 * 60,
  });
}

// ─── Zoom-aware hook that picks the right data source ──────
export function useMapData(
  zoom: number,
  bounds: ViewportBounds | null,
  categoryFilter?: ProjectCategory,
) {
  const tier = getZoomTier(zoom);

  const countries = useMapCountries(
    tier === 'country' ? categoryFilter : undefined,
  );
  const states = useMapStates(
    tier === 'state' ? bounds : null,
    tier === 'state' ? categoryFilter : undefined,
  );
  const projects = useMapProjects(
    tier === 'project' ? bounds : null,
    tier === 'project' ? categoryFilter : undefined,
  );

  return {
    tier,
    countries: tier === 'country' ? countries : { data: undefined, isLoading: false },
    states: tier === 'state' ? states : { data: undefined, isLoading: false },
    projects: tier === 'project' ? projects : { data: undefined, isLoading: false },
    isLoading:
      (tier === 'country' && countries.isLoading) ||
      (tier === 'state' && states.isLoading) ||
      (tier === 'project' && projects.isLoading),
  };
}
