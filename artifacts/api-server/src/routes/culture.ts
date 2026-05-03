import { Router } from "express";
import { db } from "@workspace/db";
import { cultureProtocolsTable, compassRegionsTable, culturalOriginsTable, usersTable } from "@workspace/db";
import { eq, and, or, isNull, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuthUser, resolveUserTier, getResolvedUserId } from "../lib/auth-middleware";
import { TIER_FEATURES, type SubscriptionTier, hasFeatureAccess, canAccessRegion } from "../lib/tier-features";

const router = Router();

const DEFAULT_LOCALE = "en-GB";

function resolveLocaleContent(
  content: Record<string, Record<string, unknown>>,
  locale: string,
): Record<string, unknown> {
  if (content[locale]) return content[locale];
  const base = locale.split("-")[0].toLowerCase();
  if (content[base]) return content[base];
  const variantKey = Object.keys(content).find(
    (k) => k.toLowerCase().startsWith(base + "-"),
  );
  if (variantKey) return content[variantKey];
  if (content[DEFAULT_LOCALE]) return content[DEFAULT_LOCALE];
  if (content["en"]) return content["en"];
  const enKey = Object.keys(content).find((k) => k.toLowerCase().startsWith("en"));
  return enKey ? content[enKey] : {};
}

interface MehrabianWeight {
  nonverbal: number;
  tone: number;
  words: number;
  note: string;
}

