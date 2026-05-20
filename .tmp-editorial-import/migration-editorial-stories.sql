-- ============================================================
-- AMARI Editorial Content
-- Supabase Migration
-- ============================================================
-- Run this against your Supabase SQL editor
-- This creates the table, RLS policies, and seeds the four stories
-- ============================================================

-- 1. Create the editorial_stories table
CREATE TABLE IF NOT EXISTS public.editorial_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT[] NOT NULL, -- array of paragraphs
  image_uri TEXT,
  image_credit TEXT,
  image_alt TEXT,
  sources JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ NOT NULL,
  amari_connection TEXT, -- nullable, brief note on community link
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for feed queries
CREATE INDEX idx_editorial_published ON public.editorial_stories (published_at DESC);
CREATE INDEX idx_editorial_category ON public.editorial_stories (category);
CREATE INDEX idx_editorial_featured ON public.editorial_stories (featured) WHERE featured = true;

-- 3. RLS: members can read, only service role can insert/update
ALTER TABLE public.editorial_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read editorial stories"
  ON public.editorial_stories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage editorial stories"
  ON public.editorial_stories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_editorial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER editorial_stories_updated_at
  BEFORE UPDATE ON public.editorial_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_editorial_updated_at();

-- ============================================================
-- 5. Seed the four inaugural stories
-- ============================================================

INSERT INTO public.editorial_stories (
  slug,
  category,
  headline,
  body,
  image_uri,
  image_credit,
  image_alt,
  sources,
  published_at,
  amari_connection,
  featured
) VALUES

-- Story 01: Mohamed Semra
(
  'semra-mayor-maribyrnong',
  'PUBLIC POLICY & GOVERNMENT',
  'Mohamed Semra Elected Mayor of Maribyrnong',
  ARRAY[
    'AMARI Spotlight Award winner Mohamed Semra has been elected Mayor of the City of Maribyrnong for the 2025/26 term. Cr Samantha Meredith takes the Deputy Mayor role. Both were first elected to council in 2024.',
    E'Maribyrnong covers Footscray, Braybrook, Maidstone, Yarraville, Seddon, Kingsville and West Footscray. It is one of the most culturally dense municipalities in Melbourne\u2019s west and home to a significant concentration of African diaspora families.',
    E'Semra has named community safety, the revitalisation of Footscray, mental health and wellbeing supports, air quality, integrated transport, and flood recovery as priorities. The centrepiece is Creative West, a precinct project positioned as a generational investment in the city\u2019s creative, cultural and economic future.',
    'Council controls planning, grants, local safety infrastructure and community investment in these areas.'
  ],
  NULL, -- replace with Supabase storage URL after upload: 01-semra_hero.jpg
  'AMARI Group',
  'Mohamed Semra at the AMARI Gala',
  '[{"label": "City of Maribyrnong", "url": "https://www.maribyrnong.vic.gov.au/News/City-of-Maribyrnong-Welcomes-New-Mayor-and-Deputy-Mayor-for-202526"}]'::jsonb,
  '2025-11-19T00:00:00+11:00',
  'AMARI Spotlight Award winner',
  true
),

-- Story 02: MJ the Musical
(
  'mj-musical-australian-tour',
  'CULTURE',
  E'The Cast Behind MJ the Musical\u2019s Australian Tour',
  ARRAY[
    'MJ the Musical is midway through its Australian run with a cast worth paying attention to.',
    E'Ilario Grant leads as Michael Jackson in the Melbourne season at Her Majesty\u2019s Theatre. Liam Damons, based in Brisbane, plays the young adult MJ. The ensemble and company includes Beth Appiah Cain, Shewit Belay, Martha Berhane, Sebaga Neumann, Coby Njoroge, Tigist Strode, Albanus Terry Strickland II, Loredo Malcolm, Kalisha Johnson and Tavio Wright among others.',
    E'AMARI collaborator Effie Nkrumah is the Resident Director of the Australian production. Nkrumah is a Ghanaian-Australian director, writer and actor with an MA in Arts Politics from NYU\u2019s Tisch School of the Arts. Her body of work is built around challenging the single story of Africa through stories of continental Africans in diaspora. She has directed at Malthouse Theatre and La Mama, performed in the Australian cast of Harry Potter and the Cursed Child, and voiced Astra, the first Ghanaian agent in Valorant.',
    E'It is one of the largest assemblies of Black performing talent on an Australian stage. The production has been seen by over six million people worldwide, took four Tony Awards, and features over 25 of Jackson\u2019s catalogue performed live. Lynn Nottage, a two-time Pulitzer winner, wrote the book.',
    'Melbourne closes 13 March. Brisbane opens 27 March at QPAC. Perth follows in June at Crown Theatre.'
  ],
  NULL, -- replace with Supabase storage URL after upload: 02-mj-musical_hero.jpg
  'Daniel Boud / MJ the Musical Australia',
  'MJ the Musical Australian production',
  '[{"label": "MJ the Musical Australia", "url": "https://mjthemusical.com.au"}, {"label": "ABC News", "url": "https://www.abc.net.au/news/2025-05-13/behind-the-scenes-actors-playing-michael-jackson-mj-the-musical/105287006"}]'::jsonb,
  '2025-09-09T00:00:00+10:00',
  'AMARI collaborator Effie Nkrumah is Resident Director',
  true
),

