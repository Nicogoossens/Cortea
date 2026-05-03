import type { cultureProtocolsTable } from "./schema/index.js";

type CCProtocol = typeof cultureProtocolsTable.$inferInsert;

const ALL_PERSONAS = ["P1", "P2", "P3"];
const COMPASS_MODULES = ["CMP"];
const COMPASS_AID_MODULES = ["AID", "CMP"];

function pillarNumber(code: "Z1" | "Z2" | "Z3" | "Z4" | "Z5"): number {
  return Number(code.slice(1));
}

function row(p: {
  region_code: string;
  pillar_code: "Z1" | "Z2" | "Z3" | "Z4" | "Z5";
  subcategory: string;
  rule_type: string;
  rule_raw: string;
  rule_cc: string;
  source_book: string;
  source_page: string;
  urgency: 1 | 2 | 3;
  context?: string;
  i18n?: Record<string, string>;
}): CCProtocol {
  return {
    region_code: p.region_code,
    pillar: pillarNumber(p.pillar_code),
    rule_type: p.rule_type,
    rule_description: p.rule_cc,
    context: p.context ?? "general",
    pillar_code: p.pillar_code,
    subcategory: p.subcategory,
    rule_raw: p.rule_raw,
    rule_cc: p.rule_cc,
    rule_cc_i18n: p.i18n,
    source_book: p.source_book,
    source_page: p.source_page,
    urgency: p.urgency,
    verified: true,
    personas: ALL_PERSONAS,
    modules: p.urgency === 3 ? COMPASS_AID_MODULES : COMPASS_MODULES,
    reviewed_by: "seed:editorial",
    reviewed_at: new Date(),
  };
}