const MEHRABIAN_WEIGHTS: Record<string, MehrabianWeight> = {
  JP: { nonverbal: 70, tone: 22, words: 8, note: "Posture, silence, and bowing convey most meaning. Words are secondary." },
  CN: { nonverbal: 60, tone: 30, words: 10, note: "Tone and composed demeanour signal respect. Face is preserved through bearing, not words alone." },
  AE: { nonverbal: 55, tone: 35, words: 10, note: "Physical presence and sincerity of bearing carry great weight. Spiritual composure is observed." },
  IN: { nonverbal: 55, tone: 30, words: 15, note: "Warmth in voice and respectful posture smooth social interactions significantly." },
  SG: { nonverbal: 50, tone: 30, words: 20, note: "Measured, composed behaviour signals education. Economy of expression is valued." },
  FR: { nonverbal: 45, tone: 35, words: 20, note: "Articulate speech and deliberate expression matter. Controlled elegance in gesture and tone." },
  IT: { nonverbal: 50, tone: 35, words: 15, note: "Expressive gesture is natural; manner of dress speaks before words do." },
  BR: { nonverbal: 50, tone: 35, words: 15, note: "Warmth and physical closeness are expected. Animated expression signals genuine engagement." },
  ES: { nonverbal: 48, tone: 37, words: 15, note: "Animated expression and vocal warmth are natural. Tone signals enthusiasm." },
  MX: { nonverbal: 48, tone: 37, words: 15, note: "Warmth in tone and personal greeting carry significant social weight." },
  ZA: { nonverbal: 48, tone: 35, words: 17, note: "Ubuntu is felt through warmth and genuine presence. Engage with your whole bearing." },
  PT: { nonverbal: 45, tone: 35, words: 20, note: "Measured and sincere tone is most trusted. Restraint signals depth of character." },
  AU: { nonverbal: 40, tone: 38, words: 22, note: "Easy, open posture and a relaxed direct tone win trust. Authenticity is paramount." },
  US: { nonverbal: 38, tone: 37, words: 25, note: "Confident body language and animated but controlled voice signal leadership." },
  GB: { nonverbal: 40, tone: 40, words: 20, note: "Composure is all. Restrained gesture and measured tone signal good breeding." },
  DE: { nonverbal: 35, tone: 35, words: 30, note: "Precision of speech is valued above warmth. Sincerity in expression outweighs affability." },
  CA: { nonverbal: 35, tone: 38, words: 27, note: "Clear verbal communication is primary. Direct, polite, precise speech is valued." },
  NL: { nonverbal: 32, tone: 35, words: 33, note: "Direct verbal communication is primary. Words are chosen precisely; meaning lives in the words." },
  LB: { nonverbal: 35, tone: 35, words: 30, note: "Hospitality, sophistication and resilience — Lebanese identity is built on cosmopolitan pride, family loyalty, and the conviction that beauty and pleasure mu…." },
  OM: { nonverbal: 50, tone: 25, words: 25, note: "Quiet dignity, deep tradition, and natural hospitality — Oman defines itself by graciousness, not by spectacle, and by Ibadi Islamic moderation rather than t…." },
  KE: { nonverbal: 40, tone: 30, words: 30, note: "Pride in heritage and natural wealth, hospitable warmth, and a hard-working entrepreneurial spirit — Kenya sees itself as East Africa's leading nation, with…." },
  NG: { nonverbal: 30, tone: 40, words: 30, note: "Ambition, expressive confidence, religious devotion, and family loyalty — Nigeria is Africa's most populous nation, the cultural and economic powerhouse of W…." },
  ET: { nonverbal: 45, tone: 25, words: 30, note: "Pride in three thousand years of civilisation, religious devotion, and proud independence — Ethiopia views itself as the cradle of humanity, the Lion of Juda…." },
  GH: { nonverbal: 35, tone: 35, words: 30, note: "Hospitality, dignity, peaceful democracy, and pride in West African leadership — Ghana sees itself as the gateway to Africa, the first sub-Saharan nation to…." },
  TZ: { nonverbal: 40, tone: 30, words: 30, note: "Peace, unity, and unhurried dignity — Tanzania defines itself by the ujamaa (familyhood) socialism of founder Julius Nyerere, by the swahili coastal heritage…." },
  AR: { nonverbal: 25, tone: 40, words: 35, note: "European-style sophistication, intellectual seriousness, fierce regional and football identity, and the passion of the national character — Argentines see th…." },
  CL: { nonverbal: 40, tone: 30, words: 30, note: "Modesty, hard work, careful institutional respect, and quiet pride in being South America's most stable, organised, and prosperous nation — Chileans are rese…." },
  PE: { nonverbal: 40, tone: 30, words: 30, note: "Profound pride in three thousand years of Andean civilisation, distinctive culinary heritage, and respect for both indigenous and Spanish colonial inheritanc…." },
  CR: { nonverbal: 35, tone: 30, words: 35, note: "Pura vida — pure life — is genuinely the cultural philosophy: peaceful, environmentally conscious, family-centred, gentle, and proud of being Central America…." },
  UY: { nonverbal: 40, tone: 25, words: 35, note: "Quiet dignity, social progressivism, deep football passion, and the tranquilidad (tranquillity) that distinguishes Uruguay from its Latin American neighbours…." },
  CU: { nonverbal: 30, tone: 45, words: 25, note: "Resilience, joy in adversity, deep musicality, family loyalty, and the cultural pride that is the result of decades of isolation — Cubans build remarkable li…." },
  NZ: { nonverbal: 35, tone: 30, words: 35, note: "Egalitarianism, modesty, environmental stewardship, and quiet pride — New Zealanders distrust pretension, value practical competence, and define themselves b…." },
  HR: { nonverbal: 40, tone: 30, words: 30, note: "Mediterranean dignity, deep Catholic and Adriatic heritage, and strong national pride hardened by the independence struggle — Croatia sees itself as a Centra…." },
  RO: { nonverbal: 40, tone: 30, words: 30, note: "Resilience, deep Orthodox spirituality, Latin cultural heritage, and quiet pride in surviving difficult history — Romanians see themselves as a Latin-Christi…." },
  EE: { nonverbal: 50, tone: 20, words: 30, note: "Quiet self-reliance, digital innovation, deep nature connection, and the proud assertion of Nordic-Estonian identity — Estonia has built itself in 30 years f…." },
  SI: { nonverbal: 45, tone: 25, words: 30, note: "Quiet competence, deep nature connection, Central European refinement, and the careful self-positioning between Italian, Austrian, and Croatian influences —…." },
  MT: { nonverbal: 35, tone: 35, words: 30, note: "Catholic devotion, fortress-island resilience, deep British-Mediterranean fusion identity, and the proud claim to one of the world's longest continuous human…." },
  LK: { nonverbal: 40, tone: 30, words: 30, note: "Hospitality, deep Buddhist devotion, pride in two thousand years of continuous civilisation, and the resilient warmth that has survived war, tsunami, and eco…." },
  KH: { nonverbal: 50, tone: 20, words: 30, note: "Buddhist gentleness, deep reverence for Angkor heritage, family solidarity, and quiet resilience — Cambodia has rebuilt itself from one of the worst genocide…." },
  MV: { nonverbal: 45, tone: 25, words: 30, note: "Sunni Muslim devotion, ocean-life expertise, hospitality refined to luxury-tourism perfection, and the proud Maldivian identity that has survived sultanates,…." },
  NP: { nonverbal: 45, tone: 25, words: 30, note: "Hindu-Buddhist syncretic devotion, mountain-people resilience, deep hospitality, and the dignified pride of having never been colonised — Nepal is the only S…." },
  BW: { nonverbal: 50, tone: 20, words: 30, note: "Botho (humanity, the African Ubuntu equivalent), peaceful democracy, conservative dignity, and quiet pride in being Africa's longest-running stable multi-par…." },
  RW: { nonverbal: 45, tone: 25, words: 30, note: "Reconciliation, dignity, ambitious modernisation, and the hard-won pride of a country that rebuilt itself from the 1994 genocide into one of Africa's most am…." },
  MU: { nonverbal: 35, tone: 35, words: 30, note: "Multicultural harmony, French-British colonial-fusion sophistication, deep family loyalty across all communities, and the proud assertion of being \"the rainb…." },
  BG: { nonverbal: 30, tone: 40, words: 30, note: "Slavic Orthodox heritage and hospitality — voice and tone carry storytelling warmth." },
  UA: { nonverbal: 30, tone: 40, words: 30, note: "Resilience and pride in a 1,000-year heritage — vocal warmth and emphatic tone carry conviction." },
  CY: { nonverbal: 25, tone: 40, words: 35, note: "Mediterranean hospitality and Orthodox heritage — voice and articulate phrasing lead the encounter." },
  LU: { nonverbal: 35, tone: 25, words: 40, note: "Discreet European sophistication and multilingual openness — words are chosen precisely." },
  PK: { nonverbal: 30, tone: 40, words: 30, note: "Generous hospitality and family loyalty — poetic phrasing and warm tone are deeply admired." },
  MN: { nonverbal: 40, tone: 30, words: 30, note: "Nomadic pride and Buddhist heritage — composed steppe bearing carries the cultural memory." },
  BH: { nonverbal: 40, tone: 30, words: 30, note: "Pearl-trading heritage and refined Gulf hospitality — gracious patience and dignity are read first." },
  TN: { nonverbal: 25, tone: 40, words: 35, note: "Mediterranean Maghreb sophistication — humour, voice and articulate code-switching lead." },
  SN: { nonverbal: 35, tone: 40, words: 25, note: "Teranga hospitality and Sufi spirituality — melodic voice and storytelling carry social weight." },
  FJ: { nonverbal: 30, tone: 45, words: 25, note: "The Bula spirit — generous, gentle, communal warmth — vocal warmth and tone carry the welcome." },
  AT: { nonverbal: 52, tone: 23, words: 25, note: "Refined formality, intellectual seriousness, and deep pride in cultural heritage — Austria sees itself as the surviving heart of Mitteleuropa." },
  CZ: { nonverbal: 55, tone: 18, words: 27, note: "Quiet competence, dry wit, and deep cultural literacy — Czechs prize understatement, scepticism, and the well-made object." },
  DK: { nonverbal: 50, tone: 20, words: 30, note: "Egalitarian quiet, design intelligence, and well-earned trust — Denmark prizes restraint, social cohesion, and the well-made everyday object." },
  FI: { nonverbal: 60, tone: 12, words: 28, note: "Sisu — quiet endurance, honest competence, and the dignity of doing things properly without comment." },
  EG: { nonverbal: 40, tone: 35, words: 25, note: "Karam — generosity." },
  RS: { nonverbal: 30, tone: 40, words: 30, note: "Slavic Orthodox heritage, fierce hospitality, and pride in a 1,200-year history of empire, resistance, and cultural defiance." },
  LT: { nonverbal: 40, tone: 30, words: 30, note: "Quiet pride in being one of Europe's last pagan countries (Christianised only in 1387), Baltic forest spirituality, and the cultural defiance that survived t…." },
  SK: { nonverbal: 40, tone: 25, words: 35, note: "Quiet Slavic-Catholic heritage, mountain-and-folk identity, and pride in being a Central European country with both Habsburg sophistication and deep village…." },
  BD: { nonverbal: 25, tone: 45, words: 30, note: "Bengali cultural pride — language, literature, music, food — combined with Muslim majority hospitality and the deep memory of the 1971 Liberation War that fo…." },
  MM: { nonverbal: 40, tone: 35, words: 25, note: "Theravada Buddhist devotion that pervades daily life, alongside an ancient cultural pride that draws on Pyu, Mon, Bamar, and Shan civilisations stretching ba…." },
  BT: { nonverbal: 45, tone: 30, words: 25, note: "Vajrayana Buddhist devotion, environmental stewardship, and the philosophy of Gross National Happiness — measuring well-being above GDP — that defines the ki…." },
  KW: { nonverbal: 40, tone: 30, words: 30, note: "Resilient mercantile heritage — Kuwait was a major trading and pearl-diving port long before oil — combined with refined Gulf hospitality and pride in the co…." },
  DZ: { nonverbal: 25, tone: 40, words: 35, note: "Maghreb-Berber-Arab pride combined with deep memory of the long, bloody War of Independence against France — Algeria sees itself as the leading anti-colonial…." },
  DO: { nonverbal: 30, tone: 45, words: 25, note: "Caribbean-Spanish warmth, deep Catholic-syncretic religiosity, and pride in being the cradle of European America — Santo Domingo was the first European city…." },
  PA: { nonverbal: 25, tone: 40, words: 35, note: "Trans-isthmian crossroads identity — Panama has been a trading bridge between oceans and continents for 500 years — combined with cosmopolitan urban sophisti…." },
  AL: { nonverbal: 35, tone: 40, words: 25, note: "Besa — the deeply held code of honour, hospitality, and given word — combined with mountain-Highland resilience." },
  BA: { nonverbal: 30, tone: 40, words: 30, note: "Multicultural-multireligious heritage — Sarajevo of mosques, churches, synagogues, and cathedrals within 200 metres — combined with Slavic warmth." },
  MK: { nonverbal: 30, tone: 40, words: 30, note: "Slavic Orthodox heritage centred on Lake Ohrid and the legacy of Saints Cyril and Methodius, combined with Balkan-Mediterranean warmth." },
  LA: { nonverbal: 45, tone: 30, words: 25, note: "Theravada Buddhist serenity, gentle hospitality, and the unhurried bo pen yang approach — Laos cultivates calm and indirect communication." },
  BN: { nonverbal: 45, tone: 30, words: 25, note: "Devout Sunni Muslim faith, deep respect for one of the oldest continuous Islamic monarchies, and the Melayu Islam Beraja philosophy." },
  KZ: { nonverbal: 40, tone: 35, words: 25, note: "Steppe-nomadic heritage, Turkic-Islamic identity, and a careful balancing of Russian, Chinese, and Western relationships." },
  EC: { nonverbal: 35, tone: 40, words: 25, note: "Andean-indigenous heritage layered with Spanish-colonial Catholic depth, Pacific-coast openness, and Amazon biodiversity." },
  GT: { nonverbal: 35, tone: 40, words: 25, note: "Maya cultural depth — heart of the ancient Maya world with 22 living Mayan-speaking communities — combined with Spanish-colonial Catholic heritage." },
  BO: { nonverbal: 40, tone: 35, words: 25, note: "Plurinational indigenous identity — Aymara, Quechua, Guaraní, and 33 other recognised peoples — combined with Andean-altitude resilience." },
  JM: { nonverbal: 30, tone: 45, words: 25, note: "One Love — the Bob Marley-articulated Jamaican spirit of warmth, openness, and resilience — combined with deep Black-Caribbean cultural confidence." },
  GR: { nonverbal: 38, tone: 42, words: 20, note: "Philotimo — the love of honour, the moral obligation to do right by your guest, family, and community without being asked." },
  HU: { nonverbal: 48, tone: 22, words: 30, note: "Cultural depth, intellectual seriousness, and Mitteleuropean refinement — Hungary sees itself as the eastern outpost of Habsburg high culture." },
  IS: { nonverbal: 55, tone: 18, words: 27, note: "Quiet self-reliance, dry humour, and respect for the land — a small island of literate fishermen and farmers who built a modern country in three generations." },
  IE: { nonverbal: 35, tone: 30, words: 35, note: "Craic — the conversational warmth, generosity of company, and shared good humour that is the centre of Irish social life." },
  NO: { nonverbal: 50, tone: 22, words: 28, note: "Friluftsliv — the open-air life — and quiet egalitarian competence." },
  PL: { nonverbal: 45, tone: 25, words: 30, note: "Honor and gościnność — honour and hospitality." },
  SE: { nonverbal: 50, tone: 18, words: 32, note: "Lagom — \"just enough\", the principle of balanced moderation that runs through Swedish design, business, and social life." },
  RU: { nonverbal: 47, tone: 28, words: 25, note: "Dusha — soul." },
  TR: { nonverbal: 42, tone: 30, words: 28, note: "Misafirperverlik — the sacred hospitality." },
  KR: { nonverbal: 55, tone: 18, words: 27, note: "Jeong — the deep emotional bond that develops between people through shared time, food, and obligation." },
  TH: { nonverbal: 60, tone: 12, words: 28, note: "Sanuk and jai yen — fun and a cool heart." },
  VN: { nonverbal: 53, tone: 17, words: 30, note: "Tinh cảm — the network of feeling, obligation, and care that runs through family and community." },
  ID: { nonverbal: 60, tone: 12, words: 28, note: "Gotong royong — mutual cooperation, the principle that the community works together as a unit." },
  MY: { nonverbal: 55, tone: 18, words: 27, note: "Budi bahasa — refined courtesy, the cultivated manner that holds the multi-ethnic society together." },
  PH: { nonverbal: 38, tone: 32, words: 30, note: "Hiya and delicadeza — shame and propriety, the cultivated sense of how to behave that prevents social embarrassment for yourself and others." },
  HK: { nonverbal: 50, tone: 22, words: 28, note: "Mou man tai — \"no problem\" — the Hong Kong attitude of fast, efficient, can-do pragmatism." },
  TW: { nonverbal: 48, tone: 20, words: 32, note: "Renqing — the social warmth, mutual obligation, and considered courtesy that runs through Taiwanese life." },
  SA: { nonverbal: 50, tone: 25, words: 25, note: "Karam and iman — generosity and faith." },
  QA: { nonverbal: 50, tone: 25, words: 25, note: "Karam — generosity and hospitality." },
  MA: { nonverbal: 42, tone: 30, words: 28, note: "Diyafa and barakah — generosity and grace." },
  IL: { nonverbal: 32, tone: 38, words: 30, note: "Chutzpah — the audacious directness, the willingness to challenge, the refusal to defer." },
  JO: { nonverbal: 50, tone: 25, words: 25, note: "Karam and sharaf — generosity and honour, in the Bedouin tradition that underlies all Jordanian social life." },
  LV: { nonverbal: 40, tone: 30, words: 30, note: "Quiet pride in being one of Europe's last European peoples to be Christianised, deep folk-song heritage (the dainas — the world's largest folk-song corpus),…." },
  ME: { nonverbal: 40, tone: 30, words: 30, note: "Mountain-warrior heritage (the Njegoš tradition of dignity, čojstvo — manliness — and junaštvo — heroism) combined with Adriatic-coastal openness and Slavic-…." },
  MC: { nonverbal: 40, tone: 25, words: 35, note: "Monégasque sovereign heritage (the Grimaldi dynasty's continuous rule since 1297, the third-oldest in Europe), refined French Riviera-Italian-Genoese cultura…." },
  BY: { nonverbal: 40, tone: 25, words: 35, note: "Slavic Orthodox heritage with strong Polish-Lithuanian historical influence, deep folk-cultural traditions, and a quiet pride in being a distinct Slavic peop…." },
  UZ: { nonverbal: 40, tone: 25, words: 35, note: "Silk Road heritage — the heart of Timur's empire, the Samarkand-Bukhara-Khiva architectural civilisation — combined with Turkic-Islamic identity and the warm…." },
  MO: { nonverbal: 40, tone: 30, words: 30, note: "The unique Macanese hybrid — Portuguese colonial heritage layered with Cantonese-Chinese culture — combined with cosmopolitan East-meets-West sophistication…." },
  TM: { nonverbal: 45, tone: 30, words: 25, note: "Turkmen tribal heritage centred on the Akhal-Teke horse, the halı (carpet) tradition, and the Ruhnama-era national symbols, combined with deep desert-Bedouin…." },
  IR: { nonverbal: 30, tone: 30, words: 40, note: "Persian civilisational pride — Iran is the heir of one of the longest continuous civilisations on Earth, with extraordinary heritage in poetry (Hafez, Rumi,…." },
  IQ: { nonverbal: 35, tone: 40, words: 25, note: "Mesopotamian civilisational depth — Iraq holds the cradle of urban civilisation (Sumer, Babylon, Assyria, Akkad) — combined with deep Arab-Islamic heritage a…." },
  YE: { nonverbal: 40, tone: 25, words: 35, note: "Arabia Felix — the historic ancient incense-and-coffee heritage that gave us the Arabic word qahwa (coffee) — combined with deep tribal-Islamic identity and…." },
  NA: { nonverbal: 35, tone: 40, words: 25, note: "Wide-open landscape pride (the world's second-lowest population density), German-Afrikaans-Bantu cultural mix, and post-1990 independence pride combined with…." },
  ZW: { nonverbal: 25, tone: 40, words: 35, note: "Pride in the medieval Great Zimbabwe civilisation (8th–15th century — one of sub-Saharan Africa's most sophisticated, giving the country its name), the long…." },
  UG: { nonverbal: 25, tone: 40, words: 35, note: "The Pearl of Africa — Churchill's phrase for the country's spectacular natural beauty — combined with deep Bantu hospitality, the Buganda Kingdom heritage, a…." },
  MG: { nonverbal: 25, tone: 40, words: 35, note: "The unique island heritage — Madagascar diverged from Africa 165 million years ago, has 90% endemic species, and combines Indonesian-Austronesian heritage (t…." },
  BS: { nonverbal: 30, tone: 40, words: 30, note: "It is better in the Bahamas — the long-running national tourism slogan that captures the genuine warmth, the spectacular natural setting, and the unhurried B…." },
  TT: { nonverbal: 25, tone: 45, words: 30, note: "Cosmopolitan Caribbean creativity — Trinidad & Tobago invented calypso, steel-pan, and soca, and hosts the most musically and culturally innovative Carnival…." },
  VE: { nonverbal: 25, tone: 40, words: 35, note: "Bolivarian heritage — Venezuela is the birthplace of Simón Bolívar, El Libertador of South America — combined with Caribbean-Andean-Llanero cultural mix and…." },
  PY: { nonverbal: 25, tone: 40, words: 35, note: "Guaraní cultural depth — Paraguay is the only Spanish-American country where an indigenous language is co-official and spoken by the majority — combined with…." },
  PG: { nonverbal: 40, tone: 35, words: 25, note: "Extraordinary cultural diversity — PNG has 800+ living languages (the world's most linguistically diverse country, with about 12% of the world's languages in…." },
  WS: { nonverbal: 45, tone: 30, words: 25, note: "Fa'a Sāmoa — the Samoan way — the deeply-held cultural framework that organises society around extended family (aiga), chiefly hierarchy (matai), Christian d…." },
  MZ: { nonverbal: 25, tone: 40, words: 35, note: "Indian Ocean cosmopolitanism — Mozambique's coast was the Land of Sofala of medieval Arab-Swahili-Persian-Indian-Portuguese trade — combined with deep Bantu…." },
  ZM: { nonverbal: 25, tone: 40, words: 35, note: "One Zambia, One Nation — the Kenneth Kaunda-era founding principle that has held the country together despite 70+ ethnic-language groups, combined with extra…." },
  MW: { nonverbal: 25, tone: 40, words: 35, note: "The Warm Heart of Africa — the long-running national tourism slogan that captures the genuine extraordinary warmth — combined with deep Chewa-Yao-Tumbuka cul…." },
  AO: { nonverbal: 25, tone: 40, words: 35, note: "Ovimbundu-Mbundu-Bakongo Bantu cultural depth combined with Portuguese colonial heritage and pride in the long independence struggle (1961–1975) and the resi…." },
  CD: { nonverbal: 25, tone: 45, words: 30, note: "Vast cultural-natural depth — DRC is among Africa's largest, most-populous, and most-biodiverse countries, with the world's second-largest rainforest, the Co…." },
  CM: { nonverbal: 25, tone: 40, words: 35, note: "Africa in miniature — Cameroon's astonishing geographic, ethnic, linguistic, and religious diversity (250+ ethnic groups, French and English official langu…." },
  CI: { nonverbal: 25, tone: 40, words: 35, note: "Akwaba (welcome) — the deeply held Ivorian tradition of warm hospitality — combined with West African-Francophone cultural confidence and pride in the countr…." },
  ML: { nonverbal: 25, tone: 35, words: 40, note: "The deepest West-African civilizational heritage — Mali is the heir of three of medieval Africa's greatest empires (Ghana, Mali, Songhai), the Timbuktu manus…." },
  MD: { nonverbal: 25, tone: 40, words: 35, note: "Moldovan-Romanian linguistic-cultural heritage layered with Slavic-Soviet experience and the deep wine-and-agricultural heritage that makes Moldova one of th…." },
  HT: { nonverbal: 25, tone: 40, words: 35, note: "The pride of being the world's first independent Black republic and the only successful slave revolution in modern history (1791–1804) — combined with deep A…." },
  HN: { nonverbal: 25, tone: 40, words: 35, note: "Maya cultural heritage at the southern reach of the ancient Maya world (Copán was a major Classic-Maya city) combined with Spanish-colonial Catholic traditio…." },
  SV: { nonverbal: 25, tone: 40, words: 35, note: "La Tierra de las Sonrisas — the Salvadoran cultural identity grounded in resilience after the brutal civil war, deep Pipil-Maya indigenous heritage, the pupu…." },
  NI: { nonverbal: 30, tone: 40, words: 30, note: "Nica pride — the deep cultural confidence of being Central America's largest country (geographically), the heritage of the León-Granada colonial rivalry that…." },
  BB: { nonverbal: 25, tone: 40, words: 35, note: "Bajan distinctiveness — the deep cultural confidence of being among the longest-continuously-British Caribbean territory (1627–1966 — Little England) — combi…." },
  BZ: { nonverbal: 25, tone: 40, words: 35, note: "The unique English-speaking Central American identity — Belize is the only Anglophone country in Central America (formerly British Honduras), with the unpara…." },
  SR: { nonverbal: 25, tone: 40, words: 35, note: "The astonishing multicultural identity — Suriname is among the world's most ethnically and religiously diverse societies, with no majority group: Hindustani…." },
  GY: { nonverbal: 25, tone: 40, words: 35, note: "The unique English-speaking South American identity — Guyana is the only Anglophone country on the South American mainland, with the dual Indo-Guyanese (Hind…." },
  TO: { nonverbal: 45, tone: 30, words: 25, note: "Anga fakatonga — the Tongan way — the deeply held cultural framework of fa'a Tonga, organising society around the kāinga (extended family), the chiefly hiera…." },
  TV: { nonverbal: 35, tone: 40, words: 25, note: "The deep heritage of the Tuvaluan people — among the world's most-traditional Polynesian cultures, with heritage fatele community-singing-and-dancing — combi…." },
  NR: { nonverbal: 35, tone: 40, words: 25, note: "The unique heritage of the Nauruan people — Micronesian-Polynesian cultural traditions on the world's third-smallest sovereign state — combined with the heri…." },
  MH: { nonverbal: 35, tone: 40, words: 25, note: "The deep heritage of the Marshallese people — heritage Micronesian seafarers and navigators with the heritage meto (stick-chart) ocean-navigation tradition —…." },
  FM: { nonverbal: 40, tone: 35, words: 25, note: "The deep heritage of four distinct Micronesian states — Yap (with the heritage stone-money tradition), Chuuk (with the spectacular WWII Truk Lagoon wreck-div…." },
  PW: { nonverbal: 35, tone: 40, words: 25, note: "The deep heritage of being one of the world's most-significant marine-protection nations — Palau established the world's first shark sanctuary (2009), the wo…." },
  PS: { nonverbal: 35, tone: 40, words: 25, note: "The deep heritage of one of the world's most-continuously-inhabited regions — Palestine holds Bethlehem (the Christian heritage birthplace of Jesus), Jerusal…." },
  XK: { nonverbal: 25, tone: 40, words: 35, note: "The deep heritage of being one of Europe's youngest nations (independent 2008) and the heritage Albanian-Kosovan cultural identity — combined with the herita…." },
  CK: { nonverbal: 35, tone: 40, words: 25, note: "The deep heritage of the Cook Islands Māori people — Polynesian descendants of the heritage vaka (great voyaging canoe) navigators who settled the Pacific fr…." },
  NU: { nonverbal: 35, tone: 40, words: 25, note: "The unique heritage of the Niuean people — Polynesian descendants of the heritage Tongan-Samoan voyagers who settled the island over 1,000 years ago — combin…." },
  PF: { nonverbal: 35, tone: 40, words: 25, note: "The deep heritage of being among the world's most-significant Polynesian cultural-heritage centres — the heritage fa'a'apu (Polynesian voyaging) navigation,…." },
  BL: { nonverbal: 40, tone: 35, words: 25, note: "The deep heritage of the French-Caribbean luxury island — Saint-Barthélemy has been among the world's heritage celebrity-and-yacht destinations since the 1950…." },
  BM: { nonverbal: 40, tone: 35, words: 25, note: "The deep heritage of being among the world's oldest English-speaking settlements (continuously since 1612) — Bermuda's heritage British-Bermudian cultural id…." },
  KY: { nonverbal: 40, tone: 35, words: 25, note: "The unique heritage of being one of the world's most-significant offshore-finance centres — combined with the heritage seven-mile-beach Grand Cayman setting…." },
  TC: { nonverbal: 25, tone: 40, words: 35, note: "The heritage of being among the world's most-significant Caribbean luxury-and-yacht destinations — combined with the spectacular Grace Bay Beach (consistently…." },
  AW: { nonverbal: 25, tone: 40, words: 35, note: "The unique heritage of the Aruban people — heritage Caquetio Indigenous, Spanish, Dutch, African, and Caribbean cultural fusion — combined with the heritage…." },
  CW: { nonverbal: 25, tone: 40, words: 35, note: "The deep heritage of being among the Caribbean's most-significant Dutch-colonial Caribbean architectural sites — the Willemstad UNESCO heritage (the pastel-col…." },
  GL: { nonverbal: 40, tone: 35, words: 25, note: "The deep heritage of being the world's largest island (2.16 million km², 80% covered by the Greenland Ice Sheet) and home to the heritage Inuit-Greenlandic K…." },
  FO: { nonverbal: 40, tone: 35, words: 25, note: "The deep heritage of the Faroese people — descendants of Norse-Viking settlers from the 9th century — combined with the heritage of being among the world's m…." },
  AD: { nonverbal: 40, tone: 30, words: 30, note: "The deep heritage of being Europe's largest co-principality (since 1278) — jointly governed by the Bishop of Urgell and the President of France — combined wi…." },
  AF: { nonverbal: 50, tone: 30, words: 20, note: "Pashtunwali — the ancient code of honour, hospitality, and justice that governs traditional Pashtun life — combined with deep Islamic devotion and the millen…." },
  AG: { nonverbal: 30, tone: 40, words: 30, note: "The unique heritage of being among the Caribbean's most historically significant English-speaking islands — combined with 365 beaches (one for every day of th…." },
  BF: { nonverbal: 30, tone: 40, words: 30, note: "The deep Sahelian-West African heritage — Burkina Faso's Mossi empire (one of medieval West Africa's most powerful) combined with the rich griot tradition, th…." },
  BI: { nonverbal: 35, tone: 35, words: 30, note: "The deep Interlacustrine Bantu heritage — Burundi shares the Great Lakes cultural world with Rwanda and eastern DRC, with the remarkable ingoma (royal drum) t…." },
  BJ: { nonverbal: 30, tone: 40, words: 30, note: "The deep Fon-Yoruba-Ewe cultural heritage — Benin is the birthplace of Vodun (the original Voodoo religion), the heir of the powerful Dahomey kingdom (one o…." },
  CF: { nonverbal: 30, tone: 40, words: 30, note: "The deep Sango-speaking Bantu heritage of Central Africa — combined with the remarkable biodiversity of the Congo Basin and the resilience of a people who ha…." },
  CG: { nonverbal: 30, tone: 40, words: 30, note: "The deep Kongo-Teke-Mbochi Bantu heritage — combined with Francophone cultural identity and the heritage of being one of Africa's most-urbanised countries (7…." },
  DJ: { nonverbal: 40, tone: 35, words: 25, note: "The deep Afar-Somali-Arab-French cultural fusion — Djibouti sits at the intersection of the Red Sea and the Gulf of Aden, one of the world's most-strategic s…." },
  DM: { nonverbal: 30, tone: 40, words: 30, note: "The unique heritage of being the Caribbean's most-intact pre-Columbian culture — Dominica's Kalinago (Carib) people are the last indigenous Caribbeans with a…." },
  ER: { nonverbal: 40, tone: 35, words: 25, note: "The deep Tigrinya-Tigre-Afar heritage — Eritrea's highland civilization is among the oldest in the Horn of Africa, with the ancient Aksumite empire's south…." },
  GA: { nonverbal: 30, tone: 40, words: 30, note: "The deep Fang-Myene-Nzebi Bantu heritage — combined with the extraordinary biodiversity (80% forest cover, the Congo Basin's western edge) and the heritage o…." },
  GD: { nonverbal: 30, tone: 40, words: 30, note: "The unique Spice Isle heritage — Grenada produces a significant share of the world's nutmeg and is known for the warmth of its people and the beauty of its c…." },
  GM: { nonverbal: 35, tone: 40, words: 25, note: "The deep Mandinka-Wolof-Fula heritage of the Senegambia region — combined with the heritage of being among West Africa's smallest countries and the Smiling C…." },
  GN: { nonverbal: 30, tone: 40, words: 30, note: "The deep Peuhl-Malinké-Soussou heritage — Guinea is the heir of the ancient Mali and Songhai empires and the birthplace of one of West Africa's greatest musi…." },
  GQ: { nonverbal: 30, tone: 40, words: 30, note: "The unique Spanish-speaking African identity — Equatorial Guinea is the only Spanish-speaking country in Africa, with a remarkable Fang-Bubi-Ndowe cultural he…." },
  GW: { nonverbal: 35, tone: 40, words: 25, note: "The deep Balanta-Fula-Mandinka heritage of the Senegambia region — Guinea-Bissau's remarkable ethnic diversity (30+ groups) combined with the heritage of the…." },
  KG: { nonverbal: 45, tone: 30, words: 25, note: "Kyrgyz nomadic heritage — the yurt, the eagle hunter, the Epic of Manas (one of the world's longest oral epics) — combined with the Tian Shan mountain cultur…." },
  KI: { nonverbal: 35, tone: 40, words: 25, note: "The deep I-Kiribati heritage — Polynesian-Micronesian seafarers who settled the central Pacific — combined with the existential reality of being among the wo…." },
  KM: { nonverbal: 35, tone: 40, words: 25, note: "The deep Comorian heritage — a remarkable Swahili-Arab-Malagasy-French cultural fusion on four volcanic islands at the northern mouth of the Mozambique Channe…." },
  KN: { nonverbal: 35, tone: 40, words: 25, note: "The unique heritage of being the smallest sovereign state in the Western Hemisphere (by both area and population) — combined with the rich British-Caribbean cu…." },
  KP: { nonverbal: 60, tone: 20, words: 20, note: "Juche — the North Korean ideology of self-reliance — combined with the profound Confucian heritage of Korea's ancient Joseon-dynasty civilization and the deep…." },
  LC: { nonverbal: 30, tone: 40, words: 30, note: "The unique heritage of Saint Lucia — two Nobel Prize winners per capita (the highest ratio in the world: Nobel laureates Derek Walcott and Arthur Lewis) — co…." },
  LI: { nonverbal: 45, tone: 25, words: 30, note: "The deep heritage of being one of Europe's two doubly-landlocked countries (with Uzbekistan) and the world's sixth-smallest state — combined with the remarkab…." },
  LR: { nonverbal: 30, tone: 40, words: 30, note: "The unique heritage of being Africa's oldest republic (founded 1847 by freed American slaves) — combined with the remarkable Americo-Liberian founding identity…." },
  LS: { nonverbal: 35, tone: 35, words: 30, note: "The unique heritage of being one of only three countries entirely surrounded by another country (South Africa) — the Mountain Kingdom of Lesotho — combined with…." },
  LY: { nonverbal: 40, tone: 35, words: 25, note: "The deep Berber-Arab-Tuareg heritage — Libya's Cyrenaica region was one of ancient Greece's most-significant colonies, and the country holds remarkable Roman…." },
  MR: { nonverbal: 40, tone: 35, words: 25, note: "The deep Moorish-Berber-Wolof heritage of the Saharan-Sahelian frontier — Mauritania's ancient trading cities (Chinguetti, Oualata) were among medieval Islam'…." },
  NE: { nonverbal: 35, tone: 35, words: 30, note: "The deep Hausa-Zarma-Tuareg-Fulani heritage of the Saharan-Sahelian frontier — Niger's ancient Agadez sultanate was one of the great trans-Saharan trade hubs…." },
  SB: { nonverbal: 40, tone: 35, words: 25, note: "The deep Melanesian heritage of the Solomon Islands — 70+ distinct languages, remarkable traditional arts, the heritage of WWII's most-significant Pacific cam…." },
  SD: { nonverbal: 40, tone: 35, words: 25, note: "The deep Nubian-Arab-Beja heritage — Sudan's ancient Nubian civilization (the Kingdom of Kush) produced remarkable pyramids, the only known writing system nati…." },
  SL: { nonverbal: 30, tone: 40, words: 30, note: "The unique heritage of Freetown — founded 1792 as a settlement for freed slaves and one of West Africa's oldest English-speaking cities — combined with the ri…." },
  SM: { nonverbal: 40, tone: 30, words: 30, note: "The extraordinary heritage of being the world's oldest surviving sovereign state and constitutional republic (founded 301 AD, on the slopes of Monte Titano) —…." },
  SO: { nonverbal: 40, tone: 35, words: 25, note: "The deep Cushitic-Somali heritage — one of the world's most culturally homogeneous nations (Somali people, Somali language, Sunni Islam, nomadic pastoralist t…." },
  SS: { nonverbal: 35, tone: 40, words: 25, note: "The deep Nilotic-Equatorial heritage of South Sudan — the Dinka, Nuer, Zande, and 60+ other groups whose remarkable traditions include the cattle culture of t…." },
  ST: { nonverbal: 30, tone: 45, words: 25, note: "The unique Creole heritage of São Tomé and Príncipe — a luso-African island culture built by the descendants of enslaved Africans brought to the uninhabited…." },
  SY: { nonverbal: 42, tone: 30, words: 28, note: "The deep Levantine-Arab heritage — Syria's ancient civilizations (Ebla, Ugarit, Palmyra) were among the ancient world's most-significant, and Damascus is one…." },
  SZ: { nonverbal: 40, tone: 35, words: 25, note: "The deep Swazi heritage — one of Africa's last absolute monarchies, the Kingdom of Eswatini preserves the remarkable Incwala (first-fruits ceremony) and Umhla…." },
  TD: { nonverbal: 40, tone: 35, words: 25, note: "The deep Sara-Arab-Toubou heritage of the Saharan-Sahelian frontier — Chad's ancient Lake Chad basin was one of the great Sahelian civilizations (Kanem-Bornu…." },
  TG: { nonverbal: 30, tone: 40, words: 30, note: "The deep Ewe-Kabye-Mina heritage — combined with the heritage of Lomé, one of West Africa's most-liveable capitals, and the remarkable traditional religious p…." },
  TJ: { nonverbal: 45, tone: 30, words: 25, note: "The deep Sogdian-Persian-Tajik heritage — Tajikistan's Samarkand-Bukhara cultural world (the great Silk Road cities are just across the border in Uzbekistan)…." },
  TL: { nonverbal: 45, tone: 30, words: 25, note: "The deep Austronesian-Portuguese-Catholic heritage — Timor-Leste is one of Asia's youngest nations (independent 2002) and one of only two Asian countries with…." },
  VA: { nonverbal: 45, tone: 30, words: 25, note: "The extraordinary heritage of being the world's smallest sovereign state (0.44 km²) and the spiritual centre of 1.3 billion Catholics — combined with the Ren…." },
  VC: { nonverbal: 30, tone: 45, words: 25, note: "The unique Vincentian heritage — the last Caribbean nation where the Black Carib (Garifuna) people mounted significant resistance to British colonialism — com…." },
  VU: { nonverbal: 40, tone: 35, words: 25, note: "The deep Melanesian kastom heritage — Vanuatu has 113 languages for 320,000 people (among the world's highest language-density ratios) and the remarkable nagg…." },
};

