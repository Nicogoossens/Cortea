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
