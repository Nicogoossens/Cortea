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
    region_code: "NL",
    flag_emoji: "🇳🇱",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Netherlands",
        core_value: "Directness, egalitarianism, and a deep respect for individual autonomy",
        biggest_taboo: "Pretension, status-seeking, or any behaviour that sets oneself above others — the Dutch value of 'doe maar gewoon' (just act normal) is real and enforced socially",
        dining_etiquette: "Dutch meals are practical and unpretentious. Going Dutch on the bill is entirely common and not impolite. Arrive at the agreed time. Compliment the food sincerely but without excess.",
        language_notes: "Dutch directness is not rudeness — it is honesty expressed efficiently. English is spoken to a very high standard across the country. Plain language is valued over ornate phrasing.",
        gift_protocol: "Flowers, quality chocolates, or a good bottle of wine. Bring something when invited to a home. Gifts are opened when received with genuine, measured appreciation.",
        dress_code: "Neat, practical, and unpretentious. Business settings call for smart-casual. Excessive formality can read as performative. Cycle-friendly clothing is universally understood.",
        dos: [
          "Be punctual — time is organised and respected by all",
          "Express your opinion directly and honestly — circumspection can be read as evasion",
          "Accept that the Dutch will be equally direct with you — take it as a compliment",
          "Appreciate cycling culture — it is a source of identity, not merely transport",
          "Split the bill without self-consciousness — it is simply practical and fair"
        ],
        donts: [
          "Do not try to appear more important than you are — status-projection is poorly received",
          "Avoid small talk that lacks substance — the Dutch prefer genuine conversation",
          "Do not be late without prior notice — it is considered disrespectful of others' time",
          "Avoid confusing the Netherlands with Holland — Holland is only two provinces",
          "Do not mistake directness for hostility — it is simply honest and efficient communication"
        ]
      },
      "nl": {
        region_name: "Nederland",
        core_value: "Directheid, gelijkwaardigheid en diep respect voor individuele autonomie",
        biggest_taboo: "Pretentie, statusvertoon of gedrag waarmee je jezelf boven anderen stelt — de Nederlandse norm 'doe maar gewoon' is echt en wordt sociaal gehandhaafd",
        dining_etiquette: "Nederlandse maaltijden zijn praktisch en nuchter. Ieder betaalt zijn eigen rekening — dat is heel gewoon en niet onbeleefd. Kom op de afgesproken tijd. Complimenteer het eten oprecht, maar zonder overdrijving.",
        language_notes: "Nederlandse directheid is geen onbeschoftheid — het is eerlijkheid die efficiënt wordt uitgedrukt. Engels wordt door het hele land op hoog niveau gesproken. Eenvoudige taal wordt gewaardeerd boven bloemrijke formuleringen.",
        gift_protocol: "Bloemen, goede chocolade of een fles goede wijn. Neem iets mee als je bij iemand thuis wordt uitgenodigd. Cadeaus worden bij ontvangst geopend met oprechte, ingetogen waardering.",
        dress_code: "Netjes, praktisch en zonder pretentie. Zakelijke omgevingen vragen om smart-casual. Overdreven formaliteit kan nep overkomen. Fietsvriendelijke kleding wordt overal begrepen.",
        dos: [
          "Wees punctueel — tijd wordt door iedereen georganiseerd en gerespecteerd",
          "Spreek je mening direct en eerlijk uit — omzichtigheid wordt al snel als ontwijking gezien",
          "Accepteer dat Nederlanders even direct tegen jou zijn — zie het als een compliment",
          "Waardeer de fietscultuur — het is een bron van identiteit, niet alleen een vervoermiddel",
          "Deel de rekening zonder schaamte — het is gewoon praktisch en eerlijk"
        ],
        donts: [
          "Probeer niet belangrijker te lijken dan je bent — statusprojectie wordt slecht ontvangen",
          "Vermijd smalltalk zonder inhoud — Nederlanders geven de voorkeur aan echte gesprekken",
          "Kom niet te laat zonder voorafgaande melding — dat wordt als onrespect voor andermans tijd gezien",
          "Verwar Nederland niet met Holland — Holland is slechts twee provincies",
          "Zie directheid niet als vijandigheid — het is simpelweg eerlijke en efficiënte communicatie"
        ]
      },
      "fr": {
        region_name: "Pays-Bas",
        core_value: "Franchise, égalitarisme et profond respect de l'autonomie individuelle",
        biggest_taboo: "La prétention, la recherche de statut ou tout comportement qui place autrui en position d'infériorité — la valeur néerlandaise du 'doe maar gewoon' (sois simplement normal) est réelle et appliquée socialement",
        dining_etiquette: "Les repas néerlandais sont pratiques et sans prétention. Partager l'addition est tout à fait courant et n'est pas impoli. Arrivez à l'heure convenue. Complimentez sincèrement la cuisine, sans exagération.",
        language_notes: "La franchise néerlandaise n'est pas de la grossièreté — c'est de l'honnêteté exprimée avec efficacité. L'anglais est parlé à un très bon niveau dans tout le pays. Un langage simple est préféré aux formulations ornées.",
        gift_protocol: "Fleurs, chocolats de qualité ou une bonne bouteille de vin. Apportez quelque chose lorsque vous êtes invité chez quelqu'un. Les cadeaux sont ouverts à la réception avec une appréciation sincère et mesurée.",
        dress_code: "Soigné, pratique et sans ostentation. Les environnements professionnels appellent à une tenue smart-casual. Une formalité excessive peut paraître performative. Les vêtements compatibles avec le vélo sont universellement compris.",
        dos: [
          "Soyez ponctuel — le temps est organisé et respecté par tous",
          "Exprimez votre opinion directement et honnêtement — la circonspection peut être perçue comme de l'esquive",
          "Acceptez que les Néerlandais soient tout aussi directs avec vous — prenez-le comme un compliment",
          "Appréciez la culture du vélo — c'est une source d'identité, pas seulement un moyen de transport",
          "Partagez l'addition sans gêne — c'est simplement pratique et juste"
        ],
        donts: [
          "N'essayez pas de paraître plus important que vous ne l'êtes — la projection de statut est mal perçue",
          "Évitez les bavardages superficiels — les Néerlandais préfèrent les conversations authentiques",
          "Ne soyez pas en retard sans prévenir — c'est considéré comme un manque de respect pour le temps des autres",
          "Évitez de confondre les Pays-Bas avec la Hollande — la Hollande n'est que deux provinces",
          "Ne confondez pas la franchise avec l'hostilité — c'est simplement une communication honnête et efficace"
        ]
      },
      "de": {
        region_name: "Niederlande",
        core_value: "Direktheit, Egalitarismus und tiefer Respekt vor der individuellen Autonomie",
        biggest_taboo: "Angeberei, Statusstreben oder jedes Verhalten, das einen über andere stellt — der niederländische Wert 'doe maar gewoon' (sei einfach normal) ist real und wird sozial durchgesetzt",
        dining_etiquette: "Niederländische Mahlzeiten sind praktisch und bescheiden. Getrennt zahlen ist völlig üblich und nicht unhöflich. Erscheine pünktlich. Komplimentiere das Essen aufrichtig, aber ohne Übertreibung.",
        language_notes: "Niederländische Direktheit ist keine Unhöflichkeit — es ist Ehrlichkeit, die effizient ausgedrückt wird. Englisch wird im ganzen Land auf sehr hohem Niveau gesprochen. Einfache Sprache wird gegenüber ornamentalen Formulierungen bevorzugt.",
        gift_protocol: "Blumen, hochwertige Schokolade oder eine gute Flasche Wein. Bringe etwas mit, wenn du zu jemandem nach Hause eingeladen wirst. Geschenke werden beim Empfang mit echter, gemessener Wertschätzung geöffnet.",
        dress_code: "Ordentlich, praktisch und unprätentiös. Geschäftliche Umgebungen erfordern Smart-Casual. Übertriebene Förmlichkeit kann als performativ wirken. Fahrradfreundliche Kleidung wird überall verstanden.",
        dos: [
          "Sei pünktlich — Zeit wird von allen organisiert und respektiert",
          "Äußere deine Meinung direkt und ehrlich — Zurückhaltung kann als Ausweichen gewertet werden",
          "Akzeptiere, dass Niederländer dir gegenüber ebenso direkt sein werden — nimm es als Kompliment",
          "Schätze die Fahrradkultur — sie ist eine Identitätsquelle, nicht nur ein Transportmittel",
          "Teile die Rechnung ohne Selbstbewusstsein — es ist einfach praktisch und fair"
        ],
        donts: [
          "Versuche nicht, wichtiger zu wirken, als du bist — Statusprojektion wird schlecht aufgenommen",
          "Vermeide Smalltalk ohne Substanz — Niederländer bevorzugen echte Gespräche",
          "Sei nicht zu spät ohne vorherige Ankündigung — es wird als Respektlosigkeit gegenüber der Zeit anderer angesehen",
          "Verwechsle die Niederlande nicht mit Holland — Holland sind nur zwei Provinzen",
          "Verwechsle Direktheit nicht mit Feindseligkeit — es ist schlicht ehrliche und effiziente Kommunikation"
        ]
      },
      "es": {
        region_name: "Países Bajos",
        core_value: "Franqueza, igualitarismo y un profundo respeto por la autonomía individual",
        biggest_taboo: "La pretensión, la búsqueda de estatus o cualquier comportamiento que sitúe a uno por encima de los demás — el valor neerlandés del 'doe maar gewoon' (sé simplemente normal) es real y se aplica socialmente",
        dining_etiquette: "Las comidas neerlandesas son prácticas y sencillas. Pagar a escote es algo totalmente habitual y no resulta descortés. Llega a la hora acordada. Elogia la comida con sinceridad, pero sin excesos.",
        language_notes: "La franqueza neerlandesa no es grosería — es honestidad expresada con eficiencia. El inglés se habla a un nivel muy alto en todo el país. Se valora el lenguaje sencillo por encima de las formulaciones ornamentadas.",
        gift_protocol: "Flores, chocolates de calidad o una buena botella de vino. Lleva algo cuando te inviten a casa de alguien. Los regalos se abren al recibirlos con una apreciación genuina y comedida.",
        dress_code: "Aseado, práctico y sin ostentación. Los entornos profesionales requieren un estilo smart-casual. La formalidad excesiva puede parecer impostada. La ropa compatible con la bicicleta es comprendida en todas partes.",
        dos: [
          "Sé puntual — el tiempo está organizado y es respetado por todos",
          "Expresa tu opinión de forma directa y honesta — la circunspección puede interpretarse como evasión",
          "Acepta que los neerlandeses serán igual de directos contigo — tómalo como un cumplido",
          "Aprecia la cultura de la bicicleta — es una fuente de identidad, no solo un medio de transporte",
          "Divide la cuenta sin reparos — es simplemente práctico y justo"
        ],
        donts: [
          "No intentes parecer más importante de lo que eres — la proyección de estatus se recibe mal",
          "Evita la charla trivial sin sustancia — los neerlandeses prefieren las conversaciones genuinas",
          "No llegues tarde sin avisar — se considera una falta de respeto hacia el tiempo de los demás",
          "Evita confundir los Países Bajos con Holanda — Holanda son solo dos provincias",
          "No confundas la franqueza con la hostilidad — es simplemente una comunicación honesta y eficiente"
        ]
      },
      "pt": {
        region_name: "Países Baixos",
        core_value: "Franqueza, igualitarismo e profundo respeito pela autonomia individual",
        biggest_taboo: "Pretensão, busca por status ou qualquer comportamento que coloque alguém acima dos outros — o valor neerlandês do 'doe maar gewoon' (seja simplesmente normal) é real e aplicado socialmente",
        dining_etiquette: "As refeições neerlandesas são práticas e sem pretensão. Dividir a conta é algo completamente comum e não é indelicado. Chegue na hora combinada. Elogie a comida com sinceridade, mas sem exagero.",
        language_notes: "A franqueza neerlandesa não é falta de educação — é honestidade expressa com eficiência. O inglês é falado a um nível muito elevado em todo o país. A linguagem simples é preferida a formulações ornamentadas.",
        gift_protocol: "Flores, chocolates de qualidade ou uma boa garrafa de vinho. Leve algo quando for convidado a casa de alguém. Os presentes são abertos no momento da receção com apreciação genuína e comedida.",
        dress_code: "Cuidado, prático e sem ostentação. Os ambientes profissionais pedem um estilo smart-casual. A formalidade excessiva pode parecer encenada. Roupa compatível com bicicleta é universalmente compreendida.",
        dos: [
          "Seja pontual — o tempo é organizado e respeitado por todos",
          "Exprima a sua opinião de forma direta e honesta — a circunspecção pode ser interpretada como evasão",
          "Aceite que os neerlandeses serão igualmente diretos consigo — encare isso como um elogio",
          "Aprecie a cultura da bicicleta — é uma fonte de identidade, não apenas um meio de transporte",
          "Divida a conta sem constrangimento — é simplesmente prático e justo"
        ],
        donts: [
          "Não tente parecer mais importante do que é — a projeção de status é mal recebida",
          "Evite conversa fiada sem substância — os neerlandeses preferem conversas genuínas",
          "Não chegue tarde sem aviso prévio — é considerado uma falta de respeito pelo tempo dos outros",
          "Evite confundir os Países Baixos com a Holanda — a Holanda são apenas duas províncias",
          "Não confunda franqueza com hostilidade — é simplesmente comunicação honesta e eficiente"
        ]
      },
      "it": {
        region_name: "Paesi Bassi",
        core_value: "Franchezza, egualitarismo e profondo rispetto per l'autonomia individuale",
        biggest_taboo: "La pretesa, la ricerca di status o qualsiasi comportamento che ponga se stessi al di sopra degli altri — il valore olandese del 'doe maar gewoon' (sii semplicemente normale) è reale e applicato socialmente",
        dining_etiquette: "I pasti olandesi sono pratici e senza pretese. Dividere il conto è assolutamente comune e non è scortese. Arriva all'orario concordato. Complimenta il cibo sinceramente, ma senza eccessi.",
        language_notes: "La franchezza olandese non è maleducazione — è onestà espressa in modo efficiente. L'inglese è parlato a livello molto elevato in tutto il paese. Il linguaggio semplice è preferito alle formulazioni ornate.",
        gift_protocol: "Fiori, cioccolatini di qualità o una buona bottiglia di vino. Porta qualcosa quando sei invitato a casa di qualcuno. I regali vengono aperti al ricevimento con apprezzamento genuino e misurato.",
        dress_code: "Ordinato, pratico e senza ostentazione. Gli ambienti di lavoro richiedono uno stile smart-casual. La formalità eccessiva può sembrare artificiosa. L'abbigliamento compatibile con la bicicletta è universalmente compreso.",
        dos: [
          "Sii puntuale — il tempo è organizzato e rispettato da tutti",
          "Esprimi la tua opinione in modo diretto e onesto — la circospezione può essere vista come evasione",
          "Accetta che gli olandesi saranno altrettanto diretti con te — prendilo come un complimento",
          "Apprezza la cultura della bicicletta — è una fonte di identità, non solo un mezzo di trasporto",
          "Dividi il conto senza imbarazzo — è semplicemente pratico e giusto"
        ],
        donts: [
          "Non cercare di sembrare più importante di quello che sei — la proiezione di status è mal vista",
          "Evita le chiacchiere prive di sostanza — gli olandesi preferiscono le conversazioni genuine",
          "Non essere in ritardo senza preavviso — è considerato irrispettoso del tempo altrui",
          "Evita di confondere i Paesi Bassi con l'Olanda — l'Olanda è solo due province",
          "Non scambiare la franchezza per ostilità — è semplicemente comunicazione onesta ed efficiente"
        ]
      },
      "ar": {
        region_name: "هولندا",
        core_value: "الصراحة والمساواة والاحترام العميق للاستقلالية الفردية",
        biggest_taboo: "التظاهر بالأهمية أو السعي وراء المكانة أو أي سلوك يضع الشخص فوق الآخرين — قيمة 'doe maar gewoon' الهولندية (كن طبيعياً فحسب) حقيقية ويتم تطبيقها اجتماعياً",
        dining_etiquette: "الوجبات الهولندية عملية وبسيطة. تقسيم الفاتورة أمر شائع تماماً وليس فيه أي إساءة. احضر في الوقت المتفق عليه. امدح الطعام بصدق دون مبالغة.",
        language_notes: "الصراحة الهولندية ليست وقاحة — إنها صدق يُعبَّر عنه بكفاءة. يُتقن الإنجليزية في جميع أنحاء البلاد بمستوى عالٍ جداً. اللغة البسيطة مفضلة على الصياغات المزخرفة.",
        gift_protocol: "الزهور أو الشوكولاتة الجيدة أو زجاجة نبيذ جيدة. احمل شيئاً عندما تُدعى إلى منزل أحدهم. تُفتح الهدايا عند استلامها مع تقدير حقيقي ومتزن.",
        dress_code: "أنيق وعملي وبدون تكلف. تتطلب البيئات المهنية أسلوباً smart-casual. قد تبدو الرسمية المفرطة مصطنعة. الملابس الملائمة لركوب الدراجات مفهومة في كل مكان.",
        dos: [
          "كن دقيقاً في المواعيد — الوقت منظم ويحترمه الجميع",
          "عبّر عن رأيك بصراحة وصدق — يمكن أن يُفسَّر التحفظ على أنه تهرب",
          "اقبل أن الهولنديين سيكونون بالقدر ذاته من الصراحة معك — خذ ذلك كمجاملة",
          "قدّر ثقافة ركوب الدراجات — إنها مصدر هوية وليست مجرد وسيلة نقل",
          "قسّم الفاتورة دون إحراج — إنه أمر عملي وعادل فحسب"
        ],
        donts: [
          "لا تحاول أن تبدو أكثر أهمية مما أنت عليه — إظهار المكانة يُقابَل بسوء",
          "تجنب الحديث السطحي الذي يفتقر إلى المضمون — يفضل الهولنديون المحادثات الحقيقية",
          "لا تتأخر دون إشعار مسبق — يُعدّ ذلك احتراماً لوقت الآخرين",
          "تجنب الخلط بين هولندا ومقاطعتَي هولندا — هولندا مجرد مقاطعتان فحسب",
          "لا تخطئ في تفسير الصراحة على أنها عدوانية — إنها مجرد تواصل صادق وفعّال"
        ]
      },
      "ja": {
        region_name: "オランダ",
        core_value: "率直さ、平等主義、そして個人の自律性への深い敬意",
        biggest_taboo: "見栄を張ること、地位を求めること、または自分を他者より上に置くような振る舞い — オランダの価値観「doe maar gewoon（普通にしていればいい）」は現実であり、社会的に執行されている",
        dining_etiquette: "オランダの食事は実用的で気取りがない。割り勘は一般的であり、失礼ではない。約束の時間に到着すること。料理を誠実にほめるが、大げさにならないこと。",
        language_notes: "オランダ人の率直さは無礼ではなく、効率的に表現される誠実さである。英語は国全体で非常に高い水準で話される。飾り立てた言い回しより、シンプルな言葉が好まれる。",
        gift_protocol: "花、高品質のチョコレート、または良いワイン。誰かの自宅に招待されたら何か持参すること。贈り物は受け取り時に開封され、率直で控えめな感謝の言葉が述べられる。",
        dress_code: "清潔感があり、実用的で、気取りがない。ビジネスシーンではスマートカジュアルが求められる。過度な正装は芝居がかって見えることがある。自転車に乗れる服装はどこでも理解される。",
        dos: [
          "時間厳守を心がける — 時間はすべての人によって組織化され、尊重されている",
          "意見は率直かつ正直に述べる — 回りくどさは回避と受け取られることがある",
          "オランダ人が同様に率直であることを受け入れる — それは称賛として受け取ること",
          "自転車文化を大切にする — それは単なる交通手段ではなく、アイデンティティの源である",
          "割り勘を気にせず行う — それは実用的で公平なことに過ぎない"
        ],
        donts: [
          "実際より重要に見せようとしない — 地位の誇示は受け入れられない",
          "中身のない雑談は避ける — オランダ人は本物の会話を好む",
          "事前連絡なしに遅刻しない — 他者の時間を尊重しないと見なされる",
          "オランダをホラント（Holland）と混同しない — ホラントはわずか2州にすぎない",
          "率直さを敵対心と誤解しない — それは単に誠実で効率的なコミュニケーションである"
        ]
      }
    }
  },
  {
    region_code: "CA",
    flag_emoji: "🇨🇦",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Canada",
        core_value: "Inclusive civility, multicultural respect, and quietly confident pragmatism",
        biggest_taboo: "Conflating Canada with the United States — Canadians have a distinct national identity and are rightly proud of the difference",
        dining_etiquette: "Meals are relaxed and inclusive. Tipping 15–20% is standard. Regional food identity is strong — poutine, maple, and seafood by province. Being a gracious guest matters more than elaborate protocol.",
        language_notes: "English and French are both official languages. In Québec, French is not optional — it is essential and deeply valued. Across Canada, polite and inclusive language is the baseline expectation.",
        gift_protocol: "Local produce, quality wine or spirits, or artisanal items. Bring something when invited to someone's home. Gifts are opened warmly and immediately.",
        dress_code: "Practical and context-appropriate. Business dress is professional but not stiff. Outdoor and climate-appropriate clothing is universally accepted. Showing you understand the environment signals cultural awareness.",
        dos: [
          "Acknowledge both official languages — French in Québec especially is non-negotiable",
          "Be genuinely inclusive in conversation — Canada's diversity is a point of national pride",
          "Queue correctly and patiently — it is a social expectation, not just politeness",
          "Appreciate the distinct regional cultures: Québec, the Maritimes, the West Coast, and the Prairies are all meaningfully different",
          "Say sorry when you mean it — and understand that Canadians often apologise reflexively without admitting fault"
        ],
        donts: [
          "Never assume Canada is simply a quieter version of the United States",
          "Avoid making generalisations about Canadian culture — it is genuinely and meaningfully diverse",
          "Do not ignore French in Québec — speaking only English there is considered dismissive",
          "Avoid discussing hockey as if it is the only cultural touchstone — it is important, but Canada contains multitudes",
          "Do not mistake Canadian politeness for agreement — disagreement is simply expressed more carefully"
        ]
      },
      "nl": {
        region_name: "Canada",
        core_value: "Inclusieve beleefdheid, multicultureel respect en rustig zelfverzekerd pragmatisme",
        biggest_taboo: "Canada verwarren met de Verenigde Staten — Canadezen hebben een eigen nationale identiteit en zijn daar terecht trots op",
        dining_etiquette: "Maaltijden zijn ontspannen en inclusief. Fooien van 15–20% zijn gebruikelijk. Regionale eetcultuur is sterk — poutine, maple en zeevruchten per provincie. Een gracieuze gast zijn telt meer dan uitgebreide protocollen.",
        language_notes: "Engels en Frans zijn beide officiële talen. In Québec is Frans niet optioneel — het is essentieel en diep gewaardeerd. In heel Canada is beleefde en inclusieve taal de basisverwachting.",
        gift_protocol: "Lokale producten, kwaliteitswijnen of -gedistilleerd, of ambachtelijke artikelen. Neem iets mee als je bij iemand thuis wordt uitgenodigd. Cadeaus worden warm en direct geopend.",
        dress_code: "Praktisch en contextgebonden. Zakelijke kleding is professioneel maar niet stijf. Buitenkleding en klimaatgeschikte kleding worden overal geaccepteerd. Tonen dat je de omgeving begrijpt signaleert cultureel bewustzijn.",
        dos: [
          "Erken beide officiële talen — Frans in Québec is in het bijzonder niet onderhandelbaar",
          "Wees oprecht inclusief in gesprekken — de diversiteit van Canada is een bron van nationale trots",
          "Sta correct en geduldig in de rij — het is een sociale verwachting, niet alleen beleefdheid",
          "Waardeer de verschillende regionale culturen: Québec, de Maritimes, de Westkust en de Prairie zijn allemaal betekenisvol anders",
          "Zeg sorry als je het meent — en begrijp dat Canadezen vaak reflexmatig sorry zeggen zonder schuld te erkennen"
        ],
        donts: [
          "Ga er nooit van uit dat Canada gewoon een stillere versie van de Verenigde Staten is",
          "Maak geen generalisaties over de Canadese cultuur — deze is oprecht en betekenisvol divers",
          "Negeer Frans in Québec niet — alleen Engels spreken wordt daar als denigrerend beschouwd",
          "Spreek niet over hockey alsof het het enige culturele anker is — het is belangrijk, maar Canada bevat veel meer",
          "Zie Canadese beleefdheid niet als instemming — onenigheid wordt simpelweg voorzichtiger uitgedrukt"
        ]
      },
      "fr": {
        region_name: "Canada",
        core_value: "Civilité inclusive, respect multiculturel et pragmatisme discrètement confiant",
        biggest_taboo: "Confondre le Canada avec les États-Unis — les Canadiens ont une identité nationale distincte dont ils sont à juste titre fiers",
        dining_etiquette: "Les repas sont décontractés et inclusifs. Le pourboire de 15 à 20 % est la norme. L'identité culinaire régionale est forte — poutine, sirop d'érable et fruits de mer selon la province. Être un hôte attentionné compte plus que des protocoles élaborés.",
        language_notes: "L'anglais et le français sont tous deux des langues officielles. Au Québec, le français n'est pas facultatif — il est essentiel et profondément valorisé. Partout au Canada, un langage poli et inclusif est la norme de base.",
        gift_protocol: "Produits locaux, vins ou spiritueux de qualité, ou articles artisanaux. Apportez quelque chose lorsque vous êtes invité chez quelqu'un. Les cadeaux sont ouverts chaleureusement et immédiatement.",
        dress_code: "Pratique et adapté au contexte. La tenue professionnelle est sérieuse mais sans rigidité. Les vêtements d'extérieur et adaptés au climat sont universellement acceptés. Montrer que vous comprenez l'environnement signale une conscience culturelle.",
        dos: [
          "Reconnaître les deux langues officielles — le français au Québec est particulièrement incontournable",
          "Être véritablement inclusif dans les conversations — la diversité du Canada est une source de fierté nationale",
          "Faire la queue correctement et patiemment — c'est une attente sociale, pas seulement de la politesse",
          "Apprécier les cultures régionales distinctes : le Québec, les Maritimes, la côte Ouest et les Prairies sont toutes significativement différentes",
          "Dire pardon quand on le pense vraiment — et comprendre que les Canadiens s'excusent souvent par réflexe sans admettre leur faute"
        ],
        donts: [
          "Ne jamais supposer que le Canada est simplement une version plus calme des États-Unis",
          "Éviter les généralisations sur la culture canadienne — elle est véritablement et significativement diverse",
          "Ne pas ignorer le français au Québec — parler uniquement anglais là-bas est considéré comme méprisant",
          "Éviter de parler du hockey comme s'il était le seul repère culturel — il est important, mais le Canada contient des multitudes",
          "Ne pas confondre la politesse canadienne avec un accord — le désaccord s'exprime simplement avec plus de précaution"
        ]
      },
      "de": {
        region_name: "Kanada",
        core_value: "Inklusive Höflichkeit, multikultureller Respekt und ruhiges, selbstbewusstes Pragmatismus",
        biggest_taboo: "Kanada mit den Vereinigten Staaten gleichzusetzen — Kanadier haben eine eigenständige nationale Identität und sind zu Recht stolz darauf",
        dining_etiquette: "Mahlzeiten sind entspannt und inklusiv. Trinkgelder von 15–20 % sind üblich. Regionale Essensidentität ist stark — Poutine, Ahornsirup und Meeresfrüchte je nach Provinz. Ein aufmerksamer Gast zu sein ist wichtiger als aufwendige Protokolle.",
        language_notes: "Englisch und Französisch sind beide Amtssprachen. In Québec ist Französisch nicht optional — es ist wesentlich und wird tief geschätzt. In ganz Kanada ist höfliche und inklusive Sprache die Grunderwartung.",
        gift_protocol: "Lokale Produkte, qualitativ hochwertige Weine oder Spirituosen oder handwerkliche Artikel. Bringe etwas mit, wenn du zu jemandem nach Hause eingeladen wirst. Geschenke werden herzlich und sofort geöffnet.",
        dress_code: "Praktisch und kontextangemessen. Geschäftskleidung ist professionell, aber nicht steif. Outdoor- und klimaangepasste Kleidung wird überall akzeptiert. Zeigen, dass man die Umgebung versteht, signalisiert kulturelles Bewusstsein.",
        dos: [
          "Beide Amtssprachen anerkennen — Französisch in Québec ist besonders unverzichtbar",
          "In Gesprächen wirklich inklusiv sein — Kanadas Vielfalt ist ein Quell nationalen Stolzes",
          "Korrekt und geduldig anstehen — es ist eine soziale Erwartung, nicht nur Höflichkeit",
          "Die unterschiedlichen Regionalkulturen schätzen: Québec, die Maritimes, die Westküste und die Prärien sind alle bedeutungsvoll verschieden",
          "Sorry sagen, wenn man es ernst meint — und verstehen, dass Kanadier oft reflexartig entschuldigen, ohne Schuld zuzugeben"
        ],
        donts: [
          "Nie davon ausgehen, dass Kanada einfach eine ruhigere Version der Vereinigten Staaten ist",
          "Keine Verallgemeinerungen über die kanadische Kultur machen — sie ist wirklich und bedeutungsvoll vielfältig",
          "Französisch in Québec nicht ignorieren — nur Englisch zu sprechen wird dort als abweisend angesehen",
          "Hockey nicht so behandeln, als wäre es der einzige kulturelle Bezugspunkt — es ist wichtig, aber Kanada bietet viel mehr",
          "Kanadische Höflichkeit nicht mit Zustimmung verwechseln — Uneinigkeit wird einfach vorsichtiger ausgedrückt"
        ]
      },
      "es": {
        region_name: "Canadá",
        core_value: "Civismo inclusivo, respeto multicultural y pragmatismo discretamente seguro de sí mismo",
        biggest_taboo: "Confundir Canadá con los Estados Unidos — los canadienses tienen una identidad nacional propia de la que están justificadamente orgullosos",
        dining_etiquette: "Las comidas son relajadas e inclusivas. La propina del 15–20 % es estándar. La identidad gastronómica regional es fuerte — poutine, maple y marisco según la provincia. Ser un comensal atento importa más que los protocolos elaborados.",
        language_notes: "El inglés y el francés son ambas lenguas oficiales. En Québec, el francés no es opcional — es esencial y muy valorado. En todo Canadá, un lenguaje educado e inclusivo es la expectativa básica.",
        gift_protocol: "Productos locales, vinos o licores de calidad, o artículos artesanales. Lleva algo cuando te inviten a casa de alguien. Los regalos se abren con calidez e inmediatamente.",
        dress_code: "Práctico y adecuado al contexto. La vestimenta de negocios es profesional pero no rígida. La ropa de exterior y adecuada al clima es universalmente aceptada. Demostrar que entiendes el entorno es una señal de conciencia cultural.",
        dos: [
          "Reconocer ambas lenguas oficiales — el francés en Québec es especialmente innegociable",
          "Ser genuinamente inclusivo en las conversaciones — la diversidad de Canadá es un motivo de orgullo nacional",
          "Hacer cola correcta y pacientemente — es una expectativa social, no solo cortesía",
          "Apreciar las distintas culturas regionales: Québec, las Marítimas, la Costa Oeste y las Praderas son todas significativamente diferentes",
          "Decir lo siento cuando se quiere decir de verdad — y entender que los canadienses suelen disculparse por reflejo sin admitir culpa"
        ],
        donts: [
          "Nunca asumir que Canadá es simplemente una versión más tranquila de los Estados Unidos",
          "Evitar hacer generalizaciones sobre la cultura canadiense — es genuina y significativamente diversa",
          "No ignorar el francés en Québec — hablar solo inglés allí se considera despectivo",
          "Evitar hablar del hockey como si fuera el único referente cultural — es importante, pero Canadá contiene multitudes",
          "No confundir la cortesía canadiense con el acuerdo — el desacuerdo simplemente se expresa con más cuidado"
        ]
      },
      "pt": {
        region_name: "Canadá",
        core_value: "Civilidade inclusiva, respeito multicultural e pragmatismo discretamente confiante",
        biggest_taboo: "Confundir o Canadá com os Estados Unidos — os canadianos têm uma identidade nacional distinta e estão justificadamente orgulhosos da diferença",
        dining_etiquette: "As refeições são descontraídas e inclusivas. A gorjeta de 15–20% é habitual. A identidade gastronómica regional é forte — poutine, maple e marisco por província. Ser um convidado atencioso importa mais do que protocolos elaborados.",
        language_notes: "O inglês e o francês são ambas línguas oficiais. No Québec, o francês não é opcional — é essencial e profundamente valorizado. Em todo o Canadá, uma linguagem educada e inclusiva é a expectativa base.",
        gift_protocol: "Produtos locais, vinhos ou bebidas espirituosas de qualidade, ou artigos artesanais. Leve algo quando for convidado a casa de alguém. Os presentes são abertos com calor e imediatamente.",
        dress_code: "Prático e adequado ao contexto. A roupa de negócios é profissional mas não rígida. Roupa de exterior e adequada ao clima é universalmente aceite. Mostrar que compreende o ambiente sinaliza consciência cultural.",
        dos: [
          "Reconhecer ambas as línguas oficiais — o francês no Québec é especialmente inegociável",
          "Ser genuinamente inclusivo nas conversas — a diversidade do Canadá é um motivo de orgulho nacional",
          "Fazer fila correta e pacientemente — é uma expectativa social, não apenas cortesia",
          "Apreciar as distintas culturas regionais: Québec, as Marítimas, a Costa Oeste e as Pradarias são todas significativamente diferentes",
          "Pedir desculpa quando se quer dizer de verdade — e entender que os canadianos muitas vezes pedem desculpa por reflexo sem admitir culpa"
        ],
        donts: [
          "Nunca assumir que o Canadá é simplesmente uma versão mais calma dos Estados Unidos",
          "Evitar fazer generalizações sobre a cultura canadiana — ela é genuína e significativamente diversa",
          "Não ignorar o francês no Québec — falar apenas inglês lá é considerado desrespeitoso",
          "Evitar falar de hóquei como se fosse o único ponto de referência cultural — é importante, mas o Canadá contém multidões",
          "Não confundir a cortesia canadiana com concordância — o desacordo é simplesmente expresso com mais cuidado"
        ]
      },
      "it": {
        region_name: "Canada",
        core_value: "Civiltà inclusiva, rispetto multiculturale e pragmatismo discretamente sicuro di sé",
        biggest_taboo: "Confondere il Canada con gli Stati Uniti — i canadesi hanno un'identità nazionale distinta di cui sono giustamente orgogliosi",
        dining_etiquette: "I pasti sono rilassati e inclusivi. La mancia del 15–20% è la norma. L'identità gastronomica regionale è forte — poutine, sciroppo d'acero e frutti di mare per provincia. Essere un ospite premuroso conta più di protocolli elaborati.",
        language_notes: "L'inglese e il francese sono entrambe lingue ufficiali. In Québec, il francese non è facoltativo — è essenziale e profondamente apprezzato. In tutto il Canada, un linguaggio educato e inclusivo è l'aspettativa di base.",
        gift_protocol: "Prodotti locali, vini o liquori di qualità, o articoli artigianali. Porta qualcosa quando sei invitato a casa di qualcuno. I regali vengono aperti calorosamente e immediatamente.",
        dress_code: "Pratico e adeguato al contesto. L'abbigliamento professionale è serio ma non rigido. L'abbigliamento outdoor e adatto al clima è universalmente accettato. Dimostrare di capire l'ambiente segnala consapevolezza culturale.",
        dos: [
          "Riconoscere entrambe le lingue ufficiali — il francese in Québec è particolarmente irrinunciabile",
          "Essere genuinamente inclusivi nelle conversazioni — la diversità del Canada è un motivo di orgoglio nazionale",
          "Fare la fila correttamente e pazientemente — è un'aspettativa sociale, non solo educazione",
          "Apprezzare le distinte culture regionali: Québec, le Marittime, la Costa Ovest e le Praterie sono tutte significativamente diverse",
          "Scusarsi quando lo si vuole davvero — e capire che i canadesi spesso si scusano per riflesso senza ammettere colpa"
        ],
        donts: [
          "Non supporre mai che il Canada sia semplicemente una versione più tranquilla degli Stati Uniti",
          "Evitare le generalizzazioni sulla cultura canadese — è genuinamente e significativamente diversa",
          "Non ignorare il francese in Québec — parlare solo inglese lì è considerato sprezzante",
          "Evitare di parlare dell'hockey come se fosse l'unico riferimento culturale — è importante, ma il Canada contiene moltitudini",
          "Non confondere la cortesia canadese con il consenso — il disaccordo si esprime semplicemente con più cautela"
        ]
      },
      "ar": {
        region_name: "كندا",
        core_value: "المدنية الشاملة واحترام التعددية الثقافية والبراغماتية الواثقة بهدوء",
        biggest_taboo: "الخلط بين كندا والولايات المتحدة — فالكنديون يمتلكون هوية وطنية مستقلة ويفخرون بها عن حق",
        dining_etiquette: "الوجبات مريحة وشاملة. البقشيش بنسبة 15–20٪ أمر معتاد. الهوية الغذائية الإقليمية قوية — البوتين والمابل والمأكولات البحرية حسب المقاطعة. أن تكون ضيفاً لطيفاً أهم من البروتوكولات المعقدة.",
        language_notes: "الإنجليزية والفرنسية كلتاهما لغتان رسميتان. في كيبيك، الفرنسية ليست اختيارية — إنها ضرورة ومحل تقدير عميق. في أرجاء كندا كلها، اللغة المهذبة والشاملة هي التوقع الأساسي.",
        gift_protocol: "المنتجات المحلية أو النبيذ الجيد أو المشروبات الروحية أو المواد الحرفية. احمل شيئاً عند الدعوة إلى منزل أحدهم. تُفتح الهدايا بدفء وفوراً.",
        dress_code: "عملي ومناسب للسياق. الملابس المهنية احترافية لكنها غير متصلبة. الملابس الخارجية والمناسبة للمناخ مقبولة في كل مكان. إظهار فهمك للبيئة يُعدّ دليلاً على الوعي الثقافي.",
        dos: [
          "الاعتراف بكلتا اللغتين الرسميتين — الفرنسية في كيبيك غير قابلة للتفاوض بشكل خاص",
          "كن شاملاً حقاً في المحادثات — تنوع كندا مصدر فخر وطني",
          "انتظر في الطابور بشكل صحيح وبصبر — إنها توقع اجتماعي وليس مجرد مجاملة",
          "قدّر الثقافات الإقليمية المتميزة: كيبيك وإقليم البحر وساحل المحيط الهادئ والسهول تختلف اختلافاً جوهرياً",
          "قل آسف حين تعنيها — وافهم أن الكنديين يعتذرون كثيراً بشكل تلقائي دون الاعتراف بالخطأ"
        ],
        donts: [
          "لا تفترض أبداً أن كندا مجرد نسخة أهدأ من الولايات المتحدة",
          "تجنب التعميمات حول الثقافة الكندية — إنها متنوعة بشكل حقيقي وعميق",
          "لا تتجاهل الفرنسية في كيبيك — التحدث بالإنجليزية فقط هناك يُعدّ تجاهلاً",
          "تجنب الحديث عن الهوكي كما لو كان المرجع الثقافي الوحيد — إنه مهم، لكن كندا تحتوي على الكثير",
          "لا تخلط بين مجاملة الكنديين والموافقة — الاختلاف يُعبَّر عنه ببساطة بمزيد من الحذر"
        ]
      },
      "ja": {
        region_name: "カナダ",
        core_value: "包容的な礼節、多文化への敬意、そして静かな自信に満ちた実用主義",
        biggest_taboo: "カナダをアメリカ合衆国と同一視すること — カナダ人は独自の国民的アイデンティティを持ち、その違いを誇りに思っている",
        dining_etiquette: "食事はリラックスした包容力のある場である。チップは15〜20%が標準。地域の食文化は強く — プーティン、メープル、州ごとのシーフードがある。丁寧なゲストであることが、細かいプロトコルより重要とされる。",
        language_notes: "英語とフランス語がともに公用語である。ケベック州ではフランス語は任意ではなく不可欠であり、深く重んじられている。カナダ全土で、礼儀正しく包容的な言語が基本的な期待値である。",
        gift_protocol: "地元の産品、上質なワインやスピリッツ、または工芸品。誰かの自宅に招待されたら何か持参すること。贈り物は温かく、すぐに開封される。",
        dress_code: "実用的で文脈に合った服装。ビジネスウェアはプロフェッショナルだが堅苦しくない。アウトドアや気候に合った服装はどこでも受け入れられる。環境を理解していることを示す服装は文化的な意識の表れとなる。",
        dos: [
          "両方の公用語を認識する — とりわけケベックでのフランス語は絶対的に必要",
          "会話において本当に包容的であること — カナダの多様性は国民的誇りの源である",
          "正しく、辛抱強く並ぶ — それは社会的な期待であり、単なる礼儀ではない",
          "個性豊かな地域文化を尊重する：ケベック、マリタイム、西海岸、大草原はすべて意味のある違いがある",
          "本当に思うときだけ「ごめんなさい」と言う — カナダ人は反射的に謝ることが多く、それは必ずしも非を認めているわけではない"
        ],
        donts: [
          "カナダが単にアメリカ合衆国の静かな版だと思わないこと",
          "カナダ文化について一般化しない — それは真に、意味深く多様である",
          "ケベックでフランス語を無視しない — そこで英語だけ話すことは軽蔑的と見なされる",
          "ホッケーだけが唯一の文化的象徴であるかのように話さない — 重要ではあるが、カナダにはそれ以上のものがある",
          "カナダ人の礼儀を合意と混同しない — 不一致は単により慎重に表現されるだけである"
        ]
      }
    }
  },
  {
    region_code: "PT",
    flag_emoji: "🇵🇹",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Portugal",
        core_value: "Warm hospitality, saudade (a bittersweet longing), and understated pride in a rich maritime heritage",
        biggest_taboo: "Confusing Portugal with Spain, or assuming Portuguese culture is derivative of its neighbour — the Portuguese have a fiercely distinct national identity",
        dining_etiquette: "Meals are generous, unhurried, and deeply social. Bread and olives arrive first but are charged separately. Tipping 10% is appreciated. Never rush the table — lingering over wine and conversation is the norm.",
        language_notes: "Portuguese is its own language with its own rhythms — not a dialect of Spanish. Brazilians speak Portuguese too, but the varieties differ. A few words of Portuguese are always warmly received.",
        gift_protocol: "Quality wine (Douro, Alentejo), local pastries, or artisanal goods. Bring something when invited to a home. Gifts are received graciously and opened with warmth.",
        dress_code: "Smart and understated. Business settings are professional without being stiff. Coastal areas are more relaxed. Looking presentable signals respect for the occasion.",
        dos: [
          "Acknowledge Portugal's distinct identity — its language, history, and culture are its own",
          "Learn a few phrases in Portuguese — it will be noticed and appreciated",
          "Embrace the slower pace of meals and social interaction — saudade applies to time too",
          "Show genuine curiosity about fado music, the Age of Discovery, and Portugal's global cultural reach",
          "Accept hospitality generously — the Portuguese take great pride in making guests feel at home"
        ],
        donts: [
          "Never refer to Portuguese as 'Spanish with an accent' or suggest the two cultures are interchangeable",
          "Avoid rushing in any social or professional setting — patience is a virtue here",
          "Do not underestimate Portugal's global historical significance — it was the first major maritime empire",
          "Avoid comparing Portugal unfavourably to Spain in any social context",
          "Do not decline food or drink generously offered without a clear and respectful explanation"
        ]
      },
      "nl": {
        region_name: "Portugal",
        core_value: "Warme gastvrijheid, saudade (een bitter-zoet verlangen) en ingetogen trots op een rijk maritiem erfgoed",
        biggest_taboo: "Portugal verwarren met Spanje, of aannemen dat de Portugese cultuur afgeleid is van zijn buurland — de Portugezen hebben een uitgesproken eigen nationale identiteit",
        dining_etiquette: "Maaltijden zijn royaal, ontspannen en sterk sociaal. Brood en olijven komen eerst maar worden apart berekend. Tien procent fooi wordt gewaardeerd. Haast nooit de tafel — napraten bij wijn en gesprekken is de norm.",
        language_notes: "Portugees is een eigen taal met eigen ritmes — geen dialect van Spaans. Brazilianen spreken ook Portugees, maar de varianten verschillen. Een paar woorden Portugees worden altijd warm ontvangen.",
        gift_protocol: "Kwaliteitswijn (Douro, Alentejo), lokale gebakjes of ambachtelijke producten. Neem iets mee als je bij iemand thuis wordt uitgenodigd. Cadeaus worden gracieus ontvangen en warm geopend.",
        dress_code: "Netjes en ingetogen. Zakelijke omgevingen zijn professioneel zonder stijfheid. Kustgebieden zijn meer ontspannen. Er verzorgd uitzien toont respect voor de gelegenheid.",
        dos: [
          "Erken de eigen identiteit van Portugal — taal, geschiedenis en cultuur zijn uniek",
          "Leer een paar zinnen Portugees — het wordt opgemerkt en gewaardeerd",
          "Omarm het langzamere tempo van maaltijden en sociale interacties — saudade geldt ook voor tijd",
          "Toon oprechte nieuwsgierigheid naar fadosmuziek, de Ontdekkingstijd en Portugal's mondiale culturele reikwijdte",
          "Accepteer gastvrijheid royaal — de Portugezen zijn er trots op gasten thuis te laten voelen"
        ],
        donts: [
          "Verwijs nooit naar Portugees als 'Spaans met een accent' of stel voor dat de twee culturen uitwisselbaar zijn",
          "Haast je nooit in sociale of professionele situaties — geduld is hier een deugd",
          "Onderschat de mondiale historische betekenis van Portugal niet — het was het eerste grote maritieme rijk",
          "Vergelijk Portugal nooit ongunstig met Spanje in een sociale context",
          "Weiger geen eten of drank dat royaal wordt aangeboden, zonder duidelijke en respectvolle uitleg"
        ]
      },
      "fr": {
        region_name: "Portugal",
        core_value: "Hospitalité chaleureuse, saudade (une nostalgie douce-amère) et fierté discrète d'un riche patrimoine maritime",
        biggest_taboo: "Confondre le Portugal avec l'Espagne, ou supposer que la culture portugaise est dérivée de celle de son voisin — les Portugais ont une identité nationale farouchement distincte",
        dining_etiquette: "Les repas sont généreux, sans hâte et profondément sociaux. Le pain et les olives arrivent en premier mais sont facturés séparément. Un pourboire de 10 % est apprécié. Ne jamais presser la table — s'attarder autour du vin et de la conversation est la norme.",
        language_notes: "Le portugais est une langue à part entière avec ses propres rythmes — pas un dialecte de l'espagnol. Les Brésiliens parlent aussi portugais, mais les variétés diffèrent. Quelques mots de portugais sont toujours chaleureusement reçus.",
        gift_protocol: "Vin de qualité (Douro, Alentejo), pâtisseries locales ou produits artisanaux. Apportez quelque chose lorsque vous êtes invité chez quelqu'un. Les cadeaux sont reçus avec grâce et ouverts chaleureusement.",
        dress_code: "Élégant et discret. Les environnements professionnels sont sérieux sans rigidité. Les zones côtières sont plus décontractées. Être présentable signale le respect pour l'occasion.",
        dos: [
          "Reconnaître l'identité distincte du Portugal — sa langue, son histoire et sa culture lui appartiennent",
          "Apprendre quelques phrases en portugais — cela sera remarqué et apprécié",
          "Embracer le rythme plus lent des repas et des interactions sociales — la saudade s'applique aussi au temps",
          "Montrer une curiosité sincère pour le fado, l'Ère des Découvertes et le rayonnement culturel mondial du Portugal",
          "Accepter l'hospitalité généreusement — les Portugais sont fiers de faire se sentir les hôtes chez eux"
        ],
        donts: [
          "Ne jamais qualifier le portugais de 'l'espagnol avec un accent' ni suggérer que les deux cultures sont interchangeables",
          "Éviter de se presser dans tout cadre social ou professionnel — la patience est une vertu ici",
          "Ne pas sous-estimer l'importance historique mondiale du Portugal — il fut le premier grand empire maritime",
          "Éviter de comparer défavorablement le Portugal à l'Espagne dans tout contexte social",
          "Ne pas refuser la nourriture ou les boissons généreusement offertes sans une explication claire et respectueuse"
        ]
      },
      "de": {
        region_name: "Portugal",
        core_value: "Herzliche Gastfreundschaft, Saudade (eine bittersüße Sehnsucht) und bescheidener Stolz auf ein reiches maritimes Erbe",
        biggest_taboo: "Portugal mit Spanien zu verwechseln oder anzunehmen, dass die portugiesische Kultur von seinem Nachbarn abgeleitet ist — die Portugiesen haben eine ausgeprägt eigenständige nationale Identität",
        dining_etiquette: "Mahlzeiten sind großzügig, gemächlich und tief sozial. Brot und Oliven kommen zuerst, werden aber separat berechnet. Zehn Prozent Trinkgeld werden geschätzt. Nie die Tischgesellschaft zur Eile antreiben — bei Wein und Gesprächen zu verweilen ist die Norm.",
        language_notes: "Portugiesisch ist eine eigenständige Sprache mit eigenen Rhythmen — kein Dialekt des Spanischen. Brasilianer sprechen auch Portugiesisch, aber die Varianten unterscheiden sich. Ein paar Worte auf Portugiesisch werden immer herzlich aufgenommen.",
        gift_protocol: "Qualitätswein (Douro, Alentejo), lokale Backwaren oder handwerkliche Waren. Bringe etwas mit, wenn du zu jemandem nach Hause eingeladen wirst. Geschenke werden mit Anstand empfangen und herzlich geöffnet.",
        dress_code: "Gepflegt und zurückhaltend. Geschäftliche Umgebungen sind professionell ohne Steifheit. Küstengebiete sind entspannter. Gepflegt auszusehen signalisiert Respekt für den Anlass.",
        dos: [
          "Portugals eigenständige Identität anerkennen — seine Sprache, Geschichte und Kultur gehören ihm allein",
          "Ein paar Phrasen auf Portugiesisch lernen — es wird bemerkt und geschätzt",
          "Das langsamere Tempo bei Mahlzeiten und sozialen Interaktionen annehmen — Saudade gilt auch für die Zeit",
          "Aufrichtige Neugier für Fado-Musik, das Zeitalter der Entdeckungen und Portugals globale kulturelle Reichweite zeigen",
          "Gastfreundschaft großzügig annehmen — die Portugiesen sind stolz darauf, Gäste heimisch zu fühlen zu lassen"
        ],
        donts: [
          "Portugiesisch nie als 'Spanisch mit Akzent' bezeichnen oder andeuten, dass die beiden Kulturen austauschbar sind",
          "In keinem sozialen oder beruflichen Umfeld zur Eile neigen — Geduld ist hier eine Tugend",
          "Portugals globale historische Bedeutung nicht unterschätzen — es war das erste große maritime Imperium",
          "Portugal in keinem sozialen Kontext ungünstig mit Spanien vergleichen",
          "Großzügig angebotenes Essen oder Getränke nicht ohne klare und respektvolle Erklärung ablehnen"
        ]
      },
      "es": {
        region_name: "Portugal",
        core_value: "Hospitalidad cálida, saudade (un anhelo agridulce) y orgullo discreto por un rico patrimonio marítimo",
        biggest_taboo: "Confundir Portugal con España, o asumir que la cultura portuguesa es derivada de la de su vecino — los portugueses tienen una identidad nacional ferozmente propia",
        dining_etiquette: "Las comidas son generosas, sin prisas y profundamente sociales. El pan y las aceitunas llegan primero pero se cobran aparte. Se agradece un 10% de propina. Nunca apresures la mesa — quedarse charlando con vino y conversación es la norma.",
        language_notes: "El portugués es su propio idioma con sus propios ritmos — no es un dialecto del español. Los brasileños también hablan portugués, pero las variedades difieren. Unas pocas palabras en portugués siempre son bien recibidas.",
        gift_protocol: "Vino de calidad (Douro, Alentejo), pasteles locales o productos artesanales. Lleva algo cuando te inviten a casa de alguien. Los regalos se reciben con gracia y se abren con calidez.",
        dress_code: "Elegante y discreto. Los entornos profesionales son serios sin rigidez. Las zonas costeras son más relajadas. Tener un aspecto presentable muestra respeto por la ocasión.",
        dos: [
          "Reconocer la identidad propia de Portugal — su lengua, historia y cultura le pertenecen",
          "Aprender algunas frases en portugués — será notado y apreciado",
          "Abrazar el ritmo más lento de las comidas y las interacciones sociales — la saudade también se aplica al tiempo",
          "Mostrar curiosidad genuina por el fado, la Edad de los Descubrimientos y el alcance cultural mundial de Portugal",
          "Aceptar la hospitalidad generosamente — los portugueses están muy orgullosos de hacer sentir a los invitados como en casa"
        ],
        donts: [
          "Nunca referirse al portugués como 'español con acento' ni sugerir que las dos culturas son intercambiables",
          "Evitar las prisas en cualquier entorno social o profesional — la paciencia es una virtud aquí",
          "No subestimar la importancia histórica mundial de Portugal — fue el primer gran imperio marítimo",
          "Evitar comparar Portugal desfavorablemente con España en cualquier contexto social",
          "No rechazar la comida o bebida que se ofrece generosamente sin una explicación clara y respetuosa"
        ]
      },
      "pt": {
        region_name: "Portugal",
        core_value: "Hospitalidade calorosa, saudade e orgulho discreto num rico património marítimo",
        biggest_taboo: "Confundir Portugal com Espanha, ou presumir que a cultura portuguesa é derivada da do vizinho — os portugueses têm uma identidade nacional ferozmente distinta",
        dining_etiquette: "As refeições são generosas, sem pressa e profundamente sociais. O pão e as azeitonas chegam primeiro mas são cobrados à parte. Uma gorjeta de 10% é apreciada. Nunca apresse a mesa — ficar à conversa com vinho é a norma.",
        language_notes: "O português é uma língua própria com os seus ritmos — não é um dialeto do espanhol. Os brasileiros também falam português, mas as variedades diferem. Algumas palavras em português são sempre recebidas com calor.",
        gift_protocol: "Vinho de qualidade (Douro, Alentejo), pastéis locais ou produtos artesanais. Leve algo quando for convidado a casa de alguém. Os presentes são recebidos com graciosidade e abertos com calor.",
        dress_code: "Elegante e discreto. Os ambientes profissionais são sérios sem rigidez. As zonas costeiras são mais descontraídas. Ter uma aparência cuidada sinaliza respeito pela ocasião.",
        dos: [
          "Reconheça a identidade própria de Portugal — a sua língua, história e cultura são suas",
          "Aprenda algumas frases em português — será notado e apreciado",
          "Abrace o ritmo mais lento das refeições e das interações sociais — a saudade aplica-se também ao tempo",
          "Mostre curiosidade genuína pelo fado, a Era dos Descobrimentos e o alcance cultural mundial de Portugal",
          "Aceite a hospitalidade generosamente — os portugueses têm muito orgulho em fazer os convidados sentirem-se em casa"
        ],
        donts: [
          "Nunca se refira ao português como 'espanhol com sotaque' nem sugira que as duas culturas são intercambiáveis",
          "Evite a pressa em qualquer contexto social ou profissional — a paciência é uma virtude aqui",
          "Não subestime a importância histórica mundial de Portugal — foi o primeiro grande império marítimo",
          "Evite comparar Portugal desfavoravelmente com Espanha em qualquer contexto social",
          "Não recuse comida ou bebida oferecida generosamente sem uma explicação clara e respeitosa"
        ]
      },
      "it": {
        region_name: "Portogallo",
        core_value: "Ospitalità calorosa, saudade (una nostalgia agrodolce) e orgoglio discreto per un ricco patrimonio marittimo",
        biggest_taboo: "Confondere il Portogallo con la Spagna, o supporre che la cultura portoghese derivi da quella del vicino — i portoghesi hanno un'identità nazionale fieramente distinta",
        dining_etiquette: "I pasti sono generosi, senza fretta e profondamente sociali. Pane e olive arrivano per primi ma sono addebitati separatamente. Una mancia del 10% è apprezzata. Non affrettare mai la tavola — indugiare con vino e conversazione è la norma.",
        language_notes: "Il portoghese è una lingua propria con i propri ritmi — non un dialetto dello spagnolo. Anche i brasiliani parlano portoghese, ma le varietà differiscono. Qualche parola in portoghese viene sempre ricevuta calorosamente.",
        gift_protocol: "Vino di qualità (Douro, Alentejo), pasticcini locali o prodotti artigianali. Porta qualcosa quando sei invitato a casa di qualcuno. I regali sono ricevuti con grazia e aperti con calore.",
        dress_code: "Elegante e discreto. Gli ambienti professionali sono seri senza rigidità. Le zone costiere sono più rilassate. Apparire presentabili segnala rispetto per l'occasione.",
        dos: [
          "Riconoscere l'identità distinta del Portogallo — la sua lingua, storia e cultura gli appartengono",
          "Imparare alcune frasi in portoghese — verrà notato e apprezzato",
          "Abbracciare il ritmo più lento dei pasti e delle interazioni sociali — la saudade si applica anche al tempo",
          "Mostrare genuina curiosità per il fado, l'Era delle Scoperte e il raggio culturale globale del Portogallo",
          "Accettare l'ospitalità generosamente — i portoghesi sono orgogliosi di far sentire gli ospiti a casa"
        ],
        donts: [
          "Non definire mai il portoghese come 'spagnolo con accento' né suggerire che le due culture siano intercambiabili",
          "Evitare di affrettarsi in qualsiasi contesto sociale o professionale — la pazienza è una virtù qui",
          "Non sottovalutare l'importanza storica mondiale del Portogallo — fu il primo grande impero marittimo",
          "Evitare di confrontare sfavorevolmente il Portogallo con la Spagna in qualsiasi contesto sociale",
          "Non rifiutare cibo o bevande offerti generosamente senza una spiegazione chiara e rispettosa"
        ]
      },
      "ar": {
        region_name: "البرتغال",
        core_value: "الضيافة الدافئة، والسوداد (حنين حلو مرير)، والفخر المتحفظ بإرث بحري ثري",
        biggest_taboo: "الخلط بين البرتغال وإسبانيا، أو افتراض أن الثقافة البرتغالية مشتقة من ثقافة جارتها — يمتلك البرتغاليون هوية وطنية متميزة بشدة",
        dining_etiquette: "الوجبات سخية وبلا استعجال وذات طابع اجتماعي عميق. يصل الخبز والزيتون أولاً لكن يُحسب ثمنهما بشكل منفصل. يُقدَّر إكرامية بنسبة 10٪. لا تستعجل أبداً على الطاولة — البقاء في الحديث مع النبيذ والمحادثة هو القاعدة.",
        language_notes: "البرتغالية لغة مستقلة بإيقاعاتها الخاصة — وليست لهجة من الإسبانية. يتحدث البرازيليون أيضاً البرتغالية، لكن الأصناف تختلف. دائماً ما تُستقبل بضع كلمات بالبرتغالية بحفاوة.",
        gift_protocol: "نبيذ جيد (دورو، أليانتيجو)، معجنات محلية أو منتجات حرفية. احمل شيئاً عند الدعوة إلى منزل أحدهم. تُستقبل الهدايا بأناقة وتُفتح بدفء.",
        dress_code: "أنيق ومتحفظ. البيئات المهنية جادة دون تصلب. المناطق الساحلية أكثر استرخاءً. الظهور بمظهر لائق يدل على الاحترام للمناسبة.",
        dos: [
          "أقرّ بهوية البرتغال المتميزة — لغتها وتاريخها وثقافتها خاصة بها",
          "تعلم بعض العبارات بالبرتغالية — سيلاحَظ ذلك ويُقدَّر",
          "احتضن الإيقاع الأبطأ للوجبات والتفاعلات الاجتماعية — السوداد تنطبق على الوقت أيضاً",
          "أبدِ فضولاً حقيقياً تجاه موسيقى الفادو وعصر الاكتشافات والامتداد الثقافي العالمي للبرتغال",
          "اقبل الضيافة بسخاء — يفخر البرتغاليون بجعل ضيوفهم يشعرون بالراحة"
        ],
        donts: [
          "لا تصف البرتغالية أبداً بأنها 'إسبانية بلكنة' ولا تقترح أن الثقافتين قابلتان للتبادل",
          "تجنب الاستعجال في أي سياق اجتماعي أو مهني — الصبر فضيلة هنا",
          "لا تقلل من الأهمية التاريخية العالمية للبرتغال — كانت أول إمبراطورية بحرية كبرى",
          "تجنب مقارنة البرتغال بإسبانيا مقارنة غير مواتية في أي سياق اجتماعي",
          "لا ترفض الطعام أو الشراب المقدَّم بسخاء دون تفسير واضح ومحترم"
        ]
      },
      "ja": {
        region_name: "ポルトガル",
        core_value: "温かいもてなし、サウダーデ（甘く切ない郷愁）、そして豊かな海洋遺産への控えめな誇り",
        biggest_taboo: "ポルトガルをスペインと混同すること、またはポルトガル文化が隣国から派生したと思い込むこと — ポルトガル人は激しく独自の国民的アイデンティティを持つ",
        dining_etiquette: "食事は豊かで、急がず、深く社交的である。パンとオリーブが最初に出るが別途料金がかかる。チップは10%が喜ばれる。席を急かしてはいけない — ワインと会話を楽しみながら長居するのが普通である。",
        language_notes: "ポルトガル語は独自のリズムを持つ独立した言語であり、スペイン語の方言ではない。ブラジル人もポルトガル語を話すが、種類が異なる。ポルトガル語の言葉をいくつか知っているだけで温かく受け入れられる。",
        gift_protocol: "上質なワイン（ドウロ、アレンテージョ）、地元の菓子、または工芸品。誰かの自宅に招待されたら何か持参すること。贈り物は上品に受け取られ、温かく開封される。",
        dress_code: "スマートで控えめ。ビジネスシーンは堅苦しくないが真剣なプロ意識が求められる。海岸沿いはよりリラックスしている。きちんとした身なりは場への敬意を示す。",
        dos: [
          "ポルトガルの独自のアイデンティティを認める — その言語、歴史、文化は独自のものである",
          "ポルトガル語のフレーズをいくつか覚える — それは気づかれ、大切にされる",
          "食事や社交的なやりとりのゆっくりとしたペースを受け入れる — サウダーデは時間にも当てはまる",
          "ファドの音楽、大航海時代、ポルトガルの世界的な文化的広がりに真摯な好奇心を示す",
          "もてなしを惜しみなく受け入れる — ポルトガル人はゲストを家族のように感じさせることに誇りを持つ"
        ],
        donts: [
          "ポルトガル語を「なまったスペイン語」と呼んだり、両文化が互換可能だと示唆したりしない",
          "いかなる社交的・職業的場面でも急がない — ここでは忍耐が美徳である",
          "ポルトガルの世界的歴史的重要性を過小評価しない — 最初の主要な海洋帝国であった",
          "いかなる社会的文脈でもポルトガルをスペインと不利に比較しない",
          "寛大に提供された食べ物や飲み物を、明確で丁重な説明なしに断わらない"
        ]
      }
    }
  },
  {
    region_code: "ZA",
    flag_emoji: "🇿🇦",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "South Africa",
        core_value: "Ubuntu — 'I am because we are' — a profound sense of shared humanity, resilience, and community",
        biggest_taboo: "Ignoring or making light of South Africa's complex history — race, inequality, and transformation are ever-present realities that must be navigated with genuine care and awareness",
        dining_etiquette: "The braai (barbecue) is a sacred social institution — accept every invitation. Meals are generous and communal. Diverse cuisines coexist — Zulu, Cape Malay, Afrikaner, Indian. Show curiosity and appreciation for all of them.",
        language_notes: "South Africa has 11 official languages. English is the language of business but Zulu, Xhosa, Afrikaans, and Sotho are widely spoken. Learning a greeting in Zulu or Xhosa ('Sawubona', 'Molo') lands extremely well.",
        gift_protocol: "Local wine (the Cape Winelands are world-class), craft spirits, or quality regional produce. Gifts are received warmly. Bring something for the host when invited to a home.",
        dress_code: "Smart casual in most professional settings. Formal in corporate and legal environments. Outdoor and climate-appropriate dress is entirely normal given South Africa's varied geography and sunshine.",
        dos: [
          "Embrace the concept of Ubuntu — collaborative, community-minded behaviour is genuinely valued",
          "Learn a greeting in at least one African language — the effort is always remembered",
          "Accept a braai invitation without hesitation — it is one of the most important social gestures",
          "Show genuine interest in South Africa's complex and extraordinary history",
          "Appreciate the remarkable diversity of culture, cuisine, landscape, and language"
        ],
        donts: [
          "Do not reduce South Africa to safari and wildlife — it is a dynamic, complex, modern nation",
          "Avoid making careless remarks about race, politics, or the legacy of apartheid",
          "Do not assume all South Africans are alike — the country contains enormous cultural, linguistic, and regional diversity",
          "Avoid expressing surprise at South Africa's sophistication — it is a well-developed country with world-class cities",
          "Do not ignore the braai — declining without good reason is genuinely considered antisocial"
        ]
      },
      "nl": {
        region_name: "Zuid-Afrika",
        core_value: "Ubuntu — 'Ik ben omdat wij zijn' — een diep gevoel van gedeelde menselijkheid, veerkracht en gemeenschap",
        biggest_taboo: "De complexe geschiedenis van Zuid-Afrika negeren of er luchtig over doen — ras, ongelijkheid en transformatie zijn steeds aanwezige realiteiten die met oprechte zorg en bewustzijn moeten worden benaderd",
        dining_etiquette: "De braai (barbecue) is een heilige sociale instelling — accepteer elke uitnodiging. Maaltijden zijn royaal en gemeenschappelijk. Diverse keukens bestaan naast elkaar — Zoeloe, Kaaps-Maleis, Afrikaner, Indiaas. Toon nieuwsgierigheid en waardering voor allemaal.",
        language_notes: "Zuid-Afrika heeft 11 officiële talen. Engels is de taal van het bedrijfsleven, maar Zoeloe, Xhosa, Afrikaans en Sotho worden veel gesproken. Een begroeting leren in het Zoeloe of Xhosa ('Sawubona', 'Molo') maakt enorme indruk.",
        gift_protocol: "Lokale wijn (de Kaapse Wijnlanden zijn wereldklasse), ambachtelijke gedistilleerde dranken of kwaliteitsvolle regionale producten. Cadeaus worden warm ontvangen. Neem iets mee voor de gastheer als je bij iemand thuis wordt uitgenodigd.",
        dress_code: "Smart casual in de meeste professionele omgevingen. Formeel in zakelijke en juridische omgevingen. Buiten- en klimaatgeschikte kleding is heel normaal gezien de gevarieerde geografie en het zonnige klimaat van Zuid-Afrika.",
        dos: [
          "Omarm het concept Ubuntu — samenwerkend, gemeenschapsgericht gedrag wordt oprecht gewaardeerd",
          "Leer een begroeting in minstens één Afrikaanse taal — de moeite wordt altijd onthouden",
          "Accepteer een braai-uitnodiging zonder aarzeling — het is een van de belangrijkste sociale gebaren",
          "Toon oprechte interesse in de complexe en buitengewone geschiedenis van Zuid-Afrika",
          "Waardeer de opmerkelijke diversiteit van cultuur, keuken, landschap en taal"
        ],
        donts: [
          "Reduceer Zuid-Afrika niet tot safari en wilde dieren — het is een dynamische, complexe, moderne natie",
          "Maak geen achteloze opmerkingen over ras, politiek of het erfgoed van de apartheid",
          "Ga er niet van uit dat alle Zuid-Afrikanen gelijk zijn — het land bevat enorme culturele, taalkundige en regionale diversiteit",
          "Toon geen verbazing over de verfijning van Zuid-Afrika — het is een goed ontwikkeld land met wereldklasse steden",
          "Negeer de braai niet — weigeren zonder goede reden wordt oprecht als onsociaal beschouwd"
        ]
      },
      "fr": {
        region_name: "Afrique du Sud",
        core_value: "Ubuntu — 'Je suis parce que nous sommes' — un sens profond d'humanité partagée, de résilience et de communauté",
        biggest_taboo: "Ignorer ou minimiser l'histoire complexe de l'Afrique du Sud — la race, les inégalités et la transformation sont des réalités omniprésentes qui doivent être abordées avec un soin et une conscience véritables",
        dining_etiquette: "Le braai (barbecue) est une institution sociale sacrée — acceptez chaque invitation. Les repas sont généreux et communautaires. Des cuisines diverses coexistent — zouloue, malaise du Cap, afrikaner, indienne. Montrez de la curiosité et de l'appréciation pour toutes.",
        language_notes: "L'Afrique du Sud a 11 langues officielles. L'anglais est la langue des affaires, mais le zoulou, le xhosa, l'afrikaans et le sotho sont largement parlés. Apprendre une salutation en zoulou ou en xhosa ('Sawubona', 'Molo') crée une excellente impression.",
        gift_protocol: "Vin local (les Vignobles du Cap sont de classe mondiale), spiritueux artisanaux ou produits régionaux de qualité. Les cadeaux sont reçus chaleureusement. Apportez quelque chose pour l'hôte lorsque vous êtes invité chez quelqu'un.",
        dress_code: "Smart casual dans la plupart des environnements professionnels. Formel dans les environnements d'entreprise et juridiques. Les tenues extérieures et adaptées au climat sont tout à fait normales compte tenu de la géographie variée et du soleil de l'Afrique du Sud.",
        dos: [
          "Embracer le concept d'Ubuntu — un comportement collaboratif et tourné vers la communauté est véritablement valorisé",
          "Apprendre une salutation dans au moins une langue africaine — l'effort est toujours mémorisé",
          "Accepter une invitation au braai sans hésitation — c'est l'un des gestes sociaux les plus importants",
          "Montrer un intérêt sincère pour l'histoire complexe et extraordinaire de l'Afrique du Sud",
          "Apprécier la remarquable diversité de culture, de cuisine, de paysage et de langue"
        ],
        donts: [
          "Ne pas réduire l'Afrique du Sud au safari et à la faune sauvage — c'est une nation dynamique, complexe et moderne",
          "Éviter les remarques irréfléchies sur la race, la politique ou l'héritage de l'apartheid",
          "Ne pas supposer que tous les Sud-Africains se ressemblent — le pays contient une énorme diversité culturelle, linguistique et régionale",
          "Éviter d'exprimer sa surprise face à la sophistication de l'Afrique du Sud — c'est un pays bien développé avec des villes de classe mondiale",
          "Ne pas ignorer le braai — refuser sans bonne raison est véritablement considéré comme antisocial"
        ]
      },
      "de": {
        region_name: "Südafrika",
        core_value: "Ubuntu — 'Ich bin, weil wir sind' — ein tiefes Gefühl gemeinsamer Menschlichkeit, Widerstandskraft und Gemeinschaft",
        biggest_taboo: "Südafrikas komplexe Geschichte zu ignorieren oder zu verharmlosen — Rasse, Ungleichheit und Transformation sind allgegenwärtige Realitäten, die mit echter Sorgfalt und Bewusstsein angegangen werden müssen",
        dining_etiquette: "Das Braai (Grillparty) ist eine heilige soziale Institution — nehme jede Einladung an. Mahlzeiten sind großzügig und gemeinschaftlich. Verschiedene Küchen koexistieren — Zulu, Kap-Malaiisch, Afrikaner, Indisch. Zeige Neugier und Wertschätzung für alle.",
        language_notes: "Südafrika hat 11 Amtssprachen. Englisch ist die Sprache der Wirtschaft, aber Zulu, Xhosa, Afrikaans und Sotho werden weit verbreitet gesprochen. Einen Gruß auf Zulu oder Xhosa zu lernen ('Sawubona', 'Molo') kommt äußerst gut an.",
        gift_protocol: "Lokaler Wein (die Kap-Weinregion ist weltklasse), handwerkliche Spirituosen oder qualitativ hochwertige regionale Erzeugnisse. Geschenke werden herzlich empfangen. Bringe dem Gastgeber etwas mit, wenn du zu jemandem nach Hause eingeladen wirst.",
        dress_code: "Smart Casual in den meisten professionellen Umgebungen. Formell in Unternehmens- und Rechtsumgebungen. Outdoor- und klimaangepasste Kleidung ist angesichts der vielfältigen Geographie und des Sonnenscheins Südafrikas völlig normal.",
        dos: [
          "Das Konzept Ubuntu annehmen — kooperatives, gemeinschaftsorientiertes Verhalten wird aufrichtig geschätzt",
          "Einen Gruß in mindestens einer afrikanischen Sprache lernen — die Mühe wird immer erinnert",
          "Eine Braai-Einladung ohne Zögern annehmen — es ist eine der wichtigsten sozialen Gesten",
          "Aufrichtiges Interesse an Südafrikas komplexer und außergewöhnlicher Geschichte zeigen",
          "Die bemerkenswerte Vielfalt an Kultur, Küche, Landschaft und Sprache schätzen"
        ],
        donts: [
          "Südafrika nicht auf Safari und Wildtiere reduzieren — es ist eine dynamische, komplexe, moderne Nation",
          "Keine leichtfertigen Bemerkungen über Rasse, Politik oder das Erbe der Apartheid machen",
          "Nicht davon ausgehen, dass alle Südafrikaner gleich sind — das Land enthält enorme kulturelle, sprachliche und regionale Vielfalt",
          "Keine Überraschung über Südafrikas Kultiviertheit ausdrücken — es ist ein gut entwickeltes Land mit Weltklasse-Städten",
          "Das Braai nicht ignorieren — ohne guten Grund abzulehnen wird wirklich als asozial angesehen"
        ]
      },
      "es": {
        region_name: "Sudáfrica",
        core_value: "Ubuntu — 'Soy porque somos' — un profundo sentido de humanidad compartida, resiliencia y comunidad",
        biggest_taboo: "Ignorar o minimizar la compleja historia de Sudáfrica — la raza, la desigualdad y la transformación son realidades omnipresentes que deben abordarse con genuino cuidado y conciencia",
        dining_etiquette: "El braai (barbacoa) es una institución social sagrada — acepta cada invitación. Las comidas son generosas y comunales. Coexisten diversas cocinas — zulú, malaya del Cabo, afrikáner, india. Muestra curiosidad y aprecio por todas ellas.",
        language_notes: "Sudáfrica tiene 11 lenguas oficiales. El inglés es el idioma de los negocios, pero el zulú, el xhosa, el afrikáans y el sotho se hablan ampliamente. Aprender un saludo en zulú o xhosa ('Sawubona', 'Molo') causa una excelente impresión.",
        gift_protocol: "Vino local (los viñedos del Cabo son de clase mundial), licores artesanales o productos regionales de calidad. Los regalos se reciben con calidez. Lleva algo para el anfitrión cuando te inviten a casa de alguien.",
        dress_code: "Smart casual en la mayoría de los entornos profesionales. Formal en entornos corporativos y legales. La ropa de exterior y adecuada al clima es completamente normal dada la variada geografía y el sol de Sudáfrica.",
        dos: [
          "Abrazar el concepto de Ubuntu — el comportamiento colaborativo y orientado a la comunidad es genuinamente valorado",
          "Aprender un saludo en al menos una lengua africana — el esfuerzo siempre se recuerda",
          "Aceptar una invitación al braai sin dudarlo — es uno de los gestos sociales más importantes",
          "Mostrar interés genuino en la compleja y extraordinaria historia de Sudáfrica",
          "Apreciar la notable diversidad de cultura, cocina, paisaje y lengua"
        ],
        donts: [
          "No reducir Sudáfrica al safari y la fauna salvaje — es una nación dinámica, compleja y moderna",
          "Evitar comentarios descuidados sobre la raza, la política o el legado del apartheid",
          "No asumir que todos los sudafricanos son iguales — el país contiene una enorme diversidad cultural, lingüística y regional",
          "Evitar expresar sorpresa ante la sofisticación de Sudáfrica — es un país bien desarrollado con ciudades de clase mundial",
          "No ignorar el braai — rechazarlo sin buena razón es considerado genuinamente antisocial"
        ]
      },
      "pt": {
        region_name: "África do Sul",
        core_value: "Ubuntu — 'Sou porque somos' — um profundo sentido de humanidade partilhada, resiliência e comunidade",
        biggest_taboo: "Ignorar ou desvalorizar a complexa história da África do Sul — raça, desigualdade e transformação são realidades sempre presentes que devem ser abordadas com genuíno cuidado e consciência",
        dining_etiquette: "O braai (churrasco) é uma instituição social sagrada — aceite cada convite. As refeições são generosas e comunais. Diversas cozinhas coexistem — Zulu, Cabo Malaio, Afrikaners, Indiana. Mostre curiosidade e apreço por todas elas.",
        language_notes: "A África do Sul tem 11 línguas oficiais. O inglês é a língua dos negócios, mas o zulu, o xhosa, o afrikaans e o sotho são muito falados. Aprender uma saudação em zulu ou xhosa ('Sawubona', 'Molo') causa uma excelente impressão.",
        gift_protocol: "Vinho local (os Vinhedos do Cabo são de classe mundial), bebidas espirituosas artesanais ou produtos regionais de qualidade. Os presentes são recebidos com calor. Leve algo para o anfitrião quando for convidado a casa de alguém.",
        dress_code: "Smart casual na maioria dos ambientes profissionais. Formal em ambientes empresariais e jurídicos. Roupa de exterior e adequada ao clima é completamente normal dada a variada geografia e o sol da África do Sul.",
        dos: [
          "Adotar o conceito de Ubuntu — o comportamento colaborativo e orientado para a comunidade é genuinamente valorizado",
          "Aprender uma saudação em pelo menos uma língua africana — o esforço é sempre lembrado",
          "Aceitar um convite para o braai sem hesitar — é um dos gestos sociais mais importantes",
          "Mostrar genuíno interesse na história complexa e extraordinária da África do Sul",
          "Apreciar a notável diversidade de cultura, culinária, paisagem e língua"
        ],
        donts: [
          "Não reduzir a África do Sul a safaris e vida selvagem — é uma nação dinâmica, complexa e moderna",
          "Evitar comentários descuidados sobre raça, política ou o legado do apartheid",
          "Não assumir que todos os sul-africanos são iguais — o país contém enorme diversidade cultural, linguística e regional",
          "Evitar expressar surpresa com a sofisticação da África do Sul — é um país bem desenvolvido com cidades de classe mundial",
          "Não ignorar o braai — recusar sem boa razão é genuinamente considerado antissocial"
        ]
      },
      "it": {
        region_name: "Sudafrica",
        core_value: "Ubuntu — 'Sono perché siamo' — un profondo senso di umanità condivisa, resilienza e comunità",
        biggest_taboo: "Ignorare o sminuire la complessa storia del Sudafrica — razza, disuguaglianza e trasformazione sono realtà onnipresenti che devono essere affrontate con genuina cura e consapevolezza",
        dining_etiquette: "Il braai (barbecue) è una sacra istituzione sociale — accetta ogni invito. I pasti sono generosi e comunitari. Diverse cucine coesistono — zulù, malese del Capo, afrikaner, indiana. Mostra curiosità e apprezzamento per tutte.",
        language_notes: "Il Sudafrica ha 11 lingue ufficiali. L'inglese è la lingua degli affari, ma zulù, xhosa, afrikaans e sotho sono ampiamente parlati. Imparare un saluto in zulù o xhosa ('Sawubona', 'Molo') fa un'ottima impressione.",
        gift_protocol: "Vino locale (le Terre Vinicole del Capo sono di livello mondiale), liquori artigianali o prodotti regionali di qualità. I regali vengono ricevuti calorosamente. Porta qualcosa per il padrone di casa quando sei invitato a casa di qualcuno.",
        dress_code: "Smart casual nella maggior parte degli ambienti professionali. Formale in ambienti aziendali e legali. L'abbigliamento outdoor e adatto al clima è del tutto normale data la varia geografia e il sole del Sudafrica.",
        dos: [
          "Abbracciare il concetto di Ubuntu — il comportamento collaborativo e orientato alla comunità è genuinamente valorizzato",
          "Imparare un saluto in almeno una lingua africana — lo sforzo viene sempre ricordato",
          "Accettare un invito al braai senza esitazione — è uno dei gesti sociali più importanti",
          "Mostrare genuino interesse nella storia complessa e straordinaria del Sudafrica",
          "Apprezzare la notevole diversità di cultura, cucina, paesaggio e lingua"
        ],
        donts: [
          "Non ridurre il Sudafrica a safari e fauna selvatica — è una nazione dinamica, complessa e moderna",
          "Evitare osservazioni avventate su razza, politica o l'eredità dell'apartheid",
          "Non supporre che tutti i sudafricani siano uguali — il paese contiene enorme diversità culturale, linguistica e regionale",
          "Evitare di esprimere sorpresa per la sofisticazione del Sudafrica — è un paese ben sviluppato con città di livello mondiale",
          "Non ignorare il braai — rifiutare senza buona ragione è genuinamente considerato antisociale"
        ]
      },
      "ar": {
        region_name: "جنوب أفريقيا",
        core_value: "أوبونتو — 'أنا موجود لأننا موجودون' — إحساس عميق بالإنسانية المشتركة والصمود والمجتمع",
        biggest_taboo: "تجاهل التاريخ المعقد لجنوب أفريقيا أو الاستهانة به — العرق وعدم المساواة والتحول واقع دائم الحضور يجب التعامل معه بعناية ووعي حقيقيين",
        dining_etiquette: "البراي (الشواء) مؤسسة اجتماعية مقدسة — اقبل كل دعوة. الوجبات سخية ومشتركة. مطابخ متنوعة تتعايش — زولو، مالاوية الرأس، أفريكانر، هندية. أبدِ فضولاً وتقديراً لجميعها.",
        language_notes: "تمتلك جنوب أفريقيا 11 لغة رسمية. الإنجليزية هي لغة الأعمال، لكن الزولو والكوسا والأفريكانية والسوتو تُتحدَّث على نطاق واسع. تعلم تحية بالزولو أو الكوسا ('Sawubona'، 'Molo') يُحدث أثراً بالغاً.",
        gift_protocol: "النبيذ المحلي (أودية الخمور في الرأس ذات مستوى عالمي)، المشروبات الروحية الحرفية أو المنتجات الإقليمية الجيدة. تُستقبل الهدايا بدفء. احمل شيئاً للمضيف عند الدعوة إلى منزل أحدهم.",
        dress_code: "سمارت كاجوال في معظم البيئات المهنية. رسمي في البيئات المؤسسية والقانونية. الملابس الخارجية والمناسبة للمناخ طبيعية تماماً نظراً للجغرافيا المتنوعة وأشعة الشمس في جنوب أفريقيا.",
        dos: [
          "اعتنق مفهوم أوبونتو — السلوك التعاوني الموجه نحو المجتمع يُقدَّر بصدق",
          "تعلم تحية بلغة أفريقية واحدة على الأقل — الجهد يُذكَر دائماً",
          "اقبل دعوة البراي دون تردد — إنها من أهم الإيماءات الاجتماعية",
          "أبدِ اهتماماً حقيقياً بالتاريخ المعقد والاستثنائي لجنوب أفريقيا",
          "قدّر التنوع الرائع في الثقافة والمطبخ والمناظر الطبيعية واللغة"
        ],
        donts: [
          "لا تختزل جنوب أفريقيا في السفاري والحياة البرية — إنها أمة ديناميكية ومعقدة وحديثة",
          "تجنب التعليقات غير المدروسة حول العرق والسياسة أو إرث الفصل العنصري",
          "لا تفترض أن جميع جنوب أفريقيين متشابهون — البلاد تحتوي على تنوع ثقافي ولغوي وإقليمي هائل",
          "تجنب إبداء الدهشة من تطور جنوب أفريقيا — إنها بلد متطور بمدن ذات مستوى عالمي",
          "لا تتجاهل البراي — الرفض دون سبب وجيه يُعدّ فعلاً منافياً للأخلاق الاجتماعية"
        ]
      },
      "ja": {
        region_name: "南アフリカ",
        core_value: "ウブントゥ — 「私たちがいるから私は存在する」— 共有された人間性、回復力、そしてコミュニティへの深い意識",
        biggest_taboo: "南アフリカの複雑な歴史を無視したり軽視したりすること — 人種、不平等、変革は常に存在する現実であり、真摯な配慮と意識を持って向き合わなければならない",
        dining_etiquette: "ブラーイ（バーベキュー）は神聖な社会的慣習である — すべての招待を受け入れること。食事は寛大で共同的である。多様な料理が共存する — ズールー、ケープマレー、アフリカーナー、インド。すべてに好奇心と感謝を示すこと。",
        language_notes: "南アフリカには11の公用語がある。英語がビジネスの言語だが、ズールー語、コサ語、アフリカーンス語、ソト語が広く話されている。ズールー語かコサ語で挨拶を覚えること（'Sawubona'、'Molo'）は非常に良い印象を与える。",
        gift_protocol: "地元のワイン（ケープワインランドは世界クラス）、クラフトスピリッツ、または質の高い地域の産品。贈り物は温かく受け取られる。誰かの自宅に招待されたら主人への贈り物を持参すること。",
        dress_code: "ほとんどのプロフェッショナルな場ではスマートカジュアル。企業や法律関連の場ではフォーマル。南アフリカの多様な地形と陽光を考えると、アウトドアや気候に合った服装は完全に普通である。",
        dos: [
          "ウブントゥの概念を受け入れる — 協調的でコミュニティ志向の行動は真に価値があるとされる",
          "少なくとも一つのアフリカ語で挨拶を覚える — その努力は常に記憶される",
          "ブラーイの招待をためらわず受け入れる — 最も重要な社会的ジェスチャーの一つである",
          "南アフリカの複雑で並外れた歴史に真摯な関心を示す",
          "文化、料理、景観、言語の顕著な多様性を称える"
        ],
        donts: [
          "南アフリカをサファリと野生動物だけに矮小化しない — それは活力ある複雑な現代国家である",
          "人種、政治、またはアパルトヘイトの遺産について不用意な発言をしない",
          "すべての南アフリカ人が同じだと思い込まない — この国には巨大な文化的、言語的、地域的多様性がある",
          "南アフリカの洗練さに驚きを示さない — それは世界クラスの都市を持つ十分に発展した国家である",
          "ブラーイを無視しない — 正当な理由なく断ることは本当に非社交的とみなされる"
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