const VALID_SPHERES_CULTURE = ["business", "gastronomy", "arts_culture", "music_entertainment", "formal_events", "lifestyle_wellness", "travel_hospitality"] as const;
const SPHERE_CONTEXTS_CULTURE: Record<string, string[]> = {
  business: ["business", "professional"],
  gastronomy: ["dining", "gastronomy"],
  arts_culture: ["arts", "culture", "formal"],
  music_entertainment: ["entertainment", "social"],
  formal_events: ["formal", "ceremonial"],
  lifestyle_wellness: ["lifestyle", "social"],
  travel_hospitality: ["travel", "hospitality", "social"],
};

const ProtocolsQuerySchema = z.object({
  region_code: z.string().min(1),
  pillar: z.coerce.number().int().min(1).max(5).optional(),
  pillar_code: z.enum(["Z1", "Z2", "Z3", "Z4", "Z5"]).optional(),
  context: z.string().optional(),
  locale: z.string().optional(),
  situational_interests: z.string().optional(),
  verified_only: z.coerce.boolean().optional(),
});

// Maps the integer pillar (1-5) used by legacy records to the CC Screening
// Worker's 5-pillar code (Z1-Z5). Both schemes correspond to the same five
// universal etiquette pillars (Culture, Interaction, Table, Status, Appearance).
const PILLAR_TO_PILLAR_CODE: Record<number, string> = {
  1: "Z1",
  2: "Z2",
  3: "Z3",
  4: "Z4",
  5: "Z5",
};

