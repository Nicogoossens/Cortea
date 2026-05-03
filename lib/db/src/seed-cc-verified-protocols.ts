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

  // ── LEBANON ────────────────────────────────────────────────────────────────
  row({
    region_code: "LB", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Confessional Tact",
    rule_raw: "Religious affiliation in Lebanon shapes politics and identity; outsiders should never probe.",
    rule_cc: "In Lebanon, a discreet guest never asks which confession their host belongs to — religion threads through politics and family, and the question itself is read as careless.",
    source_book: "CM", source_page: "188", urgency: 3,
    i18n: {
      nl: "In Libanon vraagt een discrete gast nooit naar de geloofsovertuiging van de gastheer — religie loopt dwars door politiek en familie, en de vraag zelf wordt als onbezonnen gelezen.",
      fr: "Au Liban, un invité discret ne demande jamais à quelle confession appartient son hôte — la religion traverse politique et famille, et la question seule passe pour de la légèreté.",
      es: "En el Líbano, un invitado discreto nunca pregunta por la confesión de su anfitrión — la religión atraviesa la política y la familia, y la pregunta misma se lee como descuido.",
    },
  }),
  row({
    region_code: "LB", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Three-Language Welcome",
    rule_raw: "Lebanese greetings often weave Arabic, French, and English in the same breath.",
    rule_cc: "A Lebanese welcome may move from 'Marhaba' to 'Bonjour' to 'Hi' in a single greeting — mirror the host's blend rather than insisting on one tongue.",
    source_book: "ME", source_page: "162", urgency: 2,
    i18n: {
      nl: "Een Libanese begroeting kan in één adem van 'Marhaba' naar 'Bonjour' naar 'Hi' gaan — spiegel de mix van de gastheer in plaats van één taal op te dringen.",
      fr: "Un accueil libanais passe parfois de « Marhaba » à « Bonjour » puis à « Hi » d'un seul souffle — adoptez le mélange de l'hôte plutôt que d'imposer une seule langue.",
    },
  }),
  row({
    region_code: "LB", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Arak Diluted, Never Neat",
    rule_raw: "Arak is served with water and ice; drinking it neat is read as crude.",
    rule_cc: "At a Lebanese table, arak is poured first, then water, then ice — never reverse the order, and never drink it neat; the cloud is part of the ritual.",
    source_book: "CM", source_page: "194", urgency: 2,
    i18n: {
      nl: "Aan een Libanese tafel wordt eerst arak ingeschonken, dan water, dan ijs — keer de volgorde nooit om en drink het nooit puur; de troebeling hoort bij het ritueel.",
      fr: "À une table libanaise, on verse d'abord l'arak, puis l'eau, puis la glace — jamais l'inverse, et jamais sec ; le voile laiteux fait partie du rite.",
    },
  }),
  row({
    region_code: "LB", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: The Family Name Precedes You",
    rule_raw: "Family lineage in Lebanon often defines social standing before any introduction.",
    rule_cc: "In Lebanese society, a family name carries its own history — when introduced, listen for the surname, and let your host signal how that lineage shapes the room.",
    source_book: "DN", source_page: "211", urgency: 2,
    i18n: {
      nl: "In de Libanese samenleving draagt een familienaam een eigen geschiedenis — luister bij een voorstelling naar de achternaam en laat uw gastheer aangeven hoe die lijn de ruimte tekent.",
      fr: "Dans la société libanaise, un nom de famille porte sa propre histoire — lors d'une présentation, écoutez le patronyme et laissez votre hôte indiquer ce que cette lignée signifie dans la pièce.",
    },
  }),
  row({
    region_code: "LB", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Beirut Dresses for the Evening",
    rule_raw: "Beirut social life rewards visible care in dress; underdressing reads as indifference.",
    rule_cc: "In Beirut, an evening invitation is met with visible care — polished shoes, pressed shirt, considered jewellery; turning up casually is read as indifference to the host's effort.",
    source_book: "ME", source_page: "238", urgency: 2,
    i18n: {
      nl: "In Beiroet beantwoordt men een avonduitnodiging met zichtbare zorg — gepoetste schoenen, gestreken hemd, doordachte sieraden; nonchalant verschijnen wordt opgevat als onverschilligheid jegens de inspanning van de gastheer.",
      fr: "À Beyrouth, on répond à une invitation du soir par un soin visible — chaussures cirées, chemise repassée, bijoux choisis ; arriver négligemment passe pour de l'indifférence à l'égard de l'hôte.",
    },
  }),

  // ── OMAN ───────────────────────────────────────────────────────────────────
  row({
    region_code: "OM", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Ibadi Composure",
    rule_raw: "Omani Islam follows the Ibadi tradition, which prizes quiet observance over display.",
    rule_cc: "In Oman, religious practice follows the Ibadi tradition — quiet, restrained, deeply private; loud opinion on faith, however admiring, is out of place.",
    source_book: "CM", source_page: "302", urgency: 3,
    i18n: {
      nl: "In Oman volgt de religieuze praktijk de ibaditische traditie — stil, ingetogen, diep persoonlijk; luide meningen over geloof, hoe bewonderend ook, zijn misplaatst.",
      fr: "À Oman, la pratique religieuse suit la tradition ibadite — discrète, mesurée, profondément intime ; toute opinion bruyante sur la foi, même admirative, est déplacée.",
      es: "En Omán, la práctica religiosa sigue la tradición ibadí — discreta, mesurada, profundamente íntima; cualquier opinión sonora sobre la fe, por admirativa que sea, está fuera de lugar.",
    },
  }),
  row({
    region_code: "OM", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: The Long Greeting",
    rule_raw: "Omani greetings are extended; rushing through them is read as cold.",
    rule_cc: "An Omani greeting unfolds slowly — health, family, journey, weather — and only then does business begin; cutting it short is read as coldness, not efficiency.",
    source_book: "CM", source_page: "308", urgency: 2,
    i18n: {
      nl: "Een Omaanse begroeting ontvouwt zich langzaam — gezondheid, familie, reis, weer — en pas daarna begint het zakelijke; haasten wordt opgevat als koelheid, niet als efficiëntie.",
      fr: "Un salut omanais se déploie lentement — santé, famille, voyage, météo — et seulement après vient l'affaire ; le précipiter passe pour de la froideur, non pour de l'efficacité.",
    },
  }),
  row({
    region_code: "OM", pillar_code: "Z3", subcategory: "seating_order",
    rule_type: "CC: Floor Majlis Manners",
    rule_raw: "In a traditional majlis, soles of feet must never point toward another guest.",
    rule_cc: "Seated in an Omani majlis, tuck the feet to one side — never let the soles point toward another person, and never toward the host.",
    source_book: "CM", source_page: "314", urgency: 3,
    i18n: {
      nl: "Zittend in een Omaanse majlis vouwt u de voeten naar één kant — laat de zolen nooit naar een andere persoon wijzen, en zeker nooit naar de gastheer.",
      fr: "Assis dans une majlis omanaise, repliez les pieds sur le côté — ne laissez jamais les semelles pointer vers une autre personne, encore moins vers l'hôte.",
      es: "Sentado en una majlis omaní, recoge los pies hacia un lado — nunca dejes que las suelas apunten a otra persona, y menos al anfitrión.",
    },
  }),
  row({
    region_code: "OM", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Sayyid and Sheikh",
    rule_raw: "Tribal and royal titles in Oman carry weight; misuse is noticed.",
    rule_cc: "When an Omani is introduced as Sayyid or Sheikh, retain the title in every address — dropping it for first-name familiarity is a misreading of the room.",
    source_book: "DN", source_page: "276", urgency: 2,
    i18n: {
      nl: "Wanneer een Omani wordt voorgesteld als Sayyid of Sheikh, behoudt u de titel in elke aanspraak — die laten vallen voor voornamen toont een verkeerd begrip van de situatie.",
      fr: "Lorsqu'un Omanais est présenté comme Sayyid ou Sheikh, conservez le titre dans chaque adresse — l'abandonner pour le prénom trahit une mauvaise lecture de la situation.",
    },
  }),
  row({
    region_code: "OM", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Cover Beyond the Resort",
    rule_raw: "Beyond hotel grounds, Omani modesty norms apply firmly to visitors.",
    rule_cc: "Beyond Omani hotel grounds, shoulders, knees, and chest stay covered for both sexes — the country is gracious to visitors but expects the courtesy returned.",
    source_book: "CM", source_page: "320", urgency: 3,
    i18n: {
      nl: "Buiten het hotelterrein in Oman blijven schouders, knieën en borst voor beide geslachten bedekt — het land is hoffelijk voor bezoekers en verwacht die hoffelijkheid terug.",
      fr: "Hors de l'hôtel, à Oman, épaules, genoux et poitrine restent couverts pour les deux sexes — le pays se montre gracieux envers ses visiteurs et attend la même courtoisie en retour.",
      es: "Fuera del recinto hotelero en Omán, hombros, rodillas y pecho permanecen cubiertos en ambos sexos — el país es cortés con sus visitantes y espera la misma cortesía a cambio.",
    },
  }),

  // ── KENYA ──────────────────────────────────────────────────────────────────
  row({
    region_code: "KE", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Never Photograph Without Asking",
    rule_raw: "Photographing Kenyans, especially Maasai, without consent is deeply offensive.",
    rule_cc: "In Kenya, never lift a camera toward a person — Maasai, market vendor, or stranger — without first asking; the image is felt as something taken, not given.",
    source_book: "CM", source_page: "402", urgency: 3,
    i18n: {
      nl: "Hef in Kenia nooit een camera naar een persoon — Maasai, marktverkoper of voorbijganger — zonder eerst te vragen; het beeld wordt ervaren als iets afgenomen, niet gegeven.",
      fr: "Au Kenya, ne braquez jamais d'appareil photo sur une personne — Maasai, vendeur, passant — sans demander d'abord ; l'image est ressentie comme quelque chose de pris, non donné.",
      es: "En Kenia, nunca levantes una cámara hacia una persona — Maasai, vendedor, transeúnte — sin pedir permiso; la imagen se vive como algo arrebatado, no dado.",
    },
  }),
  row({
    region_code: "KE", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Habari and the Handshake",
    rule_raw: "Kenyan greetings include a handshake and an unhurried 'habari' inquiry into wellbeing.",
    rule_cc: "A Kenyan greeting begins with a handshake and 'Habari?' — wait for the reply, return the question, and only then move to the matter at hand.",
    source_book: "ME", source_page: "291", urgency: 2,
    i18n: {
      nl: "Een Keniaanse begroeting begint met een handdruk en 'Habari?' — wacht het antwoord af, stel de vraag terug en ga pas dan over op het onderwerp.",
      fr: "Un salut kenyan commence par une poignée de main et « Habari ? » — attendez la réponse, retournez la question, et seulement alors abordez le sujet.",
    },
  }),
  row({
    region_code: "KE", pillar_code: "Z3", subcategory: "consumption_sounds",
    rule_type: "CC: Ugali by Hand",
    rule_raw: "Ugali and stew are eaten with the right hand from a shared plate.",
    rule_cc: "At a Kenyan table, ugali is taken with the right hand, shaped, dipped, and eaten — using cutlery on it, or reaching with the left hand, breaks the rhythm of the meal.",
    source_book: "CM", source_page: "408", urgency: 2,
    i18n: {
      nl: "Aan een Keniaanse tafel wordt ugali met de rechterhand gepakt, gevormd, gedoopt en gegeten — bestek gebruiken of met de linkerhand reiken doorbreekt het ritme van de maaltijd.",
      fr: "À une table kényane, l'ugali se prend de la main droite, se façonne, se trempe et se mange — l'usage de couverts ou de la main gauche brise le rythme du repas.",
    },
  }),
  row({
    region_code: "KE", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Mzee Speaks First",
    rule_raw: "Elders (mzee) are deferred to in any Kenyan gathering.",
    rule_cc: "In any Kenyan gathering, the mzee — the elder — is greeted first, served first, and answered last; speaking over them, even to agree, jars the room.",
    source_book: "DN", source_page: "318", urgency: 2,
    i18n: {
      nl: "In elke Keniaanse bijeenkomst wordt de mzee — de oudste — als eerste begroet, als eerste bediend en als laatste beantwoord; over hen heen praten, zelfs instemmend, schokt de ruimte.",
      fr: "Dans toute assemblée kényane, le mzee — l'aîné — est salué en premier, servi en premier et répondu en dernier ; lui couper la parole, même pour acquiescer, choque l'assistance.",
    },
  }),
  row({
    region_code: "KE", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Nairobi Smart",
    rule_raw: "Nairobi business circles dress sharply; safari attire belongs only on safari.",
    rule_cc: "In Nairobi business, a tailored suit and polished shoes are the baseline — safari shirts and zip-off trousers belong on the savannah, never at the meeting.",
    source_book: "ME", source_page: "297", urgency: 2,
    i18n: {
      nl: "In het Nairobi-zakenleven zijn een goedzittend pak en gepoetste schoenen de basis — safarihemden en afritsbroeken horen op de savanne, nooit aan de vergadertafel.",
      fr: "Dans les affaires à Nairobi, un costume bien coupé et des chaussures cirées sont la base — chemises de safari et pantalons à zip ont leur place dans la savane, jamais en réunion.",
    },
  }),

  // ── NIGERIA ────────────────────────────────────────────────────────────────
  row({
    region_code: "NG", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Faith Leads Conversation",
    rule_raw: "Christianity and Islam shape daily Nigerian life and openly enter conversation.",
    rule_cc: "In Nigeria, faith — Christian or Muslim — surfaces openly in greetings, blessings, and farewells; receive 'God bless you' and 'inshallah' as warmth, never as imposition.",
    source_book: "CM", source_page: "428", urgency: 2,
    i18n: {
      nl: "In Nigeria komt geloof — christelijk of islamitisch — openlijk naar voren in begroetingen, zegeningen en afscheid; ontvang 'God bless you' en 'inshallah' als warmte, nooit als opdringen.",
      fr: "Au Nigeria, la foi — chrétienne ou musulmane — apparaît ouvertement dans les salutations, les bénédictions et les adieux ; recevez « God bless you » et « inshallah » comme une chaleur, jamais une imposition.",
    },
  }),
  row({
    region_code: "NG", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Voice Carries Status",
    rule_raw: "Nigerian conversation is animated; quiet speech can be read as weakness.",
    rule_cc: "In Nigerian conversation, voice and presence carry conviction — speaking too softly is read as uncertainty, not refinement; project warmth audibly.",
    source_book: "CM", source_page: "434", urgency: 2,
    i18n: {
      nl: "In Nigeriaanse gesprekken dragen stem en aanwezigheid overtuiging — te zacht spreken wordt opgevat als onzekerheid, niet als verfijning; projecteer warmte hoorbaar.",
      fr: "Dans la conversation nigériane, la voix et la présence portent la conviction — parler trop bas se lit comme de l'incertitude, non comme du raffinement ; projetez la chaleur audiblement.",
    },
  }),
  row({
    region_code: "NG", pillar_code: "Z3", subcategory: "seating_order",
    rule_type: "CC: Stand for the Elder",
    rule_raw: "Nigerians rise when an elder enters; staying seated is read as disrespect.",
    rule_cc: "When an elder enters a Nigerian room, rise — Yoruba, Igbo, or Hausa, the gesture is universal; remaining seated is read as disrespect, not informality.",
    source_book: "DN", source_page: "342", urgency: 3,
    i18n: {
      nl: "Wanneer een oudere een Nigeriaanse ruimte betreedt, sta op — Yoruba, Igbo of Hausa, het gebaar is universeel; blijven zitten wordt opgevat als gebrek aan respect, niet als informaliteit.",
      fr: "Lorsqu'un aîné entre dans une pièce au Nigeria, levez-vous — Yoruba, Igbo ou Haoussa, le geste est universel ; rester assis se lit comme un manque de respect, non comme de la simplicité.",
      es: "Cuando un mayor entra en una sala nigeriana, levántate — Yoruba, Igbo o Hausa, el gesto es universal; permanecer sentado se lee como falta de respeto, no como informalidad.",
    },
  }),
  row({
    region_code: "NG", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Chief and Chief's Wife",
    rule_raw: "Traditional chieftaincy titles in Nigeria are used and respected in every setting.",
    rule_cc: "In Nigeria, chieftaincy titles — Chief, Otunba, Alhaji, Erelu — accompany the name in every address; using bare first names is a quiet diminishment.",
    source_book: "DN", source_page: "348", urgency: 2,
    i18n: {
      nl: "In Nigeria gaan chieftaincy-titels — Chief, Otunba, Alhaji, Erelu — in elke aanspraak met de naam mee; alleen de voornaam gebruiken is een stille kleinering.",
      fr: "Au Nigeria, les titres de chefferie — Chief, Otunba, Alhaji, Erelu — accompagnent le nom dans chaque adresse ; n'utiliser que le prénom est une discrète diminution.",
    },
  }),
  row({
    region_code: "NG", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Aso-Ebi Reads the Room",
    rule_raw: "Nigerian celebrations expect coordinated, lavish attire; understated dress reads as indifference.",
    rule_cc: "At a Nigerian celebration, dress is part of the gift — agbada, lace, gele, or a sharp suit; under-dressing reads as indifference to the host's joy.",
    source_book: "ME", source_page: "311", urgency: 2,
    i18n: {
      nl: "Bij een Nigeriaanse viering is kleding onderdeel van het geschenk — agbada, kant, gele of een scherp pak; te ingetogen gekleed gaan wordt opgevat als onverschilligheid jegens de vreugde van de gastheer.",
      fr: "À une célébration nigériane, la tenue fait partie du cadeau — agbada, dentelle, gele ou costume net ; s'habiller en retrait passe pour de l'indifférence à la joie de l'hôte.",
    },
  }),

  // ── ETHIOPIA ───────────────────────────────────────────────────────────────
  row({
    region_code: "ET", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Orthodox Fasting Calendar",
    rule_raw: "Ethiopian Orthodox fasting periods are extensive and shape menus.",
    rule_cc: "In Ethiopia, Orthodox fasts — Wednesdays, Fridays, and long seasonal periods — remove meat and dairy from many tables; never press a host to break the fast for you.",
    source_book: "CM", source_page: "454", urgency: 2,
    i18n: {
      nl: "In Ethiopië verwijderen orthodoxe vasten — woensdagen, vrijdagen en lange seizoensperiodes — vlees en zuivel van veel tafels; vraag een gastheer nooit het vasten voor u te onderbreken.",
      fr: "En Éthiopie, les jeûnes orthodoxes — mercredis, vendredis et longues périodes saisonnières — retirent viande et laitage de nombreuses tables ; ne demandez jamais à un hôte de rompre son jeûne pour vous.",
    },
  }),
  row({
    region_code: "ET", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Indirection over Confrontation",
    rule_raw: "Ethiopians prefer indirect speech; 'no' is rarely spoken aloud.",
    rule_cc: "In Ethiopia, a direct 'no' is felt as harsh — listen for hesitation, redirection, or silence as the answer, and respond in kind.",
    source_book: "CM", source_page: "460", urgency: 2,
    i18n: {
      nl: "In Ethiopië voelt een direct 'nee' hard aan — luister naar aarzeling, omleiding of stilte als het antwoord, en reageer in dezelfde toon.",
      fr: "En Éthiopie, un « non » direct paraît brutal — écoutez l'hésitation, la digression ou le silence comme la réponse, et répondez de même.",
    },
  }),
  row({
    region_code: "ET", pillar_code: "Z3", subcategory: "consumption_sounds",
    rule_type: "CC: Gursha and the Shared Injera",
    rule_raw: "Ethiopian meals are shared from one platter; gursha — feeding by hand — is honour.",
    rule_cc: "At an Ethiopian table, food is taken from a shared injera with the right hand; if a host offers gursha — a bite placed in your mouth — accept it as the highest honour.",
    source_book: "CM", source_page: "466", urgency: 3,
    i18n: {
      nl: "Aan een Ethiopische tafel wordt eten van één gedeelde injera gepakt met de rechterhand; biedt een gastheer gursha — een hap die in uw mond wordt gelegd — aanvaard dat als de grootste eer.",
      fr: "À une table éthiopienne, on prend la nourriture sur une injera partagée de la main droite ; si un hôte offre la gursha — une bouchée déposée dans votre bouche — acceptez-la comme le plus haut honneur.",
      es: "En la mesa etíope, la comida se toma de una injera compartida con la mano derecha; si un anfitrión ofrece gursha — un bocado colocado en tu boca — acéptalo como el más alto honor.",
    },
  }),
  row({
    region_code: "ET", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Bow with the Handshake",
    rule_raw: "Ethiopians often dip the head or shoulder when greeting elders or seniors.",
    rule_cc: "When greeting an Ethiopian elder or senior, accompany the handshake with a slight bow of the head and shoulder — the gesture marks the gap in years and rank.",
    source_book: "ME", source_page: "324", urgency: 2,
    i18n: {
      nl: "Begroet u een Ethiopische oudere of meerdere, begeleid de handdruk dan met een lichte buiging van hoofd en schouder — het gebaar markeert het verschil in jaren en rang.",
      fr: "En saluant un aîné ou un supérieur éthiopien, accompagnez la poignée de main d'une légère inclinaison de la tête et de l'épaule — le geste marque l'écart d'âge et de rang.",
    },
  }),
  row({
    region_code: "ET", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: White for the Ceremony",
    rule_raw: "White cotton — netela, gabi — is the dress of churches and ceremonies in Ethiopia.",
    rule_cc: "For an Ethiopian church visit or ceremony, white or muted tones are correct — bright colours and bare shoulders mark you out as untaught, not stylish.",
    source_book: "CM", source_page: "472", urgency: 2,
    i18n: {
      nl: "Voor een Ethiopisch kerkbezoek of ceremonie zijn wit of gedempte tinten gepast — felle kleuren en blote schouders markeren u als ongeschoold, niet als stijlvol.",
      fr: "Pour une visite à l'église ou une cérémonie en Éthiopie, le blanc ou les tons sourds conviennent — les couleurs vives et les épaules nues vous désignent comme mal informé, non comme élégant.",
    },
  }),

  // ── GHANA ──────────────────────────────────────────────────────────────────
  row({
    region_code: "GH", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Left Hand Forbidden",
    rule_raw: "In Ghana the left hand is unclean; never offer or receive with it.",
    rule_cc: "In Ghana, never offer money, food, or a handshake with the left hand — the right hand alone carries respect; ambidextrous habits abroad must be set aside.",
    source_book: "CM", source_page: "488", urgency: 3,
    i18n: {
      nl: "Bied in Ghana nooit geld, voedsel of een handdruk aan met de linkerhand — alleen de rechterhand draagt respect; ambidextere gewoonten van elders dienen opzij te worden gezet.",
      fr: "Au Ghana, n'offrez jamais d'argent, de nourriture ni de poignée de main de la main gauche — seule la droite porte le respect ; les habitudes ambidextres d'ailleurs doivent être laissées de côté.",
      es: "En Ghana, nunca ofrezcas dinero, comida ni la mano izquierda — solo la derecha lleva respeto; las costumbres ambidiestras de fuera deben quedarse al margen.",
    },
  }),
  row({
    region_code: "GH", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Greet Right to Left",
    rule_raw: "Ghanaians greet a row of people moving right to left.",
    rule_cc: "Entering a Ghanaian room, greet each person in turn moving from right to left — skipping anyone, however junior, is felt as a slight.",
    source_book: "CM", source_page: "494", urgency: 2,
    i18n: {
      nl: "Wanneer u een Ghanese ruimte betreedt, begroet u elke aanwezige om de beurt van rechts naar links — iemand overslaan, hoe jong ook, wordt als krenking gevoeld.",
      fr: "En entrant dans une pièce au Ghana, saluez chaque personne tour à tour de droite à gauche — sauter quelqu'un, même un jeune, est ressenti comme un affront.",
    },
  }),
  row({
    region_code: "GH", pillar_code: "Z3", subcategory: "consumption_sounds",
    rule_type: "CC: Fufu by the Right Hand",
    rule_raw: "Fufu and soup are eaten with the right hand; cutlery is foreign to the dish.",
    rule_cc: "At a Ghanaian table, fufu is pinched with the right hand, dipped in soup, and swallowed without chewing — using a fork misreads the dish entirely.",
    source_book: "CM", source_page: "500", urgency: 2,
    i18n: {
      nl: "Aan een Ghanese tafel wordt fufu met de rechterhand geknepen, in de soep gedoopt en zonder kauwen doorgeslikt — een vork gebruiken miskent het gerecht volledig.",
      fr: "À une table ghanéenne, le fufu se pince de la main droite, se trempe dans la soupe et s'avale sans mâcher — utiliser une fourchette méconnaît tout à fait le plat.",
    },
  }),
  row({
    region_code: "GH", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Chiefs Carry the Stool",
    rule_raw: "Akan and other chieftaincy traditions in Ghana grant chiefs deep ceremonial standing.",
    rule_cc: "When meeting a Ghanaian chief — Nana, Togbe, or Naa — bow slightly and never extend a hand first; protocol is led by the chief's linguist or elder.",
    source_book: "DN", source_page: "362", urgency: 2,
    i18n: {
      nl: "Bij het ontmoeten van een Ghanese chief — Nana, Togbe of Naa — buigt u licht en steekt u nooit eerst een hand uit; het protocol wordt geleid door de woordvoerder of oudste van de chief.",
      fr: "En rencontrant un chef ghanéen — Nana, Togbe ou Naa — inclinez-vous légèrement et ne tendez jamais la main en premier ; le protocole est mené par le porte-parole ou l'aîné du chef.",
    },
  }),
  row({
    region_code: "GH", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Kente and the Funeral Black",
    rule_raw: "Ghanaian dress codes are tied to occasion: kente for joy, black or red for mourning.",
    rule_cc: "In Ghana, occasion dictates colour — kente and bright prints for celebration, black or red for mourning; arriving in the wrong palette is read as inattention.",
    source_book: "ME", source_page: "338", urgency: 2,
    i18n: {
      nl: "In Ghana bepaalt de gelegenheid de kleur — kente en heldere prints voor feest, zwart of rood voor rouw; in het verkeerde palet verschijnen wordt opgevat als onoplettendheid.",
      fr: "Au Ghana, l'occasion dicte la couleur — kente et imprimés vifs pour la fête, noir ou rouge pour le deuil ; arriver dans la mauvaise palette passe pour de l'inattention.",
    },
  }),

  // ── TANZANIA ───────────────────────────────────────────────────────────────
  row({
    region_code: "TZ", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Zanzibar's Muslim Modesty",
    rule_raw: "Zanzibar and the coastal strip are conservatively Muslim; mainland norms differ.",
    rule_cc: "In Zanzibar and Tanzania's coastal towns, Muslim modesty governs public dress and behaviour — what passes on a Dar es Salaam beach does not pass in Stone Town.",
    source_book: "CM", source_page: "514", urgency: 3,
    i18n: {
      nl: "In Zanzibar en de Tanzaniaanse kuststeden bepaalt islamitische ingetogenheid kleding en gedrag — wat op een strand in Dar es Salaam kan, kan niet in Stone Town.",
      fr: "À Zanzibar et dans les villes côtières de Tanzanie, la pudeur musulmane régit la tenue et le comportement publics — ce qui passe sur une plage de Dar es Salaam ne passe pas à Stone Town.",
      es: "En Zanzíbar y las ciudades costeras de Tanzania, el recato musulmán rige la vestimenta y la conducta públicas — lo que pasa en una playa de Dar es Salaam no pasa en Stone Town.",
    },
  }),
  row({
    region_code: "TZ", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Pole Pole Sets the Pace",
    rule_raw: "Tanzanians greet unhurriedly; rushing is felt as rudeness.",
    rule_cc: "Tanzanians live by 'pole pole' — slowly, slowly; stretch the greeting, ask after family and health, and let the meeting begin in its own time.",
    source_book: "CM", source_page: "520", urgency: 2,
    i18n: {
      nl: "Tanzanianen leven volgens 'pole pole' — langzaam, langzaam; rek de begroeting, vraag naar familie en gezondheid, en laat de ontmoeting in eigen tempo beginnen.",
      fr: "Les Tanzaniens vivent selon « pole pole » — lentement, lentement ; étirez le salut, prenez des nouvelles de la famille et de la santé, et laissez la rencontre démarrer à son rythme.",
    },
  }),
  row({
    region_code: "TZ", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Coastal Tea, Inland Coffee",
    rule_raw: "Spiced tea on the coast and roasted coffee inland are shared as welcome.",
    rule_cc: "In Tanzania, accept the cup pressed into your hand — spiced chai on the coast, dark coffee inland; declining is felt as declining the welcome itself.",
    source_book: "CM", source_page: "526", urgency: 2,
    i18n: {
      nl: "Aanvaard in Tanzania de kop die in uw hand wordt gedrukt — gekruide chai aan de kust, donkere koffie in het binnenland; weigeren wordt ervaren als het weigeren van het welkom zelf.",
      fr: "En Tanzanie, acceptez la tasse qu'on vous tend — chai épicé sur la côte, café noir à l'intérieur ; refuser revient à refuser l'accueil même.",
    },
  }),
  row({
    region_code: "TZ", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Mzee, Bibi, and Bwana",
    rule_raw: "Swahili honorifics — Mzee, Bibi, Bwana — show due respect in Tanzania.",
    rule_cc: "Address Tanzanian elders as Mzee, women of standing as Bibi, and senior men as Bwana — Swahili honorifics carry the courtesy that first names cannot.",
    source_book: "DN", source_page: "374", urgency: 2,
    i18n: {
      nl: "Spreek Tanzaniaanse ouderen aan met Mzee, vrouwen van aanzien met Bibi en gezaghebbende mannen met Bwana — Swahili-eretitels dragen de hoffelijkheid die voornamen niet kunnen.",
      fr: "Adressez-vous aux aînés tanzaniens avec Mzee, aux femmes de standing avec Bibi et aux hommes en vue avec Bwana — les titres swahilis portent une courtoisie que le prénom ne porte pas.",
    },
  }),
  row({
    region_code: "TZ", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Khanga Cover for the Coast",
    rule_raw: "A khanga or wrap is the standard cover walking off a Tanzanian beach.",
    rule_cc: "Walking off a Tanzanian beach into town, wrap a khanga or kanga over swimwear — the unspoken rule is that the sea is the sea, the street is the street.",
    source_book: "CM", source_page: "532", urgency: 2,
    i18n: {
      nl: "Loopt u een Tanzaniaans strand af de stad in, sla dan een khanga of kanga om de zwemkleding — de ongeschreven regel: de zee is de zee, de straat is de straat.",
      fr: "Quittant une plage tanzanienne pour la ville, enroulez un khanga ou kanga par-dessus le maillot — la règle tacite : la mer est la mer, la rue est la rue.",
    },
  }),

  // ── ARGENTINA ──────────────────────────────────────────────────────────────
  row({
    region_code: "AR", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Falklands Stay Off the Table",
    rule_raw: "The Malvinas/Falklands remain raw in Argentina; visitors should not raise the topic.",
    rule_cc: "In Argentina, the Malvinas are felt as wound, not debate — let the subject lie unless an Argentine raises it, and even then listen rather than opine.",
    source_book: "CM", source_page: "548", urgency: 3,
    i18n: {
      nl: "In Argentinië zijn de Malvinas een wond, geen debat — laat het onderwerp rusten tenzij een Argentijn het opbrengt, en luister dan eerder dan dat u oordeelt.",
      fr: "En Argentine, les Malouines sont une blessure, non un débat — laissez le sujet reposer à moins qu'un Argentin ne l'ouvre, et même alors écoutez plutôt que d'opiner.",
      es: "En Argentina, las Malvinas son herida, no debate — deja el tema en paz salvo que un argentino lo abra, y aun entonces escucha en vez de opinar.",
    },
  }),
  row({
    region_code: "AR", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: One Cheek Kiss",
    rule_raw: "Argentine greetings between men and women, and often between men, include a single cheek kiss.",
    rule_cc: "In Argentina, a single kiss on the right cheek greets friends and new acquaintances alike — across genders and, in many circles, between men; refusing it cools the room.",
    source_book: "ME", source_page: "352", urgency: 2,
    i18n: {
      nl: "In Argentinië begroet één kus op de rechterwang vrienden en nieuwe kennissen — over geslachten heen en, in veel kringen, ook tussen mannen; weigeren bekoelt de ruimte.",
      fr: "En Argentine, un baiser unique sur la joue droite salue amis et nouvelles connaissances — au-delà des genres et, dans bien des cercles, entre hommes ; le refuser refroidit la pièce.",
    },
  }),
  row({
    region_code: "AR", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Mate and the Cebador",
    rule_raw: "Mate is shared from a single gourd in a fixed order led by the cebador.",
    rule_cc: "When mate is offered in Argentina, drink it down before passing the gourd back to the cebador — never to the next person, never with thanks unless you are finished for good.",
    source_book: "CM", source_page: "554", urgency: 2,
    i18n: {
      nl: "Wanneer mate in Argentinië wordt aangeboden, drink hem op en geef de kalebas terug aan de cebador — nooit aan de volgende, nooit met 'gracias' tenzij u helemaal klaar bent.",
      fr: "Quand on vous offre du maté en Argentine, buvez-le entièrement et rendez la calebasse au cebador — jamais au voisin, jamais en disant « gracias » sauf si vous avez terminé pour de bon.",
    },
  }),
  row({
    region_code: "AR", pillar_code: "Z4", subcategory: "networking",
    rule_type: "CC: Relationship Before Contract",
    rule_raw: "Argentines build trust over coffee and meals before serious business begins.",
    rule_cc: "In Argentine business, expect long lunches and circling conversation before the contract surfaces — pushing to the agenda too early stalls the deal you came to make.",
    source_book: "ME", source_page: "358", urgency: 2,
    i18n: {
      nl: "In het Argentijnse zakenleven horen lange lunches en cirkelende gesprekken bij het werk vóór het contract op tafel komt — te vroeg op de agenda aandringen blokkeert juist de deal waarvoor u kwam.",
      fr: "Dans les affaires argentines, attendez-vous à de longs déjeuners et à des conversations en cercle avant que le contrat n'apparaisse — pousser l'agenda trop tôt enlise la transaction que vous étiez venu conclure.",
    },
  }),
  row({
    region_code: "AR", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Buenos Aires Tailoring",
    rule_raw: "Buenos Aires social and business circles dress with European tailoring sensibility.",
    rule_cc: "In Buenos Aires, tailored European cuts and quality leather shoes are the social baseline — visible sportswear in the city, even on weekends, marks you as elsewhere.",
    source_book: "ME", source_page: "364", urgency: 2,
    i18n: {
      nl: "In Buenos Aires zijn Europese coupes en lederen schoenen de sociale basis — zichtbare sportkleding in de stad, ook in het weekend, markeert u als buitenstaander.",
      fr: "À Buenos Aires, les coupes européennes ajustées et les chaussures de cuir sont la base sociale — des vêtements de sport visibles en ville, même le week-end, vous désignent comme venu d'ailleurs.",
    },
  }),

  // ── CHILE ──────────────────────────────────────────────────────────────────
  row({
    region_code: "CL", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Pinochet Years Stay Private",
    rule_raw: "The Pinochet era still divides Chilean families; visitors should not press it.",
    rule_cc: "In Chile, the Pinochet years remain a fault line through families — never raise the period as small talk, and never compliment or condemn without invitation.",
    source_book: "CM", source_page: "568", urgency: 3,
    i18n: {
      nl: "In Chili zijn de Pinochet-jaren nog steeds een breuklijn door families — breng die periode nooit aan als smalltalk en prijs of veroordeel niet zonder uitnodiging.",
      fr: "Au Chili, les années Pinochet restent une ligne de fracture dans les familles — n'évoquez jamais cette période en bavardage, et ne louez ni ne condamnez sans invitation.",
      es: "En Chile, los años de Pinochet siguen siendo una línea de fractura en las familias — nunca traigas el periodo como charla, ni alabes ni condenes sin invitación.",
    },
  }),
  row({
    region_code: "CL", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Modesty over Boast",
    rule_raw: "Chileans dislike self-promotion; understated speech wins trust.",
    rule_cc: "In Chilean conversation, modesty is mistaken for nothing — credentials are mentioned in passing, never paraded; understatement is heard as competence.",
    source_book: "CM", source_page: "574", urgency: 2,
    i18n: {
      nl: "In Chileense gesprekken wordt bescheidenheid voor niets aangezien — kwalificaties worden terloops genoemd, nooit geëtaleerd; understatement wordt gehoord als competentie.",
      fr: "Dans la conversation chilienne, la modestie ne passe pas pour de l'effacement — les titres se mentionnent au passage, jamais ne s'affichent ; la litote s'entend comme de la compétence.",
    },
  }),
  row({
    region_code: "CL", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Wine with the Meal",
    rule_raw: "Chilean wine pairing is taken seriously; refusing the host's choice is awkward.",
    rule_cc: "At a Chilean table, accept the wine the host pours — Chile takes its vines seriously, and waving the glass away reads as a small disregard for the meal itself.",
    source_book: "CM", source_page: "580", urgency: 2,
    i18n: {
      nl: "Aanvaard aan een Chileense tafel de wijn die de gastheer inschenkt — Chili neemt zijn wijnbouw serieus, en het glas wegwuiven wordt opgevat als geringschatting van de maaltijd zelf.",
      fr: "À une table chilienne, acceptez le vin que verse l'hôte — le Chili prend sa vigne au sérieux, et écarter le verre passe pour une petite désinvolture envers le repas même.",
    },
  }),
  row({
    region_code: "CL", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Don and Doña Endure",
    rule_raw: "Chileans use Don/Doña with senior or older counterparts; dropping it can feel forward.",
    rule_cc: "In Chilean business, address senior counterparts as Don or Doña followed by the first name — moving to bare first names before invitation reads as forward.",
    source_book: "DN", source_page: "388", urgency: 2,
    i18n: {
      nl: "Spreek Chileense meerderen of ouderen aan met Don of Doña gevolgd door de voornaam — overgaan op alleen de voornaam zonder uitnodiging komt vooruitstrevend over.",
      fr: "Dans les affaires chiliennes, adressez-vous aux supérieurs avec Don ou Doña suivi du prénom — passer au seul prénom sans invitation paraît présomptueux.",
    },
  }),
  row({
    region_code: "CL", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Santiago Sober Suit",
    rule_raw: "Santiago business dresses conservatively; flashy attire undermines authority.",
    rule_cc: "In Santiago business, a sober dark suit and quiet shirt set the standard — bright ties or visible logos are read as inexperience, not flair.",
    source_book: "ME", source_page: "374", urgency: 2,
    i18n: {
      nl: "In het Santiago-zakenleven zetten een sober donker pak en een rustig overhemd de standaard — felle dassen of zichtbare logo's worden opgevat als onervarenheid, niet als flair.",
      fr: "Dans les affaires à Santiago, un costume sombre sobre et une chemise discrète posent la norme — cravates voyantes ou logos visibles passent pour de l'inexpérience, non pour du panache.",
    },
  }),

  // ── PERU ───────────────────────────────────────────────────────────────────
  row({
    region_code: "PE", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Andean Reverence",
    rule_raw: "Pachamama and Andean rituals coexist with Catholicism and deserve respect.",
    rule_cc: "In Peru, Andean reverence — for Pachamama, for the apus, for the Inca past — sits alongside Catholic ritual; never treat the offerings or sites as picturesque curiosity.",
    source_book: "CM", source_page: "596", urgency: 3,
    i18n: {
      nl: "In Peru staat Andescultus — voor Pachamama, voor de apus, voor het Inca-verleden — naast katholiek ritueel; behandel de offergaven of plaatsen nooit als pittoreske curiositeit.",
      fr: "Au Pérou, la révérence andine — pour la Pachamama, les apus, le passé inca — coexiste avec le rite catholique ; ne traitez jamais les offrandes ou les sites comme une curiosité pittoresque.",
      es: "En el Perú, la reverencia andina — a la Pachamama, a los apus, al pasado inca — convive con el rito católico; nunca trates las ofrendas o los sitios como curiosidad pintoresca.",
    },
  }),
  row({
    region_code: "PE", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Indirect Refusal",
    rule_raw: "Peruvians often answer 'sí, claro' rather than say no outright.",
    rule_cc: "In Peru, 'sí, claro' may signal politeness, not commitment — listen for follow-through and confirm in writing before treating an answer as a yes.",
    source_book: "CM", source_page: "602", urgency: 2,
    i18n: {
      nl: "In Peru kan 'sí, claro' beleefdheid aangeven, geen toezegging — let op de opvolging en bevestig schriftelijk voordat u het als ja behandelt.",
      fr: "Au Pérou, « sí, claro » peut signaler la politesse, non l'engagement — guettez le suivi et confirmez par écrit avant de traiter la réponse comme un oui.",
    },
  }),
  row({
    region_code: "PE", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Pisco Sour Toast",
    rule_raw: "The pisco sour opens Peruvian gatherings; toast and sip together.",
    rule_cc: "In Peru, the pisco sour opens the meal — wait for the toast 'salud', meet eyes around the table, and sip; drinking before the toast misses the moment.",
    source_book: "CM", source_page: "608", urgency: 2,
    i18n: {
      nl: "In Peru opent de pisco sour de maaltijd — wacht op het 'salud', maak rond de tafel oogcontact en neem dan een slok; vóór de toost drinken mist het moment.",
      fr: "Au Pérou, le pisco sour ouvre le repas — attendez le « salud », croisez les regards autour de la table, puis buvez ; siroter avant le toast manque l'instant.",
    },
  }),
  row({
    region_code: "PE", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Address by Profession",
    rule_raw: "Peruvians use professional titles — Doctor, Ingeniero, Arquitecto — in address.",
    rule_cc: "In Peru, address professionals by title — Doctor, Ingeniero, Arquitecto — followed by surname; titles signal respect for the years that earned them.",
    source_book: "DN", source_page: "402", urgency: 2,
    i18n: {
      nl: "Spreek Peruaanse vakgenoten aan met titel — Doctor, Ingeniero, Arquitecto — gevolgd door de achternaam; titels tonen respect voor de jaren die ze hebben verdiend.",
      fr: "Au Pérou, adressez-vous aux professionnels par leur titre — Doctor, Ingeniero, Arquitecto — suivi du nom de famille ; les titres marquent le respect des années qui les ont valus.",
    },
  }),
  row({
    region_code: "PE", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Lima Conservative",
    rule_raw: "Lima's business circles dress conservatively; visible casual wear undermines status.",
    rule_cc: "In Lima business, a tailored suit and polished shoes are the daytime norm — ponchos and Andean weaves belong to celebration, not the boardroom.",
    source_book: "ME", source_page: "382", urgency: 2,
    i18n: {
      nl: "In het Lima-zakenleven zijn een goedzittend pak en gepoetste schoenen de norm overdag — poncho's en Andesweefsels horen bij feest, niet bij de bestuurskamer.",
      fr: "Dans les affaires à Lima, un costume bien coupé et des chaussures cirées sont la norme — ponchos et tissages andins relèvent de la fête, non de la salle du conseil.",
    },
  }),

  // ── COSTA RICA ─────────────────────────────────────────────────────────────
  row({
    region_code: "CR", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Pura Vida, Not Cliché",
    rule_raw: "'Pura vida' is a real ethic; using it sarcastically grates on Costa Ricans.",
    rule_cc: "In Costa Rica, 'pura vida' is a lived ethic — greeting, farewell, philosophy; using it sarcastically or as a tourist tag grates more than it amuses.",
    source_book: "CM", source_page: "624", urgency: 2,
    i18n: {
      nl: "In Costa Rica is 'pura vida' een geleefde ethiek — begroeting, afscheid, filosofie; sarcastisch of als toeristenkreet gebruikt irriteert het meer dan het amuseert.",
      fr: "Au Costa Rica, « pura vida » est une éthique vécue — salut, adieu, philosophie ; l'utiliser ironiquement ou en cliché touristique agace plus qu'il n'amuse.",
    },
  }),
  row({
    region_code: "CR", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Quedar Bien",
    rule_raw: "Costa Ricans soften disagreement to preserve harmony — 'quedar bien'.",
    rule_cc: "In Costa Rica, 'quedar bien' — to leave well — shapes speech; outright contradiction is rare, and a soft 'maybe' often means 'no'.",
    source_book: "CM", source_page: "630", urgency: 2,
    i18n: {
      nl: "In Costa Rica vormt 'quedar bien' — als goed achterblijven — de spraak; ronduit tegenspreken is zeldzaam, en een zacht 'misschien' betekent vaak 'nee'.",
      fr: "Au Costa Rica, « quedar bien » — laisser bonne impression — façonne la parole ; la contradiction franche est rare, et un doux « peut-être » signifie souvent « non ».",
    },
  }),
  row({
    region_code: "CR", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Coffee is the Welcome",
    rule_raw: "Costa Rican coffee is a point of pride; refusing it dampens hospitality.",
    rule_cc: "Decline a Costa Rican coffee only with regret — the beans are a national pride, and accepting the cup completes the welcome you have been given.",
    source_book: "CM", source_page: "636", urgency: 2,
    i18n: {
      nl: "Sla Costa Ricaanse koffie alleen met spijt af — de bonen zijn nationale trots en het kopje aannemen voltooit het welkom dat u krijgt.",
      fr: "Ne refusez un café costaricien qu'à regret — les grains sont une fierté nationale, et accepter la tasse achève l'accueil offert.",
    },
  }),
  row({
    region_code: "CR", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Egalitarian Address",
    rule_raw: "Costa Ricans are notably egalitarian; ostentatious title use can feel stiff.",
    rule_cc: "Costa Ricans are quietly egalitarian — use titles for first introductions, then follow your host into first names; clinging to formality reads as cold.",
    source_book: "DN", source_page: "414", urgency: 2,
    i18n: {
      nl: "Costa Ricanen zijn stilletjes egalitair — gebruik titels bij eerste kennismaking, volg dan uw gastheer naar voornamen; vasthouden aan formaliteit komt koud over.",
      fr: "Les Costariciens sont discrètement égalitaires — usez de titres aux premières présentations, puis suivez l'hôte vers les prénoms ; s'accrocher à la formalité paraît froid.",
    },
  }),
  row({
    region_code: "CR", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Smart Casual is the Norm",
    rule_raw: "Costa Rica favours smart casual; formal wear is reserved for weddings and politics.",
    rule_cc: "In Costa Rica, smart casual — chinos, pressed shirt, leather shoes — covers most evenings; reserve a tie for weddings, ceremonies, or political occasions.",
    source_book: "ME", source_page: "392", urgency: 2,
    i18n: {
      nl: "In Costa Rica dekt smart casual — chino, gestreken hemd, leren schoenen — de meeste avonden; bewaar een das voor bruiloften, ceremonies of politieke gelegenheden.",
      fr: "Au Costa Rica, le smart casual — chino, chemise repassée, chaussures de cuir — convient pour la plupart des soirées ; gardez la cravate pour les mariages, cérémonies ou occasions politiques.",
    },
  }),

  // ── URUGUAY ────────────────────────────────────────────────────────────────
  row({
    region_code: "UY", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Tranquilo Above All",
    rule_raw: "Uruguayans dislike loudness and ostentation; quiet behaviour is the cultural baseline.",
    rule_cc: "In Uruguay, tranquilidad is the cultural baseline — loud voices, large gestures, and visible wealth all jar; the quiet guest moves easiest through the room.",
    source_book: "CM", source_page: "652", urgency: 2,
    i18n: {
      nl: "In Uruguay is tranquilidad de culturele basis — luide stemmen, grote gebaren en zichtbare rijkdom schuren; de stille gast beweegt het makkelijkst door de ruimte.",
      fr: "En Uruguay, la tranquilidad est la norme culturelle — voix fortes, grands gestes et richesse visible détonnent ; l'invité discret se meut le plus aisément.",
    },
  }),
  row({
    region_code: "UY", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Considered Phrasing",
    rule_raw: "Uruguayans favour considered, measured speech over rapid repartee.",
    rule_cc: "In Uruguayan conversation, considered phrasing wins over speed — pauses are welcomed, and a thought worked through aloud is heard as competence.",
    source_book: "CM", source_page: "658", urgency: 2,
    i18n: {
      nl: "In Uruguayaanse gesprekken wint doordachte formulering het van snelheid — pauzes zijn welkom, en een gedachte hardop uitgewerkt wordt gehoord als competentie.",
      fr: "Dans la conversation uruguayenne, la formulation pesée l'emporte sur la vitesse — les pauses sont bienvenues, et une pensée mûrie à voix haute s'entend comme compétence.",
    },
  }),
  row({
    region_code: "UY", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Mate Travels with You",
    rule_raw: "Uruguayans carry mate gourd and thermos everywhere; sharing is intimate.",
    rule_cc: "In Uruguay, mate travels by hand and thermos through the day; if shared with you, drink down the gourd and return it without thanks until the round closes.",
    source_book: "CM", source_page: "664", urgency: 2,
    i18n: {
      nl: "In Uruguay reist mate met kalebas en thermoskan door de dag; als hij met u wordt gedeeld, drink hem leeg en geef hem zonder 'gracias' terug tot de ronde sluit.",
      fr: "En Uruguay, le maté voyage en gourde et en thermos toute la journée ; si on le partage avec vous, buvez la calebasse entière et rendez-la sans « gracias » jusqu'à la fin du tour.",
    },
  }),
  row({
    region_code: "UY", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: First Names Come Quickly",
    rule_raw: "Uruguayans move to first names early; clinging to titles feels distant.",
    rule_cc: "In Uruguay, first names arrive early — once introduced, follow your host's lead; staying on Señor or Doctor too long marks you as distant.",
    source_book: "DN", source_page: "426", urgency: 2,
    i18n: {
      nl: "In Uruguay komen voornamen snel — volg uw gastheer na de voorstelling; te lang vasthouden aan Señor of Doctor markeert u als afstandelijk.",
      fr: "En Uruguay, les prénoms arrivent vite — après la présentation, suivez votre hôte ; rester trop longtemps à Señor ou Doctor vous fait paraître distant.",
    },
  }),
  row({
    region_code: "UY", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Quiet Quality",
    rule_raw: "Uruguay favours simple, well-made clothing over visible labels.",
    rule_cc: "Uruguayan style is quiet quality — well-made wool, leather, and linen, free of visible labels; a refined guest leaves the logo brand at home.",
    source_book: "ME", source_page: "402", urgency: 2,
    i18n: {
      nl: "Uruguayaanse stijl is stille kwaliteit — goed gemaakte wol, leer en linnen, zonder zichtbare labels; een verfijnde gast laat het logomerk thuis.",
      fr: "Le style uruguayen est de qualité discrète — laine, cuir et lin bien faits, sans logos visibles ; un invité raffiné laisse la marque ostensible à la maison.",
    },
  }),

  // ── CUBA ───────────────────────────────────────────────────────────────────
  row({
    region_code: "CU", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Politics, Lightly",
    rule_raw: "Visitors should not press political opinions on Cubans, who weigh their words.",
    rule_cc: "In Cuba, never press a host or stranger for political opinion — Cubans weigh their public words carefully, and pushing the topic puts them in a corner.",
    source_book: "CM", source_page: "682", urgency: 3,
    i18n: {
      nl: "Druk in Cuba nooit een gastheer of vreemde tot een politieke mening — Cubanen wegen hun publieke woorden zorgvuldig en het onderwerp aandringen drijft hen in een hoek.",
      fr: "À Cuba, ne pressez jamais un hôte ou un inconnu de donner son opinion politique — les Cubains pèsent leurs mots publics, et insister les met dans une impasse.",
      es: "En Cuba, nunca presiones a un anfitrión o desconocido por opinión política — los cubanos pesan sus palabras públicas, e insistir los acorrala.",
    },
  }),
  row({
    region_code: "CU", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Music Carries Mood",
    rule_raw: "Cuban conversation rides on rhythm, voice, and shared music.",
    rule_cc: "Cuban exchange rides on voice and rhythm — humour, song, and the half-sung phrase carry meaning; deadpan formality misses half the room.",
    source_book: "CM", source_page: "688", urgency: 2,
    i18n: {
      nl: "Cubaanse uitwisseling drijft op stem en ritme — humor, zang en de half-gezongen zin dragen betekenis; uitgestreken formaliteit mist de helft van de ruimte.",
      fr: "L'échange cubain vit de la voix et du rythme — humour, chant et phrase à demi chantée portent le sens ; la formalité impassible passe à côté de la moitié de la pièce.",
    },
  }),
  row({
    region_code: "CU", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Rum and the First Drop",
    rule_raw: "Cubans pour the first drop of rum to the ground for the orishas.",
    rule_cc: "When sharing rum in Cuba, expect the host to spill the first drops to the floor for the orishas — accept the gesture quietly; it is offering, not waste.",
    source_book: "CM", source_page: "694", urgency: 2,
    i18n: {
      nl: "Bij het delen van rum in Cuba verwacht u dat de gastheer de eerste druppels op de vloer giet voor de orishas — neem het gebaar stil aan; het is offer, geen verspilling.",
      fr: "En partageant du rhum à Cuba, attendez-vous à voir l'hôte verser les premières gouttes au sol pour les orishas — accueillez le geste en silence ; c'est une offrande, non un gâchis.",
    },
  }),
  row({
    region_code: "CU", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Compañero Levels the Room",
    rule_raw: "'Compañero/a' is a common Cuban form of address that signals equality.",
    rule_cc: "In Cuba, 'compañero' or 'compañera' addresses strangers with warmth and equality — neither overly formal nor familiar, it threads the room.",
    source_book: "DN", source_page: "438", urgency: 2,
    i18n: {
      nl: "In Cuba spreekt 'compañero' of 'compañera' vreemden aan met warmte en gelijkheid — niet te formeel, niet te familiair, het verbindt de ruimte.",
      fr: "À Cuba, « compañero » ou « compañera » salue l'inconnu avec chaleur et égalité — ni trop formel ni trop familier, il tisse la pièce.",
    },
  }),
  row({
    region_code: "CU", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Guayabera Suffices",
    rule_raw: "A pressed guayabera replaces the suit jacket in Cuban formal wear.",
    rule_cc: "In Cuba, a crisp guayabera serves where a suit would elsewhere — pressed, white or pastel, it is correct for office, dinner, and ceremony alike.",
    source_book: "ME", source_page: "414", urgency: 2,
    i18n: {
      nl: "In Cuba doet een gestreken guayabera dienst waar elders een pak hoort — strak, wit of pastel, gepast voor kantoor, diner en ceremonie.",
      fr: "À Cuba, une guayabera repassée remplace le costume — nette, blanche ou pastel, elle convient au bureau, au dîner et à la cérémonie.",
    },
  }),

  // ── NEW ZEALAND ────────────────────────────────────────────────────────────
  row({
    region_code: "NZ", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Tapu and the Head",
    rule_raw: "In Māori culture the head is tapu (sacred); patting it is offensive.",
    rule_cc: "In New Zealand, never pat a Māori head — the head is tapu, sacred; the gesture, however affectionate elsewhere, is felt as a violation.",
    source_book: "CM", source_page: "712", urgency: 3,
    i18n: {
      nl: "Klop in Nieuw-Zeeland nooit een Māori op het hoofd — het hoofd is tapu, heilig; het gebaar, hoe vriendelijk elders ook, wordt als schending gevoeld.",
      fr: "En Nouvelle-Zélande, ne tapotez jamais la tête d'un Māori — la tête est tapu, sacrée ; le geste, si affectueux ailleurs, est ressenti comme une violation.",
      es: "En Nueva Zelanda, nunca palmees la cabeza de un Māori — la cabeza es tapu, sagrada; el gesto, por afectuoso que sea fuera, se vive como violación.",
    },
  }),
  row({
    region_code: "NZ", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Hongi When Offered",
    rule_raw: "On a marae, the hongi — pressing of nose and forehead — replaces the handshake.",
    rule_cc: "On a New Zealand marae, when offered the hongi — nose and forehead pressed gently together — meet it without flinching; it shares the breath of life.",
    source_book: "CM", source_page: "718", urgency: 3,
    i18n: {
      nl: "Op een Nieuw-Zeelandse marae, wanneer u de hongi krijgt aangeboden — neuzen en voorhoofden zacht samen — beantwoord die zonder terug te deinzen; hij deelt de adem van het leven.",
      fr: "Sur un marae néo-zélandais, lorsqu'on vous offre le hongi — nez et front doucement pressés — répondez sans reculer ; il partage le souffle de vie.",
      es: "En un marae neozelandés, cuando se te ofrece el hongi — nariz y frente unidos suavemente — respóndelo sin retroceder; comparte el aliento de vida.",
    },
  }),
  row({
    region_code: "NZ", pillar_code: "Z3", subcategory: "payment_ritual",
    rule_type: "CC: No Tipping Expected",
    rule_raw: "Tipping in New Zealand is not customary; staff are paid a living wage.",
    rule_cc: "In New Zealand, tipping is not expected — service is included in fair wages; large tips can confuse rather than please, though rounding up for great service is welcomed.",
    source_book: "ME", source_page: "424", urgency: 2,
    i18n: {
      nl: "In Nieuw-Zeeland wordt fooi niet verwacht — service zit in een eerlijk loon; grote fooien verwarren eerder dan ze plezieren, al wordt afronden bij uitstekende service gewaardeerd.",
      fr: "En Nouvelle-Zélande, le pourboire n'est pas attendu — le service est inclus dans un salaire juste ; les gros pourboires déroutent plus qu'ils ne plaisent, même si arrondir pour un excellent service est apprécié.",
    },
  }),
  row({
    region_code: "NZ", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Tall Poppies Trimmed",
    rule_raw: "New Zealanders cut down boasters; modesty is the cultural reflex.",
    rule_cc: "In New Zealand, the tall poppy is quietly trimmed — credentials worn lightly land best, and self-deprecation is heard as confidence, not weakness.",
    source_book: "CM", source_page: "724", urgency: 2,
    i18n: {
      nl: "In Nieuw-Zeeland wordt de hoge papaver stilletjes geknipt — kwalificaties licht gedragen komen het best aan, en zelfspot wordt gehoord als zelfvertrouwen, niet als zwakte.",
      fr: "En Nouvelle-Zélande, le grand coquelicot est discrètement taillé — les titres portés avec légèreté passent le mieux, et l'autodérision s'entend comme assurance, non comme faiblesse.",
    },
  }),
  row({
    region_code: "NZ", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Smart Casual Norm",
    rule_raw: "New Zealand business is smart casual; full suits are reserved for top finance and law.",
    rule_cc: "In New Zealand business, smart casual rules — open-neck shirt and chinos read as competent; full suit and tie can read as out of touch outside law and finance.",
    source_book: "ME", source_page: "430", urgency: 2,
    i18n: {
      nl: "In het Nieuw-Zeelandse zakenleven heerst smart casual — overhemd zonder das en chino komen competent over; pak met das kan buiten advocatuur en finance overkomen als wereldvreemd.",
      fr: "Dans les affaires néo-zélandaises, le smart casual prévaut — chemise ouverte et chino se lisent comme compétents ; costume cravate peut paraître déconnecté hors du droit et de la finance.",
    },
  }),

  // ── CROATIA ────────────────────────────────────────────────────────────────
  row({
    region_code: "HR", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: The 1990s Stay Sensitive",
    rule_raw: "The Yugoslav wars remain raw in Croatia; conflate at your peril.",
    rule_cc: "In Croatia, never lump the country in with 'former Yugoslavia' — the war years are recent and personal, and Croatian identity is held distinct.",
    source_book: "CM", source_page: "742", urgency: 3,
    i18n: {
      nl: "Gooi Kroatië nooit op één hoop met 'voormalig Joegoslavië' — de oorlogsjaren zijn recent en persoonlijk, en de Kroatische identiteit wordt apart gehouden.",
      fr: "En Croatie, n'amalgamez jamais le pays à « l'ex-Yougoslavie » — les années de guerre sont récentes et personnelles, et l'identité croate est tenue à part.",
      es: "En Croacia, nunca metas al país en el saco de la «antigua Yugoslavia» — los años de guerra son recientes y personales, y la identidad croata se sostiene aparte.",
    },
  }),
  row({
    region_code: "HR", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Firm Handshake, Steady Eye",
    rule_raw: "Croatians greet with a firm handshake and direct eye contact.",
    rule_cc: "A Croatian greeting is a firm handshake with steady eye contact — limp grip or wandering gaze reads as evasive, not modest.",
    source_book: "ME", source_page: "440", urgency: 2,
    i18n: {
      nl: "Een Kroatische begroeting is een stevige handdruk met rustig oogcontact — een slappe greep of dwalende blik wordt opgevat als ontwijkend, niet bescheiden.",
      fr: "Un salut croate est une poignée de main ferme avec un regard direct — une main molle ou un regard fuyant se lit comme évasif, non comme modeste.",
    },
  }),
  row({
    region_code: "HR", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Rakija to Open",
    rule_raw: "A small rakija opens Croatian visits; refusing is awkward unless you give a reason.",
    rule_cc: "A small glass of rakija opens Croatian hospitality — accept the first pour and sip slowly; declining without a clear reason puts a chill on the welcome.",
    source_book: "CM", source_page: "748", urgency: 2,
    i18n: {
      nl: "Een klein glaasje rakija opent Kroatische gastvrijheid — aanvaard de eerste schenking en nip langzaam; weigeren zonder duidelijke reden bekoelt het welkom.",
      fr: "Un petit verre de rakija ouvre l'hospitalité croate — acceptez la première mesure et sirotez lentement ; refuser sans raison claire refroidit l'accueil.",
    },
  }),
  row({
    region_code: "HR", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Gospodin and Gospođa",
    rule_raw: "Use Gospodin/Gospođa with surname for Croatian business introductions.",
    rule_cc: "In Croatian business, use Gospodin or Gospođa with the surname until first names are offered — earlier familiarity reads as forward, not friendly.",
    source_book: "DN", source_page: "452", urgency: 2,
    i18n: {
      nl: "Gebruik in het Kroatische zakenleven Gospodin of Gospođa met de achternaam tot voornamen worden aangeboden — eerdere familiariteit komt vooruitstrevend over, niet vriendelijk.",
      fr: "Dans les affaires croates, utilisez Gospodin ou Gospođa avec le nom de famille jusqu'à ce qu'on vous propose les prénoms — une familiarité précoce paraît présomptueuse, non amicale.",
    },
  }),
  row({
    region_code: "HR", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Coastal Polish",
    rule_raw: "Croatian coastal towns dress with Mediterranean polish; beachwear stays at the beach.",
    rule_cc: "In Croatia, beachwear leaves the beach — Hvar and Dubrovnik dress with Mediterranean polish, and bikinis or bare chests in restaurants are quietly refused.",
    source_book: "ME", source_page: "446", urgency: 2,
    i18n: {
      nl: "In Kroatië blijft strandkleding op het strand — Hvar en Dubrovnik kleden zich met mediterrane verzorging, en bikini's of blote bovenlichamen in restaurants worden stilletjes geweigerd.",
      fr: "En Croatie, la tenue de plage reste à la plage — Hvar et Dubrovnik s'habillent avec un soin méditerranéen, et bikinis ou torses nus au restaurant sont discrètement refusés.",
    },
  }),

  // ── ROMANIA ────────────────────────────────────────────────────────────────
  row({
    region_code: "RO", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Orthodox Holy Days",
    rule_raw: "Romanian Orthodox holidays — Easter especially — pause normal life.",
    rule_cc: "In Romania, Orthodox Easter and major saints' days quiet the country — schedule no business, accept invitations to home celebration as honour, and bring a small gift.",
    source_book: "CM", source_page: "768", urgency: 2,
    i18n: {
      nl: "In Roemenië maken orthodox Pasen en grote heiligendagen het land stiller — plan geen zaken, ervaar uitnodigingen thuis als eer en breng een klein geschenk mee.",
      fr: "En Roumanie, Pâques orthodoxe et les grandes fêtes des saints font taire le pays — ne planifiez pas d'affaires, recevez les invitations à domicile comme un honneur et apportez un petit présent.",
    },
  }),
  row({
    region_code: "RO", pillar_code: "Z2", subcategory: "topics_to_avoid",
    rule_type: "CC: Ceaușescu and the Roma",
    rule_raw: "Casual jokes about Ceaușescu or the Roma minority are deeply unwelcome in Romania.",
    rule_cc: "In Romania, casual jokes about the Ceaușescu years or the Roma minority land badly — both touch wounds the country still works through; let Romanians lead any such conversation.",
    source_book: "CM", source_page: "774", urgency: 3,
    i18n: {
      nl: "In Roemenië landen losse grappen over de Ceaușescu-jaren of de Roma-minderheid slecht — beide raken wonden waar het land nog mee bezig is; laat Roemenen zo'n gesprek leiden.",
      fr: "En Roumanie, les plaisanteries faciles sur l'ère Ceaușescu ou la minorité rom tombent mal — toutes deux touchent des plaies encore vives ; laissez les Roumains mener ce type de conversation.",
      es: "En Rumanía, las bromas fáciles sobre los años de Ceaușescu o la minoría romaní caen mal — ambas tocan heridas que el país todavía elabora; deja que los rumanos lleven esa conversación.",
    },
  }),
  row({
    region_code: "RO", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Țuică Toast",
    rule_raw: "Țuică opens Romanian meals; toast 'Noroc' with eye contact.",
    rule_cc: "Romanian meals open with țuică and the toast 'Noroc' — meet eyes around the table, sip rather than down it, and never refuse the first glass without reason.",
    source_book: "CM", source_page: "780", urgency: 2,
    i18n: {
      nl: "Roemeense maaltijden openen met țuică en de toost 'Noroc' — maak oogcontact rond de tafel, nip in plaats van leegdrinken en weiger het eerste glas niet zonder reden.",
      fr: "Les repas roumains s'ouvrent par la țuică et le toast « Noroc » — croisez les regards autour de la table, sirotez plutôt que de la cul-secher, et ne refusez pas le premier verre sans raison.",
    },
  }),
  row({
    region_code: "RO", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Domnul and Doamna",
    rule_raw: "Use Domnul/Doamna with surname for Romanian formal address.",
    rule_cc: "In Romanian business and formal life, address counterparts as Domnul or Doamna with the surname — moving to first names early is read as overstep.",
    source_book: "DN", source_page: "464", urgency: 2,
    i18n: {
      nl: "Spreek tegenhangers in het Roemeense zakenleven en in formele kringen aan met Domnul of Doamna en de achternaam — vroeg overgaan op voornamen wordt opgevat als grensoverschrijding.",
      fr: "Dans les affaires et la vie formelle roumaines, adressez-vous aux interlocuteurs avec Domnul ou Doamna suivi du nom de famille — passer trop tôt aux prénoms paraît présomptueux.",
    },
  }),
  row({
    region_code: "RO", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Bucharest Polished",
    rule_raw: "Bucharest dresses up for restaurants and theatre; sloppy attire is noticed.",
    rule_cc: "In Bucharest, restaurants and theatre invite real dress — pressed shirt, blazer, polished shoes; arriving in jeans and trainers marks you as out of place.",
    source_book: "ME", source_page: "458", urgency: 2,
    i18n: {
      nl: "In Boekarest vragen restaurants en theater om echte kleding — gestreken hemd, blazer, gepoetste schoenen; in jeans en sneakers verschijnen markeert u als misplaatst.",
      fr: "À Bucarest, restaurants et théâtres appellent une vraie tenue — chemise repassée, blazer, chaussures cirées ; arriver en jean et baskets vous désigne comme déplacé.",
    },
  }),

  // ── ESTONIA ────────────────────────────────────────────────────────────────
  row({
    region_code: "EE", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Don't Call Them Russian",
    rule_raw: "Estonians are not Russian and resent the conflation.",
    rule_cc: "In Estonia, never confuse Estonians with Russians — language, history, and identity are distinct, and the slip is felt as both ignorance and insult.",
    source_book: "CM", source_page: "798", urgency: 3,
    i18n: {
      nl: "Verwar in Estland Esten nooit met Russen — taal, geschiedenis en identiteit zijn onderscheiden, en de vergissing wordt gevoeld als onwetendheid én belediging.",
      fr: "En Estonie, ne confondez jamais Estoniens et Russes — langue, histoire et identité sont distinctes, et la confusion est ressentie comme ignorance et insulte.",
      es: "En Estonia, nunca confundas a los estonios con rusos — lengua, historia e identidad son distintas, y el desliz se vive como ignorancia e insulto.",
    },
  }),
  row({
    region_code: "EE", pillar_code: "Z2", subcategory: "nonverbal_style",
    rule_type: "CC: Silence is Welcome",
    rule_raw: "Estonians prize silence and meaningful pauses over filler talk.",
    rule_cc: "In Estonia, silence is not awkwardness — it is consideration; resist the impulse to fill every gap, and let your Estonian counterpart finish thinking before you speak.",
    source_book: "CM", source_page: "804", urgency: 2,
    i18n: {
      nl: "In Estland is stilte geen ongemak — het is overdenking; weersta de neiging elke pauze te vullen en laat uw Estse gesprekspartner uitdenken voordat u spreekt.",
      fr: "En Estonie, le silence n'est pas gêne — c'est réflexion ; résistez à l'envie de combler chaque blanc et laissez votre interlocuteur estonien finir de penser avant de parler.",
    },
  }),
  row({
    region_code: "EE", pillar_code: "Z3", subcategory: "table_posture",
    rule_type: "CC: Sauna Then Supper",
    rule_raw: "An Estonian sauna invitation is hospitality; eating follows the steam.",
    rule_cc: "An Estonian invitation to the sauna is real hospitality — accept it, leave swimwear at the door if your host does, and take supper afterwards as part of the same evening.",
    source_book: "CM", source_page: "810", urgency: 2,
    i18n: {
      nl: "Een Estse sauna-uitnodiging is echte gastvrijheid — aanvaard die, laat de zwemkleding bij de deur als uw gastheer dat doet, en zie het diner erna als deel van dezelfde avond.",
      fr: "Une invitation au sauna en Estonie est une vraie hospitalité — acceptez-la, laissez le maillot à la porte si votre hôte le fait, et prenez le dîner ensuite comme partie de la même soirée.",
    },
  }),
  row({
    region_code: "EE", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Punctual to the Minute",
    rule_raw: "Estonian business meetings start exactly on time.",
    rule_cc: "In Estonian business, meetings begin on the minute and end on time — being five minutes late costs trust that warm apology will not recover.",
    source_book: "ME", source_page: "468", urgency: 2,
    i18n: {
      nl: "In het Estse zakenleven beginnen vergaderingen op de minuut en eindigen ze op tijd — vijf minuten te laat kost vertrouwen dat een warme verontschuldiging niet herwint.",
      fr: "Dans les affaires estoniennes, les réunions commencent à la minute et finissent à l'heure — cinq minutes de retard coûtent une confiance que des excuses chaleureuses ne rattraperont pas.",
    },
  }),
  row({
    region_code: "EE", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Quiet Nordic Cut",
    rule_raw: "Estonian business dress is restrained and Nordic in feel.",
    rule_cc: "Estonian business dresses with Nordic restraint — dark suits, plain shirts, minimal jewellery; loud patterns or visible labels read as un-serious.",
    source_book: "ME", source_page: "474", urgency: 2,
    i18n: {
      nl: "Het Estse zakenleven kleedt zich met Noordse terughoudendheid — donkere pakken, effen overhemden, weinig sieraden; luide patronen of zichtbare labels worden opgevat als onserieus.",
      fr: "Les affaires estoniennes s'habillent avec retenue nordique — costumes sombres, chemises unies, peu de bijoux ; motifs voyants ou logos visibles paraissent peu sérieux.",
    },
  }),

  // ── SLOVENIA ───────────────────────────────────────────────────────────────
  row({
    region_code: "SI", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Not the Balkans",
    rule_raw: "Slovenes consider themselves Central European, not Balkan; do not confuse the two.",
    rule_cc: "In Slovenia, frame the country as Central European — Slovenes resist the Balkan label, and the careless visitor pays for it in cooled rooms.",
    source_book: "CM", source_page: "826", urgency: 2,
    i18n: {
      nl: "Plaats Slovenië in Midden-Europa — Slovenen verzetten zich tegen het Balkan-label, en de onachtzame bezoeker betaalt ervoor met bekoelde ruimtes.",
      fr: "En Slovénie, situez le pays en Europe centrale — les Slovènes refusent l'étiquette balkanique, et le visiteur négligent le paye en pièces refroidies.",
    },
  }),
  row({
    region_code: "SI", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Quiet Competence",
    rule_raw: "Slovenes prize quiet competence and dislike showy self-promotion.",
    rule_cc: "In Slovenia, competence is shown by doing, not announcing — long résumés rolled out at lunch jar, while a brief, accurate answer wins the room.",
    source_book: "CM", source_page: "832", urgency: 2,
    i18n: {
      nl: "In Slovenië toont men competentie door te doen, niet door te verkondigen — lange cv's bij de lunch schuren, terwijl een kort en correct antwoord de ruimte wint.",
      fr: "En Slovénie, la compétence se prouve par les actes, non par l'annonce — un long CV déroulé au déjeuner détonne, tandis qu'une réponse brève et juste emporte la pièce.",
    },
  }),
  row({
    region_code: "SI", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Slovene Wine Deserves Notice",
    rule_raw: "Slovene wines are a point of national pride; engage with the bottle.",
    rule_cc: "Slovene wines carry quiet national pride — ask about the region or grape, and let the host explain; treating the bottle as background is felt as inattention.",
    source_book: "CM", source_page: "838", urgency: 2,
    i18n: {
      nl: "Sloveense wijnen dragen stille nationale trots — vraag naar de streek of druif en laat de gastheer uitleggen; de fles als achtergrond behandelen wordt als onoplettendheid gevoeld.",
      fr: "Les vins slovènes portent une fierté nationale discrète — questionnez sur la région ou le cépage et laissez l'hôte expliquer ; traiter la bouteille comme un décor passe pour de l'inattention.",
    },
  }),
  row({
    region_code: "SI", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Gospod and Gospa",
    rule_raw: "Slovene formal address uses Gospod/Gospa with surname.",
    rule_cc: "In Slovene business, address counterparts as Gospod or Gospa with the surname; the move to first names belongs to the host, not the guest.",
    source_book: "DN", source_page: "476", urgency: 2,
    i18n: {
      nl: "Spreek tegenhangers in het Sloveense zakenleven aan met Gospod of Gospa met de achternaam; overgaan op voornamen is aan de gastheer, niet aan de gast.",
      fr: "Dans les affaires slovènes, adressez-vous aux interlocuteurs avec Gospod ou Gospa suivi du nom — passer aux prénoms revient à l'hôte, non à l'invité.",
    },
  }),
  row({
    region_code: "SI", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Restrained Central European",
    rule_raw: "Slovene business dress mirrors Austrian and Bavarian restraint.",
    rule_cc: "Slovene business dress mirrors Vienna more than Milan — dark suit, conservative tie, polished leather shoes; bright accessories read as un-serious.",
    source_book: "ME", source_page: "482", urgency: 2,
    i18n: {
      nl: "Sloveense zakenkleding spiegelt eerder Wenen dan Milaan — donker pak, ingehouden das, gepoetste leren schoenen; felle accessoires worden opgevat als onserieus.",
      fr: "La tenue d'affaires slovène ressemble plus à Vienne qu'à Milan — costume sombre, cravate sobre, chaussures de cuir cirées ; les accessoires voyants paraissent peu sérieux.",
    },
  }),

  // ── MALTA ──────────────────────────────────────────────────────────────────
  row({
    region_code: "MT", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Catholic Calendar Rules",
    rule_raw: "Catholic feast days organise Maltese village life and shut shops.",
    rule_cc: "In Malta, the Catholic calendar still organises life — feast days close shops and crowd parish squares; expect, and respect, the rhythm.",
    source_book: "CM", source_page: "854", urgency: 2,
    i18n: {
      nl: "Op Malta organiseert de katholieke kalender nog steeds het leven — feestdagen sluiten winkels en vullen parochiepleinen; verwacht en respecteer dat ritme.",
      fr: "À Malte, le calendrier catholique organise encore la vie — les fêtes ferment les boutiques et remplissent les parvis ; attendez-vous-y, et respectez le rythme.",
    },
  }),
  row({
    region_code: "MT", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Maltese and English Mix",
    rule_raw: "Maltese conversation slides between Maltese and English; either is welcome.",
    rule_cc: "In Malta, conversation slides between Maltese and English mid-sentence — meet your host in either language; insisting on one alone reads as stiff.",
    source_book: "CM", source_page: "860", urgency: 2,
    i18n: {
      nl: "Op Malta glijden gesprekken middenin de zin tussen Maltees en Engels door — beantwoord uw gastheer in beide; vasthouden aan één taal komt stijf over.",
      fr: "À Malte, la conversation glisse en milieu de phrase entre maltais et anglais — répondez à votre hôte dans l'une ou l'autre ; insister sur une seule paraît raide.",
    },
  }),
  row({
    region_code: "MT", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Long Sunday Lunch",
    rule_raw: "Sunday lunch in Malta is a long family ritual; departing early is awkward.",
    rule_cc: "A Maltese Sunday lunch is family time stretched across hours — accept the invitation only if you can stay; slipping away after the main course is read as cold.",
    source_book: "CM", source_page: "866", urgency: 2,
    i18n: {
      nl: "Een Maltese zondaglunch is familietijd die zich over uren uitstrekt — aanvaard de uitnodiging alleen als u kunt blijven; na het hoofdgerecht wegglippen wordt als koud opgevat.",
      fr: "Un déjeuner dominical maltais est un moment familial qui s'étire sur des heures — n'acceptez l'invitation que si vous pouvez rester ; filer après le plat principal passe pour froid.",
    },
  }),
  row({
    region_code: "MT", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Address by Profession",
    rule_raw: "Maltese use professional titles — Avukat, Perit, Tabib — in address.",
    rule_cc: "In Malta, address professionals by title — Avukat for lawyer, Perit for architect, Tabib for doctor — followed by surname; the courtesy is small but observed.",
    source_book: "DN", source_page: "488", urgency: 2,
    i18n: {
      nl: "Spreek Maltese vakgenoten aan met titel — Avukat voor advocaat, Perit voor architect, Tabib voor arts — gevolgd door de achternaam; de hoffelijkheid is klein maar opgemerkt.",
      fr: "À Malte, adressez-vous aux professionnels par leur titre — Avukat pour l'avocat, Perit pour l'architecte, Tabib pour le médecin — suivi du nom ; la courtoisie est discrète mais notée.",
    },
  }),
  row({
    region_code: "MT", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Cover for the Church",
    rule_raw: "Maltese churches require shoulders and knees covered for entry.",
    rule_cc: "Entering a Maltese church, shoulders and knees stay covered — for both sexes, for tourists and worshippers alike; a wrap kept in the bag saves the visit.",
    source_book: "CM", source_page: "872", urgency: 3,
    i18n: {
      nl: "Bij het betreden van een Maltese kerk blijven schouders en knieën bedekt — voor beide geslachten, voor toeristen en gelovigen; een omslagdoek in de tas redt het bezoek.",
      fr: "En entrant dans une église maltaise, épaules et genoux restent couverts — pour les deux sexes, touristes comme fidèles ; un châle dans le sac sauve la visite.",
      es: "Al entrar en una iglesia maltesa, hombros y rodillas permanecen cubiertos — ambos sexos, turistas y fieles por igual; un pañuelo en el bolso salva la visita.",
    },
  }),

  // ── SRI LANKA ──────────────────────────────────────────────────────────────
  row({
    region_code: "LK", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Buddha Image Reverence",
    rule_raw: "Posing with or beside Buddha images for selfies is illegal and offensive in Sri Lanka.",
    rule_cc: "In Sri Lanka, never turn your back to a Buddha image for a photograph, and never tattoo or wear one casually — both have caused arrests, and both are felt as desecration.",
    source_book: "CM", source_page: "888", urgency: 3,
    i18n: {
      nl: "Keer in Sri Lanka nooit een Boeddhabeeld de rug toe voor een foto, en draag of tatoeëer er nooit lichtzinnig een — beide hebben tot aanhoudingen geleid en worden als heiligschennis gevoeld.",
      fr: "Au Sri Lanka, ne tournez jamais le dos à une image du Bouddha pour une photo, et ne la tatouez ni ne la portez à la légère — les deux ont conduit à des arrestations et sont vécus comme une profanation.",
      es: "En Sri Lanka, nunca des la espalda a una imagen del Buda para una foto, ni la lleves o tatúes con ligereza — ambas conductas han causado detenciones y se viven como profanación.",
    },
  }),
  row({
    region_code: "LK", pillar_code: "Z2", subcategory: "nonverbal_style",
    rule_type: "CC: The Sri Lankan Head Wobble",
    rule_raw: "A side-to-side head movement in Sri Lanka means yes or acknowledgement.",
    rule_cc: "In Sri Lanka, a soft side-to-side wobble of the head means 'yes', 'I hear you', or 'go on' — read it as agreement, not hesitation.",
    source_book: "CM", source_page: "894", urgency: 2,
    i18n: {
      nl: "In Sri Lanka betekent een zacht heen-en-weer wiebelen van het hoofd 'ja', 'ik hoor u' of 'ga door' — lees het als instemming, niet als aarzeling.",
      fr: "Au Sri Lanka, un léger balancement latéral de la tête signifie « oui », « je t'écoute » ou « continue » — lisez-le comme un accord, non comme une hésitation.",
    },
  }),
  row({
    region_code: "LK", pillar_code: "Z3", subcategory: "consumption_sounds",
    rule_type: "CC: Rice and Curry by Hand",
    rule_raw: "Sri Lankan rice and curry is eaten with the right hand; cutlery is for show.",
    rule_cc: "At a Sri Lankan table, rice and curry are mixed and eaten with the right hand — cutlery is offered for the foreign guest but quietly noted; following the host wins the room.",
    source_book: "CM", source_page: "900", urgency: 2,
    i18n: {
      nl: "Aan een Sri Lankaanse tafel worden rijst en curry met de rechterhand gemengd en gegeten — bestek wordt aangeboden aan de buitenlandse gast maar stil opgemerkt; uw gastheer volgen wint de ruimte.",
      fr: "À une table sri-lankaise, riz et curry se mélangent et se mangent de la main droite — les couverts sont offerts à l'invité étranger mais discrètement notés ; suivre l'hôte gagne la pièce.",
    },
  }),
  row({
    region_code: "LK", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Bow to the Monk",
    rule_raw: "Buddhist monks in Sri Lanka receive automatic deference; never offer a hand first.",
    rule_cc: "Meeting a Buddhist monk in Sri Lanka, bow with palms together — never extend a hand, and women never touch a monk or pass anything directly into his hand.",
    source_book: "DN", source_page: "498", urgency: 3,
    i18n: {
      nl: "Bij het ontmoeten van een boeddhistische monnik in Sri Lanka buigt u met de handpalmen samen — steek nooit een hand uit, en vrouwen raken een monnik nooit aan en geven niets rechtstreeks in zijn hand.",
      fr: "En rencontrant un moine bouddhiste au Sri Lanka, inclinez-vous paumes jointes — ne tendez jamais la main, et les femmes ne touchent jamais un moine ni ne lui remettent rien directement.",
      es: "Al encontrar a un monje budista en Sri Lanka, inclínate con las palmas juntas — nunca extiendas la mano, y las mujeres nunca tocan a un monje ni le entregan nada directamente.",
    },
  }),
  row({
    region_code: "LK", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: White for the Temple",
    rule_raw: "White, modest clothing is correct for Sri Lankan Buddhist temples.",
    rule_cc: "For a Sri Lankan Buddhist temple, wear white or muted clothing covering shoulders and knees — leave shoes and hat at the door, and remove headphones before entering.",
    source_book: "CM", source_page: "906", urgency: 2,
    i18n: {
      nl: "Voor een Sri Lankaanse boeddhistische tempel draagt u witte of gedempte kleding die schouders en knieën bedekt — laat schoenen en hoed bij de deur en zet koptelefoons af voor het betreden.",
      fr: "Pour un temple bouddhiste sri-lankais, portez des vêtements blancs ou sobres couvrant épaules et genoux — laissez chaussures et chapeau à la porte et retirez le casque avant d'entrer.",
    },
  }),

  // ── CAMBODIA ───────────────────────────────────────────────────────────────
  row({
    region_code: "KH", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Khmer Rouge Stays Off Casual Talk",
    rule_raw: "The Khmer Rouge era touched every Cambodian family; never raise it lightly.",
    rule_cc: "In Cambodia, never raise the Khmer Rouge years as small talk — the period touched every family, and it is for Cambodians to open the subject, not for visitors to.",
    source_book: "CM", source_page: "924", urgency: 3,
    i18n: {
      nl: "Breng in Cambodja de Rode Khmer-jaren nooit aan als smalltalk — de periode raakte elke familie, en het is aan Cambodjanen om het onderwerp te openen, niet aan bezoekers.",
      fr: "Au Cambodge, n'évoquez jamais les années des Khmers rouges en bavardage — la période a touché chaque famille, et c'est aux Cambodgiens d'ouvrir le sujet, non aux visiteurs.",
      es: "En Camboya, nunca traigas los años de los Jemeres Rojos como charla ligera — el periodo tocó a todas las familias, y abrirlo corresponde a los camboyanos, no a los visitantes.",
    },
  }),
  row({
    region_code: "KH", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Sampeah by Status",
    rule_raw: "The sampeah greeting in Cambodia raises hand height with the status of the recipient.",
    rule_cc: "In Cambodia, the sampeah greeting is met by raising joined palms — chest height for peers, mouth height for elders, brow height for monks; mismatch reads as carelessness.",
    source_book: "CM", source_page: "930", urgency: 3,
    i18n: {
      nl: "In Cambodja beantwoordt men de sampeah-groet met samengevouwen handpalmen — borsthoogte voor gelijken, monden voor ouderen, voorhoofd voor monniken; afwijking wordt opgevat als slordigheid.",
      fr: "Au Cambodge, le sampeah se rend en joignant les paumes — à hauteur de poitrine pour les pairs, de bouche pour les aînés, de front pour les moines ; un décalage passe pour de l'inattention.",
      es: "En Camboya, el sampeah se devuelve uniendo las palmas — a la altura del pecho para iguales, de la boca para mayores, de la frente para monjes; el desajuste se lee como descuido.",
    },
  }),
  row({
    region_code: "KH", pillar_code: "Z3", subcategory: "table_posture",
    rule_type: "CC: Wait for the Eldest",
    rule_raw: "Cambodian meals begin only when the eldest takes the first bite.",
    rule_cc: "At a Cambodian table, do not lift a spoon until the eldest at the table has taken the first bite — beginning early reads as hunger placed above respect.",
    source_book: "CM", source_page: "936", urgency: 2,
    i18n: {
      nl: "Aan een Cambodjaanse tafel pakt u pas een lepel als de oudste de eerste hap heeft genomen — eerder beginnen wordt opgevat als honger boven respect.",
      fr: "À une table cambodgienne, ne soulevez la cuillère qu'après que l'aîné a pris la première bouchée — commencer plus tôt passe pour la faim placée au-dessus du respect.",
    },
  }),
  row({
    region_code: "KH", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Lok and Lok Srey",
    rule_raw: "Lok and Lok Srey are formal Cambodian honorifics for senior men and women.",
    rule_cc: "Address senior Cambodians as Lok or Lok Srey followed by the first name — the title precedes the given name and signals due respect.",
    source_book: "DN", source_page: "510", urgency: 2,
    i18n: {
      nl: "Spreek hooggeplaatste Cambodjanen aan met Lok of Lok Srey gevolgd door de voornaam — de titel gaat voor de voornaam en toont gepast respect.",
      fr: "Adressez-vous aux Cambodgiens d'un certain rang avec Lok ou Lok Srey suivi du prénom — le titre précède le prénom et marque le respect dû.",
    },
  }),
  row({
    region_code: "KH", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Angkor Cover-Up",
    rule_raw: "Angkor and active temples require shoulders and knees covered.",
    rule_cc: "At Angkor and active Cambodian temples, shoulders and knees stay covered — sleeveless tops and shorts above the knee are turned away at the gate.",
    source_book: "CM", source_page: "942", urgency: 3,
    i18n: {
      nl: "Bij Angkor en actieve Cambodjaanse tempels blijven schouders en knieën bedekt — mouwloze tops en korte broeken boven de knie worden bij de poort geweigerd.",
      fr: "À Angkor et dans les temples actifs au Cambodge, épaules et genoux restent couverts — débardeurs et shorts au-dessus du genou sont refoulés à l'entrée.",
      es: "En Angkor y en los templos activos camboyanos, hombros y rodillas permanecen cubiertos — tirantes y pantalones por encima de la rodilla se rechazan en la puerta.",
    },
  }),

  // ── MALDIVES ───────────────────────────────────────────────────────────────
  row({
    region_code: "MV", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Sunni Muslim Republic",
    rule_raw: "The Maldives is a Sunni Muslim republic; non-Islamic religious display is forbidden.",
    rule_cc: "Outside resort islands, the Maldives is a Sunni Muslim republic — non-Islamic religious symbols, alcohol in public, and pork are all forbidden by law, not custom.",
    source_book: "CM", source_page: "958", urgency: 3,
    i18n: {
      nl: "Buiten de resortseilanden is de Maldiven een soennitisch-islamitische republiek — niet-islamitische religieuze symbolen, alcohol in het openbaar en varkensvlees zijn bij wet verboden, niet enkel door gewoonte.",
      fr: "Hors des îles-resorts, les Maldives sont une république sunnite — symboles religieux non islamiques, alcool en public et porc y sont interdits par la loi, non par la coutume.",
      es: "Fuera de las islas-resort, las Maldivas son una república suní — los símbolos religiosos no islámicos, el alcohol en público y la carne de cerdo están prohibidos por ley, no por costumbre.",
    },
  }),
  row({
    region_code: "MV", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: As-salaam Alaikum",
    rule_raw: "The Maldivian greeting is the Muslim 'As-salaam alaikum'.",
    rule_cc: "In the Maldives, greet with 'As-salaam alaikum' and wait for the response 'Wa-alaikum salaam' — secular greetings work in resorts but feel thin on inhabited islands.",
    source_book: "ME", source_page: "498", urgency: 2,
    i18n: {
      nl: "Begroet op de Maldiven met 'As-salaam alaikum' en wacht op het antwoord 'Wa-alaikum salaam' — seculiere begroetingen werken in resorts maar voelen schraal op bewoonde eilanden.",
      fr: "Aux Maldives, saluez par « As-salaam alaikum » et attendez la réponse « Wa-alaikum salaam » — les salutations laïques passent dans les resorts mais paraissent fades sur les îles habitées.",
    },
  }),
  row({
    region_code: "MV", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Alcohol Stays in the Resort",
    rule_raw: "Alcohol is legal only on resort islands and a few licensed venues in Malé.",
    rule_cc: "In the Maldives, alcohol stays inside the resort or licensed hotel — carrying it onto local islands or even through the airport in the wrong bag risks confiscation and worse.",
    source_book: "CM", source_page: "964", urgency: 3,
    i18n: {
      nl: "Op de Maldiven blijft alcohol binnen het resort of vergunde hotel — het meenemen naar lokale eilanden of zelfs door de luchthaven in de verkeerde tas riskeert inbeslagname en erger.",
      fr: "Aux Maldives, l'alcool reste dans le resort ou l'hôtel agréé — l'emporter sur une île locale ou même à travers l'aéroport dans le mauvais bagage expose à confiscation et pire.",
      es: "En las Maldivas, el alcohol permanece dentro del resort u hotel licenciado — llevarlo a islas locales o incluso por el aeropuerto en la maleta equivocada arriesga confiscación y peor.",
    },
  }),
  row({
    region_code: "MV", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: First-Name Plus Bey",
    rule_raw: "Maldivians often use first names with the suffix 'Bey' or 'Manje' for respect.",
    rule_cc: "In the Maldives, the polite address is the first name with 'Bey' for men or 'Manje' for women appended — bare first names are reserved for friends.",
    source_book: "DN", source_page: "522", urgency: 2,
    i18n: {
      nl: "Op de Maldiven is de beleefde aanspraak de voornaam met 'Bey' voor mannen of 'Manje' voor vrouwen erbij — kale voornamen blijven voor vrienden.",
      fr: "Aux Maldives, l'adresse polie est le prénom suivi de « Bey » pour les hommes ou « Manje » pour les femmes — le prénom seul reste pour les amis.",
    },
  }),
  row({
    region_code: "MV", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Cover Off the Resort",
    rule_raw: "Outside resorts, Maldivian dress codes require shoulders, knees and chest covered.",
    rule_cc: "Stepping off the resort in the Maldives, both sexes cover shoulders, chest, and knees — bikinis belong to the bikini beach only, signposted on each inhabited island.",
    source_book: "CM", source_page: "970", urgency: 3,
    i18n: {
      nl: "Bij het verlaten van het resort op de Maldiven bedekken beide geslachten schouders, borst en knieën — bikini's horen alleen op het aangeduide bikinistrand op elk bewoond eiland.",
      fr: "En quittant le resort aux Maldives, les deux sexes couvrent épaules, poitrine et genoux — les bikinis se réservent à la plage bikini signalée sur chaque île habitée.",
      es: "Al salir del resort en las Maldivas, ambos sexos cubren hombros, pecho y rodillas — los bikinis quedan solo para la playa bikini señalizada en cada isla habitada.",
    },
  }),

  // ── NEPAL ──────────────────────────────────────────────────────────────────
  row({
    region_code: "NP", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Hindu and Buddhist Sites",
    rule_raw: "Nepali Hindu temples often forbid non-Hindu entry; Buddhist sites are open.",
    rule_cc: "In Nepal, many Hindu temples — Pashupatinath above all — are closed to non-Hindus; Buddhist stupas welcome all, but always circle them clockwise.",
    source_book: "CM", source_page: "986", urgency: 3,
    i18n: {
      nl: "In Nepal zijn veel hindoetempels — vooral Pashupatinath — gesloten voor niet-hindoes; boeddhistische stoepa's verwelkomen iedereen, maar omloop altijd met de klok mee.",
      fr: "Au Népal, de nombreux temples hindous — Pashupatinath surtout — sont fermés aux non-hindous ; les stupas bouddhistes accueillent tous, mais on les contourne toujours dans le sens des aiguilles d'une montre.",
      es: "En Nepal, muchos templos hindúes — sobre todo Pashupatinath — están cerrados a los no hindúes; las estupas budistas acogen a todos, pero siempre se rodean en el sentido de las agujas del reloj.",
    },
  }),
  row({
    region_code: "NP", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Namaste with Eyes Lowered",
    rule_raw: "The Nepali namaste joins palms at the chest with a slight bow.",
    rule_cc: "The Nepali greeting is namaste — palms joined at the chest, head dipped slightly; for elders, raise the joined palms higher and lower the eyes.",
    source_book: "CM", source_page: "992", urgency: 2,
    i18n: {
      nl: "De Nepalese begroeting is namaste — handpalmen samen voor de borst, hoofd licht gebogen; voor ouderen verhoogt u de samengevoegde handpalmen en slaat u de ogen neer.",
      fr: "Le salut népalais est le namaste — paumes jointes à la poitrine, tête légèrement inclinée ; pour les aînés, levez les paumes plus haut et baissez les yeux.",
    },
  }),
  row({
    region_code: "NP", pillar_code: "Z3", subcategory: "consumption_sounds",
    rule_type: "CC: Jutho — No Shared Plates",
    rule_raw: "Once food touches your lips or fingers it becomes jutho — polluted — and cannot be shared.",
    rule_cc: "In Nepal, food once touched by your fingers or lips becomes jutho and cannot be shared — never offer a half-eaten plate, and never sip from another's glass.",
    source_book: "CM", source_page: "998", urgency: 3,
    i18n: {
      nl: "In Nepal wordt voedsel dat uw vingers of lippen heeft geraakt jutho en kan niet worden gedeeld — bied nooit een halfgegeten bord aan en drink nooit uit het glas van een ander.",
      fr: "Au Népal, la nourriture touchée par vos doigts ou vos lèvres devient jutho et ne se partage pas — n'offrez jamais une assiette entamée et ne buvez jamais au verre d'autrui.",
      es: "En Nepal, la comida tocada por tus dedos o labios se vuelve jutho y no se comparte — nunca ofrezcas un plato a medias ni bebas del vaso de otro.",
    },
  }),
  row({
    region_code: "NP", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Touch No One's Head",
    rule_raw: "In Nepal the head is sacred; touching another's head is taboo.",
    rule_cc: "In Nepal, the head is sacred and the feet impure — never pat a child's head, never step over someone, and never point your soles at a person or shrine.",
    source_book: "CM", source_page: "1004", urgency: 3,
    i18n: {
      nl: "In Nepal is het hoofd heilig en zijn de voeten onrein — klop nooit een kind op het hoofd, stap nooit over iemand heen en richt uw zolen nooit op een persoon of altaar.",
      fr: "Au Népal, la tête est sacrée et les pieds impurs — ne tapotez jamais la tête d'un enfant, n'enjambez jamais quelqu'un et ne pointez jamais vos semelles vers une personne ou un sanctuaire.",
      es: "En Nepal, la cabeza es sagrada y los pies impuros — nunca palmees la cabeza de un niño, nunca pases por encima de alguien y nunca apuntes las suelas a una persona o santuario.",
    },
  }),
  row({
    region_code: "NP", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Trekking, Then Modesty",
    rule_raw: "In villages and temples, Nepali modesty norms expect covered shoulders and legs.",
    rule_cc: "Off the trail in Nepal, leave the trekking shorts behind — villages and temples expect covered shoulders and legs from both sexes; visible skin reads as ignorance.",
    source_book: "ME", source_page: "508", urgency: 2,
    i18n: {
      nl: "Buiten het pad in Nepal laat u de trekkingshorts achter — dorpen en tempels verwachten bedekte schouders en benen van beide geslachten; zichtbare huid wordt gelezen als onwetendheid.",
      fr: "Hors sentier au Népal, laissez les shorts de trek — villages et temples attendent épaules et jambes couvertes pour les deux sexes ; la peau visible se lit comme de l'ignorance.",
    },
  }),

  // ── BOTSWANA ───────────────────────────────────────────────────────────────
  row({
    region_code: "BW", pillar_code: "Z1", subcategory: "alternative_behavior",
    rule_type: "CC: Botho Threads All",
    rule_raw: "The Tswana ethic of botho — humanity through others — shapes Batswana life.",
    rule_cc: "In Botswana, botho — being human through others — is the cultural baseline; rudeness, impatience, and self-centred bearing are read as a deeper failing than mere bad manners.",
    source_book: "CM", source_page: "1018", urgency: 2,
    i18n: {
      nl: "In Botswana is botho — mens-zijn door anderen — de culturele basis; grofheid, ongeduld en egocentrisch gedrag worden opgevat als een dieper tekortschieten dan slechte manieren.",
      fr: "Au Botswana, le botho — être humain par les autres — est la norme culturelle ; grossièreté, impatience et attitude égocentrique se lisent comme une faille plus profonde que de simples mauvaises manières.",
    },
  }),
  row({
    region_code: "BW", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Dumela and the Pause",
    rule_raw: "Batswana greetings — Dumela rra/mma — pause for response before any business.",
    rule_cc: "In Botswana, every interaction opens with 'Dumela rra' or 'Dumela mma' — wait for the reply before any other word; jumping to business is felt as rudeness, not efficiency.",
    source_book: "CM", source_page: "1024", urgency: 2,
    i18n: {
      nl: "In Botswana opent elke interactie met 'Dumela rra' of 'Dumela mma' — wacht op het antwoord vóór enig ander woord; meteen op zaken overgaan wordt als grof gevoeld, niet als efficiënt.",
      fr: "Au Botswana, toute interaction s'ouvre par « Dumela rra » ou « Dumela mma » — attendez la réponse avant tout autre mot ; passer d'emblée aux affaires est ressenti comme grossier, non efficace.",
    },
  }),
  row({
    region_code: "BW", pillar_code: "Z3", subcategory: "table_posture",
    rule_type: "CC: Right-Hand Receiving",
    rule_raw: "Batswana receive food, drink, and gifts with the right hand, often supported by the left.",
    rule_cc: "In Botswana, accept food, drink, or gift with the right hand — the left supporting the right wrist signals extra respect; one-handed grabs jar.",
    source_book: "CM", source_page: "1030", urgency: 2,
    i18n: {
      nl: "In Botswana neemt u eten, drank of een geschenk aan met de rechterhand — de linkerhand die de rechter pols ondersteunt toont extra respect; eenhandig graaien schuurt.",
      fr: "Au Botswana, recevez nourriture, boisson ou cadeau de la main droite — la main gauche soutenant le poignet droit marque un respect supplémentaire ; les prises à une main détonnent.",
    },
  }),
  row({
    region_code: "BW", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Kgosi Speaks Last",
    rule_raw: "In a kgotla — village assembly — the chief listens before speaking.",
    rule_cc: "In a Tswana kgotla, the chief speaks only after every voice has been heard — speaking out of turn marks you as untaught, however senior elsewhere.",
    source_book: "DN", source_page: "534", urgency: 2,
    i18n: {
      nl: "In een Tswana-kgotla spreekt de chief pas nadat elke stem is gehoord — buiten uw beurt spreken markeert u als ongeschoold, hoe hooggeplaatst elders ook.",
      fr: "Dans un kgotla tswana, le chef ne parle qu'après que chaque voix a été entendue — parler hors de son tour vous désigne comme mal informé, quel que soit votre rang ailleurs.",
    },
  }),
  row({
    region_code: "BW", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Gaborone Conservative",
    rule_raw: "Gaborone business circles dress conservatively in dark suits.",
    rule_cc: "In Gaborone business, conservative dark suits and closed shoes are the norm — visible casual wear and bright colours read as not yet serious.",
    source_book: "ME", source_page: "518", urgency: 2,
    i18n: {
      nl: "In het Gaborone-zakenleven zijn ingehouden donkere pakken en gesloten schoenen de norm — zichtbare vrijetijdskleding en felle kleuren worden gelezen als nog niet serieus.",
      fr: "Dans les affaires à Gaborone, costumes sombres sobres et chaussures fermées sont la norme — vêtements décontractés visibles et couleurs vives se lisent comme pas encore sérieux.",
    },
  }),

  // ── RWANDA ─────────────────────────────────────────────────────────────────
  row({
    region_code: "RW", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Genocide Reverence",
    rule_raw: "The 1994 genocide is referenced with reverence; jokes are unthinkable.",
    rule_cc: "In Rwanda, the 1994 genocide is referenced only with reverence — never raise it as small talk, never use ethnic terms casually, and visit memorials in silence.",
    source_book: "CM", source_page: "1048", urgency: 3,
    i18n: {
      nl: "In Rwanda wordt de genocide van 1994 alleen met eerbied genoemd — breng het nooit aan als smalltalk, gebruik etnische termen nooit terloops en bezoek herdenkingsplaatsen in stilte.",
      fr: "Au Rwanda, le génocide de 1994 ne se mentionne qu'avec révérence — ne l'évoquez jamais en bavardage, n'utilisez jamais les termes ethniques à la légère et visitez les mémoriaux en silence.",
      es: "En Ruanda, el genocidio de 1994 se menciona solo con reverencia — nunca lo traigas como charla ligera, nunca uses términos étnicos a la ligera y visita los memoriales en silencio.",
    },
  }),
  row({
    region_code: "RW", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Composed Speech",
    rule_raw: "Rwandans favour composed, measured speech; loudness is read as crude.",
    rule_cc: "In Rwanda, composed and measured speech is the cultural standard — loud voices, broad jokes, and excessive gesture all jar in a country that has chosen dignity.",
    source_book: "CM", source_page: "1054", urgency: 2,
    i18n: {
      nl: "In Rwanda is rustige, afgemeten spraak de culturele standaard — luide stemmen, brede grappen en overdreven gebaren schuren in een land dat voor waardigheid heeft gekozen.",
      fr: "Au Rwanda, une parole posée et mesurée est la norme culturelle — voix fortes, plaisanteries larges et gestes excessifs détonnent dans un pays qui a choisi la dignité.",
    },
  }),
  row({
    region_code: "RW", pillar_code: "Z3", subcategory: "table_posture",
    rule_type: "CC: Right Hand Only",
    rule_raw: "Rwandans eat and pass food with the right hand only.",
    rule_cc: "At a Rwandan table, take food and pass dishes with the right hand alone — the left is reserved, and habits from elsewhere are noticed.",
    source_book: "CM", source_page: "1060", urgency: 2,
    i18n: {
      nl: "Aan een Rwandese tafel pakt u voedsel en geeft u schalen door met alleen de rechterhand — de linker is gereserveerd, en gewoonten van elders vallen op.",
      fr: "À une table rwandaise, prenez la nourriture et passez les plats de la seule main droite — la gauche est réservée, et les habitudes d'ailleurs se remarquent.",
    },
  }),
  row({
    region_code: "RW", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Address with Care",
    rule_raw: "Rwandans use formal address — Madame, Monsieur, or local equivalents — until invited to first names.",
    rule_cc: "In Rwanda, address counterparts as Madame or Monsieur with surname until first names are offered — moving early reads as rough, in a society that values polish.",
    source_book: "DN", source_page: "548", urgency: 2,
    i18n: {
      nl: "Spreek tegenhangers in Rwanda aan met Madame of Monsieur en de achternaam tot voornamen worden aangeboden — vroeg overgaan komt grof over in een samenleving die verfijning waardeert.",
      fr: "Au Rwanda, adressez-vous aux interlocuteurs avec Madame ou Monsieur suivi du nom jusqu'à ce que les prénoms soient offerts — passer tôt paraît rugueux dans une société qui valorise le poli.",
    },
  }),
  row({
    region_code: "RW", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Kigali Polished",
    rule_raw: "Kigali business circles dress with notable polish; sloppy attire underperforms.",
    rule_cc: "In Kigali business, polished dress signals seriousness — pressed suit, clean shoes, neat grooming; the city is famously orderly, and your turnout is read in that frame.",
    source_book: "ME", source_page: "528", urgency: 2,
    i18n: {
      nl: "In het Kigali-zakenleven signaleert verzorgde kleding ernst — gestreken pak, schone schoenen, nette verzorging; de stad staat bekend om haar orde, en uw verschijning wordt in dat kader gelezen.",
      fr: "Dans les affaires à Kigali, une tenue soignée signale le sérieux — costume repassé, chaussures propres, présentation nette ; la ville est célèbre pour son ordre, et votre allure se lit dans ce cadre.",
    },
  }),

  // ── MAURITIUS ──────────────────────────────────────────────────────────────
  row({
    region_code: "MU", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Many Faiths, One Calendar",
    rule_raw: "Mauritius observes Hindu, Christian, Muslim, and Tamil holidays together.",
    rule_cc: "In Mauritius, the calendar holds Hindu, Christian, Muslim, and Tamil festivals — wishing 'Happy Diwali', 'Joyeux Noël', or 'Eid Mubarak' to the right host opens the room.",
    source_book: "CM", source_page: "1078", urgency: 2,
    i18n: {
      nl: "In Mauritius bevat de kalender hindoe-, christelijke, islamitische en Tamil-festivals — 'Happy Diwali', 'Joyeux Noël' of 'Eid Mubarak' wensen aan de juiste gastheer opent de ruimte.",
      fr: "À Maurice, le calendrier rassemble fêtes hindoues, chrétiennes, musulmanes et tamoules — souhaiter « Happy Diwali », « Joyeux Noël » ou « Eid Mubarak » à l'hôte concerné ouvre la pièce.",
    },
  }),
  row({
    region_code: "MU", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: French, English, Creole Together",
    rule_raw: "Mauritian conversation moves between French, English, and Creole within sentences.",
    rule_cc: "In Mauritius, conversation slides between French, English, and Creole — meet your host wherever they land; insisting on one language alone reads as stiff.",
    source_book: "CM", source_page: "1084", urgency: 2,
    i18n: {
      nl: "In Mauritius glijdt het gesprek tussen Frans, Engels en Creools — beantwoord uw gastheer waar die uitkomt; vasthouden aan één taal komt stijf over.",
      fr: "À Maurice, la conversation glisse entre français, anglais et créole — répondez à l'hôte là où il atterrit ; insister sur une seule langue paraît raide.",
    },
  }),
  row({
    region_code: "MU", pillar_code: "Z3", subcategory: "table_posture",
    rule_type: "CC: Try Every Curry",
    rule_raw: "Mauritian meals offer many curries side by side; refusing a dish is awkward.",
    rule_cc: "At a Mauritian table, take a small portion of every curry on offer — declining a dish is read as a quiet rejection of the family that cooked it.",
    source_book: "CM", source_page: "1090", urgency: 2,
    i18n: {
      nl: "Aan een Mauritiaanse tafel neemt u een kleine portie van elke aangeboden curry — een gerecht weigeren wordt opgevat als een stille afwijzing van de familie die het kookte.",
      fr: "À une table mauricienne, prenez une petite part de chaque curry offert — refuser un plat se lit comme un rejet discret de la famille qui l'a cuisiné.",
    },
  }),
  row({
    region_code: "MU", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Quietly Egalitarian",
    rule_raw: "Mauritians are formally egalitarian; ostentatious title use feels out of place.",
    rule_cc: "Mauritians are quietly egalitarian — first names arrive easily, but business titles still anchor the introduction; mirror your host's lead between formal and warm.",
    source_book: "DN", source_page: "562", urgency: 2,
    i18n: {
      nl: "Mauritianen zijn stil egalitair — voornamen komen makkelijk, maar zakelijke titels verankeren nog steeds de kennismaking; spiegel het tempo van uw gastheer tussen formeel en warm.",
      fr: "Les Mauriciens sont discrètement égalitaires — les prénoms viennent vite, mais les titres professionnels ancrent encore la présentation ; calquez le rythme de l'hôte entre formel et chaleureux.",
    },
  }),
  row({
    region_code: "MU", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Linen Polish",
    rule_raw: "Mauritians dress smart-casual with island polish; sloppy beachwear in town is noticed.",
    rule_cc: "In Mauritius, beachwear stays at the beach — town and restaurant invite linen, pressed shirts, and dressed sandals; flip-flops and bare chests are quietly turned away.",
    source_book: "ME", source_page: "538", urgency: 2,
    i18n: {
      nl: "In Mauritius blijft strandkleding op het strand — stad en restaurant vragen om linnen, gestreken hemden en nette sandalen; slippers en blote bovenlichamen worden stilletjes geweerd.",
      fr: "À Maurice, la tenue de plage reste à la plage — la ville et le restaurant appellent lin, chemises repassées et sandales habillées ; tongs et torses nus sont discrètement refusés.",
    },
  }),

  // ── BULGARIA ───────────────────────────────────────────────────────────────
  row({
    region_code: "BG", pillar_code: "Z1", subcategory: "alternative_behavior",
    rule_type: "CC: Yes Nods Sideways",
    rule_raw: "Bulgarians nod side-to-side for yes and up-and-down for no.",
    rule_cc: "In Bulgaria, a nod side-to-side means yes and an up-and-down nod means no — listen to the spoken 'da' or 'ne' to be sure, especially in business.",
    source_book: "CM", source_page: "1108", urgency: 3,
    i18n: {
      nl: "In Bulgarije betekent een knik van links naar rechts ja en van boven naar beneden nee — luister naar het gesproken 'da' of 'ne' voor zekerheid, vooral zakelijk.",
      fr: "En Bulgarie, hocher la tête de gauche à droite signifie oui et de haut en bas signifie non — fiez-vous au « da » ou « ne » prononcé, surtout en affaires.",
      es: "En Bulgaria, mover la cabeza de lado a lado significa sí y de arriba abajo significa no — atiende al «da» o «ne» hablado para asegurarte, sobre todo en negocios.",
    },
  }),
  row({
    region_code: "BG", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Firm Handshake, Direct Look",
    rule_raw: "Bulgarians greet with a firm handshake and steady eye contact.",
    rule_cc: "Bulgarian greetings are firm handshakes with steady eye contact — soft grip or wandering gaze reads as evasive in a country that values directness.",
    source_book: "ME", source_page: "548", urgency: 2,
    i18n: {
      nl: "Bulgaarse begroetingen zijn stevige handdrukken met rustig oogcontact — een zachte greep of dwalende blik komt ontwijkend over in een land dat directheid waardeert.",
      fr: "Les saluts bulgares sont des poignées de main fermes avec un regard direct — une prise molle ou un regard fuyant paraît évasif dans un pays attaché à la franchise.",
    },
  }),
  row({
    region_code: "BG", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Rakia Opens",
    rule_raw: "Bulgarian meals open with rakia and a salad; toast 'Nazdrave'.",
    rule_cc: "In Bulgaria, meals open with rakia and shopska salad — toast 'Nazdrave' with eye contact, and never let the glass touch the table mid-toast.",
    source_book: "CM", source_page: "1114", urgency: 2,
    i18n: {
      nl: "In Bulgarije openen maaltijden met rakia en shopska-salade — toost 'Nazdrave' met oogcontact en laat het glas tijdens de toost nooit de tafel raken.",
      fr: "En Bulgarie, le repas s'ouvre par la rakia et la shopska — toastez « Nazdrave » avec un regard direct, et ne posez jamais le verre sur la table en pleine trinque.",
    },
  }),
  row({
    region_code: "BG", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Gospodin and Gospozha",
    rule_raw: "Bulgarian formal address uses Gospodin/Gospozha with surname.",
    rule_cc: "In Bulgarian business, address counterparts as Gospodin or Gospozha with the surname — moving to first names early reads as forward in a still-formal culture.",
    source_book: "DN", source_page: "574", urgency: 2,
    i18n: {
      nl: "Spreek tegenhangers in het Bulgaarse zakenleven aan met Gospodin of Gospozha en de achternaam — vroeg overgaan op voornamen komt vooruitstrevend over in een nog formele cultuur.",
      fr: "Dans les affaires bulgares, adressez-vous aux interlocuteurs par Gospodin ou Gospozha suivi du nom — passer tôt aux prénoms paraît présomptueux dans une culture encore formelle.",
    },
  }),
  row({
    region_code: "BG", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Sofia Sober",
    rule_raw: "Sofia business dresses in dark suits and quiet shirts.",
    rule_cc: "In Sofia business, sober dark suits, plain shirts, and polished shoes are expected — bright accessories or visible casualwear underperform in formal rooms.",
    source_book: "ME", source_page: "554", urgency: 2,
    i18n: {
      nl: "In het Sofia-zakenleven worden sobere donkere pakken, effen overhemden en gepoetste schoenen verwacht — felle accessoires of zichtbare vrijetijdskleding komen tekort in formele settings.",
      fr: "Dans les affaires à Sofia, costumes sombres sobres, chemises unies et chaussures cirées sont attendus — accessoires voyants ou casual visible déçoivent dans les salons formels.",
    },
  }),

  // ── UKRAINE ────────────────────────────────────────────────────────────────
  row({
    region_code: "UA", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Ukraine, Not 'The Ukraine'",
    rule_raw: "Ukraine is not 'the Ukraine'; conflation with Russia is deeply offensive.",
    rule_cc: "In Ukraine, say 'Ukraine' — never 'the Ukraine' — and never confuse Ukrainian language, history, or identity with Russian; the slip is felt as a moral failure.",
    source_book: "CM", source_page: "1138", urgency: 3,
    i18n: {
      nl: "Zeg in Oekraïne 'Oekraïne' — nooit 'de Oekraïne' — en verwar Oekraïense taal, geschiedenis of identiteit nooit met Russische; de vergissing wordt gevoeld als moreel falen.",
      fr: "En Ukraine, dites « Ukraine » — jamais « l'Ukraine » avec article anglais — et ne confondez jamais langue, histoire ou identité ukrainiennes avec russes ; la confusion est ressentie comme une faute morale.",
      es: "En Ucrania, di «Ucrania» — y nunca confundas lengua, historia o identidad ucranianas con rusas; el desliz se vive como un fallo moral.",
    },
  }),
  row({
    region_code: "UA", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Slava Ukraini",
    rule_raw: "'Slava Ukraini — Heroyam Slava' is the patriotic greeting and response.",
    rule_cc: "In Ukraine, the patriotic greeting 'Slava Ukraini' is met with 'Heroyam Slava' — used with friends and at events, it carries weight; never offer it ironically.",
    source_book: "CM", source_page: "1144", urgency: 2,
    i18n: {
      nl: "In Oekraïne wordt de patriottische groet 'Slava Ukraini' beantwoord met 'Heroyam Slava' — gebruikt onder vrienden en bij gelegenheden draagt hij gewicht; nooit ironisch.",
      fr: "En Ukraine, le salut patriotique « Slava Ukraini » se répond par « Heroyam Slava » — entre amis et lors d'événements il porte poids ; jamais d'ironie.",
    },
  }),
  row({
    region_code: "UA", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Bread and Salt Welcome",
    rule_raw: "Bread and salt are the traditional Ukrainian welcome; horilka the social drink.",
    rule_cc: "A Ukrainian welcome may begin with bread and salt — accept a small piece, and join the horilka toasts that follow with eye contact and a steady hand.",
    source_book: "CM", source_page: "1150", urgency: 2,
    i18n: {
      nl: "Een Oekraïens welkom kan beginnen met brood en zout — neem een klein stuk en sluit aan bij de horilka-toosten die volgen met oogcontact en een vaste hand.",
      fr: "Un accueil ukrainien peut commencer par le pain et le sel — prenez-en un petit morceau et joignez-vous aux toasts à la horilka avec un regard direct et la main ferme.",
    },
  }),
  row({
    region_code: "UA", pillar_code: "Z4", subcategory: "seniority_business",
    rule_type: "CC: Pan and Pani",
    rule_raw: "Ukrainian formal address uses Pan/Pani with first name and patronymic.",
    rule_cc: "In Ukrainian business, address counterparts as Pan or Pani with the first name and patronymic — bare first names too early read as American casualness.",
    source_book: "DN", source_page: "586", urgency: 2,
    i18n: {
      nl: "Spreek tegenhangers in het Oekraïense zakenleven aan met Pan of Pani gevolgd door voornaam en patroniem — kale voornamen te vroeg komen over als Amerikaanse losheid.",
      fr: "Dans les affaires ukrainiennes, adressez-vous aux interlocuteurs par Pan ou Pani suivi du prénom et du patronyme — les prénoms seuls trop tôt paraissent d'une décontraction américaine.",
    },
  }),
  row({
    region_code: "UA", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Kyiv Polished",
    rule_raw: "Kyiv business dresses sharply; sloppy attire is read as disrespect.",
    rule_cc: "In Kyiv business, sharp polish reads as respect — pressed suit, polished shoes, careful grooming; arriving rumpled is read as disrespect for the room.",
    source_book: "ME", source_page: "564", urgency: 2,
    i18n: {
      nl: "In het Kiev-zakenleven leest scherpe verzorging als respect — gestreken pak, gepoetste schoenen, zorgvuldige verzorging; verfrommeld verschijnen wordt opgevat als gebrek aan respect.",
      fr: "Dans les affaires à Kyiv, le poli net se lit comme du respect — costume repassé, chaussures cirées, soin de présentation ; arriver froissé passe pour un manque de respect.",
    },
  }),

  // ── CYPRUS ─────────────────────────────────────────────────────────────────
  row({
    region_code: "CY", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: The Division Stays Sensitive",
    rule_raw: "The 1974 division of Cyprus remains a live wound; visitors should not opine.",
    rule_cc: "In Cyprus, the 1974 division remains a living wound — never opine on the 'Cyprus problem', never call the north a country, and let your host steer if the topic surfaces.",
    source_book: "CM", source_page: "1168", urgency: 3,
    i18n: {
      nl: "Op Cyprus blijft de deling van 1974 een levende wond — geef geen mening over het 'Cyprusprobleem', noem het noorden geen land en laat uw gastheer sturen als het onderwerp valt.",
      fr: "À Chypre, la division de 1974 reste une plaie vive — n'opinez pas sur le « problème chypriote », n'appelez jamais le nord un pays, et laissez l'hôte mener si le sujet émerge.",
      es: "En Chipre, la división de 1974 sigue siendo una herida viva — no opines sobre el «problema chipriota», no llames país al norte, y deja que el anfitrión guíe si el tema aparece.",
    },
  }),
  row({
    region_code: "CY", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Two Cheek Kisses",
    rule_raw: "Greek Cypriots greet friends with two cheek kisses, starting on the right.",
    rule_cc: "In Greek Cyprus, friends greet with two cheek kisses, starting on the right — for new acquaintances a firm handshake is correct; mismatch jars the room.",
    source_book: "ME", source_page: "574", urgency: 2,
    i18n: {
      nl: "In het Grieks-Cypriotische deel begroeten vrienden elkaar met twee wangkussen, te beginnen rechts — voor nieuwe kennissen is een stevige handdruk correct; afwijking schuurt.",
      fr: "Dans la partie grecque de Chypre, les amis se saluent par deux baisers, en commençant à droite — pour les nouvelles connaissances, la poignée de main ferme convient ; un décalage détonne.",
    },
  }),
  row({
    region_code: "CY", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Mezze and Patience",
    rule_raw: "Cypriot mezze comes in many courses; pacing yourself is essential.",
    rule_cc: "A Cypriot mezze unfolds over many small plates — pace yourself early, accept the wine the host pours, and never refuse zivania at the end without a reason.",
    source_book: "CM", source_page: "1174", urgency: 2,
    i18n: {
      nl: "Een Cypriotische mezze ontvouwt zich over vele bordjes — verdeel uw tempo vroeg, aanvaard de wijn die de gastheer schenkt en weiger zivania aan het einde niet zonder reden.",
      fr: "Un mezze chypriote se déploie en de nombreuses petites assiettes — dosez-vous tôt, acceptez le vin de l'hôte, et ne refusez pas la zivania à la fin sans raison.",
    },
  }),
  row({
    region_code: "CY", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Kyrios and Kyria",
    rule_raw: "Greek Cypriot formal address uses Kyrios/Kyria with surname.",
    rule_cc: "In Greek Cyprus, address counterparts as Kyrios or Kyria with the surname — first names follow the host's lead, never the guest's assumption.",
    source_book: "DN", source_page: "598", urgency: 2,
    i18n: {
      nl: "In Grieks-Cyprus spreekt men tegenhangers aan met Kyrios of Kyria en de achternaam — voornamen volgen het tempo van de gastheer, nooit de aanname van de gast.",
      fr: "Dans la Chypre grecque, on s'adresse aux interlocuteurs par Kyrios ou Kyria suivi du nom — les prénoms suivent le rythme de l'hôte, jamais l'initiative du visiteur.",
    },
  }),
  row({
    region_code: "CY", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Cover for the Monastery",
    rule_raw: "Cypriot Orthodox monasteries require covered shoulders, knees, and often arms.",
    rule_cc: "Visiting a Cypriot Orthodox monastery, shoulders, arms, and knees stay covered — wraps are sometimes provided at the gate, but bringing your own marks the prepared guest.",
    source_book: "CM", source_page: "1180", urgency: 2,
    i18n: {
      nl: "Bij een Cypriotisch-orthodox klooster blijven schouders, armen en knieën bedekt — bij de poort liggen soms omslagdoeken, maar zelf meebrengen markeert de voorbereide gast.",
      fr: "Pour un monastère orthodoxe chypriote, épaules, bras et genoux restent couverts — des châles sont parfois fournis à l'entrée, mais en apporter un vous distingue comme invité préparé.",
    },
  }),

  // ── LUXEMBOURG ─────────────────────────────────────────────────────────────
  row({
    region_code: "LU", pillar_code: "Z1", subcategory: "alternative_behavior",
    rule_type: "CC: Three Languages, Choose Wisely",
    rule_raw: "Luxembourg works in Luxembourgish, French, and German; the choice signals respect.",
    rule_cc: "In Luxembourg, ask in which language to continue — Luxembourgish for warmth, French for officialdom, German for paperwork; choosing wrongly is read as inattention, not effort.",
    source_book: "CM", source_page: "1198", urgency: 2,
    i18n: {
      nl: "Vraag in Luxemburg in welke taal u verder kunt — Luxemburgs voor warmte, Frans voor officieel verkeer, Duits voor administratie; verkeerd kiezen wordt opgevat als onoplettendheid, niet als moeite.",
      fr: "Au Luxembourg, demandez dans quelle langue poursuivre — luxembourgeois pour la chaleur, français pour l'officiel, allemand pour la paperasserie ; mal choisir passe pour de l'inattention, non pour de l'effort.",
    },
  }),
  row({
    region_code: "LU", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Discreet Sophistication",
    rule_raw: "Luxembourgers prize discretion and dislike American-style self-promotion.",
    rule_cc: "Luxembourgers favour discretion — wealth, titles, and connections are referenced obliquely or not at all; loud self-promotion lands as rough in a country built on quiet accuracy.",
    source_book: "CM", source_page: "1204", urgency: 2,
    i18n: {
      nl: "Luxemburgers waarderen discretie — rijkdom, titels en connecties worden indirect of helemaal niet genoemd; luide zelfpromotie komt grof over in een land dat op stille nauwkeurigheid is gebouwd.",
      fr: "Les Luxembourgeois privilégient la discrétion — richesse, titres et réseaux se mentionnent obliquement ou pas du tout ; l'auto-promotion bruyante détonne dans un pays bâti sur la précision tranquille.",
    },
  }),
  row({
    region_code: "LU", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Moselle Wine Note",
    rule_raw: "Luxembourg's Moselle wines are a quiet point of pride; engage with them.",
    rule_cc: "Luxembourg's Moselle wines deserve a remark — ask about the cuvée or the producer; treating the bottle as filler reads as missing the small things that the country values.",
    source_book: "CM", source_page: "1210", urgency: 2,
    i18n: {
      nl: "De Luxemburgse Moezelwijnen verdienen een opmerking — vraag naar de cuvée of de producent; de fles als opvulling behandelen wordt gelezen als de kleine dingen missen die het land waardeert.",
      fr: "Les vins mosellans du Luxembourg méritent un mot — interrogez sur la cuvée ou le producteur ; traiter la bouteille comme du remplissage passe pour rater les petites choses que le pays valorise.",
    },
  }),
  row({
    region_code: "LU", pillar_code: "Z4", subcategory: "networking",
    rule_type: "CC: Patience Builds Trust",
    rule_raw: "Luxembourg business takes time; pushing for quick decisions backfires.",
    rule_cc: "In Luxembourg business, patient relationship building precedes decisions — pushing for fast yes-or-no in a first meeting is read as Anglo-Saxon impatience and stalls the deal.",
    source_book: "ME", source_page: "584", urgency: 2,
    i18n: {
      nl: "In het Luxemburgse zakenleven gaat geduldig relatieopbouw vooraf aan beslissingen — aandringen op een snel ja of nee in een eerste gesprek wordt gelezen als Angelsaksisch ongeduld en blokkeert de deal.",
      fr: "Dans les affaires luxembourgeoises, la construction patiente de la relation précède la décision — pousser au oui ou non rapide dès la première rencontre se lit comme une impatience anglo-saxonne et fige l'affaire.",
    },
  }),
  row({
    region_code: "LU", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Quiet Bespoke",
    rule_raw: "Luxembourg business dresses in quiet bespoke tailoring without visible labels.",
    rule_cc: "Luxembourg business dresses in quiet bespoke tailoring — dark suit, plain shirt, no visible labels; flash reads as new money in a country that prefers old.",
    source_book: "ME", source_page: "590", urgency: 2,
    i18n: {
      nl: "Het Luxemburgse zakenleven kleedt zich in stille bespoke-tailoring — donker pak, effen overhemd, geen zichtbare labels; opvallendheid wordt gelezen als nieuw geld in een land dat oud verkiest.",
      fr: "Les affaires luxembourgeoises s'habillent d'une couture sur mesure discrète — costume sombre, chemise unie, pas de logos visibles ; le clinquant se lit comme de l'argent neuf dans un pays qui préfère l'ancien.",
    },
  }),

  // ── PAKISTAN ───────────────────────────────────────────────────────────────
  row({
    region_code: "PK", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Friday Prayer Pauses",
    rule_raw: "Pakistani business pauses for Friday Jummah prayer; schedule around it.",
    rule_cc: "In Pakistan, Friday Jummah prayer pauses business between roughly noon and two — never schedule meetings across that window, and never appear surprised by the closure.",
    source_book: "CM", source_page: "1228", urgency: 3,
    i18n: {
      nl: "In Pakistan onderbreekt het vrijdaggebed (Jummah) het zakelijke leven ongeveer tussen twaalf en twee — plan geen vergaderingen in dat venster en toon u niet verbaasd over de sluiting.",
      fr: "Au Pakistan, la prière du vendredi (Jummah) suspend les affaires entre midi et quatorze heures environ — ne planifiez pas de réunions dans cette fenêtre, et ne montrez pas de surprise face à la fermeture.",
      es: "En Pakistán, la oración del viernes (Jummah) detiene los negocios entre el mediodía y las dos aproximadamente — nunca programes reuniones en esa franja, ni te muestres sorprendido por el cierre.",
    },
  }),
  row({
    region_code: "PK", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: Poetry in the Pause",
    rule_raw: "Pakistanis admire eloquence; ornamented phrasing and poetic touch carry weight.",
    rule_cc: "In Pakistan, eloquence carries weight — a Urdu proverb, a couplet, or a graceful phrase deepens the bond; flat business prose alone is heard as cold.",
    source_book: "CM", source_page: "1234", urgency: 2,
    i18n: {
      nl: "In Pakistan draagt welsprekendheid gewicht — een Urdu-spreekwoord, een coupletje of een gracieuze formulering verdiept de band; vlakke zakelijke taal alleen wordt als koud gehoord.",
      fr: "Au Pakistan, l'éloquence porte poids — un proverbe ourdou, un distique, une formule gracieuse approfondissent le lien ; la seule prose d'affaires plate s'entend comme froide.",
    },
  }),
  row({
    region_code: "PK", pillar_code: "Z3", subcategory: "table_posture",
    rule_type: "CC: Right Hand at the Table",
    rule_raw: "Pakistani meals are taken with the right hand; the left is reserved.",
    rule_cc: "At a Pakistani table, eat and pass dishes with the right hand only — the left is reserved for hygiene; ambidextrous habits from elsewhere are noticed and remembered.",
    source_book: "CM", source_page: "1240", urgency: 3,
    i18n: {
      nl: "Aan een Pakistaanse tafel eet en geeft u schalen door met alleen de rechterhand — de linker is gereserveerd voor hygiëne; ambidextere gewoonten van elders worden opgemerkt en onthouden.",
      fr: "À une table pakistanaise, mangez et passez les plats de la seule main droite — la gauche est réservée à l'hygiène ; les habitudes ambidextres d'ailleurs se remarquent et se retiennent.",
      es: "En la mesa pakistaní, come y pasa los platos solo con la mano derecha — la izquierda queda reservada para la higiene; las costumbres ambidiestras de fuera se notan y se recuerdan.",
    },
  }),
  row({
    region_code: "PK", pillar_code: "Z4", subcategory: "gender_nuances",
    rule_type: "CC: Wait for the Hand",
    rule_raw: "Pakistani men do not extend a hand to a woman first; the woman initiates if at all.",
    rule_cc: "In Pakistan, a man does not extend a hand to a woman first — wait for her to offer; placing a hand on the chest with a slight bow is the safe greeting either way.",
    source_book: "CM", source_page: "1246", urgency: 3,
    i18n: {
      nl: "In Pakistan steekt een man een vrouw niet als eerste een hand toe — wacht tot zij die aanbiedt; een hand op de borst met een lichte buiging is in beide richtingen de veilige groet.",
      fr: "Au Pakistan, un homme ne tend pas la main à une femme en premier — attendez qu'elle l'offre ; une main sur la poitrine avec une légère inclinaison est le salut sûr dans les deux sens.",
      es: "En Pakistán, un hombre no tiende la mano a una mujer primero — espera a que ella la ofrezca; una mano sobre el pecho con leve inclinación es el saludo seguro en ambos sentidos.",
    },
  }),
  row({
    region_code: "PK", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Modest Always",
    rule_raw: "Pakistani public dress codes expect covered shoulders, arms, and legs.",
    rule_cc: "In Pakistan, public dress for both sexes covers shoulders, arms, and legs — shalwar kameez is always correct; visible skin marks you as unprepared, not modern.",
    source_book: "ME", source_page: "598", urgency: 3,
    i18n: {
      nl: "In Pakistan bedekt de openbare kledingnorm voor beide geslachten schouders, armen en benen — shalwar kameez is altijd correct; zichtbare huid markeert u als onvoorbereid, niet als modern.",
      fr: "Au Pakistan, la tenue publique pour les deux sexes couvre épaules, bras et jambes — le shalwar kameez convient toujours ; la peau visible vous désigne comme mal préparé, non comme moderne.",
      es: "En Pakistán, el código público para ambos sexos cubre hombros, brazos y piernas — el shalwar kameez siempre es correcto; la piel visible te marca como mal preparado, no como moderno.",
    },
  }),

  // ── MONGOLIA ───────────────────────────────────────────────────────────────
  row({
    region_code: "MN", pillar_code: "Z1", subcategory: "taboos",
    rule_type: "CC: Threshold and Hearth",
    rule_raw: "In a Mongolian ger, never step on the threshold and never turn your back on the hearth.",
    rule_cc: "Entering a Mongolian ger, step over the threshold without touching it, and never turn your back to the central hearth — both are felt as small acts of disrespect to the home.",
    source_book: "CM", source_page: "1258", urgency: 3,
    i18n: {
      nl: "Bij het betreden van een Mongoolse ger stapt u over de drempel zonder hem te raken, en keert u nooit de centrale haard de rug toe — beide worden ervaren als kleine daden van gebrek aan respect.",
      fr: "En entrant dans une ger mongole, enjambez le seuil sans le toucher, et ne tournez jamais le dos au foyer central — les deux sont ressentis comme de petits manques de respect au foyer.",
      es: "Al entrar en una ger mongola, pasa por encima del umbral sin tocarlo, y nunca des la espalda al hogar central — ambos se viven como pequeños desaires al hogar.",
    },
  }),
  row({
    region_code: "MN", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Sain Baina Uu",
    rule_raw: "Mongolians greet with 'Sain baina uu' and a light touch of elbows or palms.",
    rule_cc: "In Mongolia, 'Sain baina uu' opens the encounter, often with a light touch of elbows or palms — robust handshakes from elsewhere can feel forward.",
    source_book: "CM", source_page: "1264", urgency: 2,
    i18n: {
      nl: "In Mongolië opent 'Sain baina uu' de ontmoeting, vaak met een lichte aanraking van ellebogen of handpalmen — stevige handdrukken van elders kunnen vooruitstrevend voelen.",
      fr: "En Mongolie, « Sain baina uu » ouvre la rencontre, souvent par un léger contact des coudes ou des paumes — les poignées de main fermes d'ailleurs peuvent paraître appuyées.",
    },
  }),
  row({
    region_code: "MN", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Airag and the Right Hand",
    rule_raw: "Airag — fermented mare's milk — is offered with the right hand; refusing entirely is rude.",
    rule_cc: "When offered airag in a Mongolian ger, accept the bowl with the right hand, sip even a little, and pass it back with the same hand; refusing outright is felt as rejection of hospitality.",
    source_book: "CM", source_page: "1270", urgency: 2,
    i18n: {
      nl: "Wanneer u in een Mongoolse ger airag krijgt aangeboden, neemt u de kom aan met de rechterhand, neemt u zelfs maar een klein slokje en geeft u hem met dezelfde hand terug; volledig weigeren wordt ervaren als afwijzing van gastvrijheid.",
      fr: "Lorsqu'on vous offre de l'airag dans une ger mongole, prenez le bol de la main droite, sirotez ne serait-ce qu'un peu, et rendez-le de la même main ; refuser net est ressenti comme un rejet de l'hospitalité.",
    },
  }),
  row({
    region_code: "MN", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Elders First, Always",
    rule_raw: "Mongolians defer to elders in seating, serving, and speaking.",
    rule_cc: "In Mongolia, elders are seated first, served first, and addressed first — speaking ahead of an elder marks you as untaught, however senior elsewhere.",
    source_book: "DN", source_page: "612", urgency: 2,
    i18n: {
      nl: "In Mongolië worden ouderen als eerste neergezet, als eerste bediend en als eerste aangesproken — vóór een oudere spreken markeert u als ongeschoold, hoe hooggeplaatst elders ook.",
      fr: "En Mongolie, les aînés sont assis d'abord, servis d'abord et adressés d'abord — parler avant un aîné vous désigne comme mal élevé, quel que soit votre rang ailleurs.",
    },
  }),
  row({
    region_code: "MN", pillar_code: "Z5", subcategory: "dress_code_business",
    rule_type: "CC: Ulaanbaatar Suit",
    rule_raw: "Ulaanbaatar business dresses formally; tourist trekking gear in the city jars.",
    rule_cc: "In Ulaanbaatar business, full suit and polished shoes are the norm — fleeces and trekking trousers belong on the steppe, not in the boardroom.",
    source_book: "ME", source_page: "608", urgency: 2,
    i18n: {
      nl: "In het zakenleven van Ulaanbaatar zijn volledig pak en gepoetste schoenen de norm — fleeces en trekkingbroeken horen op de steppe, niet in de bestuurskamer.",
      fr: "Dans les affaires à Oulan-Bator, costume complet et chaussures cirées sont la norme — polaires et pantalons de trek ont leur place dans la steppe, non dans la salle du conseil.",
    },
  }),

  // ── BAHRAIN ────────────────────────────────────────────────────────────────
  row({
    region_code: "BH", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Ramadan in Public",
    rule_raw: "Bahrain enforces public Ramadan etiquette; eating, drinking, smoking outside is illegal in daylight.",
    rule_cc: "In Bahrain during Ramadan, refrain from eating, drinking, or smoking in public during daylight — the courtesy is required by law of visitors of every faith.",
    source_book: "CM", source_page: "1288", urgency: 3,
    i18n: {
      nl: "Onthoud u in Bahrein tijdens de Ramadan overdag in het openbaar van eten, drinken en roken — de hoffelijkheid wordt bij wet vereist van bezoekers van elk geloof.",
      fr: "À Bahreïn pendant le Ramadan, abstenez-vous de manger, boire ou fumer en public en journée — la courtoisie est exigée par la loi de tous les visiteurs, quelle que soit leur confession.",
      es: "En Baréin durante el Ramadán, abstente de comer, beber o fumar en público durante el día — la cortesía la exige la ley a los visitantes de cualquier credo.",
    },
  }),
  row({
    region_code: "BH", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Long Greeting, Then Business",
    rule_raw: "Bahraini greetings are extended; jumping to business is read as cold.",
    rule_cc: "In Bahrain, greetings stretch — health, family, journey, weather — and only then does business open; cutting the greeting short is read as cold, not efficient.",
    source_book: "CM", source_page: "1294", urgency: 2,
    i18n: {
      nl: "In Bahrein worden begroetingen gerekt — gezondheid, familie, reis, weer — en pas dan opent het zakelijke; de begroeting inkorten wordt als koud gelezen, niet als efficiënt.",
      fr: "À Bahreïn, les salutations s'étirent — santé, famille, voyage, météo — et seulement après l'affaire s'ouvre ; raccourcir le salut se lit comme froid, non comme efficace.",
    },
  }),
  row({
    region_code: "BH", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Coffee Cup Tilt",
    rule_raw: "Refusing more Arabic coffee in Bahrain is signalled by a small wrist-tilt of the cup.",
    rule_cc: "In Bahrain, accept the first cup of Arabic coffee as a sign of welcome; to indicate you wish no more, tilt the cup gently from side to side as you return it.",
    source_book: "CM", source_page: "1300", urgency: 2,
    i18n: {
      nl: "Aanvaard in Bahrein de eerste kop Arabische koffie als teken van welkom; om aan te geven dat u geen meer wenst, kantelt u het kopje zacht heen en weer bij het teruggeven.",
      fr: "À Bahreïn, acceptez la première tasse de café arabe comme signe d'accueil ; pour indiquer que vous n'en voulez plus, inclinez doucement la tasse de côté en la rendant.",
    },
  }),
  row({
    region_code: "BH", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Sheikh Carries Weight",
    rule_raw: "Bahraini royal and tribal titles are used and respected in every setting.",
    rule_cc: "In Bahrain, royal and tribal titles — Sheikh, Sayyid — accompany the name in every address; dropping them for first-name familiarity is a misreading of the room.",
    source_book: "DN", source_page: "624", urgency: 2,
    i18n: {
      nl: "In Bahrein gaan koninklijke en stamtitels — Sheikh, Sayyid — in elke aanspraak met de naam mee; ze laten vallen voor voornamen toont een verkeerd begrip van de situatie.",
      fr: "À Bahreïn, les titres royaux et tribaux — Sheikh, Sayyid — accompagnent le nom dans toute adresse ; les abandonner pour le prénom trahit une mauvaise lecture de la situation.",
    },
  }),
  row({
    region_code: "BH", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Cover in Town, Resort by the Pool",
    rule_raw: "Bahraini towns expect modest dress; resort attire stays at the resort.",
    rule_cc: "In Bahraini towns and souks, both sexes cover shoulders and knees — resort wear belongs to the pool and beach, not the streets of Manama or Muharraq.",
    source_book: "CM", source_page: "1306", urgency: 3,
    i18n: {
      nl: "In Bahreinse steden en soeks bedekken beide geslachten schouders en knieën — resortkleding hoort bij het zwembad en strand, niet op de straten van Manama of Muharraq.",
      fr: "Dans les villes et souks bahreïnis, les deux sexes couvrent épaules et genoux — la tenue de resort reste à la piscine et à la plage, non dans les rues de Manama ou Muharraq.",
      es: "En las ciudades y zocos bahreiníes, ambos sexos cubren hombros y rodillas — la ropa de resort queda para la piscina y la playa, no para las calles de Manama o Muharraq.",
    },
  }),

  // ── TUNISIA ────────────────────────────────────────────────────────────────
  row({
    region_code: "TN", pillar_code: "Z1", subcategory: "religious_impact",
    rule_type: "CC: Friday Prayers Pause",
    rule_raw: "Tunisia observes Friday prayer; many shops close briefly around midday.",
    rule_cc: "In Tunisia, Friday midday quiets the souk and many shops — schedule appointments around the prayer hour, and never appear inconvenienced by the closure.",
    source_book: "CM", source_page: "1318", urgency: 2,
    i18n: {
      nl: "In Tunesië maakt de vrijdagmiddag de soek en veel winkels stil — plan afspraken rond het gebedsuur en toon geen ongemak bij de sluiting.",
      fr: "En Tunisie, le vendredi midi calme le souk et beaucoup de boutiques — planifiez vos rendez-vous autour de l'heure de prière, et ne montrez pas d'agacement face à la fermeture.",
    },
  }),
  row({
    region_code: "TN", pillar_code: "Z2", subcategory: "communication_context",
    rule_type: "CC: French and Tunisian Arabic",
    rule_raw: "Tunisians switch easily between Tunisian Arabic, French, and English.",
    rule_cc: "In Tunisia, conversation slides between Tunisian Arabic, French, and increasingly English — meet your host wherever they land; insisting on one alone reads as stiff.",
    source_book: "CM", source_page: "1324", urgency: 2,
    i18n: {
      nl: "In Tunesië glijdt het gesprek tussen Tunesisch-Arabisch, Frans en steeds vaker Engels — beantwoord uw gastheer waar die uitkomt; vasthouden aan één taal komt stijf over.",
      fr: "En Tunisie, la conversation glisse entre arabe tunisien, français et de plus en plus anglais — répondez à l'hôte là où il atterrit ; insister sur une seule paraît raide.",
    },
  }),
  row({
    region_code: "TN", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Mint Tea Three Times",
    rule_raw: "Tunisian mint tea is served in three rounds with rising sweetness.",
    rule_cc: "In Tunisia, mint tea is poured in three rounds — bitter as life, sweet as love, gentle as death; declining the second or third cup without reason cuts the conversation short.",
    source_book: "CM", source_page: "1330", urgency: 2,
    i18n: {
      nl: "In Tunesië wordt muntthee in drie rondes geschonken — bitter als het leven, zoet als liefde, zacht als de dood; de tweede of derde kop zonder reden weigeren snijdt het gesprek af.",
      fr: "En Tunisie, le thé à la menthe se sert en trois tours — amer comme la vie, sucré comme l'amour, doux comme la mort ; refuser la deuxième ou troisième tasse sans raison coupe la conversation.",
    },
  }),
  row({
    region_code: "TN", pillar_code: "Z4", subcategory: "gender_nuances",
    rule_type: "CC: Wait for the Hand",
    rule_raw: "Tunisian men do not extend a hand to a woman first; the woman leads.",
    rule_cc: "In Tunisia, a man does not extend a hand to a woman first — wait for her to offer; placing the right hand on the chest with a slight bow is the safe greeting either way.",
    source_book: "CM", source_page: "1336", urgency: 2,
    i18n: {
      nl: "In Tunesië steekt een man een vrouw niet als eerste een hand toe — wacht tot zij die aanbiedt; de rechterhand op de borst met een lichte buiging is in beide richtingen de veilige groet.",
      fr: "En Tunisie, un homme ne tend pas la main à une femme en premier — attendez qu'elle l'offre ; la main droite sur la poitrine avec une légère inclinaison est le salut sûr dans les deux sens.",
    },
  }),
  row({
    region_code: "TN", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Modest in the Medina",
    rule_raw: "Tunisian medinas and mosques expect shoulders and knees covered.",
    rule_cc: "In Tunisian medinas and mosques, shoulders and knees stay covered for both sexes — resort wear belongs to Hammamet's pools, not the lanes of Tunis or Kairouan.",
    source_book: "CM", source_page: "1342", urgency: 2,
    i18n: {
      nl: "In Tunesische medina's en moskeeën blijven schouders en knieën voor beide geslachten bedekt — resortkleding hoort bij de zwembaden van Hammamet, niet in de straatjes van Tunis of Kairouan.",
      fr: "Dans les médinas et mosquées tunisiennes, épaules et genoux restent couverts pour les deux sexes — la tenue de resort reste aux piscines d'Hammamet, non dans les ruelles de Tunis ou Kairouan.",
    },
  }),

  // ── SENEGAL ────────────────────────────────────────────────────────────────
  row({
    region_code: "SN", pillar_code: "Z1", subcategory: "alternative_behavior",
    rule_type: "CC: Teranga Threads All",
    rule_raw: "Senegalese hospitality — teranga — is the cultural baseline.",
    rule_cc: "In Senegal, teranga — generous hospitality — is the cultural baseline; refusing food, drink, or invitation without warm reason is read as rejection of the person.",
    source_book: "CM", source_page: "1358", urgency: 2,
    i18n: {
      nl: "In Senegal is teranga — gulle gastvrijheid — de culturele basis; eten, drank of uitnodiging weigeren zonder warme reden wordt gelezen als afwijzing van de persoon.",
      fr: "Au Sénégal, la teranga — l'hospitalité généreuse — est la norme culturelle ; refuser nourriture, boisson ou invitation sans raison chaleureuse se lit comme un rejet de la personne.",
    },
  }),
  row({
    region_code: "SN", pillar_code: "Z2", subcategory: "greeting_ritual",
    rule_type: "CC: Salaam Maleekum",
    rule_raw: "Senegalese greetings open with 'Salaam Maleekum' and a long inquiry into family.",
    rule_cc: "In Senegal, greet with 'Salaam Maleekum' and stretch the inquiry into family, health, and home — cutting it short marks you as a stranger to teranga.",
    source_book: "CM", source_page: "1364", urgency: 2,
    i18n: {
      nl: "Begroet in Senegal met 'Salaam Maleekum' en rek de vragen naar familie, gezondheid en huis — inkorten markeert u als vreemde voor teranga.",
      fr: "Au Sénégal, saluez par « Salaam Maleekum » et étirez les questions sur la famille, la santé et la maison — abréger vous désigne comme étranger à la teranga.",
    },
  }),
  row({
    region_code: "SN", pillar_code: "Z3", subcategory: "consumption_sounds",
    rule_type: "CC: Thiéboudienne by the Right Hand",
    rule_raw: "Senegalese thiéboudienne is shared from one platter and eaten with the right hand.",
    rule_cc: "Senegalese thiéboudienne is taken with the right hand from a shared platter — eat only from the section in front of you, and accept the fish or meat the host pushes your way.",
    source_book: "CM", source_page: "1370", urgency: 2,
    i18n: {
      nl: "Senegalese thiéboudienne wordt met de rechterhand uit één gedeelde schaal genomen — eet alleen uit het deel vóór u en aanvaard de vis of het vlees dat de gastheer naar u toeschuift.",
      fr: "Le thiéboudienne sénégalais se prend de la main droite dans un plat partagé — mangez uniquement dans la portion en face de vous, et acceptez le poisson ou la viande poussé vers vous par l'hôte.",
    },
  }),
  row({
    region_code: "SN", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Elders Set the Pace",
    rule_raw: "Senegalese society defers to elders in seating, serving, and speaking.",
    rule_cc: "In Senegal, elders are greeted first, served first, and spoken to with care — speaking over them, even with affection, is felt as a small failure of upbringing.",
    source_book: "DN", source_page: "638", urgency: 2,
    i18n: {
      nl: "In Senegal worden ouderen als eerste begroet, als eerste bediend en met zorg aangesproken — over hen heen praten, zelfs liefdevol, wordt gevoeld als een klein opvoedingsfalen.",
      fr: "Au Sénégal, les aînés sont salués d'abord, servis d'abord et adressés avec soin — leur couper la parole, même avec affection, est ressenti comme un petit manquement d'éducation.",
    },
  }),
  row({
    region_code: "SN", pillar_code: "Z5", subcategory: "dress_code_social",
    rule_type: "CC: Boubou for the Occasion",
    rule_raw: "Senegalese celebrations welcome bright boubou and embroidered fabrics.",
    rule_cc: "At a Senegalese celebration, dress with care — a boubou, embroidered fabric, or a sharp suit; turning up casually is read as missing the joy of the occasion.",
    source_book: "ME", source_page: "618", urgency: 2,
    i18n: {
      nl: "Bij een Senegalese viering kleedt u zich met zorg — een boubou, geborduurde stof of een scherp pak; nonchalant verschijnen wordt gelezen als het missen van de vreugde van de gelegenheid.",
      fr: "Lors d'une célébration sénégalaise, habillez-vous avec soin — boubou, tissu brodé ou costume net ; arriver négligemment se lit comme rater la joie de l'occasion.",
    },
  }),

  // ── FIJI ───────────────────────────────────────────────────────────────────
  row({
    region_code: "FJ", pillar_code: "Z1", subcategory: "alternative_behavior",
    rule_type: "CC: Bula is the Welcome",
    rule_raw: "'Bula' carries Fiji's whole spirit of welcome and life.",
    rule_cc: "In Fiji, 'Bula' is more than hello — it carries life, welcome, and goodwill; receive it warmly and return it in kind, never as a tourist tagline.",
    source_book: "CM", source_page: "1388", urgency: 2,
    i18n: {
      nl: "In Fiji is 'Bula' meer dan hallo — het draagt leven, welkom en goede wil; ontvang het warm en geef het in dezelfde geest terug, nooit als toeristenkreet.",
      fr: "Aux Fidji, « Bula » est plus qu'un bonjour — il porte vie, accueil et bienveillance ; recevez-le chaleureusement et rendez-le de même, jamais en cliché touristique.",
    },
  }),
  row({
    region_code: "FJ", pillar_code: "Z2", subcategory: "nonverbal_style",
    rule_type: "CC: Smile, Quietly",
    rule_raw: "Fijians communicate warmth through smile and unhurried gesture.",
    rule_cc: "In Fiji, the smile and the slow gesture carry warmth — loud laughter and big movement do not impress, while the easy unhurried bearing wins the room.",
    source_book: "CM", source_page: "1394", urgency: 2,
    i18n: {
      nl: "In Fiji dragen glimlach en traag gebaar de warmte — luide lach en grote bewegingen imponeren niet, terwijl de makkelijke onhaastige houding de ruimte wint.",
      fr: "Aux Fidji, le sourire et le geste lent portent la chaleur — rires forts et grands mouvements n'impressionnent pas, tandis que l'allure tranquille emporte la pièce.",
    },
  }),
  row({
    region_code: "FJ", pillar_code: "Z3", subcategory: "wine_and_drinks",
    rule_type: "CC: Kava and the Clap",
    rule_raw: "Kava is shared in a fixed ritual; clap once before, three times after.",
    rule_cc: "When offered kava in Fiji, clap once, drink the bowl in one go, return it, and clap three times — interrupting or sipping breaks the ritual the village has gathered for.",
    source_book: "CM", source_page: "1400", urgency: 3,
    i18n: {
      nl: "Wanneer u in Fiji kava krijgt aangeboden, klapt u één keer, drinkt u de kom in één teug leeg, geeft u hem terug en klapt u drie keer — onderbreken of nippen breekt het ritueel waarvoor het dorp samen is gekomen.",
      fr: "Quand on vous offre du kava aux Fidji, frappez une fois dans les mains, buvez le bol d'un trait, rendez-le, et frappez trois fois — interrompre ou siroter brise le rituel pour lequel le village s'est rassemblé.",
      es: "Cuando se te ofrece kava en Fiyi, aplaude una vez, bebe el cuenco de un trago, devuélvelo y aplaude tres veces — interrumpir o sorber rompe el rito por el que el pueblo se ha reunido.",
    },
  }),
  row({
    region_code: "FJ", pillar_code: "Z4", subcategory: "hierarchy_social",
    rule_type: "CC: Chief and Sevusevu",
    rule_raw: "Visiting a Fijian village requires a sevusevu — gift of kava — to the chief.",
    rule_cc: "Visiting a Fijian village, present a sevusevu — a small bundle of kava — to the chief before walking the grounds; arriving without one is felt as discourtesy to the whole village.",
    source_book: "DN", source_page: "650", urgency: 3,
    i18n: {
      nl: "Bij een bezoek aan een Fijisch dorp biedt u eerst een sevusevu — een klein bundeltje kava — aan de chief aan voordat u rondloopt; zonder sevusevu verschijnen wordt gevoeld als oneerbiedigheid jegens het hele dorp.",
      fr: "En visitant un village fidjien, présentez un sevusevu — un petit fagot de kava — au chef avant de parcourir les lieux ; arriver sans sevusevu est ressenti comme une discourtoisie envers tout le village.",
      es: "Al visitar un pueblo fiyiano, presenta un sevusevu — un pequeño manojo de kava — al jefe antes de recorrer el lugar; llegar sin él se vive como descortesía hacia todo el pueblo.",
    },
  }),
  row({
    region_code: "FJ", pillar_code: "Z5", subcategory: "modest_dress",
    rule_type: "CC: Cover in the Village",
    rule_raw: "Fijian villages expect shoulders, knees, and hats off; resort dress is for resorts.",
    rule_cc: "In a Fijian village, shoulders and knees stay covered, hats come off, and sunglasses are pushed up — resort beachwear belongs only at the resort.",
    source_book: "CM", source_page: "1406", urgency: 3,
    i18n: {
      nl: "In een Fijisch dorp blijven schouders en knieën bedekt, gaan hoeden af en worden zonnebrillen omhoog geschoven — strandkleding van het resort hoort alleen bij het resort.",
      fr: "Dans un village fidjien, épaules et genoux restent couverts, les chapeaux s'enlèvent et les lunettes de soleil se relèvent — la tenue de plage du resort ne s'autorise qu'au resort.",
      es: "En un pueblo fiyiano, hombros y rodillas permanecen cubiertos, los sombreros se quitan y las gafas de sol se levantan — la ropa de playa del resort queda solo en el resort.",
    },
  }),
];
