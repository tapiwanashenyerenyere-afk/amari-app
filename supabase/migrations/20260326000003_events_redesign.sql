ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS dress_code text,
  ADD COLUMN IF NOT EXISTS registration_url text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'event_type'
      AND e.enumlabel IN ('vibes', 'talk')
  ) THEN
    ALTER TYPE public.event_type RENAME TO event_type_old;

    CREATE TYPE public.event_type AS ENUM (
      'gala',
      'networking',
      'dinner',
      'lifestyle',
      'collaboration'
    );

    ALTER TABLE public.events
      ALTER COLUMN type TYPE public.event_type
      USING (
        CASE type::text
          WHEN 'vibes' THEN 'lifestyle'
          WHEN 'talk' THEN 'networking'
          ELSE type::text
        END
      )::public.event_type;

    DROP TYPE public.event_type_old;
  END IF;
END $$;

UPDATE public.events
SET dress_code = CASE type::text
  WHEN 'gala' THEN 'Black Tie'
  WHEN 'networking' THEN 'Smart Casual'
  WHEN 'dinner' THEN 'Elevated Dining'
  WHEN 'lifestyle' THEN 'Elevated Casual'
  WHEN 'collaboration' THEN 'Business Formal'
  ELSE dress_code
END
WHERE dress_code IS NULL;

UPDATE public.events
SET registration_url = CASE
  WHEN registration_url IS NOT NULL AND registration_url <> '' THEN registration_url
  WHEN eventbrite_id IS NULL OR eventbrite_id = '' THEN NULL
  WHEN eventbrite_id ~ '^https?://' THEN eventbrite_id
  ELSE 'https://www.eventbrite.com/e/' || eventbrite_id
END
WHERE registration_url IS NULL;