const RegionCodeParamSchema = z.object({
  regionCode: z.string().min(1).max(10),
});

const CompassQuerySchema = z.object({
  locale: z.string().default(DEFAULT_LOCALE),
  situational_interests: z.string().optional(),
});

router.get("/culture/protocols", requireAuthUser, async (req, res) => {
  try {
    const userTierRow = await resolveUserTier(req);
    const tier = (userTierRow?.subscription_tier ?? "guest") as SubscriptionTier;
    if (!TIER_FEATURES[tier].fullCulturalCompass) {
      return res.status(403).json({ code: "TIER_REQUIRED", error: "A paid subscription is required to access cultural protocols." });
    }

    const parsed = ProtocolsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "A region must be specified to retrieve cultural protocols." });
    }

    const region_code_raw = parsed.data.region_code.toUpperCase();
    if (!canAccessRegion(tier, userTierRow?.active_region ?? "", region_code_raw)) {
      return res.status(403).json({ error: "Your current membership does not include access to this region." });
    }

    const { region_code, pillar, pillar_code, context, locale, situational_interests, verified_only } = parsed.data;
    const conditions = [eq(cultureProtocolsTable.region_code, region_code)];

    // CC Screening records are recognised by source_book IS NOT NULL AND verified = true.
    const verifiedCCExpr = and(
      isNotNull(cultureProtocolsTable.source_book),
      eq(cultureProtocolsTable.verified, true),
    );

    if (verified_only) {
      conditions.push(verifiedCCExpr!);
    }

    if (pillar_code !== undefined) {
      // pillar_code filter targets verified CC records exclusively.
      conditions.push(eq(cultureProtocolsTable.pillar_code, pillar_code));
      conditions.push(verifiedCCExpr!);
    } else if (pillar !== undefined) {
      // Match legacy records by integer pillar OR verified CC records whose
      // pillar_code corresponds to the same pillar (Z1↔1 ... Z5↔5).
      const mappedCode = PILLAR_TO_PILLAR_CODE[pillar];
      conditions.push(
        or(
          eq(cultureProtocolsTable.pillar, pillar),
          and(
            eq(cultureProtocolsTable.pillar_code, mappedCode),
            verifiedCCExpr!,
          )!,
        )!,
      );
    }

    if (context !== undefined) {
      // CC records frequently leave context at its default "general"; keep them
      // in the result set so the Counsel still surfaces verified guidance.
      conditions.push(
        or(
          eq(cultureProtocolsTable.context, context),
          verifiedCCExpr!,
        )!,
      );
    }

    const spheres = (situational_interests ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => (VALID_SPHERES_CULTURE as readonly string[]).includes(s));

    const matchingContexts = new Set<string>();
    for (const sphere of spheres) {
      for (const ctx of SPHERE_CONTEXTS_CULTURE[sphere] ?? []) matchingContexts.add(ctx);
    }

    // CC-derived records (source_book IS NOT NULL) are only visible once verified=true.
    // Legacy curated records (source_book IS NULL) are always visible.
    const verificationGate = or(
      isNull(cultureProtocolsTable.source_book),
      eq(cultureProtocolsTable.verified, true),
    );

    const protocols = await db.select()
      .from(cultureProtocolsTable)
      .where(and(...conditions, verificationGate))
      .orderBy(sql`COALESCE(${cultureProtocolsTable.urgency}, 0) DESC`, cultureProtocolsTable.id);

    // Resolve locale-aware display text
    // lang is the base language code (e.g. "nl" from "nl-NL", "fr" from "fr-FR")
    const lang = locale ? locale.split("-")[0].toLowerCase() : "en";

    const enriched = protocols.map((p) => {
      const i18n = p.rule_cc_i18n as Record<string, string> | null;
      const display_rule =
        (lang !== "en" && i18n?.[lang])
          ? i18n[lang]
          : (p.rule_cc ?? p.rule_description);

      return { ...p, display_rule };
    });

    if (matchingContexts.size > 0) {
      enriched.sort((a, b) => {
        const aMatch = matchingContexts.has(a.context ?? "") ? 0 : 1;
        const bMatch = matchingContexts.has(b.context ?? "") ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch culture protocols");
    return res.status(500).json({ error: "Cultural protocols are momentarily unavailable. Please allow a moment." });
  }
});