export const ccVerifiedProtocols: CCProtocol[] = [
  // ── UNITED KINGDOM ─────────────────────────────────────────────────────────
  row({
    region_code: "GB", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Mind the Queue Above All",
    rule_raw: "Queue-jumping in Britain is treated as a serious social transgression.",
    rule_cc: "An attentive guest in Britain takes their place at the end of any line — to step ahead of others, however unwittingly, is read as a small act of contempt.",
    source_book: "DH", source_page: "84", urgency: 3,
    i18n: {
      nl: "Een attente gast in Groot-Brittannië sluit aan achteraan in de rij — voor anderen schuiven, hoe onbedoeld ook, wordt opgevat als een kleine daad van minachting.",
      fr: "Un invité attentif au Royaume-Uni prend toujours sa place en bout de file — passer devant autrui, même par mégarde, est perçu comme un léger affront.",
      es: "Un invitado atento en el Reino Unido siempre se coloca al final de la fila — adelantarse, aun sin querer, se interpreta como un pequeño desaire.",
    },
  }),
  row({
    region_code: "GB", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: The Grammar of Understatement",
    rule_raw: "British speech relies on understatement; literal interpretation often misleads.",
    rule_cc: "In Britain, 'not bad' is high praise and 'quite interesting' may signal polite disagreement — listen for the gap between word and meaning before responding.",
    source_book: "DH", source_page: "112", urgency: 2,
    i18n: {
      nl: "In Groot-Brittannië is 'not bad' een groot compliment en kan 'quite interesting' juist beleefde afkeuring zijn — luister naar de ruimte tussen woord en bedoeling.",
      fr: "Au Royaume-Uni, « not bad » est un éloge et « quite interesting » peut traduire un désaccord poli — écoutez l'écart entre le mot et le sens.",
    },
  }),
  row({
    region_code: "GB", pillar_code: "Z3", subcategory: "cutlery_use",
    rule_type: "CC: Continental Hold at Table",
    rule_raw: "British dining keeps fork in left hand, knife in right throughout the meal.",
    rule_cc: "At a British table, fork rests in the left hand and knife in the right throughout the course — switching hands American-style draws quiet notice.",
    source_book: "MG", source_page: "47", urgency: 2,
    i18n: {
      nl: "Aan een Britse tafel blijft de vork in de linkerhand en het mes in de rechter — wisselen op Amerikaanse wijze valt stil maar zeker op.",
      fr: "À une table britannique, la fourchette demeure à gauche et le couteau à droite — changer de main à l'américaine se remarque discrètement.",
    },
  }),
  row({
    region_code: "GB", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Address by Title Until Invited",
    rule_raw: "Use title and surname for new acquaintances until first names are explicitly offered.",
    rule_cc: "A discreet guest in Britain addresses new acquaintances by title and surname, awaiting an explicit invitation before moving to first names.",
    source_book: "DN", source_page: "28", urgency: 2,
    i18n: {
      nl: "Een discrete gast in Groot-Brittannië spreekt nieuwe kennissen aan met titel en achternaam, en wacht op een uitnodiging voordat hij overgaat op voornamen.",
      fr: "Un invité discret au Royaume-Uni s'adresse aux nouvelles connaissances par titre et nom de famille, attendant une invitation explicite avant de passer aux prénoms.",
    },
  }),
  row({
    region_code: "GB", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Err Toward Formality",
    rule_raw: "When the dress expectation is unclear, dressing up rather than down is far safer.",
    rule_cc: "When the occasion is unclear in Britain, a refined guest dresses slightly above the expectation — being overdressed is forgiven; the reverse is not.",
    source_book: "DH", source_page: "201", urgency: 2,
    i18n: {
      nl: "Bij twijfel kiest een verfijnde gast in Groot-Brittannië voor iets meer formele kleding — overdressed zijn wordt vergeven; te informeel zijn niet.",
      fr: "Dans le doute, un invité raffiné au Royaume-Uni s'habille un cran plus chic que prévu — être trop élégant pardonne, l'inverse rarement.",
    },
  }),
  row({
    region_code: "GB", pillar_code: "Z2", subcategory: "topics_to_avoid",
    rule_type: "CC: Personal Questions Off Limits",
    rule_raw: "Direct questions about salary, family planning, or relationship status are intrusive.",
    rule_cc: "In Britain, questions about salary, family planning, or relationship status are received as intrusive — let such matters surface only if the other person volunteers them.",
    source_book: "ME", source_page: "63", urgency: 3,
    i18n: {
      nl: "In Groot-Brittannië worden vragen over salaris, kinderwens of relatiestatus als opdringerig ervaren — laat zulke onderwerpen alleen spontaan ter sprake komen.",
      fr: "Au Royaume-Uni, les questions sur le salaire, les projets familiaux ou la situation sentimentale sont jugées indiscrètes — laissez l'autre les aborder de lui-même.",
    },
  }),

  // ── JAPAN ──────────────────────────────────────────────────────────────────
  row({
    region_code: "JP", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Chopsticks Never Upright in Rice",
    rule_raw: "Standing chopsticks vertically in rice mirrors funeral incense and is taboo.",
    rule_cc: "An attentive guest in Japan never plants chopsticks upright in a bowl of rice — the gesture mirrors a funeral rite and is jarring at any meal.",
    source_book: "CM", source_page: "152", urgency: 3,
    i18n: {
      nl: "Een attente gast in Japan plaatst eetstokjes nooit rechtop in een rijstkom — het gebaar verwijst naar een rouwritueel en is bij elke maaltijd schokkend.",
      fr: "Un invité attentif au Japon ne plante jamais les baguettes verticalement dans le riz — ce geste évoque un rite funéraire et choque à toute table.",
      es: "Un invitado atento en Japón nunca clava los palillos verticalmente en el arroz — el gesto evoca un rito funerario y resulta chocante en cualquier mesa.",
    },
  }),
  row({
    region_code: "JP", pillar_code: "Z2", subcategory: "nonverbal_style",
    rule_type: "CC: The Weight of Silence",
    rule_raw: "Silence after a question signals careful consideration, not awkwardness.",
    rule_cc: "In a Japanese conversation, a pause after a question marks the gravity of your reflection — resist the urge to fill the silence prematurely.",
    source_book: "CM", source_page: "201", urgency: 2,
    i18n: {
      nl: "In een Japans gesprek onderstreept een stilte na een vraag het gewicht van uw overweging — weersta de drang die stilte te snel te vullen.",
      fr: "Dans une conversation japonaise, un silence après une question souligne le sérieux de votre réflexion — résistez à l'envie de le combler trop vite.",
    },
  }),
  row({
    region_code: "JP", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Pour for Others, Never Yourself",
    rule_raw: "At a Japanese table one fills the glasses of companions, not one's own.",
    rule_cc: "At a Japanese table, a refined guest pours for companions and allows others to pour for them — to fill one's own cup signals a quiet absence of grace.",
    source_book: "CM", source_page: "187", urgency: 2,
    i18n: {
      nl: "Aan een Japanse tafel schenkt een verfijnde gast voor de tafelgenoten in en laat anderen voor zichzelf inschenken — zelf bijschenken getuigt van weinig elegantie.",
      fr: "À une table japonaise, un invité raffiné sert ses voisins et laisse les autres le servir — se servir soi-même trahit un manque de tact.",
    },
  }),
  row({
    region_code: "JP", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Meishi — The Two-Handed Card",
    rule_raw: "Business cards are presented and received with both hands and studied briefly.",
    rule_cc: "In Japanese business, present and receive a business card with both hands, study it for a respectful moment, and place it carefully on the table — never tuck it away unread.",
    source_book: "CM", source_page: "143", urgency: 3,
    i18n: {
      nl: "In Japans zakendoen overhandigt en ontvangt men een visitekaartje met beide handen, bestudeert het kort respectvol en legt het zorgvuldig op tafel — nooit ongelezen wegstoppen.",
      fr: "Dans les affaires japonaises, on présente et reçoit la carte de visite à deux mains, on l'examine un instant avec respect et on la pose soigneusement sur la table — jamais la ranger sans la lire.",
      es: "En los negocios japoneses, la tarjeta se entrega y recibe con ambas manos, se estudia un instante con respeto y se coloca con cuidado sobre la mesa — nunca guardarla sin leerla.",
    },
  }),
  row({
    region_code: "JP", pillar_code: "Z5", subcategory: "touch_etiquette",
    rule_type: "CC: The Bow Replaces the Handshake",
    rule_raw: "A measured bow is the appropriate greeting; uninvited handshakes can feel forward.",
    rule_cc: "A measured bow is the appropriate greeting in Japan — extending a hand before one is offered can feel forward; mirror the depth of the bow you receive.",
    source_book: "CM", source_page: "98", urgency: 2,
    i18n: {
      nl: "Een ingehouden buiging is in Japan de gepaste begroeting — een hand uitsteken voordat die wordt aangeboden kan opdringerig overkomen; spiegel de diepte van de buiging die u ontvangt.",
      fr: "Une inclinaison mesurée est le salut approprié au Japon — tendre la main avant qu'on ne vous l'offre peut sembler intrusif ; reflétez la profondeur du salut reçu.",
    },
  }),

  // ── FRANCE ─────────────────────────────────────────────────────────────────
  row({
    region_code: "FR", pillar_code: "Z1", subcategory: "gift_giving",
    rule_type: "CC: Flowers for the French Host",
    rule_raw: "When invited to a French home, bring flowers — but never chrysanthemums.",
    rule_cc: "An attentive guest in France arrives with flowers for the host — but avoids chrysanthemums, which belong to the cemetery, and yellow blooms, which whisper of infidelity.",
    source_book: "AV", source_page: "316", urgency: 2,
    i18n: {
      nl: "Een attente gast in Frankrijk komt met bloemen voor de gastvrouw — maar vermijdt chrysanten, die bij de begraafplaats horen, en gele bloemen, die ontrouw suggereren.",
      fr: "Un invité attentif en France apporte des fleurs à son hôte — mais évite les chrysanthèmes, réservés au cimetière, et les fleurs jaunes, qui évoquent l'infidélité.",
    },
  }),
  row({
    region_code: "FR", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Always Greet Before You Ask",
    rule_raw: "Entering any French shop or office without 'Bonjour' is read as rude.",
    rule_cc: "In France, every encounter — shop, café, lift, office — opens with 'Bonjour Madame' or 'Bonjour Monsieur'. Skipping the greeting is read as discourtesy, not haste.",
    source_book: "ME", source_page: "78", urgency: 3,
    i18n: {
      nl: "In Frankrijk begint elke ontmoeting — winkel, café, lift, kantoor — met 'Bonjour Madame' of 'Bonjour Monsieur'. De begroeting overslaan wordt als onbeleefdheid gelezen, niet als haast.",
      fr: "En France, toute rencontre — boutique, café, ascenseur, bureau — commence par « Bonjour Madame » ou « Bonjour Monsieur ». L'omettre passe pour de l'impolitesse, non pour de la hâte.",
      es: "En Francia, todo encuentro — tienda, café, ascensor, oficina — empieza con «Bonjour Madame» o «Bonjour Monsieur». Omitirlo se interpreta como descortesía, no como prisa.",
    },
  }),
  row({
    region_code: "FR", pillar_code: "Z3", subcategory: "table_posture",
    rule_type: "CC: Hands Visible at the Table",
    rule_raw: "At a French table, both hands rest visibly on the table, not in the lap.",
    rule_cc: "At a French table, both hands rest visibly on the table — wrists at the edge — between courses; tucking them in the lap is considered curiously secretive.",
    source_book: "AV", source_page: "402", urgency: 2,
    i18n: {
      nl: "Aan een Franse tafel rusten beide handen zichtbaar op tafel — polsen aan de rand — tussen de gangen door; ze in de schoot leggen wordt als merkwaardig stiekem beschouwd.",
      fr: "À une table française, les deux mains reposent visibles sur la table — poignets au bord — entre les plats ; les garder sur les genoux paraît curieusement furtif.",
    },
  }),
  row({
    region_code: "FR", pillar_code: "Z4", subcategory: "forms_of_address",
    rule_type: "CC: Vous Until Invited",
    rule_raw: "Address all new acquaintances with 'vous'; wait for the move to 'tu'.",
    rule_cc: "In France, address every new acquaintance with 'vous' — moving to 'tu' is the host's invitation to extend, never the guest's to assume.",
    source_book: "ME", source_page: "94", urgency: 2,
    i18n: {
      nl: "In Frankrijk spreekt men elke nieuwe kennis aan met 'vous' — overgaan op 'tu' is een uitnodiging van de gastheer, nooit een aanname van de gast.",
      fr: "En France, on s'adresse à toute nouvelle connaissance avec « vous » — passer au « tu » revient à l'hôte, jamais à l'invité.",
    },
  }),
  row({
    region_code: "FR", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Quiet Elegance Over Display",
    rule_raw: "French elegance favours cut, fit, and restraint over visible logos.",
    rule_cc: "French elegance lives in cut, fabric and quiet restraint — visible logos and over-bright colours read as ostentation rather than taste.",
    source_book: "ME", source_page: "188", urgency: 2,
    i18n: {
      nl: "Franse elegantie zit in snit, stof en stille terughoudendheid — opzichtige logo's en felle kleuren komen eerder over als pronkzucht dan als smaak.",
      fr: "L'élégance française réside dans la coupe, l'étoffe et la retenue — les logos visibles et les couleurs criardes passent pour de l'ostentation plus que pour du goût.",
    },
  }),

  // ── UAE ────────────────────────────────────────────────────────────────────
  row({
    region_code: "AE", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Ramadan in Public",
    rule_raw: "Eating, drinking, or smoking in public during daylight in Ramadan is unlawful for all.",
    rule_cc: "During Ramadan in the Emirates, refrain from eating, drinking, or smoking in public spaces during daylight hours — the courtesy applies to visitors of every faith.",
    source_book: "CM", source_page: "264", urgency: 3,
    i18n: {
      nl: "Tijdens de Ramadan in de Emiraten onthoudt men zich overdag in het openbaar van eten, drinken en roken — deze hoffelijkheid geldt voor bezoekers van elk geloof.",
      fr: "Pendant le Ramadan aux Émirats, on s'abstient de manger, boire ou fumer dans l'espace public en journée — cette courtoisie s'applique aux visiteurs de toute confession.",
      es: "Durante el Ramadán en los Emiratos, abstente de comer, beber o fumar en espacios públicos durante el día — esta cortesía se aplica a visitantes de cualquier credo.",
    },
  }),
  row({
    region_code: "AE", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Right Hand for Greeting and Giving",
    rule_raw: "The right hand alone is used for greetings, eating, and the exchange of gifts.",
    rule_cc: "In the Emirates, the right hand alone is used to greet, to eat, and to offer or receive — the left hand is reserved and would cause quiet offence.",
    source_book: "CM", source_page: "271", urgency: 3,
    i18n: {
      nl: "In de Emiraten gebruikt men uitsluitend de rechterhand om te begroeten, te eten en geschenken aan te bieden of te ontvangen — de linkerhand is gereserveerd en zou stille aanstoot geven.",
      fr: "Aux Émirats, on n'utilise que la main droite pour saluer, manger ou offrir et recevoir — la main gauche est réservée et causerait une offense discrète.",
      es: "En los Emiratos, se usa solo la mano derecha para saludar, comer y ofrecer o recibir — la izquierda queda reservada y causaría una ofensa silenciosa.",
    },
  }),
  row({
    region_code: "AE", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Coffee Cup Signals",
    rule_raw: "Refusing more Arabic coffee is signalled by a small wrist-tilt of the cup.",
    rule_cc: "When offered Arabic coffee in the Emirates, accept the first cup as a sign of friendship; to indicate you wish no more, tilt the cup gently from side to side as you return it.",
    source_book: "CM", source_page: "278", urgency: 2,
    i18n: {
      nl: "Wanneer u in de Emiraten Arabische koffie krijgt aangeboden, aanvaard de eerste kop als teken van vriendschap; om aan te geven dat u geen meer wenst, kantelt u het kopje zacht heen en weer bij het teruggeven.",
      fr: "Aux Émirats, acceptez la première tasse de café arabe comme un signe d'amitié ; pour signifier que vous n'en désirez plus, inclinez délicatement la tasse de droite à gauche en la rendant.",
    },
  }),
  row({
    region_code: "AE", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Greet the Eldest First",
    rule_raw: "In any gathering the eldest or most senior person is greeted first.",
    rule_cc: "In any Emirati gathering, greet the eldest or most senior person first — moving from elder to younger is a small but observed mark of respect.",
    source_book: "CM", source_page: "266", urgency: 2,
    i18n: {
      nl: "In elke Emiraatse bijeenkomst begroet u eerst de oudste of hoogste in rang — van oud naar jong is een klein maar opgemerkt teken van respect.",
      fr: "Dans toute assemblée émiratie, saluez d'abord la personne la plus âgée ou la plus haut placée — passer de l'aîné au cadet est une marque de respect discrète mais notée.",
    },
  }),
  row({
    region_code: "AE", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Modesty in Public Spaces",
    rule_raw: "Shoulders and knees should be covered in malls, mosques, and public buildings.",
    rule_cc: "In Emirati public spaces — malls, mosques, government buildings — a refined guest keeps shoulders and knees covered; resort-wear belongs only at the beach or pool.",
    source_book: "CM", source_page: "275", urgency: 3,
    i18n: {
      nl: "In Emiraatse openbare ruimtes — winkelcentra, moskeeën, overheidsgebouwen — houdt een verfijnde gast schouders en knieën bedekt; strandkleding hoort alleen bij het strand of zwembad.",
      fr: "Dans les espaces publics émiratis — centres commerciaux, mosquées, bâtiments officiels — un invité raffiné garde épaules et genoux couverts ; la tenue de plage ne convient qu'à la plage ou la piscine.",
      es: "En los espacios públicos emiratíes — centros comerciales, mezquitas, edificios oficiales — un invitado refinado mantiene hombros y rodillas cubiertos; la ropa de playa pertenece solo a la playa o piscina.",
    },
  }),

  // ── UNITED STATES ──────────────────────────────────────────────────────────
  row({
    region_code: "US", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Money, Politics, and Religion",
    rule_raw: "Salary, voting, and religious affiliation are off-limits in early acquaintance.",
    rule_cc: "In American social settings, questions about salary, voting, or religious affiliation are kept aside in early acquaintance — let such matters surface naturally, if at all.",
    source_book: "AV", source_page: "121", urgency: 2,
    i18n: {
      nl: "In Amerikaanse sociale settings worden vragen over salaris, stemgedrag of geloofsovertuiging bij een eerste kennismaking achterwege gelaten — laat zulke onderwerpen eventueel spontaan opkomen.",
      fr: "Dans la sphère sociale américaine, les questions sur le salaire, le vote ou la confession religieuse sont écartées au début ; laissez ces sujets émerger naturellement, s'ils émergent.",
      es: "En el ámbito social estadounidense, las preguntas sobre salario, voto o religión se reservan al inicio de una relación — deja que tales temas surjan de forma natural, si es que surgen.",
    },
  }),
  row({
    region_code: "US", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Direct, but Warm",
    rule_raw: "American communication favours directness wrapped in warmth and positive framing.",
    rule_cc: "In American conversation, directness is welcomed but should be carried in a warm tone — opinions are shared openly, yet softened with positive framing and a smile.",
    source_book: "CM", source_page: "55", urgency: 2,
    i18n: {
      nl: "In Amerikaanse gesprekken is directheid welkom, maar gedragen in een warme toon — meningen worden openlijk gedeeld, maar verzacht met een positieve insteek en een glimlach.",
      fr: "Dans la conversation américaine, la franchise est appréciée mais doit être enrobée d'un ton chaleureux — les opinions s'expriment ouvertement, adoucies par une formulation positive et un sourire.",
    },
  }),
  row({
    region_code: "US", pillar_code: "Z3", subcategory: "payment_ritual",
    rule_type: "CC: Tipping is Part of the Bill",
    rule_raw: "In American restaurants, gratuity of 18-22 percent is expected, not optional.",
    rule_cc: "In American restaurants, a gratuity of eighteen to twenty-two percent is part of the meal's true cost — not a reward for exceptional service but the expected close to the evening.",
    source_book: "ME", source_page: "142", urgency: 3,
    i18n: {
      nl: "In Amerikaanse restaurants is een fooi van achttien tot tweeëntwintig procent onderdeel van de werkelijke maaltijdkosten — geen beloning voor uitzonderlijke service, maar de verwachte afsluiting van de avond.",
      fr: "Dans les restaurants américains, un pourboire de dix-huit à vingt-deux pour cent fait partie du coût réel du repas — non une récompense pour un service exceptionnel, mais la conclusion attendue de la soirée.",
      es: "En los restaurantes estadounidenses, una propina del dieciocho al veintidós por ciento forma parte del coste real de la comida — no una recompensa por un servicio excepcional, sino el cierre esperado de la velada.",
    },
  }),
  row({
    region_code: "US", pillar_code: "Z4", subcategory: "networking",
    rule_type: "CC: The Handshake Still Sets the Tone",
    rule_raw: "A firm handshake with eye contact opens American business introductions.",
    rule_cc: "In American business, a firm handshake delivered with steady eye contact opens the introduction — neither crushing nor limp; the grip is read as a signal of confidence.",
    source_book: "ME", source_page: "166", urgency: 2,
    i18n: {
      nl: "In het Amerikaanse zakenleven opent een stevige handdruk met rustig oogcontact de kennismaking — niet verpletterend, niet slap; de greep wordt gelezen als blijk van zelfvertrouwen.",
      fr: "Dans les affaires américaines, une poignée de main ferme accompagnée d'un regard assuré ouvre la rencontre — ni écrasante ni molle ; la pression se lit comme un signe d'assurance.",
    },
  }),
  row({
    region_code: "US", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Business Casual Decoded",
    rule_raw: "American business casual means collared shirt and tailored trousers; jeans only when explicitly invited.",
    rule_cc: "In American offices, 'business casual' typically means a collared shirt with tailored trousers or a knee-length skirt — denim and trainers belong only where they have been explicitly invited.",
    source_book: "ME", source_page: "215", urgency: 2,
    i18n: {
      nl: "In Amerikaanse kantoren betekent 'business casual' doorgaans een overhemd met blouse-kraag en nette pantalon of kniehoge rok — denim en sneakers horen alleen waar ze uitdrukkelijk zijn toegelaten.",
      fr: "Dans les bureaux américains, le « business casual » signifie en général chemise à col et pantalon habillé ou jupe au genou — le denim et les baskets n'ont leur place que là où ils sont explicitement admis.",
    },
  }),
];
