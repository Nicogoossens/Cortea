import type { RegionCode } from "@/lib/active-region";

export interface LocalizedBrief {
  dos: string[];
  donts: string[];
}

export interface CultureCluster {
  id: string;
  nameKey: string;
  philosophyKey: string;
  members: RegionCode[];
  dos: string[];
  donts: string[];
  hasHighSociety?: boolean;
  localized?: Partial<Record<string, LocalizedBrief>>;
}

/** Return locale-specific dos/donts, falling back to English. */
export function getClusterBrief(
  cluster: CultureCluster,
  locale: string
): { dos: string[]; donts: string[] } {
  const loc = cluster.localized?.[locale];
  return {
    dos: loc?.dos ?? cluster.dos,
    donts: loc?.donts ?? cluster.donts,
  };
}

export const CULTURE_CLUSTERS: CultureCluster[] = [
  {
    id: "anglosaxon",
    nameKey: "clusters.anglosaxon.name",
    philosophyKey: "clusters.anglosaxon.philosophy",
    members: ["GB", "US", "AU", "CA"],
    dos: [
      "Queue patiently and without complaint — order is a social contract.",
      "Maintain comfortable personal space; respect the invisible perimeter.",
      "Use first names quickly; informality signals trust, not disrespect.",
      "Express disagreement directly but without rancour.",
      "Humour is a social currency — wit and understatement are admired.",
    ],
    donts: [
      "Do not discuss salary, age, or personal wealth at social occasions.",
      "Do not touch a new acquaintance beyond a firm handshake.",
      "Do not mistake casual tone for casual commitment.",
      "Do not be conspicuously late — punctuality is a baseline courtesy.",
      "Do not over-compliment; sincerity is valued above effusion.",
    ],
    localized: {
      nl: {
        dos: [
          "Sla geduldig aan in de rij — orde is een sociaal contract.",
          "Respecteer persoonlijke ruimte; eerbiedig de onzichtbare grens.",
          "Gebruik voornamen snel; informaliteit signaleert vertrouwen, geen gebrek aan respect.",
          "Breng meningsverschillen rechtstreeks maar zonder wrok naar voren.",
          "Humor is een sociale munt — gevat understatement wordt bewonderd.",
        ],
        donts: [
          "Bespreek salaris, leeftijd of persoonlijk vermogen niet bij sociale gelegenheden.",
          "Raak een nieuwe kennis niet aan buiten een stevige handdruk.",
          "Verwisselt u een informele toon niet voor een informele verbintenis.",
          "Wees niet opvallend laat — punctualiteit is een basale hoffelijkheid.",
          "Overdrijf het complimenteren niet; oprechtheid wordt gewaardeerd boven vleiing.",
        ],
      },
    },
  },
  {
    id: "western-europe",
    nameKey: "clusters.western_europe.name",
    philosophyKey: "clusters.western_europe.philosophy",
    members: ["FR", "DE", "NL"],
    hasHighSociety: true,
    dos: [
      "Greet formally with title and surname until invited to use first names.",
      "Arrive precisely on time — punctuality is a mark of character.",
      "Engage in substantive conversation; intellectual depth is respected.",
      "Present business cards with both hands and read them carefully.",
      "Dress with refinement; appearance signals seriousness of purpose.",
    ],
    donts: [
      "Do not assume familiarity before it is offered.",
      "Do not discuss money, religion, or politics without invitation.",
      "Do not confuse directness (German) for rudeness — it is honesty.",
      "Do not skip the formal greeting rituals; they matter enormously.",
      "Do not bring expensive wine to a French host — they will choose.",
    ],
    localized: {
      nl: {
        dos: [
          "Groet formeel met titel en achternaam tot u wordt uitgenodigd voornamen te gebruiken.",
          "Kom precies op tijd — punctualiteit is een teken van karakter.",
          "Voer inhoudelijke gesprekken; intellectuele diepgang wordt gewaardeerd.",
          "Bied visitekaartjes met beide handen aan en lees ze aandachtig.",
          "Kleed u met verfijning; uiterlijk signaleert serieuze intenties.",
        ],
        donts: [
          "Veronderstel geen vertrouwelijkheid voordat die wordt aangeboden.",
          "Bespreek geld, religie of politiek niet zonder uitnodiging.",
          "Verwisselt u directheid (Duits) niet voor grofheid — het is eerlijkheid.",
          "Sla de formele begroetingsrituelen niet over; ze zijn belangrijk.",
          "Breng geen dure wijn mee voor een Franse gastheer — hij kiest zelf.",
        ],
      },
    },
  },
  {
    id: "romance-mediterranean",
    nameKey: "clusters.romance.name",
    philosophyKey: "clusters.romance.philosophy",
    members: ["IT", "ES", "PT"],
    dos: [
      "Greet warmly with cheek kisses (the norm varies by country).",
      "Express appreciation for food, art, and beauty — it opens doors.",
      "Dress with care and elegance; personal presentation speaks volumes.",
      "Allow meals to unfold slowly — the table is a social stage.",
      "Show genuine personal interest; relationships precede business.",
    ],
    donts: [
      "Do not rush a meal or decline an invitation to linger at table.",
      "Do not confuse relaxed timing with unreliability.",
      "Do not ignore the importance of family as a reference frame.",
      "Do not be brusquely transactional — warm up before getting to business.",
      "Do not dress casually for formal gatherings; bella figura matters.",
    ],
    localized: {
      nl: {
        dos: [
          "Begroet hartelijk met wangkussen (de norm verschilt per land).",
          "Toon waardering voor eten, kunst en schoonheid — het opent deuren.",
          "Kleed u met zorg en elegantie; persoonlijke presentatie spreekt boekdelen.",
          "Laat maaltijden rustig verlopen — de tafel is een sociaal podium.",
          "Toon oprechte persoonlijke interesse; relaties gaan voor zakelijkheid.",
        ],
        donts: [
          "Haast een maaltijd niet en weiger geen uitnodiging om na te tafelen.",
          "Verwisselt u een ontspannen tijdsgevoel niet voor onbetrouwbaarheid.",
          "Onderschat het belang van familie als referentiekader niet.",
          "Wees niet bruusk zakelijk — bouw eerst een warme relatie op.",
          "Kleed u niet nonchalant voor formele gelegenheden; bella figura geldt.",
        ],
      },
    },
  },
  {
    id: "east-asian",
    nameKey: "clusters.east_asian.name",
    philosophyKey: "clusters.east_asian.philosophy",
    members: ["JP", "CN", "SG"],
    dos: [
      "Present and receive business cards with both hands and a bow.",
      "Preserve the face of your host at all costs — indirect refusal is kindness.",
      "Accept offered food and drink graciously; refusal can cause offence.",
      "Defer to hierarchy in seating, serving, and introductions.",
      "Observe silence as a sign of respect and careful thought.",
    ],
    donts: [
      "Do not refuse hospitality directly — find a gracious, face-saving alternative.",
      "Do not write in red ink (associated with death in China and Korea).",
      "Do not point with one finger — use the whole hand.",
      "Do not stick chopsticks vertically in rice — a funeral omen.",
      "Do not assume one country's customs apply across the region.",
    ],
    localized: {
      nl: {
        dos: [
          "Bied visitekaartjes met beide handen aan en buig hierbij licht.",
          "Bewaar het gezicht van uw gastheer altijd — indirecte weigering is vriendelijkheid.",
          "Accepteer aangeboden eten en drinken welwillend; weigeren kan kwetsend zijn.",
          "Respecteer hiërarchie bij het plaatsnemen, serveren en introduceren.",
          "Zie stilte als een teken van respect en bedachtzaamheid.",
        ],
        donts: [
          "Weiger gastvrijheid niet rechtstreeks — zoek een vriendelijk, gezichtsbewarend alternatief.",
          "Schrijf niet in rode inkt (in China en Korea geassocieerd met de dood).",
          "Wijs niet met één vinger — gebruik de hele hand.",
          "Steek geen eetstokjes verticaal in rijst — dit is een begrafenisgebaar.",
          "Ga er niet van uit dat de gewoonten van één land voor de hele regio gelden.",
        ],
      },
    },
  },
  {
    id: "arabic-world",
    nameKey: "clusters.arabic.name",
    philosophyKey: "clusters.arabic.philosophy",
    members: ["AE"],
    dos: [
      "Accept coffee or tea immediately; refusal is a social slight.",
      "Dress modestly; cover shoulders and knees in traditional settings.",
      "Greet with right hand only — the left is considered unclean.",
      "Be patient with relationship-building before any business discussion.",
      "Show genuine respect for Islamic practice and prayer times.",
    ],
    donts: [
      "Do not schedule meetings during Friday prayers or Ramadan iftar.",
      "Do not expose the soles of your shoes when seated.",
      "Do not hand items or eat with the left hand.",
      "Do not discuss Israel or domestic politics without care.",
      "Do not bring or offer alcohol unless you know your host's stance.",
    ],
    localized: {
      nl: {
        dos: [
          "Accepteer koffie of thee direct; weigeren is een sociale belediging.",
          "Kleed u bescheiden; bedek schouders en knieën in traditionele omgevingen.",
          "Geef een hand met de rechterhand — de linker wordt als onrein beschouwd.",
          "Bouw geduldig aan een relatie voordat u zakelijk van start gaat.",
          "Toon oprecht respect voor islamitische gewoonten en gebedstijden.",
        ],
        donts: [
          "Plan geen vergaderingen tijdens het vrijdaggebed of de iftar in de ramadan.",
          "Laat de zolen van uw schoenen niet zichtbaar zijn als u zit.",
          "Geef geen voorwerpen aan en eet niet met de linkerhand.",
          "Bespreek Israël of binnenlandse politiek niet zonder zorgvuldigheid.",
          "Bied geen alcohol aan tenzij u weet wat de houding van uw gastheer is.",
        ],
      },
    },
  },
  {
    id: "south-asian",
    nameKey: "clusters.south_asian.name",
    philosophyKey: "clusters.south_asian.philosophy",
    members: ["IN"],
    dos: [
      "Greet with 'Namaste' (hands pressed together) in traditional contexts.",
      "Accept hospitality generously — refusal can feel like rejection.",
      "Acknowledge seniority and hierarchy in all formal interactions.",
      "Remove shoes before entering homes and religious spaces.",
      "Engage with warmth and personal questions — they signal interest.",
    ],
    donts: [
      "Do not offer beef to Hindu hosts or pork to Muslim hosts.",
      "Do not use the left hand for eating, giving, or receiving.",
      "Do not mistake head wobbling for confusion — it often means agreement.",
      "Do not rush; time is relational, not purely transactional.",
      "Do not confuse linguistic directness with social directness.",
    ],
    localized: {
      nl: {
        dos: [
          "Begroet met 'Namaste' (handen gevouwen) in traditionele contexten.",
          "Accepteer gastvrijheid hartelijk — weigeren kan als afwijzing worden gevoeld.",
          "Erken senioriteit en hiërarchie bij alle formele interacties.",
          "Trek uw schoenen uit bij het betreden van woningen en religieuze ruimtes.",
          "Stel persoonlijke vragen en toon oprechte interesse — het signaleert betrokkenheid.",
        ],
        donts: [
          "Bied geen rundvlees aan hindoeïstische of geen varkensvlees aan islamitische gastheren.",
          "Gebruik de linkerhand niet voor eten, geven of ontvangen.",
          "Verwisselt u het hoofdwobbelgebaar niet voor verwarring — het betekent vaak instemming.",
          "Haast u niet; tijd is relationeel, niet puur transactioneel.",
          "Verwar talige directheid niet met sociale directheid.",
        ],
      },
    },
  },
  {
    id: "latin-america",
    nameKey: "clusters.latin_america.name",
    philosophyKey: "clusters.latin_america.philosophy",
    members: ["MX", "BR"],
    dos: [
      "Greet warmly with physical closeness — handshakes, embraces, and cheek kisses.",
      "Invest in small talk and personal rapport before any agenda.",
      "Dress well — appearance signals self-respect and social standing.",
      "Be flexible with time; schedules are approximate.",
      "Express warmth and enthusiasm genuinely — it builds trust instantly.",
    ],
    donts: [
      "Do not mistake warmth for informality in business.",
      "Do not discuss Argentina with a Brazilian or vice versa carelessly.",
      "Do not rush to the point; conversation is a pleasure, not just a tool.",
      "Do not confuse schedule flexibility with lack of seriousness.",
      "Do not avoid physical contact — it is a sign of genuine connection.",
    ],
    localized: {
      nl: {
        dos: [
          "Begroet hartelijk met lichamelijk contact — handdrukken, omhelzingen en wangkussen.",
          "Investeer in smalltalk en persoonlijke band voordat u zakelijk wordt.",
          "Kleed u goed — uiterlijk signaleert zelfrespect en sociale status.",
          "Wees flexibel met tijd; schema's zijn richtlijnen.",
          "Druk warmte en enthousiasme oprecht uit — het schept direct vertrouwen.",
        ],
        donts: [
          "Verwisselt u warmte niet voor informaliteit in zakelijke contexten.",
          "Bespreek Argentinië tegenover een Braziliaan of vice versa niet onbezonnen.",
          "Haast u niet naar de kern; gesprek is een genoegen, geen louter middel.",
          "Verwisselt u planningsflexibiliteit niet voor gebrek aan ernst.",
          "Vermijd geen fysiek contact — het is een teken van echte verbinding.",
        ],
      },
    },
  },
  {
    id: "ubuntu-africa",
    nameKey: "clusters.ubuntu.name",
    philosophyKey: "clusters.ubuntu.philosophy",
    members: ["ZA"],
    dos: [
      "Greet everyone personally on entering a room — Ubuntu demands acknowledgement.",
      "Show genuine interest in people's families and communities.",
      "Accept offered food and hospitality with both hands and gratitude.",
      "Allow consensus to form naturally; decisions are collective.",
      "Dress appropriately for context — smart dress signals respect.",
    ],
    donts: [
      "Do not ignore the importance of community in any interaction.",
      "Do not rush a consensus — it undermines the collective process.",
      "Do not single out individuals for blame in group settings.",
      "Do not mistake warmth for the absence of hierarchy.",
      "Do not overlook local cultural diversity within Southern Africa.",
    ],
    localized: {
      nl: {
        dos: [
          "Begroet iedereen persoonlijk bij binnenkomst — Ubuntu eist erkenning.",
          "Toon oprechte interesse in iemands familie en gemeenschap.",
          "Accepteer aangeboden eten en gastvrijheid met beide handen en dankbaarheid.",
          "Laat consensus op een natuurlijke manier ontstaan; beslissingen zijn collectief.",
          "Kleed u gepast voor de context — representatief verschijnen signaleert respect.",
        ],
        donts: [
          "Onderschat het belang van gemeenschap in elke interactie niet.",
          "Haast een consensus niet — het ondermijnt het collectieve proces.",
          "Wijs geen individuen publiekelijk aan als schuldige in groepsverband.",
          "Verwisselt u warmte niet voor de afwezigheid van hiërarchie.",
          "Negeer de lokale culturele diversiteit binnen Zuidelijk Afrika niet.",
        ],
      },
    },
  },
];

export function getCluster(id: string): CultureCluster | undefined {
  return CULTURE_CLUSTERS.find((c) => c.id === id);
}