router.get("/culture/compass", async (req, res) => {
  try {
    const queryParsed = CompassQuerySchema.safeParse(req.query);
    const locale = queryParsed.success ? queryParsed.data.locale : DEFAULT_LOCALE;
    const rawSpheres = queryParsed.success ? (queryParsed.data.situational_interests ?? "") : "";

    const matchedSpheres = rawSpheres
      .split(",")
      .map((s) => s.trim())
      .filter((s) => (VALID_SPHERES_CULTURE as readonly string[]).includes(s));

    const rows = await db.select()
      .from(compassRegionsTable)
      .where(eq(compassRegionsTable.is_published, true));

    const entries = rows.map((row) => {
      const content = (row.content as unknown as Record<string, Record<string, unknown>>);
      const has_content = Object.keys(content).length > 0;
      const localeContent = resolveLocaleContent(content, locale);

      // Determine which sphere keys actually have matching content in this specific region.
      // A sphere matches only when at least one of its mapped content fields is non-empty.
      const sphere_highlights: string[] = [];
      for (const sphere of matchedSpheres) {
        const fields = SPHERE_TO_COMPASS_FIELDS[sphere] ?? [];
        const hasContent = fields.some((field) => {
          const value = localeContent[field];
          if (Array.isArray(value)) return value.length > 0;
          return typeof value === "string" && value.length > 0;
        });
        if (hasContent) sphere_highlights.push(sphere);
      }

      return {
        region_code: row.region_code,
        flag_emoji: row.flag_emoji,
        region_name: localeContent.region_name ?? row.region_code,
        core_value: localeContent.core_value ?? "",
        biggest_taboo: localeContent.biggest_taboo ?? "",
        has_content,
        sphere_highlights,
      };
    });

    // Published countries with content first, then coming-soon
    entries.sort((a, b) => (b.has_content ? 1 : 0) - (a.has_content ? 1 : 0));

    return res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass");
    return res.status(500).json({ error: "The Cultural Compass is momentarily unavailable." });
  }
});

