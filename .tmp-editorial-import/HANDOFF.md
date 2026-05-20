# AMARI Editorial Integration Handoff

## What This Is

Four inaugural editorial stories for the AMARI app, plus a fifth on Jamal Elsheikh, structured as typed data with React Native components and a Supabase migration ready to run.

## File Map

```
amari-editorial/
  types/
    editorial.ts          → TypeScript types (EditorialStory, EditorialCategory, etc.)
  data/
    editorial-stories.ts  → All four stories as structured data (local-first)
  components/
    EditorialCard.tsx     → Feed card component (featured + compact variants)
  screens/
    EditorialFeedScreen.tsx   → Feed with category filter pills
    EditorialDetailScreen.tsx → Full story view with sources
  supabase/
    migration-editorial-stories.sql → Table, RLS, indexes, seed data
```

## Integration Steps

### Step 1: Copy Types
Copy `types/editorial.ts` into the app's existing types directory.

### Step 2: Copy Data
Copy `data/editorial-stories.ts` into the app's data directory. This gives you local data immediately while the Supabase table is set up.

### Step 3: Add Components
Copy `EditorialCard.tsx` into the components directory. It uses the existing AMARI design system fonts and colours:
- Syne_700Bold (headlines)
- EBGaramond_400Regular (body text on detail screen)
- DMSans_400Regular / DMSans_500Medium (UI text)
- Colours: cream #f8f6f3, charcoal #1a1a1a, burgundy #722F37, gold #C9A962

### Step 4: Add Screens
Copy both screen files. Wire them into your navigation:
- `EditorialFeedScreen` goes wherever the news/intelligence section lives
- `EditorialDetailScreen` opens when a card is pressed

### Step 5: Add Images
All images are pre-processed with the AMARI editorial grade and located in `assets/images/`:
- `01-semra_hero.jpg` + `01-semra_thumb.jpg` — Credit: AMARI Group
- `02-mj-musical_hero.jpg` + `02-mj-musical_thumb.jpg` — Credit: Daniel Boud / MJ the Musical Australia
- `03-pasa-faho_hero.jpg` + `03-pasa-faho_thumb.jpg` — Credit: John M. Tubera / Courtesy of Ivy Mutuku and Mimo Mukii
- `05-jamal_hero.jpg` + `05-jamal_thumb.jpg` — Credit: Courtesy of Reflect Forward
- **Zivai Matipano (Story 04):** Image pending. Awaiting portrait from Zivai or permission from 101 Collins Street.

Hero images are 1920x1080 (16:9). Thumbnails are 800x800 (1:1). All have the same colour grade applied.

For local development, the data file uses `require()` to reference assets directly. When moving to Supabase, upload images to Supabase storage and update the `image_uri` values in the `editorial_stories` table.

### Step 6: Run Supabase Migration (when ready)
Run `supabase/migration-editorial-stories.sql` in the Supabase SQL editor. This creates:
- `editorial_stories` table with array paragraphs, JSONB sources, category indexing
- RLS: authenticated members can read, service role can write
- Auto-updating `updated_at` trigger
- All four stories seeded with `NULL` image URIs (update after uploading images to Supabase storage)

Replace `NULL` image_uri values with Supabase storage URLs after uploading.

### Step 7: Swap Local Data for Supabase Fetch (optional)
Once the migration is live, replace the local import in EditorialFeedScreen:

```typescript
// Replace this:
import { EDITORIAL_STORIES } from '../data/editorial-stories';

// With a Supabase query:
const { data: stories } = await supabase
  .from('editorial_stories')
  .select('*')
  .order('published_at', { ascending: false });
```

## Design Notes

- Category tags use burgundy (#722F37) at 11px with 1.8 letter spacing
- Headlines use Syne Bold, body uses EB Garamond on the detail screen
- AMARI connection badge uses a gold dot + gold text, only appears when `amariConnection` is not null
- Featured card variant shows the image, compact variant does not
- Filter pills use charcoal fill when active, light grey border when inactive
- Sources render as tappable rows with an arrow icon, opening in external browser
- No em dashes anywhere in the content
- Image credits render at 10px in mid grey below the image

## Categories Currently in Use

| Category | Short Label (Filter Pill) |
|----------|--------------------------|
| PUBLIC POLICY & GOVERNMENT | Policy |
| CULTURE | Culture |
| FILM | Film |
| BUSINESS & LEADERSHIP | Business |

## Categories Available for Future Use

| Category | Short Label |
|----------|-------------|
| TECHNOLOGY | Tech |
| GLOBAL | Global |
| OPPORTUNITY | Opportunity |

Add new categories to the `EditorialCategory` type and the `CATEGORIES` array in EditorialFeedScreen.
