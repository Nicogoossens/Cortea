# Worker Specificatie: Etiquette Content Engine (ECE)

## 1. Doel van de Worker
De ECE-worker is verantwoordelijk voor het transformeren van ongestructureerde data (boeken, artikelen, PDF's) naar gestructureerde, gegamificeerde content voor de Etiquette App. De worker fungeert als de 'vertaler' tussen etiquette-theorie en interactieve gebruikersscenario's.

## 2. Invoer- & Analyseparameters (Scoringsmatrix)
Elk stukje informatie moet door de worker worden geëvalueerd op de volgende assen voordat het in de database wordt opgenomen:

| Parameter | Bereik | Definitie |
| :--- | :--- | :--- |
| **Locatie-relevantie** | Land/Regio | Specificeer waar de regel geldt (bijv. UK vs. Monaco). |
| **Sociale Klasse** | Lower / Middle / Upper | Voor welke kringen is dit advies bedoeld? |
| **Demografie** | Man / Vrouw / X | Is de regel genderspecifiek? |
| **Situatie** | Dining / Meeting / Greeting | In welke context vindt de interactie plaats? |
| **Complexiteit** | Basis / Gevorderd | Is dit voor een toerist of een diplomaat? |

## 3. Workflow Fasen

### Stap 1: Analyse & Inventarisatie
* **Input:** Ruwe tekst uit etiquette-bronnen.
* **Actie:** Extraheer kernregels en etiquette-normen.
* **Output:** Een lijst met "Etiquette Atomen" (kleinste eenheden van informatie).

### Stap 2: Scenario Design (De Spelvorm)
De worker moet elk "Etiquette Atoom" omzetten in een scenario:
* **Context:** Een korte omschrijving van de situatie (bijv. "Je zit aan tafel in een sterrenrestaurant in Londen").
* **De Uitdaging:** Een vraag over gedrag, taal of kleding.
* **Opties:** 4 keuzemogelijkheden (A, B, C, D).
* **Feedback:** Waarom is het juiste antwoord correct en de foute antwoorden beledigend of ongepast?

### Stap 3: Data Structurering (JSON Formaat)
De worker genereert een JSON-object dat door de App-frontend gelezen kan worden:
```json
{
  "id": "scenario_uk_dining_001",
  "metadata": {
    "country": "United Kingdom",
    "category": "Dining",
    "level": "Upperclass",
    "gender": "Universal"
  },
  "content": {
    "situation": "De soep wordt geserveerd in een diep bord.",
    "question": "In welke richting beweeg je de lepel?",
    "options": [
      {"text": "Naar je toe", "correct": false},
      {"text": "Van je af", "correct": true, "explanation": "In de Britse hogere klassen beweegt men de lepel van zich af om morsen op kleding te voorkomen."}
    ]
  }
}