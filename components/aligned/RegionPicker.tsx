import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { colors, typography, spacing, radius } from '../../lib/theme';
import type { RegionCentroid } from '../../types/database';

interface RegionPickerProps {
  selectedRegion: RegionCentroid | null;
  onSelect: (region: RegionCentroid) => void;
}

export function RegionPicker({ selectedRegion, onSelect }: RegionPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('region_centroids')
        .select('id, country_code, country_name, state_province, city_name, population, display_label, geo_level')
        .order('population', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as RegionCentroid[];
    },
    staleTime: 1000 * 60 * 60 * 24, // regions rarely change
  });

  const availableRegions = useMemo(
    () => regions.filter((region) => !(region.country_code === 'AU' && region.geo_level === 'city')),
    [regions],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return availableRegions;
    const q = search.toLowerCase();
    return availableRegions.filter(
      (r) =>
        r.display_label.toLowerCase().includes(q) ||
        r.country_name.toLowerCase().includes(q) ||
        r.city_name?.toLowerCase().includes(q) ||
        r.state_province?.toLowerCase().includes(q),
    );
  }, [availableRegions, search]);

  // Group by geo_level for display
  const grouped = useMemo(() => {
    const states = filtered.filter((r) => r.geo_level === 'state');
    const cities = filtered.filter((r) => r.geo_level === 'city');
    const countries = filtered.filter((r) => r.geo_level === 'country');
    return [...states, ...cities, ...countries];
  }, [filtered]);

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={selectedRegion ? `Region: ${selectedRegion.display_label}` : 'Select region'}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedRegion && styles.triggerPlaceholder,
          ]}
        >
          {selectedRegion?.display_label ?? 'Select a region'}
        </Text>
        <Text style={styles.triggerChev}>{'\u203A'}</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Region</Text>
            <Pressable
              onPress={() => setOpen(false)}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search states, countries, and global cities..."
              placeholderTextColor={colors.grayLight}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>

          <Text style={styles.privacyNote}>
            Australia is shown at state level only. City-level regions remain available for approved international metros.
          </Text>

          <FlatList
            data={grouped}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedRegion?.id === item.id;
              return (
                <Pressable
                  style={[styles.regionRow, isSelected && styles.regionRowSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(item);
                    setOpen(false);
                    setSearch('');
                  }}
                  accessibilityRole="button"
                >
                  <View style={styles.regionInfo}>
                    <Text style={styles.regionLabel}>{item.display_label}</Text>
                    <Text style={styles.regionLevel}>
                      {item.geo_level === 'city'
                        ? 'City'
                        : item.geo_level === 'state'
                        ? 'State'
                        : 'Country'}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                </Pressable>
              );
            }}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No regions match your search.</Text>
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Trigger button
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  triggerText: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    color: colors.black,
  },
  triggerPlaceholder: {
    color: colors.grayLight,
  },
  triggerChev: {
    fontSize: 18,
    color: colors.gray,
  },

  // Modal
  modal: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontFamily: typography.serif.medium,
    fontSize: 22,
    color: colors.black,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.black,
  },
  closeBtnText: {
    fontFamily: typography.body.semiBold,
    fontSize: 13,
    color: colors.white,
  },

  // Search
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 10,
  },
  searchInput: {
    fontFamily: typography.body.regular,
    fontSize: 14,
    color: colors.black,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  privacyNote: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
    fontFamily: typography.body.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  regionRowSelected: {
    backgroundColor: 'rgba(196,162,101,0.06)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  regionInfo: {
    flex: 1,
  },
  regionLabel: {
    fontFamily: typography.body.medium,
    fontSize: 14,
    color: colors.black,
  },
  regionLevel: {
    fontFamily: typography.body.regular,
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: '#C9A962',
  },
  emptyText: {
    fontFamily: typography.body.regular,
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
