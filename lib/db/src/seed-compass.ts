import { db } from "./index.js";
import { compassRegionsTable } from "./schema/compass_regions.js";
import { sql } from "drizzle-orm";

const COMPASS_SEED = [
  {
    region_code: "GB",
    flag_emoji: "🇬🇧",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "United Kingdom",
        core_value: "Understatement & Tradition",
        biggest_taboo: "Being forthright about money or personal matters",
        dining_etiquette: "Continental style throughout: fork in the left hand, knife in the right. Soup is taken from the side of the spoon, moving away from you. One does not begin eating until the host has done so. Elbows off the table. Compliments to the cook are always in order.",
        language_notes: "Titles are observed with care — Mr, Mrs, Dr, followed by the surname — until one is expressly invited to use a first name. Understatement is the native idiom: 'not bad' frequently means excellent, and 'a little tired' may signal profound displeasure.",
        gift_protocol: "Modest, well-considered gifts are welcome. Avoid anything lavish, which may cause embarrassment rather than delight. A bottle of wine or a small bunch of flowers is entirely appropriate for a dinner invitation. Gifts are opened privately.",
        dress_code: "When in doubt, dress upward. Business formal is expected in meetings unless otherwise stated. Smart casual covers most social occasions. Black Tie means a dinner jacket — never a lounge suit.",
        dos: [
          "Queue with patience and composure at all times",
          "Offer and accept tea as a gesture of hospitality",
          "Employ understatement when expressing views or complaints",
          "Arrive five minutes early — punctuality is a courtesy",
          "Write a brief note of thanks to the host the following day"
        ],
        donts: [
          "Enquire directly about salary, property value, or personal finances",
          "Abandon a queue under any circumstance whatsoever",
          "Speak at volume in public spaces or on public transport",
          "Raise personal or family matters until invited to do so",
          "Decline tea without a credible reason"
        ]
      },
      "en-US": {
        region_name: "United Kingdom",
        core_value: "Understatement & Tradition",
        biggest_taboo: "Being too blunt about money or personal matters",
        dining_etiquette: "British table manners follow the continental style: fork in the left hand, knife in the right — unlike the American switch-grip. The soup spoon moves away from you. Wait for the host to begin before eating. Elbows should stay off the table.",
        language_notes: "British communication relies heavily on understatement and indirectness. When someone says 'it's a bit much,' they likely mean it's unacceptable. First names aren't used until you're invited — stick with Mr, Mrs, or Dr until then.",
        gift_protocol: "Keep gifts modest and thoughtful. An extravagant gift can actually create discomfort. Wine or flowers work well for a dinner invitation. Gifts are typically opened in private, not in front of the giver.",
        dress_code: "Dress more formally than you think necessary. Business meetings call for formal attire. Smart casual is fine for social events. If the invitation says Black Tie, a tuxedo (dinner jacket) is required — not a suit.",
        dos: [
          "Wait in line patiently — queuing is a near-sacred custom",
          "Accept a cup of tea when offered — it's a social ritual",
          "Understate your reactions; enthusiasm can seem excessive",
          "Arrive on time or a few minutes early",
          "Send a thank-you note or message after being hosted"
        ],
        donts: [
          "Ask someone directly what they earn or what their home cost",
          "Cut in line — this is taken very seriously",
          "Talk loudly in public spaces or on public transportation",
          "Bring up personal or family topics unless they do first",
          "Turn down tea without a good explanation"
        ]
      },
      "en-AU": {
        region_name: "United Kingdom",
        core_value: "Understatement & Tradition",
        biggest_taboo: "Coming straight out with questions about money or personal life",
        dining_etiquette: "The Brits use continental table manners — fork stays in the left hand, knife in the right the whole time. The soup spoon tips away from you. Don't start eating until the host does. Keep elbows off the table.",
        language_notes: "British communication is indirect. 'Rather interesting' can mean anything from 'I like it' to 'I think it's terrible.' They use titles — Mr, Mrs, Dr — until they invite you to use first names, which can take a while.",
        gift_protocol: "Keep it simple and tasteful. Overgenerous gifts can backfire. A bottle of wine or flowers is perfect for dinner at someone's home. Don't expect them to open gifts in front of you.",
        dress_code: "Go smarter than you think you need to. Business meetings are formal. Smart casual works for most social occasions. Black Tie means a dinner jacket — a regular suit won't cut it.",
        dos: [
          "Queue properly — it matters more than you'd think",
          "Accept tea when it's offered — saying no needs a solid reason",
          "Keep your voice down in public — Brits value quiet",
          "Be on time or just slightly early",
          "Drop a quick thanks after being hosted"
        ],
        donts: [
          "Ask outright about someone's pay or mortgage",
          "Jump the queue — seriously, don't",
          "Be loud in public spaces or on the tube",
          "Bring up personal stuff until they do",
          "Knock back tea without explaining why"
        ]
      },
      "en-CA": {
        region_name: "United Kingdom",
        core_value: "Understatement & Tradition",
        biggest_taboo: "Raising questions about personal finances or private matters too directly",
        dining_etiquette: "Continental dining style is standard: fork held in the left hand, knife in the right throughout the meal. The soup spoon moves away from the body. It is polite to wait until the host begins eating. Elbows are kept off the table.",
        language_notes: "British communication is characteristically understated and indirect. Phrases like 'not entirely suitable' often carry significant weight. Surnames with titles (Mr, Mrs, Dr) are used until first-name use is invited — this can take some time.",
        gift_protocol: "Thoughtful, moderate gifts are appreciated. An overly generous gift may cause awkwardness. Wine or flowers are reliable choices for a dinner invitation. Gifts are generally opened away from the giver.",
        dress_code: "Opt for a slightly more formal choice than you might at home. Business meetings are formal unless explicitly noted otherwise. Smart casual covers most social occasions. Black Tie requires a dinner jacket, not a suit.",
        dos: [
          "Queue with patience — it is a deeply held social norm",
          "Accept tea graciously when offered",
          "Express opinions with measured understatement",
          "Aim to arrive on time or a few minutes early",
          "Follow up with a thank-you note or message after a social visit"
        ],
        donts: [
          "Ask about income, property prices, or financial matters",
          "Skip the queue under any circumstances",
          "Speak loudly in public or on public transit",
          "Raise personal or family subjects uninvited",
          "Decline tea without offering a clear reason"
        ]
      },
      "nl-NL": {
        region_name: "Verenigd Koninkrijk",
        core_value: "Understatement & Traditie",
        biggest_taboo: "Direct spreken over geld of persoonlijke aangelegenheden",
        dining_etiquette: "Continentale tafelmanieren zijn de norm: vork in de linkerhand, mes in de rechter. De soeplepel beweegt van u weg. Wacht totdat de gastheer of gastvrouw begint met eten. Ellebogen horen niet op tafel.",
        language_notes: "Britten communiceren indirect en terughoudend. 'Not bad' (niet slecht) betekent vaak uitstekend. Gebruik titels als 'Mr', 'Mrs' of 'Dr' tot u expliciet wordt uitgenodigd de voornaam te gebruiken — dat kan geruime tijd duren.",
        gift_protocol: "Bescheiden en doordachte cadeaus worden gewaardeerd. Overdadig geven kan ongemak veroorzaken. Een fles wijn of bloemen zijn passend voor een dinerinvitatie. Cadeaus worden doorgaans privé geopend, niet in het bijzijn van de gever.",
        dress_code: "Kies liever iets formeeler dan te informeel. Zakelijke bijeenkomsten vereisen formele kleding. Smart casual is geschikt voor de meeste sociale gelegenheden. 'Black Tie' betekent een smoking — geen gewoon pak.",
        dos: [
          "Wacht geduldig in de rij — dit is een wezenlijke sociale norm",
          "Aanvaard thee wanneer die wordt aangeboden",
          "Druk uw mening uit met terughoudendheid en understatement",
          "Wees op tijd of een paar minuten vroeg",
          "Stuur een bedankbriefje na een bezoek"
        ],
        donts: [
          "Vraag niet direct naar inkomsten, huizenprijzen of financiën",
          "Sla nooit de rij over",
          "Praat luid in openbare ruimtes of het openbaar vervoer",
          "Breng persoonlijke onderwerpen niet ter sprake tenzij uitgenodigd",
          "Weiger geen thee zonder goede reden"
        ]
      },
      "fr-FR": {
        region_name: "Royaume-Uni",
        core_value: "Litote & Tradition",
        biggest_taboo: "Évoquer directement l'argent ou les affaires personnelles",
        dining_etiquette: "Le style continental est de rigueur : fourchette dans la main gauche, couteau dans la droite tout au long du repas. La cuillère à soupe s'éloigne du convive. L'on attend que l'hôte commence à manger. Les coudes restent hors de la table.",
        language_notes: "La communication britannique repose sur la litote et l'indirection. 'Not bad' (pas mal) signifie souvent excellente. Les titres — Mr, Mrs, Dr — précèdent le nom de famille jusqu'à invitation explicite à tutoyer, ce qui peut prendre longtemps.",
        gift_protocol: "Des cadeaux modestes et réfléchis sont appréciés. Un cadeau trop généreux peut créer une gêne. Une bouteille de vin ou des fleurs conviennent parfaitement pour une invitation à dîner. Les cadeaux sont généralement ouverts en privé.",
        dress_code: "Il convient d'opter pour une tenue légèrement plus formelle que l'on ne le penserait. Le business formal est de mise pour les réunions. Le smart casual convient à la plupart des occasions. Le Black Tie exige un smoking — jamais un simple costume.",
        dos: [
          "Patienter dans la file d'attente — c'est une norme sociale fondamentale",
          "Accepter le thé lorsqu'il est proposé",
          "Exprimer ses opinions avec mesure et litote",
          "Arriver à l'heure ou quelques minutes en avance",
          "Envoyer un mot de remerciement après une invitation"
        ],
        donts: [
          "Demander directement le salaire ou la valeur du bien immobilier",
          "Passer devant dans la file d'attente",
          "Parler fort dans les espaces publics ou les transports",
          "Aborder des sujets personnels sans y être invité",
          "Refuser le thé sans raison valable"
        ]
      },
      "de-DE": {
        region_name: "Vereinigtes Königreich",
        core_value: "Understatement & Tradition",
        biggest_taboo: "Direkte Fragen zu Geld oder persönlichen Angelegenheiten",
        dining_etiquette: "Britischer Tischstil folgt dem kontinentalen Stil: Gabel in der linken Hand, Messer in der rechten. Der Suppenlöffel wird von sich wegbewegt. Man wartet, bis der Gastgeber mit dem Essen beginnt. Ellbogen gehören nicht auf den Tisch.",
        language_notes: "Britische Kommunikation ist indirekt und von Understatement geprägt. 'Not bad' bedeutet oft ausgezeichnet. Titel (Mr, Mrs, Dr) werden mit Nachnamen verwendet, bis man explizit zur Verwendung des Vornamens eingeladen wird.",
        gift_protocol: "Bescheidene, durchdachte Geschenke sind willkommen. Ein zu aufwendiges Geschenk kann Unbehagen erzeugen. Eine Flasche Wein oder Blumen sind für eine Dinnereinladung angemessen. Geschenke werden üblicherweise privat geöffnet.",
        dress_code: "Im Zweifel formeller kleiden. Geschäftstreffen erfordern formelle Kleidung. Smart Casual passt zu den meisten gesellschaftlichen Anlässen. Black Tie bedeutet Smoking — kein Anzug.",
        dos: [
          "Geduldig in der Schlange warten — dies ist eine wichtige gesellschaftliche Norm",
          "Tee annehmen, wenn er angeboten wird",
          "Meinungen zurückhaltend und mit Understatement äußern",
          "Pünktlich erscheinen oder ein paar Minuten früher",
          "Nach einem Besuch eine Dankesnachricht senden"
        ],
        donts: [
          "Direkt nach Einkommen, Immobilienpreisen oder Finanzen fragen",
          "Die Schlange umgehen",
          "Laut in öffentlichen Räumen oder öffentlichen Verkehrsmitteln sprechen",
          "Persönliche Themen ohne Einladung ansprechen",
          "Tee ohne guten Grund ablehnen"
        ]
      },
      "es-ES": {
        region_name: "Reino Unido",
        core_value: "Discreción & Tradición",
        biggest_taboo: "Hablar directamente sobre dinero o asuntos personales",
        dining_etiquette: "Los modales en la mesa siguen el estilo continental: tenedor en la mano izquierda, cuchillo en la derecha durante toda la comida. La cuchara de sopa se aleja del comensal. Se espera a que el anfitrión comience a comer. Los codos no deben apoyarse en la mesa.",
        language_notes: "La comunicación británica se caracteriza por la eufemización y la indirecta. 'Not bad' (no está mal) suele significar excelente. Se utilizan los títulos Sr., Sra. o Dr. hasta que se le invite explícitamente a usar el nombre de pila.",
        gift_protocol: "Se aprecian los regalos modestos y considerados. Un obsequio excesivamente generoso puede causar incomodidad. Una botella de vino o flores son apropiadas para una invitación a cenar. Los regalos generalmente se abren en privado.",
        dress_code: "En caso de duda, vista de manera más formal. Las reuniones de negocios requieren atuendo formal. El smart casual es adecuado para la mayoría de ocasiones sociales. Black Tie exige esmoquin, no traje.",
        dos: [
          "Guardar la fila con paciencia — es una norma social fundamental",
          "Aceptar el té cuando se ofrezca",
          "Expresar las opiniones con mesura y discreción",
          "Llegar puntual o unos minutos antes",
          "Enviar una nota de agradecimiento tras una visita"
        ],
        donts: [
          "Preguntar directamente por el salario, el precio de la vivienda o las finanzas",
          "Saltarse la fila bajo ningún concepto",
          "Hablar en voz alta en espacios públicos o en el transporte",
          "Abordar temas personales sin haber sido invitado a ello",
          "Rechazar el té sin una razón justificada"
        ]
      },
      "es-MX": {
        region_name: "Reino Unido",
        core_value: "Discreción & Tradición",
        biggest_taboo: "Hablar directamente sobre dinero o asuntos personales",
        dining_etiquette: "Los modales a la mesa en el Reino Unido son al estilo continental: se mantiene el tenedor en la mano izquierda y el cuchillo en la derecha durante toda la comida. La cuchara de sopa se mueve alejándose del comensal. Se espera a que el anfitrión inicie la comida. Los codos se mantienen fuera de la mesa.",
        language_notes: "La comunicación en el Reino Unido tiende a ser indirecta y mesurada. 'Not bad' (no está mal) frecuentemente significa excelente. Se utiliza el tratamiento formal con apellido — Mr., Mrs., Dr. — hasta que se le invite a usar el nombre.",
        gift_protocol: "Los regalos modestos y bien pensados son los más adecuados. Un obsequio demasiado elaborado puede generar cierta incomodidad. Una botella de vino o flores son opciones acertadas para una cena. Los regalos suelen abrirse en privado.",
        dress_code: "Vístase de manera más formal de lo que cree necesario. Las reuniones de trabajo requieren atuendo formal. El smart casual funciona bien para eventos sociales. Black Tie requiere esmoquin.",
        dos: [
          "Respetar la fila — es algo muy importante para los británicos",
          "Aceptar el té cuando se le ofrezca",
          "Expresar sus opiniones con sutileza y moderación",
          "Llegar a tiempo o un poco antes",
          "Agradecer por escrito después de ser invitado"
        ],
        donts: [
          "Preguntar sobre ingresos, precios de propiedades o finanzas personales",
          "Saltarse la fila de ninguna manera",
          "Hablar en voz alta en el transporte público o lugares públicos",
          "Sacar temas personales sin que la persona lo proponga primero",
          "Rechazar el té sin dar una razón"
        ]
      },
      "pt-PT": {
        region_name: "Reino Unido",
        core_value: "Discrição & Tradição",
        biggest_taboo: "Falar diretamente sobre dinheiro ou assuntos pessoais",
        dining_etiquette: "À mesa, utiliza-se o estilo continental: garfo na mão esquerda, faca na direita durante toda a refeição. A colher de sopa afasta-se do conviva. Aguarda-se que o anfitrião comece a comer. Os cotovelos não devem assentar sobre a mesa.",
        language_notes: "A comunicação britânica é indireta e caracterizada pelo understatement. 'Not bad' (não é mau) frequentemente significa excelente. Utilizam-se os títulos Sr., Sra. ou Dr. até que seja expressamente convidado a usar o nome próprio.",
        gift_protocol: "Prendas modestas e consideradas são bem recebidas. Uma prenda demasiado generosa pode causar constrangimento. Uma garrafa de vinho ou flores são escolhas adequadas para um jantar. As prendas são habitualmente abertas em privado.",
        dress_code: "Em caso de dúvida, vista-se de forma mais formal. As reuniões de negócios requerem traje formal. O smart casual é apropriado para a maioria das ocasiões sociais. Black Tie exige smoking — nunca um simples fato.",
        dos: [
          "Aguardar em fila com paciência — é uma norma social fundamental",
          "Aceitar chá quando for oferecido",
          "Expressar opiniões com moderação e contenção",
          "Chegar pontualmente ou ligeiramente antes",
          "Enviar uma nota de agradecimento após uma visita"
        ],
        donts: [
          "Perguntar diretamente sobre salários, preços de imóveis ou finanças",
          "Furar a fila em qualquer circunstância",
          "Falar em voz alta em espaços públicos ou nos transportes",
          "Abordar assuntos pessoais sem ser convidado a fazê-lo",
          "Recusar chá sem uma razão justificada"
        ]
      },
      "pt-BR": {
        region_name: "Reino Unido",
        core_value: "Discrição & Tradição",
        biggest_taboo: "Falar abertamente sobre dinheiro ou assuntos pessoais",
        dining_etiquette: "Na mesa, os britânicos usam o estilo continental: o garfo fica na mão esquerda e a faca na direita durante toda a refeição. A colher de sopa se afasta do corpo. Espere o anfitrião começar antes de comer. Cotovelos fora da mesa.",
        language_notes: "A comunicação britânica é indireta e cheia de nuances. 'Not bad' (não é ruim) costuma significar excelente. Use título e sobrenome — Mr., Mrs., Dr. — até ser convidado a usar o nome.",
        gift_protocol: "Presenteie com moderação e cuidado. Um presente muito caro pode gerar desconforto. Uma garrafa de vinho ou flores são ótimas opções para um jantar. Os presentes costumam ser abertos em particular.",
        dress_code: "Vista-se um pouco mais formalmente do que acha necessário. Reuniões de trabalho exigem traje formal. Smart casual funciona bem para encontros sociais. Black Tie significa smoking, não terno.",
        dos: [
          "Respeite a fila — é algo muito levado a sério pelos britânicos",
          "Aceite o chá quando oferecido — faz parte da hospitalidade",
          "Seja moderado ao expressar opiniões",
          "Chegue na hora ou um pouco antes",
          "Mande uma mensagem de agradecimento após ser recebido"
        ],
        donts: [
          "Perguntar sobre salário, valor de imóveis ou finanças pessoais",
          "Furar a fila de jeito nenhum",
          "Falar alto em locais públicos ou no transporte",
          "Trazer assuntos pessoais sem que a pessoa convide",
          "Recusar o chá sem explicação"
        ]
      },
      "it-IT": {
        region_name: "Regno Unito",
        core_value: "Understatement & Tradizione",
        biggest_taboo: "Parlare apertamente di denaro o di questioni personali",
        dining_etiquette: "Lo stile continentale è la norma: la forchetta rimane nella mano sinistra, il coltello nella destra per tutta la durata del pasto. Il cucchiaio da minestra si allontana dal commensale. Si attende che il padrone di casa inizi a mangiare. I gomiti non devono appoggiarsi al tavolo.",
        language_notes: "La comunicazione britannica è indiretta e caratterizzata dall'understatement. 'Not bad' (non male) significa spesso eccellente. Si usano i titoli — Signor, Signora, Dottore — finché non si viene espressamente invitati a usare il nome di battesimo.",
        gift_protocol: "Si apprezzano i doni sobri e premurosi. Un regalo eccessivamente generoso può creare imbarazzo. Una bottiglia di vino o dei fiori sono scelte appropriate per una cena. I regali vengono generalmente aperti in privato.",
        dress_code: "In caso di dubbio, optare per un abbigliamento più formale. Le riunioni di lavoro richiedono un abito formale. Lo smart casual è adeguato per la maggior parte delle occasioni sociali. Il Black Tie richiede lo smoking, mai un semplice abito.",
        dos: [
          "Attendere pazientemente in fila — è una norma sociale fondamentale",
          "Accettare il tè quando viene offerto",
          "Esprimere le proprie opinioni con misura e discrezione",
          "Arrivare puntuali o qualche minuto prima",
          "Inviare un messaggio di ringraziamento dopo una visita"
        ],
        donts: [
          "Chiedere direttamente dello stipendio, del valore immobiliare o delle finanze personali",
          "Saltare la fila in qualsiasi circostanza",
          "Parlare ad alta voce in luoghi pubblici o sui mezzi di trasporto",
          "Affrontare argomenti personali senza esservi invitati",
          "Rifiutare il tè senza una valida ragione"
        ]
      },
      "hi-IN": {
        region_name: "यूनाइटेड किंगडम",
        core_value: "संयम और परंपरा",
        biggest_taboo: "पैसे या व्यक्तिगत मामलों के बारे में सीधे बात करना",
        dining_etiquette: "ब्रिटेन में महाद्वीपीय शैली का पालन होता है — कांटा बाएं हाथ में और चाकू दाएं हाथ में रहता है। सूप का चम्मच आपसे दूर की ओर चलाया जाता है। जब तक मेज़बान खाना शुरू न करें, प्रतीक्षा करें। कोहनी मेज़ पर नहीं रखनी चाहिए।",
        language_notes: "ब्रिटिश संवाद अप्रत्यक्ष और संयमित होता है। 'Not bad' का अर्थ प्रायः उत्कृष्ट होता है। पहले नाम का उपयोग तब तक न करें जब तक आमंत्रण न मिले — Mr, Mrs या Dr के साथ उपनाम का प्रयोग करें।",
        gift_protocol: "साधारण और सोच-समझकर दिए गए उपहार उचित होते हैं। अत्यधिक कीमती उपहार असुविधा उत्पन्न कर सकते हैं। डिनर निमंत्रण के लिए एक बोतल वाइन या फूल उपयुक्त हैं। उपहार आमतौर पर निजी रूप से खोले जाते हैं।",
        dress_code: "संदेह होने पर अधिक औपचारिक वस्त्र पहनें। व्यावसायिक बैठकों में औपचारिक पोशाक आवश्यक है। अधिकांश सामाजिक अवसरों के लिए स्मार्ट कैजुअल उचित है। 'Black Tie' का अर्थ डिनर जैकेट है — साधारण सूट नहीं।",
        dos: [
          "धैर्य के साथ पंक्ति में प्रतीक्षा करें — यह महत्वपूर्ण सामाजिक नियम है",
          "जब चाय प्रदान की जाए तो स्वीकार करें",
          "अपनी राय संयम और विनम्रता से व्यक्त करें",
          "समय पर या थोड़ा पहले पहुँचें",
          "किसी के घर आमंत्रित होने के बाद धन्यवाद संदेश भेजें"
        ],
        donts: [
          "सीधे वेतन, संपत्ति के मूल्य या वित्त के बारे में न पूछें",
          "पंक्ति को कभी न तोड़ें",
          "सार्वजनिक स्थानों पर ऊंची आवाज़ में न बोलें",
          "बिना आमंत्रण के व्यक्तिगत विषय न उठाएं",
          "बिना कारण चाय अस्वीकार न करें"
        ]
      }
    }
  },
  {
    region_code: "CN",
    flag_emoji: "🇨🇳",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "China",
        core_value: "Mianzi (Face) & Guanxi (Relationships)",
        biggest_taboo: "Causing someone to lose face in the presence of others",
        dining_etiquette: "One waits to be seated in order of seniority. The host orders on behalf of the table and settles the bill. Chopsticks must never be placed upright in rice — this carries the association of funeral incense. Pouring tea for others before oneself is a mark of respect.",
        language_notes: "Address by family name and title. In meetings, seniority governs the order of speech. Business cards are exchanged with both hands and a slight bow, studied carefully before being set aside with respect.",
        gift_protocol: "Gifts are presented and received with both hands. They are not opened at the moment of receipt. Avoid clocks (associated with death), green hats, or shoes. Red envelopes containing money are appropriate for celebrations.",
        dress_code: "Conservative and formal for business. Avoid white or black for celebratory occasions, as both carry associations with mourning. Modest dress is required when visiting places of worship.",
        dos: [
          "Present and receive business cards with both hands",
          "Allow the host to order at meals",
          "Accept all food and drink offered, even in small amounts",
          "Show deference to seniority in all interactions",
          "Invest time in building relationships before discussing business"
        ],
        donts: [
          "Cause anyone to lose face publicly",
          "Decline offered food or drink without explanation",
          "Present clocks or shoes as gifts",
          "Point at someone with the index finger",
          "Raise the topics of Taiwan, Tibet, or Tiananmen Square"
        ]
      },
      "en-US": {
        region_name: "China",
        core_value: "Mianzi (Face) & Guanxi (Relationships)",
        biggest_taboo: "Publicly embarrassing or humiliating someone",
        dining_etiquette: "Seating is by seniority — wait to be directed. The host typically orders for everyone and pays. Never stick chopsticks upright in a bowl of rice (it's a funeral symbol). Pour tea for others before refilling your own cup.",
        language_notes: "Use last names and titles. In meetings, the most senior person speaks first. Exchange business cards with both hands, look at it carefully — tossing it aside is considered rude.",
        gift_protocol: "Always give and receive gifts with both hands. Don't open gifts immediately — wait until later. Avoid clocks, umbrellas (both suggest 'ending'), and shoes. Red envelopes with money are a great gift for special occasions.",
        dress_code: "Conservative business formal. Skip white or black for celebrations — these are mourning colors. Dress modestly at temples and religious sites.",
        dos: [
          "Use both hands when exchanging business cards",
          "Let the host order the food — it's their role",
          "Try everything offered — refusing is impolite",
          "Respect hierarchy and seniority at all times",
          "Build personal relationships before getting to business"
        ],
        donts: [
          "Embarrass someone in front of others — face is everything",
          "Turn down food or drinks without a good reason",
          "Give clocks or shoes as gifts",
          "Point at people with your index finger",
          "Bring up Taiwan, Tibet, or Tiananmen Square"
        ]
      },
      "en-AU": {
        region_name: "China",
        core_value: "Face (Mianzi) & Relationships (Guanxi)",
        biggest_taboo: "Embarrassing someone in front of others",
        dining_etiquette: "Sit according to seniority and wait to be directed. The host will usually order for the table and pay. Don't stick chopsticks upright in rice — that's a death symbol. Pour tea for others before you pour your own.",
        language_notes: "Use family name and title, not first names. In meetings, the senior person speaks first. Handle business cards with both hands and take a moment to look at them properly.",
        gift_protocol: "Give and receive with both hands. Don't open the gift straight away. Avoid clocks and shoes — bad associations. Red envelopes with cash are a good call for celebrations.",
        dress_code: "Keep it conservative and formal for business. Don't wear white or black to celebrations — they're mourning colours. Cover up at temples.",
        dos: [
          "Use both hands for business cards — always",
          "Let the host order the meal",
          "At least taste what's offered to you",
          "Respect the hierarchy and the older folks in the room",
          "Get to know people before pushing the business agenda"
        ],
        donts: [
          "Make someone look bad in front of others — it's a big deal",
          "Flat-out refuse food or drinks",
          "Give clocks or shoes as gifts",
          "Point at someone with one finger",
          "Start conversations about Taiwan, Tibet, or Tiananmen"
        ]
      },
      "en-CA": {
        region_name: "China",
        core_value: "Mianzi (Face) & Guanxi (Relationships)",
        biggest_taboo: "Publicly embarrassing or causing someone to lose face",
        dining_etiquette: "Seating follows seniority — wait to be directed. The host orders and pays for the table. Do not place chopsticks upright in a rice bowl, as this symbolizes a funeral offering. Pour tea for others before yourself as a sign of respect.",
        language_notes: "Address by surname and title. The most senior person leads in conversation during meetings. Exchange business cards with both hands and treat them with care — reading the card attentively before setting it down.",
        gift_protocol: "Gifts are offered and received with both hands. Opening a gift immediately is not customary. Clocks and shoes are inappropriate gifts. Red envelopes with money are a welcome gesture for celebrations.",
        dress_code: "Business formal and conservative. White and black are avoided for celebrations due to their association with mourning. Modest attire is appropriate at places of worship.",
        dos: [
          "Exchange business cards with both hands respectfully",
          "Allow the host to order and initiate at meals",
          "Accept food and drink offered to you",
          "Defer to seniority in conversation and seating",
          "Build trust and relationship before raising business matters"
        ],
        donts: [
          "Cause anyone to lose face — this is deeply serious",
          "Decline food or drink without a clear reason",
          "Give clocks, shoes, or umbrellas as gifts",
          "Point with the index finger",
          "Raise Taiwan, Tibet, or Tiananmen Square in conversation"
        ]
      },
      "nl-NL": {
        region_name: "China",
        core_value: "Mianzi (Gezichtsverlies) & Guanxi (Relaties)",
        biggest_taboo: "Iemand publiekelijk in verlegenheid brengen",
        dining_etiquette: "Zitplaatsen worden bepaald op basis van senioriteit — wacht tot u wordt gewezen waar u kunt plaatsnemen. De gastheer bestelt namens de tafel en betaalt de rekening. Stokjes nooit rechtop in de rijst plaatsen — dit verwijst naar een begrafenis. Thee eerst voor anderen inschenken is een teken van respect.",
        language_notes: "Spreek iemand aan bij achternaam en titel. In vergaderingen geeft de meest seniore persoon als eerste het woord. Visitekaartjes worden met beide handen uitgewisseld en met aandacht bekeken voor ze worden weggelegd.",
        gift_protocol: "Geef en ontvang cadeaus met beide handen. Cadeaus worden niet direct geopend. Vermijd klokken (geassocieerd met de dood), schoenen en groene hoeden. Rode enveloppen met geld zijn gepast voor feestelijke gelegenheden.",
        dress_code: "Conservatief en formeel voor zakelijke gelegenheden. Vermijd wit of zwart bij feestelijke gelegenheden — dit zijn rouwkleuren. Bescheiden kleding is vereist bij religieuze plaatsen.",
        dos: [
          "Visitekaartjes met beide handen uitwisselen",
          "Laat de gastheer de maaltijd bestellen",
          "Aanvaard al het aangeboden eten en drinken",
          "Respecteer hiërarchie en senioriteit",
          "Bouw eerst aan de relatie voordat u zaken doet"
        ],
        donts: [
          "Iemand publiekelijk laten gezichtsverlies lijden",
          "Aangeboden eten of drinken weigeren zonder uitleg",
          "Klokken of schoenen cadeau geven",
          "Met de wijsvinger naar iemand wijzen",
          "Taiwan, Tibet of Tiananmen ter sprake brengen"
        ]
      },
      "fr-FR": {
        region_name: "Chine",
        core_value: "Mianzi (Face) & Guanxi (Relations)",
        biggest_taboo: "Faire perdre la face à quelqu'un en public",
        dining_etiquette: "On s'assoit selon l'ordre de préséance — on attend d'être guidé. L'hôte commande pour tout le monde et règle l'addition. Ne jamais placer les baguettes verticalement dans le riz — cela évoque une offrande funéraire. Verser le thé pour les autres avant soi-même est un signe de respect.",
        language_notes: "On s'adresse aux personnes par leur nom de famille et leur titre. En réunion, c'est la personne la plus haut placée qui prend la parole en premier. Les cartes de visite s'échangent des deux mains et sont lues attentivement.",
        gift_protocol: "Les cadeaux se donnent et se reçoivent des deux mains. On ne les ouvre pas immédiatement. Éviter les horloges (symbole de mort), les chaussures et les chapeaux verts. Les enveloppes rouges contenant de l'argent sont bienvenues lors des célébrations.",
        dress_code: "Tenue professionnelle et conservative. Le blanc et le noir sont à éviter lors des festivités, ces couleurs étant associées au deuil. La modestie vestimentaire est requise dans les lieux de culte.",
        dos: [
          "Échanger les cartes de visite des deux mains",
          "Laisser l'hôte commander le repas",
          "Accepter tout ce qui est proposé à manger ou à boire",
          "Respecter la hiérarchie et la préséance",
          "Établir une relation de confiance avant d'aborder les affaires"
        ],
        donts: [
          "Faire perdre la face à quelqu'un — c'est une offense grave",
          "Refuser la nourriture ou la boisson sans explication",
          "Offrir des horloges ou des chaussures",
          "Pointer du doigt",
          "Évoquer Taïwan, le Tibet ou Tiananmen"
        ]
      },
      "de-DE": {
        region_name: "China",
        core_value: "Mianzi (Gesicht) & Guanxi (Beziehungen)",
        biggest_taboo: "Jemanden öffentlich in Verlegenheit bringen",
        dining_etiquette: "Die Sitzordnung richtet sich nach Seniorität — warten Sie auf Anweisung. Der Gastgeber bestellt für die gesamte Tischgesellschaft und begleicht die Rechnung. Stäbchen dürfen nicht aufrecht in den Reis gesteckt werden — dies ist ein Beerdigungssymbol. Tee wird zuerst für andere eingeschenkt.",
        language_notes: "Anrede mit Nachname und Titel. In Besprechungen hat die ranghöchste Person das erste Wort. Visitenkarten werden mit beiden Händen ausgetauscht, sorgfältig gelesen und respektvoll abgelegt.",
        gift_protocol: "Geschenke werden mit beiden Händen überreicht und entgegengenommen. Sie werden nicht sofort geöffnet. Uhren (Symbol für den Tod) und Schuhe sind als Geschenke ungeeignet. Rote Umschläge mit Geld sind für Feiern angemessen.",
        dress_code: "Konservativ und formell für geschäftliche Anlässe. Weiß und Schwarz bei Feierlichkeiten vermeiden — Trauerfarben. Bescheidene Kleidung an religiösen Stätten.",
        dos: [
          "Visitenkarten mit beiden Händen austauschen",
          "Den Gastgeber die Bestellung übernehmen lassen",
          "Angebotenes Essen und Trinken annehmen",
          "Seniorität und Hierarchie respektieren",
          "Erst Beziehungen aufbauen, dann Geschäfte besprechen"
        ],
        donts: [
          "Jemanden öffentlich das Gesicht verlieren lassen",
          "Angebotenes Essen oder Trinken ohne Erklärung ablehnen",
          "Uhren oder Schuhe verschenken",
          "Mit dem Zeigefinger auf jemanden zeigen",
          "Taiwan, Tibet oder Tiananmen ansprechen"
        ]
      },
      "es-ES": {
        region_name: "China",
        core_value: "Mianzi (El Honor) & Guanxi (Las Relaciones)",
        biggest_taboo: "Hacer perder el honor a alguien en público",
        dining_etiquette: "Los asientos se asignan según la jerarquía — espere a ser indicado. El anfitrión pide por todos y paga la cuenta. Nunca coloque los palillos en posición vertical dentro del arroz — es un símbolo funerario. Sirva el té a los demás antes que a usted mismo.",
        language_notes: "Dirígase a las personas por su apellido y título. En las reuniones, la persona de mayor rango toma la palabra primero. Las tarjetas de presentación se intercambian con ambas manos y se leen con atención.",
        gift_protocol: "Los regalos se entregan y reciben con ambas manos. No se abren en el momento. Evite los relojes (simbolizan la muerte) y el calzado. Los sobres rojos con dinero son apropiados para celebraciones.",
        dress_code: "Vestimenta conservadora y formal para los negocios. Evite el blanco y el negro en celebraciones — son colores de luto. Vístase con modestia al visitar lugares de culto.",
        dos: [
          "Intercambiar tarjetas de presentación con ambas manos",
          "Dejar que el anfitrión ordene la comida",
          "Aceptar todo lo que se le ofrezca",
          "Respetar la jerarquía y la antigüedad",
          "Cultivar la relación antes de hablar de negocios"
        ],
        donts: [
          "Hacer perder el honor a alguien públicamente",
          "Rechazar comida o bebida sin explicación",
          "Regalar relojes o calzado",
          "Señalar con el dedo índice",
          "Hablar de Taiwán, el Tíbet o Tiananmen"
        ]
      },
      "es-MX": {
        region_name: "China",
        core_value: "Mianzi (El Honor) & Guanxi (Las Relaciones)",
        biggest_taboo: "Hacer quedar mal a alguien frente a los demás",
        dining_etiquette: "La disposición en la mesa sigue la jerarquía — espere a que le indiquen su lugar. El anfitrión acostumbra pedir por todos y pagar. Nunca coloque los palillos de pie en el arroz — es símbolo de funeral. Sirva el té a los demás antes que a usted.",
        language_notes: "Llame a las personas por su apellido y título. En juntas, quien tiene mayor rango habla primero. Las tarjetas de presentación se dan y reciben con las dos manos, y se leen con respeto antes de guardarlas.",
        gift_protocol: "Los obsequios se entregan y reciben con ambas manos. No se abren de inmediato. Evite los relojes y el calzado como regalos. Los sobres rojos con dinero son muy bien recibidos en celebraciones.",
        dress_code: "Ropa formal y conservadora para negocios. Evite el blanco y el negro en fiestas — están asociados al luto. Vístase de forma modesta en templos y sitios religiosos.",
        dos: [
          "Dar y recibir tarjetas de presentación con las dos manos",
          "Dejar que el anfitrión ordene la comida",
          "Aceptar lo que le ofrezcan de comer y beber",
          "Mostrar respeto por la jerarquía",
          "Construir confianza antes de hablar de negocios"
        ],
        donts: [
          "Hacer quedar mal a alguien en público — es algo muy grave",
          "Rechazar comida o bebida sin razón",
          "Regalar relojes o zapatos",
          "Señalar con el dedo",
          "Hablar de Taiwán, el Tíbet o Tiananmen"
        ]
      },
      "pt-PT": {
        region_name: "China",
        core_value: "Mianzi (Rosto) & Guanxi (Relações)",
        biggest_taboo: "Fazer com que alguém perca o rosto em público",
        dining_etiquette: "Os lugares à mesa são atribuídos por ordem de hierarquia — aguarde indicação. O anfitrião pede para todos e paga a conta. Nunca coloque os pauzinhos em posição vertical dentro do arroz — é um símbolo funerário. Sirva o chá para os outros antes de se servir a si próprio.",
        language_notes: "Dirija-se às pessoas pelo apelido e título. Em reuniões, o mais graduado toma a palavra em primeiro lugar. As cartões de visita trocam-se com ambas as mãos e lêem-se com cuidado antes de serem pousados.",
        gift_protocol: "Os presentes são dados e recebidos com ambas as mãos. Não se abrem de imediato. Evite relógios (conotação com a morte) e calçado. Envelopes vermelhos com dinheiro são adequados para comemorações.",
        dress_code: "Traje conservador e formal para negócios. Evite o branco e o preto em ocasiões festivas — são cores de luto. Use vestuário modesto em locais de culto.",
        dos: [
          "Trocar cartões de visita com ambas as mãos",
          "Deixar o anfitrião pedir a refeição",
          "Aceitar tudo o que for oferecido para comer ou beber",
          "Respeitar a hierarquia e a precedência",
          "Construir a relação antes de abordar negócios"
        ],
        donts: [
          "Fazer alguém perder o rosto em público",
          "Recusar comida ou bebida sem explicação",
          "Oferecer relógios ou calçado como prenda",
          "Apontar com o dedo indicador",
          "Mencionar Taiwan, o Tibete ou Tiananmen"
        ]
      },
      "pt-BR": {
        region_name: "China",
        core_value: "Mianzi (Honra) & Guanxi (Relações)",
        biggest_taboo: "Fazer alguém passar vergonha em público",
        dining_etiquette: "Os lugares à mesa seguem a hierarquia — espere ser indicado. O anfitrião geralmente pede para todos e paga a conta. Nunca deixe os palitinhos espetados no arroz — é um símbolo de funeral. Sirva o chá para os outros antes de se servir.",
        language_notes: "Use sobrenome e título. Em reuniões, quem tem mais autoridade fala primeiro. Cartões de visita são trocados com as duas mãos e lidos com atenção — jogá-los fora rapidamente é desrespeitoso.",
        gift_protocol: "Presentes se dão e recebem com as duas mãos. Não os abra na hora — deixe para depois. Evite relógios e sapatos como presentes. Envelopes vermelhos com dinheiro são ótimos para comemorações.",
        dress_code: "Formal e conservador para negócios. Evite branco e preto em festas — são cores de luto. Vista-se com modéstia em templos.",
        dos: [
          "Use sempre as duas mãos ao trocar cartões",
          "Deixe o anfitrião pedir a comida",
          "Prove o que for oferecido — recusar pode ser ofensivo",
          "Respeite a hierarquia",
          "Construa a relação pessoal antes de falar de negócios"
        ],
        donts: [
          "Fazer alguém passar vergonha na frente dos outros",
          "Recusar comida ou bebida sem motivo",
          "Dar relógios ou sapatos de presente",
          "Apontar com o dedo",
          "Falar de Taiwan, Tibet ou Tiananmen"
        ]
      },
      "it-IT": {
        region_name: "Cina",
        core_value: "Mianzi (Onore) & Guanxi (Relazioni)",
        biggest_taboo: "Far perdere la faccia a qualcuno in pubblico",
        dining_etiquette: "I posti a tavola seguono l'ordine gerarchico — attendere di essere guidati. Il padrone di casa ordina per tutti e paga il conto. Non conficcate mai le bacchette verticalmente nel riso — è un simbolo funebre. Versate il tè per gli altri prima di versarlo a voi stessi.",
        language_notes: "Ci si rivolge alle persone con il cognome e il titolo. In riunione, parla per prima la persona di rango più elevato. I biglietti da visita si scambiano con entrambe le mani e si leggono con attenzione prima di riporli.",
        gift_protocol: "I regali si donano e si ricevono con entrambe le mani. Non si aprono immediatamente. Evitare orologi (associati alla morte) e scarpe come regalo. Le buste rosse con denaro sono gradite per le celebrazioni.",
        dress_code: "Abbigliamento conservativo e formale per gli affari. Evitare il bianco e il nero nelle celebrazioni — colori del lutto. Abbigliamento discreto è richiesto nei luoghi di culto.",
        dos: [
          "Scambiare i biglietti da visita con entrambe le mani",
          "Lasciare che il padrone di casa ordini il pasto",
          "Accettare tutto ciò che viene offerto da mangiare e bere",
          "Rispettare la gerarchia e l'anzianità",
          "Costruire un rapporto di fiducia prima di affrontare gli affari"
        ],
        donts: [
          "Far perdere la faccia a qualcuno in pubblico",
          "Rifiutare cibo o bevande senza spiegazione",
          "Regalare orologi o scarpe",
          "Indicare qualcuno con il dito indice",
          "Menzionare Taiwan, il Tibet o piazza Tiananmen"
        ]
      },
      "hi-IN": {
        region_name: "चीन",
        core_value: "मियान्ज़ी (सम्मान) और गुआनशी (संबंध)",
        biggest_taboo: "किसी को सार्वजनिक रूप से अपमानित करना",
        dining_etiquette: "बैठने की व्यवस्था वरिष्ठता के अनुसार होती है — निर्देश की प्रतीक्षा करें। मेज़बान सबके लिए ऑर्डर करता है और बिल देता है। चॉपस्टिक को कभी भी चावल में खड़ी नहीं रखें — यह अंतिम संस्कार का प्रतीक है। पहले दूसरों के लिए चाय डालें।",
        language_notes: "अंतिम नाम और पदवी से संबोधन करें। बैठकों में वरिष्ठ व्यक्ति पहले बोलते हैं। बिज़नेस कार्ड दोनों हाथों से दें और लें — इसे ध्यान से पढ़ें।",
        gift_protocol: "उपहार दोनों हाथों से दें और लें। उपहार तुरंत न खोलें। घड़ियाँ (मृत्यु से संबंधित) और जूते उपहार में न दें। उत्सव के लिए लाल लिफाफे में पैसे देना उचित है।",
        dress_code: "व्यावसायिक अवसरों के लिए रूढ़िवादी और औपचारिक वेशभूषा। उत्सवों पर सफेद और काले रंग से बचें — ये शोक के रंग हैं। धार्मिक स्थलों पर शालीन पोशाक पहनें।",
        dos: [
          "बिज़नेस कार्ड दोनों हाथों से दें",
          "भोजन का ऑर्डर मेज़बान को करने दें",
          "जो भी खाने-पीने के लिए दिया जाए, स्वीकार करें",
          "वरिष्ठता और पदानुक्रम का सम्मान करें",
          "व्यवसाय से पहले संबंध बनाएं"
        ],
        donts: [
          "किसी को सार्वजनिक रूप से शर्मिंदा न करें",
          "बिना कारण खाना-पीना अस्वीकार न करें",
          "घड़ी या जूते उपहार में न दें",
          "किसी पर उंगली न उठाएं",
          "ताइवान, तिब्बत या तियानमेन का विषय न छेड़ें"
        ]
      }
    }
  },
  {
    region_code: "CA",
    flag_emoji: "🇨🇦",
    content: {
      "en-GB": {
        region_name: "Canada",
        core_value: "Equality, Inclusivity & Courtesy",
        biggest_taboo: "Presuming someone's cultural background or preferred language",
        dining_etiquette: "The atmosphere is informally professional. Bills are frequently split. A gratuity of fifteen to twenty percent is customary and expected. Dietary requirements and preferences are taken seriously and accommodated without fuss.",
        language_notes: "Canada is officially bilingual; French is the primary language in Québec and expected in federal contexts. First names are adopted fairly quickly. Inclusive and respectful language is highly valued across all interactions.",
        gift_protocol: "Thoughtful gifts are welcome, though they are not expected in business settings. For social occasions, wine, local produce, or a well-chosen book are appropriate. Host gifts are genuinely appreciated.",
        dress_code: "Smart casual for most business contexts. Formal when the occasion stipulates it. Outdoor practical wear is acceptable in many social settings, reflecting Canada's strong connection with the natural environment.",
        dos: [
          "Acknowledge Indigenous land and heritage where appropriate",
          "Hold doors open for those following behind you",
          "Apologise readily — it is considered a social grace",
          "Respect personal space, approximately an arm's length",
          "Acknowledge both English and French cultural contexts"
        ],
        donts: [
          "Assume everyone communicates exclusively in English or French",
          "Draw unfavourable comparisons with the United States",
          "Disregard personal boundaries",
          "Arrive late without prior notice",
          "Make assumptions about cultural or national identity"
        ]
      },
      "en-US": {
        region_name: "Canada",
        core_value: "Equality, Inclusivity & Courtesy",
        biggest_taboo: "Assuming someone's cultural background or which language they prefer",
        dining_etiquette: "Casual and friendly atmosphere. Bills are often split evenly. Tip 15-20% — it's expected. Food allergies and dietary preferences are taken seriously and accommodated without issue.",
        language_notes: "Canada is officially bilingual — French and English. In Quebec, French is the main language. First names are used pretty quickly. Inclusive language matters a lot across Canada.",
        gift_protocol: "Gifts aren't expected in business but are welcomed at social events. Wine, local goods, or a good book work well. Host gifts are genuinely appreciated.",
        dress_code: "Smart casual works for most business settings. Go formal when the invite says so. Practical outdoor wear is completely fine for social occasions — Canadians love the outdoors.",
        dos: [
          "Acknowledge Indigenous land when appropriate",
          "Hold doors open — it's just polite",
          "Apologize readily — Canadians do it a lot and mean it",
          "Keep a respectful personal space",
          "Be aware that both English and French are part of Canadian identity"
        ],
        donts: [
          "Assume everyone speaks only English",
          "Constantly compare Canada to the US — it gets old fast",
          "Invade personal space",
          "Show up late without letting someone know",
          "Make assumptions about where someone is from or their identity"
        ]
      },
      "en-AU": {
        region_name: "Canada",
        core_value: "Equality, Inclusivity & Being Decent to People",
        biggest_taboo: "Assuming where someone is from or what language they speak",
        dining_etiquette: "Pretty relaxed and friendly. Splitting the bill is common. Tip around 15-20%. People take dietary needs seriously, so don't stress about asking.",
        language_notes: "Canada has two official languages — English and French. In Quebec, French is it. People are on a first-name basis pretty quickly. Inclusive language is taken seriously.",
        gift_protocol: "You don't need to bring a gift to business meetings. For social events, wine or local produce is always a winner. A host gift goes a long way.",
        dress_code: "Smart casual for most work stuff. Dress up if the event calls for it. Practical gear outdoors is totally fine — Canadians spend a lot of time outside.",
        dos: [
          "Acknowledge Indigenous heritage when it's the right moment",
          "Hold doors — it's just the done thing",
          "Say sorry easily — it's part of the culture",
          "Give people their space",
          "Remember both French and English matter to Canadians"
        ],
        donts: [
          "Assume everyone only speaks English",
          "Keep comparing Canada to the US — they don't love it",
          "Get too close in someone's personal bubble",
          "Show up late without a heads-up",
          "Presume where someone is from or what their background is"
        ]
      },
      "en-CA": {
        region_name: "Canada",
        core_value: "Equality, Inclusivity & Courtesy",
        biggest_taboo: "Assuming someone's cultural background or language preference",
        dining_etiquette: "Meals are typically relaxed and collegial. Splitting the bill is common and accepted. Tipping 15-20% is standard practice. Dietary preferences and restrictions are respected and readily accommodated.",
        language_notes: "Canada's two official languages are English and French — French is the primary language in Québec and expected in federal settings. First names are used relatively quickly. Inclusive and respectful language is a deeply held value.",
        gift_protocol: "Gifts are not expected in professional settings, but are warmly received in social ones. Wine, locally made products, or a thoughtful book are good choices. Acknowledging a host's effort is always appreciated.",
        dress_code: "Smart casual suits most business environments. Formal attire when the occasion calls for it. Practical outdoor clothing is appropriate for many social situations, given Canadians' close relationship with the outdoors.",
        dos: [
          "Acknowledge Indigenous land and heritage when contextually appropriate",
          "Hold doors for others — it is a common courtesy",
          "Apologise readily — it signals awareness and goodwill, not weakness",
          "Maintain a comfortable personal distance (roughly arm's length)",
          "Be mindful of both French and English cultural contexts"
        ],
        donts: [
          "Assume everyone speaks only English or only French",
          "Draw unfavourable or dismissive comparisons with the United States",
          "Disregard personal boundaries",
          "Arrive late without prior communication",
          "Make assumptions about cultural background or national identity"
        ]
      },
      "nl-NL": {
        region_name: "Canada",
        core_value: "Gelijkheid, Inclusiviteit & Beleefdheid",
        biggest_taboo: "Veronderstellingen maken over iemands culturele achtergrond of taal",
        dining_etiquette: "De sfeer is informeel maar professioneel. De rekening wordt vaak gesplitst. Een fooi van 15 tot 20% is gebruikelijk en wordt verwacht. Dieetwensen worden serieus genomen en zonder omwegen gehonoreerd.",
        language_notes: "Canada is officieel tweetalig — Engels en Frans. In Québec is Frans de voertaal. Voornamen worden snel gebruikt. Inclusief taalgebruik is een gedeelde waarde.",
        gift_protocol: "Cadeaus worden niet verwacht in een zakelijke context, maar zijn welkom bij sociale gelegenheden. Wijn, streekproducten of een doordacht boek zijn goede keuzes. Een gastheergeschenk wordt altijd gewaardeerd.",
        dress_code: "Smart casual voor de meeste zakelijke situaties. Formeel als de gelegenheid erom vraagt. Praktische buitenkleding is acceptabel voor veel sociale gelegenheden.",
        dos: [
          "Erken de inheemse erfenis waar dat past",
          "Houd deuren open voor mensen achter u",
          "Bied verontschuldigingen aan — dit is een sociale deugd",
          "Respecteer de persoonlijke ruimte (ongeveer een armlengte)",
          "Erken zowel de Engelstalige als Franstalige culturele context"
        ],
        donts: [
          "Aannemen dat iedereen uitsluitend Engels of Frans spreekt",
          "Canada ongunstig vergelijken met de Verenigde Staten",
          "Persoonlijke grenzen negeren",
          "Te laat komen zonder voorafgaand bericht",
          "Veronderstellingen maken over culturele of nationale identiteit"
        ]
      },
      "fr-FR": {
        region_name: "Canada",
        core_value: "Égalité, Inclusion & Courtoisie",
        biggest_taboo: "Présumer de l'origine culturelle ou de la langue préférée de quelqu'un",
        dining_etiquette: "L'ambiance est informelle et conviviale. L'addition est souvent partagée. Un pourboire de 15 à 20 % est attendu. Les préférences alimentaires sont prises au sérieux et accommodées sans difficulté.",
        language_notes: "Le Canada est officiellement bilingue — anglais et français. Au Québec, le français est la langue principale. Les prénoms sont adoptés assez rapidement. Le langage inclusif est une valeur profondément ancrée.",
        gift_protocol: "Les cadeaux ne sont pas attendus en contexte professionnel, mais bienvenus lors d'occasions sociales. Vin, produits locaux ou livre judicieusement choisi conviennent parfaitement. L'attention portée à l'hôte est toujours appréciée.",
        dress_code: "Smart casual pour la plupart des contextes professionnels. Tenue formelle si l'occasion le précise. Les vêtements pratiques d'extérieur sont acceptés dans de nombreuses situations sociales.",
        dos: [
          "Reconnaître le territoire et l'héritage autochtones lorsque c'est approprié",
          "Tenir la porte pour les personnes qui suivent",
          "S'excuser facilement — c'est un code social valorisé",
          "Respecter l'espace personnel (environ un bras de distance)",
          "Tenir compte à la fois du contexte francophone et anglophone"
        ],
        donts: [
          "Supposer que tout le monde parle uniquement anglais ou uniquement français",
          "Comparer défavorablement le Canada aux États-Unis",
          "Ignorer les limites personnelles",
          "Arriver en retard sans prévenir",
          "Présumer de l'identité culturelle ou nationale de quelqu'un"
        ]
      },
      "de-DE": {
        region_name: "Kanada",
        core_value: "Gleichheit, Inklusivität & Höflichkeit",
        biggest_taboo: "Annahmen über den kulturellen Hintergrund oder die bevorzugte Sprache einer Person",
        dining_etiquette: "Die Atmosphäre ist informell-professionell. Die Rechnung wird häufig geteilt. Ein Trinkgeld von 15 bis 20 % wird erwartet. Ernährungspräferenzen werden ernst genommen und unkompliziert berücksichtigt.",
        language_notes: "Kanada ist offiziell zweisprachig — Englisch und Französisch. In Québec ist Französisch die Hauptsprache. Vornamen werden relativ schnell verwendet. Inklusive Sprache ist ein verbreiteter Wert.",
        gift_protocol: "Geschenke werden im beruflichen Umfeld nicht erwartet, bei sozialen Anlässen jedoch gern gesehen. Wein, regionale Produkte oder ein gut gewähltes Buch sind passend. Gastgeschenke werden aufrichtig gewürdigt.",
        dress_code: "Smart Casual für die meisten beruflichen Kontexte. Formell bei entsprechendem Anlass. Praktische Outdoor-Kleidung ist in vielen gesellschaftlichen Situationen akzeptabel.",
        dos: [
          "Indigenes Erbe anerkennen, wenn der Kontext es erfordert",
          "Türen für nachfolgende Personen offenhalten",
          "Bereitwillig entschuldigen — es gilt als soziale Tugend",
          "Persönlichen Abstand respektieren (etwa eine Armlänge)",
          "Sowohl den englischsprachigen als auch den frankophonen Kontext berücksichtigen"
        ],
        donts: [
          "Davon ausgehen, dass alle nur Englisch oder Französisch sprechen",
          "Kanada ungünstig mit den USA vergleichen",
          "Persönliche Grenzen missachten",
          "Ohne Ankündigung zu spät erscheinen",
          "Annahmen über kulturelle oder nationale Identität treffen"
        ]
      },
      "es-ES": {
        region_name: "Canadá",
        core_value: "Igualdad, Inclusión & Cortesía",
        biggest_taboo: "Presuponer el origen cultural o el idioma preferido de alguien",
        dining_etiquette: "El ambiente es informalmente profesional. La cuenta suele dividirse. Se espera una propina de entre el 15 y el 20%. Las preferencias y restricciones alimentarias se toman en serio y se atienden sin complicaciones.",
        language_notes: "Canadá tiene dos idiomas oficiales — inglés y francés. En Québec, el francés es el idioma principal. El tuteo y el uso del nombre de pila se adoptan con relativa rapidez. El lenguaje inclusivo es un valor ampliamente compartido.",
        gift_protocol: "Los regalos no se esperan en el ámbito profesional, pero son bienvenidos en contextos sociales. Vino, productos locales o un libro bien elegido son opciones acertadas. Los detalles para el anfitrión siempre son apreciados.",
        dress_code: "Smart casual para la mayoría de los contextos laborales. Formal cuando la ocasión lo requiera. La ropa práctica de exterior es habitual en muchas situaciones sociales.",
        dos: [
          "Reconocer el patrimonio indígena cuando sea pertinente",
          "Sujetar las puertas para quienes vienen detrás",
          "Disculparse fácilmente — es una cortesía valorada",
          "Respetar el espacio personal (aproximadamente un brazo de distancia)",
          "Tener en cuenta tanto el contexto anglófono como el francófono"
        ],
        donts: [
          "Asumir que todos hablan únicamente inglés o únicamente francés",
          "Comparar Canadá desfavorablemente con Estados Unidos",
          "Ignorar los límites personales",
          "Llegar tarde sin avisar",
          "Hacer suposiciones sobre la identidad cultural o nacional de alguien"
        ]
      },
      "es-MX": {
        region_name: "Canadá",
        core_value: "Igualdad, Inclusión & Cortesía",
        biggest_taboo: "Suponer el origen cultural o el idioma que prefiere alguien",
        dining_etiquette: "El ambiente es relajado y amable. Es común dividir la cuenta. Se espera una propina del 15 al 20%. Los gustos y restricciones alimentarias se respetan sin problema.",
        language_notes: "Canadá tiene dos idiomas oficiales: inglés y francés. En Québec, el francés es el idioma de uso cotidiano. El trato de tú y el uso del nombre se da con cierta rapidez. El lenguaje incluyente es importante en toda la sociedad canadiense.",
        gift_protocol: "En negocios no se esperan obsequios, pero en reuniones sociales son bienvenidos. Vino, productos regionales o un buen libro son buenas opciones. Un detalle para el anfitrión siempre cae muy bien.",
        dress_code: "Smart casual para la mayoría de los ambientes de trabajo. Formal cuando así se especifique. La ropa para actividades al aire libre es aceptable en muchos contextos sociales.",
        dos: [
          "Reconocer el legado de los pueblos indígenas cuando corresponda",
          "Sostener las puertas para quienes vienen atrás",
          "Pedir disculpas con naturalidad — es parte del estilo canadiense",
          "Respetar el espacio personal de los demás",
          "Ser consciente de que tanto el inglés como el francés son parte de la identidad canadiense"
        ],
        donts: [
          "Asumir que todos hablan solo inglés",
          "Comparar constantemente a Canadá con Estados Unidos",
          "Invadir el espacio personal",
          "Llegar tarde sin avisar",
          "Hacer suposiciones sobre el origen o la identidad de alguien"
        ]
      },
      "pt-PT": {
        region_name: "Canadá",
        core_value: "Igualdade, Inclusão & Cortesia",
        biggest_taboo: "Presumir a origem cultural ou a língua preferida de alguém",
        dining_etiquette: "A atmosfera é informal e profissional. A conta costuma ser dividida. Uma gorjeta de 15 a 20% é esperada e habitual. As preferências alimentares são respeitadas e acomodadas sem dificuldade.",
        language_notes: "O Canadá tem duas línguas oficiais — inglês e francês. No Québec, o francês é a língua principal. Os nomes próprios adotam-se com relativa rapidez. A linguagem inclusiva é um valor amplamente partilhado.",
        gift_protocol: "As prendas não são esperadas em contexto profissional, mas são bem-vindas em ocasiões sociais. Vinho, produtos locais ou um livro são escolhas adequadas. Um gesto de agradecimento ao anfitrião é sempre apreciado.",
        dress_code: "Smart casual para a maioria dos contextos profissionais. Formal quando a ocasião o exige. Roupa prática de exterior é aceitável em muitas situações sociais.",
        dos: [
          "Reconhecer o património indígena quando for adequado",
          "Segurar as portas para quem vem atrás",
          "Pedir desculpa prontamente — é uma cortesia valorizada",
          "Respeitar o espaço pessoal (cerca de um braço de distância)",
          "Ter em conta os contextos cultural anglófono e francófono"
        ],
        donts: [
          "Assumir que todos falam exclusivamente inglês ou francês",
          "Comparar desfavoravelmente o Canadá com os Estados Unidos",
          "Ignorar os limites pessoais",
          "Chegar tarde sem aviso prévio",
          "Fazer suposições sobre a identidade cultural ou nacional de alguém"
        ]
      },
      "pt-BR": {
        region_name: "Canadá",
        core_value: "Igualdade, Inclusão & Cortesia",
        biggest_taboo: "Presumir a origem cultural ou o idioma preferido de alguém",
        dining_etiquette: "O ambiente é descontraído e amigável. Dividir a conta é comum. A gorjeta de 15 a 20% é esperada. Preferências alimentares são levadas a sério e atendidas sem problema.",
        language_notes: "O Canadá tem dois idiomas oficiais — inglês e francês. Em Québec, o francês é predominante. As pessoas costumam usar o primeiro nome relativamente rápido. A linguagem inclusiva tem grande importância em toda a sociedade canadense.",
        gift_protocol: "Presentes não são esperados em reuniões de trabalho, mas são bem-vindos em eventos sociais. Vinho, produtos locais ou um livro são ótimas pedidas. Levar algo para o anfitrião é sempre um gesto bem recebido.",
        dress_code: "Smart casual na maioria dos ambientes profissionais. Formal quando indicado. Roupas práticas para atividades ao ar livre são aceitas em muitas situações sociais — os canadenses adoram a natureza.",
        dos: [
          "Reconhecer o legado dos povos indígenas quando for pertinente",
          "Segurar a porta para quem vem atrás",
          "Pedir desculpas com facilidade — é parte da cultura canadense",
          "Respeitar o espaço pessoal das pessoas",
          "Lembrar que inglês e francês fazem parte da identidade canadense"
        ],
        donts: [
          "Achar que todo mundo fala só inglês",
          "Ficar comparando o Canadá com os EUA — não cai bem",
          "Invadir o espaço pessoal das pessoas",
          "Chegar atrasado sem avisar",
          "Presumir a origem ou identidade cultural de alguém"
        ]
      },
      "it-IT": {
        region_name: "Canada",
        core_value: "Uguaglianza, Inclusività & Cortesia",
        biggest_taboo: "Presumere l'origine culturale o la lingua preferita di qualcuno",
        dining_etiquette: "L'atmosfera è informale ma professionale. Il conto viene spesso diviso. È consuetudine lasciare una mancia del 15-20%. Le preferenze alimentari sono prese sul serio e accomodate senza difficoltà.",
        language_notes: "Il Canada ha due lingue ufficiali — inglese e francese. In Québec il francese è la lingua principale. I nomi di battesimo vengono adottati con relativa rapidità. Il linguaggio inclusivo è un valore profondamente radicato.",
        gift_protocol: "I regali non sono attesi in ambito professionale, ma sono ben accolti nelle occasioni sociali. Vino, prodotti locali o un libro accuratamente scelto sono scelte appropriate. Un pensiero per il padrone di casa è sempre gradito.",
        dress_code: "Smart casual per la maggior parte dei contesti lavorativi. Formale quando l'occasione lo richiede. L'abbigliamento pratico per l'outdoor è accettato in molte situazioni sociali.",
        dos: [
          "Riconoscere il patrimonio indigeno quando appropriato",
          "Tenere le porte aperte per chi segue",
          "Scusarsi prontamente — è una virtù sociale apprezzata",
          "Rispettare lo spazio personale (circa un braccio di distanza)",
          "Tenere conto sia del contesto anglofono che francofono"
        ],
        donts: [
          "Supporre che tutti parlino esclusivamente inglese o francese",
          "Confrontare sfavorevolmente il Canada con gli Stati Uniti",
          "Ignorare i confini personali",
          "Arrivare in ritardo senza preavviso",
          "Fare supposizioni sull'identità culturale o nazionale di qualcuno"
        ]
      },
      "hi-IN": {
        region_name: "कनाडा",
        core_value: "समानता, समावेशिता और शिष्टाचार",
        biggest_taboo: "किसी की सांस्कृतिक पृष्ठभूमि या भाषा के बारे में धारणा बनाना",
        dining_etiquette: "माहौल अनौपचारिक और पेशेवर होता है। बिल अक्सर बाँटा जाता है। 15 से 20% टिप देना प्रचलित है। खान-पान की पसंद को गंभीरता से लिया जाता है।",
        language_notes: "कनाडा में दो आधिकारिक भाषाएं हैं — अंग्रेज़ी और फ्रेंच। क्यूबेक में फ्रेंच प्रमुख है। पहला नाम जल्दी उपयोग किया जाता है। समावेशी भाषा का उपयोग महत्वपूर्ण है।",
        gift_protocol: "व्यावसायिक संदर्भों में उपहार आवश्यक नहीं हैं, लेकिन सामाजिक अवसरों पर स्वागत हैं। वाइन, स्थानीय उत्पाद या पुस्तक उचित विकल्प हैं। मेज़बान के लिए उपहार हमेशा सराहा जाता है।",
        dress_code: "अधिकांश व्यावसायिक संदर्भों के लिए स्मार्ट कैजुअल। विशेष अवसरों पर औपचारिक वेशभूषा। बाहरी गतिविधियों के लिए व्यावहारिक कपड़े स्वीकार्य हैं।",
        dos: [
          "जहाँ उचित हो, वहाँ आदिवासी विरासत को स्वीकार करें",
          "अपने पीछे आने वाले लोगों के लिए दरवाज़ा खुला रखें",
          "माफी माँगने में संकोच न करें — यह एक सामाजिक शिष्टाचार है",
          "व्यक्तिगत स्थान का सम्मान करें",
          "अंग्रेज़ी और फ्रेंच दोनों सांस्कृतिक संदर्भों को पहचानें"
        ],
        donts: [
          "यह न मानें कि सभी केवल अंग्रेज़ी या फ्रेंच बोलते हैं",
          "कनाडा की अमेरिका से प्रतिकूल तुलना न करें",
          "व्यक्तिगत सीमाओं की अनदेखी न करें",
          "बिना सूचना के देर से न आएं",
          "किसी की सांस्कृतिक या राष्ट्रीय पहचान के बारे में धारणा न बनाएं"
        ]
      }
    }
  },
  // ── AUSTRALIA ────────────────────────────────────────────────────────────────
  {
    region_code: "AU",
    flag_emoji: "🇦🇺",
    is_published: true,
    content: {
      "en-GB": {
        region_name: "Australia",
        core_value: "Mateship, Egalitarianism & Directness",
        biggest_taboo: "Boasting, pretension, or elevating yourself above others",
        dining_etiquette: "Australian dining is relaxed and egalitarian. Bills are usually split equally. At a BBQ, the host manages the grill — do not interfere. Tipping is appreciated but not obligatory; 10% for good service is generous. BYO (bring your own alcohol) is common at casual gatherings — always bring enough to share.",
        language_notes: "Australians use first names immediately, regardless of seniority. Titles are rarely used in social settings. Direct communication is valued — say what you mean, without elaborate diplomacy. Self-deprecating humour and light teasing are expressions of warmth, not disrespect.",
        gift_protocol: "Bringing a bottle of wine, a six-pack, or a dessert to a dinner is warmly appreciated. Gifts are not expected in business settings. Overly lavish gifts create awkwardness. The thought and generosity matter more than the price.",
        dress_code: "Smart casual is the default in most business and social settings. Formal suits are worn in law, finance, and specified formal occasions. When Black Tie is specified, comply fully — the relaxed general standard makes formal occasions distinctive. Outdoor and climate-appropriate clothing is entirely appropriate and respected.",
        dos: [
          "Use first names immediately — formality creates unnecessary distance",
          "Buy your round at the pub — 'shouting' is a social obligation",
          "Bring something to share to any BYO or casual gathering",
          "Acknowledge the Traditional Owners at formal events",
          "Give direct, honest feedback when asked for it"
        ],
        donts: [
          "Boast about your achievements or elevate yourself above the group",
          "Take over the host's BBQ without being invited",
          "Opt out of the pub round system while continuing to drink with the group",
          "Use elaborate titles or formal address in social settings",
          "Dismiss Australian wine, food, or culture as inferior to European equivalents"
        ]
      },
      "en-US": {
        region_name: "Australia",
        core_value: "Mateship, Egalitarianism & Directness",
        biggest_taboo: "Bragging, showing off, or thinking you are better than anyone else",
        dining_etiquette: "Dining in Australia is relaxed and unpretentious. Bills are typically split evenly. At a BBQ, the host runs the grill — don't step in to help unless specifically asked. Tipping isn't mandatory — service workers are paid fairly — but 10% for good service is appreciated. BYO (bring your own alcohol) is common at casual get-togethers; bring enough for the group.",
        language_notes: "Australians jump straight to first names with almost everyone. Titles and formal address feel stiff and out of place in most settings. They say what they mean — directness is respected, not rude. Expect good-natured teasing as a sign of acceptance.",
        gift_protocol: "A bottle of wine, beer, or something for dessert is a great gift when invited somewhere. Business settings don't really call for gifts. Don't overthink it — a genuine, practical gesture beats anything too lavish.",
        dress_code: "Smart casual is appropriate for most work and social occasions. Suits are worn in finance, law, and formal events. If an invitation says Black Tie, take it seriously — the casual everyday standard makes formal events really stand out. Practical outdoor clothing is completely acceptable and respected.",
        dos: [
          "Jump to first names right away — using titles feels formal and stiff",
          "Buy your round at the pub — it is expected and part of the culture",
          "Bring drinks or food to share at casual gatherings",
          "Acknowledge Indigenous heritage at formal events",
          "Be direct and honest when someone asks your opinion"
        ],
        donts: [
          "Brag about your accomplishments — tall poppy syndrome is real",
          "Take over the BBQ grill without being asked",
          "Skip your turn buying drinks while staying with the group",
          "Use formal titles in casual conversations",
          "Dismiss Australian food, wine, or culture compared to Europe or the US"
        ]
      },
      "en-AU": {
        region_name: "Australia",
        core_value: "Mateship, Egalitarianism & Directness",
        biggest_taboo: "Skiting, putting on airs, or thinking you are better than everyone else",
        dining_etiquette: "Dining is relaxed and no-fuss. Bills get split evenly — nobody's counting down to the cent. At a barbie, the host runs the grill, full stop. Don't interfere. Tipping isn't compulsory but rounding up or leaving 10% for good service is a nice gesture. BYO is part of the culture — pitch in, don't rock up empty-handed.",
        language_notes: "First names straight away — always. Nobody's waiting for a formal introduction. Speak plainly; beating around the bush is more irritating than rude. Good-natured ribbing is how Australians show they like you. Laugh along and give as good as you get.",
        gift_protocol: "A slab, a bottle of red, or something sweet for afters is always welcome. Don't stress about business gifts — not really expected here. Keep it genuine and practical; nobody wants something that feels like a performance.",
        dress_code: "Smart casual covers most things. Suits are for the law firm or a formal do. If they've written Black Tie on the invite, they mean it — the usual casualness makes those nights stand out. Practical gear for outdoors is perfectly fine.",
        dos: [
          "Use first names immediately — everyone does",
          "Shout your round at the pub — it is what you do",
          "Bring something to share to any BYO or barbie",
          "Acknowledge Country at formal events — it matters",
          "Say what you mean — directness is respected here"
        ],
        donts: [
          "Skite about what you have achieved — nobody likes a tall poppy",
          "Take over the barbie — it is the host's domain",
          "Bludge rounds while staying out with the group",
          "Use titles and formal address in social settings",
          "Bag Australian wine or culture as not as good as overseas"
        ]
      },
      "en-CA": {
        region_name: "Australia",
        core_value: "Mateship, Egalitarianism & Directness",
        biggest_taboo: "Boasting, pretension, or acting superior to others",
        dining_etiquette: "Australian dining is relaxed and egalitarian, much like Canada in its informality. Bills are split equally. At a BBQ, the host manages the grill — don't offer to take over. Tipping is not mandatory but a 10% gesture for good service is appreciated. BYO is common at casual gatherings — bring enough to share generously.",
        language_notes: "Like Canada, Australians move to first names quickly. Direct communication is valued — expect plain, honest feedback without excessive diplomatic cushioning. Light teasing is a form of acceptance, similar to Canadian banter.",
        gift_protocol: "A bottle of wine or beer to a dinner is a thoughtful gesture. Business settings do not typically require gifts. Keep it simple and genuine — generosity of spirit matters more than expense.",
        dress_code: "Smart casual suits most professional and social environments. Formal occasions specified as Black Tie should be taken seriously. Outdoor and climate-appropriate clothing is respected and practical. The default is more relaxed than Canada's urban professional dress, but formality is honoured when called for.",
        dos: [
          "Use first names right away — formality creates distance",
          "Buy your round at the pub — 'shouting' is expected",
          "Bring something to contribute to BYO gatherings",
          "Acknowledge Indigenous heritage at formal occasions",
          "Be honest and direct when asked for your view"
        ],
        donts: [
          "Boast about accomplishments or status",
          "Take over the host's BBQ uninvited",
          "Avoid your turn in the pub round system",
          "Use formal titles in casual conversation",
          "Dismiss Australian culture in favour of British or American equivalents"
        ]
      },
      "nl-NL": {
        region_name: "Australië",
        core_value: "Matenschap, gelijkwaardigheid en directheid",
        biggest_taboo: "Opscheppen, aanstellerij of jezelf boven anderen plaatsen",
        dining_etiquette: "Australisch tafelen is ontspannen en informeel. Rekeningen worden doorgaans gelijk verdeeld. Bij een BBQ beheert de gastheer de grill — grijp niet in tenzij gevraagd. Fooi is niet verplicht maar 10% voor goede service wordt gewaardeerd. BYO (breng je eigen drank) is gebruikelijk bij informele bijeenkomsten — breng altijd genoeg om te delen.",
        language_notes: "Australiërs gebruiken onmiddellijk de voornaam, ongeacht rang of status. Titels voelen formeel en onnatuurlijk aan in de meeste situaties. Directe communicatie wordt gewaardeerd. Luchtig plagen is een teken van acceptatie en vriendschap.",
        gift_protocol: "Een fles wijn, bier of iets voor toe is een welkome bijdrage. Cadeaus worden niet verwacht in zakelijke situaties. Houd het oprecht en praktisch — overdadige geschenken creëren ongemak.",
        dress_code: "Smart casual is de standaard in de meeste zakelijke en sociale situaties. Pakken zijn gebruikelijk in de advocatuur, financiën en bij formele gelegenheden. Black Tie betekent wat het zegt. Praktische buitenkleding is volledig geaccepteerd.",
        dos: [
          "Gebruik onmiddellijk de voornaam — formeel aanspreken creëert onnodige afstand",
          "Koop je ronde in de pub — 'shouten' is een sociale verwachting",
          "Breng iets om te delen bij informele bijeenkomsten",
          "Erken de Traditionele Eigenaren bij formele evenementen",
          "Wees direct en eerlijk als om je mening wordt gevraagd"
        ],
        donts: [
          "Opscheppen over prestaties of status — tall poppy syndrome is reëel",
          "De BBQ overnemen zonder uitnodiging",
          "Je beurt overslaan in het rondjesysteem in de pub",
          "Formele titels gebruiken in sociale gesprekken",
          "Australische wijn of cultuur negatief vergelijken met Europese equivalenten"
        ]
      },
      "fr-FR": {
        region_name: "Australie",
        core_value: "Camaraderie, égalitarisme et franc-parler",
        biggest_taboo: "La vantardise, la prétention ou se croire supérieur aux autres",
        dining_etiquette: "Les repas australiens sont décontractés et sans cérémonie. Les additions se partagent généralement à parts égales. Au barbecue, c'est l'hôte qui gère le grill — n'intervenez pas sans y être invité. Le pourboire n'est pas obligatoire, mais 10 % pour un bon service est apprécié. Le BYO (apporter ses propres boissons) est courant lors des réunions informelles.",
        language_notes: "Les Australiens passent immédiatement au prénom, quelle que soit la hiérarchie. La communication directe est valorisée. Les taquineries légères sont une marque d'affection et d'acceptation.",
        gift_protocol: "Une bouteille de vin ou de bière est toujours bienvenue. Les cadeaux professionnels ne sont pas attendus. Restez simple et sincère — l'ostentation crée plus d'embarras que de plaisir.",
        dress_code: "Le smart casual est la norme dans la plupart des contextes professionnels et sociaux. Le Black Tie, quand il est spécifié, doit être respecté scrupuleusement. Les vêtements pratiques adaptés au climat sont tout à fait appropriés.",
        dos: [
          "Utilisez le prénom immédiatement — la formalité crée une distance inutile",
          "Payez votre tournée au pub — c'est une obligation sociale",
          "Apportez quelque chose à partager lors des rassemblements informels",
          "Reconnaissez les peuples autochtones lors des événements formels",
          "Soyez direct et honnête lorsqu'on vous demande votre avis"
        ],
        donts: [
          "Vous vanter de vos succès ou de votre statut",
          "Prendre le contrôle du barbecue sans y être invité",
          "Éviter votre tour de tournée tout en restant dans le groupe",
          "Utiliser des titres formels dans les conversations sociales",
          "Dénigrer la cuisine, le vin ou la culture australienne par rapport à l'Europe"
        ]
      },
      "de-DE": {
        region_name: "Australien",
        core_value: "Kameradschaft, Gleichheit und Direktheit",
        biggest_taboo: "Prahlerei, Angeberei oder das Hervorheben des eigenen Status",
        dining_etiquette: "Das Essen in Australien ist entspannt und ungezwungen. Rechnungen werden üblicherweise gleichmäßig aufgeteilt. Beim BBQ liegt die Kontrolle des Grills beim Gastgeber — nicht einmischen, sofern nicht ausdrücklich gebeten. Trinkgeld ist nicht verpflichtend, aber 10 % für guten Service wird geschätzt. BYO (Getränke selbst mitbringen) ist bei informellen Zusammenkünften verbreitet.",
        language_notes: "Australier verwenden sofort den Vornamen, unabhängig von Hierarchie oder Status. Direktheit wird geschätzt. Leichtes Necken unter Freunden ist ein Zeichen der Zuneigung, nicht der Unhöflichkeit.",
        gift_protocol: "Eine Flasche Wein oder Bier ist immer willkommen. Geschäftliche Geschenke werden nicht erwartet. Halten Sie es einfach und aufrichtig — übertriebene Gesten wirken befremdlich.",
        dress_code: "Smart Casual gilt für die meisten beruflichen und gesellschaftlichen Anlässe. Anzüge sind in Recht, Finanzen und bei formal gekennzeichneten Anlässen üblich. Black Tie sollte vollständig respektiert werden. Praktische Outdoor-Kleidung ist akzeptiert.",
        dos: [
          "Sofort den Vornamen verwenden — Förmlichkeit schafft unnötige Distanz",
          "Die eigene Runde im Pub bezahlen — das ist soziale Pflicht",
          "Etwas zum Teilen zu informellen Zusammenkünften mitbringen",
          "Die Traditionellen Eigentümer bei formellen Veranstaltungen anerkennen",
          "Ehrlich und direkt antworten, wenn man nach einer Meinung gefragt wird"
        ],
        donts: [
          "Mit Leistungen oder Status prahlen",
          "Den Grill ohne Einladung übernehmen",
          "Die eigene Runde auslassen, während man in der Gruppe bleibt",
          "Formelle Titel im gesellschaftlichen Umgang verwenden",
          "Australischen Wein oder Kultur im Vergleich zu Europa herabsetzen"
        ]
      },
      "es-ES": {
        region_name: "Australia",
        core_value: "Compañerismo, igualitarismo y franqueza",
        biggest_taboo: "La fanfarronería, la pretensión o creerse superior a los demás",
        dining_etiquette: "Las comidas en Australia son relajadas e igualitarias. Las cuentas suelen dividirse a partes iguales. En una barbacoa, el anfitrión gestiona la parrilla — no interfieras a menos que te lo pidan. La propina no es obligatoria, pero dejar un 10% por buen servicio es bien recibido. El BYO (trae tu propia bebida) es habitual en reuniones informales.",
        language_notes: "Los australianos pasan al nombre de pila de inmediato. La comunicación directa es valorada; los rodeos se perciben como evasivos. Las bromas ligeras son una expresión de aceptación y afecto.",
        gift_protocol: "Una botella de vino o cerveza es siempre bien recibida. Los regalos no son habituales en contextos profesionales. Mantenlo sencillo y sincero.",
        dress_code: "El smart casual es la norma en la mayoría de entornos laborales y sociales. El Black Tie, cuando se especifica, debe cumplirse plenamente. La ropa práctica para exteriores es completamente apropiada.",
        dos: [
          "Usa el nombre de pila inmediatamente — la formalidad crea distancia innecesaria",
          "Invita a tu ronda en el pub — es una expectativa social",
          "Lleva algo para compartir en reuniones informales",
          "Reconoce a los Propietarios Tradicionales en eventos formales",
          "Sé directo y honesto cuando te pidan tu opinión"
        ],
        donts: [
          "Presumir de logros o estatus",
          "Hacerse cargo de la barbacoa sin ser invitado",
          "Evitar tu turno en las rondas mientras sigues con el grupo",
          "Usar títulos formales en conversaciones sociales",
          "Menospreciar el vino, la comida o la cultura australiana frente a la europea"
        ]
      },
      "pt-PT": {
        region_name: "Austrália",
        core_value: "Camaradagem, igualitarismo e franqueza",
        biggest_taboo: "Gabar-se, pretensão ou colocar-se acima dos outros",
        dining_etiquette: "As refeições na Austrália são descontraídas e sem cerimónia. As contas dividem-se geralmente de forma igual. No churrasco, o anfitrião controla a grelha — não interfira sem ser convidado. As gorjetas não são obrigatórias, mas 10% por bom serviço é apreciado. O BYO (trazer as próprias bebidas) é comum em reuniões informais.",
        language_notes: "Os australianos passam imediatamente ao nome próprio. A comunicação directa é valorizada. As brincadeiras ligeiras são uma expressão de aceitação, não de falta de respeito.",
        gift_protocol: "Uma garrafa de vinho ou cerveja é sempre bem-vinda. Os presentes não são esperados em contextos profissionais. Mantenha-o simples e genuíno.",
        dress_code: "O smart casual é o padrão na maioria dos ambientes profissionais e sociais. O Black Tie, quando especificado, deve ser respeitado na totalidade. A roupa prática para o exterior é completamente adequada.",
        dos: [
          "Use o nome próprio imediatamente — a formalidade cria distância desnecessária",
          "Pague a sua ronda no pub — é uma expectativa social",
          "Traga algo para partilhar em reuniões informais",
          "Reconheça os Proprietários Tradicionais em eventos formais",
          "Seja directo e honesto quando lhe pedem a sua opinião"
        ],
        donts: [
          "Gabar-se de conquistas ou estatuto",
          "Tomar conta do churrasco sem ser convidado",
          "Evitar a sua vez nas rondas enquanto continua com o grupo",
          "Usar títulos formais em conversas sociais",
          "Menosprezar o vinho, a comida ou a cultura australiana em relação à europeia"
        ]
      },
      "it-IT": {
        region_name: "Australia",
        core_value: "Cameratismo, egualitarismo e schiettezza",
        biggest_taboo: "Il vantarsi, la pretenziosità o il sentirsi superiori agli altri",
        dining_etiquette: "I pasti in Australia sono rilassati e senza cerimonie. I conti si dividono generalmente in parti uguali. Al barbecue, è il padrone di casa a gestire la griglia — non interferire senza essere invitato. La mancia non è obbligatoria, ma il 10% per un buon servizio è apprezzato. Il BYO (porta le tue bevande) è comune alle riunioni informali.",
        language_notes: "Gli australiani passano subito al nome di battesimo. La comunicazione diretta è apprezzata. Le battute amichevoli sono un'espressione di accettazione e affetto.",
        gift_protocol: "Una bottiglia di vino o birra è sempre benvenuta. I regali non sono attesi in ambito professionale. Tienilo semplice e sincero.",
        dress_code: "Lo smart casual è la norma nella maggior parte dei contesti lavorativi e sociali. Il Black Tie, quando specificato, va rispettato pienamente. L'abbigliamento pratico per l'esterno è del tutto appropriato.",
        dos: [
          "Usa il nome di battesimo immediatamente — la formalità crea distanza inutile",
          "Paga il tuo giro al pub — è un'aspettativa sociale",
          "Porta qualcosa da condividere alle riunioni informali",
          "Riconosci i Proprietari Tradizionali agli eventi formali",
          "Sii diretto e onesto quando ti viene chiesta la tua opinione"
        ],
        donts: [
          "Vantarti dei tuoi successi o del tuo status",
          "Prendere il controllo del barbecue senza essere invitato",
          "Evitare il tuo turno nel giro da offrire rimanendo nel gruppo",
          "Usare titoli formali nelle conversazioni sociali",
          "Sminuire il vino, il cibo o la cultura australiana rispetto a quella europea"
        ]
      },
      "ja-JP": {
        region_name: "オーストラリア",
        core_value: "友情・平等主義・率直さ",
        biggest_taboo: "自慢、気取り、または自分を他者より優れていると示すこと",
        dining_etiquette: "オーストラリアの食事はリラックスした雰囲気で行われます。割り勘が一般的で、細かく計算するよりも均等に分けることが好まれます。バーベキューでは、ホストがグリルを管理します――招かれない限り手を出してはいけません。チップは義務ではありませんが、良いサービスには10%程度が喜ばれます。BYO（飲み物持参）はカジュアルな集まりでよく見られます。",
        language_notes: "オーストラリア人はすぐに名前で呼び合います。役職や敬称はほとんど使われません。率直な意思疎通が重視され、遠まわしな表現は回避的に映ることがあります。軽い冗談や冷やかしは親しみの表現です。",
        gift_protocol: "ワインやビールを持参することは歓迎されます。ビジネスの場ではプレゼントは通常期待されません。シンプルで誠実なものが最も喜ばれます。",
        dress_code: "ほとんどのビジネス・社交場面ではスマートカジュアルが標準です。Black Tieと指定された場合は、きちんと従う必要があります。屋外に適した実用的な服装も十分に受け入れられます。",
        dos: [
          "すぐに名前で呼ぶ――形式的な呼び方は距離感を生む",
          "パブでは自分の番に飲み物をおごる――これは社会的義務",
          "カジュアルな集まりには何か持参して分かち合う",
          "正式な場では先住民族の土地への敬意を示す",
          "意見を求められたら、率直かつ正直に答える"
        ],
        donts: [
          "自分の業績や地位を自慢しない",
          "招かれていないのにバーベキューを取り仕切らない",
          "グループにいながら飲み物をおごる順番を避けない",
          "社交的な場で正式な敬称を使わない",
          "オーストラリアのワインや文化をヨーロッパと比べて否定しない"
        ]
      },
      "ar": {
        region_name: "أستراليا",
        core_value: "الرفقة والمساواة والصراحة",
        biggest_taboo: "التباهي والتكبر أو الشعور بالتفوق على الآخرين",
        dining_etiquette: "تناول الطعام في أستراليا هادئ وغير رسمي. عادةً ما تُقسَّم الفاتورة بالتساوي. في الشواء، يتولى المضيف إدارة الشواية — لا تتدخل إلا إذا طُلب منك ذلك. البقشيش غير إلزامي، لكن 10% مقابل خدمة جيدة موضع تقدير. اصطحاب مشروباتك الخاصة (BYO) شائع في التجمعات غير الرسمية.",
        language_notes: "يستخدم الأستراليون الاسم الأول فوراً بصرف النظر عن المرتبة. التواصل المباشر محل تقدير؛ المراوغة تُعدّ تهرباً. المداعبة الخفيفة تعبير عن القبول والمودة.",
        gift_protocol: "يُرحَّب دائماً بزجاجة نبيذ أو بيرة. لا تُتوقع الهدايا في السياقات المهنية. أبقِ الأمر بسيطاً وصادقاً.",
        dress_code: "الملابس الأنيقة غير الرسمية هي المعيار في معظم البيئات المهنية والاجتماعية. Black Tie يعني ما يقوله حرفياً. الملابس العملية للخارج مقبولة تماماً.",
        dos: [
          "استخدم الاسم الأول فوراً — الرسمية تخلق مسافة غير ضرورية",
          "ادفع جولتك في الحانة — هذا توقع اجتماعي",
          "أحضر شيئاً لتشاركه في التجمعات غير الرسمية",
          "اعترف بملاك الأراضي التقليديين في المناسبات الرسمية",
          "كن صريحاً وصادقاً حين يُطلب رأيك"
        ],
        donts: [
          "التباهي بالإنجازات أو المكانة",
          "الاستيلاء على الشواية دون دعوة",
          "تجنب دورك في جولة الشراء بينما تبقى مع المجموعة",
          "استخدام الألقاب الرسمية في المحادثات الاجتماعية",
          "الاستهانة بالنبيذ أو الثقافة الأسترالية مقارنةً بالأوروبية"
        ]
      },
      "hi-IN": {
        region_name: "ऑस्ट्रेलिया",
        core_value: "दोस्ती, समानता और स्पष्टवादिता",
        biggest_taboo: "शेखी बघारना, दिखावा करना या खुद को दूसरों से श्रेष्ठ समझना",
        dining_etiquette: "ऑस्ट्रेलिया में भोजन आरामदायक और बिना किसी औपचारिकता के होता है। बिल आमतौर पर समान रूप से बांटा जाता है। बारबेक्यू में मेजबान ग्रिल संभालता है — बिना बुलाए दखल न दें। टिप अनिवार्य नहीं है, लेकिन अच्छी सेवा के लिए 10% सराहनीय है। BYO (अपनी पेय वस्तुएं लाना) अनौपचारिक सभाओं में सामान्य है।",
        language_notes: "ऑस्ट्रेलियाई तुरंत पहले नाम से बुलाते हैं, चाहे पद कुछ भी हो। सीधी बात को सराहा जाता है। हल्की-फुल्की चुहलबाजी स्वीकृति और स्नेह का प्रतीक है।",
        gift_protocol: "शराब या बियर की बोतल हमेशा स्वागत योग्य है। व्यावसायिक संदर्भ में उपहार की अपेक्षा नहीं की जाती। सरल और ईमानदार उपहार सबसे उपयुक्त रहता है।",
        dress_code: "अधिकांश व्यावसायिक और सामाजिक स्थितियों में स्मार्ट कैजुअल पर्याप्त है। Black Tie निर्दिष्ट होने पर उसका पूरी तरह पालन करें। बाहरी गतिविधियों के लिए व्यावहारिक कपड़े पूरी तरह से उचित हैं।",
        dos: [
          "तुरंत पहले नाम से बुलाएं — औपचारिकता अनावश्यक दूरी बनाती है",
          "पब में अपनी बारी पर पेय खरीदें — यह सामाजिक अपेक्षा है",
          "अनौपचारिक सभाओं में बांटने के लिए कुछ लाएं",
          "औपचारिक कार्यक्रमों में पारंपरिक भूमि-स्वामियों को स्वीकार करें",
          "राय मांगने पर सीधे और ईमानदारी से जवाब दें"
        ],
        donts: [
          "अपनी उपलब्धियों या दर्जे का बखान न करें",
          "बिना निमंत्रण के बारबेक्यू पर कब्जा न करें",
          "समूह में रहते हुए अपनी बारी पर पेय खरीदने से न बचें",
          "सामाजिक बातचीत में औपचारिक उपाधियों का उपयोग न करें",
          "ऑस्ट्रेलियाई वाइन या संस्कृति को यूरोपीय के मुकाबले कमतर न आंकें"
        ]
      }
    }
  }
];

async function seedCompass() {
  console.log("Seeding compass regions...");

  for (const region of COMPASS_SEED) {
    await db.insert(compassRegionsTable)
      .values(region)
      .onConflictDoUpdate({
        target: compassRegionsTable.region_code,
        set: {
          flag_emoji: region.flag_emoji,
          content: sql`${JSON.stringify(region.content)}::jsonb`,
          is_published: (region as { is_published?: boolean }).is_published ?? false,
        },
      });
    console.log(`  Upserted: ${region.region_code}`);
  }

  console.log(`Compass seed complete. ${COMPASS_SEED.length} regions inserted/updated.`);
}

export { seedCompass as runCompassSeed };

if (process.argv[1] && process.argv[1].includes("seed-compass.ts")) {
  seedCompass()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Compass seed failed:", err);
      process.exit(1);
    });
}
