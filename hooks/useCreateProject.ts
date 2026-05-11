import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import type { ProjectCategory } from '../types/database';

interface CreateProjectInput {
  name: string;
  description: string;
  category: ProjectCategory;
  regionId: string;
  imageUri: string | null;
  externalLink: string | null;
}

export function useCreateProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const pickImage = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0].uri;
  };

  const createProject = async (input: CreateProjectInput): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      const { data: sourceRegion, error: sourceRegionError } = await supabase
        .from('region_centroids')
        .select('id, country_code, state_province, geo_level')
        .eq('id', input.regionId)
        .single();

      if (sourceRegionError || !sourceRegion) {
        throw sourceRegionError ?? new Error('Region not found.');
      }

      let regionId = input.regionId;

      // Australia is always stored at state level, even if an outdated city row is submitted.
      if (sourceRegion.country_code === 'AU' && sourceRegion.geo_level === 'city' && sourceRegion.state_province) {
        const { data: stateRegion, error: stateRegionError } = await supabase
          .from('region_centroids')
          .select('id')
          .eq('country_code', 'AU')
          .eq('state_province', sourceRegion.state_province)
          .eq('geo_level', 'state')
          .maybeSingle();

        if (stateRegionError) {
          throw stateRegionError;
        }

        if (stateRegion?.id) {
          regionId = stateRegion.id;
        }
      }

      let imagePath: string | null = null;
      let imageUrl: string | null = null;

      // Upload image if provided
      if (input.imageUri) {
        const timestamp = Date.now();
        const filePath = `project-images/${user.id}/${timestamp}.jpg`;

        const response = await fetch(input.imageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (!uploadError) {
          imagePath = filePath;
          const { data: urlData } = supabase.storage
            .from('public')
            .getPublicUrl(filePath);
          imageUrl = urlData.publicUrl;
        }
      }

      // Validate external link
      let externalLink = input.externalLink?.trim() || null;
      if (externalLink && !externalLink.startsWith('http')) {
        externalLink = `https://${externalLink}`;
      }

      // Insert project with pending status
      const { error } = await supabase.from('projects').insert({
        creator_id: user.id,
        name: input.name.trim(),
        description: input.description.trim(),
        category: input.category,
        region_id: regionId,
        image_url: imageUrl,
        image_path: imagePath,
        external_link: externalLink,
        status: 'pending',
      });

      if (error) throw error;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['map'] });
      queryClient.invalidateQueries({ queryKey: ['project-bookmarks'] });

      return true;
    } catch (err) {
      console.error('Failed to create project:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { pickImage, createProject, loading };
}
