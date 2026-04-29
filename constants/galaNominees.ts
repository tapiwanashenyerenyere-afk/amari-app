import type { PulseEdition } from '@/types/database';

export interface GalaNominee {
  name: string;
  category: string;
  detail?: string;
  blurb?: string;
  imageUrl: string;
}

const AMARI_GALA_IMAGE_BASE = 'https://amarigala.com/wp-content/uploads/2026/04/';
const AMARI_GALA_EVENT_HERO_IMAGE = 'https://melbourne-insider.au/wp-content/uploads/2026/02/eb-6150.jpg';

function galaImage(fileName: string) {
  return `${AMARI_GALA_IMAGE_BASE}${fileName}`;
}

const AMARI_GALA_NOMINEE_BASE: GalaNominee[] = [
  { name: 'Fidèle Tshilumba', category: 'Entrepreneur', detail: 'Pendeza Hair Extensions', imageUrl: galaImage('IMG_20260407_113411_383-1152x1536.jpg') },
  { name: 'Byron Paulus', category: 'Entrepreneur', detail: 'B-Moving + Melbourne Motor Show', imageUrl: galaImage('BYRON-800x800.jpeg') },
  { name: 'Erik Yvon', category: 'Entrepreneur', imageUrl: galaImage('Erik-Yvon-908x1536.jpeg') },
  { name: 'Mary Akindele', category: 'Entrepreneur', detail: "Sam's Cafe", imageUrl: galaImage('Homegrounds72_ChegeMbuthi_highres141-900x600.jpg') },
  { name: 'Ajak & Associates', category: 'Business', imageUrl: galaImage('64dc7e895942d90e00a612b2_My-project-4-1024x1536.png') },
  { name: 'Little Homey Cafe', category: 'Business', imageUrl: galaImage('D45B402E-345E-45D5-ADBD-057299CA037A.jpeg') },
  { name: 'Saazaa Coffee', category: 'Business', imageUrl: galaImage('SAAZAPHOTOS1-1038x1536.jpg') },
  { name: 'Tima Skin Clinic', category: 'Business', imageUrl: galaImage('IMG_20260406_133155_423-937x1536.jpg') },
  { name: 'Ursula Dyer Lepporoli', category: 'Trailblazer', imageUrl: galaImage('250327_NL_Ursula_1105-1024x1536.jpg') },
  { name: 'Kholisile Dhliwayo', category: 'Trailblazer', imageUrl: galaImage('Kholi-headshot-colour-1024x974.jpg') },
  { name: 'Lillian Ahenkan (aka Flex Mami)', category: 'Trailblazer', imageUrl: galaImage('Flex-Image-1.png') },
  { name: 'Victor Asoyo', category: 'Trailblazer', imageUrl: galaImage('the_solomons_profile_victor.jpg') },
  { name: 'Kevin Kapeke', category: 'Industry Innovator', imageUrl: galaImage('IMG_8175.jpg') },
  { name: 'Effie Nkrumah', category: 'Industry Innovator', imageUrl: galaImage('IMG_2067-1024x834.jpeg') },
  { name: 'Sandra Githinji', category: 'Industry Innovator', imageUrl: galaImage('CCxSandra_-4-1024x1536.jpg') },
  { name: 'Ashleigh Gonde', category: 'Industry Innovator', imageUrl: galaImage('2DE8DE07-7A09-432F-8F92-477807D2C324-846x1024.jpg') },
  { name: 'Kyle Gradidge', category: 'Industry Innovator', imageUrl: galaImage('IMG_20260406_131612_431-819x1024.jpg') },
  { name: 'Daniel Temesgen (Stillsbydaniel)', category: 'Visual Artist', imageUrl: galaImage('IMG_20260407_082808_310-1000x1024.jpg') },
  { name: 'Kalu Oji', category: 'Visual Artist', imageUrl: galaImage('Kalu4-819x1024.jpg') },
  { name: 'Betiel Beyin & Leigh Lule', category: 'Visual Artist', imageUrl: galaImage('IMG_20260407_170855_846-819x1024.jpg') },
  { name: 'Karabo', category: 'Visual Artist', imageUrl: galaImage('Photo-2025-11-18-1-02-05-PM-1024x1536.jpg') },
  { name: 'Beckah Amani', category: 'Musical Artist', imageUrl: galaImage('g-edited-1024x1536.jpg') },
  { name: 'Baro Sura', category: 'Musical Artist', imageUrl: galaImage('IMG_20260407_141933_079-900x600.jpg') },
  { name: 'Kye', category: 'Musical Artist', imageUrl: galaImage('IMG_20260409_181542_020-800x800.jpg') },
  { name: 'Devaura', category: 'Musical Artist', imageUrl: galaImage('DEVAURA-press-shot-1024x1536.jpg') },
  { name: 'Vv Pete', category: 'Musical Artist', imageUrl: galaImage('649246296_18568261594050060_3733158813124036961_n-819x1024.jpg') },
  { name: 'Zafty', category: 'Musical Artist', imageUrl: galaImage('IMG_20260407_082648_705-1024x820.jpg') },
  { name: 'Florence Baitio', category: 'Content Creator', imageUrl: galaImage('IMG_3793-830x1024.jpeg') },
  { name: 'Godsway Williams', category: 'Content Creator', imageUrl: galaImage('IMG_20260406_163538_168-819x1024.jpg') },
  { name: 'Maxi Ducer', category: 'Content Creator', imageUrl: galaImage('IMG_8178-1070x1536.jpg') },
  { name: 'Tatenda Luna', category: 'Content Creator', imageUrl: 'https://amarigala.com/wp-content/uploads/2025/03/Tatenda-Luna-819x1024.jpeg' },
  { name: 'TJ Flicks', category: 'Content Creator', imageUrl: galaImage('IMG_20260406_151606_281-1152x1536.jpg') },
  { name: 'Jacob Abrha (Jabrha)', category: 'Content Creator', imageUrl: galaImage('Jacob-Abrah.jpg') },
  { name: 'Ras-Samuel', category: 'Performing Artist', imageUrl: galaImage('IMG_20260406_143505_348-1024x1536.jpg') },
  { name: 'Dijok Mai', category: 'Performing Artist', imageUrl: galaImage('DIJOK130745-819x1024.jpg') },
  { name: 'Chika Ikogwe', category: 'Performing Artist', imageUrl: galaImage('Chikaxkobla24-819x1024.jpg') },
  { name: 'Tilahun Hailu (aka Joe White)', category: 'Performing Artist', imageUrl: galaImage('NMP_-04-1024x1536.jpg') },
  { name: 'Think Village', category: 'Social Impact', imageUrl: galaImage('IMG_20260407_082708_834-1097x1536.jpg') },
  { name: 'Abraham Kuol', category: 'Social Impact', imageUrl: galaImage('Abraham.jpg') },
  { name: 'One Ball Inc.', category: 'Social Impact', imageUrl: galaImage('IMG_20260406_125831_331-900x600.jpg') },
  { name: 'Nas Recovery Centre', category: 'Social Impact', imageUrl: galaImage('IMG_1568.jpeg') },
  { name: 'Aicha Robertson', category: 'Spotlight', imageUrl: galaImage('AC_Headshot_1_2026-1-819x1024.jpg') },
  { name: 'Anisa Nandaula', category: 'Spotlight', imageUrl: galaImage('IMG_20260406_131101_143.jpg') },
  { name: 'Chelsea Goodwin', category: 'Spotlight', imageUrl: galaImage('149458au-819x1024.jpg') },
  { name: 'Dr Anei Ochan Thou', category: 'Spotlight', imageUrl: galaImage('IMG_20260407_083035_734-855x1024.jpg') },
  { name: 'Janice Selim', category: 'Spotlight', imageUrl: galaImage('IMG_4476-800x800.png') },
  { name: 'Tigest Girma', category: 'Spotlight', imageUrl: galaImage('Tigest-Author-Photo_Pub-Use.jpg') },
  { name: 'Gout Gout', category: 'Athlete', imageUrl: galaImage('551882766_18523958959027624_4574415479116788747_n.jpg') },
  { name: 'Mabior Chol', category: 'Athlete', imageUrl: galaImage('508331870_18511712035051284_3613078503375641635_n-822x1024.jpg') },
  { name: 'Desleigh Owusu', category: 'Athlete', imageUrl: galaImage('IMG_20260407_082911_408-1024x1536.jpg') },
  { name: 'Nestory Irankunda', category: 'Athlete', imageUrl: galaImage('r0_0_800_600_w800_h600_fmax.jpg') },
];

