-- Additive intelligence source and entity expansion, verified 17 Jul 2026.
-- Existing operational state is preserved; the canonical Google discovery
-- row receives a display-only provenance correction below.

begin;

insert into public.news_sources (name, home_url, feed_url, region, default_weight, active)
values
  ('Africa: The Big Deal', 'https://thebigdeal.substack.com', 'https://thebigdeal.substack.com/feed', 'africa', 1.25, true),
  ('Rest of World', 'https://restofworld.org', 'https://restofworld.org/feed/latest/', 'global', 1.15, true),
  ('The Africa Report', 'https://www.theafricareport.com', 'https://www.theafricareport.com/feed/', 'africa', 1.00, true),
  ('Africa Media Australia', 'https://africamediaaustralia.com.au', 'https://africamediaaustralia.com.au/feed/', 'australia', 1.20, true),
  ('Extend Ventures', 'https://extendventures.substack.com', 'https://extendventures.substack.com/feed', 'uk', 1.20, true),
  ('Blavity News', 'https://blavity.com', 'https://blavity.com/rss.xml', 'americas', 1.10, true),
  ('Travel Noire', 'https://travelnoire.com', 'https://travelnoire.com/rss.xml', 'americas', 1.10, true),
  ('Capital B', 'https://capitalbnews.org', 'https://capitalbnews.org/feed/', 'americas', 1.05, true),
  ('Andscape', 'https://andscape.com', 'https://andscape.com/feed/', 'americas', 1.00, true),
  ('Harlem Capital', 'https://harlem.capital', 'https://harlem.capital/feed/', 'americas', 1.05, true),
  ('The NATIVE', 'https://thenativemag.com', 'https://thenativemag.com/feed/', 'global', 1.20, true),
  ('Afrobeats Intelligence', 'https://afrobeatsintelligence.substack.com', 'https://afrobeatsintelligence.substack.com/feed', 'africa', 1.10, true),
  ('Rolling Stone Africa', 'https://rollingstoneafrica.com', 'https://rollingstoneafrica.com/feed/', 'africa', 1.05, true),
  ('NotJustOk', 'https://notjustok.com', 'https://notjustok.com/feed/', 'africa', 1.00, true),
  ('Afrocritik', 'https://afrocritik.com', 'https://afrocritik.com/feed/', 'africa', 1.00, true),
  ('GRM Daily', 'https://grmdaily.com', 'https://grmdaily.com/feed/', 'uk', 1.05, true),
  ('GUAP', 'https://www.guap.co', 'https://www.guap.co/feed', 'uk', 1.00, true),
  ('The FADER', 'https://www.thefader.com', 'https://www.thefader.com/feed.rss', 'americas', 0.95, true),
  ('Artnet News — Art World', 'https://news.artnet.com/art-world', 'https://news.artnet.com/art-world/feed', 'global', 0.95, true),
  ('Artsy Editorial', 'https://www.artsy.net', 'https://www.artsy.net/rss/news', 'global', 0.95, true),
  ('MarkLives', 'https://www.marklives.com', 'https://www.marklives.com/feed/', 'africa', 0.95, true),
  ('Semafor Africa', 'https://www.semafor.com/vertical/africa', 'https://news.google.com/rss/search?q=%22Semafor%20Africa%22&hl=en-AU&gl=AU&ceid=AU:en', 'global', 1.15, true),
  ('AVCA', 'https://www.avca.africa', 'https://news.google.com/rss/search?q=%22AVCA%22%20Africa%20private%20equity&hl=en-AU&gl=AU&ceid=AU:en', 'africa', 1.10, true),
  ('Briter Bridges', 'https://briterbridges.com', 'https://news.google.com/rss/search?q=%22Briter%20Bridges%22&hl=en-AU&gl=AU&ceid=AU:en', 'africa', 1.10, true),
  ('SBS African affairs', 'https://www.sbs.com.au/news', 'https://news.google.com/rss/search?q=site%3Asbs.com.au%2Fnews%20Africa&hl=en-AU&gl=AU&ceid=AU:en', 'australia', 1.05, true),
  ('The Conversation African Australians', 'https://theconversation.com/au', 'https://news.google.com/rss/search?q=site%3Atheconversation.com%20%22African%20Australians%22&hl=en-AU&gl=AU&ceid=AU:en', 'australia', 1.05, true),
  ('Australia Africa Business Council', 'https://aabc.org.au', 'https://news.google.com/rss/search?q=%22Australia%20Africa%20Business%20Council%22&hl=en-AU&gl=AU&ceid=AU:en', 'global', 1.15, true),
  ('Africa Down Under', 'https://africadownunderconference.com', 'https://news.google.com/rss/search?q=%22Africa%20Down%20Under%22%20Perth&hl=en-AU&gl=AU&ceid=AU:en', 'global', 1.10, true),
  ('DFAT Africa', 'https://www.dfat.gov.au/geo/africa', 'https://news.google.com/rss/search?q=site%3Adfat.gov.au%20Africa&hl=en-AU&gl=AU&ceid=AU:en', 'global', 1.05, true),
  ('AGAAR', 'https://www.dfat.gov.au/people-to-people/foundations-councils-institutes/advisory-group-australia-africa-relations', 'https://news.google.com/rss/search?q=%22Advisory%20Group%20on%20Australia-Africa%20Relations%22%20OR%20AGAAR&hl=en-AU&gl=AU&ceid=AU:en', 'global', 1.05, true),
  ('Australia–Africa trade', 'https://news.google.com', 'https://news.google.com/rss/search?q=%22Australia%20Africa%20trade%22&hl=en-AU&gl=AU&ceid=AU:en', 'global', 1.20, true),
  ('Black Tech Fest', 'https://www.joinbtf.com', 'https://news.google.com/rss/search?q=%22Black%20Tech%20Fest%22&hl=en-AU&gl=AU&ceid=AU:en', 'uk', 1.10, true),
  ('Colorintech', 'https://colorintech.org', 'https://news.google.com/rss/search?q=%22Colorintech%22&hl=en-AU&gl=AU&ceid=AU:en', 'uk', 1.10, true),
  ('British Business Bank diversity', 'https://www.british-business-bank.co.uk', 'https://news.google.com/rss/search?q=site%3Abritish-business-bank.co.uk%20diversity&hl=en-AU&gl=AU&ceid=AU:en', 'uk', 0.95, true),
  ('Shadow and Act', 'https://shadowandact.com', 'https://news.google.com/rss/search?q=%22Shadow%20and%20Act%22&hl=en-AU&gl=AU&ceid=AU:en', 'americas', 1.10, true),
  ('21Ninety', 'https://21ninety.com', 'https://news.google.com/rss/search?q=%2221Ninety%22&hl=en-AU&gl=AU&ceid=AU:en', 'americas', 1.10, true),
  ('BLCK VC', 'https://blck.vc', 'https://news.google.com/rss/search?q=%22BLCK%20VC%22&hl=en-AU&gl=AU&ceid=AU:en', 'americas', 1.05, true),
  ('BKR Capital', 'https://bkrcapital.com', 'https://news.google.com/rss/search?q=%22BKR%20Capital%22&hl=en-AU&gl=AU&ceid=AU:en', 'americas', 1.00, true),
  ('Black Founders Network', 'https://blackfoundersnetwork.ca', 'https://news.google.com/rss/search?q=%22Black%20Founders%20Network%22%20Canada&hl=en-AU&gl=AU&ceid=AU:en', 'americas', 1.00, true),
  ('BBPA', 'https://bbpa.org', 'https://news.google.com/rss/search?q=%22Black%20Business%20and%20Professional%20Association%22%20Canada&hl=en-AU&gl=AU&ceid=AU:en', 'americas', 1.00, true),
  ('OkayAfrica', 'https://okayafrica.com', 'https://news.google.com/rss/search?q=site%3Aokayafrica.com&hl=en-AU&gl=AU&ceid=AU:en', 'global', 1.15, true),
  ('Trench', 'https://trenchtrenchtrench.com', 'https://news.google.com/rss/search?q=site%3Atrenchtrenchtrench.com&hl=en-AU&gl=AU&ceid=AU:en', 'uk', 1.00, true),
  ('Mixtape Madness', 'https://www.mixtapemadness.com', 'https://news.google.com/rss/search?q=%22Mixtape%20Madness%22&hl=en-AU&gl=AU&ceid=AU:en', 'uk', 1.00, true),
  ('Complex', 'https://www.complex.com', 'https://news.google.com/rss/search?q=site%3Acomplex.com%20music&hl=en-AU&gl=AU&ceid=AU:en', 'americas', 0.95, true),
  ('Okayplayer', 'https://www.okayplayer.com', 'https://news.google.com/rss/search?q=site%3Aokayplayer.com&hl=en-AU&gl=AU&ceid=AU:en', 'americas', 0.95, true),
  ('The Music', 'https://themusic.com.au', 'https://news.google.com/rss/search?q=site%3Athemusic.com.au%20music&hl=en-AU&gl=AU&ceid=AU:en', 'australia', 1.00, true),
  ('triple j Unearthed', 'https://www.abc.net.au/triplej/unearthed', 'https://news.google.com/rss/search?q=%22triple%20j%20Unearthed%22&hl=en-AU&gl=AU&ceid=AU:en', 'australia', 1.00, true),
  ('Contemporary And', 'https://contemporaryand.com', 'https://news.google.com/rss/search?q=%22Contemporary%20And%22%20African%20art&hl=en-AU&gl=AU&ceid=AU:en', 'global', 1.10, true),
  ('The Drum', 'https://www.thedrum.com', 'https://news.google.com/rss/search?q=site%3Athedrum.com&hl=en-AU&gl=AU&ceid=AU:en', 'global', 0.90, true),
  ('Campaign', 'https://www.campaignlive.co.uk', 'https://news.google.com/rss/search?q=site%3Acampaignlive.co.uk%20OR%20site%3Acampaignlive.com&hl=en-AU&gl=AU&ceid=AU:en', 'global', 0.90, true),
  ('Little Black Book', 'https://lbbonline.com', 'https://news.google.com/rss/search?q=site%3Albbonline.com&hl=en-AU&gl=AU&ceid=AU:en', 'global', 0.90, true)
