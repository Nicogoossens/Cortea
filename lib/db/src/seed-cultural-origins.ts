import { db } from "./index.js";
import { culturalOriginsTable } from "./schema/index.js";
import { sql } from "drizzle-orm";

const origins: (typeof culturalOriginsTable.$inferInsert)[] = [
  // ── UNITED KINGDOM ───────────────────────────────────────────────────────────
  {
    region_code: "GB",
    domain: "dining",
    tradition: "The Queue",
    origin_summary: "The British queue emerged as a civic institution during the Industrial Revolution when urban density created competition for limited resources — from omnibus seats to market stalls. The practice crystallised during the World War II rationing era, when orderly queuing was framed as a patriotic act and marker of national character. Patience in waiting became synonymous with fairness, self-discipline, and collective decency.",
    era: "19th–20th century (Industrial Revolution to WWII)",
    influences: ["Civic egalitarianism", "Wartime rationing culture", "Protestant work ethic", "Urban industrialisation"],
    connected_rule: "Joining the back of the queue without question is the only acceptable behaviour. Patience is worn with quiet pride.",
  },
  {
    region_code: "GB",
    domain: "dining",
    tradition: "Port Passes Left",
    origin_summary: "The custom of passing the port decanter clockwise (to the left) at formal dinners dates to the 18th-century Royal Navy. One theory holds that the left was the sword-fighting hand's side, kept free for defence — passing to the left thus kept the right hand available. Another attributes it to naval mess tradition where the host poured for the guest to his left first. By the Regency period the custom was entrenched in aristocratic dining.",
    era: "18th century (Georgian / Royal Navy era)",
    influences: ["Royal Navy mess traditions", "Aristocratic dining codes", "Georgian gentlemen's clubs"],
    connected_rule: "At formal dinners, port circulates clockwise (passing to the left). One never reaches across; the decanter always travels.",
  },
  {
    region_code: "GB",
    domain: "greetings",
    tradition: "British Understatement",
    origin_summary: "Understatement as a communicative virtue is rooted in the English Reformation's suspicion of Catholic excess and the 18th-century Enlightenment ideal of reason over passion. The Victorian public school system codified emotional restraint as a class marker — boys were trained to suppress outward feeling as evidence of strength of character. This filtered into everyday speech patterns where hyperbole became vulgar and understatement became elegant.",
    era: "16th–19th century (Reformation through Victorian era)",
    influences: ["Protestant restraint", "Public school codes", "Enlightenment rationalism", "Class differentiation"],
    connected_rule: "British communication relies heavily on understatement. 'Not bad' is high praise; 'quite interesting' may signal disapproval.",
  },
  {
    region_code: "GB",
    domain: "dining",
    tradition: "The Tea Ritual",
    origin_summary: "Tea arrived in Britain in the 1650s via the East India Company's trade with China. By the 18th century it had displaced ale as the national drink as the middle classes adopted it. The ritual of offering tea as a greeting gesture emerged from drawing-room culture of the Georgian period, when the hostess's management of the tea service demonstrated social accomplishment. By the Victorian era, accepting tea was a mark of reciprocal social trust.",
    era: "17th–19th century (Stuart through Victorian era)",
    influences: ["East India Company trade", "Georgian drawing-room culture", "Victorian domesticity", "Temperance movement"],
    connected_rule: "When offered tea, accept. Even if you do not wish it, refusal can cause slight offence. 'Just a small cup' is always acceptable.",
  },
  {
    region_code: "GB",
    domain: "business",
    tradition: "Indirect Refusal",
    origin_summary: "The British tradition of indirect communication, particularly in declining requests, evolved from a combination of Quaker plain-speaking reaction (the aristocracy's antithesis) and the 18th-century politeness movement championed by figures like Lord Chesterfield. Direct refusal was associated with aggression or low breeding. The Georgian and Regency ideal of the 'gentleman' required that social friction be navigated through oblique language rather than blunt assertion.",
    era: "18th century (Georgian / Regency period)",
    influences: ["Aristocratic politeness codes", "Lord Chesterfield's Letters", "Class-based social navigation"],
    connected_rule: "Direct refusals are considered blunt. 'I'm afraid that might be a little difficult' signals a firm no in polite British discourse.",
  },

  // ── CHINA ────────────────────────────────────────────────────────────────────
  {
    region_code: "CN",
    domain: "business",
    tradition: "Mianzi — The Concept of Face",
    origin_summary: "Mianzi (面子, social face) as an organising principle of Chinese social life is rooted in Confucian philosophy dating to the 5th century BCE. Confucius taught that social harmony depended on each person fulfilling their role with dignity and that public shame disrupted the cosmic order of relationships. The concept of 'lian' (moral face) and 'mianzi' (social prestige) became foundational to Chinese dynastic administration — an official who caused a superior to lose face risked career destruction.",
    era: "5th century BCE – Imperial era (Confucian through Qing dynasty)",
    influences: ["Confucian philosophy", "Imperial bureaucracy", "Hierarchical social structure", "Collective identity values"],
    connected_rule: "Mianzi (face) is one's social currency. Never cause someone to lose face publicly; disagreements should be handled discreetly.",
  },
  {
    region_code: "CN",
    domain: "dining",
    tradition: "Chopstick Funeral Taboo",
    origin_summary: "The taboo against placing chopsticks vertically in a rice bowl derives from the Chinese funeral tradition of offering incense sticks upright in bowls of rice or sand at ancestral shrines. This practice dates to the Han dynasty (206 BCE – 220 CE) and remains central to Qingming Festival ancestor veneration. The visual similarity between upright incense sticks and vertically placed chopsticks makes the gesture an involuntary evocation of death at the dining table — among the most inauspicious associations in Chinese culture.",
    era: "Han dynasty (206 BCE – 220 CE)",
    influences: ["Ancestor veneration rituals", "Taoist and Buddhist funeral rites", "Qingming Festival tradition"],
    connected_rule: "Never place chopsticks vertically in a rice bowl — this resembles incense sticks used in funeral rites. Rest them on the holder.",
  },
  {
    region_code: "CN",
    domain: "dining",
    tradition: "Two-Finger Tea Tap",
    origin_summary: "The gesture of tapping two fingers on the table to thank someone for refilling your tea originates in a story from the Qing dynasty (1644–1912). The Qianlong Emperor, travelling incognito, reportedly poured tea for a servant — a reversal of the expected hierarchy. The servant, unable to bow without exposing the Emperor's identity, tapped his fingers on the table to simulate a discreet kowtow. The gesture passed into broader tea culture as a silent expression of gratitude.",
    era: "Qing dynasty (18th century)",
    influences: ["Imperial court ritual", "Kowtow tradition", "Tea ceremony culture"],
    connected_rule: "When someone refills your tea, tap two fingers gently on the table — a discreet thank you rooted in historical court etiquette.",
  },
  {
    region_code: "CN",
    domain: "greetings",
    tradition: "Seniority in Greetings",
    origin_summary: "The principle of greeting elders and superiors first is a direct expression of Confucian filial piety (孝, xiào), which places respect for age and hierarchy at the centre of moral life. The Five Relationships of Confucius — ruler/subject, parent/child, husband/wife, elder/younger, friend/friend — each prescribed specific forms of deference. The Tang dynasty (618–907 CE) codified these into formal court protocol, and Ming dynasty etiquette manuals generalised them for everyday life.",
    era: "5th century BCE – Ming dynasty (551 BCE – 1644 CE)",
    influences: ["Confucian filial piety", "Tang dynasty court protocol", "Ming etiquette manuals"],
    connected_rule: "Age and seniority command deference. Greet the eldest or most senior person first in any gathering.",
  },
  {
    region_code: "CN",
    domain: "gift-giving",
    tradition: "Clock-Giving Taboo",
    origin_summary: "The taboo against giving clocks as gifts in China arises from a linguistic homophony: 'to give a clock' (送钟, sòng zhōng) sounds identical to 'to attend a funeral' (送终, sòng zhōng) in Mandarin. This phonetic coincidence made clock-gifting deeply inauspicious by the late Qing dynasty, when Western clocks became common luxury imports. The taboo intensified as the association with death became culturally entrenched through repetition and popular awareness.",
    era: "Late Qing dynasty (19th century)",
    influences: ["Linguistic homophony in Mandarin", "Western trade and imports", "Death taboo culture", "Gift-giving etiquette codification"],
    connected_rule: "Never gift a clock — 'sòng zhōng' (giving a clock) is a homophone for 'attending a funeral' and is deeply inauspicious.",
  },

  // ── CANADA ───────────────────────────────────────────────────────────────────
  {
    region_code: "CA",
    domain: "greetings",
    tradition: "The Canadian Apology",
    origin_summary: "Canada's reflexive culture of apology is rooted in several convergent traditions: British colonial politeness codes, the Quaker and Mennonite settler communities who settled the prairies with values of humility and peaceableness, and the legal-cultural context of a multicultural society where linguistic apology serves as social lubricant between communities. Unlike American assertiveness norms, Canadian culture inherited British indirectness while developing its own distinct egalitarian flavour through the 20th century.",
    era: "19th–20th century (Colonial period through multiculturalism era)",
    influences: ["British colonial politeness", "Quaker and Mennonite settler values", "Multicultural social navigation", "Bilingual social context"],
    connected_rule: "Canadians apologise reflexively and frequently. 'Sorry' functions as a social lubricant, not necessarily an admission of fault.",
  },
  {
    region_code: "CA",
    domain: "business",
    tradition: "Never Compare to the US",
    origin_summary: "Canadian national identity was forged in deliberate distinction from its southern neighbour. The War of 1812, during which British-Canadian forces repelled American invasion, became a founding myth of Canadian distinctiveness. The 20th century brought economic and cultural pressures of Americanisation — Hollywood, consumer culture, foreign policy proximity — that made maintaining distinct identity a national preoccupation. Pierre Trudeau's 1971 Multiculturalism Policy crystallised Canada's self-understanding as a culturally plural, internationally distinct society.",
    era: "19th–20th century (War of 1812 through Trudeau era)",
    influences: ["War of 1812 national mythology", "British Commonwealth identity", "Trudeau multiculturalism policy", "Anti-Americanisation sentiment"],
    connected_rule: "Comparing Canada unfavourably to the United States or assuming they are interchangeable cultures is a reliable way to give offence.",
  },
  {
    region_code: "CA",
    domain: "greetings",
    tradition: "Bonjour/Hi Bilingual Greeting",
    origin_summary: "The dual greeting 'Bonjour/Hi' is a product of Quebec's unique political and cultural history. Quebec's French-speaking majority was enshrined in law through the Official Languages Act (1969) and Quebec's own Charter of the French Language (Bill 101, 1977), which mandated French as the language of work and public life. The hybrid greeting emerged in Montreal's bilingual service environment as a diplomatic acknowledgement of both linguistic communities — a daily enactment of the bilingual compact.",
    era: "20th century (1969 Official Languages Act and Bill 101)",
    influences: ["Official Languages Act 1969", "Quebec Charter of the French Language (Bill 101)", "Montreal bilingual culture", "Quiet Revolution"],
    connected_rule: "In Quebec and officially bilingual contexts, acknowledging French culture and language demonstrates respect. Attempting a word of French is warmly received.",
  },
  {
    region_code: "CA",
    domain: "dining",
    tradition: "Tim Hortons as Cultural Icon",
    origin_summary: "Tim Hortons was founded in 1964 by hockey player Tim Horton in Hamilton, Ontario, as an affordable coffee-and-donut chain. Its identity became inseparable from working-class Canadian values — accessibility, unpretentiousness, and community. The 'double-double' (two creams, two sugars) became a national shorthand for unaffected Canadian taste. Politicians from Trudeau to Harper made pilgrimages to Tim Hortons to signal connection with 'ordinary Canadians', cementing its status as a cultural institution beyond mere commerce.",
    era: "20th century (1964 founding through political symbolism era)",
    influences: ["Hockey culture", "Working-class egalitarianism", "Anti-elitist identity", "Political symbolism"],
    connected_rule: "Tim Hortons is a cultural institution. Sharing a 'double-double' (coffee with two creams and two sugars) is a Canadian social ritual.",
  },
  {
    region_code: "CA",
    domain: "business",
    tradition: "Punctuality as Respect",
    origin_summary: "Canadian punctuality norms derive from a blend of British colonial time-discipline — the railway and industrial time that structured colonial life — and the Protestant work ethic values brought by Scottish and English settlers. Unlike Mediterranean or Latin American cultures where relationship-building may override clock time, Canadian professional culture inherited Northern European precision as a civic virtue. In the multicultural context, punctuality also became a mark of respect across cultural difference.",
    era: "19th century (Colonial through industrial era)",
    influences: ["British railway time-discipline", "Protestant work ethic", "Scottish settler culture", "Multicultural professional norms"],
    connected_rule: "Arriving on time is expected. If delayed, notify the host or other party promptly. Unexplained lateness is considered disrespectful.",
  },

  // ── JAPAN ────────────────────────────────────────────────────────────────────
  {
    region_code: "JP", domain: "dining", tradition: "Itadakimasu and Gochisousama",
    origin_summary: "The pre-meal phrase 'itadakimasu' (literally 'I humbly receive') and the post-meal 'gochisousama deshita' ('it was a feast') are rooted in Buddhist and Shinto traditions of gratitude toward all beings — farmers, cooks, and the lives of plants and animals — that contributed to the meal. Codified in the Edo period (1603–1868) as everyday household practice, the phrases survived secularisation as a marker of cultivated respect for food and labour.",
    era: "Edo period (1603–1868), with Buddhist roots",
    influences: ["Buddhist non-harm doctrine", "Shinto reverence for nature", "Edo merchant household codes"],
    connected_rule: "Say 'itadakimasu' before eating and 'gochisousama deshita' after; never begin before the host or eldest signals.",
  },
  {
    region_code: "JP", domain: "business", tradition: "Meishi — The Business Card Ritual",
    origin_summary: "The meishi (名刺) exchange ritual emerged from Edo-period merchant practice, in which a folded paper bearing one's name and household seal was presented at first contact to establish standing. After the Meiji Restoration (1868) reorganised society around bureaucratic offices, the printed business card became the primary token of professional identity. The two-handed presentation, slight bow, and careful study of the received card preserve samurai-era protocols of formal introduction.",
    era: "Edo through Meiji eras (17th–19th century)",
    influences: ["Edo merchant household seals", "Samurai introduction protocols", "Meiji bureaucratic modernisation"],
    connected_rule: "Receive a meishi with both hands and a slight bow. Read it carefully and place it respectfully on the table — never pocket it or write on it during the meeting.",
  },
  {
    region_code: "JP", domain: "greetings", tradition: "Ojigi — The Bow",
    origin_summary: "Ojigi (お辞儀) as a graduated communicative gesture descends from Heian-era (794–1185) court protocol, in which the depth and duration of a bow signalled relative rank with mathematical precision. The samurai class refined these distinctions; Meiji-era etiquette manuals codified them for the modern professional class. The eshaku (15°), keirei (30°), and saikeirei (45°+) bows persist in business and ceremonial life as a visible grammar of respect.",
    era: "Heian through Meiji periods (8th–19th century)",
    influences: ["Heian court protocol", "Samurai rank etiquette", "Meiji etiquette manuals"],
    connected_rule: "Match the depth of your bow to the formality of the encounter. A slight nod suffices for casual greetings; deeper bows mark gratitude, apology, or respect for seniority.",
  },
  {
    region_code: "JP", domain: "gift-giving", tradition: "Omiyage — Travel Gifts",
    origin_summary: "The custom of bringing back small regional gifts (omiyage, お土産) from any trip began with Edo-period pilgrimages to shrines such as Ise. Pilgrims returned with sacred talismans for those who had financially supported the journey; the practice secularised into the obligation to bring colleagues and family region-specific sweets or crafts. The Japan National Railway's 19th-century expansion industrialised the tradition by producing station-specific specialities at every major stop.",
    era: "Edo period through Meiji railway era",
    influences: ["Ise shrine pilgrimage tradition", "Edo gift-economy reciprocity", "Meiji railway commerce"],
    connected_rule: "After any trip, bring small wrapped regional sweets or specialities for colleagues and close contacts — the gesture matters more than the value.",
  },
  {
    region_code: "JP", domain: "business", tradition: "Honne and Tatemae",
    origin_summary: "The distinction between honne (本音, true feeling) and tatemae (建前, the public face one shows) crystallised during the Tokugawa period (1603–1868), when rigid social hierarchies and the proximity of village life made overt disagreement socially destabilising. Confucian ethics absorbed from China reinforced harmony (wa, 和) as the supreme social virtue. Public restraint of personal opinion became — and remains — a mark of maturity and civic care.",
    era: "Tokugawa period through modern era",
    influences: ["Confucian harmony ethic", "Tokugawa village proximity", "Wa (collective harmony) doctrine"],
    connected_rule: "Direct contradiction in public is rare. Read indirect signals carefully; a polite 'it is difficult' (chotto muzukashii) typically signals refusal.",
  },

  // ── GERMANY ──────────────────────────────────────────────────────────────────
  {
    region_code: "DE", domain: "business", tradition: "Pünktlichkeit — Punctuality as Moral Duty",
    origin_summary: "German punctuality has its roots in the Prussian state-building of Frederick the Great (r. 1740–1786), who imposed military timekeeping discipline on the civil service and educational system. The 19th-century industrial expansion under Bismarck institutionalised railway-time across the Reich. Lutheran and Reformed Protestant ethics framed reliable use of time as a moral obligation to one's neighbour — making lateness a small theft from another's day.",
    era: "18th–19th century (Prussian to Wilhelmine era)",
    influences: ["Prussian military discipline", "Lutheran work ethic", "Bismarck-era industrial railway time"],
    connected_rule: "Arrive precisely on time — neither early nor late. Notify the host immediately if delayed; unexplained tardiness is taken as disrespect.",
  },
  {
    region_code: "DE", domain: "greetings", tradition: "Sie versus Du",
    origin_summary: "The formal/informal address distinction (Sie/du) was codified in the 17th century as German absorbed French court influence, replacing the medieval Ihr-form. The Reformation reinforced 'du' within congregations as a marker of shared brotherhood while 'Sie' marked civic and professional distance. The 20th century saw uneven democratisation — universities and trades unions adopted 'du' while the professions and bureaucracy retain 'Sie' until explicitly invited otherwise.",
    era: "17th century onward",
    influences: ["French court influence", "Lutheran congregational equality", "Wilhelmine bureaucratic formality"],
    connected_rule: "Address adults as 'Sie' and use last names with titles until explicitly invited to use 'du' and first names. The invitation is a meaningful social gesture.",
  },
  {
    region_code: "DE", domain: "business", tradition: "Sachlichkeit — Direct, Issue-Focused Speech",
    origin_summary: "Sachlichkeit ('matter-of-factness') emerged as an explicit cultural value in the Weimar Republic's Neue Sachlichkeit movement of the 1920s, which prized objective, unsentimental clarity in art, architecture, and discourse. It built on a longer Enlightenment tradition (Kant, Hegel) of disciplined argument and on Lutheran plain-speech values. In business, Sachlichkeit manifests as direct critique of ideas — never confused with personal hostility.",
    era: "1920s Weimar era, with Enlightenment roots",
    influences: ["Weimar Neue Sachlichkeit", "Kantian rationalism", "Lutheran plain-speech"],
    connected_rule: "Direct critique of ideas is normal and not personal. Diplomatic hedging can read as evasive; clarity is a courtesy, not aggression.",
  },
  {
    region_code: "DE", domain: "dining", tradition: "Guten Appetit and Mahlzeit",
    origin_summary: "The pre-meal greeting 'Guten Appetit' descends from the medieval Catholic monastic blessing of the table, which spread into secular use through the Holy Roman Empire. 'Mahlzeit' (literally 'mealtime'), heard particularly at workplace canteens around midday, originated as a 19th-century industrial-era abbreviation of 'gesegnete Mahlzeit' ('blessed mealtime'). Both phrases retain their function as small acknowledgements of shared hospitality.",
    era: "Medieval through industrial era",
    influences: ["Catholic monastic blessing", "Holy Roman Empire dining custom", "19th-century industrial canteens"],
    connected_rule: "Wait for the host's 'Guten Appetit!' before beginning to eat. Returning the greeting to others at the table is normal courtesy.",
  },
  {
    region_code: "DE", domain: "gift-giving", tradition: "Even-Numbered Flowers Taboo",
    origin_summary: "The custom of giving flowers in odd numbers (and never thirteen) and avoiding white chrysanthemums or lilies derives from German funerary tradition, in which even-numbered bouquets and these specific blooms are used at gravesites and memorials. The taboo crystallised in the 19th century as the bourgeois flower-giving custom became formalised in etiquette manuals alongside the rise of commercial florists.",
    era: "19th century (bourgeois etiquette codification)",
    influences: ["Christian funerary tradition", "19th-century bourgeois etiquette", "Florist trade conventions"],
    connected_rule: "Give flowers in odd numbers (never thirteen). Avoid white chrysanthemums and white lilies — both carry funeral associations.",
  },

  // ── FRANCE ───────────────────────────────────────────────────────────────────
  {
    region_code: "FR", domain: "greetings", tradition: "La Bise — The Cheek Kiss",
    origin_summary: "La bise — the light cheek-touch with a kiss sound — descends from the Roman 'osculum', the formal greeting kiss between social equals. It survived in southern Provençal and Italianate court culture and spread through France during the 17th-century salon era as a marker of polite intimacy. The number of kisses (one to four) and starting cheek vary by region — a living folk-geography of French civility.",
    era: "Roman through salon era (1st century BCE – 17th century)",
    influences: ["Roman osculum greeting", "Provençal Mediterranean culture", "17th-century salon civility"],
    connected_rule: "Among acquaintances, greet with la bise — light cheek-touches with a kiss sound. Number and starting cheek vary by region; follow the local lead.",
  },
  {
    region_code: "FR", domain: "dining", tradition: "Bread Direct on the Table",
    origin_summary: "Placing bread directly on the tablecloth (rather than on a side plate) descends from medieval French dining, when bread served as both food and edible plate ('tranchoir') for the rich sauces of the period. Even after porcelain plates became universal in the 18th century, the bread's traditional place beside the main plate persisted. It is broken by hand, never cut with a knife — a residue of medieval table manners that valued the symbolism of breaking bread together.",
    era: "Medieval through Ancien Régime",
    influences: ["Medieval tranchoir tradition", "Ancien Régime table service", "Catholic bread symbolism"],
    connected_rule: "Place your bread directly on the tablecloth beside your plate, and break it with your hands rather than cutting it with a knife.",
  },
  {
    region_code: "FR", domain: "business", tradition: "Vouvoiement — Formal Address",
    origin_summary: "The formal 'vous' as default address for adults outside intimate circles was crystallised by the Académie française in the 17th century under Louis XIV, who codified court speech as a national standard. Cardinal Richelieu's centralisation made Parisian court usage the model for all professional and bureaucratic life. Even today, the move from 'vous' to 'tu' is a deliberate, named act of intimacy ('on peut se tutoyer').",
    era: "17th century (Académie française, Louis XIV court)",
    influences: ["Académie française codification", "Louis XIV court speech", "Centralised Parisian standard"],
    connected_rule: "Default to 'vous' with all adults outside intimate circles. The shift to 'tu' is a deliberate gesture; let the senior party invite it.",
  },
  {
    region_code: "FR", domain: "dining", tradition: "The Apéritif Hour",
    origin_summary: "The apéritif — a light pre-dinner drink with savoury bites — was popularised in 19th-century French café culture but draws on a longer Mediterranean tradition of preparing the stomach with bitter tonics. The Bourbon court formalised the timing (typically 18:00–20:00) as the social hinge between professional day and family evening. It remains a sacred interval in which conversation is light and unhurried before the main meal.",
    era: "19th century (café era), with Bourbon court roots",
    influences: ["Mediterranean digestive tradition", "Bourbon court timing", "19th-century café culture"],
    connected_rule: "Accept the offer of an apéritif and treat it as an unhurried social interval — not as a prelude to be rushed through to dinner.",
  },
  {
    region_code: "FR", domain: "dress", tradition: "Soigné — The Discipline of Appearance",
    origin_summary: "The cultural premium on being 'soigné' (well-groomed, considered in dress) was codified at Versailles under Louis XIV, who instructed the aristocracy that personal appearance was a public duty to the king. The 19th-century bourgeoisie inherited the principle and the Parisian fashion houses of the Belle Époque industrialised it. Even now, deliberate dress — even when casual — is read as basic respect for those around you.",
    era: "17th century Versailles through Belle Époque",
    influences: ["Versailles court protocol", "Bourgeois etiquette codification", "Belle Époque Parisian fashion"],
    connected_rule: "Dress with deliberate care even in casual contexts. Sloppy or thoughtless attire reads as disrespect for the company you keep.",
  },

  // ── ITALY ────────────────────────────────────────────────────────────────────
  {
    region_code: "IT", domain: "dining", tradition: "No Cappuccino After Eleven",
    origin_summary: "The Italian rule against milky coffee after late morning rests on a long folk-medical tradition that warm milk taken on a full stomach impedes digestion. Cappuccino — named for the colour of Capuchin friars' habits and popularised in 19th-century Vienna and Trieste — was always conceived as a breakfast drink. Post-meal coffee is a small espresso, taken standing at the bar in the rapid morning-or-evening rhythm of Italian café life.",
    era: "19th century onward (with folk-medical roots)",
    influences: ["Italian folk-medical dietary tradition", "Capuchin friar dress (linguistic origin)", "Trieste–Vienna café culture"],
    connected_rule: "Order cappuccino only at breakfast. After meals, take a small espresso — never milky coffee, which is read as a digestive misjudgement.",
  },
  {
    region_code: "IT", domain: "greetings", tradition: "Bella Figura",
    origin_summary: "Fare bella figura — 'cutting a fine figure' — is the organising principle of Italian public life. It descends from Renaissance courtly virtue as set out in Castiglione's Il Cortegiano (1528), in which grace, eloquence, and effortless self-presentation defined the cultivated person. The mercantile city-states (Venice, Florence) reinforced the principle as practical economic capital. To this day, presentation in dress, speech, and bearing is read as a moral marker of self-respect and respect for the company.",
    era: "Renaissance onward (16th century)",
    influences: ["Castiglione's Il Cortegiano", "Renaissance city-state mercantile culture", "Catholic emphasis on visible virtue"],
    connected_rule: "Public presentation matters — take care with dress, posture, and speech. Sloppiness in public is a small social failure.",
  },
  {
    region_code: "IT", domain: "dining", tradition: "Pasta as Its Own Course",
    origin_summary: "The Italian meal structure (antipasto, primo, secondo, contorno, dolce) was codified by 19th-century gastronome Pellegrino Artusi in his 1891 book La Scienza in Cucina, which standardised regional dishes into a national menu structure for the newly unified Italian state. Pasta as a primo (first course, never a side to meat) reflects the historical reality of pasta as the substantial dish for working families, with meat as a smaller separate luxury — an order Italians defend with quiet conviction.",
    era: "19th century (Risorgimento era)",
    influences: ["Pellegrino Artusi's La Scienza in Cucina", "Risorgimento national culinary identity", "Pre-industrial peasant meal economics"],
    connected_rule: "Pasta is a course in itself, not a side dish to meat. Eat it before any meat course, and never with bread used to mop the plate at a formal table.",
  },
  {
    region_code: "IT", domain: "business", tradition: "Family-First Negotiation",
    origin_summary: "Italian business culture's relational, family-centred quality has roots in the Roman patrimonial household (familia) and the Renaissance city-state guilds, in which trade was organised through extended kinship networks. The 19th-century failure of a strong central state in Italy reinforced the family and trusted personal network as the primary unit of economic trust — a pattern now reflected in the dominance of small and medium family-owned firms in the Italian economy.",
    era: "Roman, Renaissance, and Risorgimento eras",
    influences: ["Roman familia/patrimonial structure", "Renaissance guild kinship networks", "Weak post-Risorgimento central state"],
    connected_rule: "Invest in personal relationships before pushing transactional details. Trust must be established person-to-person; deals follow trust, not the reverse.",
  },
  {
    region_code: "IT", domain: "gift-giving", tradition: "Chrysanthemums for the Dead",
    origin_summary: "In Italy, chrysanthemums are the funeral flower par excellence — exclusively associated with All Souls' Day (2 November), when families place them on graves. The association solidified in the 19th century as the chrysanthemum, blooming in autumn, became the standard cemetery flower across Catholic Mediterranean Europe. Giving chrysanthemums to a living person is therefore deeply inauspicious, regardless of the giver's intention.",
    era: "19th century (Catholic All Souls' tradition)",
    influences: ["Catholic All Souls' Day cemetery custom", "19th-century florist trade conventions", "Mediterranean autumn agricultural calendar"],
    connected_rule: "Never give chrysanthemums as a gift — they are reserved for cemeteries and funerals. Roses or mixed bouquets are safe alternatives.",
  },

  // ── BELGIUM ──────────────────────────────────────────────────────────────────
  {
    region_code: "BE", domain: "greetings", tradition: "Three Kisses on the Cheek",
    origin_summary: "Among friends and family, Belgian greeting traditionally involves three light cheek-touches — distinguishing it from the French two and the Dutch (variable) practice. The custom emerged in the 19th-century Catholic south as a formalised version of older Burgundian court greeting protocols. After the linguistic reorganisation of 1962 and the federalisation of Belgium (1993), the three-kiss greeting has become a quiet marker of shared Belgian identity across the linguistic divide.",
    era: "19th century, with Burgundian court roots",
    influences: ["Burgundian court greeting protocols", "Catholic southern European custom", "Post-1993 federal Belgian identity"],
    connected_rule: "Among friends, greet with three light cheek-touches. In business or with strangers, a handshake remains the safe default.",
  },
  {
    region_code: "BE", domain: "dining", tradition: "Beer with Cuisine",
    origin_summary: "Belgian beer culture's pairing with food descends from the Trappist and other monastic brewing traditions that emerged in the 19th century after the Napoleonic suppression of monasteries was reversed. Monastic brewers like Westvleteren and Chimay produced beers explicitly intended to accompany meals — a tradition that elevated beer in Belgium to the status wine holds in France. UNESCO inscribed Belgian beer culture on its Intangible Cultural Heritage list in 2016.",
    era: "19th century (post-Napoleonic monastic revival)",
    influences: ["Trappist monastic brewing", "19th-century monastery restoration", "UNESCO Intangible Cultural Heritage recognition"],
    connected_rule: "Treat beer as Belgians do — with the seriousness given to wine elsewhere. Each beer has a specific glass; refusing the glass is a small slight to the brewer.",
  },
  {
    region_code: "BE", domain: "business", tradition: "Linguistic Neutrality",
    origin_summary: "The 1962 language laws and the 1993 federal reorganisation formally divided Belgium into Dutch-speaking Flanders, French-speaking Wallonia, and bilingual Brussels. In professional contexts that cross linguistic boundaries — and especially in Brussels — neutral defaults (English, or carefully balanced French/Dutch) avoid being seen as politically partisan. Choosing the wrong language can read as taking sides in a long communal negotiation.",
    era: "1962 language laws through 1993 federalisation",
    influences: ["1962 Belgian language laws", "1993 federal constitutional reform", "Brussels institutional bilingualism"],
    connected_rule: "Do not assume language by appearance. Open in English or ask which language is preferred — choosing wrong reads as a political statement.",
  },
  {
    region_code: "BE", domain: "dining", tradition: "Frites — A National Heritage",
    origin_summary: "The fried potato (frite) is claimed by Belgium as a 17th-century invention from the Meuse Valley, where villagers reportedly began frying thin-cut potatoes when winter ice prevented their usual fish-frying. The frituur or friterie — the standalone shop dedicated to frites — became a fixture of Belgian street life in the late 19th century and was inscribed on Belgium's national heritage list in 2014 as a defining cultural institution.",
    era: "17th century onward (national heritage status 2014)",
    influences: ["Meuse Valley fishing-village tradition", "19th-century urban friterie culture", "Belgian national heritage policy"],
    connected_rule: "Frites are a serious cultural matter. Eat them with mayonnaise (the Belgian default) rather than ketchup — and never call them 'French'.",
  },
  {
    region_code: "BE", domain: "gift-giving", tradition: "Praline as the Gift Standard",
    origin_summary: "The Belgian praline — a filled chocolate shell — was invented in 1912 by Jean Neuhaus II at his Brussels confectionery on the Galerie de la Reine. Within a generation, the boxed assortment (ballotin, also a Neuhaus invention) became Belgium's universal social gift. To bring a box of pralines from a named maison (Neuhaus, Wittamer, Pierre Marcolini) to a host signals refined attention without flamboyance.",
    era: "20th century (1912 Neuhaus invention)",
    influences: ["Jean Neuhaus II's praline invention", "Brussels luxury confectionery culture", "Galerie de la Reine commercial tradition"],
    connected_rule: "Bring a box of pralines from a named maison to any host — modest in size, refined in choice, never supermarket-grade.",
  },

  // ── SWITZERLAND ──────────────────────────────────────────────────────────────
  {
    region_code: "CH", domain: "business", tradition: "Punctuality as Civic Virtue",
    origin_summary: "Swiss punctuality has roots in Calvin's Geneva of the 16th century, where reliable use of time was preached as a moral obligation to the community. The watchmaking industry that emerged in the Jura valleys in the 17th century made precision timekeeping a national craft and eventually a national identity. Federal railway unification in 1902 standardised time across the cantons; the SBB's reputation for departures to the second became the visible everyday expression of a deeper civic ethic.",
    era: "16th century onward (Calvinist Geneva to federal era)",
    influences: ["Calvinist Geneva work ethic", "Jura watchmaking industry", "1902 federal railway unification"],
    connected_rule: "Arrive precisely on time. Lateness is read not as casual but as a moral failure of consideration; notify immediately if delayed even by minutes.",
  },
  {
    region_code: "CH", domain: "greetings", tradition: "Three Kisses or a Handshake",
    origin_summary: "Swiss greeting practice splits along linguistic lines: in French-speaking Romandy, friends exchange three light cheek-touches in the Latin tradition; in German-speaking and Italian-speaking regions, a firm handshake (or a single kiss only among close family) prevails. The split was reinforced by the 1848 federal constitution that preserved cantonal cultural autonomy. Reading which greeting suits the context is a daily small exercise in Swiss multilingual fluency.",
    era: "19th century onward (1848 federal constitution)",
    influences: ["Romandy Latin greeting tradition", "Germanic cantonal reserve", "1848 federal cantonal autonomy"],
    connected_rule: "Default to a firm handshake in business and across linguistic regions. Three cheek-touches are reserved for friends in French-speaking Switzerland.",
  },
  {
    region_code: "CH", domain: "dining", tradition: "Fondue Communal Etiquette",
    origin_summary: "Cheese fondue originated as Alpine peasant winter food in the Vaudois and Fribourg cantons, using stale bread and aged cheese — survival cuisine elevated to national symbol after a 1930s Swiss Cheese Union marketing campaign. The communal pot generated its own etiquette: never double-dip, never let bread drop into the pot (penalties from buying drinks to a cold dunk in the lake), and finish the crusty layer at the bottom (la religieuse) ceremonially.",
    era: "Pre-modern Alpine, popularised in the 1930s",
    influences: ["Alpine peasant winter cuisine", "1930s Swiss Cheese Union marketing", "Communal village dining tradition"],
    connected_rule: "Spear bread securely on the fork; never lose it in the pot, never double-dip, and join the ceremonial sharing of the crusty 'religieuse' at the bottom.",
  },
  {
    region_code: "CH", domain: "business", tradition: "Discretion and Privacy",
    origin_summary: "Swiss discretion as a cultural and professional virtue was institutionalised by the 1934 Federal Act on Banks and Savings Banks, which made breach of banking confidentiality a criminal offence — partly to protect Jewish depositors fleeing Nazi Germany. The principle radiated outward: discussions of personal wealth, salaries, and political opinions are considered intrusive in ordinary social settings. Discretion, not disclosure, is the default mode of trust.",
    era: "20th century (1934 Banking Act onward)",
    influences: ["1934 Federal Banking Act", "Calvinist privacy norms", "Multilingual federal restraint"],
    connected_rule: "Avoid asking about salaries, wealth, or political views in social settings. Privacy is the default; volunteered disclosure marks unusual trust.",
  },
  {
    region_code: "CH", domain: "dress", tradition: "Conservative Understatement",
    origin_summary: "Swiss dress conservatism descends from Reformed (Zwinglian and Calvinist) sumptuary traditions of the 16th century, which preached modest attire as outward sign of inward piety. The mercantile prosperity of the 19th century did not produce a flashy dress culture — quality, durability, and discretion remained the markers of a well-judged wardrobe. Understated quality reads as competence; visible logos and conspicuous luxury read as unserious.",
    era: "16th century Reformation through modern era",
    influences: ["Zwinglian and Calvinist sumptuary tradition", "Mercantile durability ethic", "Federal multilingual restraint"],
    connected_rule: "Dress with quiet quality; visible logos and conspicuous luxury read as unserious. Understatement signals seriousness.",
  },

  // ── SINGAPORE ────────────────────────────────────────────────────────────────
  {
    region_code: "SG", domain: "dining", tradition: "Hawker Centre Culture",
    origin_summary: "Singapore's hawker centres were created by the government from 1968 onward as it relocated street vendors into hygienic public food halls under the Hawkers Inquiry Commission. Far from killing the street food tradition, the policy preserved it — and in 2020 UNESCO inscribed Singapore's hawker culture on its Intangible Cultural Heritage list. Reserving a seat with a packet of tissues ('chope') is a uniquely Singaporean micro-etiquette born of the system.",
    era: "20th century (1968 hawker relocation onward; UNESCO 2020)",
    influences: ["1968 Hawkers Inquiry Commission", "Government public-housing policy", "UNESCO Intangible Cultural Heritage 2020"],
    connected_rule: "Reserve a hawker-centre seat by placing a packet of tissues on the table ('chope'). Return your tray after eating; the system runs on collective courtesy.",
  },
  {
    region_code: "SG", domain: "greetings", tradition: "Multicultural Greeting Protocol",
    origin_summary: "Singapore's CMIO model (Chinese, Malay, Indian, Others) — formalised in the post-1965 nation-building decades under Lee Kuan Yew — institutionalised multi-ethnic equality. In greetings, this means matching the gesture to the recipient: a handshake universally, but a slight nod and right-hand-to-heart for traditional Malay Muslims, an Indian namaste where appropriate, and Chinese given/family-name conventions in business. Cultural switching is a Singaporean professional skill.",
    era: "20th century (post-1965 nation-building)",
    influences: ["CMIO ethnic-policy framework", "Lee Kuan Yew nation-building era", "Post-1965 multicultural compact"],
    connected_rule: "Match the greeting to the person — handshake by default, hand to heart for traditional Malay Muslims, namaste where culturally appropriate. Watch for cues.",
  },
  {
    region_code: "SG", domain: "business", tradition: "Kiasu Mindset",
    origin_summary: "'Kiasu' (Hokkien: 'afraid to lose') is a Singaporean self-descriptor for the cultural drive to anticipate every contingency, queue early, and never be at a disadvantage. The trait was crystallised by the post-independence scarcity-anxiety of a small, resource-poor city-state and reinforced by the meritocratic competitive education system established under Lee Kuan Yew. It produces both Singapore's famous efficiency and a recognisable national humour about itself.",
    era: "Late 20th century (post-1965 era)",
    influences: ["Hokkien Chinese linguistic inheritance", "Post-independence scarcity-anxiety", "Meritocratic education system"],
    connected_rule: "Expect thorough preparation, early arrival, and detailed planning from Singaporean counterparts. Looking unprepared signals you are not taking the work seriously.",
  },
  {
    region_code: "SG", domain: "dining", tradition: "Chopstick and Communal Eating Codes",
    origin_summary: "Singapore's predominantly ethnic-Chinese majority brought Southern Chinese (Hokkien, Teochew, Cantonese) dining codes — including the chopstick taboos against vertical placement (resembles funeral incense), pointing, and tapping the bowl. These codes coexist in hawker centres with Malay (right-hand only) and Indian (right-hand only, communal-plate) traditions. Knowing not to mix codes inappropriately is a marker of cultural fluency in shared public dining.",
    era: "Inherited from Southern Chinese diaspora (19th century onward)",
    influences: ["Hokkien/Teochew/Cantonese diaspora customs", "Malay right-hand dining tradition", "Indian Tamil dining tradition"],
    connected_rule: "Never plant chopsticks vertically in rice, point with them, or tap the bowl. Use only the right hand when eating with Malay or Indian friends in traditional contexts.",
  },
  {
    region_code: "SG", domain: "business", tradition: "Face — Mianzi in a Multicultural Frame",
    origin_summary: "The Confucian concept of mianzi (face), inherited from Southern Chinese ancestry, was integrated into Singapore's modern multicultural professional culture. Causing a counterpart to lose face publicly is the gravest negotiation error — disagreements are surfaced privately, often through trusted intermediaries. The principle is reinforced by Malay 'malu' (shame-honour) and Indian respect-hierarchy norms, producing a cross-cultural consensus on indirect public conduct.",
    era: "Confucian roots, post-independence multicultural application",
    influences: ["Confucian mianzi (face)", "Malay malu shame-honour code", "Multicultural professional consensus"],
    connected_rule: "Never publicly contradict, criticise, or correct a counterpart. Surface disagreement privately or through a trusted intermediary.",
  },

  // ── INDIA ────────────────────────────────────────────────────────────────────
  {
    region_code: "IN", domain: "greetings", tradition: "Namaste — The Anjali Mudra",
    origin_summary: "Namaste — palms pressed together at heart level with a slight bow — is the anjali mudra (gesture of offering) drawn from Vedic and classical Hindu ritual, dating to at least the 2nd millennium BCE. The phrase 'Namaste' (नमस्ते, 'I bow to you') addresses the divine within the other. It is universal across age, gender, and caste, and its non-contact nature made it a culturally resonant national greeting through epidemic periods and beyond.",
    era: "Vedic period onward (2nd millennium BCE)",
    influences: ["Vedic ritual gesture vocabulary", "Classical Hindu philosophy", "Sanskrit greeting tradition"],
    connected_rule: "Greet with palms pressed at heart level and a slight bow ('Namaste'). It is universally appropriate across age, gender, and region.",
  },
  {
    region_code: "IN", domain: "dining", tradition: "Right Hand Only",
    origin_summary: "Eating with the right hand only descends from Hindu, Jain, Sikh, and Muslim traditions of ritual purity, in which the left hand is reserved for personal hygiene and considered unclean for food contact. The codification appears in the Manusmriti (1st–3rd century CE) and parallel Islamic hadith traditions. The principle extends to passing dishes, accepting gifts, and giving money — using the right hand or both hands signals respect and ritual cleanliness.",
    era: "Classical period onward (Manusmriti, hadith traditions)",
    influences: ["Vedic-Hindu ritual purity", "Islamic hadith on hand use", "Jain non-violence and purity codes"],
    connected_rule: "Eat, pass food, give money, and accept gifts with the right hand (or both hands) only. The left hand is considered ritually unclean for these.",
  },
  {
    region_code: "IN", domain: "gift-giving", tradition: "No Leather Gifts",
    origin_summary: "The taboo against leather gifts to Hindu hosts derives from the cow's status as a sacred animal in Hinduism — a reverence dating to the Vedic period and codified in dharmic texts. Leather goods, particularly cowhide, are considered ritually polluting in many traditional households. Even modernised, urban Hindu families may quietly object; the safe gift defaults are sweets, dry fruits, fine textiles, or non-cow-leather goods.",
    era: "Vedic period onward",
    influences: ["Vedic cow-veneration tradition", "Dharmic ahimsa (non-harm)", "Brahminical purity codes"],
    connected_rule: "Avoid leather gifts (especially cowhide) for Hindu hosts. Sweets, dry fruits, fine textiles, or quality non-leather goods are safe.",
  },
  {
    region_code: "IN", domain: "business", tradition: "Hierarchy and Touching Feet",
    origin_summary: "Indian respect for seniority — seen in the gesture of touching an elder's feet (charan sparsh) — derives from Brahminical and broader dharmic traditions in which the elder embodies inherited wisdom and the family's accumulated dharma. The gesture appears across the Ramayana and Mahabharata as a marker of righteous character. In professional life, the principle translates into deference to senior decision-makers, even when juniors hold technical expertise.",
    era: "Vedic and epic periods onward",
    influences: ["Brahminical respect hierarchy", "Ramayana/Mahabharata dharmic models", "Joint-family household structure"],
    connected_rule: "Defer visibly to senior figures in meetings — address them first, let them speak first, and avoid contradicting them publicly even when correct.",
  },
  {
    region_code: "IN", domain: "dining", tradition: "Vegetarianism by Community",
    origin_summary: "Dietary practice in India varies sharply by community: many Hindus avoid beef, some are strictly vegetarian (often Brahmin, Vaishnava, or Jain communities); Muslims avoid pork and require halal meat; Jains additionally avoid root vegetables and eat only before sundown. Hosting requires careful inquiry, never assumption. The diversity reflects layered religious histories — Vedic, Buddhist, Jain, Islamic, and Sikh — rather than a single national norm.",
    era: "Layered: Vedic, Jain, Islamic, Sikh historical periods",
    influences: ["Hindu cow-reverence", "Jain ahimsa and root-vegetable taboo", "Islamic halal requirements"],
    connected_rule: "Never assume dietary practice. Ask in advance about beef, pork, alcohol, and vegetarianism — and respect Jain restrictions on root vegetables and eating after sundown.",
  },

  // ── MEXICO ───────────────────────────────────────────────────────────────────
  {
    region_code: "MX", domain: "greetings", tradition: "El Abrazo — The Embrace",
    origin_summary: "Mexican greeting culture combines an Iberian Mediterranean warmth with indigenous Mesoamerican hospitality codes. Among friends and trusted business contacts, men commonly greet with an abrazo — a brief embrace with back-pats — and women with a single cheek-kiss. The gesture inherits the 16th-century Spanish colonial saludo and the older tradition of physical hospitality central to many indigenous Mexican communities. Refusing the abrazo from a friend reads as cold or distrustful.",
    era: "Colonial era onward (16th century)",
    influences: ["Spanish Iberian saludo", "Mesoamerican hospitality traditions", "Catholic communal warmth"],
    connected_rule: "Among acquaintances, accept the abrazo (men) or single cheek-kiss (women). A handshake-only response from a friend reads as unusually cold.",
  },
  {
    region_code: "MX", domain: "dining", tradition: "Sobremesa",
    origin_summary: "Sobremesa — the unhurried conversation that lingers at the table after the meal — is an Iberian inheritance reinforced in Mexico by the centrality of family gathering and the Catholic communal culture of the colonial period. Standing up to leave too quickly after eating reads as treating the meal as transactional rather than relational. In business, the sobremesa is often where the real relationship is built.",
    era: "Iberian colonial inheritance onward",
    influences: ["Spanish Iberian dining tradition", "Catholic communal family culture", "Hacienda-era hospitality"],
    connected_rule: "Linger at the table after the meal for unhurried conversation. Standing up promptly to leave is read as transactional and cold.",
  },
  {
    region_code: "MX", domain: "business", tradition: "Personalismo",
    origin_summary: "Personalismo — preferring trusted persons over formal institutions — has its roots in the colonial encomienda and hacienda systems, in which loyalty ran through the patrón rather than the distant Spanish crown. Even in modern professional life, business is conducted through relationships of mutual personal trust; institutional contracts complement but do not replace the bond between principals. New introductions ideally come through a trusted mutual contact.",
    era: "Colonial era through modern era",
    influences: ["Encomienda and hacienda patrón systems", "Catholic compadrazgo (godparent) networks", "Weak institutional trust legacy"],
    connected_rule: "Introductions through trusted mutual contacts open doors institutional approaches do not. Invest in personal relationship before pushing transactional details.",
  },
  {
    region_code: "MX", domain: "gift-giving", tradition: "Marigolds for Día de los Muertos",
    origin_summary: "Marigolds (cempasúchil) in Mexico are inseparable from Día de los Muertos (1–2 November), in which their orange petals are scattered to guide the spirits of the dead home. The flower's sacred-funerary role in the indigenous Aztec religion was preserved through Catholic syncretism after the conquest. Giving marigolds outside this context is therefore inappropriate — they are read as a flower of mourning, not friendship.",
    era: "Pre-Columbian Aztec onward (with Catholic syncretism)",
    influences: ["Aztec sacred-funerary flower tradition", "Catholic All Souls' syncretism", "Día de los Muertos public ritual"],
    connected_rule: "Avoid marigolds as social gifts — they are reserved for Día de los Muertos and grave offerings. Roses, orchids, or mixed bouquets are appropriate.",
  },
  {
    region_code: "MX", domain: "greetings", tradition: "Don and Doña Honorifics",
    origin_summary: "The honorifics 'Don' (for men) and 'Doña' (for women), used with the first name, descend from the Spanish Castilian usage that arrived with the conquest in the 16th century. Originally restricted to nobility, they democratised in colonial New Spain to mark senior, respected, or accomplished persons regardless of formal title. Using 'Don' or 'Doña' for an elder or a respected senior signals warm respect that the cooler 'Señor/Señora' lacks.",
    era: "Colonial Spanish onward (16th century)",
    influences: ["Castilian noble honorifics", "Colonial democratisation in New Spain", "Catholic social hierarchy"],
    connected_rule: "Address respected elders and senior figures as 'Don [first name]' or 'Doña [first name]' — warmer than 'Señor/Señora' and a deliberate gesture of regard.",
  },

  // ── BRAZIL ───────────────────────────────────────────────────────────────────
  {
    region_code: "BR", domain: "greetings", tradition: "Cheek Kissing",
    origin_summary: "Brazilian cheek-kissing varies by region: one in São Paulo, two in Rio de Janeiro, three in Minas Gerais. The custom blends Portuguese Iberian greeting tradition with the warmth of West African hospitality cultures brought through the colonial period. Even in initial meetings between women (and often between men and women), the kiss precedes the handshake. Refusing it from an acquaintance reads as unusually distant.",
    era: "Colonial era through modern era",
    influences: ["Portuguese Iberian greeting", "West African hospitality traditions", "Catholic communal warmth"],
    connected_rule: "Greet women with one to three cheek-kisses depending on region — São Paulo (one), Rio (two), Minas (three). Watch the local lead.",
  },
  {
    region_code: "BR", domain: "business", tradition: "Jeitinho Brasileiro",
    origin_summary: "The 'jeitinho brasileiro' — the small inventive workaround that bypasses formal obstacles — is a national self-descriptor analysed by sociologist Roberto DaMatta in his 1986 work A Casa e a Rua. It descends from the colonial reality of distant Portuguese law and present local power, in which informal personal arrangements were often the only practical way to act. Today it remains both celebrated as Brazilian creativity and critiqued as a corruption hazard.",
    era: "Colonial era onward (analytical framing 1980s)",
    influences: ["Colonial distance from Portuguese institutions", "Roberto DaMatta sociological analysis", "Patron-client cultural inheritance"],
    connected_rule: "Expect informal workarounds and personal accommodations to be offered as solutions. Demand for rigid procedural correctness can read as cold or naive.",
  },
  {
    region_code: "BR", domain: "dining", tradition: "Long, Hosted Meals",
    origin_summary: "The extended, multi-course meal anchored by family or trusted friends is a Portuguese Mediterranean inheritance reinforced by the colonial casa-grande tradition of large hospitality at the plantation house. Even in modern urban Brazil, business meals run long, conversation ranges far beyond the immediate transaction, and the host's choice of restaurant and orchestration of the table is a meaningful gesture of regard.",
    era: "Colonial casa-grande tradition onward",
    influences: ["Portuguese Iberian dining culture", "Colonial casa-grande hospitality", "Catholic communal meal tradition"],
    connected_rule: "Allow business meals to run long. Conversation will roam well beyond the immediate transaction; rushing to the deal points reads as crass.",
  },
  {
    region_code: "BR", domain: "business", tradition: "The Cordial Brazilian",
    origin_summary: "Sergio Buarque de Holanda's 1936 essay Raízes do Brasil identified the 'cordial Brazilian' — the personality whose social warmth dissolves formal institutional distance — as a defining national type. The cordiality is not insincere but reflects a culture in which professional and personal life are deeply intertwined, and in which the affective register of a relationship governs the business it can support.",
    era: "20th century framing of older cultural patterns",
    influences: ["Sergio Buarque de Holanda's Raízes do Brasil", "Patron-client colonial inheritance", "Catholic affective community tradition"],
    connected_rule: "Invest in the affective register of the relationship — warmth, personal interest, shared social time. Cold professionalism limits what business can be done.",
  },
  {
    region_code: "BR", domain: "dress", tradition: "Cuidado — Care in Appearance",
    origin_summary: "The cultural premium on a 'cuidado' (well-cared-for) appearance descends from the urban beach-and-promenade culture of 19th-century Rio de Janeiro and the broader Iberian-Mediterranean attention to public presentation. Even in casual or hot-climate contexts, deliberate grooming, fitted clothes, and clean shoes signal self-respect; thoughtless dress is read as a small disrespect for the people one will encounter.",
    era: "19th century urban Brazil onward",
    influences: ["Iberian Mediterranean dress tradition", "19th-century Rio promenade culture", "Tropical urban grooming norms"],
    connected_rule: "Even in hot climates and casual contexts, dress with deliberate care — fitted clothes, clean shoes, considered grooming. Thoughtless dress reads as disrespect.",
  },

  // ── SPAIN ────────────────────────────────────────────────────────────────────
  {
    region_code: "ES", domain: "dining", tradition: "Sobremesa — Lingering at the Table",
    origin_summary: "Sobremesa — the conversation that follows the meal, often as long as the meal itself — is a defining Spanish social institution dating to medieval Castilian and Andalusian table culture. The hours after lunch, especially on weekends, are reserved for unhurried family or friend conversation, often with coffee or a digestif. Standing to leave promptly is read as cold; to be invited to a sobremesa is to be folded into trusted social space.",
    era: "Medieval through modern era",
    influences: ["Medieval Castilian dining tradition", "Andalusian café and tavern culture", "Catholic communal time"],
    connected_rule: "After meals, expect and join the sobremesa — unhurried conversation, often with coffee or a digestif. Leaving promptly reads as cold.",
  },
  {
    region_code: "ES", domain: "dining", tradition: "Tapas as Social Ritual",
    origin_summary: "The tapa originated in 19th-century Andalusian tavern culture, where a small dish ('tapa', cover) was placed over a glass of sherry to keep flies out and to encourage drinkers to eat. The custom spread north through Spain and evolved into the modern tapeo — moving between bars for small plates and conversation. The tapeo's social function is communal flow rather than meal: standing, sharing, and circulating matter as much as the food itself.",
    era: "19th century Andalusia onward",
    influences: ["Andalusian sherry tavern tradition", "Iberian small-plate custom", "Mediterranean social drinking culture"],
    connected_rule: "On a tapeo, expect to move between bars rather than settle. Share plates from the centre, stand or stay light, and treat conversation as the main course.",
  },
  {
    region_code: "ES", domain: "greetings", tradition: "Two-Cheek Kiss",
    origin_summary: "Among friends and family, Spanish greeting is two light cheek-touches — left cheek first, then right — with a kiss sound. The custom shares the broader Mediterranean Roman 'osculum' tradition and persisted as a marker of warm intimacy through Spain's diverse regional cultures. Business introductions among strangers default to a firm handshake; the kiss is reserved for personal warmth.",
    era: "Roman through modern era",
    influences: ["Roman osculum tradition", "Mediterranean regional culture", "Catholic communal warmth"],
    connected_rule: "Among friends, greet women (and women greeting men) with two light cheek-touches starting on the left. Handshakes remain default for business strangers.",
  },
  {
    region_code: "ES", domain: "business", tradition: "The Late Schedule",
    origin_summary: "Spain's distinctively late daily schedule — lunch at 14:00–15:30, dinner at 21:00–22:30 — was reinforced in 1940 when Franco moved Spain into Central European Time to align with Nazi Germany, despite Spain's geographical position aligning with GMT. The clock shifted, but the solar-aligned daily rhythm did not, leaving Spain perpetually 'one hour late' relative to its time zone. The pattern is cultural infrastructure now — meetings and meals reflect it.",
    era: "Reinforced by 1940 timezone shift",
    influences: ["1940 Franco timezone alignment with Berlin", "Mediterranean siesta tradition", "Solar-aligned agricultural rhythms"],
    connected_rule: "Plan around the late schedule — lunch at 14:00–15:30, dinner from 21:00 onward. Proposing a 19:00 dinner reads as oddly early.",
  },
  {
    region_code: "ES", domain: "gift-giving", tradition: "Wine Etiquette and Flower Taboos",
    origin_summary: "Spanish gift-giving conventions for hosts include good-quality wine (or cava), boxed sweets, or flowers — with care to avoid yellow flowers (linked to ill-luck and historically to the Inquisition's penitential garments) and chrysanthemums (cemetery flowers, as across Catholic Mediterranean Europe). The taboos are old enough that even non-superstitious Spaniards observe them; younger urban hosts may not, but the safe path is to default away from yellow.",
    era: "Inquisition-era origins through modern florist conventions",
    influences: ["Inquisition penitential symbolism", "Catholic All Souls' chrysanthemum tradition", "Iberian florist conventions"],
    connected_rule: "Bring wine, cava, or quality boxed sweets to a host. Avoid yellow flowers (ill-luck) and chrysanthemums (cemetery) when choosing a bouquet.",
  },

  // ── COLOMBIA ─────────────────────────────────────────────────────────────────
  {
    region_code: "CO", domain: "greetings", tradition: "Buenos Días Formality",
    origin_summary: "Colombian social interaction is anchored by the obligatory 'Buenos días' / 'Buenas tardes' / 'Buenas noches' greeting on entering shops, lifts, taxis, or any shared space. The practice descends from Catholic Spanish colonial culture and is reinforced in Colombia by a particularly formal Andean Spanish that takes politeness as a marker of upbringing ('una buena educación'). Skipping the greeting reads as not just rude but badly raised.",
    era: "Colonial Spanish onward",
    influences: ["Catholic Spanish colonial culture", "Andean formal Spanish tradition", "Bogotá highland courtesy norms"],
    connected_rule: "Greet on entering any shared space — shop, lift, taxi, waiting room — with 'Buenos días' or the time-appropriate equivalent. Skipping it reads as badly raised.",
  },
  {
    region_code: "CO", domain: "business", tradition: "Universal Use of 'Usted'",
    origin_summary: "Unusually for Latin America, Colombian Spanish (especially in Bogotá and the Andean interior) often uses the formal 'usted' even within families and between close friends — a practice descended from colonial Castilian formality preserved more strongly in Colombia than in most other Spanish-speaking countries. The Colombian Academy of Language has documented this distinct norm. In business, 'usted' is the default and persists through long professional relationships.",
    era: "Colonial onward (preserved more strongly than regional peers)",
    influences: ["Colonial Castilian formality", "Andean highland courtesy preservation", "Colombian Academy of Language norms"],
    connected_rule: "Use 'usted' as the default with all adults — including in long-standing professional relationships. Switching to 'tú' is unusual and personal.",
  },
  {
    region_code: "CO", domain: "dining", tradition: "Tinto Coffee Culture",
    origin_summary: "The 'tinto' — a small black coffee, taken many times a day — is the structuring social ritual of Colombian work and hospitality. Coffee cultivation expanded across the central Andes from the 1850s and built modern Colombia's economic and cultural backbone; by the 20th century, the Federación Nacional de Cafeteros had codified coffee as national identity. Offering tinto to a visitor is the basic gesture of welcome; refusing repeatedly is read as standoffish.",
    era: "19th century coffee expansion onward",
    influences: ["19th-century Andean coffee economy", "Federación Nacional de Cafeteros cultural work", "Spanish hospitality tradition"],
    connected_rule: "Accept the offer of tinto — the small black coffee — when a Colombian host or office offers it. It is the basic gesture of welcome.",
  },
  {
    region_code: "CO", domain: "business", tradition: "Personalismo and Patience",
    origin_summary: "Colombian business culture, like much of Latin America, is built on personal trust before transactional detail — a heritage of colonial encomienda relationships and Catholic compadrazgo (godparenthood) networks of obligation. Meetings often open with substantial personal conversation, decisions move at relationship-pace, and pushing for closure too quickly can damage rather than accelerate the deal.",
    era: "Colonial era through modern era",
    influences: ["Encomienda patron-client tradition", "Catholic compadrazgo networks", "Andean formal courtesy culture"],
    connected_rule: "Open meetings with genuine personal conversation. Pushing for closure too quickly can damage rather than accelerate a Colombian deal.",
  },
  {
    region_code: "CO", domain: "gift-giving", tradition: "Funeral Flower Taboos",
    origin_summary: "As across Catholic Mediterranean and Latin culture, marigolds and lilies in Colombia carry funeral and All Souls' associations and are inappropriate as social gifts. Roses (especially red and yellow), tulips, and orchids — Colombia's national flower — are safe and welcomed choices. The country's prominence as a global cut-flower exporter means quality fresh flowers are expected when given.",
    era: "Catholic colonial tradition through modern florist trade",
    influences: ["Catholic All Souls' tradition", "Colombian cut-flower export industry", "Andean orchid cultural symbolism"],
    connected_rule: "Avoid lilies and marigolds (funeral flowers). Roses, tulips, or orchids — the national flower — are safe and welcomed.",
  },

  // ── UAE ──────────────────────────────────────────────────────────────────────
  {
    region_code: "AE", domain: "greetings", tradition: "Right Hand Only",
    origin_summary: "The Emirati and broader Islamic practice of using the right hand for greetings, eating, and giving derives from the hadith traditions of the Prophet Muhammad, in which the left hand is reserved for personal hygiene and considered ritually impure for these acts. The principle, codified in the early Islamic period (7th century), governs handshakes, the acceptance of gifts and food, and the giving of business cards. Use of the left hand reads as a basic failure of cultural awareness.",
    era: "Early Islamic period onward (7th century)",
    influences: ["Hadith of the Prophet Muhammad", "Islamic ritual purity codes", "Bedouin tribal hospitality customs"],
    connected_rule: "Use the right hand only for handshakes, accepting gifts and food, giving business cards, and eating. The left hand is ritually inappropriate for these acts.",
  },
  {
    region_code: "AE", domain: "business", tradition: "The Majlis",
    origin_summary: "The majlis (literally 'sitting place') is the traditional Bedouin council in which tribal leaders heard petitions, mediated disputes, and built consensus — a practice UNESCO inscribed on its Intangible Cultural Heritage list in 2015. In modern Emirati business, the majlis survives as the unhurried opening conversation in a meeting room or sheikh's reception, in which the relationship is established before any transactional content. Skipping the majlis reads as crass and Western.",
    era: "Pre-Islamic Bedouin onward (UNESCO 2015 recognition)",
    influences: ["Pre-Islamic Bedouin council tradition", "Islamic shura (consultation) principle", "UNESCO Intangible Cultural Heritage 2015"],
    connected_rule: "Settle into the majlis-style opening conversation patiently. Pushing to business content too quickly violates the customary order of relationship before transaction.",
  },
  {
    region_code: "AE", domain: "dining", tradition: "Coffee and Dates — Gahwa Hospitality",
    origin_summary: "The serving of Arabic coffee (gahwa) and dates is the founding gesture of Emirati and broader Gulf Arab hospitality, descended from Bedouin desert tradition where offering food and drink to any visitor — friend or stranger — was a sacred obligation. UNESCO inscribed Arabic coffee culture in 2015. The gahwa pourer waits for the guest to gently shake the small cup side-to-side to signal that no more is wanted.",
    era: "Pre-Islamic Bedouin onward (UNESCO 2015)",
    influences: ["Bedouin desert hospitality obligation", "Yemeni–Ethiopian coffee origins", "UNESCO Intangible Cultural Heritage 2015"],
    connected_rule: "Accept the offered gahwa and dates; refusal reads as refusal of hospitality. Signal you have had enough by gently shaking the small cup side-to-side.",
  },
  {
    region_code: "AE", domain: "gift-giving", tradition: "No Alcohol or Pork",
    origin_summary: "Islamic dietary prohibitions on alcohol (khamr) and pork are foundational, set out in the Qur'an and reinforced through hadith. While alcohol is available to non-Muslims in licensed venues across the UAE, gifting alcohol or pork products to an Emirati host is inappropriate regardless of personal observance level — the gesture itself transgresses the religious-cultural boundary. Safe gifts include high-quality dates, Arabic sweets, perfumes (oud, attar), and fine textiles.",
    era: "Islamic foundational era (7th century)",
    influences: ["Qur'anic prohibition of khamr and pork", "Hadith dietary codification", "Gulf Arab gift traditions"],
    connected_rule: "Never gift alcohol or pork products to an Emirati host. Quality dates, Arabic sweets, oud or attar perfumes, and fine textiles are safe and welcomed.",
  },
  {
    region_code: "AE", domain: "dress", tradition: "Modest Attire",
    origin_summary: "Emirati expectations of modest dress descend from Islamic principles of haya (modesty) set out in the Qur'an and hadith, and reinforced by Gulf Arab cultural codes. For visitors, this means covered shoulders and knees in public spaces, conservative business attire (full suit, long sleeves) in professional contexts, and additional covering at mosques and government buildings. The standard tightens further during Ramadan.",
    era: "Islamic foundational era onward",
    influences: ["Qur'anic principle of haya (modesty)", "Gulf Arab cultural conservatism", "Tribal honour codes around presentation"],
    connected_rule: "Cover shoulders and knees in public; wear conservative business attire (full suit) for professional meetings. Tighten the standard further at mosques and during Ramadan.",
  },

  // ── UNITED STATES ────────────────────────────────────────────────────────────
  {
    region_code: "US", domain: "greetings", tradition: "The Firm Handshake",
    origin_summary: "The American firm handshake as a marker of trustworthy character descends from a confluence of Quaker plain-dealing tradition (which preferred the handshake to deferential bows or hat-doffings as a mark of human equality) and 19th-century military and frontier culture, in which a confident grip signalled reliable character to strangers. The 'firm' qualifier became a near-universal piece of American business advice by the early 20th century.",
    era: "17th-century Quaker through 20th-century business culture",
    influences: ["Quaker egalitarian plain-dealing", "19th-century frontier character culture", "20th-century American business advice tradition"],
    connected_rule: "Offer a firm — not crushing — handshake with direct eye contact. A weak grip is read as evasive or low-confidence.",
  },
  {
    region_code: "US", domain: "business", tradition: "First-Name Basis",
    origin_summary: "The American default to first names, even across hierarchies, descends from frontier egalitarianism and from the post-WWII corporate culture that explicitly broke with European formality as a marker of American managerial modernity. Quaker and Methodist plain-speech traditions reinforced the pattern. The first-name default is now so standard that excessive formality (Mr/Ms, titles) can read as cold or oddly hierarchical in mainstream American professional life.",
    era: "Frontier era through post-WWII corporate culture",
    influences: ["Frontier egalitarian tradition", "Quaker and Methodist plain-speech", "Post-WWII American corporate informality"],
    connected_rule: "Use first names as the default in American professional contexts. Excessive Mr/Ms formality reads as oddly cold or hierarchical.",
  },
  {
    region_code: "US", domain: "dining", tradition: "Tipping Culture",
    origin_summary: "American tipping culture descends from post-Civil War Reconstruction, when restaurant and railway employers used the European tip — until then a discretionary gratuity — as a substitute for paying newly-freed Black workers a wage. The 1938 Fair Labor Standards Act formalised the 'tipped minimum wage', binding restaurant economics to customer-paid gratuities. The 15–20% (now 20–25%) standard is therefore not optional in the way many international visitors assume — staff income depends on it.",
    era: "Post-Civil War onward (formalised 1938 FLSA)",
    influences: ["Post-Reconstruction wage suppression", "European discretionary tip imported and transformed", "1938 Fair Labor Standards Act tipped minimum wage"],
    connected_rule: "Tip 18–22% on restaurant bills as standard, not as exceptional reward. Staff wages legally depend on it; under-tipping has real economic consequences.",
  },
  {
    region_code: "US", domain: "business", tradition: "Direct Yes/No Communication",
    origin_summary: "American directness in professional speech — explicit yes/no answers, surfaced disagreement, and stated preferences — draws on Quaker plain-speech, frontier pragmatism, and the 20th-century management theory tradition (Drucker, Deming) that prized clear communication as operational necessity. Indirect or hedged answers, common in many cultures as politeness, can read in American contexts as evasive or untrustworthy.",
    era: "Quaker through 20th-century management tradition",
    influences: ["Quaker plain-speech tradition", "Frontier pragmatic communication", "20th-century American management theory"],
    connected_rule: "Give clear, explicit yes/no answers. Hedged or indirect responses, polite elsewhere, can read in American business contexts as evasive or untrustworthy.",
  },
  {
    region_code: "US", domain: "dining", tradition: "The Doggy Bag",
    origin_summary: "Taking home uneaten restaurant food in a 'doggy bag' was normalised during the Great Depression of the 1930s as a thrift practice and accelerated by post-war American restaurant portion sizes. Unlike many cultures where leaving leftovers signals satiation and respect for the host, the American norm treats taking food home as practical respect for the food itself and for one's own household. Asking for a 'box' or 'to go' is entirely standard at all but the most formal restaurants.",
    era: "Great Depression onward (1930s)",
    influences: ["Great Depression thrift culture", "Post-war American portion inflation", "Protestant anti-waste ethic"],
    connected_rule: "It is normal and unembarrassing to ask for a 'to-go box' for uneaten restaurant food. Doing so signals practical respect, not poor manners.",
  },

  // ── NETHERLANDS ──────────────────────────────────────────────────────────────
  {
    region_code: "NL", domain: "business", tradition: "Going Dutch",
    origin_summary: "The phrase 'going Dutch' — splitting a bill evenly — reflects a deep Dutch cultural preference, rooted in Calvinist thrift and a long mercantile-republican tradition of equality among trading partners. The 17th-century Dutch Republic's commercial culture treated mutual financial independence as a guarantor of free relationships; one party paying for another could create unwelcome obligation. Even in dating, splitting bills is unremarkable; in business, expense-sharing among peers is the norm.",
    era: "17th-century Dutch Republic onward",
    influences: ["Calvinist thrift tradition", "Dutch Republic mercantile equality", "Anti-obligation independence ethic"],
    connected_rule: "Expect bills to be split evenly with peers, including in business. One party covering the whole bill can create unwelcome sense of obligation.",
  },
  {
    region_code: "NL", domain: "greetings", tradition: "Three Cheek-Kisses Among Friends",
    origin_summary: "Among Dutch friends and family — particularly in the Catholic south — greetings between women (and between men and women) involve three light cheek-touches, alternating sides. The custom is informal and contextual: in the Calvinist north and in business, the firm handshake remains default. The split mirrors the older religious-cultural geography of the Netherlands between Catholic Brabant/Limburg and Protestant Holland.",
    era: "Older Catholic-Protestant cultural divide",
    influences: ["Catholic southern Dutch greeting tradition", "Calvinist northern reserve", "Burgundian Low Countries inheritance"],
    connected_rule: "Three cheek-touches are reserved for friends and family, more common in the Catholic south. Default to a firm handshake in business and with strangers.",
  },
  {
    region_code: "NL", domain: "greetings", tradition: "Direct Speech as Respect",
    origin_summary: "Dutch directness as a positive social value descends from Calvinist plain-speech tradition (16th-century Reformation), reinforced by the egalitarian mercantile culture of the Dutch Republic in which direct dealing among equals was a guarantor of trust. Indirect or diplomatic hedging is read in Dutch culture not as politeness but as evasion — the assumption is that an honest counterpart will tell you what they think.",
    era: "16th-century Reformation onward",
    influences: ["Calvinist plain-speech tradition", "Dutch Republic mercantile equality", "Anti-aristocratic civic culture"],
    connected_rule: "Direct critique and clear yes/no answers are read as respect, not aggression. Diplomatic hedging is read as evasive and lowers, not raises, trust.",
  },
  {
    region_code: "NL", domain: "business", tradition: "Polderen — Consensus Decision-Making",
    origin_summary: "The 'poldermodel' of consensus-seeking decision-making takes its name from the historical necessity of cooperation among landholders in the Dutch polders (reclaimed lowland), where any party's neglect of the dykes could flood the others' land. Medieval water boards (waterschappen, dating to the 13th century) were among Europe's earliest proto-democratic institutions. The principle — patient negotiation until all relevant parties can accept the outcome — survives in modern Dutch boards, government, and corporate governance.",
    era: "Medieval water boards (13th century) onward",
    influences: ["Medieval waterschap (water board) governance", "Calvinist consensus tradition", "20th-century neo-corporatist labour relations"],
    connected_rule: "Expect patient consensus-building rather than top-down decisions. Pushing for unilateral closure can damage rather than accelerate Dutch decision-making.",
  },
  {
    region_code: "NL", domain: "gift-giving", tradition: "Modest Gifts Only",
    origin_summary: "Dutch gift conventions favour the modest and considered — flowers, a bottle of wine, a book — over the lavish or expensive. The preference descends from the same Calvinist anti-ostentation tradition that shaped Dutch dress, architecture, and dining. Expensive gifts can read not as generous but as inappropriate — even faintly suspicious of currying favour. The cultural maxim 'doe maar gewoon, dan doe je al gek genoeg' ('just act normal — that's already odd enough') captures the principle.",
    era: "16th-century Reformation onward",
    influences: ["Calvinist anti-ostentation tradition", "Mercantile understatement", "Egalitarian civic culture"],
    connected_rule: "Bring modest, considered gifts to a Dutch host — flowers, wine, a book. Lavish or expensive gifts read as inappropriate or even suspect.",
  },

  // ── PORTUGAL ─────────────────────────────────────────────────────────────────
  {
    region_code: "PT", domain: "dining", tradition: "Bacalhau — The National Cod",
    origin_summary: "Portugal has a famously enormous repertoire of bacalhau (salt cod) dishes — said to number 365, one for each day of the year. The tradition descends from the 15th–16th-century Portuguese Atlantic exploration, when fleets fishing the Newfoundland Grand Banks brought home salt-preserved cod that became central to Catholic fast-day cuisine. Even today, Christmas Eve dinner is traditionally bacalhau cozido — a culinary continuity that links modern Portugal to its Age of Exploration heritage.",
    era: "15th–16th-century Atlantic exploration onward",
    influences: ["Portuguese Atlantic cod fishing", "Catholic fast-day cuisine", "Age of Exploration trade economics"],
    connected_rule: "Bacalhau is the national dish — accept and enjoy when offered. Christmas Eve bacalhau cozido is a culinary continuity treated with quiet seriousness.",
  },
  {
    region_code: "PT", domain: "greetings", tradition: "Two Cheek-Kisses Among Women",
    origin_summary: "Among friends and family, Portuguese greeting between women — and between women and men — involves two light cheek-touches, starting on the right cheek (the reverse of the Spanish convention). The custom shares the broader Iberian Mediterranean Roman tradition. Business introductions and male-male meetings default to a firm handshake; the kisses are reserved for established personal warmth.",
    era: "Roman Mediterranean tradition through modern era",
    influences: ["Roman osculum greeting", "Iberian Mediterranean greeting culture", "Catholic communal warmth"],
    connected_rule: "Greet women friends with two light cheek-touches starting on the right cheek. Default to a firm handshake in business and male-male meetings.",
  },
  {
    region_code: "PT", domain: "business", tradition: "Saudade-Inflected Pace",
    origin_summary: "Portuguese professional pace runs slower than Northern European norms — a quality often ascribed culturally to 'saudade', the Portuguese-Galician concept of melancholic longing that values reflection, depth, and the long view. The trait has practical roots in the Iberian Mediterranean tradition of relationship-first business and in Portugal's historical position as Europe's western edge, oriented toward a slower Atlantic and African pace rather than continental urgency.",
    era: "Iberian Mediterranean tradition",
    influences: ["Saudade reflective cultural concept", "Iberian Mediterranean relationship-first culture", "Atlantic-oriented historical pace"],
    connected_rule: "Allow more time than Northern European norms suggest. Pushing for fast closure can damage relationship-first Portuguese business pace.",
  },
  {
    region_code: "PT", domain: "dining", tradition: "Late Dinner Schedule",
    origin_summary: "Portuguese dinner runs later than most of Northern Europe — typically from 20:00 onward, with restaurant kitchens often busiest at 21:00–22:00. The schedule reflects the broader Iberian Mediterranean rhythm shared with Spain, modulated by Portugal's correct geographical positioning in GMT (unlike Spain, which shifted to CET in 1940). Proposing a 19:00 dinner reads as oddly early; the cultural prime time is later.",
    era: "Iberian Mediterranean tradition",
    influences: ["Iberian Mediterranean meal rhythm", "Solar-aligned daily schedule", "Catholic late-evening sociability"],
    connected_rule: "Plan dinner for 20:00 or later — restaurant kitchens are often busiest at 21:00–22:00. Earlier proposals read as oddly hurried.",
  },
  {
    region_code: "PT", domain: "gift-giving", tradition: "Avoid Lilies and Red Flowers",
    origin_summary: "As across Catholic Mediterranean Europe, Portuguese florist tradition reserves lilies and chrysanthemums for funerals and All Souls' Day cemetery offerings. Red flowers, particularly red carnations, additionally carry strong political associations with the 1974 Carnation Revolution — appropriate to the date, but charged in everyday gift contexts. Safe choices for hosts include mixed bouquets, roses (other than red), or potted plants.",
    era: "Catholic Mediterranean tradition; 1974 political layer",
    influences: ["Catholic All Souls' chrysanthemum tradition", "1974 Carnation Revolution political symbolism", "Iberian florist conventions"],
    connected_rule: "Avoid lilies and chrysanthemums (funeral flowers) and red carnations (1974 Carnation Revolution association). Mixed bouquets or potted plants are safe.",
  },

  // ── SOUTH AFRICA ─────────────────────────────────────────────────────────────
  {
    region_code: "ZA", domain: "greetings", tradition: "Multilingual Greeting",
    origin_summary: "South Africa's 1996 Constitution recognises eleven official languages — Zulu, Xhosa, Afrikaans, English, Sepedi, Setswana, Sesotho, Tsonga, Swati, Venda, Ndebele — each with significant speaker populations. Among South Africans, exchanging a greeting in the other person's home language ('Sawubona' in Zulu, 'Molo' in Xhosa, 'Goeie dag' in Afrikaans) is a small but powerful gesture of post-apartheid civic respect. English alone is comprehensible everywhere but reads as the least personally invested choice.",
    era: "Post-1994 democratic era (1996 Constitution)",
    influences: ["1996 Constitutional recognition of 11 languages", "Post-apartheid Truth and Reconciliation civic culture", "Bantu greeting traditions of mutual recognition"],
    connected_rule: "Learn at least one greeting in the home language of those you'll meet — 'Sawubona' (Zulu), 'Molo' (Xhosa), 'Goeie dag' (Afrikaans). The gesture is read as serious respect.",
  },
  {
    region_code: "ZA", domain: "dining", tradition: "The Braai as Social Institution",
    origin_summary: "The braai (Afrikaans for 'barbecue') is the central South African social ritual, transcending racial, linguistic, and class lines as one of the country's most genuinely shared institutions. Its roots blend Voortrekker open-fire cooking, Cape Malay marinades, and African open-fire traditions across the subcontinent. National Heritage Day (24 September) is widely celebrated as 'National Braai Day', a rare unifying cultural practice in a famously plural society. Hosting a braai is a meaningful gesture of inclusion.",
    era: "19th-century Voortrekker through modern era",
    influences: ["Voortrekker open-fire cooking", "Cape Malay marinade tradition", "African open-fire culinary heritage"],
    connected_rule: "Accept any invitation to a braai — it is the central South African social ritual and the host's gesture of inclusion. Bring meat, drink, or salad; offer to help at the fire.",
  },
  {
    region_code: "ZA", domain: "business", tradition: "Ubuntu — I Am Because We Are",
    origin_summary: "Ubuntu — the southern African philosophy that 'umuntu ngumuntu ngabantu' ('a person is a person through other persons') — frames identity as fundamentally communal and ethical responsibility as mutual. The concept was central to the post-apartheid Truth and Reconciliation Commission (1995–2002) under Archbishop Desmond Tutu, who explicitly grounded restorative justice in Ubuntu rather than purely retributive justice. In modern South African business, Ubuntu translates into expectation of community-aware, relational decision-making.",
    era: "Pre-colonial Bantu philosophy; post-1994 civic centrality",
    influences: ["Bantu philosophical tradition", "Truth and Reconciliation Commission framing", "Archbishop Desmond Tutu's ethical leadership"],
    connected_rule: "Frame decisions in terms of impact on the wider team and community, not just narrow stakeholder interest. Ubuntu-aware language signals serious engagement.",
  },
  {
    region_code: "ZA", domain: "greetings", tradition: "The Three-Stage Handshake",
    origin_summary: "The 'African handshake' or 'thumb handshake' — three stages: standard grip, then thumb grip, then return to standard — emerged in 20th-century township and pan-African solidarity culture and spread widely after 1994 across South African public life. It is now a common informal greeting between friends, colleagues, and across racial lines, distinct from the more formal Western handshake used for first introductions and across hierarchies.",
    era: "20th-century township culture; post-1994 mainstream",
    influences: ["Pan-African solidarity greetings", "Township informal culture", "Post-1994 cross-racial informal contact"],
    connected_rule: "Among friends and informal colleagues, expect the three-stage 'thumb handshake' — standard grip, thumb grip, return. Western handshake remains default for formal first contact.",
  },
  {
    region_code: "ZA", domain: "gift-giving", tradition: "Avoid the Left Hand",
    origin_summary: "Across South Africa's African and Indian communities — and increasingly observed as cross-cultural courtesy — gifts, money, and food should be passed and received with the right hand or with both hands. The convention has parallel roots in African traditional codes of respect (in which the left hand carries connotations of impurity in many Bantu cultures) and in the Indian Hindu and Muslim communities' similar conventions. Using the left hand is read as rude or careless.",
    era: "Layered: Bantu, Hindu, Islamic traditions",
    influences: ["Bantu traditional respect codes", "Indian-South African Hindu and Muslim conventions", "Post-1994 cross-cultural courtesy practice"],
    connected_rule: "Pass and receive gifts, money, and food with the right hand or both hands. Using the left hand reads as rude across most South African communities.",
  },
];

export async function seedCulturalOrigins() {
  console.log("Seeding cultural origins...");

  const result = await db
    .insert(culturalOriginsTable)
    .values(origins)
    .onConflictDoNothing();
  const added = result.rowCount ?? 0;
  console.log(`  Cultural origins: ${added} new rows inserted (${origins.length} total in seed, ${origins.length - added} already present)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedCulturalOrigins()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
