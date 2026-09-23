/**
 * ELXR Creative — single source of truth for all site copy.
 * Edit this file to change any text on the site. No rebuild logic lives here.
 *
 * [NAV] placeholders still open (section 14 of the content doc):
 *  - domain / email        → using "hello@elxrcreative.com" as placeholder
 *  - calendar link         → using "#book" placeholder
 *  - IG handle / LinkedIn  → placeholders in footer
 *  - revenue figure        → using $3M+ (the one attached to "measurable"); swap to $5.5M here if preferred
 */

export interface Bottle {
  id: string;
  name: string;
  tagline: string;
  liquidColor: string;
  oneLiner: string;
  whatsInside: string[];
  proof: { body: string; stat: string }[];
  bodyCopy?: string[];
  cta: { label: string; href: string };
}

export const meta = {
  title: "ELXR Creative — Creative Marketing Agency, New York & New Jersey",
  description:
    "ELXR Creative engineers attention for brands that can't buy it. Content engines, launches, paid media and AI visibility. Brewed in New York, serving NY & NJ.",
  ogDescription:
    "The ELXR for marketing growth. A creative marketing agency brewed in New York.",
};

export const global = {
  navLinks: [
    { label: "Services", href: "#services" },
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
  navCta: { label: "Book a call", href: "#book" }, // [NAV: calendar link]
  footer: {
    tagline: "Brewed in New York.",
    email: "hello@elxrcreative.com", // [NAV: domain TBD]
    line: "New York & New Jersey. Working everywhere.",
    instagram: { label: "Instagram", href: "https://instagram.com/" }, // [NAV: IG handle]
    linkedin: { label: "LinkedIn", href: "https://linkedin.com/" }, // [NAV: LinkedIn URL]
    legal: "© 2026 ELXR Creative. All rights reserved.",
  },
};

export const loader = {
  pouring: "Pouring...",
  served: "Served.",
};

export const hero = {
  headline: "The ELXR for marketing growth.", // [NAV: recommended option, alternates in content doc §4]
  subline: "A creative marketing agency engineering attention from New York.",
  headlineLead: "The ELXR for",
  headlineEmphasis: "marketing growth.",
  eyebrow: "INDEPENDENT CREATIVE AGENCY",
  scrollCue: "Scroll into the city",
  intro: {
    kicker: "Creative marketing agency, New York & New Jersey",
    title: "Brewed in New York.",
    caption:
      "Ideas, content, launches and media for brands that can't outspend anyone. Engineered to earn attention, not rent it.",
  },
  primaryCta: { label: "Book a call", href: "#book" }, // [NAV: calendar link]
  secondaryCta: { label: "See the work", href: "#work" },
  exploreCta: "Explore the city",
  nextCue: "What we do",
};

export const thesis = {
  lineOne: "Most agencies rent attention and hand you the bill.",
  emphasis: "We engineer it.",
  lineTwo:
    "Big ideas, relentless content, launches that trend and media money that behaves. Mixed to order, served cold, measured to the drop.",
};

export const strips = {
  categories: [
    "Global streaming",
    "Luxury automotive",
    "Global fashion retail",
    "National fintech",
    "Consumer healthcare",
    "Cultural institutions",
    "NYC hospitality",
    "Nonprofits",
  ],
  credentials: [
    "2x Kyoorius Blue Elephant winner",
    "Meta Certified Media Buying Professional",
    "Google Ads certified",
    "HubSpot Inbound certified",
  ],
  numbers: [
    { tag: "Tenure", value: "7+ years", caption: "engineering attention for global brands" },
    { tag: "Organic reach", value: "50M+", caption: "organic views on a single launch, in 24 hours" },
    { tag: "Scale", value: "3B+", caption: "digital impressions on one campaign" },
    { tag: "Revenue", value: "$3M+", caption: "in measurable revenue driven" }, // [NAV: $5.5M vs $3M — $3M is the defensible "measurable" figure]
  ],
};

export const servicesIntro = {
  eyebrow: "THE MENU",
  heading: "Pick your potion.", // [NAV: recommended option]
  subline: "Every bottle is a service. Open one to see what it's done.",
  dragCue: "DRAG TO ROTATE",
  hoverCue: "TOUCH OR CLICK TO OPEN",
  collection: "THE ELXR COLLECTION / SIX FORMULAS",
  loading: "Preparing your formula…",
  fallback: "Explore each formula below.",
  retry: "Reload bottles",
  open: "Open the bottle",
  close: "Seal the bottle",
  details: "Explore the results",
  inside: "What’s inside",
  index: "THE FORMULA INDEX",
  indexCue: "Six specialisms. One creative chemistry.",
};

export const bottles: Bottle[] = [
  {
    id: "attention-engineering",
    name: "Attention Engineering",
    tagline: "Fame, without the media bill.",
    liquidColor: "#7038E0",
    oneLiner:
      "Big ideas built to earn attention instead of renting it. Cultural hijacks, platform tricks nobody saw coming, and creative that travels on its own legs.",
    whatsInside: [
      "Big-idea development",
      "Cultural and platform hijacks",
      "Earned-media stunts",
      "Interactive and AR activations",
      "Launch creative",
    ],
    proof: [
      {
        body: "A global streaming giant needed launch buzz for its flagship spy thriller, with zero video media budget. We hijacked the one button on every Android TV remote that marketers ignore: the voice assistant. Banner ads carried a cryptic phrase, voice-SEO'd so hard it was the only result. Speak it, and the show's star handed you a top-secret mission.",
        stat: "200,000+ interactions in 48 hours. $0 video spend. National creative award winner.",
      },
      {
        body: "A global baby-care brand had a trust problem: parents don't believe ingredient labels. So we turned the most traditional medium in the market, the morning newspaper, into a gateway. One scan and a 3D ingredient lab unfolded on the reader's floor, proof they could walk around.",
        stat: "2M+ impressions. Campaign of the quarter. A CEO-level shout-out in the company-wide mail.",
      },
    ],
    cta: { label: "Mix this into your brand →", href: "#contact" },
  },
  {
    id: "content-engine",
    name: "Content Engine",
    tagline: "Always on. Never off-brand.",
    liquidColor: "#B43FD6",
    oneLiner:
      "A production line for your feed. Strategy, scripting, shooting, editing and community, running on a weekly rhythm that never asks you to think about it.",
    whatsInside: [
      "Monthly content systems",
      "Host-led and creator-led video",
      "Shooting and editing, studio to iPhone",
      "Influencer collaborations",
      "Community management",
      "Live reporting dashboards",
    ],
    proof: [
      {
        body: "A national financial services giant wanted a young audience that actively avoids finance content. We gave finance a human face: a host-led engine mixing trend-jacks with deep explainers, influencer voices layered on for credibility, the full pipeline owned from concept to script to edit to amplification.",
        stat: "40M+ views. 2.2x growth for the business unit. Individual videos crossing 1M+ views on the regular.",
      },
      {
        // [NAV: optional entry — approve or cut]
        body: "An Upper West Side cocktail bar needed big-brand content on a neighborhood budget. One lean team, shot entirely on iPhone, edited same-day, posted on a fixed weekly rhythm, comments answered inside five minutes.",
        stat: "A full always-on presence, ads included, at a fraction of a production house's day rate.",
      },
    ],
    cta: { label: "Mix this into your brand →", href: "#contact" },
  },
  {
    id: "launch-moments",
    name: "Launch & Moments",
    tagline: "Own the night. And the morning feed.",
    liquidColor: "#F3DFA2",
    oneLiner:
      "Openings, launches and events turned into content storms. We build the real-time newsroom, so the internet finds out before the press does.",
    whatsInside: [
      "Launch strategy",
      "Real-time content newsrooms",
      "On-ground capture and same-minute edits",
      "Influencer and VIP moments",
      "Post-event momentum plans",
    ],
    proof: [
      {
        body: "A landmark cultural institution opened with an A-list red carpet, and needed the physical night to become a global digital monument in real time. We built a real-time engine: on-ground editors slicing carpet footage into vertical, sound-on edits the moment it happened.",
        stat: "The #1 trend worldwide for 48 hours. 50M+ organic video views. 3B+ digital impressions. Faster than the press could file.",
      },
      {
        body: "A national payments network had one booth at a global fintech festival, against 80+ competitors. We bridged print to ground: ads in the financial dailies steered attendees to the booth, a war room pushed breaking-news cards to LinkedIn and X before rivals could draft a release, and live user reactions became same-day social proof.",
        stat: "2M+ offline-to-online impressions. A top-3 trending fintech topic of the festival.",
      },
    ],
    cta: { label: "Mix this into your brand →", href: "#contact" },
  },
  {
    id: "paid-amplification",
    name: "Paid Amplification",
    tagline: "Every dollar, working overtime.",
    liquidColor: "#E8C766",
    oneLiner:
      "Media buying that treats your budget like our money. Meta and Google, full-funnel, tracked to the last click and reported in plain English.",
    whatsInside: [
      "Meta and Google campaign builds",
      "Full-funnel strategy",
      "Creative testing",
      "Conversion tracking and dashboards",
      "Budget planning",
    ],
    proof: [
      {
        // [NAV: optional entry — approve or cut]
        body: "A Manhattan cocktail bar and its private event space needed bookings, not likes, on a few-hundred-dollar monthly budget. Always-on local search campaigns, tuned continuously.",
        stat: "563K impressions, 11K clicks and 4,300+ conversion actions in eight months. Enquiries became a weekly rhythm instead of a hope.",
      },
      {
        body: "Certified where it counts. The same playbooks that ran national budgets, pointed at yours.",
        stat: "Meta Certified Media Buying Professional. Google Ads certified. HubSpot Inbound certified.",
      },
    ],
    cta: { label: "Mix this into your brand →", href: "#contact" },
  },
  {
    id: "ai-visibility",
    name: "AI Visibility",
    tagline: "Be the answer, not the search result.",
    liquidColor: "#A78BFA",
    oneLiner:
      "Your next customer isn't Googling. They're asking ChatGPT. We make sure the answer is you.",
    bodyCopy: [
      // [NAV: re-verify these stats the week you publish; they move fast]
      "AI search traffic grew over 500% last year. AI answers now reach billions of queries a month, and they don't show ten blue links. They name one or two businesses.",
      "Ask ChatGPT for the best cocktail bar in your neighborhood, the best med spa in your town, the best agency for your category. If you're not in the answer, you don't exist to a growing slice of your market.",
      "We audit how the machines see you, fix the structure and authority signals they feed on, and track your presence in AI answers month over month.",
    ],
    whatsInside: [
      "AI visibility audit",
      "Entity and structured-data fixes",
      "Authority content strategy",
      "Reviews and listings engine",
      "Monthly AI-answer tracking",
    ],
    proof: [],
    cta: { label: "Get your free AI visibility check →", href: "#contact" },
  },
  {
    id: "brand-identity",
    name: "Brand & Identity",
    tagline: "Look like the brand you're about to become.",
    liquidColor: "#4C1D95",
    oneLiner:
      "Positioning, naming, identity systems and the words that carry them. Built so everything you ship afterward looks and sounds inevitable.",
    whatsInside: [
      "Positioning and messaging",
      "Naming",
      "Visual identity systems",
      "Brand playbooks",
      "Copy systems",
      "Launch sites",
    ],
    proof: [
      {
        body: "A global fashion retailer risked irrelevance during the market's biggest festive season, when tradition rules and Western casualwear gets ignored. We produced a cinematic festive anthem that grounded the global brand in local reality without diluting its premium identity.",
        stat: "It pushed the brand into the festive-shopping consideration set for the first time.",
      },
      {
        body: "The site you're standing on. Named, positioned, designed and built by the bottle you just opened.",
        stat: "ELXR is its own case study.",
      },
    ],
    cta: { label: "Mix this into your brand →", href: "#contact" },
  },
];

/**
 * Selected work — flagship cases lifted from the bottle proof blocks.
 * Sector descriptors only (hard rule 1). Every headline figure sits next to
 * the mechanism that produced it and the constraint it was produced under (rule 3).
 */
export interface WorkCase {
  sector: string;
  service: string; // bottle id — links the case to its formula
  title: string;
  figure: string;
  figureLabel: string;
  constraint: string;
  mechanism: string;
  outcome: string;
}

export const work = {
  heading: "Selected work.",
  subline:
    "Names stay under NDA. The mechanics don't. Full dashboards get walked through live on a call.",
  cta: { label: "Ask for the full case studies", href: "#contact" },
  cases: [
    {
      sector: "Global streaming",
      service: "attention-engineering",
      title: "A spy thriller launched through the TV remote.",
      figure: "200K+",
      figureLabel: "interactions in 48 hours",
      constraint: "$0 video media budget",
      mechanism:
        "We hijacked the voice-assistant button on every Android TV remote. Banner ads carried a cryptic phrase, voice-SEO'd until it was the only result. Speak it, and the show's star handed you a top-secret mission.",
      outcome:
        "200,000+ interactions in 48 hours. $0 video spend. National creative award winner.",
    },
    {
      sector: "Landmark cultural institution",
      service: "launch-moments",
      title: "An opening night the whole internet attended.",
      figure: "#1",
      figureLabel: "trend worldwide for 48 hours",
      constraint: "One night, one red carpet, real time",
      mechanism:
        "A real-time newsroom on the ground: editors slicing carpet footage into vertical, sound-on edits the moment it happened, published before the press could file.",
      outcome: "50M+ organic video views. 3B+ digital impressions.",
    },
    {
      sector: "National financial services",
      service: "content-engine",
      title: "Finance content for people who skip finance content.",
      figure: "40M+",
      figureLabel: "views",
      constraint: "An audience that actively avoids the category",
      mechanism:
        "A host-led engine mixing trend-jacks with deep explainers, influencer voices layered on for credibility, the full pipeline owned from concept to script to edit to amplification.",
      outcome:
        "2.2x growth for the business unit. Individual videos crossing 1M+ views on the regular.",
    },
    {
      sector: "Global baby-care brand",
      service: "attention-engineering",
      title: "The morning paper, turned into an ingredient lab.",
      figure: "2M+",
      figureLabel: "impressions",
      constraint: "Parents who don't trust ingredient labels",
      mechanism:
        "One scan of the most traditional medium in the market unfolded a 3D ingredient lab on the reader's floor: proof they could walk around.",
      outcome:
        "Campaign of the quarter. A CEO-level shout-out in the company-wide mail.",
    },
  ] as WorkCase[],
};

export const manifesto = {
  headline: "ATTENTION ISN'T BOUGHT. IT'S ENGINEERED.", // [NAV: recommended option]
  subline: "That's the whole philosophy. Everything else is execution.",
};

export const about = {
  eyebrow: "THE DISTILLERY",
  heading: "Who's pouring.",
  paragraphs: [
    "ELXR Creative is a New York and New Jersey marketing agency built on a simple grudge: attention got too expensive, and most of what brands buy evaporates by morning.",
    'It was founded by Pranav "Nav" Prakash after 7+ years engineering campaigns at global stalwarts, including Dentsu Creative, Schbang, Disney+ Hotstar and Amazon Prime Video, for names in streaming, luxury automotive, fashion, beauty and finance. The work won national creative awards, trended worldwide, and taught one repeatable lesson: the best results were never the most expensive ones. They were the most engineered.',
    "ELXR exists to run that playbook for brands that can't outspend anyone: strong ideas, relentless content, launches built to travel, budgets treated like they're ours. AI-assisted everywhere it makes us faster. Human everywhere it makes us better.",
    "Brewed in New York. Served wherever growth is ordered.",
  ],
};

export const faq = {
  heading: "Questions, answered.",
  items: [
    {
      q: "What does ELXR mean?",
      a: "Elixir, minus the letters we didn't need. A concentrated dose of what actually grows a brand.",
    },
    {
      q: "Who do you work with?",
      a: "Hospitality groups, F&B and CPG brands, wellness and med spas, boutique fitness, venues and events, and cultural institutions, mostly across New York and New Jersey. If you're elsewhere and interesting, write anyway.",
    },
    {
      q: "Why don't you name your clients?",
      a: "Client confidentiality is standard practice, and half our best work sits under NDA. Full case studies, dashboards and raw numbers get walked through live on a call.",
    },
    {
      q: "What does working together look like?",
      a: "Usually a focused 30-day pilot with one defined outcome, then a monthly retainer if we've earned it. Launches and one-off moments are scoped as projects.",
    },
    {
      q: "Do you use AI?",
      a: "Everywhere it makes the work faster, and nowhere it makes the work worse. Strategy, taste and the final call stay human.",
    },
  ],
};

export const contact = {
  eyebrow: "LAST CALL",
  heading: "Thirsty?", // [NAV: recommended option]
  body: "Tell us what's not growing. We'll tell you what we'd pour, and show you the receipts on the call.",
  primaryCta: { label: "Book a call", href: "#book" }, // [NAV: calendar link]
  email: "hello@elxrcreative.com", // [NAV: domain]
  line: "Based in New York & New Jersey. Working everywhere.",
  form: {
    fields: {
      name: "Name",
      brand: "Brand",
      problem: "What's not growing?",
      email: "Email",
    },
    submit: "Pour it out",
    success: "Received. We'll be in touch within one business day.",
    error: "Spilled something. Try again.",
  },
};

export const notFound = {
  heading: "This page evaporated.",
  button: "Pour me home",
};