on conflict (feed_url) do nothing;

-- Search feeds are discovery mechanisms, not publishers. Keep one honest
-- source identity and preserve each Google headline's publisher suffix.
update public.news_sources
set name = 'Google News discovery',
    home_url = 'https://news.google.com'
where feed_url = 'https://news.google.com/rss/search?q=%22African+Australian%22+(business+OR+founder+OR+entrepreneur)&hl=en-AU&gl=AU&ceid=AU:en';

insert into public.tracked_entities (kind, name, aliases, industry, region, house, status)
values
  ('company', 'Africa: The Big Deal', array['The Big Deal'], 'capital-data', 'africa', true, 'approved'),
  ('company', 'Briter Bridges', array[]::text[], 'capital-data', 'africa', true, 'approved'),
  ('company', 'AVCA', array['African Private Capital Association', 'African Private Equity and Venture Capital Association'], 'private-capital', 'africa', true, 'approved'),
  ('company', 'Catalyst Fund', array[]::text[], 'venture-capital', 'africa', true, 'approved'),
  ('company', 'Impact X Capital', array[]::text[], 'venture-capital', 'uk', true, 'approved'),
  ('company', 'Cornerstone Partners', array[]::text[], 'venture-capital', 'uk', true, 'approved'),
  ('company', 'Ada Ventures', array[]::text[], 'venture-capital', 'uk', true, 'approved'),
  ('company', 'Black Seed VC', array[]::text[], 'venture-capital', 'uk', true, 'approved'),
  ('company', 'Zeal Capital Partners', array[]::text[], 'venture-capital', 'americas', true, 'approved'),
  ('company', 'Harlem Capital', array[]::text[], 'venture-capital', 'americas', true, 'approved'),
  ('company', 'BLCK VC', array[]::text[], 'venture-capital', 'americas', true, 'approved'),
  ('company', 'BKR Capital', array[]::text[], 'venture-capital', 'americas', true, 'approved'),
  ('company', 'The Plug (tpinsights)', array['The Plug', 'tpinsights'], 'intelligence-media', 'americas', true, 'approved'),
  ('company', 'digitalundivided', array['DigitalUndivided'], 'entrepreneurship-data', 'americas', true, 'approved'),
  ('company', 'Colorintech', array[]::text[], 'technology-inclusion', 'uk', true, 'approved'),
  ('company', 'Foundervine', array[]::text[], 'entrepreneurship-accelerator', 'uk', true, 'approved'),
  ('company', 'Culture Genesis', array[]::text[], 'creator-economy', 'americas', true, 'approved'),
  ('company', 'Australia Africa Business Council', array['AABC'], 'trade-corridor', 'global', true, 'approved'),
  ('company', 'African Australian Chamber of Commerce', array['AACC'], 'trade-corridor', 'australia', true, 'approved'),
  ('person', 'Maxime Bayen', array[]::text[], 'capital-data', 'africa', true, 'approved'),
  ('person', 'Eric Collins', array[]::text[], 'venture-capital', 'uk', true, 'approved'),
  ('person', 'Izzy Obeng', array['Isabel Obeng'], 'entrepreneurship', 'uk', true, 'approved'),
  ('person', 'Karl Lokko', array[]::text[], 'venture-capital', 'uk', true, 'approved'),
  ('person', 'Sherrell Dorsey', array[]::text[], 'intelligence-media', 'americas', true, 'approved'),
  ('person', 'Tokini Peterside-Schwebig', array['Tokini Peterside'], 'creative-industries', 'africa', true, 'approved'),
  ('person', 'Touria El Glaoui', array[]::text[], 'creative-industries', 'global', true, 'approved'),
  ('person', 'Grace Ladoja', array[]::text[], 'creative-industries', 'uk', true, 'approved'),
  ('person', 'Genesis Owusu', array[]::text[], 'music', 'australia', true, 'approved'),
  ('person', 'Sampa the Great', array[]::text[], 'music', 'australia', true, 'approved'),
  ('theme', 'Homecoming Festival Lagos', array['Homecoming Festival'], 'creative-industries', 'africa', true, 'approved'),
  ('theme', 'Art X Lagos', array['ART X Lagos'], 'creative-industries', 'africa', true, 'approved'),
  ('theme', '1-54 Contemporary African Art Fair', array['1-54 Art Fair', '1-54'], 'creative-industries', 'global', true, 'approved'),
  ('theme', 'Black Tech Fest', array['BTF'], 'technology', 'uk', true, 'approved'),
  ('theme', 'Africa Down Under', array['ADU'], 'resources-corridor', 'global', true, 'approved'),
  ('theme', 'Move My Way (festival)', array['Move My Way'], 'music', 'australia', true, 'approved'),
  ('theme', 'BlackStar Film Festival', array['BlackStar'], 'screen', 'americas', true, 'approved'),
  ('theme', 'Essence Festival', array['ESSENCE Festival of Culture'], 'creative-industries', 'americas', true, 'approved'),
  ('theme', 'AGOA', array['African Growth and Opportunity Act'], 'trade-policy', 'global', true, 'approved'),
  ('theme', 'AfCFTA', array['African Continental Free Trade Area'], 'trade-policy', 'africa', true, 'approved'),
  ('theme', 'Prosper Africa', array[]::text[], 'trade-policy', 'global', true, 'approved'),
  ('theme', 'Afrobeats and Amapiano industry', array['Afrobeats industry', 'Amapiano industry'], 'creative-industries', 'global', true, 'approved'),
  ('theme', 'Grammy Best African Music Performance', array['Best African Music Performance'], 'creative-industries', 'global', true, 'approved'),
  ('theme', 'ADCOLOR', array[]::text[], 'creative-industries', 'americas', true, 'approved'),
  ('theme', 'Powerlist', array['Powerful Media Powerlist'], 'leadership', 'uk', true, 'approved'),
  ('theme', 'Black British Business Awards', array['BBBA'], 'leadership', 'uk', true, 'approved')
on conflict (kind, name) do nothing;

notify pgrst, 'reload schema';

commit;
