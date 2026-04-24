We gaan de vijf pijlers van "The Atelier" nu laden met de brute details die je vraagt. Dit is de blauwdruk voor je database-architectuur, inclusief de verbindingen tussen sociale klassen en de adel.

PILLAR 1: THE WORLD WITHIN (Kennis, Kunst & Cultuur)
De "software" van de geest. Zonder deze kennis is etiquette slechts een masker.

Kunst & Esthetiek:

Lvl 1-2: Basis herkenning van stromingen (Renaissance, Modernisme).

Lvl 4-5: De etiquette van de veiling (Sotheby’s/Christie’s), het bezoeken van een privécollectie, praten over kunst zonder pretentie maar met autoriteit.

Het Cadeau-Protocol:

Gelegenheid: Geboorte, overlijden, promotie, huwelijk, officieel staatsbezoek.

Type: Wanneer geef je bloemen (en welke kleuren zijn verboden?), wanneer antiek, wanneer "ervaringen"?

Waarde-balans: Nooit een te duur cadeau geven aan een superieur (beledigend/omkoping).

Historisch Besef: Lokale helden, nationale trauma's en koninklijke stambomen van het land van verblijf.

PILLAR 2: THE PRESENCE (Klederdracht & Lichaam)
De visuele identiteit volgens verfijning.

De Hiërarchie van Stoffen:

Lvl 1-2: Katoen, polyester blends, standaard jeans.

Lvl 4-5: Vicuña wol, handgerolde zijde, het verschil tussen een "off-the-rack" en een "bespoke" Savile Row pak.

Dresscode per Klasse:

Bedrijfssfeer: Van "Tech-bro casual" (Silicon Valley) tot de "Power Suit" (Wall Street).

Adel & Ceremonie: Het dragen van decoraties (lintjes/ordes), de "Morning Dress" voor Ascot of huwelijken, de etiquette van de Tiara (alleen voor getrouwde vrouwen, na 18:00u).

Verzorging (Grooming): Parfum-etiquette (de "scent bubble"), haardracht volgens protocol, de staat van de nagels en schoenen (Oxford vs. Derby).

PILLAR 3: THE VOICE (Sociale Dynamiek & Relaties)
Dit is de meest complexe module: hoe mensen zich tot elkaar verhouden.

Gender & Interactie:

Man/Man: De balans tussen autoriteit en kameraadschap. De handdruk, de schouderklop (wanneer wel/niet).

Vrouw/Man: Galanterie vs. modern professionalisme. Wie opent de deur? Wie stelt voor om de rekening te betalen? (Verschilt per land: VS vs. Saudi-Arabië).

Liefde & Romantiek: Verlovingsetiquette, gedrag tijdens een eerste date in verschillende sociale klassen.

Leeftijds-hiërarchie:

Kinderen: Hoe leer je een kind zich te gedragen bij adel of in een sterrenrestaurant?

Ouderen: De ereplaats, de toon van de stem, fysieke ondersteuning zonder betutteling.

De Adel & Hogere Kringen:

Aanspreektitels (Your Grace, Your Highness, etc.).

Precedence (Voorrang): Wie loopt als eerste de kamer binnen? Wie zit aan de rechterhand van de gastheer?

PILLAR 4: THE TABLE (Culinaire Diepgang)
Eten is een sociaal mijnenveld.

Drankenkennis:

De Cellar (Wijn): Regio's, jaargangen, decanteer-etiquette, hoe proef je zonder de sommelier te irriteren?

Spirits: De etiquette van de Sigaren-lounge, Whisky-vaten, de Japanse Sake-ceremonie.

Non-alcoholisch: Thee-ceremonies (China/Japan/Engeland), water-etiquette.

De Wereldkeuken:

Hoe eet je gerechten die "moeilijk" zijn? (Kreeft, oesters, artisjokken, asperges).

Het gebruik van eetstokjes vs. zilveren bestek (de 12-delige set).

PILLAR 5: THE CELLAR (Gastheerschap & Ontvangst)
Jouw huis als jouw koninkrijk.

De Ontvangst (Hosting):

Het uitnodigingsproces (RSVP-etiquette).

Culturele Adaptatie: Hoe ontvang je een Japanse gast in een Brussels herenhuis? (Slippers klaarleggen, cadeau-etiquette, zitvolgorde).

De personeels-etiquette: Hoe communiceer je met personeel (eigen of ingehuurd) tijdens een diner?