const NOMINEE_BLURBS: Record<string, string> = {
  'Fidèle Tshilumba': 'Founder of Pendeza Hair, building an ethical luxury hair brand around confidence, quality, and modern female entrepreneurship.',
  'Byron Paulus': 'Logistics operator and event builder behind B-Moving and the Melbourne Motor Show revival, connecting operations discipline with automotive culture.',
  'Erik Yvon': 'Fashion designer and educator using gender-fluid luxury, Mauritian-Creole heritage, and community retail to expand Australian fashion.',
  'Mary Akindele': 'Hospitality founder bringing West African food into Melbourne diner culture through Sam\'s Cafe, Mary\'s, and inclusive neighbourhood spaces.',
  'Ajak & Associates': 'Melbourne law firm combining courtroom expertise, pro bono work, and African Australian legal advocacy for more accessible justice.',
  'Little Homey Cafe': 'Black-owned Brunswick cafe and cultural lounge built around Afrocentric art, music, Ethiopian coffee ceremonies, and daily community connection.',
  'Saazaa Coffee': 'Specialty roaster bridging Maasai heritage and Melbourne coffee culture through ethical sourcing, community mentorship, and education support.',
  'Tima Skin Clinic': 'African-owned skin clinic specialising in clinical care for melanin-rich and sensitive skin, with an emphasis on safety and inclusion.',
  'Ursula Dyer Lepporoli': 'KPMG tax leader and civic advocate working across global mobility, the arts, refugee labour mobility, and women\'s empowerment.',
  'Kholisile Dhliwayo': 'Architect, artist, and curator whose spatial practice documents Black diasporic life and pushes architecture toward equity and justice.',
  'Lillian Ahenkan (aka Flex Mami)': 'Multidisciplinary creator, presenter, author, and entrepreneur shaping Australian digital culture through maximalist style and sharper conversations.',
  'Victor Asoyo': 'Senior lawyer and community leader mentoring skilled migrant professionals while advancing African diaspora advocacy in Queensland.',
  'Kevin Kapeke': 'VicHealth policy leader and youth advocate translating lived experience into governance, public health, and multicultural wellbeing work.',
  'Effie Nkrumah': 'Actor, director, voice artist, and creative founder challenging narrow diaspora narratives across theatre, games, and sustainable fashion.',
  'Sandra Githinji': 'Designer, curator, and educator centring African perspectives through interiors, objects, exhibitions, and reparative design research.',
  'Ashleigh Gonde': 'Registered nurse, entrepreneur, author, and Miss Culture Australia 2026 combining clinical skill with multicultural youth empowerment.',
  'Kyle Gradidge': 'Advertising leader at 2045 recognised for brand growth, major creative awards, mentorship, and diversity leadership.',
  'Daniel Temesgen (Stillsbydaniel)': 'Portrait photographer and director making cinematic images of community, identity, Black life, fashion, and cultural stillness.',
  'Kalu Oji': 'Filmmaker and visual artist telling tender African-Australian stories through award-winning features, shorts, and diasporic cinema.',
  'Betiel Beyin & Leigh Lule': 'The duo behind CEEBS, using sharp western-suburbs comedy and Afro-diasporic storytelling to reshape Australian digital screen culture.',
  'Karabo': 'Photographer and creative capturing sport, music, sneakers, and culture through brand work and high-energy event storytelling.',
  'Beckah Amani': 'Singer-songwriter blending folk, pop, and R&B to write vulnerable songs about resilience, identity, and memory.',
  'Baro Sura': 'Artist, songwriter, and filmmaker moving between alternative hip-hop, soul, and dream-pop with a cinematic devotional sound.',
  'Kye': 'Zimbabwean-born, Melbourne-based neo-soul and pop artist making celebratory R&B about joy, identity, and creative community.',
  'Devaura': 'Sydney singer and rapper with a genre-blending R&B sound, known for live performance, resilience, and community-minded lyricism.',
  'Vv Pete': 'Sudanese-Australian rapper and singer pushing club-rap globally through high-energy flows, boundary-pushing production, and sharp performance.',
  'Zafty': 'Young Nigerian-born Melbourne rapper whose phone-recorded beginnings, lyrical depth, and triple j momentum mark a fast-rising voice.',
  'Florence Baitio': 'High-fashion model and creator redefining beauty standards through deep-melanin representation and international editorial momentum.',
  'Godsway Williams': 'Fashion commentator, creative director, and Fear No Evil founder turning streetwear expertise into cultural storytelling and hosting.',
  'Maxi Ducer': 'Fitness and lifestyle creator helping busy mothers pursue transformation, resilience, wellness, and self-care while building a large digital audience.',
  'Tatenda Luna': 'Fashion designer and digital creator with global beauty collaborations, a Forbes 30 Under 30 honour, and her Luna Cosima label.',
  'TJ Flicks': 'Comedy duo turning everyday situations into fast, relatable sketches that have made them standouts in modern Australian creator culture.',
  'Jacob Abrha (Jabrha)': 'Footballer and creator documenting an elite AFL draft journey, training discipline, and the path from community football to higher levels.',
  'Ras-Samuel': 'Actor, writer, and producer building screen stories around cultural heritage, human connection, and long-term craft development.',
  'Dijok Mai': 'South Sudanese-Australian DJ whose Afrobeats, afro-tech, hip-hop, and global sets place her at the front of contemporary performance.',
  'Chika Ikogwe': 'Actor and writer known for screen and theatre work, mentorship, and advocacy for BIPOC visibility in Australian arts.',
  'Tilahun Hailu (aka Joe White)': 'Ethiopian-Australian comedian and actor using clean, high-energy storytelling to bridge cultures through resilience and laughter.',
  'Think Village': 'Community-led organisation supporting young people and families through culturally safe, trauma-informed prevention and leadership programs.',
  'Abraham Kuol': 'Youth advocate and criminology researcher using lived experience, sport, and major fundraising to reform settlement and justice outcomes.',
  'One Ball Inc.': 'Soccer charity removing barriers to sport while building confidence, leadership, wellbeing, and belonging for culturally diverse young people.',
  'Nas Recovery Centre': 'Culturally informed AOD and mental-health service helping African-Australian communities access therapy, rehabilitation, housing pathways, and recovery.',
  'Aicha Robertson': 'Digital creator, fashion presenter, and entrepreneur championing conscious wardrobing, representation, and high-energy fashion storytelling.',
  'Anisa Nandaula': 'Comedian, poet, and author whose stand-up and online work turns identity, race, and heritage into sharp, accessible storytelling.',
  'Chelsea Goodwin': 'Home cook and bestselling author behind $10 Meals Australia, making low-cost, high-flavour cooking practical for families.',
  'Dr Anei Ochan Thou': 'Anaesthesia registrar and mentor creating medical scholarships, storytelling platforms, and professional networks for African-Australian healthcare leaders.',
  'Janice Selim': 'Founder of No Taps Foundation, building clean-water infrastructure and mobilising collective action for communities in sub-Saharan Africa.',
  'Tigest Girma': 'Bestselling fantasy author bringing East African characters, gothic atmosphere, and Black mythic storytelling to a global readership.',
  'Gout Gout': 'Record-breaking sprinter whose 200m performances, World U20 success, and effortless speed have made him a global athletics name.',
  'Mabior Chol': 'Hawthorn key forward and mentor known for athleticism, goal-kicking, leadership, and youth empowerment beyond football.',
  'Desleigh Owusu': 'History-making triple jumper and community advocate representing Ghanaian heritage, national excellence, and resilience on the world stage.',
  'Nestory Irankunda': 'Explosive Australian winger and Socceroo whose move through Adelaide, Bayern, and Watford signals elite football potential.',
};

