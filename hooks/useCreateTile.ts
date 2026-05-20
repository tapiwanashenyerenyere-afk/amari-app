import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

interface CreateTileInput {
  type: 'project' | 'interest';
  description: string;
  tags: string[];
  visibilityTiers: Array<'member' | 'silver' | 'platinum' | 'laureate'>;
  contactEnabled?: boolean;
  imageUri?: string | null;
  location?: string | null;
}

interface CreateTileResult {
  success: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected' | null;
}

export function useCreateTile() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  /**
   * Launch image picker — returns the local URI or null
   */
  const pickImage = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need access to your photos to upload a tile image.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return null;
    }

    return result.assets[0].uri;
  };

  /**
   * Upload image to Supabase Storage, returns the storage path (not URL)
   */
  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}.jpg`;
      const filePath = `aligned-tiles/${user!.id}/${fileName}`;

      // Read file as base64 and upload
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const { error } = await supabase.storage
        .from('uploads')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      return filePath;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    }
  };

  /**
   * Create a tile — upload image if provided, then insert row
   */
  const createTile = async (input: CreateTileInput): Promise<CreateTileResult> => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to create a tile.');
      return { success: false, moderationStatus: null };
    }

    if (!input.description.trim()) {
      Alert.alert('Missing info', 'Please add a description for your tile.');
      return { success: false, moderationStatus: null };
    }

    if (!input.visibilityTiers.length) {
      Alert.alert('Missing audience', 'Choose at least one membership level that can view this tile.');
      return { success: false, moderationStatus: null };
    }

    setLoading(true);

    try {
      let imagePath: string | null = null;

      if (input.imageUri) {
        imagePath = await uploadImage(input.imageUri);
        if (!imagePath) {
          Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
          return { success: false, moderationStatus: null };
        }
      }

      const { data, error } = await (supabase as any).from('aligned_tiles').insert({
        user_id: user!.id,
        type: input.type,
        description: input.description.trim(),
        tags: input.tags,
        location: input.location?.trim() || null,
        visibility_tiers: input.visibilityTiers,
        contact_enabled: input.type === 'project' && input.contactEnabled === true,
        image_url: null,
        image_path: imagePath,
        is_active: true,
      }).select('id, moderation_status').single();

      if (error) {
        console.error('Insert error:', error);
        // Clean up uploaded file if DB insert fails
        if (imagePath) {
          await supabase.storage.from('uploads').remove([imagePath]);
        }
        Alert.alert('Error', 'Could not create tile. Please try again.');
        return { success: false, moderationStatus: null };
      }

      return {
        success: true,
        moderationStatus: (data?.moderation_status as CreateTileResult['moderationStatus']) ?? 'approved',
      };
    } catch (err) {
      console.error('Create tile failed:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return { success: false, moderationStatus: null };
    } finally {
      setLoading(false);
    }
  };

  return { pickImage, createTile, loading };
}
