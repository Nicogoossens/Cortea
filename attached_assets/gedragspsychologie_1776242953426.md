Hier is een uitgewerkt kader dat gedragspsychologie — met People Skills van Robert Bolton als kern — integreert in de Context & Courtesy architectuur. ( zie afbeelding) 

Gedragspsychologisch kader voor Context & Courtesy
Fundament: People Skills van Robert Bolton
Bolton onderscheidt drie clusters die direct vertaalbaar zijn naar etiquettegedrag:
Cluster 1 — Luistervaardigheid. Bolton stelt dat de meeste communicatieproblemen niet ontstaan door wat mensen zeggen, maar door hoe ze luisteren. Voor de app betekent dit: elke oefening in The Gym begint met een luisterfase. De AI-mentor scoort niet alleen op wat de gebruiker zegt, maar hoe hij reageert op de ander. Technieken: reflectief luisteren, parafraseren, stiltes bewust laten vallen.
Cluster 2 — Assertiviteitstechnieken. Bolton onderscheidt vier destructieve communicatiestijlen (agressief, passief-agressief, passief, manipulatief) tegenover één constructieve: assertief. Dit wordt de ruggengraat van de Noble Score — de app observeert in welke stijl de gebruiker communiceert en stuurt stilzwijgend bij via scenario's.
Cluster 3 — Conflicthantering. Bolton's de-escalatiemodel (erkennen → verkennen → oplossen) sluit direct aan op First Aid: wanneer een gebruiker een sociaal hachelijke situatie invoert, doorloopt de AI precies deze drie stappen in de 30-seconden-hulp.

Aanvullende gedragsmodellen
Drie modellen versterken het Bolton-fundament en zijn elk aan een app-module gekoppeld:
Mehrabian's communicatieregel (55/38/7) — houding, stemtoon en woorden wegen zwaar verschilt per cultuur. Dit voedt Cultural Compass: in Japan weegt nonverbaal zwaarder, in Canada telt directe verbale inhoud meer. De app geeft locatiebewust advies over toon én houding, niet alleen over woorden.
Goleman's EQ-model — zelfbewustzijn, zelfregulatie, motivatie, empathie en sociale vaardigheid. Dit wordt de basis van het gebruikersprofiel. In plaats van een onboarding-quiz observeert de app welke EQ-dimensies de gebruiker al bezit en vult gaten aan via gerichte scenario's.
Goffman's gezichtstheorie (face-saving) — mensen managen constant hun publieke imago. Dit is de brug naar de China-module: Mianzi is niet cultureel exotisch, maar een specifieke uiting van universeel gezichtsbehoud. De AI-mentor kan dit nu als principe uitleggen, niet alleen als culturele regel.

Integratie in het datamodel
Twee concrete uitbreidingen op het bestaande schema:
// Uitbreiding op users-tabel
behavior_profile: {
  listening_score: number,       // Bolton cluster 1
  assertiveness_style: 'assertive' | 'passive' | 'aggressive' | 'passive_aggressive',
  conflict_mode: 'avoid' | 'compete' | 'collaborate',  // Bolton cluster 3
  eq_dimensions: {               // Goleman
    self_awareness: number,
    self_regulation: number,
    empathy: number,
    social_skill: number
  },
  nonverbal_awareness: number    // Mehrabian
}

// Uitbreiding op scenarios-tabel
behavioral_tags: string[],       // bijv. ['listening', 'face_saving', 'assertiveness']
bolton_cluster: 1 | 2 | 3,
correction_style: string         // bijv. "Een waardige gesprekspartner luistert eerst volledig..."

AI-mentor gedragsprotocol
De mentor spreekt nooit in directe gedragspsychologische termen ("uw assertiviteit is laag"). In plaats daarvan vertaalt hij Bolton's inzichten naar etiquette-taal:
GedragsobservatieAI-mentor reactie (etiquette-register)Gebruiker onderbreekt in scenario"Een gentleman van formaat laat de gedachte van de ander volledig landen voor hij reageert."Gebruiker capituleert te snel"Uw positie verdient verdediging — hoffelijk doch standvastig, dat is de kunst."Gebruiker escaleert conflict"In dit gezelschap zou men kiezen voor erkenning voor verheldering."
Dit protocol zorgt dat de gedragspsychologie onzichtbaar werkt — de gebruiker leert Boltons principes zonder ze te benoemen.