-- Skills, interests, project on members
ALTER TABLE members ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE members ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE members ADD COLUMN IF NOT EXISTS current_project text;

-- Corridor interests tracking
CREATE TABLE IF NOT EXISTS corridor_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) NOT NULL,
  opportunity_id INTEGER REFERENCES corridor_opportunities(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'declined')),
  expressed_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(member_id, opportunity_id)
);

-- RLS for corridor_interests
ALTER TABLE corridor_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own interests" ON corridor_interests
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Members can insert own interests" ON corridor_interests
  FOR INSERT WITH CHECK (auth.uid() = member_id);

-- Aligned tiles table (if not exists)
CREATE TABLE IF NOT EXISTS aligned_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES members(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('project', 'interest')),
  description TEXT NOT NULL,
  image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE aligned_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own tiles" ON aligned_tiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read active tiles" ON aligned_tiles
  FOR SELECT USING (is_active = true);

-- Aligned interests (expressions of interest)
CREATE TABLE IF NOT EXISTS aligned_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES members(id) NOT NULL,
  to_tile_id UUID REFERENCES aligned_tiles(id) NOT NULL,
  expressed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user_id, to_tile_id)
);

ALTER TABLE aligned_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interests" ON aligned_interests
  FOR ALL USING (auth.uid() = from_user_id);

-- Aligned skips
CREATE TABLE IF NOT EXISTS aligned_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES members(id) NOT NULL,
  tile_id UUID REFERENCES aligned_tiles(id) NOT NULL,
  skipped_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tile_id)
);

ALTER TABLE aligned_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own skips" ON aligned_skips
  FOR ALL USING (auth.uid() = user_id);

-- Connections (mutual matches)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES members(id) NOT NULL,
  user_b UUID REFERENCES members(id) NOT NULL,
  matched_via TEXT NOT NULL CHECK (matched_via IN ('project', 'interest')),
  tile_a_id UUID REFERENCES aligned_tiles(id),
  tile_b_id UUID REFERENCES aligned_tiles(id),
  status TEXT DEFAULT 'mutual' CHECK (status IN ('mutual', 'archived')),
  connected_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Display ID generation function
CREATE OR REPLACE FUNCTION generate_display_id()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := EXTRACT(YEAR FROM now())::TEXT;
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(display_id, '-', 3) AS INTEGER)
  ), 0) + 1 INTO seq_num
  FROM members
  WHERE display_id LIKE 'AMARI-' || year_str || '-%';

  NEW.display_id := 'AMARI-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto display_id (only if not already set)
DROP TRIGGER IF EXISTS set_display_id ON members;
CREATE TRIGGER set_display_id
  BEFORE INSERT ON members
  FOR EACH ROW
  WHEN (NEW.display_id IS NULL OR NEW.display_id = '')
  EXECUTE FUNCTION generate_display_id();