export const AMARI_GALA_NOMINEES: GalaNominee[] = AMARI_GALA_NOMINEE_BASE.map((nominee) => ({
  ...nominee,
  blurb: NOMINEE_BLURBS[nominee.name],
}));

export const AMARI_GALA_NOMINEE_STORY: PulseEdition = {
  id: -2026042901,
  publish_date: '2026-04-29',
  status: 'published',
  headline: 'Meet the AMARI Gala 2026 nominees',
  summary_content: {
    category_label: 'AMARI Gala nominees',
    blocks: [
      {
        type: 'text',
        content:
          'A first look at the builders, artists, operators, athletes, creators, and community leaders shaping the AMARI Gala 2026 field.',
      },
    ],
  },
  full_content: {
    source_url: 'https://amarigala.com/amari-gala-2026/',
    category_label: 'AMARI Gala nominees',
    nominees: AMARI_GALA_NOMINEES,
    blocks: [
      {
        type: 'text',
        content:
          'The AMARI Gala nominees are the people and teams currently carrying visible momentum across enterprise, culture, sport, impact, media, hospitality, law, health, design, and performance.',
      },
      {
        type: 'text',
        content:
          'Read this list as a map of the community: businesses turning local trust into durable infrastructure, artists making Australian culture less narrow, founders creating new markets, and social-impact leaders solving problems from the inside.',
      },
      {
        type: 'text',
        content:
          'Across eleven categories, the 2026 field shows what AMARI exists to connect: ambition with access, creative influence with operating discipline, and recognition with practical opportunity.',
      },
      {
        type: 'nominee_grid',
        content: 'Explore the AMARI Gala nominees by category below.',
      },
    ],
  },
  stats: {
    nominees: AMARI_GALA_NOMINEES.length,
  },
  hero_image_path: AMARI_GALA_EVENT_HERO_IMAGE,
  created_at: '2026-04-29T00:00:00.000Z',
  updated_at: '2026-04-29T00:00:00.000Z',
};
