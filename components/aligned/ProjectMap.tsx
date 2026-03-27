import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Haptics from 'expo-haptics';
import { Plus, X, ZoomIn, ZoomOut } from 'lucide-react-native';
import { colors, radius, typography } from '../../lib/theme';
import {
  CATEGORY_COLORS,
  HAS_MAPBOX_TOKEN,
  MAP_CONFIG,
  MAP_REGIONS,
  getMapboxStyleProps,
} from '../../lib/mapbox';
import { useMapData } from '../../hooks/useMapData';
import { type ViewportBounds, useMapViewport } from '../../hooks/useMapViewport';
import type { MapProject, ProjectCategory } from '../../types/database';

export type MapRegionKey = keyof typeof MAP_REGIONS;

interface ProjectMapProps {
  activeRegion: MapRegionKey;
  categoryFilter?: ProjectCategory | null;
  expanded?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  onProjectSelect?: (project: MapProject) => void;
  onRegionChange: (region: MapRegionKey) => void;
  onRequestCreate?: () => void;
  onViewportChange?: (meta: { zoom: number; bounds: ViewportBounds | null }) => void;
}

export function ProjectMap({
  activeRegion,
  categoryFilter = null,
  expanded = false,
  onCollapse,
  onExpand,
  onProjectSelect,
  onRegionChange,
  onRequestCreate,
  onViewportChange,
}: ProjectMapProps) {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const { bounds, onMapIdle, zoom } = useMapViewport();
  const { tier, countries, states, projects, isLoading } = useMapData(zoom, bounds, categoryFilter ?? undefined);
  const mapStyleProps = useMemo(() => getMapboxStyleProps(), []);

  useEffect(() => {
    onViewportChange?.({ zoom, bounds });
  }, [bounds, onViewportChange, zoom]);

  useEffect(() => {
    const region = MAP_REGIONS[activeRegion];
    cameraRef.current?.setCamera({
      centerCoordinate: region.center,
      zoomLevel: region.zoom,
      animationDuration: 650,
    });
  }, [activeRegion]);

  const features = useMemo(() => {
    const items: GeoJSON.Feature<GeoJSON.Point>[] = [];

    if (tier === 'country' && countries.data) {
      countries.data.forEach((country) => {
        items.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [country.lng, country.lat],
          },
          properties: {
            label: country.country_name,
            count: country.project_count,
            type: 'cluster',
          },
        });
      });
    }

    if (tier === 'state' && states.data) {
      states.data.forEach((state) => {
        items.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [state.lng, state.lat],
          },
          properties: {
            label: state.display_label,
            count: state.project_count,
            type: 'cluster',
          },
        });
      });
    }

    if (tier === 'project' && projects.data) {
      projects.data.forEach((project) => {
        items.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [project.lng, project.lat],
          },
          properties: {
            ...project,
            type: 'project',
            accent: CATEGORY_COLORS[project.category]?.accent ?? colors.gold,
          },
        });
      });
    }

    return {
      type: 'FeatureCollection' as const,
      features: items,
    };
  }, [countries.data, projects.data, states.data, tier]);

  const handleClusterPress = useCallback(
    (project: GeoJSON.Feature<GeoJSON.Point>) => {
      const [lng, lat] = project.geometry.coordinates;
      const nextZoom = zoom < 4 ? 5 : zoom < 6 ? 7 : Math.min(zoom + 0.75, MAP_CONFIG.maxZoomLevel);

      cameraRef.current?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: nextZoom,
        animationDuration: 550,
      });
    },
    [zoom],
  );

  const adjustZoom = useCallback(
    (delta: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      cameraRef.current?.setCamera({
        zoomLevel: Math.max(MAP_CONFIG.minZoomLevel, Math.min(MAP_CONFIG.maxZoomLevel, zoom + delta)),
        animationDuration: 220,
      });
    },
    [zoom],
  );

  return (
    <View style={[styles.shell, expanded ? styles.shellExpanded : null]}>
      <Mapbox.MapView
        style={styles.map}
        attributionEnabled={false}
        compassEnabled={false}
        localizeLabels={{ locale: 'current' }}
        logoEnabled={false}
        onMapIdle={onMapIdle}
        onPress={() => {
          if (!expanded) {
            onExpand?.();
          }
        }}
        pitchEnabled={false}
        requestDisallowInterceptTouchEvent
        rotateEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled
        zoomEnabled
        {...mapStyleProps}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: MAP_REGIONS[activeRegion].center,
            zoomLevel: MAP_REGIONS[activeRegion].zoom,
          }}
          maxZoomLevel={MAP_CONFIG.maxZoomLevel}
          minZoomLevel={MAP_CONFIG.minZoomLevel}
        />

        <Mapbox.ShapeSource
          id="aligned-map-data"
          cluster={tier === 'project'}
          clusterMaxZoomLevel={MAP_CONFIG.clusterMaxZoom}
          clusterRadius={MAP_CONFIG.clusterRadius}
          onPress={(event) => {
            const feature = event.features?.[0];
            if (!feature || feature.geometry.type !== 'Point') {
              return;
            }

            const properties = feature.properties as Record<string, unknown> | undefined;
            if (!properties) {
              return;
            }

            if (properties.type === 'cluster' || properties.cluster) {
              handleClusterPress(feature as GeoJSON.Feature<GeoJSON.Point>);
              return;
            }

            if (properties.type === 'project') {
              onProjectSelect?.({
                category: String(properties.category) as MapProject['category'],
                creator_first_name: String(properties.creator_first_name ?? 'Member'),
                description: String(properties.description ?? ''),
                display_label: String(properties.display_label ?? ''),
                external_link: typeof properties.external_link === 'string' ? properties.external_link : null,
                image_url: typeof properties.image_url === 'string' ? properties.image_url : null,
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0],
                name: String(properties.name ?? ''),
                project_id: String(properties.project_id ?? ''),
              });
            }
          }}
          shape={features}
        >
          <Mapbox.CircleLayer
            id="aligned-cluster-circles"
            filter={['any', ['==', ['get', 'type'], 'cluster'], ['has', 'point_count']]}
            style={{
              circleColor: colors.cardBase,
              circleRadius: [
                'interpolate',
                ['linear'],
                ['coalesce', ['get', 'count'], ['get', 'point_count'], 1],
                1, 18,
                10, 24,
                50, 32,
                100, 40,
              ],
              circleStrokeColor: '#C9A962',
              circleStrokeOpacity: 0.7,
              circleStrokeWidth: 2,
            }}
          />

          <Mapbox.SymbolLayer
            id="aligned-cluster-count"
            filter={['any', ['==', ['get', 'type'], 'cluster'], ['has', 'point_count']]}
            style={{
              textAllowOverlap: true,
              textColor: '#C9A962',
              textField: ['to-string', ['coalesce', ['get', 'count'], ['get', 'point_count']]],
              textFont: ['DIN Pro Medium'],
              textSize: 12,
            }}
          />

          <Mapbox.CircleLayer
            id="aligned-project-pin-glow"
            filter={['all', ['==', ['get', 'type'], 'project'], ['!', ['has', 'point_count']]]}
            style={{
              circleColor: ['get', 'accent'],
              circleOpacity: 0.16,
              circleRadius: 14,
            }}
          />

          <Mapbox.CircleLayer
            id="aligned-project-pins"
            filter={['all', ['==', ['get', 'type'], 'project'], ['!', ['has', 'point_count']]]}
            style={{
              circleColor: colors.cardBase,
              circleRadius: 7,
              circleStrokeColor: ['get', 'accent'],
              circleStrokeWidth: 2.5,
            }}
          />

          <Mapbox.CircleLayer
            id="aligned-project-pin-core"
            filter={['all', ['==', ['get', 'type'], 'project'], ['!', ['has', 'point_count']]]}
            style={{
              circleColor: ['get', 'accent'],
              circleRadius: 2.2,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      <View style={styles.surfaceTint} pointerEvents="none" />

      <View style={styles.topLeftControls}>
        <View style={styles.regionRow}>
          {(Object.keys(MAP_REGIONS) as MapRegionKey[]).map((regionKey) => {
            const region = MAP_REGIONS[regionKey];
            const isActive = regionKey === activeRegion;

            return (
              <Pressable
                key={regionKey}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onRegionChange(regionKey);
                }}
                style={[styles.regionChip, isActive ? styles.regionChipActive : null]}
              >
                <Text style={[styles.regionChipText, isActive ? styles.regionChipTextActive : null]}>
                  {region.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {expanded ? (
          <Pressable onPress={onCollapse} style={styles.closeButton} accessibilityLabel="Close fullscreen map">
            <X color={colors.white} size={18} strokeWidth={1.8} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.zoomControls}>
        <Pressable onPress={() => adjustZoom(0.8)} style={styles.roundButton} accessibilityLabel="Zoom in">
          <ZoomIn color={colors.white} size={18} strokeWidth={1.9} />
        </Pressable>
        <Pressable onPress={() => adjustZoom(-0.8)} style={styles.roundButton} accessibilityLabel="Zoom out">
          <ZoomOut color={colors.white} size={18} strokeWidth={1.9} />
        </Pressable>
      </View>

      <View style={styles.bottomOverlay} pointerEvents="box-none">
        {!expanded ? <Text style={styles.expandHint}>Tap map to expand</Text> : null}

        <Pressable onPress={onRequestCreate} style={styles.addButton} accessibilityLabel="Add a project">
          <Plus color={colors.white} size={20} strokeWidth={2.2} />
        </Pressable>
      </View>

      {!HAS_MAPBOX_TOKEN ? (
        <View style={styles.messageBadge} pointerEvents="none">
          <Text style={styles.messageTitle}>Map token needed</Text>
          <Text style={styles.messageText}>Add `EXPO_PUBLIC_MAPBOX_TOKEN` to preview the live map.</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingBadge} pointerEvents="none">
          <Text style={styles.loadingText}>Refreshing map</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: '#141414',
    minHeight: 340,
  },
  shellExpanded: {
    borderRadius: 0,
    minHeight: 420,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  surfaceTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,12,12,0.10)',
  },
  topLeftControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  regionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    maxWidth: '82%',
  },
  regionChip: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: radius.full,
    backgroundColor: 'rgba(12,12,12,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
  },
  regionChipActive: {
    backgroundColor: 'rgba(201,169,98,0.92)',
    borderColor: 'rgba(201,169,98,0.92)',
  },
  regionChipText: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.82)',
    textTransform: 'uppercase',
  },
  regionChipTextActive: {
    color: colors.black,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(12,12,12,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 10,
  },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(12,12,12,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  expandHint: {
    fontFamily: typography.mono.regular,
    fontSize: 10,
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  messageBadge: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(12,12,12,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.24)',
  },
  messageTitle: {
    fontFamily: typography.geo.medium,
    fontSize: 12,
    color: colors.white,
  },
  messageText: {
    marginTop: 4,
    fontFamily: typography.body.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  loadingBadge: {
    position: 'absolute',
    top: 76,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(12,12,12,0.78)',
  },
  loadingText: {
    fontFamily: typography.mono.regular,
    fontSize: 9,
    letterSpacing: 1.1,
    color: '#C9A962',
    textTransform: 'uppercase',
  },
});
