import Mapbox from '@rnmapbox/maps';

// Public token for map rendering (safe to embed in client)
// Set this in .env as EXPO_PUBLIC_MAPBOX_TOKEN
const MAPBOX_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
export const HAS_MAPBOX_TOKEN = MAPBOX_PUBLIC_TOKEN.length > 0;

// Optional custom style published from Mapbox Studio.
// When absent, the app falls back to an inline style that keeps the
// cartography focused on water, boundaries, and place labels.
export const MAPBOX_STYLE_URL = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL || '';

export const MAPBOX_COMPOSITE_SOURCE = 'mapbox://mapbox.mapbox-streets-v8';
const MAPBOX_GLYPHS = 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf';

export const MAPBOX_FALLBACK_STYLE_JSON = JSON.stringify({
  version: 8,
  name: 'AMARI Natural Earth Dark',
  glyphs: MAPBOX_GLYPHS,
  sources: {
    composite: {
      type: 'vector',
      url: MAPBOX_COMPOSITE_SOURCE,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#1A1A1A',
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'composite',
      'source-layer': 'water',
      paint: {
        'fill-color': '#141414',
        'fill-opacity': 1,
      },
    },
    {
      id: 'landuse',
      type: 'fill',
      source: 'composite',
      'source-layer': 'landuse',
      paint: {
        'fill-color': '#1E1E1E',
        'fill-opacity': 0.18,
      },
    },
    {
      id: 'country-borders',
      type: 'line',
      source: 'composite',
      'source-layer': 'admin',
      filter: [
        'all',
        ['==', ['get', 'maritime'], 0],
        ['any', ['==', ['get', 'admin_level'], 2], ['==', ['get', 'admin_level'], '2']],
      ],
      paint: {
        'line-color': '#722F37',
        'line-opacity': 0.35,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          0.45,
          8,
          1,
        ],
      },
    },
    {
      id: 'state-borders',
      type: 'line',
      source: 'composite',
      'source-layer': 'admin',
      filter: [
        'all',
        ['==', ['get', 'maritime'], 0],
        [
          'any',
          ['==', ['get', 'admin_level'], 3],
          ['==', ['get', 'admin_level'], 4],
          ['==', ['get', 'admin_level'], '3'],
          ['==', ['get', 'admin_level'], '4'],
        ],
      ],
      paint: {
        'line-color': '#FFFFFF',
        'line-opacity': 0.06,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          2,
          0.25,
          8,
          0.75,
        ],
      },
    },
    {
      id: 'country-labels',
      type: 'symbol',
      source: 'composite',
      'source-layer': 'place_label',
      minzoom: 0,
      maxzoom: 6.5,
      filter: ['==', ['get', 'class'], 'country'],
      layout: {
        'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          11,
          3,
          14,
          5,
          18,
        ],
        'text-letter-spacing': 0.14,
      },
      paint: {
        'text-color': '#D7BE85',
        'text-opacity': 0.9,
        'text-halo-color': '#1A1A1A',
        'text-halo-width': 1.1,
      },
    },
    {
      id: 'state-labels',
      type: 'symbol',
      source: 'composite',
      'source-layer': 'place_label',
      minzoom: 3.5,
      maxzoom: 8.1,
      filter: [
        'any',
        ['==', ['get', 'class'], 'state'],
        ['==', ['get', 'class'], 'province'],
      ],
      layout: {
        'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          3.5,
          9,
          8,
          11.5,
        ],
        'text-letter-spacing': 0.08,
      },
      paint: {
        'text-color': '#666666',
        'text-opacity': 0.92,
        'text-halo-color': '#1A1A1A',
        'text-halo-width': 1,
      },
    },
    {
      id: 'city-labels',
      type: 'symbol',
      source: 'composite',
      'source-layer': 'place_label',
      minzoom: 5,
      maxzoom: 8.1,
      filter: [
        'any',
        ['==', ['get', 'class'], 'city'],
        ['==', ['get', 'class'], 'town'],
      ],
      layout: {
        'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5,
          10,
          8,
          12,
        ],
      },
      paint: {
        'text-color': '#555555',
        'text-opacity': 0.92,
        'text-halo-color': '#1A1A1A',
        'text-halo-width': 0.85,
      },
    },
  ],
});

export function getMapboxStyleProps(): { styleJSON: string } | { styleURL: string } {
  if (MAPBOX_STYLE_URL) {
    return { styleURL: MAPBOX_STYLE_URL };
  }

  return { styleJSON: MAPBOX_FALLBACK_STYLE_JSON };
}

// Map constraints per privacy rubric
export const MAP_CONFIG = {
  maxZoomLevel: 8,
  minZoomLevel: 0,
  defaultCenter: [133.7751, -25.2744] as [number, number], // Australia center
  defaultZoom: 3,
  clusterRadius: 50,
  clusterMaxZoom: 8,
} as const;

export const MAP_REGIONS = {
  au: {
    label: 'AU',
    center: [133.77, -25.27] as [number, number],
    zoom: 3,
  },
  africa: {
    label: 'Africa',
    center: [20.0, 5.0] as [number, number],
    zoom: 2.5,
  },
  uk: {
    label: 'UK',
    center: [-3.5, 54.5] as [number, number],
    zoom: 4.5,
  },
} as const;

// Zoom tier boundaries for data fetching
export const ZOOM_TIERS = {
  COUNTRY: { min: 0, max: 4 },   // Server-side country aggregation
  STATE: { min: 5, max: 6 },     // Server-side state aggregation
  PROJECT: { min: 7, max: 8 },   // Client-side individual projects
} as const;

// Category colors for pin accents
export const CATEGORY_COLORS: Record<string, { accent: string; label: string }> = {
  venture:  { accent: '#C9A962', label: 'Venture' },
  advisory: { accent: '#722F37', label: 'Advisory' },
  creative: { accent: '#C9A962', label: 'Creative' },
  impact:   { accent: '#722F37', label: 'Impact' },
  culture:  { accent: '#C9A962', label: 'Culture' },
  health:   { accent: '#722F37', label: 'Health' },
  tech:     { accent: '#C9A962', label: 'Tech' },
};

// Initialize Mapbox
export function initMapbox() {
  if (MAPBOX_PUBLIC_TOKEN) {
    Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);
  }
}
