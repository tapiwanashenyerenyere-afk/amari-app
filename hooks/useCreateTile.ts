import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';

interface CreateTileInput {
  type: 'project' | 'interest';
  description: string;
  tags: string[];
  imageUri?: string | null;
}

export function useCreateTile() {
  const [loading, setLoading] = useState(false);
  const member = useAuthStore((s) => s.member);

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
   * Upload image to Supabase Storage, returns public URL
   */
  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const fileName = `${member?.id || 'anon'}-${Date.now()}.jpg`;
      const filePath = `aligned-tiles/${fileName}`;

      // Read file as blob
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('uploads')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('uploads').getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    }
  };

  /**
   * Create a tile — upload image if provided, then insert row
   */
  const createTile = async (input: CreateTileInput): Promise<boolean> => {
    if (!member?.id) {
      Alert.alert('Error', 'You must be signed in to create a tile.');
      return false;
    }

    if (!input.description.trim()) {
      Alert.alert('Missing info', 'Please add a description for your tile.');
      return false;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (input.imageUri) {
        imageUrl = await uploadImage(input.imageUri);
      }

      const { error } = await supabase.from('aligned_tiles').insert({
        user_id: member.id,
        type: input.type,
        description: input.description.trim(),
        tags: input.tags,
        image_url: imageUrl,
        is_active: true,
      });

      if (error) {
        console.error('Insert error:', error);
        Alert.alert('Error', 'Could not create tile. Please try again.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Create tile failed:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { pickImage, createTile, loading };
}
