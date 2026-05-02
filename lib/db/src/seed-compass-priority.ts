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
      },
      nl: {
        region_name: "Verenigde Staten",
        core_value: "Kansen, zelfredzaamheid en zelfverzekerde expressie",
        biggest_taboo: "Passief of weinig ambitieus overkomen; salaris wordt in formele kringen als privé beschouwd",
        dining_etiquette: "De vork wordt in de rechterhand gehouden na het snijden. Rekening delen is gebruikelijk. Fooi van 18–22% wordt verwacht.",
        language_notes: "Direct en positief taalgebruik is de norm. Voornamen worden meteen gebruikt. 'How are you?' is een begroeting, geen vraag.",
        gift_protocol: "Cadeaus worden direct geopend en hartelijk geprezen. Alcohol is acceptabel. Vermijd overdreven extravagante cadeaus in zakelijke context.",
        dress_code: "Business casual is gangbaar in de meeste sectoren. Nette spijkerbroek is op veel werkplekken acceptabel. Kies liever voor netjes.",
        dos: [
          "Spreek mensen meteen bij de voornaam aan",
          "Glimlach en houd oogcontact tijdens het gesprek",
          "Erken prestaties en complimenteer werk direct",
          "Wees op tijd — punctualiteit toont respect",
          "Toon enthousiasme openlijk — understatement wordt vaak als desinteresse gelezen"
        ],
        donts: [
          "Bespreek geen politiek of religie tenzij uitdrukkelijk uitgenodigd",
          "Vermijd overdreven bescheidenheid — dat komt onzeker over",
          "Kom niet te laat zonder vooraf te melden",
          "Vermijd lichamelijk contact buiten een handdruk om",
          "Ga er niet van uit dat stilte instemming betekent"
        ]
      },
      fr: {
        region_name: "États-Unis",
        core_value: "Opportunité, autonomie et expression confiante",
        biggest_taboo: "Paraître passif ou sans ambition ; le salaire est considéré comme privé dans les contextes formels",
        dining_etiquette: "La fourchette est tenue dans la main droite après avoir coupé. Le partage de l'addition est courant. Un pourboire de 18 à 22 % est attendu.",
        language_notes: "Un langage direct et positif est la norme. Les prénoms sont utilisés dès le premier contact. 'How are you?' est une salutation, pas une question.",
        gift_protocol: "Les cadeaux sont ouverts immédiatement et chaleureusement appréciés. L'alcool est acceptable. Évitez les cadeaux trop extravagants en contexte professionnel.",
        dress_code: "Le business casual est la norme dans la plupart des secteurs. Le jean soigné est accepté dans de nombreux milieux professionnels.",
        dos: [
          "Appelez les gens par leur prénom dès le premier contact",
          "Souriez et maintenez le contact visuel pendant la conversation",
          "Reconnaissez les réussites et complimentez le travail directement",
          "Soyez ponctuel — cela témoigne du respect",
          "Exprimez votre enthousiasme librement"
        ],
        donts: [
          "Ne discutez pas de politique ou de religion sauf invitation explicite",
          "Évitez l'excès de modestie — cela passe pour de l'insécurité",
          "N'arrivez pas en retard sans prévenir",
          "Évitez tout contact physique au-delà d'une poignée de main",
          "Ne supposez pas que le silence signifie un accord"
        ]
      },
      de: {
        region_name: "Vereinigte Staaten",
        core_value: "Chancen, Eigenverantwortung und selbstbewusster Ausdruck",
        biggest_taboo: "Passiv oder wenig ehrgeizig wirken; das Gehalt gilt in formellen Umgebungen als Privatsache",
        dining_etiquette: "Die Gabel wird nach dem Schneiden in der rechten Hand gehalten. Gemeinsames Bezahlen ist üblich. Trinkgeld von 18–22 % wird erwartet.",
        language_notes: "Direkte, positive Sprache ist die Norm. Vornamen werden sofort verwendet. 'How are you?' ist eine Begrüßung, keine Frage.",
        gift_protocol: "Geschenke werden sofort geöffnet und herzlich gelobt. Alkohol ist akzeptabel. Vermeiden Sie übertrieben aufwendige Geschenke im Geschäftskontext.",
        dress_code: "Business Casual ist in den meisten Branchen Standard. Gepflegte Jeans sind in vielen beruflichen Umfeldern akzeptabel.",
        dos: [
          "Sprechen Sie Menschen von Anfang an mit dem Vornamen an",
          "Lächeln Sie und halten Sie Augenkontakt im Gespräch",
          "Erkennen Sie Leistungen an und loben Sie Arbeit direkt",
          "Seien Sie pünktlich — Pünktlichkeit signalisiert Respekt",
          "Zeigen Sie Begeisterung offen — Zurückhaltung wird oft als Desinteresse gedeutet"
        ],
        donts: [
          "Sprechen Sie Politik oder Religion nicht an, außer Sie werden ausdrücklich dazu eingeladen",
          "Vermeiden Sie übertriebene Bescheidenheit — sie wirkt unsicher",
          "Kommen Sie nicht zu spät ohne vorherige Ankündigung",
          "Vermeiden Sie körperlichen Kontakt über einen Handschlag hinaus",
          "Nehmen Sie nicht an, dass Schweigen Zustimmung bedeutet"
        ]
      },
      es: {
        region_name: "Estados Unidos",
        core_value: "Oportunidad, autonomía y expresión segura",
        biggest_taboo: "Parecer pasivo o poco ambicioso; el salario se considera privado en entornos formales",
        dining_etiquette: "El tenedor se sostiene en la mano derecha tras cortar. Es habitual dividir la cuenta. Se espera una propina del 18 al 22 %.",
        language_notes: "El lenguaje directo y positivo es la norma. Los nombres de pila se usan desde el primer momento. '¿Cómo estás?' es un saludo, no una pregunta.",
        gift_protocol: "Los regalos se abren de inmediato y se elogian con calidez. El alcohol es aceptable. Evite regalos demasiado extravagantes en contextos profesionales.",
        dress_code: "El business casual es el estándar en la mayoría de los sectores. Los vaqueros bien presentados son aceptables en muchos entornos profesionales.",
        dos: [
          "Diríjase a las personas por su nombre de pila desde el primer encuentro",
          "Sonría y mantenga el contacto visual durante la conversación",
          "Reconozca los logros y felicite el trabajo directamente",
          "Sea puntual — la puntualidad demuestra respeto",
          "Exprese entusiasmo abiertamente"
        ],
        donts: [
          "No hable de política ni religión salvo invitación explícita",
          "Evite la modestia excesiva — se interpreta como inseguridad",
          "No llegue tarde sin avisar con antelación",
          "Evite el contacto físico más allá de un apretón de manos",
          "No suponga que el silencio implica acuerdo"
        ]
      },
      pt: {
        region_name: "Estados Unidos",
        core_value: "Oportunidade, autonomia e expressão confiante",
        biggest_taboo: "Parecer passivo ou sem ambição; o salário é considerado privado em contextos formais",
        dining_etiquette: "O garfo é segurado na mão direita após cortar. Dividir a conta é comum. Gorjeta de 18 a 22% é esperada.",
        language_notes: "Linguagem direta e positiva é a norma. Primeiros nomes são usados desde o início. 'How are you?' é uma saudação, não uma pergunta.",
        gift_protocol: "Os presentes são abertos imediatamente e elogiados com entusiasmo. Álcool é aceitável. Evite presentes muito extravagantes em contextos profissionais.",
        dress_code: "Business casual é padrão na maioria dos setores. Jeans bem cuidados são aceites em muitos ambientes profissionais.",
        dos: [
          "Trate as pessoas pelo primeiro nome desde o primeiro encontro",
          "Sorria e mantenha contacto visual durante a conversa",
          "Reconheça conquistas e elogie o trabalho diretamente",
          "Seja pontual — a pontualidade demonstra respeito",
          "Expresse entusiasmo abertamente"
        ],
        donts: [
          "Não discuta política ou religião salvo convite explícito",
          "Evite modéstia excessiva — é interpretada como insegurança",
          "Não chegue atrasado sem avisar antecipadamente",
          "Evite contacto físico além de um aperto de mão",
          "Não assuma que o silêncio significa concordância"
        ]
      },
      it: {
        region_name: "Stati Uniti",
        core_value: "Opportunità, autonomia ed espressione sicura di sé",
        biggest_taboo: "Apparire passivi o privi di ambizione; lo stipendio è considerato privato nei contesti formali",
        dining_etiquette: "La forchetta si tiene nella mano destra dopo aver tagliato. Dividere il conto è comune. Una mancia del 18–22% è attesa.",
        language_notes: "Un linguaggio diretto e positivo è la norma. I nomi di battesimo si usano fin dall'inizio. 'How are you?' è un saluto, non una domanda.",
        gift_protocol: "I regali vengono aperti subito e lodati con calore. L'alcol è accettabile. Evitare regali troppo stravaganti in contesti professionali.",
        dress_code: "Il business casual è lo standard nella maggior parte dei settori. I jeans curati sono accettabili in molti ambienti professionali.",
        dos: [
          "Rivolgersi alle persone per nome fin dal primo incontro",
          "Sorridere e mantenere il contatto visivo durante la conversazione",
          "Riconoscere i successi e complimentarsi direttamente per il lavoro",
          "Essere puntuali — la puntualità segnala rispetto",
          "Esprimere entusiasmo apertamente"
        ],
        donts: [
          "Non discutere di politica o religione salvo esplicito invito",
          "Evitare un'eccessiva modestia — viene percepita come insicurezza",
          "Non arrivare in ritardo senza avvisare in anticipo",
          "Evitare il contatto fisico oltre una stretta di mano",
          "Non presupporre che il silenzio significhi accordo"
        ]
      },
      ar: {
        region_name: "الولايات المتحدة الأمريكية",
        core_value: "الفرصة والاعتماد على الذات والتعبير بثقة",
        biggest_taboo: "الظهور بمظهر سلبي أو غير طموح؛ الراتب يُعدّ أمرًا خاصًا في البيئات الرسمية",
        dining_etiquette: "يُمسك الشوكة باليد اليمنى بعد التقطيع. تقسيم الفاتورة شائع. يُتوقع إكرامية بنسبة 18–22٪.",
        language_notes: "اللغة المباشرة والإيجابية هي المعيار. الأسماء الأولى تُستخدم فورًا. 'كيف حالك؟' تحية وليست سؤالاً حقيقيًا.",
        gift_protocol: "تُفتح الهدايا فورًا وتُشكر بحرارة. الكحول مقبول. تجنّب الهدايا المبالغ في تكلفتها في السياقات المهنية.",
        dress_code: "الزي غير الرسمي للأعمال هو المعيار في معظم القطاعات. الجينز الأنيق مقبول في كثير من البيئات المهنية.",
        dos: [
          "خاطب الناس بأسمائهم الأولى منذ اللقاء الأول",
          "ابتسم وحافظ على التواصل البصري أثناء المحادثة",
          "اعترف بالإنجازات وامدح العمل مباشرةً",
          "كن في الموعد — الالتزام بالوقت يعكس الاحترام",
          "أبدِ حماسك بصراحة"
        ],
        donts: [
          "لا تناقش السياسة أو الدين إلا إذا دُعيت صراحةً",
          "تجنّب التواضع المفرط — يُفسَّر على أنه قلة ثقة بالنفس",
          "لا تتأخر دون إشعار مسبق",
          "تجنّب الاتصال الجسدي بعيدًا عن المصافحة",
          "لا تفترض أن الصمت يعني الموافقة"
        ]
      },
      ja: {
        region_name: "アメリカ合衆国",
        core_value: "機会、自立心、そして自信ある表現",
        biggest_taboo: "受け身に見えること、野心がないと思われること。給与は改まった場では個人的な話題とされる",
        dining_etiquette: "カットした後はフォークを右手で持つ。割り勘が一般的。チップは18〜22%が期待される。",
        language_notes: "直接的でポジティブな言葉遣いが標準。最初から名前（ファーストネーム）で呼ぶ。'How are you?'は挨拶であって質問ではない。",
        gift_protocol: "プレゼントはすぐに開けて温かく褒める。アルコールは問題ない。ビジネスの場では過度に豪華な贈り物は避ける。",
        dress_code: "ほとんどの業種でビジネスカジュアルが標準。きれいめなデニムも多くの職場で許容される。",
        dos: [
          "最初の出会いからファーストネームで呼ぶ",
          "会話中は笑顔でアイコンタクトを保つ",
          "実績を認め、仕事を直接褒める",
          "時間厳守を心がける——時間を守ることは敬意の表れ",
          "熱意は率直に示す——控えめな表現は無関心と受け取られがち"
        ],
        donts: [
          "明確な招待がない限り政治や宗教の話題を持ち出さない",
          "謙遜しすぎない——自信のなさに見える",
          "予告なしの遅刻はしない",
          "握手以上の身体的接触は避ける",
          "沈黙を同意と解釈しない"
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
      },
      nl: {
        region_name: "Japan",
        core_value: "Harmonie, precisie en impliciete respect",
        biggest_taboo: "Iemand publiekelijk gezichtsverlies laten lijden — onenigheid moet altijd indirect worden beheerd",
        dining_etiquette: "Wacht tot u wordt begeleid naar uw tafel. Zeg 'itadakimasu' voor het eten. Steek nooit stokjes rechtop in rijst. Schenk altijd eerst voor anderen.",
        language_notes: "Spreek zacht en bedachtzaam. Stilte is respectvolle bezinning, geen ongemak. Onderbreek nooit.",
        gift_protocol: "Wikkel cadeaus elegant in. Geef nooit sets van vier (shi klinkt als dood). Cadeaus worden opzijgelegd en privé geopend.",
        dress_code: "Conservatief en onberispelijk. Donkere kleuren in zakelijke omgeving. Schoenen uitdoen bij thuiskomst. Draag altijd een schone zakdoek.",
        dos: [
          "Geef en ontvang visitekaartjes met beide handen en een lichte buiging",
          "Buig bij de begroeting — de diepte van de buiging weerspiegelt de status",
          "Wacht tot de oudste aanwezige begint te eten",
          "Wacht geduldig en stil in de rij",
          "Toon dankbaarheid regelmatig en oprecht specifiek"
        ],
        donts: [
          "Schrijf nooit met rode inkt — dit is geassocieerd met de dood",
          "Snuit uw neus niet in het openbaar — ga discreet weg",
          "Wijs niet direct naar mensen of objecten",
          "Geef geen fooi — dit wordt als beledigend beschouwd",
          "Spreek nooit luid in restaurants, openbaar vervoer of gedeelde ruimtes"
        ]
      },
      fr: {
        region_name: "Japon",
        core_value: "Harmonie, précision et respect implicite",
        biggest_taboo: "Faire perdre la face publiquement à quelqu'un — le désaccord doit toujours être géré indirectement",
        dining_etiquette: "Attendez d'être placé. Dites 'itadakimasu' avant de manger. Ne plantez jamais les baguettes verticalement dans le riz. Servez toujours les autres avant vous.",
        language_notes: "Parlez doucement et délibérément. Le silence est une réflexion respectueuse, non une gêne. N'interrompez jamais.",
        gift_protocol: "Emballez les cadeaux avec élégance. N'offrez jamais des ensembles de quatre (shi ressemble au mot mort). Les cadeaux sont mis de côté et ouverts en privé.",
        dress_code: "Conservateur et impeccable. Couleurs sombres en affaires. Retirez vos chaussures en entrant dans les foyers. Portez toujours un mouchoir propre.",
        dos: [
          "Présentez et recevez les cartes de visite des deux mains avec une légère révérence",
          "S'incliner lors des salutations — la profondeur reflète le statut relatif",
          "Attendre que la personne la plus haut placée commence à manger",
          "Faire la queue patiemment et silencieusement",
          "Exprimer sa gratitude fréquemment et avec une sincérité spécifique"
        ],
        donts: [
          "Ne jamais écrire à l'encre rouge — c'est associé à la mort",
          "Ne pas se moucher en public — excusez-vous discrètement",
          "Éviter de pointer directement vers des personnes ou des objets",
          "Ne pas donner de pourboire — c'est considéré comme insultant",
          "Ne jamais parler fort dans les restaurants, transports ou espaces partagés"
        ]
      },
      de: {
        region_name: "Japan",
        core_value: "Harmonie, Präzision und impliziter Respekt",
        biggest_taboo: "Jemanden öffentlich das Gesicht verlieren zu lassen — Meinungsverschiedenheiten müssen stets indirekt gehandhabt werden",
        dining_etiquette: "Warten Sie, bis Sie zu Ihrem Platz geführt werden. Sagen Sie 'itadakimasu' vor dem Essen. Stecken Sie nie Stäbchen aufrecht in den Reis. Schenken Sie zuerst für andere ein.",
        language_notes: "Sprechen Sie leise und bedachtsam. Stille ist respektvolle Reflexion, keine Verlegenheit. Unterbrechen Sie nie.",
        gift_protocol: "Wickeln Sie Geschenke elegant ein. Geben Sie nie Vierersets (shi klingt wie Tod). Geschenke werden beiseitegelegt und privat geöffnet.",
        dress_code: "Konservativ und tadellos. Dunkle Farben im Geschäftsleben. Schuhe ausziehen beim Betreten von Wohnungen. Immer ein sauberes Taschentuch dabei haben.",
        dos: [
          "Visitenkarten mit beiden Händen und leichter Verbeugung überreichen und entgegennehmen",
          "Bei der Begrüßung verbeugen — die Tiefe spiegelt den relativen Status wider",
          "Warten, bis die ranghöchste Person mit dem Essen beginnt",
          "Geduldig und ruhig in der Schlange warten",
          "Dankbarkeit häufig und mit aufrichtiger Spezifität ausdrücken"
        ],
        donts: [
          "Niemals mit roter Tinte schreiben — sie ist mit dem Tod verbunden",
          "Nicht in der Öffentlichkeit die Nase putzen — diskret entfernen",
          "Nicht direkt auf Personen oder Gegenstände zeigen",
          "Kein Trinkgeld geben — es gilt als beleidigend",
          "Niemals laut in Restaurants, öffentlichen Verkehrsmitteln oder Gemeinschaftsräumen sprechen"
        ]
      },
      es: {
        region_name: "Japón",
        core_value: "Armonía, precisión y respeto implícito",
        biggest_taboo: "Hacer que alguien pierda la cara públicamente — el desacuerdo siempre debe gestionarse de forma indirecta",
        dining_etiquette: "Espere a ser conducido a su mesa. Diga 'itadakimasu' antes de comer. Nunca clave los palillos verticalmente en el arroz. Sirva siempre a los demás antes que a usted.",
        language_notes: "Hable con suavidad y deliberación. El silencio es reflexión respetuosa, no incomodidad. No interrumpa nunca.",
        gift_protocol: "Envuelva los regalos con elegancia. Nunca regale conjuntos de cuatro (shi suena como muerte). Los regalos se dejan a un lado y se abren en privado.",
        dress_code: "Conservador e impecable. Colores oscuros en negocios. Quítese los zapatos al entrar en los hogares. Lleve siempre un pañuelo limpio.",
        dos: [
          "Entregue y reciba tarjetas de visita con ambas manos y una ligera inclinación",
          "Inclinarse al saludar — la profundidad refleja el estatus relativo",
          "Esperar a que la persona de mayor rango comience a comer",
          "Hacer cola con paciencia y en silencio",
          "Expresar gratitud con frecuencia y sinceridad específica"
        ],
        donts: [
          "Nunca escribir con tinta roja — está asociada con la muerte",
          "No sonarse la nariz en público — discúlpese discretamente",
          "Evitar señalar directamente a personas u objetos",
          "No dar propina — se considera un insulto",
          "Nunca hablar en voz alta en restaurantes, transporte público o espacios compartidos"
        ]
      },
      pt: {
        region_name: "Japão",
        core_value: "Harmonia, precisão e respeito implícito",
        biggest_taboo: "Fazer alguém perder a face publicamente — o desacordo deve ser sempre gerido de forma indireta",
        dining_etiquette: "Aguarde ser conduzido à mesa. Diga 'itadakimasu' antes de comer. Nunca espete os pauzinhos verticalmente no arroz. Sirva sempre os outros antes de si.",
        language_notes: "Fale calmamente e de forma deliberada. O silêncio é reflexão respeitosa, não constrangimento. Nunca interrompa.",
        gift_protocol: "Embrulhe os presentes com elegância. Nunca ofereça conjuntos de quatro (shi soa como morte). Os presentes são guardados e abertos em privado.",
        dress_code: "Conservador e impecável. Cores escuras nos negócios. Retire os sapatos ao entrar em casas. Leve sempre um lenço limpo.",
        dos: [
          "Entregue e receba cartões de visita com ambas as mãos e uma ligeira vénia",
          "Inclinar-se ao cumprimentar — a profundidade reflete o estatuto relativo",
          "Aguardar que a pessoa de maior hierarquia comece a comer",
          "Fazer fila com paciência e silêncio",
          "Expressar gratidão com frequência e sinceridade específica"
        ],
        donts: [
          "Nunca escrever com tinta vermelha — está associada à morte",
          "Não assoar o nariz em público — afaste-se discretamente",
          "Evitar apontar diretamente para pessoas ou objetos",
          "Não dar gorjeta — é considerado insultuoso",
          "Nunca falar alto em restaurantes, transportes públicos ou espaços partilhados"
        ]
      },
      it: {
        region_name: "Giappone",
        core_value: "Armonia, precisione e rispetto implicito",
        biggest_taboo: "Far perdere la faccia pubblicamente a qualcuno — il disaccordo deve essere sempre gestito indirettamente",
        dining_etiquette: "Aspettare di essere accompagnati al tavolo. Dire 'itadakimasu' prima di mangiare. Non piantare mai le bacchette verticalmente nel riso. Servire sempre gli altri prima di sé.",
        language_notes: "Parlare sottovoce e con deliberazione. Il silenzio è riflessione rispettosa, non imbarazzo. Non interrompere mai.",
        gift_protocol: "Incartare i regali con eleganza. Non regalare mai set da quattro (shi suona come morte). I regali vengono messi da parte e aperti in privato.",
        dress_code: "Conservatore e impeccabile. Colori scuri negli affari. Togliersi le scarpe entrando nelle case. Portare sempre un fazzoletto pulito.",
        dos: [
          "Presentare e ricevere i biglietti da visita con entrambe le mani e un leggero inchino",
          "Inchinarsi al momento del saluto — la profondità riflette lo status relativo",
          "Aspettare che la persona di rango più alto inizi a mangiare",
          "Fare la fila con pazienza e in silenzio",
          "Esprimere gratitudine frequentemente e con sincera specificità"
        ],
        donts: [
          "Non scrivere mai con inchiostro rosso — è associato alla morte",
          "Non soffiarsi il naso in pubblico — allontanarsi discretamente",
          "Evitare di indicare direttamente persone o oggetti",
          "Non lasciare la mancia — è considerata un insulto",
          "Non parlare mai ad alta voce in ristoranti, mezzi pubblici o spazi condivisi"
        ]
      },
      ar: {
        region_name: "اليابان",
        core_value: "الانسجام والدقة والاحترام الضمني",
        biggest_taboo: "إحراج شخص ما علنًا — يجب دائمًا معالجة الخلافات بشكل غير مباشر",
        dining_etiquette: "انتظر حتى يُرشدك أحدهم إلى مقعدك. قل 'إيتاداكيماسو' قبل الأكل. لا تغرز العصي في الأرز أبدًا. اسكب للآخرين قبل نفسك.",
        language_notes: "تحدّث بهدوء وتأنٍّ. الصمت تأمل محترم وليس إحراجًا. لا تقاطع أحدًا أبدًا.",
        gift_protocol: "ارفق الهدايا بتغليف أنيق. لا تُهدِ أشياء بمجموعات رباعية (shi تبدو كالموت). تُوضع الهدايا جانبًا وتُفتح في الخصوصية.",
        dress_code: "محافظ وأنيق. ألوان داكنة في بيئة العمل. اخلع حذاءك عند دخول المنازل. احمل دائمًا منديلًا نظيفًا.",
        dos: [
          "قدّم واستقبل بطاقات العمل بكلتا اليدين مع انحناءة خفيفة",
          "انحنِ عند التحية — عمق الانحناء يعكس المكانة النسبية",
          "انتظر حتى يبدأ أكبر الحاضرين سنًا في الأكل",
          "انتظر في الطابور بصبر وهدوء",
          "أعرب عن الامتنان بصدق وتفصيل"
        ],
        donts: [
          "لا تكتب بالحبر الأحمر أبدًا — مرتبط بالموت",
          "لا تمسح أنفك في العلن — ابتعد بهدوء",
          "تجنّب الإشارة مباشرة إلى الأشخاص أو الأشياء",
          "لا تُعطِ إكراميات — يُعدّ ذلك إهانةً",
          "لا تتحدث بصوت عالٍ في المطاعم أو وسائل النقل العام أو الأماكن المشتركة"
        ]
      },
      ja: {
        region_name: "日本",
        core_value: "調和、精確さ、そして暗黙の敬意",
        biggest_taboo: "人前で相手の面子を潰すこと——意見の相違は常に間接的に処理しなければならない",
        dining_etiquette: "席に案内されるまで待つ。食事の前に「いただきます」と言う。ご飯に箸を立てない。自分の前に他の人に注ぐ。",
        language_notes: "静かに、思慮深く話す。沈黙は気まずさではなく、敬意ある思索。決して話を遮らない。",
        gift_protocol: "贈り物は丁寧に包む。4個セットは避ける（「し」は死を連想させる）。贈り物は脇に置き、後で個人的に開ける。",
        dress_code: "保守的で清潔感がある。ビジネスでは濃い色。家に入るときは靴を脱ぐ。清潔なハンカチを必ず携帯する。",
        dos: [
          "名刺は両手で渡し、軽くお辞儀をする",
          "挨拶の際はお辞儀をする——深さは相対的な地位を示す",
          "最も上位の人が食べ始めるのを待つ",
          "常に静かに順番を待つ",
          "感謝の気持ちを頻繁かつ誠実に具体的に伝える"
        ],
        donts: [
          "赤いインクで書かない——死を連想させる",
          "人前で鼻をかまない——そっと席を外す",
          "人や物を直接指差さない",
          "チップを渡さない——侮辱と受け取られる",
          "レストラン、公共交通機関、共有スペースで大声で話さない"
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
      },
      nl: {
        region_name: "Duitsland",
        core_value: "Precisie, betrouwbaarheid en inhoudelijke directheid",
        biggest_taboo: "Te laat komen, vaagheid of holle vleierij — dit alles wordt gezien als een teken van slecht karakter",
        dining_etiquette: "Wacht tot de gastheer 'Guten Appetit' zegt. Houd handen zichtbaar op tafel. Oogcontact tijdens het proost is verplicht.",
        language_notes: "Duitse directheid is precisie, geen grofheid. Verwacht eerlijke, directe feedback. Gebruik titels (Doktor, Professor) totdat anders wordt gezegd.",
        gift_protocol: "Bloemen zijn welkom — vermijd rode rozen (romantisch) en lelies (begrafenis). Pak cadeaus netjes in. Een goede fles wijn is altijd veilig.",
        dress_code: "Formeel, ingetogen en conservatief. Kwaliteit spreekt voor zichzelf. Schreeuwerige kleuren of opzichtige merknamen gelden als slechte smaak.",
        dos: [
          "Wees punctueel — te vroeg is op tijd, op tijd is te laat",
          "Spreek mensen formeel aan (Sie, Herr, Frau) totdat voornaamgebruik wordt uitgenodigd",
          "Bereid u grondig voor op elke vergadering — improvisatie wordt afgekeurd",
          "Houd stevig oogcontact tijdens het proost",
          "Breng uw doel duidelijk en zonder omhaal ter sprake"
        ],
        donts: [
          "Maak geen grove opmerkingen of praat licht over de Duitse geschiedenis",
          "Steek niet over bij rood licht — ook niet als er geen verkeer is",
          "Verwar directheid nooit met vijandigheid — het is gewoon eerlijke communicatie",
          "Begin niet te eten voordat de gastheer aangeeft dat u kunt beginnen",
          "Bespreek geen salaris of persoonlijke financiën in sociale settings"
        ]
      },
      fr: {
        region_name: "Allemagne",
        core_value: "Précision, fiabilité et franchise substantielle",
        biggest_taboo: "Le retard, le vague ou la flatterie creuse — tout cela est perçu comme un signe de mauvais caractère",
        dining_etiquette: "Attendre que l'hôte dise 'Guten Appetit'. Garder les mains visibles sur la table. Le contact visuel lors du toast est obligatoire.",
        language_notes: "La franchise allemande est de la précision, non de la grossièreté. Attendez-vous à des retours directs et honnêtes. Utilisez les titres (Doktor, Professor) jusqu'à indication contraire.",
        gift_protocol: "Les fleurs sont bienvenues — évitez les roses rouges (romantiques) et les lys (funèbres). Emballez les cadeaux correctement. Une bonne bouteille de vin est toujours sûre.",
        dress_code: "Formel, discret et conservateur. La qualité parle d'elle-même. Les couleurs criardes ou les logos ostentatoires sont de mauvais goût.",
        dos: [
          "Être ponctuel — tôt est à l'heure, à l'heure c'est en retard",
          "S'adresser formellement aux gens (Sie, Herr, Frau) jusqu'à invitation au tutoiement",
          "Se préparer soigneusement pour toute réunion — l'improvisation est mal vue",
          "Maintenir un contact visuel ferme lors du toast",
          "Énoncer clairement son propos sans préambule inutile"
        ],
        donts: [
          "Ne pas faire de remarques générales ou parler légèrement de l'histoire allemande",
          "Éviter de traverser au rouge — même en l'absence de circulation",
          "Ne jamais confondre franchise et hostilité — c'est simplement une communication honnête",
          "Ne pas commencer à manger avant que l'hôte ne le signale",
          "Éviter de discuter du salaire ou des finances personnelles"
        ]
      },
      de: {
        region_name: "Deutschland",
        core_value: "Präzision, Zuverlässigkeit und sachliche Direktheit",
        biggest_taboo: "Unpünktlichkeit, Vaguheit oder inhaltsleere Schmeichelei — all das gilt als Zeichen schlechten Charakters",
        dining_etiquette: "Warten Sie, bis der Gastgeber 'Guten Appetit' sagt. Hände sichtbar auf dem Tisch halten. Augenkontakt beim Anstoßen ist Pflicht.",
        language_notes: "Deutsche Direktheit ist Präzision, keine Unhöflichkeit. Erwarten Sie offenes, ehrliches Feedback. Verwenden Sie Titel (Doktor, Professor), bis etwas anderes mitgeteilt wird.",
        gift_protocol: "Blumen sind willkommen — rote Rosen (romantisch) und Lilien (Begräbnis) meiden. Geschenke ordentlich einpacken. Eine gute Flasche Wein ist immer sicher.",
        dress_code: "Formell, dezent und konservativ. Qualität spricht für sich. Grelle Farben oder auffälliges Branding gelten als schlechten Geschmack.",
        dos: [
          "Pünktlich sein — zu früh ist pünktlich, pünktlich ist zu spät",
          "Menschen formell ansprechen (Sie, Herr, Frau), bis zur Einladung zum Duzen",
          "Jeden Termin gründlich vorbereiten — Improvisation wird nicht geschätzt",
          "Beim Anstoßen festen Augenkontakt halten",
          "Den eigenen Standpunkt klar und ohne unnötige Vorrede formulieren"
        ],
        donts: [
          "Keine pauschalen Aussagen machen oder leichtfertig über die deutsche Geschichte sprechen",
          "Nicht bei Rot über die Straße gehen — auch wenn kein Verkehr da ist",
          "Direktheit niemals mit Feindseligkeit verwechseln — es ist schlicht ehrliche Kommunikation",
          "Nicht mit dem Essen beginnen, bevor der Gastgeber das Zeichen gibt",
          "Gehalt oder persönliche Finanzen in gesellschaftlichen Runden nicht ansprechen"
        ]
      },
      es: {
        region_name: "Alemania",
        core_value: "Precisión, fiabilidad y franqueza sustantiva",
        biggest_taboo: "La impuntualidad, la vaguedad o la adulación vacía — todo ello se considera un signo de mal carácter",
        dining_etiquette: "Espere a que el anfitrión diga 'Guten Appetit'. Mantenga las manos visibles sobre la mesa. El contacto visual al brindar es obligatorio.",
        language_notes: "La franqueza alemana es precisión, no grosería. Espere comentarios directos y honestos. Use títulos (Doktor, Professor) hasta que se indique lo contrario.",
        gift_protocol: "Las flores son bienvenidas — evite las rosas rojas (románticas) y los lirios (fúnebres). Envuelva los regalos correctamente. Una buena botella de vino siempre es segura.",
        dress_code: "Formal, discreto y conservador. La calidad habla por sí sola. Los colores llamativos o las marcas ostentosas se consideran de mal gusto.",
        dos: [
          "Sea puntual — llegar temprano es llegar a tiempo, llegar a tiempo es llegar tarde",
          "Diríjase a las personas formalmente (Sie, Herr, Frau) hasta que se le invite a usar el nombre",
          "Prepárese a fondo para cualquier reunión — la improvisación está mal vista",
          "Mantenga contacto visual firme al brindar",
          "Exponga su propósito con claridad y sin preámbulos innecesarios"
        ],
        donts: [
          "No haga comentarios generales ni hable a la ligera sobre la historia alemana",
          "Evite cruzar con el semáforo en rojo — aunque no haya tráfico",
          "Nunca confunda la franqueza con hostilidad — es simplemente comunicación honesta",
          "No comience a comer antes de que el anfitrión lo indique",
          "Evite hablar de salario o finanzas personales en entornos sociales"
        ]
      },
      pt: {
        region_name: "Alemanha",
        core_value: "Precisão, fiabilidade e franqueza substantiva",
        biggest_taboo: "Atraso, vagueza ou adulação vazia — tudo isso é visto como sinal de mau caráter",
        dining_etiquette: "Aguarde que o anfitrião diga 'Guten Appetit'. Mantenha as mãos visíveis sobre a mesa. O contacto visual ao brindar é obrigatório.",
        language_notes: "A franqueza alemã é precisão, não grosseria. Espere feedback direto e honesto. Use títulos (Doktor, Professor) até que lhe digam o contrário.",
        gift_protocol: "As flores são bem-vindas — evite rosas vermelhas (românticas) e lírios (fúnebres). Embale os presentes adequadamente. Uma boa garrafa de vinho é sempre segura.",
        dress_code: "Formal, discreto e conservador. A qualidade fala por si. Cores berrantes ou marcas ostensivas são consideradas mau gosto.",
        dos: [
          "Seja pontual — chegar cedo é chegar a tempo, chegar a tempo é chegar tarde",
          "Trate as pessoas formalmente (Sie, Herr, Frau) até ser convidado a usar o nome próprio",
          "Prepare-se a fundo para qualquer reunião — a improvisação é mal vista",
          "Mantenha contacto visual firme ao brindar",
          "Exprima o seu propósito com clareza e sem preâmbulos desnecessários"
        ],
        donts: [
          "Não faça comentários gerais nem fale levianamente sobre a história alemã",
          "Evite atravessar com o sinal vermelho — mesmo sem tráfego",
          "Nunca confunda franqueza com hostilidade — é simplesmente comunicação honesta",
          "Não comece a comer antes de o anfitrião dar o sinal",
          "Evite falar de salário ou finanças pessoais em contextos sociais"
        ]
      },
      it: {
        region_name: "Germania",
        core_value: "Precisione, affidabilità e franchezza sostanziale",
        biggest_taboo: "Il ritardo, la vaghezza o la lusinga vuota — tutto ciò è considerato un segno di cattivo carattere",
        dining_etiquette: "Attendere che l'ospite dica 'Guten Appetit'. Tenere le mani visibili sul tavolo. Il contatto visivo durante il brindisi è obbligatorio.",
        language_notes: "La franchezza tedesca è precisione, non scortesia. Aspettarsi feedback diretto e onesto. Usare i titoli (Doktor, Professor) finché non viene detto altrimenti.",
        gift_protocol: "I fiori sono benvenuti — evitare le rose rosse (romantiche) e i gigli (funebri). Incartare i regali con cura. Una buona bottiglia di vino è sempre una scelta sicura.",
        dress_code: "Formale, sobrio e conservatore. La qualità parla da sola. I colori sgargianti o i loghi appariscenti sono considerati di cattivo gusto.",
        dos: [
          "Essere puntuali — arrivare presto è arrivare in orario, arrivare in orario è essere in ritardo",
          "Rivolgersi alle persone formalmente (Sie, Herr, Frau) fino all'invito a usare il nome",
          "Prepararsi accuratamente per qualsiasi riunione — l'improvvisazione è disapprovata",
          "Mantenere un fermo contatto visivo durante il brindisi",
          "Esporre il proprio scopo chiaramente e senza preamboli inutili"
        ],
        donts: [
          "Non fare osservazioni generiche né parlare superficialmente della storia tedesca",
          "Evitare di attraversare con il semaforo rosso — anche in assenza di traffico",
          "Non confondere mai la franchezza con l'ostilità — è semplicemente comunicazione onesta",
          "Non iniziare a mangiare prima che l'ospite lo segnali",
          "Evitare di discutere dello stipendio o delle finanze personali in contesti sociali"
        ]
      },
      ar: {
        region_name: "ألمانيا",
        core_value: "الدقة والموثوقية والصراحة الجوهرية",
        biggest_taboo: "التأخير أو الغموض أو المجاملة الفارغة — كل ذلك يُعدّ دليلاً على سوء الشخصية",
        dining_etiquette: "انتظر حتى يقول المضيف 'Guten Appetit'. ضع يديك على الطاولة بشكل واضح. التواصل البصري عند التحميص إلزامي.",
        language_notes: "الصراحة الألمانية دقة وليست وقاحة. توقّع ردود فعل صريحة وصادقة. استخدم الألقاب (Doktor, Professor) حتى يُخبرك بغير ذلك.",
        gift_protocol: "الزهور مرحّب بها — تجنّب الورود الحمراء (رومانسية) والزنابق (جنائزية). ارفق الهدايا بتغليف مناسب. زجاجة نبيذ جيدة آمنة دائمًا.",
        dress_code: "رسمي ومتحفظ وهادئ. الجودة تتكلم بنفسها. الألوان الصارخة أو الشعارات الفاخرة تُعدّ ذوقًا سيئًا.",
        dos: [
          "كن في الموعد — الحضور مبكرًا هو الحضور في الوقت، والحضور في الوقت يعني التأخر",
          "خاطب الناس رسميًا (Sie, Herr, Frau) حتى تُدعى لاستخدام الاسم الأول",
          "استعدّ جيدًا لأي اجتماع — الارتجال غير مقبول",
          "حافظ على تواصل بصري ثابت عند التحميص",
          "وضّح هدفك بوضوح ودون مقدمات غير ضرورية"
        ],
        donts: [
          "لا تُدلِ بتعليقات فضفاضة أو تتحدث باستخفاف عن التاريخ الألماني",
          "تجنّب العبور في الضوء الأحمر — حتى في غياب حركة المرور",
          "لا تخلط أبدًا بين الصراحة والعدوانية — إنها ببساطة تواصل صادق",
          "لا تبدأ الأكل قبل أن يشير المضيف إلى ذلك",
          "تجنّب مناقشة الراتب أو الشؤون المالية الشخصية في التجمعات الاجتماعية"
        ]
      },
      ja: {
        region_name: "ドイツ",
        core_value: "精確さ、信頼性、そして実質的な率直さ",
        biggest_taboo: "遅刻、曖昧さ、中身のないお世辞——いずれも品格の欠如と見なされる",
        dining_etiquette: "ホストが「グーテン・アペティート」と言うまで待つ。手はテーブルの上に見えるように置く。乾杯の際は必ずアイコンタクトを取る。",
        language_notes: "ドイツ人の率直さは精確さであり、無礼ではない。率直で誠実なフィードバックを期待する。別途指示があるまで肩書き（ドクター、プロフェッサー）を使う。",
        gift_protocol: "花は歓迎される——赤いバラ（恋愛的）とユリ（葬儀的）は避ける。プレゼントはきちんと包む。良質なワインは常に安全な選択。",
        dress_code: "フォーマルで控えめ、かつ保守的。品質は自ずと語る。派手な色や目立つブランドロゴは悪趣味と見なされる。",
        dos: [
          "時間厳守——早く来ることが時間通り、時間通りは遅刻",
          "名前の使用を勧められるまでは丁寧に（Sie、Herr、Frau）話す",
          "どんな会議も徹底的に準備する——即興は嫌われる",
          "乾杯の際にしっかりとアイコンタクトを保つ",
          "目的を明確に、余分な前置きなしに述べる"
        ],
        donts: [
          "広範な発言をしたり、ドイツの歴史を軽々しく話したりしない",
          "赤信号では道路を渡らない——車がいなくても",
          "率直さを敵意と混同しない——それは単に誠実なコミュニケーション",
          "ホストが合図するまで食事を始めない",
          "社交の場で給与や個人の財政について話さない"
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
      },
      nl: {
        region_name: "Italië",
        core_value: "Bella figura — uzelf en uw gedrag in alle omstandigheden mooi presenteren",
        biggest_taboo: "Een brutta figura maken: goedkoop, slecht gekleed of grof overkomen in beschaafd gezelschap",
        dining_etiquette: "De lunch is de hoofdmaaltijd. Meng geen gangen — pasta staat los van salade. Cappuccino is strikt een ochtenddrankje. Eet langzaam en geniet.",
        language_notes: "Warmte en passie in expressie zijn vanzelfsprekend en verwacht. Geanimeerde handen zijn onderdeel van de taal. Stilte in gesprek wordt actief vermeden.",
        gift_protocol: "Kwaliteitssnoep, wijn of bloemen — geen chrysanten. Breng iets mee als u voor het diner wordt uitgenodigd. Cadeaus worden direct geopend.",
        dress_code: "Altijd elegant en doordacht. Zelfs casual kleding moet stijlvol zijn. Vermijd sportkleding buiten sportieve contexten. Uiterlijk signaleert zelfrespect.",
        dos: [
          "Groet met twee zoenen (linker wang eerst) bij bekenden",
          "Leer een paar Italiaanse zinnen — de moeite wordt opgemerkt",
          "Kleed u onberispelijk, zeker in kerken en formele omgevingen",
          "Accepteer aangeboden eten en drinken royaal",
          "Complimenteer de maaltijd oprecht en specifiek"
        ],
        donts: [
          "Bestel na 12 uur geen cappuccino — dat verraden direct een buitenstaander",
          "Bekritiseer geen Italiaanse tradities, eten of de familie",
          "Haast geen maaltijd en laat geen ongeduld blijken",
          "Zet nooit kaas op zeevruchtenpasta — dit is een echte culinaire fout",
          "Kom niet te vroeg op een dineruitnodiging"
        ]
      },
      fr: {
        region_name: "Italie",
        core_value: "La bella figura — se présenter et se conduire avec élégance en toutes circonstances",
        biggest_taboo: "Faire une brutta figura : paraître radin, mal habillé ou vulgaire en bonne compagnie",
        dining_etiquette: "Le déjeuner est le repas principal. Ne mélangez pas les plats — les pâtes sont séparées de la salade. Le cappuccino est strictement une boisson du matin. Mangez lentement et savourez.",
        language_notes: "La chaleur et la passion dans l'expression sont naturelles et attendues. Les mains animées font partie du langage. Le silence dans la conversation est activement évité.",
        gift_protocol: "Confiseries de qualité, vin ou fleurs — pas de chrysanthèmes. Apporter quelque chose quand on est invité à dîner. Les cadeaux sont ouverts immédiatement.",
        dress_code: "Élégant et soigné en toutes circonstances. Même la tenue décontractée doit être stylée. Éviter les vêtements de sport hors contexte sportif. L'apparence traduit le respect de soi.",
        dos: [
          "Saluer avec deux bises (joue gauche en premier) entre connaissances",
          "Apprendre quelques phrases en italien — l'effort est remarqué et apprécié",
          "S'habiller impeccablement, surtout dans les églises et tout cadre formel",
          "Accepter généreusement la nourriture et les boissons offertes",
          "Complimenter le repas avec sincérité et appréciation spécifique"
        ],
        donts: [
          "Ne pas commander de cappuccino après midi — cela trahit immédiatement un non-initié",
          "Éviter de critiquer les traditions italiennes, la cuisine ou la famille",
          "Ne pas précipiter un repas ni signaler l'impatience avant la fin",
          "Ne jamais mettre du fromage sur des pâtes aux fruits de mer — c'est une véritable erreur culinaire",
          "Éviter d'arriver trop tôt à une invitation à dîner"
        ]
      },
      de: {
        region_name: "Italien",
        core_value: "Bella figura — sich selbst und sein Verhalten in allen Lebenslagen schön präsentieren",
        biggest_taboo: "Eine brutta figura zu machen: billig, schlecht gekleidet oder grob zu wirken in guter Gesellschaft",
        dining_etiquette: "Das Mittagessen ist die Hauptmahlzeit. Gänge nicht mischen — Pasta ist getrennt vom Salat. Cappuccino ist streng ein Morgengetränk. Langsam essen und genießen.",
        language_notes: "Wärme und Leidenschaft im Ausdruck sind selbstverständlich und erwünscht. Lebhafte Hände sind Teil der Sprache. Stille im Gespräch wird aktiv vermieden.",
        gift_protocol: "Hochwertige Süßwaren, Wein oder Blumen — keine Chrysanthemen. Etwas mitbringen, wenn man zum Abendessen eingeladen ist. Geschenke werden sofort geöffnet.",
        dress_code: "Stets elegant und durchdacht. Auch Freizeitkleidung sollte stilvoll sein. Sportkleidung außerhalb sportlicher Kontexte vermeiden. Äußeres signalisiert Selbstachtung.",
        dos: [
          "Mit zwei Küssen (linke Wange zuerst) unter Bekannten begrüßen",
          "Einige italienische Phrasen lernen — die Mühe wird bemerkt und geschätzt",
          "Tadellos gekleidet sein, besonders in Kirchen und formellen Umgebungen",
          "Angebotenes Essen und Trinken großzügig annehmen",
          "Das Essen aufrichtig und mit spezifischer Wertschätzung loben"
        ],
        donts: [
          "Nach dem Mittag keinen Cappuccino bestellen — das verrät sofort einen Uneingeweihten",
          "Keine Kritik an italienischen Traditionen, Essen oder allem, was mit der Familie zu tun hat",
          "Kein Essen hetzen oder Ungeduld zeigen, bevor alle fertig sind",
          "Niemals Käse auf Meeresfrüchte-Pasta geben — das gilt als echter Kochfehler",
          "Nicht zu früh zu einer Abendeinladung erscheinen"
        ]
      },
      es: {
        region_name: "Italia",
        core_value: "La bella figura — presentarse y comportarse con elegancia en todas las circunstancias",
        biggest_taboo: "Hacer una brutta figura: parecer tacaño, mal vestido o vulgar en buena compañía",
        dining_etiquette: "El almuerzo es la comida principal. No mezcle platos — la pasta va separada de la ensalada. El capuchino es estrictamente una bebida matutina. Coma despacio y disfrute.",
        language_notes: "La calidez y la pasión en la expresión son naturales y esperadas. Las manos expresivas forman parte del lenguaje. El silencio en la conversación se evita activamente.",
        gift_protocol: "Confitería de calidad, vino o flores — no crisantemos. Lleve algo cuando sea invitado a cenar. Los regalos se abren de inmediato.",
        dress_code: "Elegante y cuidado en todo momento. Incluso la ropa informal debe ser estilosa. Evite la ropa deportiva fuera de contextos deportivos. El aspecto señala el autorrespeto.",
        dos: [
          "Salude con dos besos (mejilla izquierda primero) entre conocidos",
          "Aprenda algunas frases en italiano — el esfuerzo se nota y se agradece",
          "Vístase impecablemente, especialmente en iglesias y entornos formales",
          "Acepte generosamente la comida y la bebida ofrecida",
          "Elogie la comida con sinceridad y apreciación específica"
        ],
        donts: [
          "No pida capuchino después del mediodía — eso delata de inmediato a un no iniciado",
          "Evite criticar las tradiciones italianas, la comida o la familia",
          "No apresure una comida ni muestre impaciencia antes de que todos hayan terminado",
          "Nunca ponga queso en la pasta con mariscos — es un error culinario real",
          "Evite llegar antes de tiempo a una invitación a cenar"
        ]
      },
      pt: {
        region_name: "Itália",
        core_value: "Bella figura — apresentar-se e comportar-se com elegância em todas as circunstâncias",
        biggest_taboo: "Fazer uma brutta figura: parecer barato, mal vestido ou grosseiro em boa companhia",
        dining_etiquette: "O almoço é a refeição principal. Não misture pratos — a massa é separada da salada. O cappuccino é estritamente uma bebida matinal. Coma devagar e desfrute.",
        language_notes: "Calor e paixão na expressão são naturais e esperados. As mãos expressivas fazem parte da linguagem. O silêncio na conversa é ativamente evitado.",
        gift_protocol: "Confeitaria de qualidade, vinho ou flores — não crisântemos. Leve algo quando for convidado para jantar. Os presentes são abertos imediatamente.",
        dress_code: "Elegante e cuidado em todos os momentos. Mesmo o traje casual deve ser estiloso. Evite roupa desportiva fora de contextos desportivos. A aparência sinaliza autorrespeito.",
        dos: [
          "Cumprimente com dois beijos (bochecha esquerda primeiro) entre conhecidos",
          "Aprenda algumas frases em italiano — o esforço é notado e bem recebido",
          "Vista-se impecavelmente, especialmente em igrejas e ambientes formais",
          "Aceite com generosidade a comida e a bebida oferecidas",
          "Elogie a refeição com sinceridade e apreciação específica"
        ],
        donts: [
          "Não peça cappuccino depois do meio-dia — isso delata imediatamente um não iniciado",
          "Evite criticar as tradições italianas, a comida ou tudo o que esteja ligado à família",
          "Não apresse uma refeição nem dê sinais de impaciência antes de todos terem terminado",
          "Nunca coloque queijo em massa com frutos do mar — é considerado um erro culinário real",
          "Evite chegar cedo a um jantar"
        ]
      },
      it: {
        region_name: "Italia",
        core_value: "Bella figura — presentarsi e comportarsi con eleganza in ogni circostanza",
        biggest_taboo: "Fare una brutta figura: apparire tirato, mal vestito o volgare in buona compagnia",
        dining_etiquette: "Il pranzo è il pasto principale. Non mescolare i piatti — la pasta è separata dall'insalata. Il cappuccino è rigorosamente una bevanda mattutina. Mangiare lentamente e assaporare.",
        language_notes: "Il calore e la passione nell'espressione sono naturali e attesi. Le mani animate fanno parte del linguaggio. Il silenzio in conversazione viene attivamente evitato.",
        gift_protocol: "Dolciumi di qualità, vino o fiori — non crisantemi. Portare qualcosa quando si è invitati a cena. I regali vengono aperti subito.",
        dress_code: "Elegante e curato in ogni momento. Anche l'abbigliamento casual deve essere stiloso. Evitare l'abbigliamento sportivo fuori dai contesti sportivi. L'aspetto segnala il rispetto per sé stessi.",
        dos: [
          "Salutare con due baci (guancia sinistra per prima) tra conoscenti",
          "Imparare alcune frasi in italiano — lo sforzo viene notato e apprezzato",
          "Vestirsi in modo impeccabile, specialmente nelle chiese e in contesti formali",
          "Accettare con generosità cibo e bevande offerti",
          "Complimentarsi per il pasto con sincerità e apprezzamento specifico"
        ],
        donts: [
          "Non ordinare cappuccino dopo mezzogiorno — tradisce subito chi non è del posto",
          "Evitare di criticare le tradizioni italiane, il cibo o qualsiasi cosa legata alla famiglia",
          "Non affrettare un pasto né segnalare impazienza prima che tutti abbiano finito",
          "Non mettere mai il formaggio sulla pasta ai frutti di mare — è considerato un vero errore culinario",
          "Evitare di arrivare in anticipo a un invito a cena"
        ]
      },
      ar: {
        region_name: "إيطاليا",
        core_value: "البيلا فيغورا — تقديم نفسك وسلوكك بأسلوب جميل في جميع الأحوال",
        biggest_taboo: "ارتكاب البروتا فيغورا: الظهور ببخل أو بمظهر سيء أو بخشونة في المجتمعات الراقية",
        dining_etiquette: "الغداء هو الوجبة الرئيسية. لا تخلط بين الأطباق — المعكرونة منفصلة عن السلطة. الكابتشينو يُشرب حصرًا في الصباح. تناول الطعام ببطء واستمتع.",
        language_notes: "الدفء والعاطفة في التعبير طبيعيان ومتوقعان. حركة اليدين جزء من اللغة. الصمت في الحديث يُتجنّب بنشاط.",
        gift_protocol: "حلويات راقية أو نبيذ أو ورود — لا أقحوان. أحضر شيئًا عند الدعوة لتناول العشاء. تُفتح الهدايا فورًا.",
        dress_code: "أنيق ومتأنٍّ دائمًا. حتى الملابس غير الرسمية يجب أن تكون أنيقة. تجنّب ملابس الرياضة خارج السياق الرياضي. المظهر يعكس احترام الذات.",
        dos: [
          "حيِّ بقبلتين على الخد (الخد الأيسر أولاً) بين المعارف",
          "تعلّم بعض العبارات الإيطالية — الجهد يُلاحظ ويُقدَّر",
          "ارتدِ ملابس أنيقة، خاصةً في الكنائس والمناسبات الرسمية",
          "اقبل الطعام والشراب المقدَّم بكرم",
          "أثنِ على الوجبة بصدق وامتنان محدد"
        ],
        donts: [
          "لا تطلب كابتشينو بعد الظهر — يكشف فورًا عن كونك غير مُلمّ بالثقافة",
          "تجنّب انتقاد التقاليد الإيطالية أو الطعام أو أي شيء يتعلق بالعائلة",
          "لا تستعجل الوجبة ولا تُظهر التذمّر قبل انتهاء الجميع",
          "لا تضع الجبن أبدًا على معكرونة المأكولات البحرية — يُعدّ خطأً طهويًا حقيقيًا",
          "تجنّب الحضور المبكر لدعوة العشاء"
        ]
      },
      ja: {
        region_name: "イタリア",
        core_value: "ベッラ・フィグーラ——あらゆる状況で自分と振る舞いを美しく見せること",
        biggest_taboo: "ブルッタ・フィグーラをすること——礼儀正しい席で安っぽく見えたり、着こなしが悪かったり、粗野な言葉を使うこと",
        dining_etiquette: "昼食がメインの食事。コースは混ぜない——パスタとサラダは別々。カプチーノは厳密に午前中の飲み物。ゆっくり食べて楽しむ。",
        language_notes: "表現における温かさと情熱は自然で期待される。身振り手振りは言語の一部。会話の沈黙は積極的に避けられる。",
        gift_protocol: "高品質の菓子、ワイン、または花——菊は避ける。ディナーに招かれた際は何か持参する。プレゼントはすぐに開ける。",
        dress_code: "常に上品で考え抜かれた装い。カジュアルな服でもスタイリッシュに。スポーツウェアはスポーツの場だけに。外見は自尊心を示す。",
        dos: [
          "知り合い同士では両頬にキス（左から）で挨拶する",
          "イタリア語のフレーズをいくつか覚える——その努力は必ず気づかれる",
          "特に教会やフォーマルな場では完璧な服装を心がける",
          "勧められた食べ物や飲み物は寛大に受け入れる",
          "食事を誠実かつ具体的に褒める"
        ],
        donts: [
          "正午以降にカプチーノを注文しない——すぐに素人だとわかる",
          "イタリアの伝統、料理、家族に関することを批判しない",
          "食事を急いだり、全員が終わる前に焦りを見せたりしない",
          "シーフードパスタにチーズを乗せない——本物の料理上の誤りとされる",
          "ディナーの招待に早く到着しない"
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
      },
      nl: {
        region_name: "Frankrijk",
        core_value: "Intellectuele strengheid, culturele trots en de kunst van het gracieus leven",
        biggest_taboo: "Helemaal geen Frans spreken, gecombineerd met luid of transactioneel gedrag — het signaleert een gebrek aan opvoeding en respect",
        dining_etiquette: "Gangen zijn gescheiden en ongehaast. Houd beide handen zichtbaar op tafel. Brood hoort bij de maaltijd, geen boter. Wijn wordt besproken met echte kennis.",
        language_notes: "Frans is een punt van nationale trots. Begin in het Frans, hoe gebrekkig ook — de poging is wat telt. Intellectueel debat is betrokkenheid, geen conflict.",
        gift_protocol: "Kwaliteitswijn, champagne of specifieke chocolaatjes. Breng geen fles wijn als u gastheer bent. Vermijd chrysanten (begrafenis). Ongepakte wijn is acceptabel.",
        dress_code: "Stil elegant. Kwaliteitsmaterialen en doordachte keuzes. Sportkleding is alleen voor sport. Parijse stijl is ingetogen maar altijd precies.",
        dos: [
          "Begin elke interactie met 'Bonjour' — niet groeten wordt als onbeleefd beschouwd",
          "Neem vrij deel aan intellectuele discussies met oprechte zelfverzekerdheid",
          "Complimenteer het eten specifiek — Frans culinair erfgoed is een bron van echte trots",
          "Respecteer het ongehaaste tempo van maaltijden en vergaderingen",
          "Kleed u zorgvuldig, ook voor schijnbaar informele gelegenheden"
        ],
        donts: [
          "Begin niet in het Engels zonder eerst Frans te proberen",
          "Bespreek geen geld, salaris of prijzen in sociale settings",
          "Haast u niet — ongeduld wordt als plat en provinciaal beschouwd",
          "Vermijd overdreven vrolijkheid met vreemden — warmte moet geleidelijk worden verdiend",
          "Klaag nooit over de Franse cultuur bij een Fransman"
        ]
      },
      fr: {
        region_name: "France",
        core_value: "Rigueur intellectuelle, fierté culturelle et art de vivre avec grâce",
        biggest_taboo: "Ne parler aucun français, associé à un comportement bruyant ou transactionnel — cela signale un manque d'éducation et de respect",
        dining_etiquette: "Les plats sont séparés et servis sans hâte. Garder les deux mains visibles sur la table. Le pain accompagne le repas, sans beurre. Le vin se discute avec une vraie connaissance.",
        language_notes: "Le français est une fierté nationale. Commencer en français, aussi hésitant soit-on — c'est la tentative qui compte. Le débat intellectuel est un engagement, pas un conflit.",
        gift_protocol: "Vin de qualité, champagne ou chocolats choisis. Ne pas apporter une bouteille de vin si vous recevez. Éviter les chrysanthèmes (funéraires). Le vin non emballé est acceptable.",
        dress_code: "Élégance discrète. Matières de qualité et choix réfléchis. La tenue de sport est réservée au sport. Le style parisien est sobre mais toujours précis.",
        dos: [
          "Commencer chaque interaction par 'Bonjour' — ne pas saluer est considéré comme impoli",
          "S'engager librement dans la discussion intellectuelle avec une vraie assurance",
          "Complimenter spécifiquement la nourriture — l'identité culinaire de la France est une source de fierté réelle",
          "Respecter le rythme non pressé des repas et des réunions",
          "S'habiller soigneusement même pour ce qui semble être une occasion décontractée"
        ],
        donts: [
          "Ne pas commencer directement en anglais sans essayer le français",
          "Éviter de parler d'argent, de salaire ou de prix dans tout contexte social",
          "Ne pas se précipiter — l'impatience est considérée comme vulgaire et provinciale",
          "Éviter une jovialité excessive avec des inconnus — la chaleur doit être gagnée progressivement",
          "Ne jamais critiquer la culture française à un Français"
        ]
      },
      de: {
        region_name: "Frankreich",
        core_value: "Intellektuelle Strenge, kultureller Stolz und die Kunst des geistreichen Lebens",
        biggest_taboo: "Überhaupt kein Französisch sprechen, verbunden mit lautem oder transaktionalem Verhalten — das signalisiert mangelnde Bildung und Respekt",
        dining_etiquette: "Gänge sind getrennt und werden ohne Eile serviert. Beide Hände sichtbar auf dem Tisch halten. Brot begleitet die Mahlzeit, ohne Butter. Wein wird mit echtem Wissen diskutiert.",
        language_notes: "Französisch ist ein Punkt des Nationalstolzes. Auf Französisch beginnen, wie auch immer holprig — der Versuch zählt. Intellektuelle Debatte ist Engagement, kein Konflikt.",
        gift_protocol: "Hochwertiger Wein, Champagner oder ausgewählte Schokolade. Keine Weinflasche mitbringen, wenn Sie der Gastgeber sind. Chrysanthemen (Trauerblumen) meiden. Nicht eingewickelter Wein ist akzeptabel.",
        dress_code: "Still elegant. Qualitätsmaterialien und durchdachte Auswahl. Sportkleidung ist nur für den Sport. Pariser Stil ist unauffällig, aber immer präzise.",
        dos: [
          "Jede Interaktion mit 'Bonjour' beginnen — nicht zu grüßen gilt als unhöflich",
          "Frei und mit echtem Selbstvertrauen an intellektuellen Diskussionen teilnehmen",
          "Das Essen spezifisch loben — Frankreichs kulinarische Identität ist eine Quelle echten Stolzes",
          "Das gemächliche Tempo von Mahlzeiten und Besprechungen respektieren",
          "Sich sorgfältig kleiden, auch für scheinbar informelle Anlässe"
        ],
        donts: [
          "Nicht auf Englisch einsteigen, ohne zuerst Französisch zu versuchen",
          "Geld, Gehalt oder Preise in keinem gesellschaftlichen Umfeld ansprechen",
          "Nicht hetzen — Ungeduld gilt als plump und provinziell",
          "Übermäßige Fröhlichkeit gegenüber Fremden vermeiden — Wärme muss allmählich verdient werden",
          "Gegenüber einem Franzosen nie über die französische Kultur klagen"
        ]
      },
      es: {
        region_name: "Francia",
        core_value: "Rigor intelectual, orgullo cultural y el arte de vivir con gracia",
        biggest_taboo: "No hablar nada de francés, unido a un comportamiento ruidoso o transaccional — señala falta de educación y respeto",
        dining_etiquette: "Los platos son separados y se sirven sin prisa. Mantener ambas manos visibles sobre la mesa. El pan acompaña la comida, sin mantequilla. El vino se comenta con verdadero conocimiento.",
        language_notes: "El francés es un punto de orgullo nacional. Comenzar en francés, por titubeante que sea — el intento es lo que importa. El debate intelectual es compromiso, no conflicto.",
        gift_protocol: "Vino de calidad, champán o chocolates específicos. No traer una botella de vino si usted es el anfitrión. Evite los crisantemos (fúnebres). El vino sin envolver es aceptable.",
        dress_code: "Elegancia discreta. Materiales de calidad y elecciones consideradas. La ropa deportiva es solo para deporte. El estilo parisino es sobrio pero siempre preciso.",
        dos: [
          "Comenzar cada interacción con 'Bonjour' — no saludar se considera grosero",
          "Participar con libertad y confianza en debates intelectuales",
          "Elogiar la comida de manera específica — la identidad culinaria de Francia es fuente de orgullo genuino",
          "Respetar el ritmo pausado de las comidas y reuniones",
          "Vestirse con cuidado incluso en lo que parece una ocasión informal"
        ],
        donts: [
          "No lanzarse al inglés sin intentar primero el francés",
          "Evitar hablar de dinero, salario o precios en cualquier contexto social",
          "No apresurarse — la impaciencia se considera tosca y provinciana",
          "Evitar la alegría excesiva con desconocidos — la calidez debe ganarse poco a poco",
          "Nunca quejarse de la cultura francesa a un francés"
        ]
      },
      pt: {
        region_name: "França",
        core_value: "Rigor intelectual, orgulho cultural e a arte de viver com graça",
        biggest_taboo: "Não falar nenhum francês, aliado a um comportamento ruidoso ou transacional — sinaliza falta de educação e respeito",
        dining_etiquette: "Os pratos são separados e servidos sem pressa. Mantenha ambas as mãos visíveis sobre a mesa. O pão acompanha a refeição, sem manteiga. O vinho é discutido com verdadeiro conhecimento.",
        language_notes: "O francês é um ponto de orgulho nacional. Comece em francês, por mais hesitante que seja — a tentativa é o que importa. O debate intelectual é envolvimento, não conflito.",
        gift_protocol: "Vinho de qualidade, champanhe ou chocolates específicos. Não traga uma garrafa de vinho se for o anfitrião. Evite crisântemos (fúnebres). Vinho sem embrulho é aceitável.",
        dress_code: "Elegância discreta. Materiais de qualidade e escolhas ponderadas. Roupa desportiva é apenas para desporto. O estilo parisiense é discreto mas sempre preciso.",
        dos: [
          "Comece cada interação com 'Bonjour' — não cumprimentar é considerado indelicado",
          "Participe livremente e com genuína confiança em debates intelectuais",
          "Elogie a comida de forma específica — a identidade culinária da França é uma fonte de orgulho genuíno",
          "Respeite o ritmo pausado das refeições e reuniões",
          "Vista-se com cuidado, mesmo para uma ocasião aparentemente informal"
        ],
        donts: [
          "Não comece diretamente em inglês sem tentar primeiro o francês",
          "Evite falar de dinheiro, salário ou preços em qualquer contexto social",
          "Não se apresse — a impaciência é considerada grosseira e provinciana",
          "Evite uma alegria excessiva com desconhecidos — a cordialidade deve ser conquistada gradualmente",
          "Nunca se queixe da cultura francesa a um francês"
        ]
      },
      it: {
        region_name: "Francia",
        core_value: "Rigore intellettuale, orgoglio culturale e l'arte di vivere con grazia",
        biggest_taboo: "Non parlare per niente il francese, unito a un comportamento rumoroso o transazionale — segnala mancanza di educazione e rispetto",
        dining_etiquette: "I piatti sono separati e serviti senza fretta. Tenere entrambe le mani visibili sul tavolo. Il pane accompagna il pasto, senza burro. Il vino si discute con vera competenza.",
        language_notes: "Il francese è un punto di orgoglio nazionale. Iniziare in francese, per quanto incerto — è il tentativo che conta. Il dibattito intellettuale è coinvolgimento, non conflitto.",
        gift_protocol: "Vino di qualità, champagne o cioccolati specifici. Non portare una bottiglia di vino se si è i padroni di casa. Evitare i crisantemi (funebri). Il vino non incartato è accettabile.",
        dress_code: "Eleganza discreta. Materiali di qualità e scelte ponderate. L'abbigliamento sportivo è solo per lo sport. Lo stile parigino è sobrio ma sempre preciso.",
        dos: [
          "Iniziare ogni interazione con 'Bonjour' — non salutare è considerato scortese",
          "Partecipare liberamente e con genuina sicurezza alle discussioni intellettuali",
          "Complimentarsi specificamente per il cibo — l'identità culinaria della Francia è fonte di autentico orgoglio",
          "Rispettare il ritmo tranquillo dei pasti e delle riunioni",
          "Vestirsi con cura anche per quella che sembra un'occasione informale"
        ],
        donts: [
          "Non passare direttamente all'inglese senza prima tentare il francese",
          "Evitare di parlare di denaro, stipendio o prezzi in qualsiasi contesto sociale",
          "Non affrettarsi — l'impazienza è considerata rozza e provinciale",
          "Evitare un'eccessiva allegria con gli sconosciuti — il calore va guadagnato gradualmente",
          "Non lamentarsi mai della cultura francese con un francese"
        ]
      },
      ar: {
        region_name: "فرنسا",
        core_value: "الصرامة الفكرية والفخر الثقافي وفن الحياة الرشيقة",
        biggest_taboo: "عدم التحدث بالفرنسية مطلقًا مع سلوك صاخب أو تجاري — يدل على نقص في التعليم والاحترام",
        dining_etiquette: "الأطباق منفصلة وتُقدَّم بدون استعجال. ضع كلتا يديك على الطاولة دائمًا. يرافق الخبز الوجبة بدون زبدة. يُناقَش النبيذ بمعرفة حقيقية.",
        language_notes: "الفرنسية نقطة فخر وطني. ابدأ بالفرنسية، مهما تعثّر نطقك — المحاولة هي ما يهم. النقاش الفكري مشاركة وليس صراعًا.",
        gift_protocol: "نبيذ راقٍ أو شمبانيا أو شوكولاتة محددة. لا تحضر زجاجة نبيذ إن كنت المضيف. تجنّب أزهار الأقحوان (جنائزية). النبيذ غير المغلّف مقبول.",
        dress_code: "أناقة هادئة. مواد عالية الجودة وخيارات متأنية. ملابس الرياضة للرياضة فقط. الأسلوب الباريسي متحفظ لكن دقيق دائمًا.",
        dos: [
          "ابدأ كل تفاعل بـ 'Bonjour' — عدم التحية يُعدّ وقاحة",
          "شارك بحرية وثقة في النقاش الفكري",
          "أثنِ على الطعام تحديدًا — الهوية الطهوية الفرنسية مصدر فخر حقيقي",
          "التزم بالإيقاع غير المتسرّع في الوجبات والاجتماعات",
          "ارتدِ ملابس مناسبة حتى في المناسبات التي تبدو غير رسمية"
        ],
        donts: [
          "لا تنتقل إلى الإنجليزية مباشرةً دون محاولة الفرنسية أولاً",
          "تجنّب الحديث عن المال أو الرواتب أو الأسعار في أي سياق اجتماعي",
          "لا تتسرّع — التسرّع يُعدّ خشنًا ومتحيّزًا",
          "تجنّب البشاشة المفرطة مع الغرباء — تكتسب الدفء تدريجيًا",
          "لا تنتقد أبدًا الثقافة الفرنسية أمام شخص فرنسي"
        ]
      },
      ja: {
        region_name: "フランス",
        core_value: "知的な厳格さ、文化的な誇り、そして優雅な生活の芸術",
        biggest_taboo: "まったくフランス語を話さないこと、加えて声高または取引的な振る舞い——教養と敬意の欠如を示す",
        dining_etiquette: "コースは別々でゆっくりと。両手は常にテーブルの上に見えるようにする。パンは食事に添えるが、バターはつけない。ワインは本物の知識をもって語る。",
        language_notes: "フランス語は国民的誇りの象徴。たどたどしくてもフランス語で始める——試みること自体が重要。知的な議論は対立ではなく参加。",
        gift_protocol: "良質なワイン、シャンパン、特定のチョコレート。あなたがホストの場合はワインを持参しない。菊（葬儀的）は避ける。包装なしのワインも許容される。",
        dress_code: "静かな上品さ。上質な素材と考え抜かれた選択。スポーツウェアはスポーツの場だけ。パリのスタイルは控えめだが常に精確。",
        dos: [
          "すべての交流を「ボンジュール」で始める——挨拶しないことは無礼とされる",
          "知的な議論に自由かつ自信を持って加わる",
          "食事を具体的に褒める——フランスの料理的アイデンティティは本物の誇りの源",
          "食事と会議の急がないペースを守る",
          "一見カジュアルな場であっても服装に気を配る"
        ],
        donts: [
          "フランス語を試みずにいきなり英語を使わない",
          "どんな社交の場でもお金、給与、値段の話は避ける",
          "急がない——焦りは粗野で田舎くさいと見なされる",
          "見知らぬ人への過度な陽気さは避ける——温かさは徐々に築くもの",
          "フランス人にフランスの文化について不満を言わない"
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
      },
      nl: {
        region_name: "België",
        core_value: "Discretie, levenskwaliteit en ingetogen burgerlijke beschaafheid",
        biggest_taboo: "Arrogantie, vertoon of minachtend spreken over Vlaamse of Waalse cultuur in gemengd gezelschap",
        dining_etiquette: "De Belgische keuken wordt serieus genomen. Kom op tijd. Beide handen zichtbaar op tafel. Bier wordt behandeld als wijn — met kennis en doordachte waardering.",
        language_notes: "Taal is een gevoelige kwestie. Vraag welke taal de voorkeur heeft. De Vlaamse (Nederlands) en Waalse (Frans) gemeenschappen hebben een eigen, diep gevoelde identiteit.",
        gift_protocol: "Chocolade, bloemen of kwaliteitswijn. Breng iets mee als u thuis wordt uitgenodigd. Cadeaus worden meestal direct geopend.",
        dress_code: "Conservatief, kwaliteitsgericht en ingetogen. Professionele kleding in Brussel is formeel. Vermijd opvallende merken of flitsende logo's.",
        dos: [
          "Respecteer de taaldivide — ga nooit uit van iemands voorkeurstaal",
          "Wees stipt bij alle professionele en sociale afspraken",
          "Waardeer Belgische chocolade en bier met oprechte interesse en kennis",
          "Spreek mensen formeel aan totdat duidelijk anders wordt uitgenodigd",
          "Houd altijd een beheerst en rustig gesprek"
        ],
        donts: [
          "Maak geen grappen over de Belgische identiteit of de taaldivide — ze worden zelden goed ontvangen",
          "Behandel België niet als slechts een doorvoerland — dit wordt als neerbuigend ervaren",
          "Vermijd overdreven vertrouwelijk gedrag bij een eerste ontmoeting",
          "Verwar de Vlaamse en Waalse culturele gewoonten niet",
          "Bespreek geen Belgische politiek tenzij u echte kennis heeft van de context"
        ]
      },
      fr: {
        region_name: "Belgique",
        core_value: "Discrétion, qualité de vie et civilité civique discrète",
        biggest_taboo: "L'arrogance, l'ostentation ou tenir des propos dédaigneux sur la culture flamande ou wallonne en société mixte",
        dining_etiquette: "La cuisine belge est prise au sérieux. Arriver à l'heure. Les deux mains visibles sur la table. La bière est traitée comme le vin — avec connaissance et appréciation.",
        language_notes: "La langue est une question sensible. Demander quelle langue est préférée. Les communautés flamande (néerlandais) et wallonne (français) ont des identités distinctes et profondément ressenties.",
        gift_protocol: "Chocolats, fleurs ou vin de qualité. Apporter quelque chose quand on est invité chez quelqu'un. Les cadeaux sont généralement ouverts à la réception.",
        dress_code: "Conservateur, axé sur la qualité et discret. La tenue professionnelle à Bruxelles est formelle. Éviter les marques voyantes ou les logos tape-à-l'œil.",
        dos: [
          "Respecter la fracture linguistique — ne jamais supposer la langue préférée de quelqu'un",
          "Arriver ponctuellement à tous les rendez-vous professionnels et sociaux",
          "Apprécier le chocolat et la bière belges avec un intérêt et une connaissance authentiques",
          "S'adresser aux gens formellement jusqu'à invitation expresse",
          "Maintenir une conversation mesurée et posée en toutes circonstances"
        ],
        donts: [
          "Éviter les plaisanteries sur l'identité belge ou la fracture linguistique — elles sont rarement bien reçues",
          "Ne pas traiter la Belgique comme une simple étape de transit — cela est perçu comme condescendant",
          "Éviter un comportement trop familier lors d'une première rencontre",
          "Ne pas confondre les coutumes culturelles flamandes et wallonnes",
          "Éviter de discuter de la politique belge sans une vraie connaissance du contexte"
        ]
      },
      de: {
        region_name: "Belgien",
        core_value: "Diskretion, Lebensqualität und zurückhaltende bürgerliche Höflichkeit",
        biggest_taboo: "Arroganz, Zurschaustellung oder abfällige Bemerkungen über flämische oder wallonische Kultur in gemischter Gesellschaft",
        dining_etiquette: "Die belgische Küche wird ernst genommen. Pünktlich erscheinen. Beide Hände sichtbar auf dem Tisch. Bier wird wie Wein behandelt — mit Wissen und durchdachter Wertschätzung.",
        language_notes: "Sprache ist ein heikles Thema. Fragen, welche Sprache bevorzugt wird. Die flämische (Niederländisch) und wallonische (Französisch) Gemeinschaft haben ausgeprägte, tiefempfundene Identitäten.",
        gift_protocol: "Schokolade, Blumen oder hochwertiger Wein. Etwas mitbringen, wenn man zu jemandem nach Hause eingeladen ist. Geschenke werden normalerweise beim Empfang geöffnet.",
        dress_code: "Konservativ, qualitätsorientiert und dezent. Professionelle Kleidung in Brüssel ist formell. Auffällige Marken oder grelle Logos vermeiden.",
        dos: [
          "Die Sprachgrenze respektieren — nie die bevorzugte Sprache einer Person annehmen",
          "Pünktlich zu allen beruflichen und gesellschaftlichen Terminen erscheinen",
          "Belgische Schokolade und Bier mit echtem Interesse und Wissen schätzen",
          "Personen formell ansprechen, bis ausdrücklich anders eingeladen",
          "Jederzeit eine gemessene, besonnene Unterhaltung führen"
        ],
        donts: [
          "Keine Witze über die belgische Identität oder die Sprachgrenze machen — sie kommen selten gut an",
          "Belgien nicht als bloße Durchgangsstation behandeln — das wird als herablassend empfunden",
          "Übermäßig vertrautes Verhalten beim ersten Treffen vermeiden",
          "Flämische und wallonische Kulturgewohnheiten nicht verwechseln",
          "Belgische Politik nicht besprechen, ohne echte Kenntnisse des Kontexts zu haben"
        ]
      },
      es: {
        region_name: "Bélgica",
        core_value: "Discreción, calidad de vida y civilidad cívica discreta",
        biggest_taboo: "La arrogancia, la ostentación o hablar con desdén sobre la cultura flamenca o valona en compañía mixta",
        dining_etiquette: "La cocina belga se toma en serio. Llegue a tiempo. Ambas manos visibles sobre la mesa. La cerveza se trata como el vino — con conocimiento y apreciación.",
        language_notes: "El idioma es una cuestión delicada. Pregunte qué idioma se prefiere. Las comunidades flamenca (neerlandés) y valona (francés) tienen identidades distintas y profundamente sentidas.",
        gift_protocol: "Chocolates, flores o vino de calidad. Lleve algo cuando sea invitado a casa de alguien. Los regalos generalmente se abren al recibirlos.",
        dress_code: "Conservador, orientado a la calidad y discreto. La indumentaria profesional en Bruselas es formal. Evite marcas llamativas o logotipos ostentosos.",
        dos: [
          "Respetar la división lingüística — nunca asumir el idioma preferido de alguien",
          "Llegar puntual a todas las citas profesionales y sociales",
          "Apreciar el chocolate y la cerveza belgas con genuino interés y conocimiento",
          "Dirigirse a las personas formalmente hasta ser invitado a hacer lo contrario",
          "Mantener una conversación medida y serena en todo momento"
        ],
        donts: [
          "Evitar los chistes sobre la identidad belga o la división lingüística — rara vez se reciben bien",
          "No tratar Bélgica como una mera parada de tránsito — se percibe como condescendiente",
          "Evitar un comportamiento demasiado familiar en un primer encuentro",
          "No confundir las costumbres culturales flamencas y valonas",
          "Evitar hablar de política belga sin tener conocimiento genuino del contexto"
        ]
      },
      pt: {
        region_name: "Bélgica",
        core_value: "Discrição, qualidade de vida e civismo urbano discreto",
        biggest_taboo: "Arrogância, ostentação ou falar de forma depreciativa sobre a cultura flamenga ou valona em companhia mista",
        dining_etiquette: "A cozinha belga é levada a sério. Chegue a tempo. Ambas as mãos visíveis sobre a mesa. A cerveja é tratada como vinho — com conhecimento e apreciação.",
        language_notes: "O idioma é um assunto sensível. Pergunte qual língua é preferida. As comunidades flamenga (neerlandês) e valona (francês) têm identidades distintas e profundamente sentidas.",
        gift_protocol: "Chocolates, flores ou vinho de qualidade. Leve algo quando for convidado a casa de alguém. Os presentes geralmente são abertos quando recebidos.",
        dress_code: "Conservador, orientado para a qualidade e discreto. A indumentária profissional em Bruxelas é formal. Evite marcas conspícuas ou logótipos berrantes.",
        dos: [
          "Respeitar a divisão linguística — nunca assumir o idioma preferido de alguém",
          "Chegar pontualmente a todos os compromissos profissionais e sociais",
          "Apreciar o chocolate e a cerveja belgas com genuíno interesse e conhecimento",
          "Dirigir-se às pessoas formalmente até ser claramente convidado a fazer o contrário",
          "Manter sempre uma conversa ponderada e serena"
        ],
        donts: [
          "Evitar piadas sobre a identidade belga ou a divisão linguística — raramente são bem recebidas",
          "Não tratar a Bélgica como mera paragem de trânsito — isso é percebido como condescendente",
          "Evitar comportamento excessivamente familiar num primeiro encontro",
          "Não confundir costumes culturais flamengos e valões",
          "Evitar discutir política belga sem ter conhecimento genuíno do contexto"
        ]
      },
      it: {
        region_name: "Belgio",
        core_value: "Discrezione, qualità della vita e civiltà civica sobria",
        biggest_taboo: "L'arroganza, l'ostentazione o il parlare sprezzantemente della cultura fiamminga o vallone in compagnia mista",
        dining_etiquette: "La cucina belga viene presa sul serio. Arrivare puntuali. Entrambe le mani visibili sul tavolo. La birra viene trattata come il vino — con conoscenza e apprezzamento ponderato.",
        language_notes: "La lingua è una questione delicata. Chiedere quale lingua si preferisce. Le comunità fiamminga (olandese) e vallone (francese) hanno identità distinte e profondamente sentite.",
        gift_protocol: "Cioccolato, fiori o vino di qualità. Portare qualcosa quando si è invitati a casa di qualcuno. I regali vengono di solito aperti al ricevimento.",
        dress_code: "Conservatore, orientato alla qualità e sobrio. L'abbigliamento professionale a Bruxelles è formale. Evitare marchi vistosi o loghi appariscenti.",
        dos: [
          "Rispettare la divisione linguistica — non presumere mai la lingua preferita di qualcuno",
          "Arrivare puntuali a tutti gli appuntamenti professionali e sociali",
          "Apprezzare cioccolato e birra belgi con genuino interesse e competenza",
          "Rivolgersi alle persone formalmente fino a esplicito invito contrario",
          "Mantenere sempre una conversazione misurata e composta"
        ],
        donts: [
          "Evitare battute sull'identità belga o sulla divisione linguistica — raramente sono ben accolte",
          "Non trattare il Belgio come una semplice tappa di transito — è percepito come condiscendente",
          "Evitare un comportamento eccessivamente familiare al primo incontro",
          "Non confondere le usanze culturali fiamminghe e valloni",
          "Evitare di discutere di politica belga senza una vera conoscenza del contesto"
        ]
      },
      ar: {
        region_name: "بلجيكا",
        core_value: "التكتم وجودة الحياة واللطف المدني المتحفظ",
        biggest_taboo: "الغطرسة أو الاستعراض أو التقليل من شأن الثقافة الفلمنكية أو الوالونية في المجالس المختلطة",
        dining_etiquette: "يُؤخذ المطبخ البلجيكي بجدية. احضر في الوقت المحدد. ضع كلتا يديك على الطاولة. تُعامَل البيرة كالنبيذ — بمعرفة وتقدير.",
        language_notes: "اللغة موضوع حساس. اسأل عن اللغة المفضّلة. المجتمعان الفلمنكي (الهولندي) والوالوني (الفرنسي) لهما هويتان متميزتان عميقتا الجذور.",
        gift_protocol: "شوكولاتة أو ورود أو نبيذ راقٍ. أحضر شيئًا عند الدعوة لزيارة بيت أحدهم. تُفتح الهدايا عادةً عند تسلّمها.",
        dress_code: "محافظ وعالي الجودة وهادئ. الملبس المهني في بروكسل رسمي. تجنّب العلامات التجارية اللافتة أو الشعارات البرّاقة.",
        dos: [
          "احترم الانقسام اللغوي — لا تفترض أبدًا اللغة المفضّلة لشخص ما",
          "احضر بدقة في جميع المواعيد المهنية والاجتماعية",
          "أبدِ اهتمامًا حقيقيًا بالشوكولاتة والبيرة البلجيكية",
          "خاطب الناس رسميًا حتى تُدعى إلى خلاف ذلك",
          "حافظ على حوار هادئ ومتزن في جميع الأوقات"
        ],
        donts: [
          "تجنّب الدعابات حول الهوية البلجيكية أو الانقسام اللغوي — نادرًا ما تُقابَل بقبول",
          "لا تعامل بلجيكا على أنها مجرد محطة عبور — يُعدّ ذلك استهزاءً",
          "تجنّب الألفة المفرطة في اللقاء الأول",
          "لا تخلط بين العادات الثقافية الفلمنكية والوالونية",
          "تجنّب الحديث عن السياسة البلجيكية دون معرفة حقيقية بالسياق"
        ]
      },
      ja: {
        region_name: "ベルギー",
        core_value: "慎重さ、生活の質、そして控えめな市民的礼節",
        biggest_taboo: "傲慢さ、見せびらかし、あるいは混合した場でフラマン語圏やワロン語圏の文化を軽視すること",
        dining_etiquette: "ベルギー料理は真剣に扱われる。時間通りに到着する。両手はテーブルの上に見えるように。ビールはワインと同様に——知識と考え抜かれた感謝を持って扱う。",
        language_notes: "言語は繊細な問題。どの言語が好まれるか尋ねる。フラマン語（オランダ語）圏とワロン語（フランス語）圏のコミュニティはそれぞれ独自の深く感じられるアイデンティティを持つ。",
        gift_protocol: "チョコレート、花、または良質なワイン。家に招かれた際は何か持参する。プレゼントは通常受け取った際に開ける。",
        dress_code: "保守的で品質重視、かつ控えめ。ブリュッセルのビジネスドレスはフォーマル。目立つブランドや派手なロゴは避ける。",
        dos: [
          "言語の境界を尊重する——相手の好む言語を決して決めつけない",
          "全ての職業的・社会的約束に時間厳守で出席する",
          "ベルギーのチョコレートとビールを本物の興味と知識を持って評価する",
          "明確に別の指示があるまでは正式に人に話しかける",
          "常に穏やかで落ち着いた会話を維持する"
        ],
        donts: [
          "ベルギーのアイデンティティや言語分裂についての冗談は避ける——ほとんど好意的に受け取られない",
          "ベルギーを単なる通過点として扱わない——軽蔑的と受け取られる",
          "初めての出会いで過度に馴れ馴れしくしない",
          "フラマン語圏とワロン語圏の文化的習慣を混同しない",
          "ベルギーの政治について深い知識なしに議論しない"
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
      },
      nl: {
        region_name: "Zwitserland",
        core_value: "Precisie, stiptheid, discretie en vertrouwen dat verdiend moet worden",
        biggest_taboo: "Te laat komen, lawaai of opvallend gedrag van welke aard dan ook — dit alles duidt op een slecht karakter en gebrek aan respect",
        dining_etiquette: "Wacht tot iedereen bediend is voordat u begint te eten. Bij een toost is direct oogcontact met elke persoon aan tafel verplicht. Eet alles op uw bord op.",
        language_notes: "Zwitserland heeft vier officiële talen. Vraag welke de voorkeur heeft in het betreffende kanton. Zwitsers-Duits wijkt aanzienlijk af van standaard Duits. Precisie in spraak is een deugd.",
        gift_protocol: "Bloemen, kwaliteitschocolade of wijn. Verwijder de verpakking van een wijnfles voor het geven. Cadeaus zijn bescheiden en passend — extravagantie wordt met argwaan bekeken.",
        dress_code: "Conservatief, verzorgd en kwaliteitsgericht. Persoonlijk vermogen wordt niet getoond. Praktische elegantie is de Zwitserse standaard.",
        dos: [
          "Wees punctueel tot de minuut — punctualiteit is een morele deugd",
          "Begroet elke persoon individueel met een stevige handdruk en direct oogcontact",
          "Respecteer de stille uren (22:00–07:00) in woonwijken strikt",
          "Wacht altijd ordelijk en correct in de rij",
          "Pas uw gespreksstijl aan die van uw gastheer — blijf formeel totdat anders wordt uitgenodigd"
        ],
        donts: [
          "Kom nooit te laat — dit wordt diep respectloos gevonden",
          "Doe geen aannames over de Zwitserse identiteit of het nationale karakter",
          "Bespreek geen persoonlijk vermogen, salaris of prijzen in sociale settings",
          "Vermijd luid of storend gedrag in openbare ruimtes",
          "Gooi nooit recyclebaar afval fout weg — naleving van recyclingregels wordt serieus genomen"
        ]
      },
      fr: {
        region_name: "Suisse",
        core_value: "Précision, ponctualité, discrétion et confiance qui doit se mériter",
        biggest_taboo: "Le retard, le bruit ou tout comportement ostentatoire — tous signalent un mauvais caractère et un manque d'égard envers autrui",
        dining_etiquette: "Attendre que tout le monde soit servi avant de manger. Les toasts exigent un contact visuel direct avec chaque personne à table. Finir tout ce qui est dans l'assiette.",
        language_notes: "La Suisse a quatre langues officielles. Demander laquelle est préférée dans le canton concerné. Le suisse-allemand diffère sensiblement de l'allemand standard. La précision dans le discours est une vertu.",
        gift_protocol: "Fleurs, chocolats de qualité ou vin. Retirer l'emballage d'une bouteille de vin avant de l'offrir. Les cadeaux sont modestes et appropriés — l'extravagance est perçue avec méfiance.",
        dress_code: "Conservateur, soigné et axé sur la qualité. La richesse personnelle ne se montre pas. L'élégance pratique est la norme suisse.",
        dos: [
          "Être ponctuel à la minute — la ponctualité est considérée comme une vertu morale",
          "Saluer chaque personne individuellement, avec une poignée de main ferme et un contact visuel direct",
          "Respecter strictement les heures de silence (22h–7h) dans les zones résidentielles",
          "Faire la queue correctement et de manière ordonnée en toutes circonstances",
          "S'adapter au registre de conversation de son hôte — rester formel jusqu'à invitation contraire"
        ],
        donts: [
          "Ne jamais être en retard — c'est profondément irrespectueux et difficilement pardonné",
          "Éviter de formuler des suppositions sur l'identité suisse ou le caractère national",
          "Ne pas parler de fortune personnelle, de salaires ou de prix en société",
          "Éviter tout comportement bruyant ou perturbateur dans les espaces publics",
          "Ne jamais trier incorrectement les recyclables — le respect du tri est pris très au sérieux"
        ]
      },
      de: {
        region_name: "Schweiz",
        core_value: "Präzision, Pünktlichkeit, Diskretion und Vertrauen, das verdient werden muss",
        biggest_taboo: "Verspätung, Lärm oder auffälliges Verhalten jeder Art — all das signalisiert schlechten Charakter und Rücksichtslosigkeit",
        dining_etiquette: "Warten, bis alle bedient wurden, bevor man mit dem Essen beginnt. Bei Toasts ist direkter Augenkontakt mit jeder Person am Tisch der Reihe nach erforderlich. Den Teller leer essen.",
        language_notes: "Die Schweiz hat vier Amtssprachen. Fragen, welche im jeweiligen Kanton bevorzugt wird. Schweizerdeutsch weicht erheblich vom Hochdeutschen ab. Präzision in der Sprache ist eine Tugend.",
        gift_protocol: "Blumen, hochwertige Schokolade oder Wein. Verpackung einer Weinflasche vor dem Überreichen entfernen. Geschenke sind bescheiden und angemessen — Extravaganz wird mit Argwohn betrachtet.",
        dress_code: "Konservativ, gepflegt und qualitätsorientiert. Persönlicher Reichtum wird nicht zur Schau gestellt. Praktische Eleganz ist der Schweizer Standard.",
        dos: [
          "Auf die Minute pünktlich sein — Pünktlichkeit gilt als moralische Tugend",
          "Jede Person einzeln mit einem festen Handschlag und direktem Augenkontakt begrüßen",
          "Ruhezeiten (22–7 Uhr) in Wohngebieten strikt einhalten",
          "Stets korrekt und geordnet in der Schlange warten",
          "Den Gesprächston des Gastgebers anpassen — formell bleiben, bis anders eingeladen"
        ],
        donts: [
          "Niemals zu spät kommen — es ist zutiefst respektlos und wird kaum verziehen",
          "Keine Annahmen über die Schweizer Identität oder den Nationalcharakter machen",
          "Persönliches Vermögen, Gehälter oder Preise in gesellschaftlichem Rahmen nicht ansprechen",
          "Jegliches lautes oder störendes Verhalten in öffentlichen Räumen vermeiden",
          "Recycelbare Abfälle niemals falsch entsorgen — Recycling-Compliance wird ernst genommen"
        ]
      },
      es: {
        region_name: "Suiza",
        core_value: "Precisión, puntualidad, discreción y confianza que debe ganarse",
        biggest_taboo: "La impuntualidad, el ruido o cualquier comportamiento llamativo — todo ello señala mal carácter y falta de consideración hacia los demás",
        dining_etiquette: "Esperar a que todos sean servidos antes de comer. Los brindis requieren contacto visual directo con cada persona de la mesa. Terminar todo lo que hay en el plato.",
        language_notes: "Suiza tiene cuatro idiomas oficiales. Pregunte cuál se prefiere en el cantón correspondiente. El alemán suizo difiere significativamente del alemán estándar. La precisión en el habla es una virtud.",
        gift_protocol: "Flores, chocolates de calidad o vino. Retire el envoltorio de una botella de vino antes de ofrecerla. Los regalos son modestos y apropiados — la extravagancia se ve con recelo.",
        dress_code: "Conservador, cuidado y orientado a la calidad. La riqueza personal no se exhibe. La elegancia práctica es el estándar suizo.",
        dos: [
          "Ser puntual al minuto — la puntualidad se considera una virtud moral",
          "Saludar a cada persona individualmente, con un apretón de manos firme y contacto visual directo",
          "Respetar estrictamente las horas de silencio (22:00–7:00) en zonas residenciales",
          "Hacer cola correctamente y de forma ordenada en todo momento",
          "Adaptar el registro conversacional al del anfitrión — permanecer formal hasta invitación contraria"
        ],
        donts: [
          "Nunca llegar tarde — es profundamente irrespetuoso y difícilmente perdonado",
          "Evitar hacer suposiciones sobre la identidad suiza o el carácter nacional",
          "No hablar de riqueza personal, salarios o precios en entornos sociales",
          "Evitar cualquier comportamiento ruidoso o perturbador en espacios públicos",
          "Nunca desechar incorrectamente los reciclables — el cumplimiento del reciclaje se toma muy en serio"
        ]
      },
      pt: {
        region_name: "Suíça",
        core_value: "Precisão, pontualidade, discrição e confiança que tem de ser conquistada",
        biggest_taboo: "Atraso, barulho ou qualquer comportamento conspícuo — tudo sinaliza mau caráter e falta de consideração pelos outros",
        dining_etiquette: "Aguardar que todos sejam servidos antes de comer. Os brindes requerem contacto visual direto com cada pessoa à mesa, por turnos. Terminar tudo o que está no prato.",
        language_notes: "A Suíça tem quatro línguas oficiais. Pergunte qual é preferida no cantão relevante. O alemão suíço difere significativamente do alemão padrão. A precisão no discurso é uma virtude.",
        gift_protocol: "Flores, chocolates de qualidade ou vinho. Retirar o embrulho de uma garrafa de vinho antes de oferecer. Os presentes são modestos e adequados — a extravagância é vista com suspeita.",
        dress_code: "Conservador, cuidado e orientado para a qualidade. A riqueza pessoal não é exibida. A elegância prática é o padrão suíço.",
        dos: [
          "Ser pontual ao minuto — a pontualidade é tratada como uma virtude moral",
          "Cumprimentar cada pessoa individualmente, com um aperto de mão firme e contacto visual direto",
          "Respeitar rigorosamente as horas de silêncio (22h–7h) em zonas residenciais",
          "Fazer fila de forma correta e ordenada em todos os momentos",
          "Adaptar o registo conversacional ao do anfitrião — manter-se formal até convite contrário"
        ],
        donts: [
          "Nunca chegar atrasado — é profundamente desrespeitoso e dificilmente perdoado",
          "Evitar fazer suposições sobre a identidade suíça ou o caráter nacional",
          "Não discutir riqueza pessoal, salários ou preços em contextos sociais",
          "Evitar qualquer comportamento ruidoso ou perturbador em espaços públicos",
          "Nunca descartar recicláveis incorretamente — o cumprimento da reciclagem é levado muito a sério"
        ]
      },
      it: {
        region_name: "Svizzera",
        core_value: "Precisione, puntualità, discrezione e fiducia che deve essere guadagnata",
        biggest_taboo: "Il ritardo, il rumore o qualsiasi comportamento vistoso — tutto segnala un cattivo carattere e mancanza di riguardo verso gli altri",
        dining_etiquette: "Aspettare che tutti siano serviti prima di mangiare. I brindisi richiedono il contatto visivo diretto con ogni persona a tavola a turno. Finire tutto quello che c'è nel piatto.",
        language_notes: "La Svizzera ha quattro lingue ufficiali. Chiedere quale si preferisce nel cantone di riferimento. Lo svizzero tedesco differisce significativamente dal tedesco standard. La precisione nel linguaggio è una virtù.",
        gift_protocol: "Fiori, cioccolato di qualità o vino. Rimuovere la confezione da una bottiglia di vino prima di donarla. I regali sono modesti e appropriati — l'estravaganza è vista con sospetto.",
        dress_code: "Conservatore, curato e orientato alla qualità. La ricchezza personale non si ostenta. L'eleganza pratica è lo standard svizzero.",
        dos: [
          "Essere puntuali al minuto — la puntualità è considerata una virtù morale",
          "Salutare ogni persona individualmente, con una stretta di mano ferma e contatto visivo diretto",
          "Rispettare rigorosamente le ore di silenzio (22:00–7:00) nelle aree residenziali",
          "Fare la fila in modo corretto e ordinato in ogni momento",
          "Adattare il registro conversazionale a quello del padrone di casa — rimanere formali fino a invito contrario"
        ],
        donts: [
          "Non essere mai in ritardo — è profondamente irrispettoso e difficilmente perdonato",
          "Evitare di fare supposizioni sull'identità svizzera o sul carattere nazionale",
          "Non discutere di ricchezza personale, stipendi o prezzi in contesti sociali",
          "Evitare qualsiasi comportamento rumoroso o dirompente negli spazi pubblici",
          "Non smaltire mai i riciclabili in modo scorretto — il rispetto del riciclo è preso molto sul serio"
        ]
      },
      ar: {
        region_name: "سويسرا",
        core_value: "الدقة والانضباط والتكتم والثقة التي يجب كسبها",
        biggest_taboo: "التأخير أو الضوضاء أو أي سلوك لافت — كل ذلك يدل على سوء الشخصية وانعدام الاحترام للآخرين",
        dining_etiquette: "انتظر حتى يُخدَّم الجميع قبل الأكل. تستلزم نخبات التحميص التواصل البصري المباشر مع كل شخص على الطاولة بالتسلسل. أنهِ كل ما في طبقك.",
        language_notes: "تمتلك سويسرا أربع لغات رسمية. اسأل عن اللغة المفضّلة في المقاطعة ذات الصلة. تختلف اللهجة الألمانية السويسرية عن الألمانية المعيارية اختلافًا كبيرًا. الدقة في الكلام فضيلة.",
        gift_protocol: "ورود أو شوكولاتة عالية الجودة أو نبيذ. أزل غلاف زجاجة النبيذ قبل تقديمها. الهدايا متواضعة ومناسبة — التبذير يُنظر إليه بريبة.",
        dress_code: "محافظ ونظيف وعالي الجودة. لا يُظهَر الثراء الشخصي. الأناقة العملية هي المعيار السويسري.",
        dos: [
          "كن في الموعد بالدقيقة — الانضباط يُعامَل باعتباره فضيلة أخلاقية",
          "حيِّ كل شخص بمفرده بمصافحة قوية وتواصل بصري مباشر",
          "التزم صارمًا بساعات الصمت (10 مساءً–7 صباحًا) في المناطق السكنية",
          "انتظر في الطابور بصورة صحيحة ومنظمة دائمًا",
          "تكيّف مع أسلوب محادثة مضيفك — ابقَ رسميًا حتى تُدعى إلى غير ذلك"
        ],
        donts: [
          "لا تتأخر أبدًا — إنه عدم احترام عميق ونادرًا ما يُغتفر",
          "تجنّب الافتراضات حول الهوية السويسرية أو الطابع الوطني",
          "لا تناقش الثروة الشخصية أو الرواتب أو الأسعار في التجمعات الاجتماعية",
          "تجنّب أي سلوك صاخب أو مزعج في الأماكن العامة",
          "لا ترمِ النفايات القابلة لإعادة التدوير بشكل غير صحيح — الالتزام بإعادة التدوير أمر جدي"
        ]
      },
      ja: {
        region_name: "スイス",
        core_value: "精確さ、時間厳守、慎重さ、そして勝ち取らなければならない信頼",
        biggest_taboo: "遅刻、騒音、あらゆる目立つ行動——これら全ては悪い品格と他者への配慮のなさを示す",
        dining_etiquette: "全員が給仕されるまで待ってから食べ始める。乾杯の際はテーブルの全員と順番に直接アイコンタクトを取る。皿の上のものは全部食べる。",
        language_notes: "スイスには4つの公用語がある。関連する州でどれが好まれるか尋ねる。スイスドイツ語は標準ドイツ語と大きく異なる。言葉の精確さは美徳。",
        gift_protocol: "花、高品質のチョコレート、またはワイン。ワインボトルは渡す前に包みを外す。贈り物は控えめで適切に——豪華さは疑いの目で見られる。",
        dress_code: "保守的で清潔感があり、品質重視。個人の富は誇示しない。実用的な上品さがスイスの基準。",
        dos: [
          "1分単位で時間を守る——時間厳守は道徳的美徳として扱われる",
          "それぞれの人に個別に、しっかりした握手と直接のアイコンタクトで挨拶する",
          "住宅地の静寂時間（22時〜7時）を厳密に守る",
          "常に正しく整然と順番を待つ",
          "ホストの会話のトーンに合わせる——招待されるまで正式な態度を保つ"
        ],
        donts: [
          "絶対に遅刻しない——深く無礼であり、なかなか許されない",
          "スイスのアイデンティティや国民性について推測しない",
          "社交の場で個人の財産、給与、価格について話さない",
          "公共の場での騒がしいまたは迷惑な行動を避ける",
          "リサイクル品を誤って捨てない——リサイクルの遵守は真剣に扱われる"
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
      },
      nl: {
        region_name: "Singapore",
        core_value: "Meritocratie, burgerlijke orde en gecomponeerde meertalige verfijning",
        biggest_taboo: "Openbare vernedering veroorzaken, zwerfvuil achterlaten of regels overtreden — dit alles zijn echte tekortkomingen in burgerlijk karakter",
        dining_etiquette: "Hawkercentra zijn cultureel centraal — bezoek ze respectvol. 'Chope' (plaatsen reserveren met een tissuepakje) is standaard. Voedselrestricties variëren sterk — vraag altijd.",
        language_notes: "Engels is de officiële taal van het bedrijfsleven. Singlish mag niet worden bespot — het is een bron van echte culturele identiteit. Spreek duidelijk maar nooit neerbuigend.",
        gift_protocol: "Vermijd klokken (geassocieerd met de dood) of sets van vier voor Chinese Singaporezen. Breng iets mee als u thuis wordt uitgenodigd. Cadeaus worden niet altijd direct geopend.",
        dress_code: "Netjes en praktisch gegeven het tropische klimaat. Zakelijk formeel in bedrijfsomgevingen. Conservatieve kleding voor tempels en moskeeën is niet onderhandelbaar.",
        dos: [
          "Respecteer de buitengewone diversiteit van Maleise, Chinese, Indiase en Euraziatische culturen",
          "Eet alles op uw bord — verspilling wordt als onrespectful beschouwd",
          "Wacht altijd correct in de rij — dit is een punt van burgerlijke trots",
          "Erken anciënniteit en wijs respectvol toe waar passend",
          "Draag altijd een opvouwbare paraplu — het weer verandert snel"
        ],
        donts: [
          "Kauw nooit kauwgum in het openbaar — dit blijft streng beperkt",
          "Gooi onder geen enkele omstandigheid afval op straat",
          "Vermijd oversteken op verboden plaatsen — boetes zijn echt en worden gehandhaafd",
          "Maak geen neerbuigende opmerkingen over de regels van Singapore",
          "Bespreek ras of religie niet op nonchalante of onnadenkende wijze"
        ]
      },
      fr: {
        region_name: "Singapour",
        core_value: "Méritocratie, ordre civique et sophistication multilingue composée",
        biggest_taboo: "Causer une gêne publique, jeter des déchets ou enfreindre la réglementation — tous sont de véritables manquements au caractère civique",
        dining_etiquette: "Les hawker centres sont au cœur de la culture — les visiter avec respect. Le 'chope' (réserver une place avec un paquet de mouchoirs) est la norme. Les restrictions alimentaires varient beaucoup — toujours se renseigner.",
        language_notes: "L'anglais est la langue officielle des affaires. Le singlish ne doit pas être moqué — c'est une source d'identité culturelle authentique. Parler clairement mais jamais avec condescendance.",
        gift_protocol: "Éviter les horloges (associées à la mort) ou les ensembles de quatre pour les Singapouriens d'origine chinoise. Apporter quelque chose si invité chez quelqu'un. Les cadeaux ne sont pas toujours ouverts immédiatement.",
        dress_code: "Soigné et pratique compte tenu du climat tropical. Business formel dans les environnements d'entreprise. La tenue conservatrice pour les temples et les mosquées est non négociable.",
        dos: [
          "Respecter l'extraordinaire diversité des cultures malaise, chinoise, indienne et eurasienne coexistant",
          "Finir tout ce qui est dans son assiette — le gaspillage est considéré comme irrespectable",
          "Faire la queue correctement en toutes circonstances — c'est une question de fierté civique",
          "Reconnaître l'ancienneté et céder gracieusement le cas échéant",
          "Toujours porter un parapluie pliable — le temps change rapidement"
        ],
        donts: [
          "Ne jamais mâcher de chewing-gum en public — cela reste fortement restreint",
          "Ne pas jeter de déchets en aucune circonstance",
          "Éviter de traverser en dehors des clous — les amendes sont réelles et appliquées",
          "Ne pas commenter avec dédain les réglementations de Singapour",
          "Éviter de discuter de race ou de religion de manière désinvolte"
        ]
      },
      de: {
        region_name: "Singapur",
        core_value: "Leistungsprinzip, bürgerliche Ordnung und kultivierte Mehrsprachigkeit",
        biggest_taboo: "Öffentliche Beschämung verursachen, Müll wegwerfen oder Vorschriften missachten — all das sind echte Versagen im staatsbürgerlichen Charakter",
        dining_etiquette: "Hawker-Zentren sind kulturell zentral — respektvoll besuchen. 'Chope' (Plätze mit einem Taschentuchpaket reservieren) ist Standard. Ernährungseinschränkungen variieren stark — immer nachfragen.",
        language_notes: "Englisch ist die offizielle Geschäftssprache. Singlish darf nicht verspottet werden — es ist eine Quelle echter kultureller Identität. Klar sprechen, aber nie herablassend.",
        gift_protocol: "Uhren (mit dem Tod assoziiert) oder Sets von vier für chinesische Singapurer meiden. Etwas mitbringen, wenn man zu jemandem nach Hause eingeladen ist. Geschenke werden nicht immer sofort geöffnet.",
        dress_code: "Gepflegt und praktisch angesichts des tropischen Klimas. Geschäftsformell in Unternehmensumgebungen. Konservative Kleidung für Tempel und Moscheen ist nicht verhandelbar.",
        dos: [
          "Die außergewöhnliche Vielfalt der malaiischen, chinesischen, indischen und eurasischen Kulturen respektieren",
          "Alles auf dem Teller aufessen — Verschwendung gilt als respektlos",
          "Stets korrekt in der Schlange warten — es ist eine Frage des bürgerlichen Stolzes",
          "Seniorität anerkennen und wo angebracht würdevoll zurückstehen",
          "Immer einen faltbaren Regenschirm dabei haben — das Wetter ändert sich schnell"
        ],
        donts: [
          "Niemals in der Öffentlichkeit Kaugummi kauen — es bleibt stark eingeschränkt",
          "Unter keinen Umständen Müll wegwerfen",
          "Wildes Überqueren der Straße vermeiden — Bußgelder sind real und werden durchgesetzt",
          "Singapurs Vorschriften nicht abfällig kommentieren",
          "Rasse oder Religion nicht leichtfertig besprechen"
        ]
      },
      es: {
        region_name: "Singapur",
        core_value: "Meritocracia, orden cívico y sofisticación multilingüe serena",
        biggest_taboo: "Causar vergüenza pública, tirar basura o incumplir las normas — todo ello son genuinos fallos de carácter cívico",
        dining_etiquette: "Los hawker centres son culturalmente centrales — visítelos con respeto. El 'chope' (reservar asientos con un paquete de pañuelos) es estándar. Las restricciones dietéticas varían mucho — pregunte siempre.",
        language_notes: "El inglés es el idioma oficial de los negocios. El singlish no debe burlarse — es una fuente de genuina identidad cultural. Hable con claridad, pero nunca con condescendencia.",
        gift_protocol: "Evite relojes (asociados con la muerte) o conjuntos de cuatro para singaporeños de origen chino. Lleve algo si le invitan a casa. Los regalos no siempre se abren de inmediato.",
        dress_code: "Pulcro y práctico dado el clima tropical. Formal de negocios en entornos corporativos. La vestimenta conservadora en templos y mezquitas es innegociable.",
        dos: [
          "Respetar la extraordinaria diversidad de culturas malaya, china, india y euroasiática",
          "Terminar todo lo del plato — el desperdicio se considera irrespetuoso",
          "Hacer cola correctamente en todo momento — es una cuestión de orgullo cívico",
          "Reconocer la antigüedad y ceder con elegancia cuando proceda",
          "Llevar siempre un paraguas plegable — el tiempo cambia rápidamente"
        ],
        donts: [
          "Nunca masticar chicle en público — sigue estando muy restringido",
          "No tirar basura bajo ninguna circunstancia",
          "Evitar cruzar fuera de los pasos de peatones — las multas son reales y se aplican",
          "No comentar con desdén las normas de Singapur",
          "Evitar hablar de raza o religión de manera descuidada"
        ]
      },
      pt: {
        region_name: "Singapura",
        core_value: "Meritocracia, ordem cívica e sofisticação multilingue serena",
        biggest_taboo: "Causar embaraço público, deitar lixo para o chão ou desrespeitar regulamentos — tudo são genuínas falhas de caráter cívico",
        dining_etiquette: "Os hawker centres são culturalmente centrais — visite-os com respeito. O 'chope' (reservar lugares com um pacote de lenços) é padrão. As restrições alimentares variam muito — pergunte sempre.",
        language_notes: "O inglês é a língua oficial dos negócios. O singlish não deve ser ridicularizado — é uma fonte de genuína identidade cultural. Fale com clareza, mas nunca com condescendência.",
        gift_protocol: "Evite relógios (associados à morte) ou conjuntos de quatro para singaporeanos de origem chinesa. Leve algo se for convidado a casa. Os presentes nem sempre são abertos imediatamente.",
        dress_code: "Apresentável e prático dado o clima tropical. Formal nos ambientes corporativos. Traje conservador em templos e mesquitas é inegociável.",
        dos: [
          "Respeitar a extraordinária diversidade das culturas malaia, chinesa, indiana e eurasiana",
          "Terminar tudo o que está no prato — o desperdício é considerado desrespeitoso",
          "Fazer fila corretamente em todos os momentos — é uma questão de orgulho cívico",
          "Reconhecer a antiguidade e ceder graciosamente quando apropriado",
          "Levar sempre um guarda-chuva dobrável — o tempo muda rapidamente"
        ],
        donts: [
          "Nunca mascar pastilha elástica em público — continua fortemente restringido",
          "Não deitar lixo em circunstância alguma",
          "Evitar atravessar fora das passadeiras — as multas são reais e aplicadas",
          "Não comentar com desdém os regulamentos de Singapura",
          "Evitar discutir raça ou religião de forma descuidada"
        ]
      },
      it: {
        region_name: "Singapore",
        core_value: "Meritocrazia, ordine civico e sofisticata compostezza multilingue",
        biggest_taboo: "Causare imbarazzo pubblico, gettare rifiuti o violare i regolamenti — tutto ciò costituisce un vero fallimento del carattere civico",
        dining_etiquette: "Gli hawker centres sono culturalmente centrali — visitarli con rispetto. Il 'chope' (riservare i posti con un pacchetto di fazzoletti) è la norma. Le restrizioni dietetiche variano molto — chiedere sempre.",
        language_notes: "L'inglese è la lingua ufficiale degli affari. Il singlish non va deriso — è una fonte di genuina identità culturale. Parlare chiaramente ma mai con condiscendenza.",
        gift_protocol: "Evitare orologi (associati alla morte) o set da quattro per i singaporiani di origine cinese. Portare qualcosa se si è invitati a casa. I regali non vengono sempre aperti subito.",
        dress_code: "Curato e pratico dato il clima tropicale. Business formale negli ambienti aziendali. L'abbigliamento conservatore per templi e moschee è non negoziabile.",
        dos: [
          "Rispettare la straordinaria diversità delle culture malese, cinese, indiana ed eurasiatica che convivono",
          "Finire tutto quello che c'è nel piatto — lo spreco è considerato irrispettoso",
          "Fare la fila correttamente in ogni momento — è una questione di orgoglio civico",
          "Riconoscere l'anzianità e cedere con grazia quando appropriato",
          "Portare sempre un ombrello pieghevole — il tempo cambia rapidamente"
        ],
        donts: [
          "Non masticare mai gomme in pubblico — rimane fortemente limitato",
          "Non gettare rifiuti in nessuna circostanza",
          "Evitare di attraversare fuori dagli attraversamenti — le multe sono reali e vengono applicate",
          "Non commentare con disprezzo i regolamenti di Singapore",
          "Evitare di discutere di razza o religione in modo superficiale"
        ]
      },
      ar: {
        region_name: "سنغافورة",
        core_value: "الجدارة والنظام المدني والتطور المتعدد اللغات",
        biggest_taboo: "التسبب في إحراج عام أو رمي القمامة أو انتهاك الأنظمة — كل ذلك إخفاق حقيقي في الشخصية المدنية",
        dining_etiquette: "مراكز الهوكر مركزية ثقافيًا — زرها باحترام. 'التشوب' (حجز المقاعد بعلبة مناديل) هو المعيار. القيود الغذائية تتفاوت — اسأل دائمًا.",
        language_notes: "الإنجليزية هي لغة الأعمال الرسمية. لا ينبغي السخرية من السينغليش — إنه مصدر هوية ثقافية حقيقية. تحدّث بوضوح ولكن ليس بتعالٍ.",
        gift_protocol: "تجنّب الساعات (مرتبطة بالموت) أو أي شيء في مجموعات رباعية للسنغافوريين الصينيين. أحضر شيئًا إذا دُعيت إلى المنزل. لا تُفتح الهدايا دائمًا فورًا.",
        dress_code: "أنيق وعملي في ظل المناخ الاستوائي. رسمي في البيئات المهنية. اللباس المحتشم في المعابد والمساجد غير قابل للتفاوض.",
        dos: [
          "احترم التنوع الاستثنائي للثقافات الملايوية والصينية والهندية والأوراسية",
          "أنهِ كل ما في طبقك — الإسراف يُعدّ قلة احترام",
          "انتظر في الطابور بصورة صحيحة دائمًا — إنه مصدر فخر مدني",
          "اعترف بالأقدمية وتنازل بلطف عند الاقتضاء",
          "احمل مظلة قابلة للطي دائمًا — الطقس يتغير سريعًا"
        ],
        donts: [
          "لا تمضغ العلكة في الأماكن العامة أبدًا — لا تزال مقيّدة بشدة",
          "لا ترمِ القمامة تحت أي ظرف",
          "تجنّب العبور خارج الممرات — الغرامات حقيقية ومطبّقة",
          "لا تُعلّق باستهزاء على أنظمة سنغافورة",
          "تجنّب مناقشة العرق أو الدين بطريقة متهوّرة أو مستهترة"
        ]
      },
      ja: {
        region_name: "シンガポール",
        core_value: "能力主義、市民的秩序、そして落ち着いた多言語的洗練さ",
        biggest_taboo: "公衆の面前での恥、ポイ捨て、規則の無視——これら全ては市民としての品格の真の失敗",
        dining_etiquette: "ホーカーセンターは文化的に中心的な存在——敬意を持って訪れる。「チョープ」（ティッシュで席を取ること）は標準的。食事制限は多様——必ず確認する。",
        language_notes: "英語がビジネスの公式言語。シングリッシュを馬鹿にしない——本物の文化的アイデンティティの源。明確に話すが、絶して見下さない。",
        gift_protocol: "中国系シンガポール人に時計（死と関連）や4個セットのものは避ける。家に招かれた際は何か持参する。プレゼントはすぐに開けるとは限らない。",
        dress_code: "熱帯気候を考慮した清潔感があり実用的な服装。企業環境ではビジネスフォーマル。寺院やモスクでの保守的な服装は絶対条件。",
        dos: [
          "マレー、中国、インド、ユーラシアの文化が共存する驚くほどの多様性を尊重する",
          "皿の上のものはすべて食べる——無駄は無礼と見なされる",
          "常に正しく並ぶ——市民的誇りの問題",
          "年功を認め、適切な場面では礼儀正しく譲る",
          "折りたたみ傘を常に携帯する——天気は急に変わる"
        ],
        donts: [
          "人前でガムを噛まない——厳しく規制されている",
          "いかなる状況でもポイ捨てしない",
          "信号無視の横断をしない——罰金は本物で執行される",
          "シンガポールの規制について軽蔑的なコメントをしない",
          "人種や宗教について軽率に話さない"
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
      },
      nl: {
        region_name: "India",
        core_value: "Gastvrijheid, hiërarchie en de voorrang van relaties boven transacties",
        biggest_taboo: "Oneerbiedigheid tegenover voedselgewoonten, ouderen of religieuze gevoelens — in het bijzonder rond heilige dieren, tempels en dieetobservantie",
        dining_etiquette: "Eet alleen met de rechterhand. Accepteer al het aangeboden voedsel — weigeren is onbeleefd. Vegetarisch eten is primair voor veel gasten. Schoen uitdoen voor het betreden van huizen.",
        language_notes: "India heeft 22 officiële talen. Engels is de lingua franca van het bedrijfsleven. Hindi wordt niet universeel gesproken. Pas uw register aan aan context en regio.",
        gift_protocol: "Breng snoep, fruit of bloemen mee bij een bezoek. Vermijd leren cadeaus. Pak cadeaus in — presentatie telt. Cadeaus kunnen opzij worden gelegd en later worden geopend.",
        dress_code: "Bescheidenheid is van het grootste belang, vooral voor vrouwen. Het bedekken van schouders en knieën op religieuze plaatsen is verplicht. Traditionele kleding is altijd passend en gewaardeerd.",
        dos: [
          "Gebruik beide handen of de rechterhand bij het geven en ontvangen van objecten",
          "Spreek ouderen aan met respectvolle titels (ji, Sir, Madam)",
          "Leer een eenvoudige begroeting in de regionale taal — de moeite wordt hartelijk ontvangen",
          "Wees geduldig met schema's — relaties hebben consequent voorrang boven punctualiteit",
          "Erken de diversiteit van India's regionale culturen"
        ],
        donts: [
          "Raak niemands hoofd aan — dit wordt als heilig beschouwd",
          "Gebruik nooit de linkerhand om te eten of objecten door te geven",
          "Vermijd openbare uitingen van genegenheid",
          "Wijs niet met uw vinger naar mensen of religieuze objecten — gebruik een open hand",
          "Vermijd aannames op basis van kaste, regio of religie"
        ]
      },
      fr: {
        region_name: "Inde",
        core_value: "Hospitalité, hiérarchie et primauté des relations sur les transactions",
        biggest_taboo: "Manquer de respect aux coutumes alimentaires, aux anciens ou aux sensibilités religieuses — notamment autour des animaux sacrés, des temples et des pratiques diététiques",
        dining_etiquette: "Manger uniquement avec la main droite. Accepter toute nourriture offerte — refuser est impoli. La nourriture végétarienne est centrale pour de nombreux invités. Retirer ses chaussures avant d'entrer dans les maisons.",
        language_notes: "L'Inde a 22 langues officielles. L'anglais est la lingua franca des affaires. L'hindi n'est pas universellement parlé. Adapter son registre au contexte et à la région.",
        gift_protocol: "Apporter des sucreries, des fruits ou des fleurs lors des visites. Éviter les cadeaux en cuir. Emballer les cadeaux — la présentation compte. Les cadeaux peuvent être mis de côté et ouverts plus tard.",
        dress_code: "La modestie est primordiale, surtout pour les femmes. Couvrir les épaules et les genoux dans les sites religieux est obligatoire. La tenue traditionnelle est toujours appropriée et appréciée.",
        dos: [
          "Utiliser les deux mains ou la main droite pour donner et recevoir des objets",
          "S'adresser aux anciens avec des titres respectueux (ji, Monsieur, Madame)",
          "Apprendre une salutation simple dans la langue régionale — l'effort est chaleureusement reçu",
          "Être patient avec les horaires — les relations priment constamment sur la ponctualité",
          "Reconnaître la diversité des cultures régionales de l'Inde"
        ],
        donts: [
          "Ne pas toucher la tête de quelqu'un — elle est considérée comme sacrée",
          "Ne jamais utiliser la main gauche pour manger ou passer des objets",
          "Éviter les manifestations d'affection en public",
          "Ne pas pointer les gens ou les objets religieux du doigt — utiliser la main ouverte",
          "Éviter les suppositions fondées sur la caste, la région ou la religion"
        ]
      },
      de: {
        region_name: "Indien",
        core_value: "Gastfreundschaft, Hierarchie und der Vorrang von Beziehungen vor Transaktionen",
        biggest_taboo: "Missachtung von Essgewohnheiten, Älteren oder religiösen Empfindlichkeiten — insbesondere rund um heilige Tiere, Tempel und Ernährungsvorschriften",
        dining_etiquette: "Nur mit der rechten Hand essen. Alles angebotene Essen annehmen — Ablehnen ist unhöflich. Vegetarisches Essen ist für viele Gäste primär. Schuhe ausziehen, bevor man ein Haus betritt.",
        language_notes: "Indien hat 22 Amtssprachen. Englisch ist die Lingua franca im Geschäftsleben. Hindi wird nicht überall gesprochen. Den eigenen Sprachstil an Kontext und Region anpassen.",
        gift_protocol: "Bei Besuchen Süßigkeiten, Obst oder Blumen mitbringen. Ledergeschenke vermeiden. Geschenke einpacken — Präsentation ist wichtig. Geschenke können beiseitegelegt und später geöffnet werden.",
        dress_code: "Bescheidenheit hat oberste Priorität, besonders für Frauen. In religiösen Stätten Schultern und Knie zu bedecken ist Pflicht. Traditionelle Kleidung ist stets angemessen und wird geschätzt.",
        dos: [
          "Beide Hände oder die rechte Hand beim Geben und Empfangen von Gegenständen benutzen",
          "Ältere mit respektvollen Titeln ansprechen (ji, Sir, Madam)",
          "Eine einfache Begrüßung in der Regionalsprache lernen — die Mühe wird herzlich aufgenommen",
          "Geduld mit Terminen haben — Beziehungen haben konsequent Vorrang vor Pünktlichkeit",
          "Die Vielfalt der regionalen Kulturen Indiens anerkennen"
        ],
        donts: [
          "Niemandem auf den Kopf fassen — er gilt als heilig",
          "Niemals die linke Hand zum Essen oder zum Weiterreichen von Gegenständen benutzen",
          "Öffentliche Zuneigungsbekundungen vermeiden",
          "Nicht mit dem Finger auf Menschen oder religiöse Objekte zeigen — offene Hand benutzen",
          "Keine Annahmen aufgrund von Kaste, Region oder Religion machen"
        ]
      },
      es: {
        region_name: "India",
        core_value: "Hospitalidad, jerarquía y primacía de las relaciones sobre las transacciones",
        biggest_taboo: "Falta de respeto a las costumbres alimentarias, a los mayores o a las sensibilidades religiosas — especialmente en torno a animales sagrados, templos y prácticas dietéticas",
        dining_etiquette: "Comer solo con la mano derecha. Aceptar toda la comida ofrecida — rechazarla es descortés. La comida vegetariana es central para muchos invitados. Quitarse los zapatos antes de entrar en las casas.",
        language_notes: "India tiene 22 idiomas oficiales. El inglés es la lingua franca de los negocios. El hindi no se habla universalmente. Adapte su registro al contexto y la región.",
        gift_protocol: "Llevar dulces, frutas o flores al visitar. Evitar regalos de cuero. Envolver los regalos — la presentación importa. Los regalos pueden guardarse y abrirse más tarde.",
        dress_code: "La modestia es primordial, especialmente para las mujeres. Cubrir hombros y rodillas en lugares religiosos es obligatorio. La vestimenta tradicional siempre es adecuada y apreciada.",
        dos: [
          "Usar ambas manos o la mano derecha al dar y recibir objetos",
          "Dirigirse a los mayores con títulos de respeto (ji, señor, señora)",
          "Aprender un saludo sencillo en el idioma regional — el esfuerzo se recibe con calidez",
          "Ser paciente con los horarios — las relaciones tienen constantemente prioridad sobre la puntualidad",
          "Reconocer la diversidad de las culturas regionales de India"
        ],
        donts: [
          "No tocar la cabeza de nadie — se considera sagrada",
          "Nunca usar la mano izquierda para comer o pasar objetos",
          "Evitar las muestras públicas de afecto",
          "No señalar a personas ni objetos religiosos con el dedo — usar la mano abierta",
          "Evitar suposiciones basadas en casta, región o religión"
        ]
      },
      pt: {
        region_name: "Índia",
        core_value: "Hospitalidade, hierarquia e primazia das relações sobre as transações",
        biggest_taboo: "Desrespeitar costumes alimentares, idosos ou sensibilidades religiosas — especialmente em torno de animais sagrados, templos e práticas dietéticas",
        dining_etiquette: "Comer apenas com a mão direita. Aceitar toda a comida oferecida — recusar é indelicado. A comida vegetariana é central para muitos convidados. Tirar os sapatos antes de entrar em casas.",
        language_notes: "A Índia tem 22 línguas oficiais. O inglês é a língua franca dos negócios. O hindi não é universalmente falado. Adapte o seu registo ao contexto e à região.",
        gift_protocol: "Leve doces, frutas ou flores ao visitar. Evite presentes de couro. Embale os presentes — a apresentação importa. Os presentes podem ser guardados e abertos mais tarde.",
        dress_code: "A modéstia é fundamental, especialmente para as mulheres. Cobrir ombros e joelhos em locais religiosos é obrigatório. O traje tradicional é sempre adequado e apreciado.",
        dos: [
          "Usar ambas as mãos ou a mão direita ao dar e receber objetos",
          "Dirigir-se aos mais velhos com títulos respeitosos (ji, Sir, Madam)",
          "Aprender uma saudação simples no idioma regional — o esforço é bem recebido",
          "Ser paciente com os horários — as relações têm constantemente prioridade sobre a pontualidade",
          "Reconhecer a diversidade das culturas regionais da Índia"
        ],
        donts: [
          "Não tocar na cabeça de ninguém — é considerada sagrada",
          "Nunca usar a mão esquerda para comer ou passar objetos",
          "Evitar manifestações públicas de afeto",
          "Não apontar com o dedo para pessoas ou objetos religiosos — use a mão aberta",
          "Evitar suposições baseadas em casta, região ou religião"
        ]
      },
      it: {
        region_name: "India",
        core_value: "Ospitalità, gerarchia e primato delle relazioni sulle transazioni",
        biggest_taboo: "Mancanza di rispetto per le abitudini alimentari, gli anziani o le sensibilità religiose — in particolare riguardo agli animali sacri, ai templi e alle pratiche dietetiche",
        dining_etiquette: "Mangiare solo con la mano destra. Accettare tutto il cibo offerto — rifiutare è scortese. Il cibo vegetariano è centrale per molti ospiti. Togliersi le scarpe prima di entrare nelle case.",
        language_notes: "L'India ha 22 lingue ufficiali. L'inglese è la lingua franca degli affari. L'hindi non è parlato universalmente. Adattare il proprio registro al contesto e alla regione.",
        gift_protocol: "Portare dolci, frutta o fiori in visita. Evitare regali in pelle. Incartare i regali — la presentazione conta. I regali possono essere messi da parte e aperti in seguito.",
        dress_code: "La modestia è fondamentale, specialmente per le donne. Coprire spalle e ginocchia nei luoghi religiosi è obbligatorio. Il tradizionale abbigliamento è sempre appropriato e apprezzato.",
        dos: [
          "Usare entrambe le mani o la mano destra nel dare e ricevere oggetti",
          "Rivolgersi agli anziani con titoli rispettosi (ji, Signore, Signora)",
          "Imparare un semplice saluto nella lingua regionale — lo sforzo è accolto con calore",
          "Essere pazienti con gli orari — le relazioni hanno costantemente la precedenza sulla puntualità",
          "Riconoscere la diversità delle culture regionali dell'India"
        ],
        donts: [
          "Non toccare mai la testa di qualcuno — è considerata sacra",
          "Non usare mai la mano sinistra per mangiare o passare oggetti",
          "Evitare manifestazioni pubbliche di affetto",
          "Non indicare persone o oggetti religiosi con il dito — usare la mano aperta",
          "Evitare supposizioni basate su casta, regione o religione"
        ]
      },
      ar: {
        region_name: "الهند",
        core_value: "الضيافة والتراتبية وأولوية العلاقات على المعاملات",
        biggest_taboo: "عدم احترام عادات الطعام أو كبار السن أو المشاعر الدينية — ولا سيما ما يتعلق بالحيوانات المقدسة والمعابد والممارسات الغذائية",
        dining_etiquette: "تناول الطعام باليد اليمنى فحسب. اقبل كل طعام يُقدَّم لك — الرفض يُعدّ قلة أدب. الطعام النباتي أساسي لكثير من الضيوف. اخلع حذاءك قبل دخول المنازل.",
        language_notes: "تمتلك الهند 22 لغة رسمية. الإنجليزية هي لغة التواصل في الأعمال. الهندية ليست لغة عالمية. كيّف أسلوبك مع السياق والمنطقة.",
        gift_protocol: "أحضر حلويات أو فاكهة أو ورودًا عند الزيارة. تجنّب الهدايا الجلدية. الف الهدايا — يهم الإخراج. قد تُوضع الهدايا جانبًا وتُفتح لاحقًا.",
        dress_code: "التحشم أمر بالغ الأهمية، خاصةً للنساء. تغطية الكتفين والركبتين في المواقع الدينية إلزامية. اللباس التقليدي دائمًا مناسب ومُقدَّر.",
        dos: [
          "استخدم كلتا اليدين أو اليد اليمنى عند تقديم الأشياء أو استلامها",
          "خاطب كبار السن بألقاب محترمة (جي، سيد، سيدة)",
          "تعلّم تحية بسيطة باللغة المحلية — الجهد يُقابَل بحفاوة",
          "كن صبورًا مع المواعيد — العلاقات تسبق الانضباط دائمًا",
          "اعترف بتنوع الثقافات الإقليمية في الهند"
        ],
        donts: [
          "لا تلمس رأس أي شخص — يُعدّ مقدسًا",
          "لا تستخدم اليد اليسرى للأكل أو تمرير الأشياء أبدًا",
          "تجنّب إظهار المودة في الأماكن العامة",
          "لا تشير بإصبعك إلى الناس أو المقدسات — استخدم راحة اليد المفتوحة",
          "تجنّب الافتراضات القائمة على الطبقة أو المنطقة أو الدين"
        ]
      },
      ja: {
        region_name: "インド",
        core_value: "おもてなし、階層性、そして取引よりも関係を優先する文化",
        biggest_taboo: "食習慣、目上の人、宗教的感情を軽視すること——特に聖なる動物、寺院、食事の観察に関して",
        dining_etiquette: "右手だけで食べる。提供された食事はすべて受け入れる——断るのは失礼。多くのゲストにとって菜食が中心。家に入る前に靴を脱ぐ。",
        language_notes: "インドには22の公用語がある。英語はビジネスの共通語。ヒンディー語は全国的に話されているわけではない。文脈と地域に応じてスタイルを変える。",
        gift_protocol: "訪問の際は菓子、果物、または花を持参する。革製品の贈り物は避ける。包装する——見た目が大切。プレゼントは脇に置いて後で開けることもある。",
        dress_code: "慎み深さが最優先、特に女性。宗教的な場所では肩と膝を隠すことが必須。伝統的な衣服は常に適切で高く評価される。",
        dos: [
          "物を渡したり受け取ったりする際は両手または右手を使う",
          "目上の人には敬称（ジー、サー、マダム）で話しかける",
          "地方の言語で簡単な挨拶を覚える——その努力は温かく受け取られる",
          "スケジュールには寛容に——関係が常に時間厳守より優先される",
          "インドの地域文化の多様性を認識し、一枚岩として扱わない"
        ],
        donts: [
          "誰の頭も触れない——神聖とされる",
          "食事の際や物を渡す際に左手を使わない",
          "公衆の面前での愛情表現は避ける",
          "指で人や宗教的なものを指差さない——手のひらを使う",
          "カースト、地域、宗教に基づく推測をしない"
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
      },
      nl: {
        region_name: "Mexico",
        core_value: "Warme persoonlijke verbinding, familietrouw en waardige trots op cultuur en erfgoed",
        biggest_taboo: "Relaties als louter transactioneel behandelen of oneerbiedigheid tonen tegenover Mexicaans erfgoed, eten of tradities",
        dining_etiquette: "Maaltijden zijn sociale, ongehaaste gelegenheden. Wacht tot de gastheer zit. Complimenteer het eten met oprechte warmte. Haast de maaltijd nooit.",
        language_notes: "Spaans is de taal van warmte en trots. Een paar woorden Spaans openen vele deuren. Mexicanen communiceren warm en indirect in gevoelige situaties.",
        gift_protocol: "Breng snoep, bloemen (vermijd gele goudsbloemen — begrafenis) of kwaliteitsdranken. Cadeaus worden hartelijk ontvangen en direct geopend.",
        dress_code: "Smart casual in de meeste sociale settings. Zakelijke kleding is formeel in bedrijfscontexten. Kleed u om respect te tonen.",
        dos: [
          "Investeer in de relatie voor zakelijke gesprekken — vertrouwen is de basis",
          "Begroet met een handdruk en warm, aanhoudend oogcontact",
          "Accepteer eten en gastvrijheid royaal — weigeren wordt als onbeleefd beschouwd",
          "Complimenteer Mexico's cultuur, eten en kunst met oprechte specificiteit",
          "Wees geduldig met schema's — persoonlijke verbinding gaat voor punctualiteit"
        ],
        donts: [
          "Verwar de Mexicaanse en andere Latijns-Amerikaanse culturen nooit",
          "Vermijd stereotypen over Mexico",
          "Sla geen small talk over — relaties bouwen is het fundament",
          "Bespreek niet de grenskwestie of immigratiebeleid in informele gesprekken",
          "Wees niet kortaf of transactioneel bij een eerste ontmoeting"
        ]
      },
      fr: {
        region_name: "Mexique",
        core_value: "Connexion personnelle chaleureuse, loyauté familiale et fierté digne de la culture et du patrimoine",
        biggest_taboo: "Traiter les relations de manière purement transactionnelle ou manquer de respect envers le patrimoine, la nourriture ou les traditions mexicaines",
        dining_etiquette: "Les repas sont des occasions sociales et non pressées. Attendre que l'hôte s'assoie. Complimenter la nourriture avec une chaleur sincère. Ne jamais précipiter le repas.",
        language_notes: "L'espagnol est la langue de la chaleur et de la fierté. Quelques mots d'espagnol ouvrent de nombreuses portes. Les Mexicains communiquent chaleureusement et indirectement dans les situations sensibles.",
        gift_protocol: "Apporter des sucreries, des fleurs (éviter les soucis jaunes — funéraires) ou des spiritueux de qualité. Les cadeaux sont reçus chaleureusement et généralement ouverts immédiatement.",
        dress_code: "Smart casual dans la plupart des contextes sociaux. Tenue professionnelle formelle dans les contextes d'entreprise. S'habiller pour montrer le respect.",
        dos: [
          "Investir dans la relation avant de parler affaires — la confiance est la base",
          "Saluer avec une poignée de main et un contact visuel chaleureux et soutenu",
          "Accepter généreusement nourriture et hospitalité — refuser est considéré impoli",
          "Complimenter la culture, la nourriture et l'art du Mexique avec une spécificité sincère",
          "Être patient avec les horaires — la connexion personnelle précède la ponctualité"
        ],
        donts: [
          "Ne jamais confondre la culture mexicaine avec d'autres cultures latino-américaines",
          "Éviter les stéréotypes sur le Mexique",
          "Ne pas sauter les bavardages — la construction de relations est l'essentiel",
          "Éviter de parler de la frontière ou des politiques d'immigration en conversation décontractée",
          "Ne pas être brusque ou transactionnel lors d'une première rencontre"
        ]
      },
      de: {
        region_name: "Mexiko",
        core_value: "Herzliche persönliche Verbindung, Familientreue und würdevoller Stolz auf Kultur und Erbe",
        biggest_taboo: "Beziehungen als rein transaktional behandeln oder mangelnden Respekt gegenüber mexikanischem Erbe, Essen oder Traditionen zeigen",
        dining_etiquette: "Mahlzeiten sind gesellige, ungeduldige Anlässe. Warten, bis der Gastgeber sitzt. Das Essen aufrichtig loben. Die Mahlzeit nie hetzen.",
        language_notes: "Spanisch ist die Sprache der Wärme und des Stolzes. Ein paar Worte Spanisch öffnen viele Türen. Mexikaner kommunizieren in sensiblen Situationen warm und indirekt.",
        gift_protocol: "Süßigkeiten, Blumen (keine gelben Ringelblumen — Trauer) oder hochwertige Spirituosen mitbringen. Geschenke werden herzlich empfangen und normalerweise sofort geöffnet.",
        dress_code: "Smart Casual in den meisten gesellschaftlichen Umgebungen. Geschäftskleidung in Unternehmenskontexten ist formell. Kleidung sollte Respekt signalisieren.",
        dos: [
          "In die Beziehung investieren, bevor Geschäftliches besprochen wird — Vertrauen ist die Grundlage",
          "Mit einem Handschlag und warmem, anhaltendem Augenkontakt begrüßen",
          "Essen und Gastfreundschaft großzügig annehmen — Ablehnen gilt als unhöflich",
          "Mexikos Kultur, Essen und Kunst mit aufrichtiger Spezifität loben",
          "Geduld mit Terminen haben — persönliche Verbindung geht vor Pünktlichkeit"
        ],
        donts: [
          "Mexikanische und andere lateinamerikanische Kulturen nie gleichsetzen",
          "Stereotypen über Mexiko vermeiden",
          "Keine Smalltalk-Pausen überspringen — Beziehungsaufbau ist das Geschäft",
          "Grenzfragen oder Einwanderungspolitik in lockeren Gesprächen nicht ansprechen",
          "Beim ersten Treffen nicht kurz angebunden oder transaktional sein"
        ]
      },
      es: {
        region_name: "México",
        core_value: "Conexión personal cálida, lealtad familiar y orgullo digno por la cultura y el patrimonio",
        biggest_taboo: "Tratar las relaciones de forma puramente transaccional o mostrar irrespeto hacia el patrimonio, la comida o las tradiciones mexicanas",
        dining_etiquette: "Las comidas son ocasiones sociales y tranquilas. Espere a que el anfitrión se siente. Elogie la comida con genuina calidez. Nunca apresure la comida.",
        language_notes: "El español es el idioma de la calidez y el orgullo. Unas pocas palabras en español abren muchas puertas. Los mexicanos se comunican de forma cálida e indirecta en situaciones delicadas.",
        gift_protocol: "Lleve dulces, flores (evite los cempasúchiles amarillos — fúnebres) o licores de calidad. Los regalos se reciben con calidez y generalmente se abren de inmediato.",
        dress_code: "Smart casual en la mayoría de los entornos sociales. Traje formal en contextos corporativos. Vístase para mostrar respeto.",
        dos: [
          "Invierta en la relación antes de hablar de negocios — la confianza es la base",
          "Salude con un apretón de manos y contacto visual cálido y sostenido",
          "Acepte comida y hospitalidad con generosidad — rechazar se considera descortés",
          "Elogie la cultura, la comida y el arte de México con genuina especificidad",
          "Sea paciente con los horarios — la conexión personal precede a la puntualidad"
        ],
        donts: [
          "Nunca confunda la cultura mexicana con otras culturas latinoamericanas",
          "Evite los estereotipos sobre México",
          "No omita la conversación informal — construir relaciones es el negocio",
          "Evite hablar de la frontera o de políticas migratorias en conversaciones casuales",
          "No sea brusco ni transaccional en un primer encuentro"
        ]
      },
      pt: {
        region_name: "México",
        core_value: "Conexão pessoal calorosa, lealdade familiar e orgulho digno pela cultura e herança",
        biggest_taboo: "Tratar as relações de forma puramente transacional ou mostrar desrespeito pelo património, comida ou tradições mexicanas",
        dining_etiquette: "As refeições são ocasiões sociais e sem pressa. Aguarde que o anfitrião se sente. Elogie a comida com genuína calidez. Nunca apresse a refeição.",
        language_notes: "O espanhol é a língua do calor e do orgulho. Algumas palavras em espanhol abrem muitas portas. Os mexicanos comunicam de forma calorosa e indireta em situações sensíveis.",
        gift_protocol: "Leve doces, flores (evite malmequeres amarelos — fúnebres) ou licores de qualidade. Os presentes são recebidos com calor e geralmente abertos imediatamente.",
        dress_code: "Smart casual na maioria dos contextos sociais. Traje formal em contextos corporativos. Vista-se para mostrar respeito.",
        dos: [
          "Invista na relação antes de falar de negócios — a confiança é a base",
          "Cumprimente com um aperto de mão e contacto visual caloroso e sustentado",
          "Aceite comida e hospitalidade com generosidade — recusar é considerado indelicado",
          "Elogie a cultura, a comida e a arte do México com genuína especificidade",
          "Seja paciente com os horários — a ligação pessoal precede a pontualidade"
        ],
        donts: [
          "Nunca confunda a cultura mexicana com outras culturas latino-americanas",
          "Evite estereótipos sobre o México",
          "Não ignore a conversa informal — construir relações é o negócio",
          "Evite falar da fronteira ou de políticas de imigração em conversas casuais",
          "Não seja brusco ou transacional num primeiro encontro"
        ]
      },
      it: {
        region_name: "Messico",
        core_value: "Connessione personale calorosa, lealtà familiare e orgoglio dignitoso per la cultura e il patrimonio",
        biggest_taboo: "Trattare le relazioni in modo puramente transazionale o mostrare mancanza di rispetto verso il patrimonio, il cibo o le tradizioni messicane",
        dining_etiquette: "I pasti sono occasioni sociali e senza fretta. Attendere che l'ospite si sieda. Complimentarsi per il cibo con genuino calore. Non affrettare mai il pasto.",
        language_notes: "Lo spagnolo è la lingua del calore e dell'orgoglio. Alcune parole di spagnolo aprono molte porte. I messicani comunicano in modo caloroso e indiretto nelle situazioni delicate.",
        gift_protocol: "Portare dolci, fiori (evitare le calendule gialle — funebri) o liquori di qualità. I regali vengono ricevuti con calore e generalmente aperti subito.",
        dress_code: "Smart casual nella maggior parte dei contesti sociali. Abbigliamento formale in contesti aziendali. Vestirsi per mostrare rispetto.",
        dos: [
          "Investire nella relazione prima di parlare di affari — la fiducia è il fondamento",
          "Salutare con una stretta di mano e un caldo e prolungato contatto visivo",
          "Accettare cibo e ospitalità con generosità — rifiutare è considerato scortese",
          "Complimentarsi per la cultura, il cibo e l'arte del Messico con genuina specificità",
          "Essere pazienti con gli orari — la connessione personale precede la puntualità"
        ],
        donts: [
          "Non confondere mai la cultura messicana con altre culture latinoamericane",
          "Evitare gli stereotipi sul Messico",
          "Non saltare le chiacchiere — costruire relazioni è il vero affare",
          "Evitare di parlare di confini o politiche di immigrazione in conversazioni informali",
          "Non essere bruschi o transazionali al primo incontro"
        ]
      },
      ar: {
        region_name: "المكسيك",
        core_value: "الدفء الشخصي والولاء العائلي والفخر الكريم بالثقافة والتراث",
        biggest_taboo: "التعامل مع العلاقات بشكل معاملاتي بحت، أو إهانة الموروث الثقافي المكسيكي أو طعامه أو تقاليده",
        dining_etiquette: "الوجبات مناسبات اجتماعية هادئة. انتظر حتى يجلس المضيف. أثنِ على الطعام بدفء حقيقي. لا تستعجل الوجبة أبدًا.",
        language_notes: "الإسبانية لغة الدفء والفخر. كلمات قليلة بالإسبانية تفتح أبوابًا كثيرة. يتواصل المكسيكيون بدفء وبشكل غير مباشر في المواقف الحساسة.",
        gift_protocol: "أحضر حلويات أو ورودًا (تجنّب الأزهار الصفراء — جنائزية) أو مشروبات راقية. تُستقبَل الهدايا بحفاوة وتُفتح فورًا عادةً.",
        dress_code: "أنيق غير رسمي في معظم التجمعات الاجتماعية. رسمي في البيئات المهنية. الملبس يعكس الاحترام.",
        dos: [
          "استثمر في العلاقة قبل التحدث عن الأعمال — الثقة هي الأساس",
          "حيِّ بمصافحة وتواصل بصري دافئ ومستدام",
          "اقبل الطعام والضيافة بسخاء — الرفض يُعدّ قلة أدب",
          "أثنِ على ثقافة المكسيك وطعامها وفنها بصدق وتحديد",
          "كن صبورًا مع المواعيد — الارتباط الشخصي يسبق الانضباط"
        ],
        donts: [
          "لا تخلط أبدًا بين الثقافة المكسيكية والثقافات اللاتينية الأمريكية الأخرى",
          "تجنّب الصور النمطية عن المكسيك",
          "لا تُهمل الحديث العابر — بناء العلاقات هو صلب العمل",
          "تجنّب الحديث عن الحدود أو سياسات الهجرة في المحادثات العابرة",
          "لا تكن مقتضبًا أو معاملاتيًا في اللقاء الأول"
        ]
      },
      ja: {
        region_name: "メキシコ",
        core_value: "温かな個人的つながり、家族への忠誠心、そして文化と遺産への誇りある誇り",
        biggest_taboo: "関係を純粋に取引的に扱うこと、またはメキシコの文化遺産、食事、伝統への軽視を示すこと",
        dining_etiquette: "食事は社交的でゆっくりとした場。ホストが座るまで待つ。食事を本物の温かさで褒める。食事を急いだり、会計を急かしたりしない。",
        language_notes: "スペイン語は温かさと誇りの言語。スペイン語の一言で多くのドアが開く。メキシコ人はデリケートな場面では温かく間接的に伝える。",
        gift_protocol: "菓子、花（黄色のマリーゴールドは避ける——葬儀的）、または良質なスピリッツを持参する。プレゼントは温かく受け取られ、通常すぐに開ける。",
        dress_code: "ほとんどの社交の場ではスマートカジュアル。企業環境ではフォーマルなビジネスウェア。服装は敬意を示す——見た目が目的の真剣さを伝える。",
        dos: [
          "ビジネスの話をする前に関係に投資する——信頼が基盤",
          "握手と温かく持続したアイコンタクトで挨拶する",
          "食事とおもてなしを寛大に受け入れる——断ることは失礼とされる",
          "メキシコの文化、食、芸術を誠実かつ具体的に褒める",
          "スケジュールには寛容に——個人的なつながりが時間厳守に優先する"
        ],
        donts: [
          "メキシコ文化と他のラテンアメリカ文化を混同しない",
          "メキシコについてのステレオタイプを避ける",
          "雑談を省略しない——関係構築がビジネスの本質",
          "国境や移民政策についてカジュアルな会話で話さない",
          "初めての出会いでぶっきらぼうまたは取引的にならない"
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
      },
      nl: {
        region_name: "Brazilië",
        core_value: "Warmte, inclusiviteit en de vreugde van echte menselijke verbinding",
        biggest_taboo: "Koud, formeel of transactioneel gedrag — Brazilianen interpreteren emotionele afstand als onbeleefdheid of arrogantie",
        dining_etiquette: "Maaltijden zijn ontspannen en diep sociaal. Begin niet te eten voor de gastheer. Porties zijn royaal — alles opeten toont waardering. Churrasco-cultuur draait om delen.",
        language_notes: "Portugees — niet Spaans — is de nationale taal. Brazilianen waarderen elke poging tot Portugees hartelijk. Ga er niet van uit dat Spaans volstaat.",
        gift_protocol: "Bloemen (niet paars — begrafenis), kwaliteitschocolade of ambachtelijke artikelen. Cadeaus worden direct geopend met warmte.",
        dress_code: "Stijlvol, expressief en aangepast aan de hitte. Zakelijke kleding is lichter dan Europese equivalenten. Uiterlijk signaleert zelfzorg en cultureel bewustzijn.",
        dos: [
          "Omarm de warmte — accepteer knuffels, nabijheid en oogcontact als positieve signalen",
          "Leer een paar woorden Portugees — dit wordt buitengewoon goed ontvangen",
          "Wees voorbereid op een flexibel tijdgevoel — relaties staan altijd voorop",
          "Complimenteer Brazilië's natuur, eten, muziek en diversiteit met oprecht gevoel",
          "Toon oprechte nieuwsgierigheid naar de persoon, niet alleen naar de agenda"
        ],
        donts: [
          "Maak nooit het 'OK'-gebaar met duim en wijsvinger — dit is beledigend in Brazilië",
          "Vermijd politiek of economisch commentaar tenzij u diep geïnformeerd bent",
          "Probeer de relatiebuilding-fase niet te haasten",
          "Vergelijk Brazilië niet ongunstig met Argentinië",
          "Wees niet stijf, formeel of emotioneel gereserveerd in sociale settings"
        ]
      },
      fr: {
        region_name: "Brésil",
        core_value: "Chaleur, inclusivité et joie de la vraie connexion humaine",
        biggest_taboo: "Un comportement froid, formel ou transactionnel — les Brésiliens interprètent la distance émotionnelle comme de la grossièreté ou de l'arrogance",
        dining_etiquette: "Les repas sont décontractés et profondément sociaux. Ne pas commencer à manger avant l'hôte. Les portions sont généreuses — finir son assiette montre l'appréciation. La culture du churrasco est fondée sur le partage.",
        language_notes: "Le portugais — et non l'espagnol — est la langue nationale. Les Brésiliens apprécient chaleureusement toute tentative de portugais. Ne supposez pas que l'espagnol suffit.",
        gift_protocol: "Fleurs (pas violettes — funéraires), chocolats de qualité ou articles artisanaux. Les cadeaux sont ouverts immédiatement avec chaleur.",
        dress_code: "Élégant, expressif et adapté à la chaleur. La tenue de travail est plus légère qu'en Europe. L'apparence signale le soin de soi et la conscience culturelle.",
        dos: [
          "Accepter la chaleur — les câlins, la proximité et le contact visuel sont des signaux positifs",
          "Apprendre quelques mots de portugais — c'est exceptionnellement bien reçu",
          "Être prêt à une conception flexible du temps — les relations passent toujours en premier",
          "Complimenter la nature, la nourriture, la musique et la diversité du Brésil avec sincérité",
          "Montrer une curiosité sincère pour la personne, pas seulement pour l'ordre du jour"
        ],
        donts: [
          "Ne jamais faire le geste 'OK' avec le pouce et l'index — c'est offensant au Brésil",
          "Éviter tout commentaire politique ou économique sans être très informé",
          "Ne pas essayer de précipiter la phase de création de relations",
          "Éviter de comparer défavorablement le Brésil à l'Argentine",
          "Ne pas être rigide, formel ou émotionnellement réservé en société"
        ]
      },
      de: {
        region_name: "Brasilien",
        core_value: "Wärme, Inklusivität und die Freude an echter menschlicher Verbindung",
        biggest_taboo: "Kaltes, formelles oder transaktionales Verhalten — Brasilianer deuten emotionale Distanz als Unhöflichkeit oder Arroganz",
        dining_etiquette: "Mahlzeiten sind entspannt und zutiefst gesellig. Nicht vor dem Gastgeber anfangen zu essen. Portionen sind großzügig — alles aufessen zeigt Wertschätzung. Churrasco-Kultur dreht sich um das Teilen.",
        language_notes: "Portugiesisch — nicht Spanisch — ist die Landessprache. Brasilianer schätzen jeden Versuch, Portugiesisch zu sprechen, herzlich. Nicht davon ausgehen, dass Spanisch ausreicht.",
        gift_protocol: "Blumen (nicht lila — Trauer), hochwertige Schokolade oder handwerkliche Artikel. Geschenke werden sofort mit Wärme geöffnet.",
        dress_code: "Stilvoll, ausdrucksstark und der Hitze angemessen. Geschäftskleidung ist leichter als europäische Äquivalente. Äußeres signalisiert Selbstfürsorge und kulturelles Bewusstsein.",
        dos: [
          "Die Wärme umarmen — Umarmungen, Nähe und Augenkontakt als positive Signale akzeptieren",
          "Ein paar Worte Portugiesisch lernen — es kommt außergewöhnlich gut an",
          "Auf ein flexibles Zeitgefühl vorbereitet sein — Beziehungen haben immer Vorrang",
          "Brasiliens Natur, Essen, Musik und außergewöhnliche Vielfalt aufrichtig loben",
          "Aufrichtige Neugier an der Person zeigen, nicht nur an der Agenda"
        ],
        donts: [
          "Niemals das 'OK'-Zeichen mit Daumen und Zeigefinger machen — in Brasilien gilt es als beleidigend",
          "Politische oder wirtschaftliche Kommentare vermeiden, es sei denn man ist gut informiert",
          "Die Beziehungsaufbau-Phase nicht zu hetzen versuchen",
          "Brasilien nicht ungünstig mit Argentinien vergleichen",
          "In gesellschaftlichen Situationen nicht steif, formell oder emotional verschlossen sein"
        ]
      },
      es: {
        region_name: "Brasil",
        core_value: "Calidez, inclusividad y la alegría de la genuina conexión humana",
        biggest_taboo: "El comportamiento frío, formal o transaccional — los brasileños interpretan la distancia emocional como grosería o arrogancia",
        dining_etiquette: "Las comidas son relajadas y profundamente sociales. No comience a comer antes que el anfitrión. Las porciones son generosas — terminar el plato muestra aprecio. La cultura del churrasco se basa en compartir.",
        language_notes: "El portugués — no el español — es el idioma nacional. Los brasileños agradecen calurosamente cualquier intento de hablar portugués. No asuma que el español es suficientemente cercano.",
        gift_protocol: "Flores (no moradas — fúnebres), chocolates de calidad o artículos artesanales. Los regalos se abren de inmediato con calidez.",
        dress_code: "Estiloso, expresivo y apropiado para el calor. La ropa de trabajo es más ligera que el equivalente europeo. El aspecto señala el cuidado personal y la conciencia cultural.",
        dos: [
          "Abrace la calidez — acepte abrazos, proximidad y contacto visual como señales positivas",
          "Aprenda algunas palabras de portugués — aterriza excepcionalmente bien",
          "Esté preparado para una noción flexible del tiempo — las relaciones siempre son lo primero",
          "Elogie la naturaleza, la comida, la música y la diversidad de Brasil con sentimiento genuino",
          "Muestre curiosidad sincera por la persona, no solo por la agenda"
        ],
        donts: [
          "Nunca haga el gesto 'OK' con el pulgar y el índice — es ofensivo en Brasil",
          "Evite comentarios políticos o económicos a menos que esté muy informado",
          "No intente apresurar la fase de construcción de relaciones",
          "Evite comparar desfavorablemente a Brasil con Argentina",
          "No sea rígido, formal o emocionalmente reservado en entornos sociales"
        ]
      },
      pt: {
        region_name: "Brasil",
        core_value: "Calor humano, inclusividade e a alegria da genuína conexão humana",
        biggest_taboo: "Comportamento frio, formal ou transacional — os brasileiros interpretam a distância emocional como grosseria ou arrogância",
        dining_etiquette: "As refeições são relaxadas e profundamente sociais. Não comece a comer antes do anfitrião. As porções são generosas — terminar mostra apreço. A cultura do churrasco assenta na partilha.",
        language_notes: "O português — não o espanhol — é a língua nacional. Os brasileiros apreciam calidamente qualquer tentativa de falar português. Não assuma que o espanhol é suficiente.",
        gift_protocol: "Flores (não roxas — fúnebres), chocolates de qualidade ou artigos artesanais. Os presentes são abertos imediatamente com calor.",
        dress_code: "Estiloso, expressivo e adequado ao calor. O traje de trabalho é mais leve do que os equivalentes europeus. A aparência sinaliza autocuidado e consciência cultural.",
        dos: [
          "Abrace o calor — aceite abraços, proximidade e contacto visual como sinais positivos",
          "Aprenda algumas palavras em português — tem um impacto excecional",
          "Esteja preparado para uma noção flexível do tempo — as relações vêm sempre em primeiro lugar",
          "Elogie a natureza, a comida, a música e a extraordinária diversidade do Brasil com genuíno sentimento",
          "Mostre curiosidade sincera pela pessoa, não apenas pela agenda"
        ],
        donts: [
          "Nunca faça o gesto 'OK' com o polegar e o indicador — é considerado ofensivo no Brasil",
          "Evite comentários políticos ou económicos a menos que seja muito bem informado",
          "Não tente apressar a fase de construção de relações",
          "Evite comparar desfavoravelmente o Brasil com a Argentina",
          "Não seja rígido, formal ou emocionalmente reservado em contextos sociais"
        ]
      },
      it: {
        region_name: "Brasile",
        core_value: "Calore, inclusività e la gioia della vera connessione umana",
        biggest_taboo: "Un comportamento freddo, formale o transazionale — i brasiliani interpretano la distanza emotiva come scortesia o arroganza",
        dining_etiquette: "I pasti sono rilassati e profondamente sociali. Non iniziare a mangiare prima del padrone di casa. Le porzioni sono generose — finire il piatto mostra apprezzamento. La cultura del churrasco è basata sulla condivisione.",
        language_notes: "Il portoghese — non lo spagnolo — è la lingua nazionale. I brasiliani apprezzano calorosamente qualsiasi tentativo di parlare portoghese. Non presumere che lo spagnolo sia sufficiente.",
        gift_protocol: "Fiori (non viola — funebri), cioccolato di qualità o articoli artigianali. I regali vengono aperti subito con calore.",
        dress_code: "Elegante, espressivo e adeguato al caldo. L'abbigliamento professionale è più leggero degli equivalenti europei. L'aspetto segnala cura di sé e consapevolezza culturale.",
        dos: [
          "Abbracciare il calore — accettare abbracci, vicinanza e contatto visivo come segnali positivi",
          "Imparare qualche parola di portoghese — viene recepita eccezionalmente bene",
          "Essere pronti a una concezione flessibile del tempo — le relazioni vengono sempre prima",
          "Complimentarsi per la natura, il cibo, la musica e la straordinaria diversità del Brasile con genuino sentimento",
          "Mostrare sincera curiosità per la persona, non solo per l'agenda"
        ],
        donts: [
          "Non fare mai il gesto 'OK' con pollice e indice — è offensivo in Brasile",
          "Evitare commenti politici o economici a meno di essere molto informati",
          "Non cercare di affrettare la fase di costruzione del rapporto",
          "Evitare di confrontare sfavorevolmente il Brasile con l'Argentina",
          "Non essere rigidi, formali o emotivamente guardinghi nei contesti sociali"
        ]
      },
      ar: {
        region_name: "البرازيل",
        core_value: "الدفء والشمولية وبهجة الاتصال الإنساني الحقيقي",
        biggest_taboo: "السلوك البارد أو الرسمي أو المعاملاتي — يفسّر البرازيليون البُعد العاطفي على أنه وقاحة أو غطرسة",
        dining_etiquette: "الوجبات مريحة وعميقة التواصل الاجتماعي. لا تبدأ الأكل قبل المضيف. الحصص كريمة — إنهاؤها يُعبّر عن التقدير. ثقافة الشواء مبنية على المشاركة.",
        language_notes: "البرتغالية — لا الإسبانية — هي اللغة الوطنية. يُقدّر البرازيليون أي محاولة للتحدث بالبرتغالية. لا تفترض أن الإسبانية كافية.",
        gift_protocol: "ورود (لا بنفسجية — جنائزية) أو شوكولاتة عالية الجودة أو منتجات حرفية. تُفتح الهدايا فورًا مع الدفء.",
        dress_code: "أنيق وتعبيري ومناسب للحرارة. الملبس المهني أخف من نظيره الأوروبي. المظهر يعكس الاعتناء بالنفس والوعي الثقافي.",
        dos: [
          "استقبل الدفء — تقبّل الأحضان والقرب والتواصل البصري كإشارات إيجابية",
          "تعلّم بعض الكلمات البرتغالية — يحظى بقبول استثنائي",
          "كن مستعدًا لمفهوم مرن للوقت — العلاقات دائمًا في المقدمة",
          "أثنِ على طبيعة البرازيل وطعامها وموسيقاها وتنوعها الاستثنائي بصدق",
          "أبدِ فضولًا صادقًا تجاه الشخص لا تجاه جدول الأعمال فحسب"
        ],
        donts: [
          "لا تُشكّل إشارة 'موافق' بالإبهام والسبابة أبدًا — تُعدّ مسيئة في البرازيل",
          "تجنّب التعليق السياسي أو الاقتصادي ما لم تكن مُلمًّا جيدًا",
          "لا تحاول الإسراع في مرحلة بناء العلاقة",
          "تجنّب مقارنة البرازيل بالأرجنتين بشكل غير مُنصف",
          "لا تكن جامدًا أو رسميًا أو محاطًا بحواجز عاطفية في التجمعات الاجتماعية"
        ]
      },
      ja: {
        region_name: "ブラジル",
        core_value: "温かさ、包容力、そして本物の人間的つながりの喜び",
        biggest_taboo: "冷たく、形式的、または取引的な振る舞い——ブラジル人は感情的な距離を無礼や傲慢さと解釈する",
        dining_etiquette: "食事はリラックスしていて深く社交的。ホストより先に食べ始めない。量は多い——食べ切ることが感謝の表れ。シュラスコ文化は共有で成り立っている。",
        language_notes: "ポルトガル語——スペイン語ではなく——が国語。ポルトガル語への挑戦はどんな試みも温かく歓迎される。スペイン語で事足りると思わない。",
        gift_protocol: "花（紫は葬儀的）、高品質のチョコレート、または手工芸品。プレゼントはすぐに温かく開ける。",
        dress_code: "スタイリッシュで表現豊か、暑さに合った服装。ビジネスウェアはヨーロッパより軽め。外見は自己ケアと文化的意識を示す。",
        dos: [
          "温かさを受け入れる——ハグ、近い距離、アイコンタクトをポジティブなシグナルとして受け取る",
          "ポルトガル語をいくつか覚える——非常に良い印象を与え、本物の敬意を示す",
          "柔軟な時間感覚に備える——関係が常に優先される",
          "ブラジルの自然、食、音楽、驚くほどの多様性を本物の感情で褒める",
          "議題だけでなく、相手への sincereな好奇心を示す"
        ],
        donts: [
          "親指と人差し指で「OK」サインを作らない——ブラジルでは侮辱的とされる",
          "深く知識がない限り政治的・経済的なコメントは避ける",
          "関係構築の段階を急かそうとしない",
          "ブラジルをアルゼンチンと不利に比較しない",
          "社交の場でこわばった、形式的な、または感情的に構えた態度を取らない"
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
      },
      nl: {
        region_name: "Spanje",
        core_value: "Levendig leven, trotse regio-identiteit en spirituele menselijke verbinding",
        biggest_taboo: "Heel Spanje als één behandelen — regionale identiteit (Catalaans, Baskisch, Andalusisch, Galicisch) is diepgaand en onderscheidend",
        dining_etiquette: "De lunch is de hoofdmaaltijd, doorgaans 14:00–16:00. Diner zelden voor 21:00. Tapas worden royaal gedeeld. Fooi is gewaardeerd maar bescheiden. Ga niet zitten voor u wordt uitgenodigd.",
        language_notes: "Castiliaans is de officiële taal. Regionale talen (Catalaans, Baskisch, Galicisch) worden diep gekoesterd. Een paar regionale woorden gebruiken toont respect.",
        gift_protocol: "Goede wijn, kwaliteitsgebak of regionale producten. Breng iets mee als u thuis wordt uitgenodigd. Cadeaus worden gewoonlijk direct geopend.",
        dress_code: "Stijlvol en verzorgd — Spanjaarden zijn trots op hun uiterlijk. Casual is chic, niet slordig. Vermijd shorts in steden, behalve bij stranden.",
        dos: [
          "Omarm het latere schema — lunches om 14:00, diners om 21:00 zijn volkomen normaal",
          "Begroet hartelijk met een handdruk; goede bekenden wisselen twee zoenen",
          "Toon oprechte interesse in regionale cultuur, eten, architectuur en taal",
          "Talm bij maaltijden — ze zijn ongehaast en van nature sociaal",
          "Accepteer de royaliteit van een gastheer zonder overdreven protest"
        ],
        donts: [
          "Bespreek de Burgeroorlog of het Franco-tijdperk niet tenzij u uw publiek goed kent",
          "Ga er niet van uit dat Catalanen of Basken zich als 'gewoon Spaans' identificeren",
          "Haast een maaltijd nooit en laat geen ongeduld blijken",
          "Wees niet overdreven luid in het openbaar",
          "Plan geen belangrijke vergaderingen in augustus — Spanje staat dan grotendeels stil"
        ]
      },
      fr: {
        region_name: "Espagne",
        core_value: "Vie vivante, régionalisme fier et connexion humaine animée",
        biggest_taboo: "Traiter toute l'Espagne comme uniforme — l'identité régionale (catalane, basque, andalouse, galicienne) est profonde et distincte",
        dining_etiquette: "Le déjeuner est le repas principal, généralement entre 14h et 16h. Le dîner rarement avant 21h. Les tapas se partagent généreusement. Le pourboire est apprécié mais modeste. Ne pas s'asseoir avant d'y être invité.",
        language_notes: "Le castillan est la langue officielle. Les langues régionales (catalan, euskara, galicien) sont profondément chéries. Utiliser même quelques mots régionaux signale le respect.",
        gift_protocol: "Bon vin, pâtisseries de qualité ou produits régionaux. Apporter quelque chose quand on est invité chez quelqu'un. Les cadeaux sont généralement ouverts à la réception.",
        dress_code: "Élégant et présentable — les Espagnols sont visiblement fiers de leur apparence. La tenue décontractée est chic, pas négligée. Éviter les shorts en ville sauf près des plages.",
        dos: [
          "Adopter le rythme tardif — déjeuners à 14h, dîners à 21h sont tout à fait normaux",
          "Serrer chaleureusement la main ; les proches peuvent échanger deux bises",
          "Montrer un intérêt sincère pour la culture, la cuisine, l'architecture et la langue régionales",
          "Prolonger les repas — ils sont non pressés et intrinsèquement sociaux",
          "Accepter la générosité de l'hôte sans protestation excessive"
        ],
        donts: [
          "Éviter de parler de la Guerre civile ou de la période franquiste sans bien connaître son auditoire",
          "Ne pas supposer que les Catalans ou les Basques s'identifient simplement comme 'espagnols'",
          "Ne jamais précipiter un repas ni signaler l'impatience au personnel de service",
          "Éviter d'être ostensiblement bruyant en public — animé est bienvenu, agressif ne l'est pas",
          "Ne pas planifier de réunions importantes en août — l'Espagne marque une grande pause"
        ]
      },
      de: {
        region_name: "Spanien",
        core_value: "Lebendiges Leben, stolzer Regionalismus und spritzige menschliche Verbindung",
        biggest_taboo: "Ganz Spanien als einheitlich zu behandeln — regionale Identität (katalanisch, baskisch, andalusisch, galizisch) ist tiefgreifend und ausgeprägt",
        dining_etiquette: "Das Mittagessen ist die Hauptmahlzeit, typischerweise 14–16 Uhr. Abendessen selten vor 21 Uhr. Tapas werden großzügig geteilt. Trinkgeld wird geschätzt, aber moderat. Nicht setzen, bevor man eingeladen wird.",
        language_notes: "Kastilisch ist die Amtssprache. Regionalsprachen (Katalanisch, Baskisch, Galizisch) werden tief geschätzt. Auch nur wenige regionale Worte zu benutzen signalisiert Respekt.",
        gift_protocol: "Guter Wein, hochwertige Gebäcke oder regionale Produkte. Etwas mitbringen, wenn man jemanden zu Hause besucht. Geschenke werden normalerweise beim Empfang geöffnet.",
        dress_code: "Stilvoll und präsentabel — Spanier sind sichtbar stolz auf ihr Äußeres. Freizeitkleidung ist schick, nicht schlampig. Kurze Hosen in Städten außer in Strandnähe vermeiden.",
        dos: [
          "Den späten Zeitplan umarmen — Mittagessen um 14 Uhr, Abendessen um 21 Uhr sind völlig normal",
          "Herzlich mit Handschlag begrüßen; enge Bekannte tauschen zwei Küsse",
          "Echtes Interesse an regionaler Kultur, Essen, Architektur und Sprache zeigen",
          "Bei Mahlzeiten verweilen — sie sind ungezwungen und von Natur aus gesellig",
          "Die Großzügigkeit des Gastgebers ohne übermäßigen Protest annehmen"
        ],
        donts: [
          "Den Bürgerkrieg oder die Franco-Zeit nicht ansprechen, außer man kennt sein Publikum gut",
          "Nicht davon ausgehen, dass Katalanen oder Basken sich als einfach 'Spanier' identifizieren",
          "Niemals eine Mahlzeit hetzen oder dem Servicepersonal Ungeduld zeigen",
          "In der Öffentlichkeit nicht ostentativ laut sein",
          "Wichtige Meetings nicht im August planen — Spanien macht weitgehend Pause"
        ]
      },
      es: {
        region_name: "España",
        core_value: "Vida vivida con intensidad, regionalismo orgulloso y conexión humana apasionada",
        biggest_taboo: "Tratar toda España como uniforme — la identidad regional (catalana, vasca, andaluza, gallega) es profunda y diferenciada",
        dining_etiquette: "El almuerzo es la comida principal, generalmente entre las 14:00 y las 16:00. La cena rara vez antes de las 21:00. Las tapas se comparten con generosidad. La propina se agradece pero es modesta. No se siente antes de ser invitado.",
        language_notes: "El castellano es el idioma oficial. Los idiomas regionales (catalán, euskera, gallego) son profundamente queridos. Usar incluso unas pocas palabras regionales señala respeto.",
        gift_protocol: "Buen vino, repostería de calidad o productos regionales. Lleve algo cuando le inviten a casa. Los regalos generalmente se abren al recibirlos.",
        dress_code: "Estiloso y presentable — los españoles sienten un orgullo visible por su apariencia. La ropa casual es chic, no descuidada. Evite los pantalones cortos en las ciudades excepto cerca de las playas.",
        dos: [
          "Adaptarse al horario tardío — comer a las 14:00 y cenar a las 21:00 es absolutamente normal",
          "Saludar con un cálido apretón de manos; los conocidos cercanos pueden darse dos besos",
          "Mostrar genuino interés por la cultura, gastronomía, arquitectura e idioma regionales",
          "Prolongar las comidas — son tranquilas e inherentemente sociales",
          "Aceptar la generosidad del anfitrión sin protestar en exceso"
        ],
        donts: [
          "Evitar hablar de la Guerra Civil o del franquismo a menos que conozca bien a su interlocutor",
          "No asumir que catalanes o vascos se identifican simplemente como 'españoles'",
          "Nunca apresure una comida ni muestre impaciencia al personal de servicio",
          "Evitar ser ostentosamente ruidoso en público",
          "No programar reuniones importantes en agosto — España hace una gran pausa"
        ]
      },
      pt: {
        region_name: "Espanha",
        core_value: "Vida vibrante, regionalismo orgulhoso e conexão humana apaixonada",
        biggest_taboo: "Tratar toda a Espanha como uniforme — a identidade regional (catalã, basca, andaluza, galega) é profunda e distinta",
        dining_etiquette: "O almoço é a refeição principal, geralmente entre as 14h e as 16h. O jantar raramente antes das 21h. As tapas partilham-se generosamente. A gorjeta é apreciada mas modesta. Não se sente antes de ser convidado.",
        language_notes: "O castelhano é a língua oficial. As línguas regionais (catalão, euskera, galego) são profundamente queridas. Usar mesmo algumas palavras regionais sinaliza respeito.",
        gift_protocol: "Bom vinho, pastéis de qualidade ou produtos regionais. Leve algo quando for convidado a casa de alguém. Os presentes geralmente são abertos quando recebidos.",
        dress_code: "Estiloso e apresentável — os espanhóis têm um orgulho visível na aparência. O casual é chique, não desleixado. Evite calções nas cidades exceto perto das praias.",
        dos: [
          "Adaptar-se ao horário tardio — almoços às 14h, jantares às 21h são absolutamente normais",
          "Cumprimentar com um aperto de mão caloroso; conhecidos próximos podem trocar dois beijos",
          "Mostrar genuíno interesse pela cultura, gastronomia, arquitetura e língua regionais",
          "Prolongar as refeições — são descontraídas e inerentemente sociais",
          "Aceitar a generosidade do anfitrião sem protestar excessivamente"
        ],
        donts: [
          "Evitar falar da Guerra Civil ou do período franquista a não ser que conheça bem o seu interlocutor",
          "Não assumir que catalães ou bascos se identificam simplesmente como 'espanhóis'",
          "Nunca apresse uma refeição nem demonstre impaciência ao staff de serviço",
          "Evitar ser ostensivamente ruidoso em público",
          "Não marcar reuniões importantes em agosto — Espanha faz uma grande pausa"
        ]
      },
      it: {
        region_name: "Spagna",
        core_value: "Vita vivace, regionalismo fiero e vivace connessione umana",
        biggest_taboo: "Trattare tutta la Spagna come uniforme — l'identità regionale (catalana, basca, andalusa, galiziana) è profonda e distinta",
        dining_etiquette: "Il pranzo è il pasto principale, tipicamente tra le 14:00 e le 16:00. La cena raramente prima delle 21:00. Le tapas si condividono generosamente. La mancia è apprezzata ma modesta. Non sedersi prima di essere invitati.",
        language_notes: "Il castigliano è la lingua ufficiale. Le lingue regionali (catalano, euskara, galiziano) sono profondamente amate. Usare anche solo qualche parola regionale segnala rispetto.",
        gift_protocol: "Vino pregiato, pasticceria di qualità o prodotti regionali. Portare qualcosa quando si è invitati a casa di qualcuno. I regali vengono di solito aperti alla ricezione.",
        dress_code: "Elegante e presentabile — gli spagnoli hanno un visibile orgoglio per il proprio aspetto. Il casual è chic, non trasandato. Evitare i pantaloncini in città tranne che vicino alle spiagge.",
        dos: [
          "Abbracciare il ritmo tardivo — pranzi alle 14:00, cene alle 21:00 sono del tutto normali",
          "Stringere la mano calorosamente; i conoscenti stretti possono scambiarsi due baci",
          "Mostrare genuino interesse per la cultura, la cucina, l'architettura e la lingua regionali",
          "Soffermarsi sui pasti — sono senza fretta e intrinsecamente sociali",
          "Accettare la generosità dell'ospite senza eccessive proteste"
        ],
        donts: [
          "Evitare di parlare della Guerra Civile o del periodo franchista se non si conosce bene il proprio interlocutore",
          "Non presumere che catalani o baschi si identifichino semplicemente come 'spagnoli'",
          "Non affrettare mai un pasto né segnalare impazienza al personale di servizio",
          "Evitare di essere vistosamente rumorosi in pubblico",
          "Non programmare riunioni importanti in agosto — la Spagna si ferma largamente"
        ]
      },
      ar: {
        region_name: "إسبانيا",
        core_value: "حياة نابضة وإقليمية فخورة وتواصل إنساني متحمس",
        biggest_taboo: "التعامل مع إسبانيا كلها بوصفها متجانسة — الهوية الإقليمية (الكاتالونية والباسكية والأندلسية والجاليكية) عميقة ومتمايزة",
        dining_etiquette: "الغداء هو الوجبة الرئيسية، عادةً من الساعة 2 إلى 4 مساءً. العشاء نادرًا قبل الساعة 9 مساءً. تُشارَك التاباس بسخاء. الإكرامية مُقدَّرة لكن معتدلة. لا تجلس قبل أن تُدعى.",
        language_notes: "القشتالية هي اللغة الرسمية. اللغات الإقليمية (الكاتالونية والباسكية والجاليكية) محبوبة بعمق. استخدام بعض الكلمات الإقليمية يُعبّر عن الاحترام.",
        gift_protocol: "نبيذ جيد أو حلويات عالية الجودة أو منتجات إقليمية. أحضر شيئًا عند الدعوة لزيارة أحدهم في المنزل. تُفتح الهدايا عادةً عند استلامها.",
        dress_code: "أنيق ومرتّب — يفخر الإسبان بمظهرهم بشكل واضح. الملبس الغير رسمي أنيق لا مهمل. تجنّب السراويل القصيرة في المدن بعيدًا عن الشواطئ.",
        dos: [
          "اعتنِ بالجدول الزمني المتأخر — الغداء في الساعة 2 مساءً والعشاء في 9 مساءً أمر طبيعي",
          "صافح بدفء عند التحية؛ المعارف المقرّبون يتبادلون قُبلتين",
          "أبدِ اهتمامًا حقيقيًا بالثقافة والطعام والعمارة واللغة الإقليمية",
          "اجلس طويلاً عند المائدة — الوجبات هادئة وذات طابع اجتماعي",
          "اقبل كرم المضيف دون احتجاج مفرط"
        ],
        donts: [
          "تجنّب الحديث عن الحرب الأهلية أو حقبة فرانكو إلا إذا عرفت جمهورك جيدًا",
          "لا تفترض أن الكاتالونيين أو الباسكيين يعرّفون أنفسهم ببساطة بأنهم 'إسبان'",
          "لا تستعجل الوجبة ولا تُظهر التذمّر لموظفي الخدمة",
          "تجنّب الصخب المتعمّد في الأماكن العامة",
          "لا تجدول اجتماعات مهمة في أغسطس — تتوقف إسبانيا إلى حد بعيد"
        ]
      },
      ja: {
        region_name: "スペイン",
        core_value: "鮮やかな生活、誇り高い地域主義、そして活気ある人間的つながり",
        biggest_taboo: "スペイン全体を均一に扱うこと——地域的アイデンティティ（カタルーニャ、バスク、アンダルシア、ガリシア）は深く独自のもの",
        dining_etiquette: "昼食がメインの食事で、通常14時〜16時。夕食は21時前はまれ。タパスは寛大に分け合う。チップは感謝されるが控えめ。招待されるまで座らない。",
        language_notes: "カスティーリャ語が公用語。地域言語（カタルーニャ語、バスク語、ガリシア語）は深く大切にされている。地域の言葉をいくつか使うだけで敬意が伝わる。",
        gift_protocol: "良質なワイン、上品なお菓子、または地域の産品。家に招かれた際は何か持参する。プレゼントは通常受け取った際に開ける。",
        dress_code: "スタイリッシュで見栄えが良い——スペイン人は外見への誇りが目に見える。カジュアルはシックであり、だらしなくない。ビーチ付近以外では都市部でショートパンツを避ける。",
        dos: [
          "遅い時間帯のスケジュールを受け入れる——14時の昼食、21時の夕食は完全に普通",
          "挨拶には温かい握手；親しい知人は両頬にキスを交わすこともある",
          "地域の文化、食、建築、言語に本物の興味を示す",
          "食事をゆっくり楽しむ——急がず本質的に社交的",
          "ホストの寛大さを過度な遠慮なしに受け入れる"
        ],
        donts: [
          "聴衆をよく知らない限り内戦やフランコ時代について話さない",
          "カタルーニャ人やバスク人が単に「スペイン人」だと思わない",
          "食事を急いだり、サービススタッフへの焦りを示したりしない",
          "公共の場で大げさに騒がない——活発は歓迎されるが攻撃的はNG",
          "8月に重要な会議を組まない——スペインはほぼ活動停止"
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
      },
      nl: {
        region_name: "Colombia",
        core_value: "Persoonlijke warmte, veerkracht en oprechte trots op Colombia's cultuur en transformatie",
        biggest_taboo: "Colombia reduceren tot zijn vroegere problemen — Colombianen zijn terecht trots op hoe ver het land is gekomen",
        dining_etiquette: "Maaltijden zijn warme, sociale gelegenheden. Wacht tot de gastheer u uitnodigt om te eten. Royale porties signaleren gastvrijheid. Koffie (tinto) wordt altijd aangeboden en dient te worden geaccepteerd.",
        language_notes: "Colombiaans Spaans geldt als een van de helderste en meest neutrale in Latijns-Amerika. Elke poging tot Spaans wordt diep en oprecht gewaardeerd.",
        gift_protocol: "Bloemen, snoep of kwaliteitsdranken. Cadeaus worden hartelijk ontvangen en direct geopend. Vermijd zakdoeken — die zijn geassocieerd met rouw.",
        dress_code: "Altijd netjes en verzorgd. Colombianen zijn zichtbaar trots op hun uiterlijk. Zakelijke kleding is formeel in grote steden zoals Bogotá, relaxter aan de kust.",
        dos: [
          "Wees oprecht warm — begroet met handdruk of zoen op de wang naar gelang de sociale context",
          "Toon oprechte interesse in Colombia's regio's, koffie, cultuur en keuken",
          "Investeer in de relatie voor zakelijke gesprekken",
          "Accepteer koffie wanneer die wordt aangeboden — dat zal altijd zo zijn",
          "Complimenteer de transformatie en vooruitgang van het land"
        ],
        donts: [
          "Verwijs nooit naar cocaïne, Pablo Escobar of kartels als gespreksonderwerp",
          "Vermijd generalisaties over Colombia met buurlanden of andere Latijns-Amerikaanse landen",
          "Ga niet uit van de mate van formaliteit zonder de ruimte goed in te schatten",
          "Vermijd politieke discussies tenzij uitgenodigd en goed geïnformeerd",
          "Wijs nooit gastvrijheid af zonder een oprechte en specifieke uitleg"
        ]
      },
      fr: {
        region_name: "Colombie",
        core_value: "Chaleur personnelle, résilience et fierté authentique pour la culture et la transformation de la Colombie",
        biggest_taboo: "Réduire la Colombie à ses luttes passées — les Colombiens sont légitimement fiers du chemin parcouru par leur pays",
        dining_etiquette: "Les repas sont des occasions sociales chaleureuses. Attendre que l'hôte vous invite à manger. Les portions généreuses signalent l'hospitalité. Le café (tinto) est constamment proposé et doit être accepté.",
        language_notes: "L'espagnol colombien est considéré comme l'un des plus clairs et neutres d'Amérique latine. Tout effort de parler espagnol est profondément apprécié.",
        gift_protocol: "Fleurs, sucreries ou spiritueux de qualité. Les cadeaux sont reçus chaleureusement et ouverts immédiatement. Éviter les mouchoirs — ils sont associés au deuil.",
        dress_code: "Soigné et bien habillé en toutes circonstances. Les Colombiens sont visiblement fiers de leur apparence. La tenue de travail est formelle dans les grandes villes comme Bogotá, plus détendue sur la côte.",
        dos: [
          "Être sincèrement chaleureux — saluer avec une poignée de main ou une bise selon le contexte social",
          "Exprimer un intérêt sincère pour les régions, le café, la culture et la cuisine de la Colombie",
          "Investir dans la relation avant de parler affaires",
          "Accepter le café quand il est proposé — il le sera toujours",
          "Complimenter la transformation et le progrès du pays"
        ],
        donts: [
          "Ne jamais évoquer la cocaïne, Pablo Escobar ou les cartels en conversation",
          "Éviter de généraliser la Colombie avec ses voisins ou d'autres pays d'Amérique latine",
          "Ne pas présumer du niveau de formalité sans avoir lu l'ambiance",
          "Éviter de discuter de politique sans invitation et sans être vraiment informé",
          "Ne jamais décliner l'hospitalité sans une explication sincère et précise"
        ]
      },
      de: {
        region_name: "Kolumbien",
        core_value: "Persönliche Wärme, Resilienz und echter Stolz auf Kolumbiens Kultur und Wandel",
        biggest_taboo: "Kolumbien auf seine vergangenen Probleme zu reduzieren — Kolumbianer sind zu Recht stolz darauf, wie weit das Land gekommen ist",
        dining_etiquette: "Mahlzeiten sind herzliche, gesellige Anlässe. Warten, bis der Gastgeber zum Essen einlädt. Großzügige Portionen signalisieren Gastfreundschaft. Kaffee (Tinto) wird ständig angeboten und sollte angenommen werden.",
        language_notes: "Kolumbianisches Spanisch gilt als eines der klarsten und neutralsten in Lateinamerika. Jeder Versuch, Spanisch zu sprechen, wird tief und aufrichtig geschätzt.",
        gift_protocol: "Blumen, Süßigkeiten oder hochwertige Spirituosen. Geschenke werden herzlich empfangen und sofort geöffnet. Taschentücher meiden — sie sind mit Trauer verbunden.",
        dress_code: "Stets gepflegt und gut gekleidet. Kolumbianer sind sichtbar stolz auf ihr Äußeres. Geschäftskleidung ist formell in Großstädten wie Bogotá, entspannter an der Küste.",
        dos: [
          "Aufrichtig warm sein — mit Handschlag oder Wangenkuss je nach sozialem Kontext begrüßen",
          "Echtes Interesse an Kolumbiens Regionen, Kaffee, Kultur und Küche zeigen",
          "In die Beziehung investieren, bevor Geschäftliches besprochen wird",
          "Kaffee annehmen, wenn er angeboten wird — das wird er immer",
          "Die Transformation und den Fortschritt des Landes loben"
        ],
        donts: [
          "Niemals Kokain, Pablo Escobar oder Kartelle als Gesprächsthema erwähnen",
          "Verallgemeinerungen über Kolumbien mit Nachbarländern oder anderen lateinamerikanischen Ländern vermeiden",
          "Den Grad an Formalität nicht annehmen, ohne die Situation sorgfältig zu lesen",
          "Politische Diskussionen vermeiden, außer man ist eingeladen und gut informiert",
          "Gastfreundschaft niemals ohne aufrichtige und spezifische Erklärung ablehnen"
        ]
      },
      es: {
        region_name: "Colombia",
        core_value: "Calidez personal, resiliencia y genuino orgullo por la cultura y la transformación de Colombia",
        biggest_taboo: "Reducir Colombia a sus luchas pasadas — los colombianos están legítimamente orgullosos de lo lejos que ha llegado su país",
        dining_etiquette: "Las comidas son ocasiones sociales y cálidas. Espere a que el anfitrión le invite a comer. Las porciones generosas señalan hospitalidad. El café (tinto) se ofrece constantemente y debe aceptarse.",
        language_notes: "El español colombiano se considera uno de los más claros y neutros de América Latina. Cualquier intento de hablar español es profunda y genuinamente apreciado.",
        gift_protocol: "Flores, dulces o licores de calidad. Los regalos se reciben con calidez y se abren de inmediato. Evite dar pañuelos — están asociados con el luto.",
        dress_code: "Siempre pulcro y bien arreglado. Los colombianos sienten un visible orgullo por su apariencia. El traje de negocios es formal en ciudades como Bogotá, más relajado en la costa.",
        dos: [
          "Ser genuinamente cálido — saludar con apretón de manos o beso en la mejilla según el contexto social",
          "Expresar genuino interés en las regiones, el café, la cultura y la gastronomía de Colombia",
          "Invertir en la relación antes de hablar de negocios",
          "Aceptar el café siempre que se ofrezca — siempre se ofrecerá",
          "Elogiar la transformación y el progreso del país"
        ],
        donts: [
          "Nunca mencionar la cocaína, Pablo Escobar o los carteles como tema de conversación",
          "Evitar generalizar Colombia con sus vecinos u otros países de América Latina",
          "No asumir el nivel de formalidad o informalidad sin leer bien el ambiente",
          "Evitar discutir de política a menos que sea invitado y esté bien informado",
          "Nunca rechazar la hospitalidad sin una explicación sincera y específica"
        ]
      },
      pt: {
        region_name: "Colômbia",
        core_value: "Calor pessoal, resiliência e genuíno orgulho pela cultura e transformação da Colômbia",
        biggest_taboo: "Reduzir a Colômbia às suas lutas passadas — os colombianos têm legítimo orgulho do caminho percorrido pelo país",
        dining_etiquette: "As refeições são ocasiões sociais e calorosas. Aguarde que o anfitrião o convide a comer. Porções generosas sinalizam hospitalidade. O café (tinto) é oferecido constantemente e deve ser aceite.",
        language_notes: "O espanhol colombiano é considerado um dos mais claros e neutros da América Latina. Qualquer tentativa de falar espanhol é profundamente apreciada.",
        gift_protocol: "Flores, doces ou licores de qualidade. Os presentes são recebidos com calor e abertos imediatamente. Evite dar lenços — estão associados ao luto.",
        dress_code: "Sempre bem apresentado e cuidado. Os colombianos têm um visível orgulho na aparência. O traje de negócios é formal em grandes cidades como Bogotá, mais relaxado na costa.",
        dos: [
          "Ser genuinamente caloroso — cumprimentar com aperto de mão ou beijo na bochecha consoante o contexto social",
          "Expressar genuíno interesse nas regiões, café, cultura e gastronomia da Colômbia",
          "Investir na relação antes de falar de negócios",
          "Aceitar café sempre que for oferecido — sempre será",
          "Elogiar a transformação e o progresso do país"
        ],
        donts: [
          "Nunca mencionar cocaína, Pablo Escobar ou cartéis como tema de conversa",
          "Evitar generalizar a Colômbia com países vizinhos ou outros países da América Latina",
          "Não assumir o nível de formalidade ou informalidade sem ler bem a situação",
          "Evitar discutir política a não ser que seja convidado e esteja bem informado",
          "Nunca recusar hospitalidade sem uma explicação sincera e específica"
        ]
      },
      it: {
        region_name: "Colombia",
        core_value: "Calore personale, resilienza e autentico orgoglio per la cultura e la trasformazione della Colombia",
        biggest_taboo: "Ridurre la Colombia alle sue lotte passate — i colombiani sono giustamente orgogliosi di quanto lontano sia arrivato il paese",
        dining_etiquette: "I pasti sono occasioni sociali e calorosi. Aspettare che l'ospite inviti a mangiare. Le porzioni generose segnalano ospitalità. Il caffè (tinto) viene offerto continuamente e va accettato.",
        language_notes: "Lo spagnolo colombiano è considerato tra i più chiari e neutri dell'America Latina. Qualsiasi tentativo di parlare spagnolo è profondamente e genuinamente apprezzato.",
        gift_protocol: "Fiori, dolci o liquori di qualità. I regali vengono ricevuti calorosamente e aperti subito. Evitare i fazzoletti — sono associati al lutto.",
        dress_code: "Sempre curati e ben vestiti. I colombiani hanno un visibile orgoglio per il proprio aspetto. L'abbigliamento di lavoro è formale nelle grandi città come Bogotá, più rilassato sulla costa.",
        dos: [
          "Essere genuinamente caldi — salutare con una stretta di mano o un bacio sulla guancia a seconda del contesto sociale",
          "Esprimere genuino interesse per le regioni, il caffè, la cultura e la cucina della Colombia",
          "Investire nella relazione prima di parlare di affari",
          "Accettare il caffè ogni volta che viene offerto — verrà sempre offerto",
          "Complimentarsi per la trasformazione e il progresso del paese"
        ],
        donts: [
          "Non menzionare mai cocaina, Pablo Escobar o cartelli come argomento di conversazione",
          "Evitare di generalizzare la Colombia con i paesi vicini o altre nazioni latinoamericane",
          "Non presumere il livello di formalità o informalità senza leggere attentamente il contesto",
          "Evitare di discutere di politica a meno di essere invitati e ben informati",
          "Non rifiutare mai l'ospitalità senza una spiegazione sincera e specifica"
        ]
      },
      ar: {
        region_name: "كولومبيا",
        core_value: "الدفء الشخصي والمرونة والفخر الحقيقي بثقافة كولومبيا وتحوّلها",
        biggest_taboo: "اختزال كولومبيا في صراعاتها الماضية — الكولومبيون يفخرون بحق بمسافة التقدم التي قطعها بلدهم",
        dining_etiquette: "الوجبات مناسبات اجتماعية دافئة. انتظر حتى يدعوك المضيف للأكل. الحصص الكريمة تعبّر عن الضيافة. يُقدَّم القهوة (تينتو) باستمرار ويجب قبولها.",
        language_notes: "تُعدّ اللغة الإسبانية الكولومبية من أوضح لهجات أمريكا اللاتينية وأكثرها حيادية. أي محاولة للتحدث بالإسبانية تُقدَّر بعمق وصدق.",
        gift_protocol: "ورود أو حلويات أو مشروبات روحية عالية الجودة. تُستقبَل الهدايا بحفاوة وتُفتح فورًا. تجنّب تقديم المناديل — مرتبطة بالحزن.",
        dress_code: "أنيق ومرتّب دائمًا. يفخر الكولومبيون بمظهرهم. الملبس المهني رسمي في المدن الكبرى كبوغوتا، وأكثر مرونة على الساحل.",
        dos: [
          "كن دافئًا بصدق — حيِّ بمصافحة أو قبلة على الخد حسب السياق الاجتماعي",
          "أبدِ اهتمامًا حقيقيًا بمناطق كولومبيا وقهوتها وثقافتها ومطبخها",
          "استثمر في العلاقة قبل الانتقال إلى الأعمال",
          "اقبل القهوة متى قُدِّمت — ستُقدَّم دائمًا",
          "أثنِ على تحوّل البلاد وتقدّمها — يعني ذلك الكثير لمن عاشه"
        ],
        donts: [
          "لا تُشر أبدًا إلى الكوكايين أو بابلو إسكوبار أو الكارتلات في أي حديث",
          "تجنّب التعميم بشأن كولومبيا مع الدول المجاورة أو دول أمريكا اللاتينية الأخرى",
          "لا تفترض مستوى الرسمية أو غيرها دون قراءة جيدة للموقف",
          "تجنّب مناقشة السياسة ما لم تُدعَ إليها وتكن مُلمًّا جيدًا",
          "لا ترفض الضيافة أبدًا دون تفسير صادق ومحدد"
        ]
      },
      ja: {
        region_name: "コロンビア",
        core_value: "個人的な温かさ、レジリエンス、そしてコロンビアの文化と変革への本物の誇り",
        biggest_taboo: "コロンビアを過去の苦難に矮小化すること——コロンビア人は国がいかに遠くまで来たかを正当に誇りにしている",
        dining_etiquette: "食事は温かく社交的な場。ホストが食事を勧めるまで待つ。豊かな量はおもてなしの証——食べ切れる分だけ取る。コーヒー（ティント）は常に提供され、受け入れるべき。",
        language_notes: "コロンビアのスペイン語はラテンアメリカで最も明確で中立的なものの一つと考えられている。スペイン語のどんな試みも深く誠実に評価される。",
        gift_protocol: "花、お菓子、または良質なスピリッツ。プレゼントは温かく受け取られ、すぐに開ける。ハンカチは避ける——喪に関連している。",
        dress_code: "常に清潔感があり身だしなみが整っている。コロンビア人は外見への誇りが目に見える。ビジネスウェアはボゴタなど大都市では正式、海岸ではより気軽。",
        dos: [
          "本物の温かさを持つ——社会的文脈に応じて握手またはほほえみで挨拶する",
          "コロンビアの地域、コーヒー、文化、料理に本物の興味を示す",
          "ビジネスの話の前に関係に投資する",
          "コーヒーが出されたら必ず受け取る——常に出される",
          "国の変革と進歩を褒める——それを生きた人々にとって大きな意味がある"
        ],
        donts: [
          "コカイン、パブロ・エスコバル、カルテルを会話のトピックとして持ち出さない",
          "コロンビアを隣国や他のラテンアメリカ諸国と一般化しない",
          "場の雰囲気をよく読まずに形式・非形式のレベルを決めつけない",
          "招待されておらず十分な知識もなければ政治の話は避ける",
          "誠実かつ具体的な説明なしにおもてなしを断らない"
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
      },
      nl: {
        region_name: "Verenigde Arabische Emiraten",
        core_value: "Waardige gastvrijheid, respect voor islamitische tradities en visionair ambitie",
        biggest_taboo: "Islamitische gewoonten, religieuze praktijken of wetten niet respecteren — inclusief kleding, gedrag tijdens de Ramadan en openbaar gedrag",
        dining_etiquette: "Accepteer dadels en Arabische koffie wanneer ze worden aangeboden — dit is een eerbetoon en mag niet worden geweigerd. Eet alleen met de rechterhand. Alcohol is beschikbaar in erkende gelegenheden maar nooit vanzelfsprekend.",
        language_notes: "Arabisch is de officiële taal; Engels wordt veel gebruikt in het bedrijfsleven. Een paar Arabische zinnen leren (Marhaba, Shukran, Inshallah) wordt hartelijk gewaardeerd.",
        gift_protocol: "Dadels, fijne snoepwaren of kwaliteitsparfum. Vermijd alcohol of varkensproducten als cadeaus. Geef altijd met de rechterhand.",
        dress_code: "Bescheiden kleding is verplicht in het openbaar en wettelijk vereist in sommige omgevingen. Vrouwen dienen schouders en knieën te bedekken. Mannen vermijden shorts in formele settings.",
        dos: [
          "Sta op wanneer een senior of belangrijk persoon de kamer binnenkomt",
          "Accepteer gastvrijheid zonder overdreven weigering — gastheer zijn is een eer",
          "Gebruik de rechterhand voor al het doorgeven van objecten en voedsel",
          "Respecteer gebedstijden — zakelijke en andere afspraken pauzeren dienovereenkomstig",
          "Leer over islamitische tradities en gewoonten voor een bezoek tijdens de Ramadan"
        ],
        donts: [
          "Bekritiseer nooit openbaar de islam, de overheid of leden van de heersende familie",
          "Vermijd lichamelijk contact met vreemden van het andere geslacht",
          "Consumeer geen alcohol, eten of drinken in het openbaar tijdens de Ramadan",
          "Vermijd openbare uitingen van genegenheid — dit is illegaal",
          "Wijs niet met één vinger naar mensen of heilige plaatsen — gebruik een open hand"
        ]
      },
      fr: {
        region_name: "Émirats arabes unis",
        core_value: "Hospitalité digne, respect de la tradition islamique et ambition visionnaire",
        biggest_taboo: "Manquer de respect aux coutumes islamiques, à la pratique religieuse ou à la loi — y compris la tenue vestimentaire, la conduite pendant le Ramadan et le comportement en public",
        dining_etiquette: "Accepter les dattes et le café arabe proposés — c'est un geste d'honneur qui ne doit pas être refusé. Manger uniquement de la main droite. L'alcool est disponible dans les établissements agréés mais n'est jamais présumé.",
        language_notes: "L'arabe est la langue officielle ; l'anglais est largement utilisé en affaires. Apprendre quelques phrases en arabe (Marhaba, Shukran, Inshallah) est chaleureusement apprécié.",
        gift_protocol: "Dattes, confiseries fines ou parfum de qualité. Éviter l'alcool ou les produits à base de porc. Donner uniquement de la main droite.",
        dress_code: "Une tenue modeste est obligatoire en public et légalement exigée dans certains contextes. Les femmes doivent couvrir épaules et genoux. Les hommes doivent éviter les shorts dans les contextes formels.",
        dos: [
          "Se lever lorsqu'une personne senior ou importante entre dans la pièce",
          "Accepter l'hospitalité sans refus excessif — être reçu est un honneur",
          "Utiliser la main droite pour tous les échanges d'objets et de nourriture",
          "Respecter les heures de prière — les affaires et réunions font une pause en conséquence",
          "S'informer sur les traditions islamiques avant de visiter pendant le Ramadan"
        ],
        donts: [
          "Ne jamais critiquer publiquement l'islam, le gouvernement ou des membres de la famille régnante",
          "Éviter tout contact physique avec des inconnus de l'autre sexe",
          "Ne pas consommer d'alcool, de nourriture ou de boisson en public pendant le Ramadan",
          "Éviter les manifestations publiques d'affection — elles sont illégales",
          "Ne pas pointer des personnes ou des sites sacrés avec un seul doigt — utiliser la main ouverte"
        ]
      },
      de: {
        region_name: "Vereinigte Arabische Emirate",
        core_value: "Würdevolle Gastfreundschaft, Respekt vor islamischer Tradition und visionärer Ehrgeiz",
        biggest_taboo: "Islamische Gebräuche, religiöse Praktiken oder Gesetze missachten — einschließlich Kleidung, Verhalten während des Ramadan und öffentliches Verhalten",
        dining_etiquette: "Datteln und arabischen Kaffee annehmen, wenn sie angeboten werden — es ist eine Ehrengeste und darf nicht abgelehnt werden. Nur mit der rechten Hand essen. Alkohol ist in lizenzierten Lokalen erhältlich, aber nie selbstverständlich.",
        language_notes: "Arabisch ist die Amtssprache; Englisch wird im Geschäftsleben weit verbreitet eingesetzt. Ein paar arabische Sätze zu lernen (Marhaba, Shukran, Inshallah) wird herzlich geschätzt.",
        gift_protocol: "Datteln, feine Süßwaren oder Qualitätsparfüm. Alkohol oder Produkte mit Schweinefleisch als Geschenke vermeiden. Immer mit der rechten Hand geben.",
        dress_code: "Bescheidene Kleidung ist in der Öffentlichkeit obligatorisch und in bestimmten Umgebungen gesetzlich vorgeschrieben. Frauen sollten Schultern und Knie bedecken.",
        dos: [
          "Aufstehen, wenn eine ranghöhere oder wichtige Person den Raum betritt",
          "Gastfreundschaft ohne übermäßige Ablehnung annehmen",
          "Die rechte Hand für alle physischen Übergaben von Gegenständen und Speisen verwenden",
          "Gebetszeiten respektieren — Geschäftliches und Besprechungen halten inne",
          "Über islamische Traditionen informieren, bevor man während des Ramadan besucht"
        ],
        donts: [
          "Niemals öffentlich den Islam, die Regierung oder Mitglieder der Herrscherfamilie kritisieren",
          "Jeglichen körperlichen Kontakt mit Fremden des anderen Geschlechts vermeiden",
          "Keinen Alkohol konsumieren und in der Öffentlichkeit während des Ramadan weder essen noch trinken",
          "Öffentliche Zuneigungsbekundungen vermeiden — sie sind im öffentlichen Raum illegal",
          "Nicht mit einem einzelnen Finger auf Menschen oder heilige Stätten zeigen"
        ]
      },
      es: {
        region_name: "Emiratos Árabes Unidos",
        core_value: "Hospitalidad digna, respeto por la tradición islámica y ambición visionaria",
        biggest_taboo: "Faltar al respeto a las costumbres islámicas, la práctica religiosa o la ley — incluida la vestimenta, el comportamiento durante el Ramadán y la conducta en público",
        dining_etiquette: "Aceptar los dátiles y el café árabe cuando se ofrezcan — es un gesto de honor que no debe rechazarse. Comer solo con la mano derecha. El alcohol está disponible en locales autorizados pero nunca se da por supuesto.",
        language_notes: "El árabe es el idioma oficial; el inglés se usa ampliamente en los negocios. Aprender algunas frases en árabe (Marhaba, Shukran, Inshallah) es cálidamente apreciado.",
        gift_protocol: "Dátiles, confitería fina o perfume de calidad. Evite alcohol o productos relacionados con el cerdo. Dar siempre con la mano derecha.",
        dress_code: "La vestimenta modesta es obligatoria en público y legalmente requerida en algunos contextos. Las mujeres deben cubrir hombros y rodillas. Los hombres deben evitar los pantalones cortos en entornos formales.",
        dos: [
          "Ponerse en pie cuando una persona de mayor rango o importancia entre en la sala",
          "Aceptar la hospitalidad sin rechazo excesivo — ser anfitrión es un honor",
          "Usar la mano derecha para todo intercambio físico de objetos y comida",
          "Respetar los horarios de oración — los negocios y reuniones hacen una pausa",
          "Informarse sobre las tradiciones islámicas antes de visitar durante el Ramadán"
        ],
        donts: [
          "Nunca criticar públicamente el Islam, el gobierno o miembros de la familia gobernante",
          "Evitar cualquier contacto físico con desconocidos del sexo opuesto",
          "No consumir alcohol, comer ni beber en público durante las horas diurnas del Ramadán",
          "Evitar las muestras públicas de afecto — son ilegales en espacios públicos",
          "No señalar a personas o lugares sagrados con un solo dedo — usar la mano abierta"
        ]
      },
      pt: {
        region_name: "Emirados Árabes Unidos",
        core_value: "Hospitalidade digna, respeito pela tradição islâmica e ambição visionária",
        biggest_taboo: "Desrespeitar costumes islâmicos, práticas religiosas ou leis — incluindo vestuário, conduta durante o Ramadão e comportamento em público",
        dining_etiquette: "Aceitar tâmaras e café árabe quando oferecidos — é um gesto de honra que não deve ser recusado. Comer apenas com a mão direita. O álcool está disponível em estabelecimentos licenciados mas nunca é assumido.",
        language_notes: "O árabe é a língua oficial; o inglês é amplamente usado nos negócios. Aprender algumas frases em árabe (Marhaba, Shukran, Inshallah) é calorosamente apreciado.",
        gift_protocol: "Tâmaras, confeitaria fina ou perfume de qualidade. Evite álcool ou produtos de porco como presentes. Dar sempre com a mão direita.",
        dress_code: "Vestuário modesto é obrigatório em público e legalmente exigido em alguns contextos. As mulheres devem cobrir ombros e joelhos. Os homens devem evitar calções em contextos formais.",
        dos: [
          "Levantar-se quando uma pessoa sénior ou importante entra na sala",
          "Aceitar hospitalidade sem recusa excessiva — ser recebido é uma honra",
          "Usar a mão direita para toda a troca física de objetos e alimentos",
          "Respeitar os horários de oração — negócios e reuniões fazem uma pausa",
          "Informar-se sobre as tradições islâmicas antes de visitar durante o Ramadão"
        ],
        donts: [
          "Nunca criticar publicamente o Islão, o governo ou membros da família governante",
          "Evitar qualquer contacto físico com desconhecidos do sexo oposto",
          "Não consumir álcool, comer ou beber em público durante as horas diurnas do Ramadão",
          "Evitar manifestações públicas de afeto — são ilegais em espaços públicos",
          "Não apontar com um único dedo para pessoas ou locais sagrados — usar a mão aberta"
        ]
      },
      it: {
        region_name: "Emirati Arabi Uniti",
        core_value: "Ospitalità dignitosa, rispetto per la tradizione islamica e ambizione visionaria",
        biggest_taboo: "Mancare di rispetto ai costumi islamici, alla pratica religiosa o alla legge — incluso l'abbigliamento, la condotta durante il Ramadan e il comportamento in pubblico",
        dining_etiquette: "Accettare datteri e caffè arabo quando offerti — è un gesto d'onore che non deve essere rifiutato. Mangiare solo con la mano destra. L'alcol è disponibile nei locali autorizzati ma non è mai dato per scontato.",
        language_notes: "L'arabo è la lingua ufficiale; l'inglese è ampiamente usato negli affari. Imparare qualche frase in arabo (Marhaba, Shukran, Inshallah) è calorosamente apprezzato.",
        gift_protocol: "Datteri, confetteria pregiata o profumo di qualità. Evitare alcol o prodotti a base di maiale come regali. Dare sempre con la mano destra.",
        dress_code: "L'abbigliamento modesto è obbligatorio in pubblico e legalmente richiesto in alcuni contesti. Le donne devono coprire spalle e ginocchia. Gli uomini devono evitare i pantaloncini in contesti formali.",
        dos: [
          "Alzarsi quando una persona anziana o importante entra nella stanza",
          "Accettare l'ospitalità senza eccessive resistenze — essere ospitati è un onore",
          "Usare la mano destra per tutti gli scambi fisici di oggetti e cibo",
          "Rispettare gli orari di preghiera — affari e riunioni si fermano di conseguenza",
          "Informarsi sulle tradizioni islamiche prima di visitare durante il Ramadan"
        ],
        donts: [
          "Non criticare mai pubblicamente l'Islam, il governo o i membri della famiglia regnante",
          "Evitare qualsiasi contatto fisico con sconosciuti di sesso opposto",
          "Non consumare alcol, mangiare o bere in pubblico durante le ore diurne del Ramadan",
          "Evitare manifestazioni pubbliche di affetto — sono illegali negli spazi pubblici",
          "Non indicare persone o luoghi sacri con un solo dito — usare la mano aperta"
        ]
      },
      ar: {
        region_name: "الإمارات العربية المتحدة",
        core_value: "الضيافة الكريمة واحترام التقاليد الإسلامية والطموح الريادي",
        biggest_taboo: "عدم احترام الأعراف الإسلامية أو الممارسة الدينية أو القانون — بما يشمل اللباس والسلوك خلال رمضان والتصرف في الأماكن العامة",
        dining_etiquette: "اقبل التمر والقهوة العربية حين تُقدَّم — إنها لفتة تكريم لا ينبغي رفضها. تناول الطعام باليد اليمنى فقط. الكحول متاح في الأماكن المرخصة لكنه غير مفترض أبدًا.",
        language_notes: "العربية هي اللغة الرسمية؛ الإنجليزية مستخدمة على نطاق واسع في الأعمال. تعلّم بعض العبارات العربية (مرحبا، شكرًا، إن شاء الله) يُقدَّر بحرارة.",
        gift_protocol: "تمر أو حلويات راقية أو عطر عالي الجودة. تجنّب الكحول أو المنتجات المشتقة من لحم الخنزير كهدايا. أعطِ باليد اليمنى دائمًا.",
        dress_code: "اللباس المحتشم إلزامي في الأماكن العامة ومطلوب قانونيًا في بعض البيئات. ينبغي على المرأة تغطية الكتفين والركبتين. على الرجال تجنّب السراويل القصيرة في البيئات الرسمية.",
        dos: [
          "قم عند دخول شخص كبير أو مهم إلى الغرفة",
          "اقبل الضيافة دون رفض مفرط — أن تُستضاف شرف",
          "استخدم اليد اليمنى لتبادل الأشياء والطعام",
          "احترم أوقات الصلاة — تتوقف الأعمال والاجتماعات وفقًا لذلك",
          "اطّلع على التقاليد الإسلامية قبل الزيارة في رمضان"
        ],
        donts: [
          "لا تنتقد علنًا الإسلام أو الحكومة أو أفراد الأسرة الحاكمة أبدًا",
          "تجنّب أي تواصل جسدي مع الغرباء من الجنس الآخر",
          "لا تتناول الكحول أو الطعام أو الشراب علنًا خلال ساعات النهار في رمضان",
          "تجنّب إظهار المودة في الأماكن العامة — مخالف للقانون",
          "لا تشير بإصبع واحد إلى الناس أو المواقع المقدسة — استخدم راحة اليد المفتوحة"
        ]
      },
      ja: {
        region_name: "アラブ首長国連邦",
        core_value: "品格あるおもてなし、イスラムの伝統への敬意、そして先見的な野心",
        biggest_taboo: "イスラムの慣習、宗教的慣行、または法律を軽視すること——服装、ラマダン中の行動、公共での行動を含む",
        dining_etiquette: "提供されたナツメヤシとアラビアコーヒーは受け入れる——それは名誉のしぐさであり断ってはならない。右手だけで食べる。アルコールは認可を受けた場所で入手可能だが当然とは思わない。",
        language_notes: "アラビア語が公用語；英語はビジネスで広く使われる。いくつかのアラビア語フレーズを覚えること（マルハバ、シュクラン、インシャーアッラー）は温かく評価される。",
        gift_protocol: "ナツメヤシ、上質な菓子、または良質な香水。アルコールや豚肉関連製品は贈り物として避ける。常に右手で渡す。",
        dress_code: "控えめな服装は公共の場で必須であり、一部の環境では法的に義務付けられている。女性は肩と膝を覆う。男性はフォーマルや伝統的な場でショートパンツを避ける。",
        dos: [
          "年長者や重要な人物が部屋に入ったら立ち上がる",
          "過度な辞退なしにおもてなしを受け入れる——もてなされることは名誉",
          "物と食べ物の交換には必ず右手を使う",
          "礼拝の時間を尊重する——ビジネスや会議はそれに合わせて停止する",
          "ラマダン中に訪問する前にイスラムの伝統と慣習について学ぶ"
        ],
        donts: [
          "公衆の場でイスラム、政府、または支配家族のメンバーを批判しない",
          "異性の見知らぬ人との身体的接触を避ける",
          "ラマダンの昼間の時間帯に公共の場でアルコールを飲んだり、食事や飲み物を摂らない",
          "公衆の場での愛情表現を避ける——公共の場では違法",
          "人や聖地を一本の指で指差さない——手のひらを使う"
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
