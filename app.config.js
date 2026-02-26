/**
 * AMARI Mobile App Configuration — V2 (Supabase)
 *
 * Environment variables:
 *   EXPO_PUBLIC_SUPABASE_URL — Supabase project URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key
 */

export default ({ config }) => {
  return {
    ...config,
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || '651e1611-72e6-4b4c-a804-08b40a6aa92e',
      },
    },
  };
};