const SPHERE_TO_COMPASS_FIELDS: Record<string, string[]> = {
  gastronomy: ["dining_etiquette"],
  business: ["language_notes"],
  formal_events: ["dress_code"],
  lifestyle_wellness: ["dos", "donts"],
  arts_culture: ["dos", "donts"],
  travel_hospitality: ["dos", "donts"],
  music_entertainment: ["dos", "donts"],
};

router.get("/culture/compass/:regionCode", requireAuthUser, async (req, res) => {
  try {
    const userTierRow = await resolveUserTier(req);
    const tier = (userTierRow?.subscription_tier ?? "guest") as SubscriptionTier;
    if (!TIER_FEATURES[tier].fullCulturalCompass) {
      return res.status(403).json({ code: "TIER_REQUIRED", error: "A paid subscription is required to access the Cultural Compass." });
    }

    const paramParsed = RegionCodeParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ error: "The region code provided is not valid." });
    }

    const queryParsed = CompassQuerySchema.safeParse(req.query);
    const locale = queryParsed.success ? queryParsed.data.locale : DEFAULT_LOCALE;
    const rawSpheres = queryParsed.success ? (queryParsed.data.situational_interests ?? "") : "";
    const spheres = rawSpheres.split(",").map((s) => s.trim()).filter(Boolean);

    const regionCode = paramParsed.data.regionCode.toUpperCase();

    if (!canAccessRegion(tier, userTierRow?.active_region ?? "", regionCode)) {
      return res.status(403).json({ error: "Your current membership does not include access to this region." });
    }

    const rows = await db.select()
      .from(compassRegionsTable)
      .where(and(
        eq(compassRegionsTable.region_code, regionCode),
        eq(compassRegionsTable.is_published, true),
      ));

    if (rows.length === 0) {
      return res.status(404).json({
        error: `The region '${regionCode}' is not yet within our compass. Further regions are being added in due course.`,
      });
    }

    const row = rows[0];
    const content = (row.content as unknown as Record<string, Record<string, unknown>>);
    const localeContent = resolveLocaleContent(content, locale);

    const mehrabian = MEHRABIAN_WEIGHTS[regionCode] ?? null;

    const highlightedFields = new Set<string>();
    for (const sphere of spheres) {
      for (const field of SPHERE_TO_COMPASS_FIELDS[sphere] ?? []) highlightedFields.add(field);
    }

    return res.json({
      region_code: row.region_code,
      flag_emoji: row.flag_emoji,
      region_name: localeContent.region_name ?? row.region_code,
      core_value: localeContent.core_value ?? "",
      biggest_taboo: localeContent.biggest_taboo ?? "",
      dining_etiquette: localeContent.dining_etiquette ?? "",
      language_notes: localeContent.language_notes ?? "",
      gift_protocol: localeContent.gift_protocol ?? "",
      dress_code: localeContent.dress_code ?? "",
      dos: localeContent.dos ?? [],
      donts: localeContent.donts ?? [],
      mehrabian_weight: mehrabian,
      sphere_highlights: Array.from(highlightedFields),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch compass region");
    return res.status(500).json({ error: "The Cultural Compass is momentarily unavailable." });
  }
});

const CulturalOriginsQuerySchema = z.object({
  region_code: z.string().min(1).max(10),
  domain: z.string().optional(),
});

router.get("/culture/origins", requireAuthUser, async (req, res) => {
  try {
    const userTierRow = await resolveUserTier(req);
    const tier = (userTierRow?.subscription_tier ?? "guest") as SubscriptionTier;
    if (!TIER_FEATURES[tier].fullCulturalCompass) {
      return res.status(403).json({ code: "TIER_REQUIRED", error: "A paid subscription is required to access cultural origins." });
    }

    const parsed = CulturalOriginsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "A valid region code must be specified." });
    }

    const { region_code, domain } = parsed.data;
    const regionCode = region_code.toUpperCase();

    const conditions = [eq(culturalOriginsTable.region_code, regionCode)];
    if (domain) {
      conditions.push(eq(culturalOriginsTable.domain, domain));
    }

    const rows = await db.select()
      .from(culturalOriginsTable)
      .where(and(...conditions))
      .orderBy(culturalOriginsTable.domain, culturalOriginsTable.id);

    return res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch cultural origins");
    return res.status(500).json({ error: "Cultural origins are momentarily unavailable." });
  }
});

export default router;
