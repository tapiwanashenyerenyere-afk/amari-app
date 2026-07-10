import { z } from 'zod';

/**
 * Shared zod schemas for high-value client input boundaries.
 *
 * Keep these aligned with the corresponding DB/RPC contracts in
 * `types/database.ts`. Each schema is meant to be `.safeParse()`d right
 * before the payload leaves the device (network call, RPC, insert), so
 * bad input is caught with a clean, user-facing error instead of a raw
 * Supabase/Postgres failure or a silently corrupted row.
 */

// ── Project creation (app/(tabs)/aligned/create.tsx → hooks/useCreateProject.ts) ──

const PROJECT_CATEGORIES = [
  'venture',
  'advisory',
  'creative',
  'impact',
  'culture',
  'health',
  'tech',
] as const;

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give your work a name.')
    .max(60, 'Name must be 60 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(1, 'Describe the work in one strong sentence.')
    .max(100, 'Description must be 100 characters or fewer.'),
  category: z.enum(PROJECT_CATEGORIES, {
    message: 'Select a category for your work.',
  }),
  regionId: z.string().trim().min(1, 'Select the region where this work is based.'),
  imageUri: z.string().trim().min(1).nullable(),
  externalLink: z
    .string()
    .trim()
    .max(2048, 'Link is too long.')
    .refine(
      (value) => {
        if (!value) return true;
        const candidate = value.startsWith('http://') || value.startsWith('https://')
          ? value
          : `https://${value}`;
        try {
          const url = new URL(candidate);
          return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Enter a valid link (e.g. https://example.com).' },
    )
    .nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ── Registration (app/(auth)/register.tsx) ──

export const registerEmailAuthSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Please enter your email.')
    .email('Enter a valid email address.'),
  fullName: z
    .string()
    .trim()
    .min(1, 'Please enter your name.')
    .max(120, 'Name is too long.'),
  city: z.string().trim().max(120, 'City is too long.'),
  industry: z.string().trim().max(120, 'Industry is too long.'),
  currentProject: z.string().trim().max(280, 'Keep this to a couple of sentences.'),
  skills: z.array(z.string()).max(32),
  interests: z.array(z.string()).max(32),
});

export type RegisterEmailAuthInput = z.infer<typeof registerEmailAuthSchema>;
