import { db } from "./index.js";
import { compassRegionsTable } from "./schema/compass_regions.js";
import { sql } from "drizzle-orm";

const PRIORITY_SEED = [
  {
    region_code: "US",
    flag_emoji: "🇺🇸",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "United States",
        core_value: "Opportunity, self-reliance, and confident expression",
        biggest_taboo: "Appearing passive or unambitious; salary is considered private in formal settings",
        dining_etiquette: "Fork held in the right hand after cutting. All-inclusive bill-splitting is common. Tipping 18–22% is expected.",
        language_notes: "Direct, positive language is the norm. First names from the outset. 'How are you?' is a greeting, not a question.",
        gift_protocol: "Gifts are opened immediately and praised warmly. Alcohol is acceptable. Avoid overly extravagant gifts in business contexts.",
        dress_code: "Business casual is standard in most sectors. Smart jeans are acceptable in many professional settings. Err towards presentable.",
        dos: [
          "Address people by first name from the first meeting",
          "Smile and maintain eye contact throughout conversation",
          "Acknowledge achievements and compliment work directly",
          "Arrive on time — punctuality signals respect and professionalism",
          "Express enthusiasm openly — understatement is often misread as disinterest"
        ],
        donts: [
          "Do not discuss politics or religion unless explicitly invited",
          "Avoid excessive modesty — it reads as insecurity",
          "Do not be tardy without notifying in advance",
          "Avoid physical contact beyond a handshake without clear social signals",
          "Do not assume silence means agreement"
        ]
      }
    }
  },
  {
    region_code: "JP",
    flag_emoji: "🇯🇵",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Japan",
        core_value: "Harmony, precision, and implicit respect",
        biggest_taboo: "Causing another person to lose face publicly — disagreement must always be managed indirectly",
        dining_etiquette: "Wait to be seated. Say 'itadakimasu' before eating. Never stick chopsticks upright in rice. Always pour for others before yourself.",
        language_notes: "Speak softly and deliberately. Silence is respectful reflection, not awkwardness. Never interrupt.",
        gift_protocol: "Wrap gifts elegantly. Never give sets of four (shi sounds like death). Gifts are set aside and opened privately.",
        dress_code: "Conservative and immaculate. Dark colours in business. Remove shoes when entering homes. Always carry a clean handkerchief.",
        dos: [
          "Present and receive business cards with both hands and a slight bow",
          "Bow when greeting — the depth of the bow reflects relative status",
          "Wait for the most senior person to begin eating before you do",
          "Queue patiently and quietly at all times",
          "Express gratitude frequently and with sincere specificity"
        ],
        donts: [
          "Never write in red ink — it is associated with death",
          "Do not blow your nose in public — excuse yourself discreetly",
          "Avoid pointing directly at people or objects",
          "Do not tip — it is considered insulting",
          "Never speak loudly in restaurants, public transport, or shared spaces"
        ]
      }
    }
  },
  {
    region_code: "DE",
    flag_emoji: "🇩🇪",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Germany",
        core_value: "Precision, reliability, and substantive directness",
        biggest_taboo: "Tardiness, vagueness, or empty flattery — all are taken as indicators of poor character",
        dining_etiquette: "Wait for the host to say 'Guten Appetit'. Keep hands visible on the table, not in your lap. Eye contact while toasting is obligatory.",
        language_notes: "German directness is precision, not rudeness. Expect blunt, honest feedback. Use titles (Doktor, Professor) until told otherwise.",
        gift_protocol: "Flowers are welcomed — avoid red roses (romantic) and lilies (funereal). Wrap gifts properly. A good bottle of wine is always safe.",
        dress_code: "Formal, understated, and conservative. Quality speaks for itself. Loud colours or ostentatious branding are considered poor taste.",
        dos: [
          "Be punctual — early is on time, on time is late",
          "Address people formally (Sie, Herr, Frau) until invited to use first names",
          "Prepare thoroughly for any meeting — improvisation is frowned upon",
          "Maintain firm eye contact while toasting with a raised glass",
          "State your purpose clearly and without unnecessary preamble"
        ],
        donts: [
          "Do not make sweeping remarks or speak lightly about German history",
          "Avoid crossing the road against a red light — even when no traffic is present",
          "Never mistake directness for hostility — it is simply honest communication",
          "Do not begin eating before the host signals you to do so",
          "Avoid discussing salary or personal finances in social settings"
        ]
      }
    }
  },
  {
    region_code: "IT",
    flag_emoji: "🇮🇹",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Italy",
        core_value: "Bella figura — presenting yourself and your conduct beautifully in all circumstances",
        biggest_taboo: "Making a brutta figura: appearing cheap, ill-dressed, or crudely spoken in polite company",
        dining_etiquette: "Lunch is the main meal. Do not mix courses — pasta is separate from salad. Cappuccino is strictly a morning drink. Eat slowly and enjoy.",
        language_notes: "Warmth and passion in expression are natural and expected. Animated hands are part of language. Silence in conversation is actively avoided.",
        gift_protocol: "Quality confectionery, wine, or flowers — not chrysanthemums. Bring something when invited to dinner. Gifts are opened immediately.",
        dress_code: "Elegant and considered at all times. Even casual wear should be stylish. Avoid sportswear outside sporting contexts. Appearance signals self-respect.",
        dos: [
          "Greet with two kisses (left cheek first) between acquaintances",
          "Learn a few Italian phrases — the effort is noticed and warmly received",
          "Dress impeccably, especially in churches and any formal setting",
          "Accept food and drink that is generously offered",
          "Compliment the meal sincerely and with specific appreciation"
        ],
        donts: [
          "Do not order a cappuccino after noon — it marks the uninitiated immediately",
          "Avoid criticising Italian traditions, food, or anything connected to family",
          "Do not rush a meal or signal impatience before everyone has finished",
          "Never put cheese on seafood pasta — it is considered a genuine culinary error",
          "Avoid arriving early to a dinner invitation"
        ]
      }
    }
  },
  {
    region_code: "FR",
    flag_emoji: "🇫🇷",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "France",
        core_value: "Intellectual rigour, cultural pride, and the art of gracious living",
        biggest_taboo: "Speaking no French at all, paired with loud or transactional behaviour — it signals a lack of education and respect",
        dining_etiquette: "Courses are separate and unhurried. Keep both hands visible on the table at all times. Bread accompanies the meal, not butter. Wine is discussed with genuine knowledge.",
        language_notes: "French is a point of national pride. Begin in French, however haltingly — the attempt is what matters. Intellectual debate is engagement, not conflict.",
        gift_protocol: "Quality wine, champagne, or specific chocolates. Do not bring a bottle of wine if you are hosting. Avoid chrysanthemums (funerary). Unwrapped wine is acceptable.",
        dress_code: "Quietly elegant. Quality materials and considered choices. Sportswear is for sport only. Parisian style is understated but always precise.",
        dos: [
          "Begin every interaction with 'Bonjour' — failing to greet is considered rude",
          "Engage in intellectual discussion freely and with genuine confidence",
          "Compliment the food specifically — France's culinary identity is a source of genuine pride",
          "Observe the unhurried pace of meals and business meetings",
          "Dress carefully even for what appears to be a casual occasion"
        ],
        donts: [
          "Do not launch into English without first attempting French",
          "Avoid discussing money, salary, or prices in any social setting",
          "Do not rush — impatience is considered crude and provincial",
          "Avoid excessive cheerfulness with strangers — warmth must be earned gradually",
          "Never complain about French culture to a French person"
        ]
      }
    }
  },
  {
    region_code: "BE",
    flag_emoji: "🇧🇪",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Belgium",
        core_value: "Discretion, quality of life, and understated civic civility",
        biggest_taboo: "Arrogance, ostentation, or speaking dismissively of Flemish or Walloon culture in mixed company",
        dining_etiquette: "Belgian cuisine is taken seriously. Arrive on time. Both hands visible on the table. Beer is treated as wine — with knowledge and considered appreciation.",
        language_notes: "Language is a sensitive matter. Ask which language is preferred. Flemish (Dutch) and Walloon (French) communities have distinct and deeply felt identities.",
        gift_protocol: "Chocolates, flowers, or quality wine. Bring something when invited to a home. Gifts are usually opened when received.",
        dress_code: "Conservative, quality-led, and understated. Brussels professional dress is formal. Avoid conspicuous branding or flashy logos.",
        dos: [
          "Respect the linguistic divide — never assume someone's preferred language",
          "Arrive punctually for all professional and social appointments",
          "Appreciate Belgian chocolate and beer with genuine interest and knowledge",
          "Address people formally until clearly invited to do otherwise",
          "Maintain measured, composed conversation at all times"
        ],
        donts: [
          "Avoid making jokes about Belgian identity or the language divide — they are rarely well received",
          "Do not treat Belgium as merely a transit stop — this is perceived as dismissive",
          "Avoid overly familiar behaviour on a first meeting",
          "Do not confuse Flemish and Walloon cultural customs",
          "Avoid discussing Belgian politics unless you have genuine knowledge of the context"
        ]
      }
    }
  },
  {
    region_code: "CH",
    flag_emoji: "🇨🇭",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Switzerland",
        core_value: "Precision, punctuality, discretion, and trust that must be earned",
        biggest_taboo: "Lateness, noise, or conspicuous behaviour of any kind — all signal poor character and a lack of regard for others",
        dining_etiquette: "Wait for everyone to be served before eating. Toasts require direct eye contact with each person at the table in turn. Finish everything on your plate.",
        language_notes: "Switzerland has four official languages. Ask which is preferred in the relevant canton. Swiss-German differs significantly from standard German. Precision in speech is a virtue.",
        gift_protocol: "Flowers, quality chocolates, or wine. Remove wrapping from a wine bottle before giving. Gifts are modest and appropriate — extravagance is viewed with suspicion.",
        dress_code: "Conservative, clean, and quality-led. Personal wealth is not displayed. Practical elegance is the Swiss standard.",
        dos: [
          "Be punctual to the minute — punctuality is treated as a moral virtue",
          "Greet each person individually, with a firm handshake and direct eye contact",
          "Respect quiet hours (10pm–7am) in residential areas strictly",
          "Queue correctly and in an orderly fashion at all times",
          "Match the conversational register of your host — remain formal until invited otherwise"
        ],
        donts: [
          "Never be late — it is deeply disrespectful and not easily forgiven",
          "Avoid making assumptions about Swiss identity or national character",
          "Do not discuss personal wealth, salaries, or prices in social settings",
          "Avoid any loud or disruptive behaviour in public spaces",
          "Never dispose of recyclables incorrectly — recycling compliance is taken seriously"
        ]
      }
    }
  },
  {
    region_code: "SG",
    flag_emoji: "🇸🇬",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Singapore",
        core_value: "Meritocracy, civic order, and composed multilingual sophistication",
        biggest_taboo: "Causing public embarrassment, littering, or flouting regulations — all are genuine failures of civic character",
        dining_etiquette: "Hawker centres are culturally central — visit them respectfully. 'Chope' (reserving seats with a tissue packet) is standard. Dietary restrictions vary widely — always enquire.",
        language_notes: "English is the official language of business. Singlish is not to be mocked — it is a source of genuine cultural identity. Speak clearly but never condescendingly.",
        gift_protocol: "Avoid clocks (associated with death) or anything in sets of four for Chinese Singaporeans. Bring something if invited home. Gifts are not always opened immediately.",
        dress_code: "Smart and practical given the tropical climate. Business formal in corporate settings. Conservative dress for temples and mosques is non-negotiable.",
        dos: [
          "Respect the extraordinary diversity of Malay, Chinese, Indian, and Eurasian cultures coexisting",
          "Finish everything on your plate — waste is considered disrespectful",
          "Queue correctly at all times — it is a point of civic pride",
          "Acknowledge seniority and defer gracefully when appropriate",
          "Carry a foldable umbrella at all times — weather changes rapidly"
        ],
        donts: [
          "Never chew gum in public — it remains heavily restricted",
          "Do not litter under any circumstances",
          "Avoid jaywalking — fines are real and enforced",
          "Do not comment dismissively on Singapore's regulations — they are genuinely valued by residents",
          "Avoid discussing race or religion in careless or casual terms"
        ]
      }
    }
  },
  {
    region_code: "IN",
    flag_emoji: "🇮🇳",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "India",
        core_value: "Hospitality, hierarchy, and the primacy of relationships over transactions",
        biggest_taboo: "Disrespecting food customs, elders, or religious sensibilities — particularly around sacred animals, temples, and dietary observance",
        dining_etiquette: "Eat with the right hand only. Accept all food offered — refusing is impolite. Vegetarian food is primary for many guests. Remove shoes before entering homes.",
        language_notes: "India has 22 official languages. English is the lingua franca of business. Hindi is not universally spoken. Vary your register to context and region.",
        gift_protocol: "Bring sweets, fruit, or flowers when visiting. Avoid leather gifts. Wrap gifts — presentation matters. Gifts may be set aside and opened later.",
        dress_code: "Modesty is paramount, especially for women. Covering shoulders and knees in religious sites is mandatory. Traditional dress is always appropriate and appreciated.",
        dos: [
          "Use both hands or the right hand when giving and receiving any object",
          "Address elders with respectful titles (ji, Sir, Madam)",
          "Learn a simple greeting in the regional language — the effort is warmly received",
          "Be patient with schedules — relationships consistently take precedence over punctuality",
          "Acknowledge the diversity of India's regional cultures rather than treating the country as monolithic"
        ],
        donts: [
          "Do not touch anyone's head — it is considered sacred",
          "Never use your left hand for eating or passing objects to others",
          "Avoid public displays of affection",
          "Do not point at people or religious objects with your finger — use an open hand",
          "Avoid making assumptions based on caste, region, or religion"
        ]
      }
    }
  },
  {
    region_code: "MX",
    flag_emoji: "🇲🇽",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Mexico",
        core_value: "Warm personal connection, family loyalty, and dignified pride in culture and heritage",
        biggest_taboo: "Treating relationships as purely transactional, or showing disrespect towards Mexican heritage, food, or traditions",
        dining_etiquette: "Meals are social, unhurried occasions. Wait for the host to sit first. Compliment the food with genuine warmth. Never rush the meal or signal impatience for the bill.",
        language_notes: "Spanish is the language of warmth and pride. A few words of Spanish open many doors. Mexicans communicate warmly and indirectly in sensitive situations.",
        gift_protocol: "Bring sweets, flowers (avoid yellow marigolds — funereal), or quality spirits. Gifts are received warmly and typically opened immediately.",
        dress_code: "Smart casual in most social settings. Business dress is formal in corporate contexts. Dress to show respect — appearance communicates seriousness of purpose.",
        dos: [
          "Invest in the relationship before discussing business — trust is the foundation",
          "Greet with a handshake and warm, sustained eye contact",
          "Accept food and hospitality generously — refusing is considered impolite",
          "Compliment Mexico's culture, food, and art with genuine specificity",
          "Be patient with schedules — personal connection precedes punctuality"
        ],
        donts: [
          "Never conflate Mexican and other Latin American cultures",
          "Avoid stereotypes about Mexico — they are noted and quietly resented",
          "Do not skip small talk — relationship-building is the business",
          "Avoid discussing the border or immigration policies in casual conversation",
          "Do not be brusque or transactional in a first meeting"
        ]
      }
    }
  },
  {
    region_code: "BR",
    flag_emoji: "🇧🇷",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Brazil",
        core_value: "Warmth, inclusivity, and the joy of genuine human connection",
        biggest_taboo: "Cold, formal, or transactional behaviour — Brazilians interpret emotional distance as rudeness or arrogance",
        dining_etiquette: "Meals are relaxed and deeply social. Do not begin eating before the host. Portions are generous — finishing shows appreciation. Churrasco culture is built on sharing.",
        language_notes: "Portuguese — not Spanish — is the national language. Brazilians warmly appreciate any attempt at Portuguese. Do not assume Spanish is close enough.",
        gift_protocol: "Flowers (not purple — funereal), quality chocolates, or artisanal items. Gifts are opened immediately with warmth and vocal appreciation.",
        dress_code: "Stylish, expressive, and appropriate to the heat. Business attire is lighter than European equivalents. Appearance signals self-care and cultural awareness.",
        dos: [
          "Embrace the warmth — accept hugs, close proximity, and steady eye contact as positive signals",
          "Learn a few words of Portuguese — it lands exceptionally well and signals genuine respect",
          "Be prepared for a flexible sense of time — relationships always come first",
          "Compliment Brazil's nature, food, music, and extraordinary diversity with genuine feeling",
          "Show sincere curiosity about the person, not just the agenda"
        ],
        donts: [
          "Never make the 'OK' gesture with thumb and forefinger — it is considered offensive in Brazil",
          "Avoid political or economic commentary unless you are deeply informed",
          "Do not try to rush the relationship-building phase of any engagement",
          "Avoid comparing Brazil unfavourably to Argentina — this is reliably poorly received",
          "Do not be stiff, formal, or emotionally guarded in social settings"
        ]
      }
    }
  },
  {
    region_code: "ES",
    flag_emoji: "🇪🇸",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Spain",
        core_value: "Vivid living, proud regionalism, and spirited human connection",
        biggest_taboo: "Treating all of Spain as uniform — regional identity (Catalan, Basque, Andalusian, Galician) is profound and distinct",
        dining_etiquette: "Lunch is the main meal, typically 2–4pm. Dinner rarely before 9pm. Tapas are shared generously. Tipping is appreciated but modest. Do not sit before invited.",
        language_notes: "Castellano is the official language. Regional languages (Catalan, Euskara, Galician) are deeply cherished. Using even a few regional words signals respect.",
        gift_protocol: "Fine wine, quality pastries, or regional products. Bring something when invited to a home. Gifts are usually opened when received.",
        dress_code: "Stylish and presentable — Spaniards take visible pride in appearance. Casual wear is chic, not sloppy. Avoid shorts in cities except near beaches.",
        dos: [
          "Embrace the later schedule — lunches at 2pm, dinners at 9pm are entirely normal",
          "Shake hands warmly on greeting; close acquaintances may exchange two kisses",
          "Show genuine interest in regional culture, food, architecture, and language",
          "Linger over meals — they are unhurried and inherently social",
          "Accept a host's generosity without excessive protest"
        ],
        donts: [
          "Avoid discussing the Civil War or the Francoist period unless you know your audience deeply",
          "Do not assume Catalan or Basque people identify as simply 'Spanish'",
          "Never rush a meal or signal impatience to service staff",
          "Avoid being ostentatiously loud in public — animated is welcome, aggressive is not",
          "Do not schedule important meetings in August — Spain largely pauses"
        ]
      }
    }
  },
  {
    region_code: "CO",
    flag_emoji: "🇨🇴",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Colombia",
        core_value: "Personal warmth, resilience, and genuine pride in Colombia's culture and transformation",
        biggest_taboo: "Reducing Colombia to its past struggles — Colombians are rightfully proud of how far the country has come and how much it has to offer",
        dining_etiquette: "Meals are warm, social occasions. Wait for the host to invite you to eat. Generous portions signal hospitality — take what you will finish. Coffee (tinto) is offered constantly and should be accepted.",
        language_notes: "Colombian Spanish is considered among the clearest and most neutral in Latin America. Any attempt at Spanish is deeply and genuinely appreciated.",
        gift_protocol: "Flowers, sweets, or quality spirits. Gifts are received warmly and opened immediately. Avoid giving handkerchiefs — they are associated with mourning.",
        dress_code: "Smart and well-groomed at all times. Colombians take visible pride in appearance. Business attire is formal in major cities such as Bogotá, more relaxed on the coast.",
        dos: [
          "Be genuinely warm — greet with a handshake or cheek kiss depending on the social context",
          "Express genuine interest in Colombia's regions, coffee, culture, and cuisine",
          "Invest in the relationship before turning to business",
          "Accept coffee whenever it is offered — it always will be",
          "Compliment the country's transformation and progress — it means a great deal to those who have lived it"
        ],
        donts: [
          "Never reference cocaine, Pablo Escobar, or cartels as a conversational topic",
          "Avoid generalising Colombia with neighbouring or other Latin American countries",
          "Do not assume the level of formality or informality without reading the room carefully",
          "Avoid discussing politics unless invited and genuinely well-informed",
          "Never decline hospitality without a sincere and specific explanation"
        ]
      }
    }
  },
  {
    region_code: "AE",
    flag_emoji: "🇦🇪",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "United Arab Emirates",
        core_value: "Dignified hospitality, respect for Islamic tradition, and visionary ambition",
        biggest_taboo: "Disrespecting Islamic customs, religious practice, or law — including dress, conduct during Ramadan, and public behaviour",
        dining_etiquette: "Accept dates and Arabic coffee when offered — it is a gesture of honour and must not be declined. Eat only with the right hand. Alcohol is available in licensed venues but is never assumed.",
        language_notes: "Arabic is the official language; English is widely used in business. Learning a few Arabic phrases (Marhaba, Shukran, Inshallah) is warmly appreciated and respected.",
        gift_protocol: "Dates, fine confectionery, or quality perfume. Avoid alcohol or pork-related products as gifts. Give with the right hand only — never the left.",
        dress_code: "Modest dress is mandatory in public and legally required in some settings. Women should cover shoulders and knees. Men should avoid shorts in formal or traditional settings. Conservative dress is always respected.",
        dos: [
          "Stand when a senior or important person enters the room",
          "Accept hospitality without excessive refusal — to be hosted is an honour",
          "Use the right hand for all physical exchange of objects and food",
          "Respect prayer times — business and meetings pause accordingly",
          "Learn about Islamic traditions and customs before visiting during Ramadan"
        ],
        donts: [
          "Never publicly criticise Islam, the government, or members of the ruling family",
          "Avoid any physical contact with strangers of the opposite gender",
          "Do not consume alcohol, eat, or drink in public during Ramadan daylight hours",
          "Avoid public displays of affection — they are illegal in public spaces",
          "Do not point at people or holy sites with a single finger — use an open hand"
        ]
      }
    }
  }
];

function flagEmoji(code: string): string {
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("");
}

async function seedCompassPriority() {
  console.log("Seeding priority compass regions...");
  for (const region of PRIORITY_SEED) {
    await db.insert(compassRegionsTable)
      .values({
        region_code: region.region_code,
        flag_emoji: region.flag_emoji || flagEmoji(region.region_code),
        is_published: region.is_published,
        content: region.content,
      })
      .onConflictDoUpdate({
        target: compassRegionsTable.region_code,
        set: {
          flag_emoji: region.flag_emoji || flagEmoji(region.region_code),
          is_published: region.is_published,
          content: sql`${JSON.stringify(region.content)}::jsonb`,
        },
      });
    console.log(`  Upserted: ${region.region_code}`);
  }
  console.log(`Priority compass seed complete. ${PRIORITY_SEED.length} regions inserted/updated.`);
}

export { seedCompassPriority as runCompassPrioritySeed };

if (process.argv[1] && process.argv[1].includes("seed-compass-priority.ts")) {
  seedCompassPriority()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Priority compass seed failed:", err);
      process.exit(1);
    });
}