Atmosfeer: Verlichting, muziekkeuze volgens de "Social Sphere", bloemstukken die gesprekken niet blokkeren.

# Database: The Atelier - Master Content Matrix

## Module: Social_Dynamics (Pillar 3)
- **ID:** `SOC_DYN_001`
- **Context_Pair:** `Man_to_Woman`
- **Sub_Context:** `Nobility_Protocol`
- **Refinement_Levels:**
  - `Lvl 1:` Basic polite greeting.
  - `Lvl 5:` The "Social Bow" (not a full bow, but a neck incline), rules for the "Hand-kiss" (never actually touch the skin in certain cultures).

## Module: Culinary_Deep_Dive (Pillar 4)
- **ID:** `CUL_DEEP_002`
- **Subject:** `Wine_&_Sommelier_Interaction`
- **Specifics:** - `The_Taste_Test:` Do not smell the cork, check for cork taint in the liquid.
  - `The_Pour:` Hierarchy of filling glasses (Guest of honor first, Host last).

## Module: Grand_Hosting (Pillar 5)
- **ID:** `HOST_003`
- **Subject:** `Cross_Cultural_Reception`
- **Scenario:** `Western_Host_MiddleEastern_Guest`
- **Rules:**
  - `Dietary:` Halal requirements, no alcohol visibility.
  - `Behavior:` Using the right hand for everything, showing soles of shoes is a Level 5 failure (-5000 AC).

## Module: The_Cellar_Connoisseur (Pillar 5)
- **ID:** `CEL_004`
- **Subject:** `Gift_Giving_Art`
- **Category:** `Antique_&_Collectibles`
- **Rule:** Never give a clock in China (symbolizes death). Give high-quality fruit or pens to high-ranking officials.

Het Punten- en Beloningssysteem (Gekoppeld aan 500.000+ gebruikers)
Met deze details wordt de "Atelier Credit" (AC) echt goud waard.

The Master Data Points: Elk van de bovenstaande regels krijgt een unieke Rule_ID.

The Knowledge Graph: De app ziet dat je "Lvl 5" bent in The Table (Franse Wijn), maar pas "Lvl 1" in The Voice (Adel). Hij zal je dan subtiel pushen: "Je weet welke wijn je moet bestellen, maar weet je ook hoe je de Gravin aan je linkerzijde aanspreekt?"

Hier is de integrale samenvatting van onze blauwdruk, samengevat tot de essentie:1. De Kernfilosofie: "The Atelier"De app is geen statisch regelboek, maar een dynamische Refinement Engine. De gebruiker "upgraded" zichzelf spelenderwijs door 5 fundamentele pijlers:The World Within: Kennis, kunst, geschiedenis en de psychologie van etiquette.The Presence: Lichaamstaal, houding en de hiërarchie van kleding (stoffen, status).The Voice: Taalgebruik, register, diplomatie en gender-specifieke interacties.The Table: Culinaire diepgang, drankenkennis (The Cellar) en tafelmanieren.The Cellar (Connoisseurship): Gastheerschap, zeldzame kennis en de kunst van het geven.2. Het Gebruikersprofiel (De Filters)Voordat de data wordt getoond, filtert de app op drie assen:Demografie: Leeftijd (Kind t/m Senior) en Gender (M/V/X).Sociale Sfeer: Van Blue Collar & Site tot Boardroom en Nobility.Locatie: Land-specifieke database (bijv. China, Monaco, Saudi-Arabië).3. De Economie: Refinement Rating Matrix (RRM)Om 500.000+ gebruikers te boeien, gebruiken we Atelier Credits (AC) op een exponentiële schaal:Niveaus: 1 (Essential) tot 5 (Sovereign/Master).Punten: Variërend van 100 AC (basis) tot 50.000 AC (mastery).Complexity Multiplier: Punten worden vermenigvuldigd bij een "Context-clash". (Bijvoorbeeld: Een westerse tiener die zich correct gedraagt bij een oosterse patriarch krijgt een enorme bonus).4. De Interactieve Functies (Real-time coaching)Location-Awareness: De app herkent waar je bent en schakelt de juiste sfeer en land-module in.Audio-Nudges: Subtiele bijsturing via AI (hoort stemvolume, onderbrekingen of verkeerde aanspreektitels).Scenario Generator: Interactieve tests waar alle 11 de onderwerpen samenkomen in een gesimuleerde situatie (bijv. "Een jacht in Monaco").Master Data-Structuur (De "Moeder" tabel)Om je database-architect te helpen, kun je deze tabel gebruiken als de overkoepelende logica voor de 11 bestanden:Bestand/ModuleFocusHoofdvariabele01-05 Atelier PillarsContent-diepgangCategory_ID + Refinement_Level06 Language ExpansionWoordkeuze & RegisterTone_Score (1-10)07 Behavior/BodyFysieke actieProximity_Zone (cm)08 Dress CodeVisuele statusFabric_Quality + Occasion09 Dining/GastronomyTafel-etiquetteUtensil_Logic + Drink_Knowledge10 Social SpheresMilieu-aanpassingSocial_Class_Modifier11 Rating/ScalingGamification & PuntenAtelier_Credits (AC)Strategisch Advies voor Replit:In plaats van 11 losse bestanden te voeden, kun je het beste starten met één main_logic.json (of .md) waarin de relaties tussen deze bestanden staan.De logica moet zijn:Identify: Wie is de gebruiker? (Bestand: Profiel)Locate: Waar is de gebruiker? (Bestand: Landen/Locatie)Detect Sphere: In welke sfeer bevinden ze zich? (Bestand: Social Spheres)Serve Content: Haal de juiste data uit de 5 Pijlers.Score: Ken punten toe op basis van het niveau. (Bestand: Rating System)


