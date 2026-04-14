1. De Verfijnde Scoringsmatrix (Logic Layer)
We gebruiken een Etiquette Impact Score (EIS) van 1 tot 10.

1-3 (Basis/Toerist): Voorkomen van grove beledigingen. Focus op "Survival".

4-7 (Sociale Integratie): Vloeiend meebewegen in sociale kringen, correcte kledingkeuze, begrijpen van humor/subtiliteit.

8-10 (Elite/Protocol): Foutloze executie van complexe rituelen (bijv. High Society events, diplomatieke ontmoetingen).

2. Regio-Specifieke Klassennamen & Profielen
De worker moet de data labelen volgens deze sociale archetypen per regio:

A. United Kingdom (UK)
In het Verenigd Koninkrijk draait alles om nuance en understatement.

Klasse 1: The Visitor (General) – Algemene beleefdheid, "please & thank you".

Klasse 2: The Professional (Working Class / City) – Zakelijke etiquette, stiptheid, "Pub culture".

Klasse 3: The Gentry (Upper Class) – "Old Money" regels, complexe dresscodes (Black Tie/Morning Dress), specifieke aanspreekvormen.

B. China (PRC)
Hier draait de scoring om "Mianzi" (Gezichtsverlies) en "Guanxi" (Relaties).

Klasse 1: The Respectful Guest – Basisregels rondom stokjes en begroetingen.

Klasse 2: The Business Associate – De kunst van het toasten (Ganbei), hiërarchie aan tafel, visitekaartjes-protocol.

Klasse 3: The Mandarijn (Elite/Government) – Diepe kennis van Confuciaanse hiërarchie, subtiele taalnuances, ceremoniële voedinggewoonten.

C. Australië (AU)
Australië is de "Egalitarian" testcase: te formeel zijn is hier vaak een fout.

Klasse 1: The Mate (Casual) – Informele begroetingen, "No worries" mentaliteit.

Klasse 2: The Professional (Metro) – Balans tussen professionaliteit en de Australische "laid-back" attitude.

Klasse 3: The Establishment (Legacy) – De etiquette van de oudere clubs in Sydney/Melbourne (vergelijkbaar met UK, maar met een lokale twist).

3. JSON Structuur Update voor de Replit Worker
Kopieer dit deel naar je ETIQUETTE_WORKER_SPEC.md onder het kopje "Data Schema":

{
  "user_profile_logic": {
    "target_groups": ["Kind", "Man", "Vrouw", "X"],
    "age_brackets": ["5-12 (Junior)", "13-18 (Teen)", "19-65 (Adult)", "65+ (Senior)"],
    "scoring_system": {
      "eis_level": "1-10",
      "region_labels": {
        "UK": ["Visitor", "Professional", "Gentry"],
        "China": ["Guest", "Business", "Mandarin"],
        "Australia": ["Mate", "Metro", "Establishment"]
      }
    }
  },
  "content_node": {
    "situation_id": "AU_CAS_005",
    "min_age": 18,
    "gender_specific": null, 
    "impact_weight": 8, 
    "scenario": {
      "context": "Je bent uitgenodigd voor een 'Barbie' (BBQ) bij een Australische zakenpartner thuis.",
      "task": "Wat neem je mee als man van 35 jaar?",
      "options": [
        {"text": "Een dure fles Franse wijn", "score_impact": -2, "feedback": "Te formeel, dit kan de gastheer ongemakkelijk maken."},
        {"text": "Een 'six-pack' lokaal bier", "score_impact": +5, "feedback": "Perfect. De 'Bring Your Own' cultuur is de standaard."},
        {"text": "Niets, de uitnodiging is inclusief alles", "score_impact": -5, "feedback": "Onbeleefd; verschijn nooit met lege handen bij een 'Mate'."}
      ]
    }
  }
}

4. De Worker "Kwaliteits-Check"
Voeg deze instructie toe aan de worker in Replit:

Constraint: "Indien de brontekst spreekt over een kind (bijv. tafelmanieren voor 8-jarigen), moet de worker de 'Tone of Voice' van het scenario aanpassen naar 'Junior' niveau (eenvoudig taalgebruik, focus op basisbeleefdheid), terwijl bij 'Upperclass UK' de taal formeel en archaïsch mag zijn."