-- Story 03: Pasa Faho
(
  'pasa-faho-sydney-opera-house',
  'FILM',
  E'Kalu Oji\u2019s Pasa Faho Screens at Sydney Opera House',
  ARRAY[
    'Pasa Faho, the debut feature written and directed by Igbo-Australian filmmaker Kalu Oji, opened its national tour at the Sydney Opera House on 21 January. Presented with Africa Film Fest Australia, screenings continue across the country through February.',
    'The film is produced by AMARI award winner Ivy Mutuku alongside Mimo Mukii.',
    'Set in Melbourne, it follows Azubuike, a shoe salesman navigating fatherhood and financial precarity after his 12-year-old son moves in with him. Okey Bakassi and Tyson Palmer lead the cast.',
    E'Oji\u2019s short film What\u2019s In A Name won the AFTRS Craft Award at the 2023 Sydney Film Festival and Best Direction at Flickerfest 2024. Pasa Faho premiered at the Melbourne International Film Festival, screened at the Chicago International Film Festival as part of a Black Perspectives programme co-founded by Spike Lee, and took Best International Film at the Africa International Film Festival. It also screened at CinefestOZ, Darwin International Film Festival, and Mparntwe Alice Springs International Film Festival.',
    'The film will also make its European premiere at the Dublin International Film Festival.',
    'The production credits read Vicscreen, Screen Australia, MIFF Premiere Fund, SBS. It will release on SBS On Demand later in 2026.'
  ],
  NULL, -- replace with Supabase storage URL after upload: 03-pasa-faho_hero.jpg
  'John M. Tubera / Courtesy of Ivy Mutuku and Mimo Mukii',
  'Still from Pasa Faho',
  '[{"label": "Sydney Opera House", "url": "https://www.sydneyoperahouse.com/cinema/pasa-faho"}, {"label": "FilmInk", "url": "https://www.filmink.com.au/public-notice/portrait-of-african-australian-life-pasa-faho-to-open-national-tour-on-21-january-at-sydney-opera-house/"}, {"label": "Mimo Mukii", "url": "https://mimomukii.com/pasa-faho-1"}]'::jsonb,
  '2026-01-21T00:00:00+11:00',
  'AMARI award winner Ivy Mutuku is producer',
  true
),

-- Story 04: Zivai Matipano
(
  'zivai-matipano-101-collins',
  'BUSINESS & LEADERSHIP',
  E'Zivai Matipano Named Among 101 Collins Street\u2019s Leading Ladies',
  ARRAY[
    E'Zivai Matipano has been recognised as one of the Leading Ladies of 2026 by 101 Collins Street as part of the building\u2019s International Women\u2019s Day programme.',
    '101 Collins is home to tenants including KPMG, Corrs Chambers Westgarth and Invesco. The programme invited peer nominations from across the building''s tenancies and recognised 21 women this year.',
    'Matipano was nominated for bringing fresh perspective and genuine energy to her team, leading by example, and championing connection, inclusivity and growth. The citation noted she encourages those around her to embrace their best selves.',
    'The programme included a video feature and individual profiles for each nominee.'
  ],
  NULL, -- no image yet, awaiting portrait from Zivai Matipano
  'Courtesy of Zivai Matipano / 101 Collins Street',
  'Zivai Matipano, 101 Collins Leading Ladies 2026',
  '[{"label": "101 Collins Street", "url": "https://101collins.com.au/iwd-2026"}]'::jsonb,
  '2026-03-08T00:00:00+11:00',
  NULL,
  false
),

-- Story 05: Jamal Elsheikh
(
  'jamal-elsheikh-reflect-forward-lari',
  'BUSINESS & LEADERSHIP',
  E'Jamal Elsheikh Brokers Anti-Racism Partnership Between Melbourne\u2019s A-League Rivals',
  ARRAY[
    E'AMARI advisory board member Jamal Elsheikh has negotiated a partnership that puts two direct commercial competitors in the same room. Melbourne Victory and Melbourne City have joined forces through Elsheikh\u2019s organisation Reflect Forward, backed by a Victorian Government grant, to deliver the Local Anti-Racism Initiatives (LARI) Program across the state.',
    E'The programme is structured to reach more than 10,000 young people through athlete-led workshops, football-based sessions in schools, community visits, and match-day activations. It builds on Reflect Forward\u2019s existing five-year partnership with Professional Footballers Australia, which began in 2021 and has already reached over 23,000 students across Victoria.',
    'What makes this notable from an organisational standpoint is the architecture. Elsheikh brought two rival A-League clubs into a shared programme with aligned delivery, joint resourcing, and co-branded match-day visibility. Both club captains wore Reflect Forward armbands at the Melbourne Derby. A joint screening of the ABC documentary End Game was held at AAMI Park with government, media and football industry representatives.',
    'Reflect Forward is now partnered across cricket, football, basketball, tennis, rugby league and netball at institutional level. Elsheikh holds an MBA from Monash University and is completing a Master of Studies in Social Innovation at Cambridge. He is a Churchill Fellow, an Australian of the Year finalist, and a World Economic Forum Global Shaper.',
    'The first Anti-Racism Symposium, co-hosted by Melbourne City, Melbourne Victory and Reflect Forward, is scheduled for AAMI Park in early 2026.'
  ],
  NULL, -- replace with Supabase storage URL after upload: 05-jamal_hero.jpg
  'Courtesy of Reflect Forward',
  'Jamal Elsheikh, Reflect Forward',
  '[{"label": "Professional Footballers Australia", "url": "https://pfa.net.au/news/a-league-rivals-unite-to-empower-victorian-communities-to-tackle-racism/"}, {"label": "Melbourne City FC", "url": "https://melbournecityfc.com.au/news/20251217-city-steps-up-anti-racism-action/"}]'::jsonb,
  '2025-12-17T00:00:00+11:00',
  'AMARI advisory board member',
  true
);