Het Master Stroomschema: Van Profiel naar Punten
STAP 1: De Profiel-Initialisatie (Input)
Voordat de app ook maar één tip geeft, worden deze drie basiswaarden vastgesteld:

User_ID: Gekoppeld aan Leeftijd, Gender en Beginniveau.

Interest_Tags: Geselecteerde voorkeuren uit de uitgebreide lijst (bijv. Nobility, Japanese Cuisine, Bespoke Tailoring).

Refinement_Base: De huidige stand van de Atelier Credits (AC).

STAP 2: De Context-Scanner (Sensing)
De app gebruikt de sensoren van de smartphone om de omgeving te bepalen:

GPS: Identificeert de Country_ID (bijv. China, Monaco).

Ambient Audio: Herkent de Social_Sphere (bijv. is het een luidruchtige bistro of een stille boardroom?).

User Selection: De gebruiker kan ook handmatig een "Atelier Scenario" starten.

STAP 3: De Database Mapping (Filtering)
Hier komen de 11 MD-bestanden samen. De AI voert deze query uit:

"Geef mij de etiquette-regels voor een [Man] van [40 jaar] in [Monaco] binnen de sfeer [Elite Society] met focus op [The Table]."

De app filtert nu de data uit de 5 Pijlers:

Pillar 1 (The World Within): Welke kunst/geschiedenis is hier relevant?

Pillar 2 (The Presence): Is de kledingkeuze correct voor dit niveau?

Pillar 3 (The Voice): Welke aanspreektitels zijn vereist?

Pillar 4 (The Table): Welke specifieke tafelmanieren gelden hier?

Pillar 5 (The Cellar): Welke drankenkennis of gastheer-regels zijn van toepassing?

STAP 4: De Real-time Interactie (Coaching)
De app monitort de gebruiker tijdens het event:

Nudge-Logica: Als de audio-analyse een fout detecteert (bijv. te luid praten tegen een Britse Lord), volgt een subtiele melding.

Success-Tracking: De app houdt bij hoe lang de gebruiker de "Refinement-norm" vasthoudt.

STAP 5: De Settlement (Scoring & Upgrade)
Aan het einde van de sessie volgt de berekening:

Base_Points: Per correcte handeling.

Multipliers: Toepassing van de Complexity Multiplier (Land-verschil + Sfeer-verschil).

Upgrade-Check: Heeft de gebruiker genoeg AC voor de volgende Tier (bijv. van Observer naar Practitioner)?

Paywall-Trigger: Indien een gebruiker een "Master-level" (Lvl 5) actie wil ontsluiten, volgt de uitnodiging voor het betaalmodel.

Samenvattende Checklist voor Replit-Implementatie:
Logic.json: Bevat de formules voor de puntentelling en multipliers.

Pillars_Combined.db: Een gecombineerde database waar elke regel getagd is met: Country, Sphere, Gender, Age, Refinement_Level.

User_State.db: Houdt de actuele voortgang, streaks en verzamelde AC bij van de 500.000 gebruikers.

