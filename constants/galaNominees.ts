import { AMARI_GALA_NOMINEE_BLURBS } from './galaNomineeCopy';
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

const NOMINEE_BLURBS = AMARI_GALA_NOMINEE_BLURBS;

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
