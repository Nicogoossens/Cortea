/**
 * Atelier practice scenarios for the 17 priority Compass countries.
 * 8 scenarios per country, spread across all 5 pillars:
 *   1 = Cultural Knowledge, 2 = Appearance, 3 = Eloquence,
 *   4 = Table Manners, 5 = Drinks
 *
 * Countries: JP, DE, FR, IT, BE, CH, SG, IN, MX, BR, ES, CO, AE, US, NL, PT, ZA
 */
import type { scenariosTable } from "./schema/scenarios.js";

export const priorityCountryScenarios: (typeof scenariosTable.$inferInsert)[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // JAPAN (JP)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "The Meishi Exchange",
    pillar: 3, region_code: "JP", age_group: "25-45", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "You are meeting a Japanese executive for the first time in Tokyo. He presents his business card (meishi) with both hands and a slight bow.",
      question: "How should you receive the card and respond?",
      options: [
        { text: "Take the card quickly with one hand and place it in your jacket pocket.", correct: false, explanation: "Receiving a meishi with one hand and pocketing it immediately is a significant social error. The meishi is treated as an extension of the person." },
        { text: "Accept it with both hands and a slight bow, read it carefully, then place it respectfully on the table in front of you.", correct: true, explanation: "Precisely. The meishi ritual requires both hands, a bow of acknowledgement, a moment of genuine attention to the card, and careful placement on the table — never written on, folded, or pocketed during the meeting." },
        { text: "Accept it, immediately offer your own card, then set both aside.", correct: false, explanation: "Offering your card before properly honouring theirs skips the most important step — the respectful reading of the card received." },
        { text: "Accept it with both hands and a bow, then write a note on it so you remember the person.", correct: false, explanation: "Writing on a meishi during or after a meeting is a grave insult. The card should be treated with the same respect as the person themselves." },
      ]
    }
  },
  {
    title: "Shoes at the Entrance",
    pillar: 1, region_code: "JP", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are invited to a Japanese colleague's home for dinner. As you enter, you notice a row of slippers near the door and a step up into the main living area.",
      question: "What is the correct behaviour at this threshold?",
      options: [
        { text: "Step inside and remove your shoes once you find a convenient spot to sit.", correct: false, explanation: "Shoes must be removed at the genkan (entrance threshold) before stepping into the raised interior. Wearing shoes inside is a serious breach of Japanese domestic protocol." },
        { text: "Remove your shoes at the genkan, step up, and put on the slippers provided.", correct: true, explanation: "Correct. The genkan is the ritual boundary between outside and inside. Shoes come off here; slippers are then worn inside — except on tatami mat areas, where socks only are appropriate." },
        { text: "Ask your host whether shoes should be removed — it may not always be required.", correct: false, explanation: "In a Japanese home, removing shoes at the entrance is universal and non-negotiable. Asking creates unnecessary awkwardness for your host." },
        { text: "Remove your shoes but remain in the genkan until invited further inside.", correct: false, explanation: "Once shoes are removed and slippers put on, stepping inside is expected. Lingering in the genkan would confuse your host." },
      ]
    }
  },
  {
    title: "The Bow of Greeting",
    pillar: 3, region_code: "JP", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You meet a senior Japanese executive for the first time. He bows to greet you.",
      question: "What is the most appropriate response?",
      options: [
        { text: "Extend your hand for a handshake — you are a foreigner and bowing may seem awkward.", correct: false, explanation: "Extending a hand when someone bows creates an uncomfortable clash. Return the bow; if they then extend their hand, shake it warmly. Follow their lead." },
        { text: "Return the bow at a slightly lower angle than theirs, acknowledging their seniority.", correct: true, explanation: "A deeper bow signals greater respect. Returning a bow that is slightly lower than theirs — acknowledging the difference in seniority — is socially precise and deeply appreciated." },
        { text: "Bow deeply and hold it — the deeper the bow, the more respect you show.", correct: false, explanation: "An exaggerated or prolonged bow can seem performative rather than sincere. Match the depth appropriately to the relationship and context." },
        { text: "Nod your head briefly — that is the Western equivalent of a bow.", correct: false, explanation: "A nod lacks the respect communicated by a proper bow. When in Japan, returning a bow with a genuine bow is expected and appreciated." },
      ]
    }
  },
  {
    title: "Chopsticks and the Rice Bowl",
    pillar: 4, region_code: "JP", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are at a formal Japanese dinner. You have finished the food on your chopsticks and wish to rest them for a moment.",
      question: "Where should you place your chopsticks?",
      options: [
        { text: "Stand them upright in your rice bowl while you take a sip of water.", correct: false, explanation: "Placing chopsticks upright in a rice bowl directly mimics the ritual of offerings made at funerals. It is one of the gravest dining taboos in Japanese culture." },
        { text: "Rest them horizontally on the chopstick holder (hashioki) provided.", correct: true, explanation: "Precisely. The hashioki is provided specifically for this purpose. In its absence, rest chopsticks horizontally across the bowl's rim or on a folded napkin. Never cross or stand them." },
        { text: "Pass them to another guest who needs them — sharing is polite.", correct: false, explanation: "Passing food directly from chopstick to chopstick is a funeral rite and deeply taboo at any dining table. Use serving chopsticks or a spoon instead." },
        { text: "Leave them on the table beside your bowl — the tablecloth is fine.", correct: false, explanation: "Resting used chopsticks directly on the tablecloth is inelegant. The hashioki is the correct resting place; use it." },
      ]
    }
  },
  {
    title: "The Sake Pour",
    pillar: 5, region_code: "JP", age_group: "25-55", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "At a Japanese business dinner, sake is being served. The host pours for everyone but leaves your cup empty.",
      question: "What is the correct response?",
      options: [
        { text: "Reach for the sake carafe and pour your own cup.", correct: false, explanation: "Pouring sake for yourself is considered self-serving and poor form in Japanese culture. One pours for others, never for oneself." },
        { text: "Hold your cup forward with both hands to receive, then pour for the host in return.", correct: true, explanation: "Correct. In Japanese dining, one pours for companions rather than for oneself. Hold your cup elevated with both hands to receive, then immediately reciprocate by pouring for your host — a sign of attentiveness and respect." },
        { text: "Wait patiently and say nothing — the host will notice when ready.", correct: false, explanation: "While patient waiting is valued, it is also appropriate to subtly hold your cup forward, which signals readiness without demanding attention." },
        { text: "Ask a colleague to pour for you — they are closer to the carafe.", correct: false, explanation: "The ritual of mutual pouring is between those present at the table. Directing a third party misses the point of the custom entirely." },
      ]
    }
  },
  {
    title: "The Indirect No",
    pillar: 3, region_code: "JP", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 3, estimated_minutes: 3, noble_score_impact: 8,
    content_json: {
      situation: "During a Tokyo business meeting, you make a proposal. Your Japanese counterpart responds: 'That is very interesting. It would be quite difficult to implement at this stage. We will certainly consider it carefully.'",
      question: "How should you interpret this response?",
      options: [
        { text: "They are interested but need time — follow up in a few days.", correct: false, explanation: "This reading misses a culturally critical signal. The Japanese rarely refuse directly; indirect language like 'quite difficult' is a polite but firm declination." },
        { text: "This is a polite refusal — they are declining without using the word 'no'.", correct: true, explanation: "Precisely. In Japanese professional culture, 'very difficult', 'we will consider it carefully', and similar phrases are indirect refusals intended to preserve mutual face. Recognising this prevents misunderstanding and wasted effort." },
        { text: "They have concerns — press them for specifics to find a solution.", correct: false, explanation: "Pressing for specifics after an indirect refusal would cause considerable discomfort. It forces the other party into directness they are deliberately avoiding." },
        { text: "This is a strong yes — Japanese are simply formal in their language.", correct: false, explanation: "This is a fundamental misreading. Formality and indirectness are separate things. The language here signals reluctance, not enthusiasm." },
      ]
    }
  },
  {
    title: "Kanpai — The Formal Toast",
    pillar: 5, region_code: "JP", age_group: "25-55", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are at a welcome dinner in Osaka. Glasses have been poured and the host raises his glass for a toast, calling 'Kanpai!'",
      question: "What is the correct way to participate?",
      options: [
        { text: "Raise your glass and drink immediately when he says 'Kanpai!'", correct: false, explanation: "In the Kanpai ritual, you raise your glass, clink with others at a lower level than the most senior person's glass, and then drink. Drinking before clinking misses the social ritual entirely." },
        { text: "Raise your glass, hold it slightly lower than the host's, make eye contact, say 'Kanpai', clink, then drink.", correct: true, explanation: "Precisely. The level at which you hold your glass relative to others communicates deference. Holding yours lower than the senior guest's is a mark of respect. Eye contact during the clink is important." },
        { text: "Raise your glass above your head — a higher position shows greater respect.", correct: false, explanation: "Raising your glass higher than the most senior person's is perceived as presumptuous. Hold yours at a lower position to show appropriate deference." },
        { text: "Sip before the host to show enthusiasm — Kanpai is informal.", correct: false, explanation: "Kanpai is not informal. It is a social ritual with a clear sequence. The host initiates; all others follow." },
      ]
    }
  },
  {
    title: "Silence at the Table",
    pillar: 3, region_code: "JP", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 6,
    content_json: {
      situation: "During a formal Japanese dinner, a long silence falls over the table. No one speaks for a full minute.",
      question: "How should you respond to this silence?",
      options: [
        { text: "Break the silence with a comment or question — silence is uncomfortable and should be resolved.", correct: false, explanation: "In Japanese social settings, silence is not discomfort — it is companionable. Rushing to fill it signals anxiety and can come across as intrusive." },
        { text: "Remain at ease and allow the silence to continue naturally.", correct: true, explanation: "Correct. Japanese culture is highly comfortable with silence in social settings. A quiet moment signifies reflection and contentment, not awkwardness. Sitting peacefully in that silence is itself a mark of social refinement." },
        { text: "Ask the host a question about the food to show interest.", correct: false, explanation: "While sincere appreciation of food is always welcome, filling silence with forced conversation is unnecessary. The moment will pass naturally." },
        { text: "Check your phone briefly — a discreet pause while others reflect.", correct: false, explanation: "Checking a phone during any Japanese dining occasion — however discreetly — is considered rude and signals detachment from the group." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GERMANY (DE)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Punctuality in Hamburg",
    pillar: 1, region_code: "DE", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are invited to a business meeting in Hamburg scheduled for 9:00 a.m. Traffic was light and you arrive at 8:58.",
      question: "How does your German host interpret your arrival time?",
      options: [
        { text: "As early — Germans prefer guests to arrive a few minutes after the stated time.", correct: false, explanation: "In Germany, arriving slightly early is perfectly acceptable. The expectation is to be on time or a minute or two early, never late." },
        { text: "As precisely on time — appropriate and professional.", correct: true, explanation: "Exactly. German professional culture treats punctuality with the utmost seriousness. Arriving at or just before the stated time signals respect for the other person's schedule and your own organisational ability." },
        { text: "As slightly rushed — Germans prefer guests to be at least 5 minutes early.", correct: false, explanation: "While early is fine, the expectation is simply to be on time. No additional earliness is required." },
        { text: "As late — meetings in Germany are typically scheduled to begin 10 minutes after the stated time.", correct: false, explanation: "There is no such buffer in German professional life. When a meeting is scheduled for 9:00, it begins at 9:00." },
      ]
    }
  },
  {
    title: "Sie or Du?",
    pillar: 3, region_code: "DE", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are introduced to Dr. Müller, a senior German partner. You wish to address her in conversation.",
      question: "How should you address Dr. Müller in a first professional meeting?",
      options: [
        { text: "Call her 'Anke' — using first names in business is universally acceptable today.", correct: false, explanation: "In German business culture, using a first name before being invited to do so is a presumption. The formal Sie (you) and title + surname remain the default." },
        { text: "Address her as 'Frau Dr. Müller' using the formal Sie until she offers the Du form.", correct: true, explanation: "Precisely. In Germany, both the title and formal Sie must be maintained until the senior person explicitly invites the Du form — often with the phrase 'Wir können uns duzen.' Skipping this step is considered overly familiar." },
        { text: "Address her as 'Dr. Müller' but switch immediately to Du — you are equals in the meeting.", correct: false, explanation: "Professional equality does not override the seniority convention. The more senior party initiates any move to informal address." },
        { text: "Use 'Sie' but avoid the title — titles feel old-fashioned in modern Germany.", correct: false, explanation: "Academic and professional titles (Dr., Prof.) are very much alive in German business culture and should be used until told otherwise." },
      ]
    }
  },
  {
    title: "Directness at the Table",
    pillar: 3, region_code: "DE", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "During a Munich business lunch, your German counterpart says bluntly: 'I think your proposal has two serious problems — the timeline is unrealistic and the budget is underestimated.' He does not soften the criticism.",
      question: "How should you interpret and respond to this feedback?",
      options: [
        { text: "Take offence — this level of directness is disrespectful in a professional setting.", correct: false, explanation: "In German professional culture, directness is a sign of respect, not disrespect. A colleague who tells you the problem clearly is one who takes your work seriously." },
        { text: "Understand this as honest, collegial criticism and engage with the substance of the feedback.", correct: true, explanation: "Correct. Germans value Sachlichkeit — dealing with the facts directly and without embellishment. Responding to the substance of the critique, rather than the manner of its delivery, is the appropriate professional response." },
        { text: "Change the subject graciously — public criticism is inappropriate.", correct: false, explanation: "This is not public criticism but direct professional engagement. Deflecting from honest feedback would be seen as evasive and unprofessional." },
        { text: "Soften the exchange by complimenting other aspects of the project.", correct: false, explanation: "Switching to compliments when criticism has been raised delays the substantive conversation Germans prefer. Engage directly with the issues raised." },
      ]
    }
  },
  {
    title: "The German Table Setting",
    pillar: 4, region_code: "DE", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are at a formal dinner in Berlin. The host raises her glass and says 'Prost!'",
      question: "What is the correct way to participate in the toast?",
      options: [
        { text: "Clink glasses, then drink without making eye contact — eye contact can seem aggressive.", correct: false, explanation: "In Germany, not making eye contact during a toast is considered rude — and, according to a common superstition, seven years of bad luck. Eye contact is essential." },
        { text: "Clink glasses with everyone at the table, maintain direct eye contact with each person as you clink, then drink.", correct: true, explanation: "Precisely. The German toasting ritual requires direct, sincere eye contact with each person whose glass you clink. It signals genuine connection and respect for each individual at the table." },
        { text: "Simply raise your glass and drink — clinking is optional in formal settings.", correct: false, explanation: "In German dining culture, the clink (Anstoßen) is part of the ritual. Skipping it while others participate would be conspicuous." },
        { text: "Wait for the most senior person to have clinked with everyone before you begin.", correct: false, explanation: "The toast is a collective and simultaneous ritual. Waiting to observe a hierarchy before participating misses the spirit of the occasion." },
      ]
    }
  },
  {
    title: "Beer Order Protocol",
    pillar: 5, region_code: "DE", age_group: "18-55", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "At a Munich beer garden with German colleagues, a Mass (one-litre stein) of Helles is set in front of you. The head (foam) is quite thick.",
      question: "What is the correct attitude toward the foamy head on a German draught beer?",
      options: [
        { text: "Ask for a replacement — a large head means the glass is not full.", correct: false, explanation: "In Germany, a proper foamy head (about two to three finger-widths) is considered correct. Requesting a refill on these grounds would puzzle your companions." },
        { text: "Accept it — the foam head is a sign of a properly poured beer and part of the experience.", correct: true, explanation: "Correct. The Schaum (foam) on a German draught beer is a mark of quality pouring. Appreciating it without complaint demonstrates cultural awareness and a genuine approach to the beer garden experience." },
        { text: "Skim the foam off with a spoon before drinking.", correct: false, explanation: "Removing the foam is unnecessary and would likely draw amused looks. Allow it to settle naturally and drink as served." },
        { text: "Leave the foam until it completely disappears — drinking through foam is improper.", correct: false, explanation: "German beer is drunk as served, head and all. There is no protocol requiring you to wait for complete dissipation." },
      ]
    }
  },
  {
    title: "Business Card in Germany",
    pillar: 3, region_code: "DE", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are at a Frankfurt networking event and exchange cards with a German senior executive.",
      question: "Which approach is most appropriate when exchanging business cards in Germany?",
      options: [
        { text: "Present your card face-down for privacy — the recipient can turn it over.", correct: false, explanation: "Cards should be presented face-up so the recipient can immediately read your details. Presentation matters." },
        { text: "Hand your card clearly, face-up, with name and title legible. Read theirs briefly and acknowledge it.", correct: true, explanation: "In Germany, the exchange is clear and professional. Cards are given face-up, read briefly, and treated respectfully. Unlike Japan, there is no elaborate ritual — but attentiveness and tidiness are expected." },
        { text: "Slip it casually across the table — Germans value informality.", correct: false, explanation: "Germans value precision and professionalism, not informality in a business context. A deliberate, clear presentation of your card is appropriate." },
        { text: "Offer the card with both hands and bow slightly.", correct: false, explanation: "This is the Japanese ritual, not the German one. A clear, single-handed offer with a firm handshake is the German norm." },
      ]
    }
  },
  {
    title: "Hosting Dinner in Germany",
    pillar: 4, region_code: "DE", age_group: "30-55", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are the guest at a formal German home dinner. The host brings the food to the table and everyone is seated. Food is on your plate.",
      question: "When is it appropriate to begin eating?",
      options: [
        { text: "Begin immediately — food should not go cold.", correct: false, explanation: "Eating before the host signals or begins is considered impolite in German dining culture. The host's acknowledgement or the phrase 'Guten Appetit' is the cue to start." },
        { text: "Wait until the host says 'Guten Appetit' or begins eating, then start.", correct: true, explanation: "Correct. 'Guten Appetit' is the conventional signal that everyone may begin. Starting before this is perceived as impatient." },
        { text: "Wait until every single guest has been served and all glasses have been filled.", correct: false, explanation: "This level of waiting is appropriate in some cultures but not necessarily German practice — 'Guten Appetit' from the host is the cue, regardless of whether all service details are complete." },
        { text: "Make eye contact with the host and begin when she nods.", correct: false, explanation: "A nod is not the standard cue in German dining. The verbal 'Guten Appetit' is what is expected." },
      ]
    }
  },
  {
    title: "Splitting the Bill — Germany",
    pillar: 4, region_code: "DE", age_group: "18-45", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "After a casual dinner with German colleagues in Berlin, the bill arrives. No one has offered to pay for everyone.",
      question: "What is the most expected approach in this situation?",
      options: [
        { text: "Offer to pay the entire bill as a generous gesture.", correct: false, explanation: "Paying for everyone without prior agreement may create awkwardness. 'Going Dutch' — each paying their share — is common and comfortable in German casual dining." },
        { text: "Each person pays their own portion — 'going Dutch' is widely practised and expected.", correct: true, explanation: "Correct. The German custom of getrennte Zahlung (separate payment) is perfectly normal and does not signal stinginess. Each person pays for what they ordered, and this is explicitly requested at the restaurant." },
        { text: "Wait for the most senior person to pay, then offer to contribute.", correct: false, explanation: "Seniority does not typically determine who pays in German casual dining. Splitting is the default and is not considered impolite." },
        { text: "Insist on paying — declining this offer would be rude.", correct: false, explanation: "Insisting on paying the entire bill when no such arrangement was agreed goes against the grain of German directness and equality at the table." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FRANCE (FR)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "La Bise",
    pillar: 3, region_code: "FR", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are introduced to a French female colleague at a Paris social event. She leans forward slightly to greet you.",
      question: "What is the appropriate greeting response?",
      options: [
        { text: "Extend your hand for a formal handshake.", correct: false, explanation: "A handshake in this social context, when the other person has leaned in for la bise, would be abrupt and somewhat cold. Follow their lead." },
        { text: "Lean forward and offer a light cheek-to-cheek touch (la bise), starting on the right.", correct: true, explanation: "La bise — a light touch of the cheeks, not a lip-to-cheek kiss — is the standard greeting between women and between men and women in French social contexts. The starting side varies by region; Paris typically starts with the right cheek first." },
        { text: "Embrace warmly — French people appreciate physical warmth in greetings.", correct: false, explanation: "La bise is a specific, restrained gesture. A full embrace at an initial introduction would overstep social boundaries." },
        { text: "Nod respectfully — physical contact in greetings is best avoided.", correct: false, explanation: "La bise is the social norm in France for introductions between women and mixed-gender pairs. Refusing the gesture would read as cold or standoffish." },
      ]
    }
  },
  {
    title: "Vous or Tu?",
    pillar: 3, region_code: "FR", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You meet a French client — a senior woman you have not met before — at a professional lunch in Lyon.",
      question: "Which pronoun do you use to address her?",
      options: [
        { text: "'Tu' — you are adults of similar status and informality is modern.", correct: false, explanation: "Using 'tu' with someone you have just met in a professional context is presumptuous in France, regardless of status similarity. 'Vous' is mandatory until the other party suggests otherwise." },
        { text: "'Vous' throughout, unless she explicitly invites you to use 'tu'.", correct: true, explanation: "Correct. 'Vous' is the default form of address for strangers, clients, and professional acquaintances. The shift to 'tu' is initiated by the senior or host party — never by the junior." },
        { text: "Use 'tu' with her team and 'vous' only when speaking to her directly.", correct: false, explanation: "This inconsistency would seem peculiar. Apply 'vous' to everyone you have not been invited to address informally." },
        { text: "Ask her directly: 'Shall we use tu or vous?'", correct: false, explanation: "Raising the pronoun question explicitly puts the burden on the other person and can seem unnecessarily formal or awkward. Default to 'vous' and await their invitation." },
      ]
    }
  },
  {
    title: "The Bread and Butter Question",
    pillar: 4, region_code: "FR", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are at a formal French restaurant. A basket of sliced baguette arrives before the meal. There is no butter on the table.",
      question: "What is the appropriate handling of the bread?",
      options: [
        { text: "Ask the waiter for butter — bread without butter is incomplete.", correct: false, explanation: "In traditional French fine dining, bread is served without butter and this is the norm. Requesting butter at a formal table is unusual and may seem uncultured." },
        { text: "Break off a piece, place it on the tablecloth beside your plate (bread plates are rare in France), and eat it between courses.", correct: true, explanation: "Correct. French etiquette traditionally places bread directly on the tablecloth rather than on a side plate. Break bread rather than cutting it, and use it between courses rather than before the meal begins." },
        { text: "Butter the entire slice and eat it immediately before the starter arrives.", correct: false, explanation: "Eating liberally before the meal begins is considered impolite. Bread is a companion to the meal, not a pre-meal snack." },
        { text: "Leave the bread untouched — eating bread before a formal meal is gauche.", correct: false, explanation: "Bread is part of the meal and is perfectly appropriate to enjoy between courses. Leaving it entirely untouched would be unnecessary abstinence." },
      ]
    }
  },
  {
    title: "The Cheese Course",
    pillar: 4, region_code: "FR", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "At a formal dinner in Bordeaux, after the main course has been cleared, a large cheese board is presented to the table.",
      question: "When does the cheese course appear in a formal French meal, and what is correct protocol?",
      options: [
        { text: "Before the main course — cheese is served as a starter in France.", correct: false, explanation: "Cheese comes after the main course and before dessert in France. Serving it as a starter would be entirely unconventional." },
        { text: "After the main course, before dessert — you take a selection and use your knife to cut, never a fork.", correct: true, explanation: "Precisely. The cheese course (le plateau de fromage) follows the main course. Take a modest selection, cutting cleanly with the cheese knife. Each variety has a different cutting method (point of a wedge stays intact; round cheeses are cut radially)." },
        { text: "After dessert — cheese ends the French meal.", correct: false, explanation: "In France (unlike in the Anglo-Saxon tradition), cheese precedes dessert, not follows it." },
        { text: "Simultaneously with the main course — cheese accompanies the meat.", correct: false, explanation: "Cheese has its own dedicated course in France. Combining it with the main course misreads the French meal structure entirely." },
      ]
    }
  },
  {
    title: "Discussing Money in Paris",
    pillar: 3, region_code: "FR", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are at a dinner party in Paris. A French acquaintance asks what you do for work. You reply that you are a consultant. He asks, 'And is that lucrative?'",
      question: "How should you respond?",
      options: [
        { text: "Give a specific figure — directness about money shows confidence.", correct: false, explanation: "Discussing salary or earnings in social settings is considered vulgar in French culture. Specific figures are not shared at dinner tables." },
        { text: "Deflect warmly — 'It keeps me comfortable' — and redirect to the nature of the work.", correct: true, explanation: "Correct. In French social culture, discussing specific earnings is considered indiscreet. A graceful deflection — 'I can't complain' or 'It's interesting work' — acknowledges the question without violating the cultural norm." },
        { text: "Say you'd rather not discuss it — privacy is respected in France.", correct: false, explanation: "A direct refusal is slightly abrupt. A warm, vague answer is more socially elegant than an explicit refusal." },
        { text: "Ask him the same question in return — reciprocity is fair.", correct: false, explanation: "Returning an indiscreet question with the same question puts both parties in an uncomfortable position. Redirect the conversation to substance." },
      ]
    }
  },
  {
    title: "Wine Selection at a Paris Restaurant",
    pillar: 5, region_code: "FR", age_group: "25-55", gender_applicability: "all",
    context: "dining", difficulty_level: 3, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "You are hosting a French client at a fine Paris restaurant. The sommelier arrives to take your wine order.",
      question: "What is the most appropriate approach to ordering wine?",
      options: [
        { text: "Order the most expensive wine on the list — it signals generosity.", correct: false, explanation: "Ordering the most expensive bottle to impress is considered nouveau riche in French culture. Good taste, not the highest price, is what is admired." },
        { text: "Describe your preferences and the food you are ordering to the sommelier, and invite their recommendation.", correct: true, explanation: "Precisely. In France, the sommelier is a trusted expert. Describing the dishes and your preferences, then deferring to their knowledge, is both polite and wise. It signals confidence and connoisseurship, not ignorance." },
        { text: "Choose a safe, widely-known label like Mouton Cadet — no one can fault a recognisable wine.", correct: false, explanation: "Defaulting to a famous label without consideration for food pairing or interest in the cellar reflects a lack of engagement with the wine list." },
        { text: "Ask your client to choose — he knows French wine better.", correct: false, explanation: "As the host, the wine selection is your responsibility. Delegating it entirely to your guest is an abdication of the hosting role." },
      ]
    }
  },
  {
    title: "Dress at a Paris Restaurant",
    pillar: 2, region_code: "FR", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 6,
    content_json: {
      situation: "You are invited to dinner at a well-regarded brasserie in Paris — not the grandest restaurant in the city, but a respected establishment. The invitation says nothing about dress.",
      question: "How should you approach your attire for the evening?",
      options: [
        { text: "Smart casual — jeans and a clean shirt are fine anywhere in Paris now.", correct: false, explanation: "Jeans at a respected Parisian brasserie would be underdressed. The French ideal of being soigné — well put together — applies even to casual evenings out." },
        { text: "Well-dressed but not formal — a good jacket, polished shoes, and considered details.", correct: true, explanation: "Correct. In Paris, looking soigné — well-assembled and considered — is a social expectation at any restaurant worth visiting. A jacket, neat shoes, and an overall air of deliberate elegance is the standard." },
        { text: "Formal attire — any Parisian restaurant demands it.", correct: false, explanation: "Not every restaurant in Paris requires formal dress. The standard is to be well-dressed and thoughtful, which does not necessarily mean black tie." },
        { text: "Whatever is comfortable — Parisians are too chic to care what guests wear.", correct: false, explanation: "This misreads French culture entirely. Appearance is taken seriously in Paris; a casual approach to dress at dinner would be noticed and judged." },
      ]
    }
  },
  {
    title: "L'Addition — Paying the Bill",
    pillar: 4, region_code: "FR", age_group: "25-55", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "After a business lunch in Lyon that you arranged, the meal is over and you wish to pay the bill.",
      question: "What is the correct way to request and settle the bill in France?",
      options: [
        { text: "Signal the waiter and ask for 'l'addition, s'il vous plaît', then settle discreetly.", correct: true, explanation: "Correct. In France, the bill is requested verbally or with a discreet gesture. The host settles it calmly and without fanfare. Pre-paying or making a show of payment is considered gauche." },
        { text: "Leave cash on the table as you stand up to leave.", correct: false, explanation: "Leaving cash on the table and departing is not the French norm. The bill is settled with the waiter present." },
        { text: "Wave enthusiastically to get the waiter's attention.", correct: false, explanation: "Exuberant signalling is considered rude in French dining culture. A measured, quiet gesture or eye contact is appropriate." },
        { text: "Ask the waiter to split the bill across multiple cards.", correct: false, explanation: "As the host who arranged the lunch, you pay. Splitting the bill in a business hosting context is inappropriate." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ITALY (IT)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Bella Figura in Milan",
    pillar: 2, region_code: "IT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are invited to a fashion industry dinner in Milan. The dress code on the invitation simply says 'elegante'.",
      question: "How should you interpret 'elegante' for an Italian social event?",
      options: [
        { text: "Smart business attire — a conservative suit or formal dress.", correct: false, explanation: "'Elegante' in an Italian fashion context means more than a standard business suit. It signals attention to cut, fabric, colour, and personal expression — not mere formality." },
        { text: "Thoughtfully stylish — well-cut clothing, considered accessories, and clear personal expression.", correct: true, explanation: "Precisely. La bella figura — making a beautiful impression — is a central cultural concept in Italy. 'Elegante' requires effort, taste, and a degree of individual flair. Blending into corporate uniformity is not the goal." },
        { text: "Casual but clean — Italians are relaxed about dress in social settings.", correct: false, explanation: "This is entirely wrong for Milan especially. Italians, particularly in fashion and professional circles, pay considerable attention to appearance. Casual would be conspicuous." },
        { text: "Black tie — 'elegante' always means formal in Italy.", correct: false, explanation: "Black tie would be specified as 'smoking' or 'abito scuro'. 'Elegante' calls for style and polish, not necessarily a dinner jacket." },
      ]
    }
  },
  {
    title: "Cappuccino After Noon",
    pillar: 5, region_code: "IT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "After a substantial Roman lunch at 2 p.m., you feel like a milky coffee. You ask for a cappuccino.",
      question: "How will your Italian companions likely react?",
      options: [
        { text: "With admiration — cappuccino is Italy's greatest gift to the world.", correct: false, explanation: "While Italians are proud of cappuccino, ordering it after lunch is considered eccentric. Milky coffees are a morning drink; espresso follows meals." },
        { text: "With surprised amusement — Italians consider cappuccino a morning drink, not an after-lunch option.", correct: true, explanation: "Correct. In Italy, cappuccino is consumed in the morning, never after a meal. After lunch or dinner, a small espresso (caffè) is the conventional choice. Ordering a cappuccino post-lunch marks you immediately as a tourist." },
        { text: "With indifference — all coffee choices are respected equally in Italy.", correct: false, explanation: "Italy's coffee culture is deeply opinionated. Drinking milky coffee after a meal runs directly against the grain of Italian digestive wisdom — milk fills the stomach, espresso aids digestion." },
        { text: "They will order one too — cappuccino with dessert is a Roman tradition.", correct: false, explanation: "No such tradition exists. Espresso accompanies or follows dessert; cappuccino does not." },
      ]
    }
  },
  {
    title: "Pasta Al Dente",
    pillar: 4, region_code: "IT", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are at a family Sunday lunch in Rome. A large bowl of spaghetti is placed in the centre of the table. You notice your pasta is slightly firm to the bite.",
      question: "How should you respond to al dente pasta?",
      options: [
        { text: "Ask the host to cook it a little longer — you prefer softer pasta.", correct: false, explanation: "Requesting softer pasta in an Italian home would be perceived as a criticism of the cooking and a fundamental misunderstanding of Italian culinary standards." },
        { text: "Appreciate it — al dente is the correct way to cook pasta in Italian tradition.", correct: true, explanation: "Precisely. Al dente ('to the tooth') — pasta that retains a slight firmness — is the Italian standard. Overcooked pasta is considered a culinary failure. Eating it with appreciation is the correct and respectful response." },
        { text: "Add extra sauce to soften the texture.", correct: false, explanation: "Sauce is not a remediation tool. Adding extra sauce to compensate for texture misses both the culinary and social point." },
        { text: "Eat it without comment but decline seconds — it is acceptable to silently dislike food.", correct: false, explanation: "Declining seconds at an Italian family table without an enthusiastic response to the meal would be quite discouraging to your host. Appreciate the pasta as intended." },
      ]
    }
  },
  {
    title: "Aperitivo Hour",
    pillar: 5, region_code: "IT", age_group: "18-55", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "Italian colleagues invite you for 'aperitivo' at 7 p.m. in Milan. You are not sure what to expect.",
      question: "What does aperitivo typically involve in Northern Italian culture?",
      options: [
        { text: "A formal sit-down dinner beginning at 7 p.m.", correct: false, explanation: "Aperitivo is not dinner. It is a pre-dinner ritual of drinks and light snacks, typically enjoyed standing at a bar or counter." },
        { text: "A light drink — Aperol Spritz, Negroni, or similar — accompanied by complimentary snacks, preceding dinner.", correct: true, explanation: "Correct. Aperitivo is a beloved Italian social institution — a Campari, Aperol Spritz, or Prosecco with a spread of nibbles (olive, crisps, small bites). It precedes dinner, which in Milan typically begins no earlier than 8:30 or 9 p.m." },
        { text: "A bottle of wine shared between friends — aperitivo simply means wine before food.", correct: false, explanation: "While wine may be served, aperitivo is specifically about aperitivo-style drinks (Campari, Aperol, vermouth, Prosecco) and the accompanying light food ritual." },
        { text: "An informal coffee break — aperitivo translates literally as 'opener'.", correct: false, explanation: "While the etymology suggests 'opener', aperitivo in practice is an evening social ritual involving alcohol and snacks, not coffee." },
      ]
    }
  },
  {
    title: "Italian Greeting Warmth",
    pillar: 3, region_code: "IT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are introduced to an Italian family at a social gathering in Florence. The father embraces you warmly and kisses you on both cheeks.",
      question: "How should you respond?",
      options: [
        { text: "Step back — you did not expect physical contact from a stranger.", correct: false, explanation: "Stepping back from an Italian greeting embrace signals coldness and discomfort. In Italian social culture, warm physical greetings are normal and generous." },
        { text: "Reciprocate with warmth — return the embrace and the kisses, making genuine eye contact.", correct: true, explanation: "Precisely. Italian greetings are warm and physical. Reciprocating with genuine warmth — not stiffness or mechanical compliance — sets the tone for a positive relationship." },
        { text: "Offer your hand to prevent further contact.", correct: false, explanation: "Redirecting to a handshake midway through an Italian embrace is awkward and unwelcoming. Accept the greeting as offered." },
        { text: "Offer one cheek but not both — one kiss is sufficient.", correct: false, explanation: "In Italy, two kisses (one on each cheek) is the standard. Stopping after one may leave your host mid-gesture." },
      ]
    }
  },
  {
    title: "No Parmesan on Seafood",
    pillar: 4, region_code: "IT", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are at a restaurant in Naples and have ordered spaghetti alle vongole (clams). The waiter brings grated Parmigiano-Reggiano to the table.",
      question: "What should you do?",
      options: [
        { text: "Add the Parmesan generously — cheese makes everything better.", correct: false, explanation: "Adding cheese to seafood pasta is a cardinal culinary sin in Italian culture. The rule is absolute: cheese and seafood do not belong together." },
        { text: "Politely decline the Parmesan — cheese and seafood is a combination Italians consider wrong.", correct: true, explanation: "Correct. Grating Parmigiano onto any seafood dish is deeply offensive to Italian culinary sensibility. Politely decline and enjoy the pasta as it was intended — the briny flavour of the clams needs no cheese." },
        { text: "Ask for a different cheese — Pecorino might work better.", correct: false, explanation: "No cheese belongs with seafood pasta in Italian tradition. The question of which cheese is appropriate does not arise." },
        { text: "Add just a little — a small amount cannot cause offence.", correct: false, explanation: "Even a sprinkle would be considered a breach of culinary etiquette in this context. Decline politely and leave the pasta as intended." },
      ]
    }
  },
  {
    title: "Paying for Coffee in Italy",
    pillar: 5, region_code: "IT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You stop at a Roman bar for an espresso. You notice most locals are standing at the counter and paying before receiving their coffee.",
      question: "What is the correct ritual for ordering coffee at an Italian bar counter?",
      options: [
        { text: "Sit at a table and wait to be served — it is more comfortable.", correct: false, explanation: "Sitting at a table incurs a table surcharge (coperto or servizio) at many Italian bars. The standing counter price is the standard and most economical option — and the most authentically Roman." },
        { text: "Go to the cassa (cashier), pay first, receive a receipt, take it to the counter, and order.", correct: true, explanation: "Correct. In a traditional Italian bar, you pay at the cassa first, take the scontrino (receipt) to the barista, and order. Attempting to order first and pay later reverses the process and confuses staff." },
        { text: "Order at the counter and pay when you leave.", correct: false, explanation: "The system in most traditional Italian bars is payment first, then service. Not following this process can cause confusion." },
        { text: "Wave to attract the barista and place your order directly.", correct: false, explanation: "Ordering without a receipt in hand breaks the established system. The cassa is the first stop." },
      ]
    }
  },
  {
    title: "Late Arrival — Italian Style",
    pillar: 1, region_code: "IT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are invited to an informal dinner party at an Italian friend's home in Rome for 8 p.m. You are ready to leave at 7:55.",
      question: "When should you actually arrive?",
      options: [
        { text: "At 7:55 — better to be five minutes early.", correct: false, explanation: "Arriving early at an Italian dinner party can embarrass the host who is still preparing. A few minutes' grace is expected." },
        { text: "Around 8:15 to 8:30 — a slight delay is anticipated and completely acceptable.", correct: true, explanation: "Correct. At informal Italian social occasions, arriving 15 to 30 minutes after the stated time is considered normal and considerate — it gives the host time to finish preparations. Arriving exactly on time or early can create mild awkwardness." },
        { text: "At 9 p.m. — Italians eat very late.", correct: false, explanation: "Arriving an hour after the stated time is excessive even by Italian standards. 15 to 30 minutes is the comfortable zone for informal gatherings." },
        { text: "Exactly at 8 p.m. — punctuality shows respect in all cultures.", correct: false, explanation: "Italian social time operates differently from Northern European punctuality norms. Exact arrival at an informal gathering may catch your host mid-preparation." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BELGIUM (BE)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "The Language Question",
    pillar: 1, region_code: "BE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are attending a business meeting in Brussels. Half the attendees appear to be Flemish and half Francophone. You are unsure which language to use in conversation.",
      question: "What is the most culturally sensitive approach?",
      options: [
        { text: "Speak French — Brussels is in French-speaking Belgium.", correct: false, explanation: "Brussels is officially bilingual (French and Dutch), and the surrounding region is Flemish. Assuming French is appropriate can cause offence to Flemish participants." },
        { text: "Default to English as a neutral language and let others address each other in their preferred language.", correct: true, explanation: "Correct. In a multilingual Belgian meeting, English is often the pragmatic neutral ground. Imposing French or Dutch on a mixed group can reignite the persistent linguistic sensitivities. Let Belgians determine what language they use with each other." },
        { text: "Ask everyone at the outset which language they prefer.", correct: false, explanation: "While thoughtful in intention, this can draw uncomfortable attention to the language divide that Belgians often prefer to manage privately." },
        { text: "Speak Dutch — Flemish is the majority language in Belgium.", correct: false, explanation: "While Flanders is the most populous region, this reasoning ignores the context of a bilingual meeting in bilingual Brussels." },
      ]
    }
  },
  {
    title: "Belgian Modesty",
    pillar: 3, region_code: "BE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "At a Belgian business dinner, a colleague asks you what you think of your own recent project. You know it was a significant success.",
      question: "How do Belgians typically expect you to respond to this kind of question?",
      options: [
        { text: "Describe the success in detail — results speak for themselves and confidence is admired.", correct: false, explanation: "Self-promotion is viewed with discomfort in Belgian culture. Boasting — even about genuine achievements — runs against the grain of the country's cultural modesty." },
        { text: "Acknowledge success modestly — give credit to the team and mention what could still be improved.", correct: true, explanation: "Precisely. Belgian culture prizes discretion and modesty. Sharing credit with your team and mentioning areas for growth is far more favourably received than self-congratulation." },
        { text: "Deflect entirely — discussing work at dinner is inappropriate.", correct: false, explanation: "Work can be discussed at a Belgian dinner; the issue is tone. Modesty, not avoidance, is the cultural norm." },
        { text: "Express surprise at the compliment — false modesty is expected.", correct: false, explanation: "Genuine modesty is valued, not performative deflection. Simply acknowledge the achievement calmly and share credit." },
      ]
    }
  },
  {
    title: "The Belgian Triple Kiss",
    pillar: 3, region_code: "BE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are introduced to a Belgian woman at a social gathering in Antwerp. She leans in to greet you.",
      question: "How many cheek kisses does a Belgian greeting typically involve?",
      options: [
        { text: "One — the same as in the UK.", correct: false, explanation: "The UK typically uses one or two. Belgium (especially Flanders and Brussels) uses three cheek kisses as the standard greeting between acquaintances." },
        { text: "Two — the same as in France.", correct: false, explanation: "France typically uses two (though it varies by region). Belgium customarily uses three." },
        { text: "Three — starting on the right cheek.", correct: true, explanation: "Correct. Three cheek kisses is the Belgian social norm, typically starting on the right. Being prepared for three avoids the awkward moment of stopping after two when your companion continues." },
        { text: "None — a formal handshake is always preferred in Belgium.", correct: false, explanation: "A handshake is appropriate in formal professional settings, but in social gatherings, la bise — with three kisses — is the warm greeting norm." },
      ]
    }
  },
  {
    title: "Beer Appreciation in Belgium",
    pillar: 5, region_code: "BE", age_group: "18-55", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are in a Brussels café with Belgian colleagues. The waiter asks which beer you would like. You are unfamiliar with Belgian beer.",
      question: "What is the most appropriate approach?",
      options: [
        { text: "Order any brand you recognise — Stella Artois is Belgian and safe.", correct: false, explanation: "While Stella Artois is technically Belgian, ordering it in a proper Belgian café is considered slightly unsophisticated. Belgium's beer culture is celebrated for its hundreds of artisanal varieties." },
        { text: "Ask the waiter what they recommend for someone exploring Belgian beer — and engage genuinely with their answer.", correct: true, explanation: "Precisely. Belgian beer culture is world-renowned and Belgians take genuine pride in it. Expressing curiosity and deferring to the expert is both flattering to Belgian culture and likely to result in an excellent drink." },
        { text: "Order wine instead — beer feels too informal for a colleague meeting.", correct: false, explanation: "In Belgium, beer is a sophisticated beverage and entirely appropriate in a professional social context. A quality Trappist or Saison is perfectly respectable." },
        { text: "Ask for the cheapest option — all Belgian beers are similar in quality.", correct: false, explanation: "Belgian beer ranges enormously in character and quality. Asking for the cheapest signals indifference to a cultural institution Belgians hold dear." },
      ]
    }
  },
  {
    title: "Belgian Business Formality",
    pillar: 3, region_code: "BE", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You have a first meeting with a senior Belgian executive at his Brussels office. He greets you with a firm handshake but does not suggest using first names.",
      question: "How should you address him throughout the meeting?",
      options: [
        { text: "Use his first name immediately — all European business culture is informal now.", correct: false, explanation: "Belgian professional culture, particularly at the senior level, values formality in initial meetings. Using a first name without invitation is presumptuous." },
        { text: "Address him by his last name and appropriate title until he invites informality.", correct: true, explanation: "Correct. Belgian business culture (both Flemish and Francophone) is more formal than its Dutch or British counterparts, particularly in a first meeting. Wait for your counterpart to signal a shift to first names." },
        { text: "Avoid addressing him by name at all during the meeting.", correct: false, explanation: "Avoiding any form of address is unnecessarily awkward. Using the last name and title is the appropriate default." },
        { text: "Match his body language — if he appears relaxed, use his first name.", correct: false, explanation: "Relaxed body language is not the same as an invitation to informality of address. The verbal or explicit invitation is the correct signal to watch for." },
      ]
    }
  },
  {
    title: "Moules-Frites Protocol",
    pillar: 4, region_code: "BE", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "At a Belgian brasserie, you order moules-frites (mussels and fries). The mussels arrive in a large pot, still in their shells.",
      question: "How are moules traditionally eaten in Belgium?",
      options: [
        { text: "With a fork and spoon — remove shells first, then eat with utensils.", correct: false, explanation: "While a fork may be used, the traditional and accepted Belgian method involves using an empty mussel shell as a pair of tongs to pick out the remaining mussels — elegant, practical, and culturally correct." },
        { text: "Use an empty mussel shell as tongs to pick out the others, and eat from the shell directly.", correct: true, explanation: "Precisely. Using the shell as a natural utensil is the traditional Belgian method and is entirely accepted at Belgian brasseries. This technique is efficient, fun, and considered perfectly proper." },
        { text: "Request a fork — eating with shells is messy and inappropriate.", correct: false, explanation: "Requesting a fork for mussels in a Belgian brasserie is unnecessary. The shell-as-utensil method is standard and considered correct, not messy." },
        { text: "Pick them out with your fingers and set the shells neatly aside.", correct: false, explanation: "Fingers are acceptable for some mussels, but the shell-as-tongs method is the culturally expected technique in a Belgian dining context." },
      ]
    }
  },
  {
    title: "Chocolate Protocol",
    pillar: 1, region_code: "BE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You wish to bring a gift to your Belgian host's home dinner. You are considering a box of chocolates purchased at a supermarket.",
      question: "Is supermarket chocolate an appropriate gift for a Belgian host?",
      options: [
        { text: "Yes — any chocolate is appreciated as a gesture of goodwill.", correct: false, explanation: "Belgium is home to some of the finest chocolatiers in the world. Presenting supermarket chocolate to a Belgian host suggests a lack of effort and cultural awareness." },
        { text: "No — Belgian hosts expect chocolates from a reputable artisanal chocolatier.", correct: true, explanation: "Correct. Belgians take chocolate seriously. A box from a quality chocolatier (Neuhaus, Wittamer, Pierre Marcolini, etc.) signals genuine thoughtfulness and respect for Belgian craftsmanship. Supermarket chocolate would be noticed and mildly disappointing." },
        { text: "Yes — the thought matters more than the brand in Belgian culture.", correct: false, explanation: "While thought is always appreciated, in a culture where artisanal chocolate is a point of national pride, the quality of your selection does communicate how much thought you have put in." },
        { text: "Avoid chocolate altogether — it seems too predictable as a Belgian gift.", correct: false, explanation: "Chocolate remains a perfectly appropriate and genuinely appreciated gift in Belgium, provided it is of good quality. The predictability is less of an issue than the quality." },
      ]
    }
  },
  {
    title: "Belgian Fries — The Original",
    pillar: 4, region_code: "BE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "At a Belgian frietkot (frite stand) in Bruges, you order frites. The server asks what sauce you want. You are about to ask for ketchup.",
      question: "What is the culturally appropriate sauce accompaniment for Belgian frites?",
      options: [
        { text: "Ketchup — the universal fries sauce.", correct: false, explanation: "While ketchup is available, asking for it with Belgian frites at a frietkot is akin to asking for instant coffee at a Viennese café. It misses the cultural experience entirely." },
        { text: "Mayonnaise — the traditional and beloved Belgian accompaniment to frites.", correct: true, explanation: "Precisely. Belgian frites with mayonnaise (frietsaus) is the authentic combination and a point of national pride. It is thick, slightly tangy, and specifically designed for the purpose. Try it as intended." },
        { text: "Vinegar — as in the UK chip shop tradition.", correct: false, explanation: "Vinegar on frites is a British tradition. Belgian frites call for mayonnaise — the combination is an institution." },
        { text: "No sauce — Belgian frites are best eaten plain to appreciate the quality.", correct: false, explanation: "While the quality of Belgian frites is indeed exceptional, the accompanying sauce is part of the ritual and should be embraced." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SWITZERLAND (CH)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Swiss Punctuality",
    pillar: 1, region_code: "CH", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You have a business meeting in Zurich at 10:00 a.m. Due to an unexpected phone call, you will arrive at 10:07.",
      question: "How should you handle this situation?",
      options: [
        { text: "Arrive at 10:07 without comment — seven minutes is not significant.", correct: false, explanation: "In Swiss professional culture, even a few minutes late without forewarning is considered disrespectful. Punctuality is a fundamental expression of reliability and consideration." },
        { text: "Call or message ahead to warn of the delay, arrive as quickly as possible, and apologise briefly upon arrival.", correct: true, explanation: "Precisely. Forewarning of a delay is essential in Switzerland. Arriving without notice — even seven minutes late — erodes trust. A prompt apology on arrival closes the matter cleanly." },
        { text: "Arrive and offer a lengthy, detailed explanation — showing you had a good reason matters.", correct: false, explanation: "In Swiss culture, brevity is preferred. A concise apology ('I apologise — I was delayed by a call') is more appropriate than an elaborate justification." },
        { text: "Simply arrive late — Swiss people are accustomed to minor delays in foreign visitors.", correct: false, explanation: "This reasoning misunderstands Swiss expectations. Punctuality applies to everyone equally, regardless of origin." },
      ]
    }
  },
  {
    title: "Greeting Every Person",
    pillar: 3, region_code: "CH", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You arrive at a Swiss dinner gathering of eight people. The host introduces you to the room as a group.",
      question: "What is the correct greeting protocol in Switzerland?",
      options: [
        { text: "Wave or nod to the group and take your seat — one acknowledgement covers all.", correct: false, explanation: "A collective acknowledgement is considered insufficient in Swiss social culture. Each person deserves an individual greeting." },
        { text: "Shake hands individually with every single person in the room, including children.", correct: true, explanation: "Correct. In Switzerland, it is expected that you greet each person individually — with a firm handshake, name exchange, and eye contact — upon arrival. Skipping anyone, including the youngest guest, is noticed and considered impolite." },
        { text: "Greet the host and the most senior guests; others will understand.", correct: false, explanation: "Hierarchy does not excuse you from greeting everyone. Every person in a Swiss gathering expects an individual acknowledgement." },
        { text: "Greet men with a handshake and women with a wave — physical greetings between mixed genders are uncommon.", correct: false, explanation: "A handshake is appropriate for all genders in Swiss professional and social settings." },
      ]
    }
  },
  {
    title: "Fondue Etiquette",
    pillar: 4, region_code: "CH", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are invited to a traditional Swiss fondue dinner in Graubünden. The pot of melted cheese is in the centre of the table.",
      question: "What happens if your bread falls off your fondue fork into the cheese?",
      options: [
        { text: "Nothing — it happens to everyone and is not a social matter.", correct: false, explanation: "Dropping your bread is accompanied by a social forfeit in Swiss fondue tradition — the consequence depends on who dropped it." },
        { text: "The person who drops the bread pays a forfeit — traditionally buying a bottle of wine or kissing all guests if a woman, or buying a round if a man.", correct: true, explanation: "Correct. Swiss fondue has its own lighthearted rules. Dropping the bread is a social event and the forfeit (paying for a round, a kiss, or another agreed consequence) is enforced with good humour. It is part of the communal experience." },
        { text: "Reach into the fondue pot to retrieve it immediately.", correct: false, explanation: "Fishing in the shared pot is unhygienic and impolite. The bread is lost; accept the forfeit graciously." },
        { text: "Use a spoon to scoop the bread out and continue.", correct: false, explanation: "The bread sinks and is unrecoverable. Accept the forfeit — it is the convivial point of the rule." },
      ]
    }
  },
  {
    title: "Swiss Privacy",
    pillar: 1, region_code: "CH", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You have known a Swiss colleague professionally for six months. You are curious about where he lives and what he does in his private life.",
      question: "How should you approach these personal topics?",
      options: [
        { text: "Ask directly — you are friends now and Swiss people are straightforward.", correct: false, explanation: "Swiss people distinguish sharply between professional acquaintance and friendship. Six months of professional interaction does not grant access to private life details." },
        { text: "Allow personal information to be volunteered; do not probe.", correct: true, explanation: "Correct. Swiss culture places exceptional value on privacy. Personal details — home location, family, finances — are shared only when the Swiss person chooses to share them. Probing signals a lack of respect for boundaries." },
        { text: "Ask casually during a lunch break — informal settings invite informal questions.", correct: false, explanation: "Informality of setting does not change the Swiss boundary around private life. The same discretion applies whether in the office or at a restaurant." },
        { text: "Share your own private details first — reciprocity will open the conversation.", correct: false, explanation: "Oversharing your own private details does not create an obligation for reciprocity in Swiss culture; it may simply make your companion uncomfortable." },
      ]
    }
  },
  {
    title: "Toasting in Switzerland",
    pillar: 5, region_code: "CH", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "At a Swiss dinner, wine is poured and a toast is proposed. You clink glasses with the person nearest to you across the table, reaching slightly.",
      question: "Is crossing arms during a Swiss toast acceptable?",
      options: [
        { text: "Yes — reaching across is a friendly gesture.", correct: false, explanation: "Crossing arms when clinking glasses is considered bad luck in Swiss tradition. The toast should be made with straight arms, or you rise to reach others rather than crossing." },
        { text: "No — clinking glasses with crossed arms is considered bad luck in Switzerland.", correct: true, explanation: "Correct. In Switzerland, crossing arms during the Anstoßen (toasting clink) is a superstition linked to misfortune. You either clink with the people immediately adjacent to you with straight arms, or you stand and move to the person across the table." },
        { text: "Yes — crossed arms are irrelevant in a modern Swiss context.", correct: false, explanation: "Whether or not one believes in the superstition, the awareness and social habit are very much alive. Your Swiss companions will notice." },
        { text: "Only cross arms if everyone else does — follow the crowd.", correct: false, explanation: "Avoid crossing arms proactively. It is not a style choice but a specific cultural convention with a clear preference." },
      ]
    }
  },
  {
    title: "Swiss Watch for Your Language",
    pillar: 3, region_code: "CH", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are in Basel, which sits at the junction of Germany, France, and Switzerland. Your Swiss colleague speaks to you in German. You know he also speaks French.",
      question: "What is the most culturally aware approach to your language use with him?",
      options: [
        { text: "Respond in French — it is more widely understood internationally.", correct: false, explanation: "Switching to a different Swiss national language without invitation can seem presumptuous. If he has chosen to address you in German, respond accordingly." },
        { text: "Respond in the language he has used with you — German — unless he indicates a preference for another.", correct: true, explanation: "Correct. In multilingual Switzerland, the language of conversation is set by the initiator. Respecting that choice demonstrates cultural attentiveness. Switching languages uninvited can seem like a correction." },
        { text: "Respond in English — it is neutral territory in a multi-language environment.", correct: false, explanation: "English as a default is appropriate when neither party speaks the other's language. When both speak German, defaulting to English without reason seems odd." },
        { text: "Ask him which language he prefers — showing awareness of his options.", correct: false, explanation: "He has already made a choice by addressing you in German. Asking the question may seem unnecessary." },
      ]
    }
  },
  {
    title: "Quietness in Public in Switzerland",
    pillar: 1, region_code: "CH", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are travelling on the Zurich tram. Your phone rings and it is an important call you wish to take.",
      question: "What is the appropriate response in Swiss public transport etiquette?",
      options: [
        { text: "Take the call normally — it is an important matter.", correct: false, explanation: "Loud conversations on Swiss public transport are strongly discouraged. Taking a full call at normal volume would draw disapproving looks." },
        { text: "Keep your voice low, or step off at the next stop to take the call properly.", correct: true, explanation: "Correct. Swiss public spaces — especially transport — are governed by a strong expectation of quiet and consideration for others. Speaking quietly or exiting to take the call respects this norm." },
        { text: "Decline the call and call back later — phones should be silent on Swiss trams.", correct: false, explanation: "While quiet is expected, briefly answering and keeping your voice low, or stepping off, is entirely acceptable." },
        { text: "Take the call and apologise to nearby passengers — they will understand.", correct: false, explanation: "Apologising while taking a loud call does not resolve the inconvenience. Either keep it very brief and quiet, or step off." },
      ]
    }
  },
  {
    title: "Inviting a Swiss Person Home",
    pillar: 1, region_code: "CH", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 3, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "After several weeks of pleasant professional interaction, you casually invite a Swiss colleague to visit your apartment. She smiles and says 'Perhaps sometime' without committing.",
      question: "How should you interpret and respond to this answer?",
      options: [
        { text: "She is interested but busy — follow up again next week with a specific date.", correct: false, explanation: "Pressing for a specific date after a politely non-committal answer may create pressure that your Swiss colleague finds uncomfortable. She has indicated low enthusiasm without directly declining." },
        { text: "Understand that 'perhaps sometime' signals polite hesitation — do not follow up immediately, and allow her to raise it if she wishes.", correct: true, explanation: "Correct. Swiss people are private and do not typically accept home invitations from professional acquaintances easily. 'Perhaps sometime' is a polite deferral that should be respected. The friendship, if it deepens, will progress in its own time." },
        { text: "She has effectively said yes — make the arrangements.", correct: false, explanation: "This over-reads the response. 'Perhaps sometime' is not a commitment; it is a non-committal deflection common in Swiss social culture." },
        { text: "Apologise for the presumption and withdraw the invitation.", correct: false, explanation: "An apology is unnecessary and would create an awkward moment. Simply allow the conversation to move on naturally." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SINGAPORE (SG)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Multicultural Sensitivity in Singapore",
    pillar: 1, region_code: "SG", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "At a Singapore business lunch, you are seated with colleagues of Chinese, Malay, and Indian backgrounds. The menu includes pork and alcohol.",
      question: "What is the most culturally aware approach to ordering?",
      options: [
        { text: "Order freely — Singapore is cosmopolitan and dietary restrictions are personal.", correct: false, explanation: "While Singapore is indeed cosmopolitan, being aware of religious and cultural dietary requirements (no pork/alcohol for Malay Muslim colleagues, vegetarianism for some Indian Hindu colleagues) is the mark of genuine cultural sensitivity." },
        { text: "Consider who is at the table before ordering, and avoid flagging pork or alcohol prominently if Malay Muslim colleagues are present.", correct: true, explanation: "Correct. Singapore's racial harmony culture encourages thoughtfulness in multicultural settings. Ordering pork or alcohol without consideration of Malay Muslim colleagues' religious requirements is a social misstep. Order discreetly, or steer the table toward a menu that works for everyone." },
        { text: "Ask each person individually about their dietary restrictions before ordering.", correct: false, explanation: "While thoughtful in intention, asking each person to declare dietary restrictions publicly can feel intrusive. Read the table and order accordingly." },
        { text: "Order a separate vegetarian menu for the whole table — it is the safest option.", correct: false, explanation: "While safe, imposing vegetarianism on the whole table without consultation is unnecessary. Thoughtful ordering among available options is a better approach." },
      ]
    }
  },
  {
    title: "Hawker Centre Etiquette",
    pillar: 4, region_code: "SG", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are at a busy Singapore hawker centre during lunchtime. You find a partially occupied table — a pack of tissues sits on it but no person.",
      question: "What do the tissues signify, and what should you do?",
      options: [
        { text: "Someone left them accidentally — you can sit anywhere at the table.", correct: false, explanation: "In Singapore, a packet of tissues (or any small object) placed on a table is the universally understood signal that the seat is reserved — a practice called 'choping'. Taking that seat would be impolite." },
        { text: "The seat is reserved by the absent person — find a different seat or ask before sitting.", correct: true, explanation: "Correct. 'Choping' — using a tissue packet or other small item to reserve a hawker centre seat — is a widespread and accepted Singaporean practice. The tissues signal 'taken'; respect this and find another available seat." },
        { text: "Move the tissues and sit — informal settings have no formal seating rules.", correct: false, explanation: "Moving someone's chope item and taking their seat would cause offence. The practice is well understood and respected across Singapore." },
        { text: "Ask nearby diners if the seat is truly taken — tissues could be forgotten.", correct: false, explanation: "The tissue packet as chope is so well understood in Singapore that asking nearby diners is unnecessary. It is taken." },
      ]
    }
  },
  {
    title: "Business Cards in Singapore",
    pillar: 3, region_code: "SG", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "At a Singapore business meeting with a Chinese-Singaporean executive, he presents his card with both hands. Your card is in your back pocket.",
      question: "What is the appropriate handling of this exchange?",
      options: [
        { text: "Retrieve your card from your back pocket and hand it over quickly.", correct: false, explanation: "Retrieving a card from a back pocket signals that the exchange was not important enough to prepare for. Always have your card accessible and present it deliberately." },
        { text: "Accept his card with both hands, examine it briefly, place it respectfully on the table, then present yours from a proper holder.", correct: true, explanation: "Correct. Among Chinese-Singaporean business culture, the meishi-style two-handed card exchange shows respect. Receiving and examining the card before placing it face-up on the table (not pocketing it) is the appropriate response." },
        { text: "Apologise and say you forgot your card today — honesty is appreciated.", correct: false, explanation: "Arriving without cards for a scheduled business meeting in Singapore signals poor preparation. Ensure you always have cards ready." },
        { text: "Accept with one hand and pocket immediately — Singapore is more casual than Japan.", correct: false, explanation: "While Singapore's business culture is somewhat more relaxed than Japan's, among Chinese-Singaporean executives, the respectful card exchange is still valued and a one-handed pocket is considered careless." },
      ]
    }
  },
  {
    title: "The Fine City",
    pillar: 1, region_code: "SG", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are walking from a Singapore MRT station and eating a bag of crisps. A sign reads 'No food or drink on the MRT'. You have not yet entered the station gates.",
      question: "What is the appropriate action?",
      options: [
        { text: "Finish the crisps before passing through the fare gates.", correct: true, explanation: "Correct. Singapore's MRT prohibits food and drink within the station boundary (including concourses), not just on trains. Finishing outside the gates respects both the letter and spirit of the rule — and avoids the substantial fine." },
        { text: "Discreetly finish the crisps once on the train — the rule is loosely enforced.", correct: false, explanation: "The rule is actively enforced in Singapore, and fines are real. 'Loosely enforced' is not a reliable defence." },
        { text: "Keep the bag of crisps sealed and visible — you are not actively eating.", correct: false, explanation: "The prohibition applies to the station zone, not just to active consumption. A sealed bag inside is acceptable; an open bag is not." },
        { text: "Ignore the sign — food rules in Asian countries are suggestions.", correct: false, explanation: "This is profoundly inaccurate. Singapore's public rules are enforced, including the S$500 fine for eating or drinking on the MRT." },
      ]
    }
  },
  {
    title: "Singlish — To Use or Not",
    pillar: 3, region_code: "SG", age_group: "18-45", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "At a casual drinks gathering in Singapore, your local friends use Singlish — mixing English, Malay, Hokkien, and Mandarin — fluently. They invite you to 'lah' along.",
      question: "What is the most appropriate approach to Singlish as a non-Singaporean?",
      options: [
        { text: "Use Singlish enthusiastically — it signals that you feel at home.", correct: false, explanation: "Adopting Singlish terms you have not mastered can easily come across as mocking or performative. Genuine appreciation is better expressed through engagement than imitation." },
        { text: "Engage warmly with their Singlish, pick up phrases naturally, but do not force terms you are unfamiliar with.", correct: true, explanation: "Correct. Singlish is a beloved part of Singaporean identity and using it naturally is a sign of belonging. However, forcing it as a visitor can seem patronising. Smile at the terms, learn them gradually, and use them only when they arise naturally." },
        { text: "Politely correct them — Standard English is more professional.", correct: false, explanation: "Correcting Singlish in a casual social setting would be deeply condescending. Singlish is a sophisticated creole with its own grammar and is a source of Singaporean pride." },
        { text: "Ignore the Singlish entirely — respond only in Standard English.", correct: false, explanation: "Ignoring the vernacular entirely signals distance from the group. Warm engagement — even just smiling at the terms — is the social expectation." },
      ]
    }
  },
  {
    title: "Kiasu and Queue-Jumping",
    pillar: 1, region_code: "SG", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are queuing for a popular hawker stall in Singapore. The queue is long. A local offers to let you go ahead of them.",
      question: "What is the correct response to this offer?",
      options: [
        { text: "Accept gratefully and move forward — they made the offer.", correct: false, explanation: "Accepting queue-jumps in Singapore, where queuing is taken seriously, could draw negative attention from others waiting. Politely decline." },
        { text: "Decline politely — 'Thank you, but I am happy to wait'.", correct: true, explanation: "Correct. Queuing culture is strong in Singapore. Accepting a queue-jump — even when offered — may create tension with others. A gracious decline maintains harmony and signals that you understand and respect the social contract of the queue." },
        { text: "Accept quickly and avoid eye contact with others in the queue.", correct: false, explanation: "Avoiding eye contact does not neutralise the social friction of queue-jumping. Politely declining is the more appropriate response." },
        { text: "Ask the person behind you if they mind — their approval makes it acceptable.", correct: false, explanation: "Seeking approval from one person does not address the whole queue. The simplest, most socially harmonious action is to decline the offer graciously." },
      ]
    }
  },
  {
    title: "Drinking in Singapore",
    pillar: 5, region_code: "SG", age_group: "18-55", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are out in Singapore with colleagues at 11 p.m. You would like to buy a round of drinks at a bar.",
      question: "What regulation should you be aware of regarding alcohol sales in Singapore?",
      options: [
        { text: "Alcohol cannot be served after 10 p.m. anywhere in Singapore.", correct: false, explanation: "Licensed premises (bars, restaurants) may serve alcohol past 10:30 p.m. The restriction applies to retail sales (shops, supermarkets) which may not sell alcohol between 10:30 p.m. and 7 a.m." },
        { text: "Retail sale of alcohol is prohibited between 10:30 p.m. and 7 a.m., but licensed bars and restaurants can still serve.", correct: true, explanation: "Correct. The Liquor Control (Supply and Consumption) Act 2015 restricts retail alcohol sales — convenience stores, supermarkets — between 10:30 p.m. and 7 a.m. Licensed premises continue operating under their own terms." },
        { text: "Drinking in public is completely legal at all hours in Singapore.", correct: false, explanation: "Public consumption of alcohol is prohibited between 10:30 p.m. and 7 a.m. in Singapore, except in licensed premises." },
        { text: "There are no alcohol restrictions in Singapore — it is a fully modern city.", correct: false, explanation: "Singapore has specific, enforced alcohol consumption laws. Being unaware of them can result in fines." },
      ]
    }
  },
  {
    title: "Gift-Giving in Singapore",
    pillar: 1, region_code: "SG", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are invited to a Chinese-Singaporean colleague's home for Chinese New Year. You wish to bring a gift.",
      question: "Which gift would be most appropriate?",
      options: [
        { text: "A fine bottle of wine — universally appreciated.", correct: false, explanation: "Wine is not always appropriate — some Chinese-Singaporean families are teetotal, and alcohol at Chinese New Year is not the traditional gift." },
        { text: "A basket of premium fruit or Chinese New Year mandarin oranges (kam).", correct: true, explanation: "Correct. Mandarin oranges are the quintessential Chinese New Year gift in Singapore — they symbolise gold, luck, and prosperity. A quality fruit basket or a pair of mandarins in a red bag is an ideal and always-welcome choice." },
        { text: "A clock — it is a useful and thoughtful gift.", correct: false, explanation: "A clock (especially in Chinese culture) is associated with death — gifting a clock is giving someone a 'countdown' in Chinese superstition. Avoid clocks entirely." },
        { text: "White or black wrapped gifts — neutral colours are elegant.", correct: false, explanation: "White and black are associated with mourning in Chinese culture. Red and gold are the auspicious colours for Chinese New Year gifts." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIA (IN)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "The Namaste Greeting",
    pillar: 3, region_code: "IN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You arrive at a social gathering in Delhi and are introduced to an elder woman. She greets you with a namaste — hands pressed together, a slight bow.",
      question: "What is the correct response?",
      options: [
        { text: "Extend your hand for a handshake — physical contact is warmer.", correct: false, explanation: "Offering a handshake when someone has greeted you with a namaste can be unwelcome, particularly with elder women in more traditional settings. Reciprocate with a namaste." },
        { text: "Return the namaste — palms together, fingers pointing upward, slight bow.", correct: true, explanation: "Correct. Namaste is both a greeting and a mark of respect. Returning it in kind — with a genuine bow and 'Namaste' or 'Namaskar' — is the culturally appropriate and warmly received response." },
        { text: "Bow deeply as you would in Japan — it shows global cultural awareness.", correct: false, explanation: "A deep Japanese-style bow in an Indian context would seem strange. The namaste with its modest bow is the appropriate response." },
        { text: "Simply smile — the namaste is a one-way greeting and no response is required.", correct: false, explanation: "A returned namaste is expected and signals mutual respect. A smile alone would be incomplete." },
      ]
    }
  },
  {
    title: "Tea in India",
    pillar: 5, region_code: "IN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You visit an Indian colleague's home in Mumbai. Shortly after you sit down, chai is brought without being asked.",
      question: "What is the most appropriate response to the served chai?",
      options: [
        { text: "Thank them but decline — you prefer not to have tea at this time.", correct: false, explanation: "Refusing chai offered without being asked in an Indian home is considered impolite. The chai is a gesture of welcome and hospitality; accepting it honours that intention." },
        { text: "Accept it gratefully, take a sip, and express appreciation.", correct: true, explanation: "Correct. Chai is the vehicle of Indian hospitality. Accepting it — even just a few sips — communicates that you appreciate your host's welcome. Refusing is mildly offensive regardless of your thirst level." },
        { text: "Ask for coffee instead — showing personal preference is honest.", correct: false, explanation: "Chai has been prepared specifically for you. Requesting an alternative without accepting what is offered is ungracious." },
        { text: "Accept but set it aside without drinking — a token acceptance is sufficient.", correct: false, explanation: "Setting aside the tea without tasting it would be noticed and is not much better than outright refusal. A genuine sip with thanks is what is expected." },
      ]
    }
  },
  {
    title: "The Right Hand Rule",
    pillar: 4, region_code: "IN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are eating at a traditional Indian home dinner in Chennai. The meal is served on a banana leaf and you eat with your hands.",
      question: "Which hand should you use to eat, and why?",
      options: [
        { text: "Either hand — convenience is what matters at an informal meal.", correct: false, explanation: "In Indian culture, the left hand is considered impure (associated with hygiene practices). Eating, receiving food, or passing dishes with the left hand is inappropriate." },
        { text: "The right hand only — the left hand is considered unclean in Indian cultural tradition.", correct: true, explanation: "Correct. Throughout India, the right hand is used for eating, giving and receiving objects, and greeting. The left hand is reserved for personal hygiene and should not be used to touch food or be extended in greeting." },
        { text: "The left hand — it is more natural for left-handed people.", correct: false, explanation: "Being left-handed does not exempt one from this cultural norm in a traditional Indian home context. The right hand is used regardless of handedness." },
        { text: "Both hands — eating with both hands shows enthusiasm.", correct: false, explanation: "Using both hands to eat introduces the left hand into the dining ritual. The right hand alone is the correct practice." },
      ]
    }
  },
  {
    title: "The Head Wobble",
    pillar: 3, region_code: "IN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "During a conversation with an Indian colleague in Bangalore, you ask if Thursday works for a meeting. He wobbles his head side to side with a slight smile.",
      question: "What does the head wobble most likely communicate in this context?",
      options: [
        { text: "He is undecided and you should propose another day.", correct: false, explanation: "The head wobble (also known as the Indian head nod or wobble) is not a signal of indecision in this context. It most commonly signals agreement, acknowledgement, or 'okay'." },
        { text: "He is agreeing or indicating that Thursday is fine.", correct: true, explanation: "Correct. The lateral head wobble in Indian communication typically signals affirmation, understanding, or goodwill — similar to a Western nod. Context and accompanying expression clarify the meaning, but in this case, it most likely means 'yes, that works'." },
        { text: "He is saying no politely — the side-to-side motion means no.", correct: false, explanation: "A side-to-side head motion means 'no' in many Western cultures, but in India, the wobble (diagonal oscillation) generally signals agreement or acknowledgement. The two gestures are physically distinct." },
        { text: "He is distracted and not paying attention.", correct: false, explanation: "The head wobble is a deliberate communicative gesture, not a sign of distraction. It signals engagement and affirmation." },
      ]
    }
  },
  {
    title: "Religious Sites in India",
    pillar: 2, region_code: "IN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are visiting a Hindu temple in Jaipur as part of a business trip cultural tour.",
      question: "What should you prepare or observe before entering the temple?",
      options: [
        { text: "Enter in your business clothes — temples are public spaces.", correct: false, explanation: "Business attire may expose knees or arms, which is generally inappropriate for entering a Hindu temple. Modest dress is required." },
        { text: "Remove your shoes before entering, dress modestly, and avoid entering during menstruation if applicable (check locally).", correct: true, explanation: "Correct. Removing shoes is mandatory at all Hindu temples. Modest dress — covered shoulders and knees — is expected. Some temples have additional restrictions. Showing these forms of respect is essential and deeply appreciated." },
        { text: "Wear leather shoes with good arch support — temple floors can be uneven.", correct: false, explanation: "Shoes of any material must be removed before entering a Hindu temple. Leather shoes in particular may be unwelcome in temples where cows are sacred." },
        { text: "No preparation is needed — tourist temples accommodate all standards of dress.", correct: false, explanation: "Even popular tourist temples enforce modest dress and the removal of shoes. Some restrict entry based on religion. Always observe posted guidelines." },
      ]
    }
  },
  {
    title: "Flexible Time in India",
    pillar: 1, region_code: "IN", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "Your Indian business partner arrives 30 minutes late for your lunch meeting in Mumbai without having sent advance notice.",
      question: "How should you respond to this in the business context?",
      options: [
        { text: "Express visible frustration — punctuality is a professional standard.", correct: false, explanation: "While your feeling is understandable, expressing visible frustration in this context is counterproductive. Indian business culture is generally more flexible about time, and relationships take precedence over strict schedules." },
        { text: "Greet him warmly and begin the meeting without drawing attention to the delay.", correct: true, explanation: "Correct. In Indian business culture, particularly in relationship-driven contexts, time flexibility is more accepted than in Northern European or East Asian settings. A warm, non-judgmental welcome maintains the relationship and sets a productive tone for the meeting." },
        { text: "Suggest you reschedule — the meeting cannot now run to proper time.", correct: false, explanation: "Rescheduling over a 30-minute delay would signal rigidity and damage the relationship. Adapt gracefully and proceed." },
        { text: "Tell him directly that punctuality matters to you for future meetings.", correct: false, explanation: "Raising this directly in a first meeting is likely to come across as confrontational and culturally insensitive. Gentle communication of expectations can happen over time as the relationship develops." },
      ]
    }
  },
  {
    title: "Vegetarian Considerations",
    pillar: 4, region_code: "IN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are hosting an Indian business client for dinner in your city. You have booked an Italian restaurant known for its excellent veal and seafood.",
      question: "What consideration should you make before the dinner?",
      options: [
        { text: "None — the restaurant is excellent and the menu speaks for itself.", correct: false, explanation: "A significant proportion of Indian business people are vegetarian for religious or cultural reasons, and many who are not vegetarian avoid beef. Booking without checking risks creating a very uncomfortable dining experience." },
        { text: "Ask your client in advance about dietary requirements, and choose a restaurant with strong vegetarian and non-beef options.", correct: true, explanation: "Correct. India has one of the highest rates of vegetarianism in the world, and beef is avoided by many Hindu Indians. Asking your client in advance — or choosing a restaurant with excellent vegetarian options as a default — is both considerate and professionally thoughtful." },
        { text: "Order a vegetarian dish yourself so they feel comfortable — your choice models the option.", correct: false, explanation: "Ordering vegetarian for yourself does not help your client navigate the menu. The consideration needs to happen before the reservation." },
        { text: "Tell your client this is a special restaurant and trust them to find something suitable.", correct: false, explanation: "A restaurant with a menu centred on veal and seafood places a vegetarian or beef-avoiding client in a very difficult position. Thoughtful advance consideration is the host's responsibility." },
      ]
    }
  },
  {
    title: "Gift Etiquette in India",
    pillar: 1, region_code: "IN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You bring a gift to an Indian colleague's home in Hyderabad. He accepts it graciously but does not open it in front of you.",
      question: "What does this behaviour signal?",
      options: [
        { text: "He is indifferent to the gift — he would have opened it if pleased.", correct: false, explanation: "Not opening gifts immediately is a common Indian cultural practice and has nothing to do with indifference." },
        { text: "This is typical — in Indian culture, gifts are often opened privately after the guest has left.", correct: true, explanation: "Correct. Unlike in the West where opening a gift in front of the giver is expected, many Indian cultural contexts — particularly among older generations — consider opening gifts privately more polite. It avoids any awkwardness around the gift's value or suitability." },
        { text: "He will open it later because he is busy now — he will thank you by message.", correct: false, explanation: "The non-immediate opening is a cultural practice, not a matter of timing. It is normal regardless of how busy the host appears." },
        { text: "You should gently encourage him to open it now — showing your gift is part of the exchange.", correct: false, explanation: "Pressing someone to open a gift immediately goes against the grain of the cultural convention. Allow the norm to stand." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEXICO (MX)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "The Abrazo Greeting",
    pillar: 3, region_code: "MX", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You meet a Mexican business contact for the second time at a social gathering in Mexico City. He opens his arms for a hug (abrazo).",
      question: "What is the appropriate response?",
      options: [
        { text: "Step back and offer a handshake — professional distance is important.", correct: false, explanation: "Stepping back from an abrazo offer from a Mexican who considers you already acquainted sends a signal of coldness that can damage the relationship." },
        { text: "Reciprocate the abrazo warmly — embrace and perhaps a pat on the back.", correct: true, explanation: "Correct. In Mexico, the abrazo is a natural expression of warmth and trust between acquaintances. Reciprocating it with genuine warmth signals that you value the relationship — one of the central currencies of Mexican social life." },
        { text: "Accept the hug but remain stiff — your discomfort is understandable.", correct: false, explanation: "A stiff or reluctant abrazo communicates discomfort with the person and the culture. A genuine, warm response is expected." },
        { text: "Apologise and explain that you prefer not to hug — personal preferences are valid.", correct: false, explanation: "While personal preferences are always valid, explaining them in this context creates awkwardness and can seem overly formal. A gentle reciprocation is the socially fluid response." },
      ]
    }
  },
  {
    title: "Tequila Appreciation",
    pillar: 5, region_code: "MX", age_group: "25-55", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "Your Mexican host pours two glasses of premium añejo tequila from a bottle you recognise as exceptional. He raises his glass and says 'Salud!'",
      question: "What is the most appropriate response and drinking behaviour?",
      options: [
        { text: "Down the shot immediately — that is how tequila is traditionally consumed.", correct: false, explanation: "Shooting a premium añejo tequila like a bar shot would be an insult to the spirit and the gesture. Premium tequila is sipped, not shot." },
        { text: "Raise your glass, respond 'Salud!', and sip the tequila slowly — treating it as you would a fine whisky.", correct: true, explanation: "Correct. Premium tequila — particularly añejo and extra añejo — is sipped and appreciated, not shot. The 'salt and lime' ritual belongs to mixto tequila in bars, not to a fine quality 100% agave spirit offered by a connoisseur host." },
        { text: "Ask for a beer instead — tequila is too strong.", correct: false, explanation: "Declining a premium tequila offered by a Mexican host in favour of beer misses the significance of the gesture. Accept and sip graciously." },
        { text: "Add the lime and salt your host provided — they are there for a reason.", correct: false, explanation: "If no lime or salt was provided, your host is signalling that this is a sipping tequila. Adding salt and lime to premium añejo is considered gauche." },
      ]
    }
  },
  {
    title: "Relationship Before Business — Mexico",
    pillar: 1, region_code: "MX", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are in Mexico City for a first business meeting with a potential partner. You arrive prepared with a detailed proposal and want to begin immediately.",
      question: "What approach should you adopt at the start of this first meeting?",
      options: [
        { text: "Launch straight into the proposal — your Mexican partner is a professional and time is valuable.", correct: false, explanation: "Mexican business culture prioritises personal relationship above the transactional agenda. Opening a first meeting with an immediate business pitch can seem cold and presumptuous." },
        { text: "Open with genuine small talk — family, food, football, or your impressions of the city — before moving to business.", correct: true, explanation: "Correct. In Mexico, personal warmth and confianza (trust) are prerequisites for business. Taking 15–30 minutes of genuine conversation before introducing a proposal signals respect and that you value the person, not just the transaction." },
        { text: "Hand over your written proposal immediately and let it speak for itself.", correct: false, explanation: "A written document before a relationship has been established creates distance rather than trust. Personal connection precedes the document." },
        { text: "Ask about the business objectives first — showing focus and preparation.", correct: false, explanation: "Business objectives come after rapport in the Mexican model. Lead with warmth and allow the business conversation to develop naturally." },
      ]
    }
  },
  {
    title: "Mexican Formal Address",
    pillar: 3, region_code: "MX", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are introduced to a senior Mexican executive named Dr. Carlos Ramírez Gómez in a formal setting.",
      question: "How should you address him?",
      options: [
        { text: "As 'Carlos' — Mexicans are warm and first names are used quickly.", correct: false, explanation: "While Mexicans are warm, a first meeting in a formal business setting requires the appropriate title and formal surname. Using a first name without invitation is too familiar." },
        { text: "As 'Doctor Ramírez' — using his title and paternal surname.", correct: true, explanation: "Correct. In Mexico, the paternal surname comes first (Ramírez, in 'Ramírez Gómez'). Using his title (Doctor, Licenciado, Ingeniero) and paternal surname is the respectful address for a first formal meeting. He may invite you to use first names soon after." },
        { text: "As 'Mr. Gómez' — the last surname is the family name.", correct: false, explanation: "In the Spanish naming convention, the paternal (first) surname is the primary one. 'Gómez' is the maternal surname. He is 'Ramírez'." },
        { text: "As 'Don Carlos' — an honorary title that shows respect.", correct: false, explanation: "'Don' is an informal respect marker used among people who know each other well. It is not the appropriate address for a first formal business meeting." },
      ]
    }
  },
  {
    title: "Late Dining Hours",
    pillar: 4, region_code: "MX", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "Your Mexican host invites you to dinner at his home for '9 p.m.'. You are used to dining at 6:30 p.m. and are already feeling hungry at 8 p.m.",
      question: "What does a 9 p.m. dinner invitation actually signal, and how should you prepare?",
      options: [
        { text: "You should eat something beforehand — dinner will not be until well past 9 p.m.", correct: false, explanation: "Eating a full meal before your host's dinner would be insulting to the cook. However, having a light snack to manage hunger before a late Mexican dinner is sensible." },
        { text: "Dinner at 9 p.m. in Mexico is perfectly normal — adjust your expectations and perhaps have a light snack earlier.", correct: true, explanation: "Correct. Mexico, like much of Latin America, dines late by Northern European or North American standards. Dinner at 9 or 10 p.m. is standard. Eating something small to tide yourself over without spoiling your appetite is practical preparation." },
        { text: "Arrive at 9 p.m. sharp — Mexican hosts expect punctuality at home dinners.", correct: false, explanation: "Mexican social time is generally more flexible. Arriving 15–30 minutes after the stated time is often expected and appropriate." },
        { text: "Call ahead and suggest an earlier time — 9 p.m. is too late for productive conversation.", correct: false, explanation: "Suggesting a schedule change to accommodate your personal eating habits would be presumptuous and rude. Adapt to the local norm." },
      ]
    }
  },
  {
    title: "Mezcal vs. Tequila",
    pillar: 5, region_code: "MX", age_group: "25-55", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "At a social gathering in Oaxaca, your host offers you a glass of mezcal. You have never tried it before.",
      question: "What is the culturally correct approach to receiving and drinking mezcal in Oaxaca?",
      options: [
        { text: "Decline — you prefer tequila and the two are essentially the same.", correct: false, explanation: "Mezcal and tequila are distinct spirits. In Oaxaca, mezcal is a source of deep cultural pride. Declining it in favour of tequila — or conflating the two — is a social error." },
        { text: "Accept with genuine curiosity, sip it slowly, and express interest in the agave variety.", correct: true, explanation: "Correct. Oaxacan mezcal is a craft spirit made from various agave varieties, each with its own character. Accepting it with genuine curiosity and asking about the agave honours the tradition and your host's pride in the regional product." },
        { text: "Drink it quickly — mezcal is meant to be shot.", correct: false, explanation: "Premium mezcal, like premium tequila, is sipped. Shooting artisanal mezcal would be as inappropriate as shooting single malt Scotch." },
        { text: "Ask for a salt and orange slice — that is the correct mezcal accompaniment.", correct: false, explanation: "While sal y naranja (salt and orange) are sometimes served with mezcal, offering them is the host's prerogative. Simply sip and enjoy the spirit as presented." },
      ]
    }
  },
  {
    title: "Comida — The Important Meal",
    pillar: 4, region_code: "MX", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "A Mexican colleague invites you to 'comida' at 2:30 p.m. You assume this is lunch.",
      question: "What does comida in Mexico actually mean in terms of meal significance?",
      options: [
        { text: "A light midday snack — the main meal is dinner.", correct: false, explanation: "In Mexico, comida is the largest meal of the day — not a snack. The equivalent of dinner elsewhere." },
        { text: "The main meal of the day, served in the early-to-mid afternoon — equivalent to the evening dinner in other cultures.", correct: true, explanation: "Correct. La comida (2–4 p.m.) is the anchor of the Mexican daily eating pattern. It is a multi-course, substantial meal often including soup, a main course, and dessert. The evening 'cena' is comparatively light." },
        { text: "A two-course lunch — similar to a European business lunch.", correct: false, explanation: "Comida is often more elaborate than a European business lunch — it is the main meal and can involve multiple courses over two or more hours." },
        { text: "Breakfast — comida literally means 'food' and in some regions refers to the morning meal.", correct: false, explanation: "While 'comida' literally means 'food', in Mexico it specifically refers to the main afternoon meal — not breakfast (desayuno)." },
      ]
    }
  },
  {
    title: "Handling a Tortilla Correctly",
    pillar: 4, region_code: "MX", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are at a traditional Mexican restaurant in Guadalajara. Fresh corn tortillas arrive at the table alongside the main course.",
      question: "What is the correct way to use and handle fresh tortillas at the table?",
      options: [
        { text: "Slice them with a knife and fork as you would bread.", correct: false, explanation: "Tortillas are torn or folded by hand, not cut with utensils. Using a knife and fork on a tortilla would look awkward and unnecessarily formal." },
        { text: "Use them by hand — tear a small piece, fold it, and use it to scoop food or wrap it around a bite.", correct: true, explanation: "Correct. Tortillas are functional eating instruments in Mexican culture — torn by hand, folded to scoop up food, or wrapped around ingredients. Eating them with your hands is entirely correct and expected." },
        { text: "Leave them on the plate — tortillas are garnish, not meant to be eaten.", correct: false, explanation: "Fresh tortillas are absolutely meant to be eaten and are central to the meal, not decoration." },
        { text: "Spread butter on them like bread rolls.", correct: false, explanation: "Tortillas are not consumed like bread with butter. They are used to scoop, wrap, and accompany the food served with them." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAZIL (BR)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "The Brazilian Greeting",
    pillar: 3, region_code: "BR", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You arrive at a social gathering in São Paulo. Your Brazilian friend introduces you to his group — five people including both men and women.",
      question: "What is the expected greeting among the group?",
      options: [
        { text: "A firm handshake with everyone — physical contact beyond that is too intimate for a first meeting.", correct: false, explanation: "In Brazilian social culture, a warm physical greeting — cheek kisses for women and mixed pairs, a handshake or abrazo between men — is the normal and expected form." },
        { text: "One cheek kiss for women and a handshake or hug for men — starting with the person nearest to you.", correct: true, explanation: "Correct. In São Paulo, one cheek kiss is the norm between women and between men and women on a first social introduction. Men greet each other with a handshake and often an abrazo if more familiar. Warmth is the register." },
        { text: "Wave generally and find a seat — casual gatherings need no formal introduction.", correct: false, explanation: "Even in casual Brazilian gatherings, individual greetings are expected. Waving from a distance signals aloofness." },
        { text: "Two cheek kisses — the same as in France.", correct: false, explanation: "São Paulo's norm is typically one cheek kiss; Rio de Janeiro uses two. The number varies by region — but warmth is constant." },
      ]
    }
  },
  {
    title: "Brazilian Time",
    pillar: 1, region_code: "BR", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are invited to a birthday party in Rio de Janeiro starting at 8 p.m. You arrive at 8:05.",
      question: "How will your early arrival likely be received?",
      options: [
        { text: "Perfectly — punctuality signals respect.", correct: false, explanation: "In Brazilian social culture, arriving at or just past the stated time for a party is considered excessively early. Guests typically arrive 30 minutes to one hour after the stated start." },
        { text: "As slightly early — Brazilians typically arrive 30–60 minutes after the stated time for social events.", correct: true, explanation: "Correct. Brazilian social time is relaxed. Arriving at the exact stated time for a casual party means you may find the host still preparing. A 30-to-60-minute window is normal and expected." },
        { text: "As late — the party should have started at 7 p.m. by Brazilian convention.", correct: false, explanation: "There is no such convention. The stated time is simply the anchor; guests arrive over a range after it." },
        { text: "With pleasant surprise — punctuality is always appreciated regardless of culture.", correct: false, explanation: "In this case, your punctuality may genuinely catch your host off-guard and still preparing. The culturally informed choice is to arrive somewhat later." },
      ]
    }
  },
  {
    title: "Churrasco Protocol",
    pillar: 4, region_code: "BR", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are a guest at a Brazilian churrasco (barbecue) in Porto Alegre. The host is at the grill. You see a piece of meat you would like.",
      question: "How should you obtain the meat you want?",
      options: [
        { text: "Approach the grill and take the piece you want.", correct: false, explanation: "Approaching the grill uninvited and serving yourself is a serious breach of Brazilian barbecue etiquette. The host controls the grill." },
        { text: "Wait for the host to come around with the meat on a skewer and accept when offered, or signal your preference.", correct: true, explanation: "Correct. At a churrasco, the host presents meat on long skewers directly to guests. Wait for the pass, point to what interests you, or make eye contact to signal you are ready. The grill and its offerings are the host's domain." },
        { text: "Ask another guest to pass the meat — it is communal food.", correct: false, explanation: "Meat at a churrasco is served directly from the grill by the host or grill master. It is not passed table-style." },
        { text: "Wait until everyone has been served before taking anything.", correct: false, explanation: "Churrasco is a continuous, informal passing of different cuts. There is no formal 'everyone served first' protocol — accept when it is offered to you." },
      ]
    }
  },
  {
    title: "Caipirinha Etiquette",
    pillar: 5, region_code: "BR", age_group: "18-55", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "Your Brazilian host serves you a caipirinha — Brazil's national cocktail made from cachaça, lime, and sugar.",
      question: "What is the appropriate appreciation of a caipirinha in Brazil?",
      options: [
        { text: "Drink it quickly — caipirinhas are casual drinks and formality is out of place.", correct: false, explanation: "While caipirinhas are casual and convivial, appreciating the balance of the drink and commenting on it warmly is the appropriate gesture." },
        { text: "Accept it warmly, taste it, and comment positively — the caipirinha is a point of national pride.", correct: true, explanation: "Correct. The caipirinha is Brazil's national cocktail and Brazilians take quiet pride in it. Accepting it with genuine pleasure and noting how good it is — especially if the cachaça is quality — creates an immediate moment of connection." },
        { text: "Ask for a weaker version — it looks very strong.", correct: false, explanation: "Requesting a weaker version of your host's cocktail — especially a national drink being offered as hospitality — is mildly ungracious. Accept and sip at your own pace." },
        { text: "Decline and ask for a beer instead — it is more refreshing.", correct: false, explanation: "Declining the national cocktail in favour of beer misses an opportunity for genuine cultural engagement. Accept the caipirinha." },
      ]
    }
  },
  {
    title: "Football in Brazil — Handle With Care",
    pillar: 3, region_code: "BR", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 3, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "You are having a casual dinner in Belo Horizonte. Football comes up. Your host supports Atlético Mineiro and mentions the local rivalry with Cruzeiro.",
      question: "You support Cruzeiro — what is the wisest approach?",
      options: [
        { text: "Declare your Cruzeiro support enthusiastically — good-natured rivalry is part of Brazilian football culture.", correct: false, explanation: "Declaring the rival club in the home of an Atlético Mineiro supporter during a first social meal requires careful reading of the tone. Good-natured banter is possible but should follow the host's lead, not yours." },
        { text: "Acknowledge the rivalry with warmth and humour, and follow your host's lead on how seriously to take it.", correct: true, explanation: "Correct. Football rivalries in Brazil are deeply felt. Disclosing your rival club is fine — but with lightness, humour, and attentiveness to whether your host takes the rivalry lightly or seriously. Let the host set the register." },
        { text: "Pretend to support Atlético — honesty is less important than harmony.", correct: false, explanation: "Pretending support you do not have will likely unravel during the conversation and create genuine awkwardness. Be honest — but be warm and light about it." },
        { text: "Avoid all football conversation — it is too divisive in Brazil.", correct: false, explanation: "Avoiding football entirely in Brazil would be an unnecessary over-correction. Football is a universal language of connection. Navigate it with warmth, not avoidance." },
      ]
    }
  },
  {
    title: "Dress in Brazil",
    pillar: 2, region_code: "BR", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are invited to a smart business event in São Paulo — a client drinks reception. The invitation does not specify dress code.",
      question: "What is the appropriate approach to dress in a Brazilian business social context?",
      options: [
        { text: "Business formal — a dark suit is always safe.", correct: false, explanation: "São Paulo's business culture does lean more formal than Rio, but a heavy dark suit for a drinks reception can be overdressed. A smart, styled look is more precise." },
        { text: "Stylish and well-put-together — Brazilians value a confident, considered appearance.", correct: true, explanation: "Correct. Brazilians — particularly in São Paulo's business world — appreciate style and grooming. A clean, well-cut outfit with deliberate detail is ideal. The standard is not stiffness but confident polish." },
        { text: "Casual — Brazil is hot and relaxed about dress.", correct: false, explanation: "Casualness at a business social event in São Paulo would be underdressed. The climate does not dictate dress standards in professional contexts." },
        { text: "Copy whatever your host is wearing — matching is the safest option.", correct: false, explanation: "You may not have seen your host's outfit in advance. Develop your own read of the event level and dress accordingly." },
      ]
    }
  },
  {
    title: "Never Rush a Brazilian Meal",
    pillar: 4, region_code: "BR", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are at a long Sunday lunch in a Brazilian family home. It is now 4 p.m. and you have another engagement at 5:30. You begin to show signs of wanting to leave.",
      question: "What is the culturally appropriate way to handle departing from a Brazilian family meal?",
      options: [
        { text: "Check your watch openly and explain that you have another commitment at 5:30.", correct: false, explanation: "Checking your watch openly at a Brazilian family meal signals impatience with the company, which is considered rude. Meals are social events and rushing them is disrespectful." },
        { text: "Give 30 minutes' notice warmly, thank the host effusively, and take your leave graciously — allowing time for the social departure ritual.", correct: true, explanation: "Correct. Brazilian farewells can be as long as 30 minutes themselves — multiple rounds of thanks, conversation at the door, and warm embraces. Plan your departure in advance to allow time for this ritual without appearing rushed." },
        { text: "Slip out quietly to avoid disrupting the meal.", correct: false, explanation: "Leaving without a proper goodbye would be considered very impolite in Brazilian family culture. The farewell is part of the meal." },
        { text: "Stay until the meal naturally ends — your other engagement can wait.", correct: false, explanation: "This is the ideal, but if it is not possible, a gracious advance notice and warm departure is perfectly acceptable. Simply do not rush it." },
      ]
    }
  },
  {
    title: "Açaí and Food Pride",
    pillar: 1, region_code: "BR", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "Your Brazilian colleague in Belém proudly tells you about açaí — a regional berry from the Amazon. He describes the way it is traditionally eaten locally versus how it is prepared abroad.",
      question: "What is the culturally appropriate response to this conversation?",
      options: [
        { text: "Tell him you have tried açaí bowls at home and they are delicious.", correct: false, explanation: "This response, while friendly, shifts the conversation to your version of açaí — which Brazilians from Belém often find quite different from the authentic preparation. Better to express genuine curiosity about the local tradition first." },
        { text: "Express genuine curiosity about the traditional preparation and ask how locals eat it.", correct: true, explanation: "Correct. Regional food pride is deep in Brazil, and açaí from Belém is viewed very differently from the sweet bowls popular internationally. Showing genuine curiosity about the local and authentic version — and letting your host explain — is the ideal response." },
        { text: "Mention that açaí is now available globally — Brazil's foods are becoming world-famous.", correct: false, explanation: "While this is true, framing Brazil's products through their global popularity rather than their local significance misses the point of your host's pride in the authentic, local tradition." },
        { text: "Change the subject — food conversations can become lengthy.", correct: false, explanation: "In Brazil, food conversations are central and a source of pride. Changing the subject would signal disinterest in something your host clearly values." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPAIN (ES)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "The Spanish Schedule",
    pillar: 1, region_code: "ES", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are visiting Madrid and are surprised to see restaurants still buzzing with lunch diners at 4 p.m. A colleague invites you to dinner at 10 p.m.",
      question: "What does the Spanish daily schedule tell you about accepting this dinner invitation?",
      options: [
        { text: "Dinner at 10 p.m. is too late — suggest 8 p.m. as a compromise.", correct: false, explanation: "8 p.m. would be an early dinner by Spanish standards and might result in a near-empty restaurant. Accept 10 p.m. as perfectly normal." },
        { text: "Accept — 10 p.m. is entirely standard for dinner in Madrid.", correct: true, explanation: "Correct. Spanish daily life operates on a later schedule than most of Europe. Lunch runs from 2–4 p.m., siesta or rest follows, and dinner begins from 9 or 10 p.m. Accepting this gracefully is part of embracing Spanish culture." },
        { text: "Accept but eat beforehand so you are not hungry waiting.", correct: false, explanation: "Eating a full meal before your host's dinner would spoil your appetite and diminish the experience your host is offering. If needed, have a small tapas snack at 8 p.m. to tide you over." },
        { text: "Accept and ask if the restaurant can serve you something earlier while you wait.", correct: false, explanation: "This request would be out of place in a Spanish restaurant where 10 p.m. is simply normal. Adapt your expectations rather than seeking accommodation." },
      ]
    }
  },
  {
    title: "Tapas Culture",
    pillar: 4, region_code: "ES", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are out with Spanish friends in Seville at a tapas bar. Multiple small plates arrive and are placed in the centre of the table.",
      question: "What is the correct approach to sharing tapas?",
      options: [
        { text: "Serve yourself from each plate onto your individual plate before anyone else takes from it.", correct: false, explanation: "Tapas are communal — served in the centre for all to share from. Serving yourself onto a separate plate and claiming portions is not the spirit of tapas culture." },
        { text: "Eat directly from the shared plates using the provided utensils or your hands, as appropriate.", correct: true, explanation: "Correct. Tapas are meant to be shared from the communal plates at the centre. Pick from the plates as they circulate, eat as the conversation flows, and do not portion everything out individually — the shared nature is the point." },
        { text: "Wait for the host to serve each person formally from each plate.", correct: false, explanation: "Tapas dining is informal and communal. There is no formal serving protocol — simply help yourself from the shared plates as they arrive." },
        { text: "Order a full individual dish alongside the tapas — shared plates are never sufficient.", correct: false, explanation: "Multiple tapas plates together are the meal. Ordering an individual dish on top signals that you have not understood or embraced the tapas experience." },
      ]
    }
  },
  {
    title: "Two Kisses in Spain",
    pillar: 3, region_code: "ES", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are introduced to a Spanish woman at a Barcelona social gathering. She leans forward to greet you.",
      question: "What is the typical greeting in Spain in this context?",
      options: [
        { text: "A handshake — Spain is professional in social greetings.", correct: false, explanation: "A handshake between men and women in a social (non-formal professional) setting is uncommon in Spain. La bise with two kisses is the norm." },
        { text: "Two cheek kisses, starting on the right.", correct: true, explanation: "Correct. In Spain, two cheek kisses — starting on the right — are the standard social greeting between women and between men and women. Men typically greet each other with a handshake, unless close friends." },
        { text: "One cheek kiss — the same as in many other European countries.", correct: false, explanation: "Spain uses two cheek kisses, not one. Stopping after one would leave your companion mid-greeting." },
        { text: "Three cheek kisses — generosity of greeting is valued in Spain.", correct: false, explanation: "Three kisses is the Belgian norm, not the Spanish. Two is the Spanish standard." },
      ]
    }
  },
  {
    title: "Sobremesa — The Art of Lingering",
    pillar: 4, region_code: "ES", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are at a long Spanish lunch with colleagues in Valencia. The meal has been served, coffee is on the table, and an hour has passed since the main course. Everyone is still talking. You have a meeting in two hours.",
      question: "What does the Spanish concept of sobremesa tell you about this situation?",
      options: [
        { text: "You should begin wrapping up — two hours is more than enough for lunch.", correct: false, explanation: "In Spain, sobremesa — the time spent lingering at the table after eating — is one of the most valued parts of the meal. Suggesting it be concluded early would be culturally inappropriate." },
        { text: "Sobremesa is the cherished post-meal conversation period — participate fully and only leave when essential.", correct: true, explanation: "Correct. La sobremesa is a Spanish institution — the unhurried conversation, coffee, and often digestivo that follows a meal. It can last an hour or two and is considered as important as the food itself. Engaging warmly and leaving only when genuinely necessary is the expected behaviour." },
        { text: "Ask for the bill immediately — it will signal to the group that the meal is over.", correct: false, explanation: "Calling for the bill during sobremesa would be a jarring interruption of a valued ritual. If you must leave, excuse yourself quietly and warmly, but do not terminate the session for others." },
        { text: "Check your phone to signal your availability is limited.", correct: false, explanation: "Checking your phone during a Spanish meal and sobremesa is considered very rude. Your presence should be whole." },
      ]
    }
  },
  {
    title: "Spanish Wine Protocol",
    pillar: 5, region_code: "ES", age_group: "25-55", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are hosting a Spanish colleague at a restaurant and the wine list includes a good Rioja Reserva. Your colleague mentions she enjoys Tempranillo.",
      question: "How should you proceed with the wine selection?",
      options: [
        { text: "Order the most prestigious label on the list — prestige signals generosity in Spain.", correct: false, explanation: "Ordering for prestige alone, ignoring the preference your colleague has expressed, is poor hosting. She has given you valuable information to use." },
        { text: "Select a well-regarded Rioja Reserva Tempranillo and tell her why you chose it — referencing her preference.", correct: true, explanation: "Correct. Your colleague has signalled her preference. Choosing a quality Rioja Reserva and explaining that you selected it because it matched her taste demonstrates attentiveness and genuine hosting instinct." },
        { text: "Defer entirely to her — 'You choose, you know Spanish wine better than I do.'", correct: false, explanation: "As the host, wine selection is your responsibility. Deferring entirely — even to a knowledgeable guest — is an abdication of the hosting role." },
        { text: "Order a rosado (rosé) — Spain is famous for it and it appeals to everyone.", correct: false, explanation: "Your colleague has expressed a specific preference for Tempranillo. Ordering a rosado instead ignores this and selects for generic appeal rather than genuine attentiveness." },
      ]
    }
  },
  {
    title: "Late Breakfast in Spain",
    pillar: 1, region_code: "ES", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You arrive at your Madrid hotel at 9 a.m. and head to the café next door for breakfast. The menu offers churros con chocolate. It is a Tuesday.",
      question: "Is ordering churros con chocolate for a regular Tuesday breakfast in Madrid unusual?",
      options: [
        { text: "Yes — churros are a weekend or special occasion treat.", correct: false, explanation: "While churros are associated with weekend breakfasts and late-night post-event eating in some regions, they are not limited to special occasions. A mid-morning churros is entirely normal in Madrid." },
        { text: "No — churros con chocolate is a perfectly acceptable weekday breakfast in Madrid.", correct: true, explanation: "Correct. The combination of churros with thick hot chocolate is a beloved Spanish breakfast staple, enjoyed at any time of the week. In Madrid particularly, the famous Chocolatería San Ginés is open at all hours." },
        { text: "Yes — Spaniards only eat toast (tostada) for weekday breakfast.", correct: false, explanation: "While tostada con tomate y aceite is a common Spanish breakfast, particularly in the south, churros are a widespread and entirely acceptable weekday option." },
        { text: "Only if you are over 60 — churros are an old-fashioned breakfast.", correct: false, explanation: "Churros are consumed across all ages in Spain. They are very much an active part of current Spanish food culture." },
      ]
    }
  },
  {
    title: "Splitting the Bill — Spain",
    pillar: 4, region_code: "ES", age_group: "18-55", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "After a dinner with Spanish friends in Barcelona, the bill arrives. One friend offers to pay the whole thing, saying it is his turn.",
      question: "What is the expected response and the typical Spanish approach to group dining bills?",
      options: [
        { text: "Insist on splitting equally — rotating rounds of generosity is not the Spanish norm.", correct: false, explanation: "Both patterns exist in Spain — rotating host responsibility and splitting equally. Insisting on splitting when someone has clearly offered is slightly ungracious." },
        { text: "Accept graciously if it is genuinely his turn, and offer sincerely to host next time.", correct: true, explanation: "Correct. Among friends in Spain, treating in turn is common — one person pays, another hosts next time. Accepting graciously and committing to reciprocate next time is the socially aligned response." },
        { text: "Divide the bill by the number of people and pay your exact portion.", correct: false, explanation: "While splitting is also normal in Spain, when a friend has explicitly offered and declared 'it is my turn', a firm calculation and payment of your share can seem to dismiss the gesture." },
        { text: "Argue for paying the entire bill yourself — generosity should be yours.", correct: false, explanation: "Competing to pay when someone has already claimed the bill creates an unnecessary scene. Accept the gesture and plan to reciprocate." },
      ]
    }
  },
  {
    title: "Flamenco Appreciation",
    pillar: 1, region_code: "ES", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You attend a flamenco performance in Seville with a Spanish host. The dancing is intense and emotionally charged. Other audience members occasionally call out 'Olé!'",
      question: "Is it appropriate to join in with 'Olé!' as a non-Spaniard in this setting?",
      options: [
        { text: "No — only Spaniards may call 'Olé' at a flamenco performance.", correct: false, explanation: "There is no rule limiting 'Olé' to Spaniards. The issue is timing and sincerity." },
        { text: "Yes — but only at moments of genuine emotional intensity in the performance, never mechanically.", correct: true, explanation: "Correct. 'Olé' is an expression of authentic emotional response to the power of the performance — called out at moments of peak intensity. Calling it at random or simply because others do sounds hollow. Feel the moment; respond to it genuinely." },
        { text: "Yes — call it frequently to show your appreciation and enthusiasm.", correct: false, explanation: "Frequent or mechanical 'Olé' calls diminish the meaning of the expression. It should arise spontaneously from a genuine moment of connection with the performance." },
        { text: "No — applaud instead, as Olé is culturally appropriative for non-Spaniards.", correct: false, explanation: "There is no cultural appropriation concern with calling 'Olé' sincerely at a flamenco performance. The concern is that it be genuine rather than performative." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COLOMBIA (CO)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Tinto — Never Refuse Coffee",
    pillar: 5, region_code: "CO", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You arrive at a business meeting in Bogotá. Before discussions begin, a small cup of black coffee (tinto) is placed in front of you.",
      question: "What is the correct response to the tinto?",
      options: [
        { text: "Decline — you have already had coffee this morning.", correct: false, explanation: "Tinto is Colombia's cultural handshake — offered as hospitality and an expression of welcome. Declining it for personal reasons is ungracious." },
        { text: "Accept it gratefully and drink it — tinto is a gesture of Colombian hospitality.", correct: true, explanation: "Correct. Colombian coffee, particularly the small black tinto, is the national drink of hospitality. Accepting it — even just sipping — honours your host's welcome. Colombia is one of the world's great coffee producers, and tinto is a source of genuine national pride." },
        { text: "Ask for milk or sugar — you prefer your coffee white.", correct: false, explanation: "Tinto is traditionally served black and requesting milk or sugar is a minor breach of the ritual. Accept it as offered." },
        { text: "Ask for tea instead — you prefer not to have caffeine.", correct: false, explanation: "Requesting an alternative to tinto before even tasting it is dismissive of the gesture. Accept, take a sip, and appreciate your host's offering." },
      ]
    }
  },
  {
    title: "Colombian Warmth",
    pillar: 3, region_code: "CO", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You arrive at a social gathering in Medellín. Your Colombian friend introduces you to his extended family — parents, siblings, and cousins. They are all very warm and expressive.",
      question: "What is the expected greeting among the group?",
      options: [
        { text: "A polite handshake with everyone and a nod.", correct: false, explanation: "In Colombia, particularly among a friend's family, a handshake alone would feel cool and distant. A warm greeting with cheek kisses is expected." },
        { text: "One cheek kiss with women and a warm handshake with men, perhaps a hug if the atmosphere is particularly warm.", correct: true, explanation: "Correct. Colombian social greetings are warm and physical. A cheek kiss with women and a handshake — or abrazo — with men is the norm. Match the warmth of the family you are meeting." },
        { text: "Wave and smile — physical greetings can feel invasive.", correct: false, explanation: "Waving from a distance would be perceived as standoffish in a Colombian family setting. Engage warmly." },
        { text: "Kiss both cheeks of every person — two kisses is the Colombian standard.", correct: false, explanation: "Colombia typically uses one cheek kiss (not two) in social greetings, though warmth and a handshake or hug often accompany it." },
      ]
    }
  },
  {
    title: "Usted in Colombia",
    pillar: 3, region_code: "CO", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are speaking Spanish with a Colombian colleague in Cartagena. You are unsure whether to use usted or tú.",
      question: "What is distinctive about Colombian Spanish pronoun use?",
      options: [
        { text: "Colombians always use tú — formal address is old-fashioned.", correct: false, explanation: "This is incorrect. Colombians, particularly in Bogotá and many regions, use usted much more broadly than in other Spanish-speaking countries — even with close friends and family." },
        { text: "Usted is used much more broadly in Colombia than in other Spanish-speaking countries — even between close friends and within families.", correct: true, explanation: "Correct. In Colombia (especially in Bogotá), usted is not purely formal — it is used between equals, friends, and even family members as a sign of warmth and respect. Defaulting to usted until tú is invited is the safest and most respectful approach." },
        { text: "Use tú with people your age and usted only with elders.", correct: false, explanation: "This rule applies in some Spanish-speaking countries but not Colombia, where usted is used widely regardless of age or familiarity." },
        { text: "Both are fine — Colombians are flexible about pronouns.", correct: false, explanation: "While some flexibility exists, the Colombian tendency to use usted broadly makes it the safer default, particularly in a professional or initial social context." },
      ]
    }
  },
  {
    title: "Aguardiente Culture",
    pillar: 5, region_code: "CO", age_group: "18-55", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "At a festive gathering in Cali, a bottle of aguardiente (anise-flavoured spirit) is placed on the table and your host pours a small glass for you.",
      question: "What is the appropriate response?",
      options: [
        { text: "Decline — anise spirits are an acquired taste.", correct: false, explanation: "Aguardiente is Colombia's most popular spirit and a cultural institution. Declining the offer at a festive gathering can seem standoffish." },
        { text: "Accept it, raise a toast, and drink — aguardiente is Colombia's national drink and a key part of social bonding.", correct: true, explanation: "Correct. Aguardiente (meaning 'firewater') is deeply embedded in Colombian social culture. Accepting it at a festive gathering — even just a sip with a warm toast — signals openness and respect for the tradition." },
        { text: "Accept but ask for ice and a mixer — pure spirit is too strong.", correct: false, explanation: "Aguardiente is typically consumed as served — neat, or with a small amount of water. Asking for a mixer would be unusual in a Colombian festive setting." },
        { text: "Pour it discretely into a plant — you have already had enough alcohol.", correct: false, explanation: "If you genuinely cannot drink more, a gracious and honest explanation is always preferable to deception, which risks discovery and embarrassment." },
      ]
    }
  },
  {
    title: "Formal Address in Colombian Business",
    pillar: 3, region_code: "CO", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are in a first business meeting in Bogotá. Your counterpart holds a law degree and goes by Doctor López.",
      question: "How should you address him?",
      options: [
        { text: "As 'Mr. López' — the 'Doctor' title is reserved for medical professionals.", correct: false, explanation: "In Colombia (and much of Latin America), 'Doctor' (Dr.) is used for lawyers, economists, and other professionals with advanced degrees — not only medical doctors. Using it correctly shows cultural awareness." },
        { text: "As 'Doctor López' — Colombian professional culture uses titles liberally for qualified professionals.", correct: true, explanation: "Correct. In Colombia, professional titles are used and respected. A lawyer, economist, or senior professional addressed as 'Doctor' takes this as natural and appropriate. Using the title correctly signals you understand and respect the local professional culture." },
        { text: "As 'López' — surnames alone are respectful in Latin business.", correct: false, explanation: "Using a surname alone, without a title, can seem dismissive or overly familiar in a Colombian first business meeting." },
        { text: "By his first name immediately — Colombian business culture is informal.", correct: false, explanation: "While Colombians are warm, first names in a formal first business meeting are typically used only when invited. The formal address with title is the respectful starting point." },
      ]
    }
  },
  {
    title: "Punctuality in Colombia",
    pillar: 1, region_code: "CO", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are scheduled for a business meeting in Bogotá at 10 a.m. You arrive at 10:00 precisely. Your Colombian counterpart has not yet arrived.",
      question: "What is the culturally correct response to a Colombian meeting starting late?",
      options: [
        { text: "Express frustration after 10 minutes — a business meeting requires punctuality.", correct: false, explanation: "In Colombian business culture, a moderate delay is common and expressing frustration early would damage the relationship before it has begun." },
        { text: "Wait patiently for up to 20–30 minutes before following up — flexibility is part of Colombian business culture.", correct: true, explanation: "Correct. Colombia has a more flexible relationship with time than Northern European or East Asian cultures. A 15–30 minute delay in a meeting is not uncommon and should be met with patience. Follow up politely if the delay extends further." },
        { text: "Leave after 15 minutes — your time is equally valuable.", correct: false, explanation: "Leaving after 15 minutes would permanently damage the relationship. The local norm must be accommodated." },
        { text: "Call immediately at 10:01 to ask where he is.", correct: false, explanation: "Calling at 10:01 signals extreme rigidity and would make a poor impression. Allow a reasonable grace period before following up." },
      ]
    }
  },
  {
    title: "Bandeja Paisa",
    pillar: 4, region_code: "CO", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are invited to a traditional Colombian lunch in Medellín and a bandeja paisa is placed in front of you — a very large platter with beans, rice, plantain, chicharrón, arepa, eggs, and avocado.",
      question: "What is the culturally correct approach to a bandeja paisa?",
      options: [
        { text: "Ask for a smaller portion — the plate is too large to be polite.", correct: false, explanation: "The bandeja paisa's generous portions are the point. Requesting a smaller version would miss the cultural spirit of the dish — an expression of Antioquian hospitality and abundance." },
        { text: "Accept it with enthusiasm, compliment the spread, and eat as much as you can.", correct: true, explanation: "Correct. The bandeja paisa is a point of Antioquian regional pride and its abundance is intentional and celebratory. Accepting it with genuine enthusiasm and eating what you can (no obligation to finish everything) honours your host's gesture." },
        { text: "Ask which items are mandatory to eat — you want to respect the tradition precisely.", correct: false, explanation: "There is no mandatory item on a bandeja paisa. Eat what appeals to you and appreciate the generosity of the spread." },
        { text: "Share with others at the table — the plate is clearly designed for sharing.", correct: false, explanation: "The bandeja paisa is an individual serving, not a sharing plate, despite its size. It represents individual hospitality to each guest." },
      ]
    }
  },
  {
    title: "Salsa in Cali",
    pillar: 1, region_code: "CO", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "At a social gathering in Cali, the music shifts to salsa and your Colombian friends begin to dance. They invite you to join.",
      question: "What is the most culturally appropriate response?",
      options: [
        { text: "Decline politely — you cannot dance salsa and do not want to embarrass yourself.", correct: false, explanation: "Declining a dance invitation in Cali — the salsa capital of the world — can seem overly reserved and miss a significant cultural bonding opportunity." },
        { text: "Accept with a smile, acknowledge you are learning, and allow your partner to guide you.", correct: true, explanation: "Correct. Caleños are proud of their salsa and warmly appreciate anyone who tries, however imperfectly. Accepting with a spirit of joy and openness — and letting your partner lead — is both culturally correct and genuinely memorable." },
        { text: "Watch from the side — admiring salsa is as good as participating.", correct: false, explanation: "Watching from the side when invited to dance is a mild social refusal in this context. Participation — even imperfect — is the invitation's intention." },
        { text: "Join only if you know you can dance well — poor salsa would embarrass your host.", correct: false, explanation: "Caleños are generous dance teachers and do not expect expertise from guests. The warmth of the attempt matters far more than the quality of the footwork." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UAE (AE)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Modest Dress in Dubai",
    pillar: 2, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are visiting Dubai for business and plan to spend a weekend afternoon at the Dubai Mall before a dinner.",
      question: "What dress standard applies in a UAE shopping mall?",
      options: [
        { text: "Beach wear is fine — Dubai is cosmopolitan and modern.", correct: false, explanation: "Beach wear is appropriate only at beach and pool areas. Malls, markets, and public spaces in the UAE require covered shoulders and knees at minimum — this applies to both men and women." },
        { text: "Covered shoulders and knees at minimum — smart casual is appropriate for a public mall.", correct: true, explanation: "Correct. The UAE, while internationally open, maintains a dress code for public spaces including malls. Signs at entrances often remind visitors. Smart casual with covered shoulders and knees is always appropriate and respectful." },
        { text: "Any western clothing is acceptable — dress codes only apply to mosques.", correct: false, explanation: "Dress codes apply to public spaces, not only places of worship. Modest dress is expected throughout public life in the UAE." },
        { text: "Formal business attire is required at all times in Dubai.", correct: false, explanation: "Smart casual is appropriate for public spaces like malls. Business formal is for professional meetings." },
      ]
    }
  },
  {
    title: "Accepting Arabic Coffee and Dates",
    pillar: 5, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You enter a business meeting in Abu Dhabi. Before any discussion begins, a server brings a small cup of gahwa (Arabic coffee) and a bowl of dates.",
      question: "What is the correct response to this hospitality?",
      options: [
        { text: "Decline both — you have already had breakfast.", correct: false, explanation: "Declining the gahwa and dates at a first meeting in the UAE is a significant breach of hospitality etiquette. These are offered as a formal welcome gesture and declining is considered rude." },
        { text: "Accept the coffee and dates, consume them graciously, and show appreciation.", correct: true, explanation: "Correct. Gahwa (lightly spiced Arabic coffee) and dates are the formal welcome of Emirati hospitality. Accepting and enjoying them signals respect for the culture and gratitude for the welcome. When you are finished, hold the cup and give a small shake to indicate you have had enough." },
        { text: "Accept the dates but refuse the coffee — caffeine is not for everyone.", correct: false, explanation: "Selective acceptance can still give offence. Accept both and consume what you can graciously." },
        { text: "Ask for regular espresso — you prefer stronger coffee.", correct: false, explanation: "Requesting a replacement for the offered gahwa dismisses the gesture. Accept what is offered; espresso can be requested later if needed." },
      ]
    }
  },
  {
    title: "The Right Hand in the UAE",
    pillar: 4, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are at a business meeting in Dubai and wish to pass a document to your Emirati host.",
      question: "Which hand should you use to pass the document?",
      options: [
        { text: "Either hand — both are equally acceptable.", correct: false, explanation: "In Emirati and broader Arab culture, the left hand is considered impure and used for personal hygiene. Passing objects, food, or documents with the left hand is considered disrespectful." },
        { text: "The right hand — the left hand is considered unclean in Islamic tradition.", correct: true, explanation: "Correct. Throughout the Arab world and in Islamic tradition, the right hand is used for eating, greeting, giving, and receiving. Using your left hand to pass an object can cause quiet offence." },
        { text: "Both hands — a two-handed presentation shows formality.", correct: false, explanation: "While a two-handed presentation is respectful in some cultures (Japan, Korea), in the UAE the right hand alone is appropriate. Two hands are not required." },
        { text: "Ask your host's preference — norms vary across the UAE.", correct: false, explanation: "The right hand preference is consistent across the UAE and broader Arab culture. No need to ask; simply use your right hand." },
      ]
    }
  },
  {
    title: "Ramadan Observance",
    pillar: 1, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "You are visiting Dubai during Ramadan for a week-long business trip. It is 1 p.m. and you are hungry. You wish to eat your lunch.",
      question: "What is the correct protocol regarding eating in public during Ramadan in the UAE?",
      options: [
        { text: "Eat anywhere you wish — the rule applies only to Muslims.", correct: false, explanation: "Eating, drinking, or smoking in public during Ramadan daylight hours is illegal in the UAE for all people, regardless of religion. The law applies to all residents and visitors." },
        { text: "Eat only in designated areas — restaurants may be open but screened, and eating in public spaces is restricted.", correct: true, explanation: "Correct. During Ramadan, consuming food or drink in public areas during daylight hours is prohibited in the UAE (including for non-Muslims). Many restaurants continue to operate but screen their windows. Private spaces and hotel rooms are appropriate for daytime eating." },
        { text: "Eat discreetly and quickly — light snacking is generally overlooked.", correct: false, explanation: "Any visible eating or drinking in public spaces during Ramadan daylight hours violates UAE law and should be avoided entirely, not done discreetly." },
        { text: "Ask your Emirati colleagues whether it is allowed — the rules change each year.", correct: false, explanation: "The rules are consistent. Eating in public during Ramadan daylight hours is prohibited for everyone in the UAE. No need to check; simply eat in private." },
      ]
    }
  },
  {
    title: "Greeting an Emirati Host",
    pillar: 3, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You arrive at a meeting with an Emirati male colleague and his Emirati female colleague. You wish to greet both.",
      question: "What is the correct greeting protocol?",
      options: [
        { text: "Shake hands with both — professional settings override gender conventions.", correct: false, explanation: "In the UAE, physical contact between unrelated men and women is generally avoided in traditional settings. Initiating a handshake with an Emirati woman can cause discomfort." },
        { text: "Shake hands with the male colleague and wait — if the female colleague extends her hand, shake it; if not, bow slightly.", correct: true, explanation: "Correct. With an Emirati male colleague, a handshake is appropriate. With a female Emirati colleague, do not initiate physical contact — wait to see if she offers her hand. If she does, shake it warmly; if not, a smile and slight bow acknowledges her respectfully." },
        { text: "Bow to both — physical greetings should be avoided entirely.", correct: false, explanation: "A handshake with male Emirati colleagues is perfectly appropriate. The adjustment applies to interactions with Emirati women who have not signalled willingness to shake hands." },
        { text: "Place your hand on your heart and nod — this is the universal Islamic greeting.", correct: false, explanation: "While placing your hand on your heart is a respectful gesture, it is not the universal protocol for all UAE business greetings. A handshake with men remains the standard professional greeting." },
      ]
    }
  },
  {
    title: "Friday in the UAE",
    pillar: 1, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You wish to schedule a business meeting with an Emirati partner for Friday morning.",
      question: "What should you know about scheduling meetings on Fridays in the UAE?",
      options: [
        { text: "Friday is a standard working day in the UAE — no different from Monday.", correct: false, explanation: "Friday is the Islamic day of prayer and the first day of the weekend in the UAE. Scheduling a business meeting on a Friday morning — particularly before Jumu'ah prayers — would be inappropriate." },
        { text: "Friday is the UAE's equivalent of Sunday — the day of rest and prayer. Business meetings should not be scheduled.", correct: true, explanation: "Correct. The UAE weekend falls on Friday and Saturday (in line with the recent calendar adjustment, with some federal entities shifting to Saturday–Sunday). Friday is sacred as the day of Jumu'ah prayers. Scheduling business for Friday morning, in particular, should be avoided." },
        { text: "Meetings can be scheduled on Fridays after 12 p.m. — prayers are in the morning only.", correct: false, explanation: "While Friday afternoons are technically less restricted, the spirit of the day and cultural norms make Friday a day to avoid business scheduling in the UAE." },
        { text: "Friday rules vary by industry — confirm with your partner before assuming.", correct: false, explanation: "While some international businesses operate differently, the cultural default in the UAE is that Friday morning is for prayers and rest. Do not assume availability." },
      ]
    }
  },
  {
    title: "No Alcohol at an Emirati Gathering",
    pillar: 5, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are invited to dinner at an Emirati colleague's home. You wish to bring a bottle of wine as a gift.",
      question: "Is bringing wine an appropriate gift for an Emirati host?",
      options: [
        { text: "Yes — wine is available in Dubai and is a universally appreciated gift.", correct: false, explanation: "Bringing alcohol to a Muslim Emirati home is deeply inappropriate. Most Emiratis abstain from alcohol for religious reasons, and introducing it into the home is disrespectful." },
        { text: "No — alcohol should not be brought to an Emirati home. Premium dates, baklava, or quality sweets are far more appropriate.", correct: true, explanation: "Correct. Alcohol is inappropriate as a gift for a Muslim Emirati host. Premium dates, pastries, high-quality Arabic sweets, or saffron make thoughtful and well-received alternatives." },
        { text: "Yes — Dubai is an international city and cultural norms are flexible there.", correct: false, explanation: "The Emirati host is Muslim, and bringing alcohol to their home is inappropriate regardless of Dubai's international character." },
        { text: "Ask before bringing — some Emiratis do drink.", correct: false, explanation: "Asking your host whether they drink is unnecessarily awkward and places the burden on them. Default to an appropriate non-alcoholic gift." },
      ]
    }
  },
  {
    title: "Islamic Greeting in the UAE",
    pillar: 3, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You meet an Emirati colleague in the corridor of a Dubai office. He greets you with 'As-salamu alaykum'.",
      question: "What is the appropriate and respectful response?",
      options: [
        { text: "Reply 'Hello' — you are not Muslim and the greeting is religious.", correct: false, explanation: "Responding to a traditional Islamic greeting with 'Hello' is not wrong, but it misses an opportunity to signal respect and cultural awareness." },
        { text: "Reply 'Wa alaykum as-salam' — the traditional response.", correct: true, explanation: "Correct. 'Wa alaykum as-salam' ('And upon you peace') is the respectful and universally appreciated response. Non-Muslims in the UAE are welcome to use it — it is a greeting of peace and returning it in kind is always warmly received." },
        { text: "Say nothing — responding to a religious greeting as a non-Muslim could be seen as appropriative.", correct: false, explanation: "There is no cultural appropriation concern with returning a greeting of peace. Not responding would seem rude." },
        { text: "Reply in Arabic: 'Marhaba' — it is a neutral Arabic greeting.", correct: false, explanation: "'Marhaba' (hello) is a fine alternative in casual settings, but returning 'Wa alaykum as-salam' directly to 'As-salamu alaykum' is the most appropriate and respectful response." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UNITED STATES (US)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Small Talk in America",
    pillar: 3, region_code: "US", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You arrive for a business meeting in New York. Before the meeting begins, your American colleague asks: 'How are you doing today?'",
      question: "What does this question signal in the American context?",
      options: [
        { text: "A genuine inquiry into your wellbeing — answer honestly and in detail.", correct: false, explanation: "'How are you doing?' in an American context is typically a phatic greeting, not a genuine inquiry. Answering with a detailed emotional report would be unexpected." },
        { text: "A social ritual — a brief, positive response ('Great, thanks — and you?') is expected.", correct: true, explanation: "Correct. In American professional and social culture, 'How are you?' is a standard greeting ritual, not an invitation for a detailed personal update. A brief, positive response and returning the question is the expected and socially smooth reply." },
        { text: "An invitation to discuss any concerns about the upcoming meeting.", correct: false, explanation: "This reading interprets a social ritual as a practical opener. The meeting-relevant conversation begins after these pleasantries." },
        { text: "A sign that the meeting has been cancelled — they are delaying out of politeness.", correct: false, explanation: "Small talk before a meeting is entirely standard in American business culture and signals nothing about the meeting itself." },
      ]
    }
  },
  {
    title: "American First Names",
    pillar: 3, region_code: "US", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are introduced to James Robertson, Senior VP of a major New York firm. He says, 'Call me Jim.'",
      question: "What is the correct response?",
      options: [
        { text: "Continue to address him as 'Mr. Robertson' — senior executives deserve formal titles.", correct: false, explanation: "When an American explicitly invites you to use their first name, continuing with a formal title is overly stiff and ignores a direct social cue." },
        { text: "Accept the invitation and call him 'Jim' — American business culture quickly adopts first names.", correct: true, explanation: "Correct. American professional culture almost universally moves to first names, especially when explicitly invited. 'Jim' it is — and you should offer your own first name in return if you have not done so already." },
        { text: "Use 'Jim' only when speaking casually, but 'Mr. Robertson' in more formal moments of the meeting.", correct: false, explanation: "Switching back and forth between 'Jim' and 'Mr. Robertson' within a meeting would seem inconsistent. Once first names have been invited, use them throughout." },
        { text: "Ask him to confirm — 'Are you sure?' — out of politeness.", correct: false, explanation: "Questioning the invitation creates an awkward moment. Simply accept and use 'Jim'." },
      ]
    }
  },
  {
    title: "Tipping in America",
    pillar: 4, region_code: "US", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You finish a restaurant meal in Chicago. The bill arrives for $120. You are pleased with the service.",
      question: "What tip amount is expected at a table-service restaurant in America?",
      options: [
        { text: "5–8% — a small additional recognition of service.", correct: false, explanation: "5–8% is considered a poor tip in the US and signals dissatisfaction. Service workers in America depend on tips as a primary income source, with federal minimum wage for tipped workers as low as $2.13/hour in some states." },
        { text: "18–22% of the pre-tax bill for good service.", correct: true, explanation: "Correct. The standard tip in American restaurants for good service is 18–20%. 22% or more signals exceptional service. Anything below 15% communicates dissatisfaction, and not tipping is deeply offensive and financially harmful to the server." },
        { text: "10% — the international standard.", correct: false, explanation: "10% is below the American convention. Other countries' tipping norms do not apply in the US, where tipping culture is specifically and significantly different." },
        { text: "No tip is necessary if a service charge was added.", correct: false, explanation: "In many American establishments, a service charge (often for large groups) is a gratuity, and no additional tip is required. Check whether the charge is already included before tipping again." },
      ]
    }
  },
  {
    title: "Business Casual in America",
    pillar: 2, region_code: "US", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are invited to a 'business casual' event at a San Francisco tech company office.",
      question: "What does 'business casual' mean in a Silicon Valley tech context?",
      options: [
        { text: "A full business suit with a loosened tie — formal dress with minor adjustments.", correct: false, explanation: "A full suit would be conspicuously overdressed at a tech company business casual event. The Valley has its own interpretation of professional dress." },
        { text: "Clean, well-fitted clothing — quality jeans, chinos, a neat shirt or blouse; no suit required.", correct: true, explanation: "Correct. In Silicon Valley, 'business casual' leans heavily toward casual — quality jeans, a well-fitted shirt, and clean shoes would be entirely appropriate. The standard is polished but relaxed. A suit would stand out." },
        { text: "T-shirts and sneakers — tech companies are entirely informal.", correct: false, explanation: "While tech culture is casual, 'business casual' still implies a level of consideration beyond everyday casual wear. A clean, well-fitted look is appropriate." },
        { text: "The same as business formal — 'casual' is a polite word for smart.", correct: false, explanation: "Business casual is genuinely different from business formal. In a tech context especially, the distinction is pronounced." },
      ]
    }
  },
  {
    title: "The American Handshake",
    pillar: 3, region_code: "US", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are meeting an American business executive for the first time at a Los Angeles conference.",
      question: "What is the expected greeting and handshake style in American business culture?",
      options: [
        { text: "A very firm, prolonged handshake — strength signals confidence.", correct: false, explanation: "An excessively firm or prolonged handshake can come across as aggressive. The American standard is firm and brief — confident without being crushing." },
        { text: "A firm, confident handshake with direct eye contact and a warm smile.", correct: true, explanation: "Correct. The American business handshake is firm, confident, and brief — accompanied by direct eye contact and a warm smile. These elements together signal professionalism, confidence, and approachability." },
        { text: "A gentle handshake — Americans are informal and a softer touch is more relaxed.", correct: false, explanation: "A limp or weak handshake in an American business context suggests a lack of confidence. Firmness is expected." },
        { text: "Avoid handshakes — post-pandemic norms make them optional.", correct: false, explanation: "The handshake has largely returned in American business settings post-pandemic. Follow your counterpart's lead, but the handshake remains the standard professional greeting." },
      ]
    }
  },
  {
    title: "Splitting the Bill — America",
    pillar: 4, region_code: "US", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You go out for dinner with American friends in Boston. The bill arrives.",
      question: "What is the typical American approach to splitting a dinner bill among friends?",
      options: [
        { text: "The eldest person pays — seniority determines the host.", correct: false, explanation: "No such convention exists in American casual dining. Splitting the bill is the default among friends." },
        { text: "Each person pays for what they ordered — separate bills or a calculated split is entirely normal.", correct: true, explanation: "Correct. Americans are comfortable with precise bill-splitting. Separate checks, a calculated equal share, or a payment app (Venmo, etc.) are all common and culturally normal. There is no social awkwardness in requesting separate checks." },
        { text: "The person who suggested the restaurant pays the whole bill.", correct: false, explanation: "Suggesting a restaurant does not assign bill responsibility in American dining culture. Splitting is the default unless someone explicitly offers to host." },
        { text: "Round up to the nearest ten and leave that as a combined tip.", correct: false, explanation: "Tipping protocol is separate from bill-splitting and both require attention. Tip 18–22% in addition to paying your share of the food." },
      ]
    }
  },
  {
    title: "Networking in America",
    pillar: 3, region_code: "US", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are at a New York professional networking event. An American attendee introduces herself, talks briefly about her firm, and asks what you do.",
      question: "What is the expected tone and content of your response?",
      options: [
        { text: "A modest, vague response — self-promotion is impolite in most cultures.", correct: false, explanation: "American networking culture actively expects clear, confident self-description. Vague modesty can be mistaken for disengagement or lack of substance." },
        { text: "A clear, confident introduction of yourself, your role, and a specific value proposition or interesting hook.", correct: true, explanation: "Correct. American networking culture rewards the 'elevator pitch' — a concise, confident, and specific summary of who you are and what you do. Including something memorable or distinctive (an interesting client, a recent project) makes you stand out." },
        { text: "Ask them multiple questions before mentioning yourself — interest in others is the priority.", correct: false, explanation: "While genuine curiosity is valued, entirely deflecting from sharing your own profile when directly asked is unusual in American networking. Share yourself, then show interest." },
        { text: "Mention your company and leave the rest to their curiosity.", correct: false, explanation: "Company alone is insufficient. A clear description of your role and what makes you or your work interesting is what networking conversations require in the US." },
      ]
    }
  },
  {
    title: "Doggy Bag in America",
    pillar: 4, region_code: "US", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are at a business lunch in Washington D.C. You ordered more food than you can eat and there is still half a portion remaining.",
      question: "Is it appropriate to ask for a takeaway box for the remaining food at an American business lunch?",
      options: [
        { text: "No — requesting a takeaway box at a business lunch is undignified.", correct: false, explanation: "In the UK or Germany, this might seem unusual. In the US, requesting a takeaway box ('doggy bag') at any restaurant — including at a business lunch — is perfectly normal and does not carry social stigma." },
        { text: "Yes — requesting a box to take food home is completely normal in American dining culture.", correct: true, explanation: "Correct. American restaurant culture normalises the takeaway box request at every level of restaurant. It is a practical, resourceful habit and carries no social judgement. Simply ask the server for a box." },
        { text: "Only at casual restaurants — business dining has a different standard.", correct: false, explanation: "While business lunches have certain standards, requesting a takeaway box is not considered impolite at any American restaurant, including more formal ones." },
        { text: "Ask your colleague if they mind first — the request might seem unusual to international guests.", correct: false, explanation: "In the US, no such consultation is needed. The request is universally understood and expected." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NETHERLANDS (NL)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Dutch Directness",
    pillar: 3, region_code: "NL", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "In an Amsterdam board meeting, you present a proposal. A Dutch colleague immediately responds: 'I don't think this will work because of two specific problems I've identified.'",
      question: "How should you interpret this feedback?",
      options: [
        { text: "He is hostile — direct criticism in a meeting is aggressive.", correct: false, explanation: "In Dutch culture, directness is a virtue, not aggression. Being told clearly what is wrong is considered helpful and respectful." },
        { text: "He is engaging constructively — direct feedback is the Dutch cultural norm and signals genuine interest.", correct: true, explanation: "Correct. The Netherlands has one of the most direct communication cultures in the world. A colleague who identifies specific problems is doing you a service. Engage with the substance of his critique, not the manner of its delivery." },
        { text: "He is showing off — the Netherlands is competitive and colleagues undermine each other.", correct: false, explanation: "This misreads the cultural norm. Direct challenge to ideas is not personal competition — it is how Dutch colleagues engage with proposals professionally." },
        { text: "He should have raised this privately — public criticism is inappropriate.", correct: false, explanation: "In Dutch meetings, direct challenge in the room is standard and expected. The Dutch do not typically soften feedback for the sake of group comfort." },
      ]
    }
  },
  {
    title: "Going Dutch",
    pillar: 4, region_code: "NL", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You go for dinner with Dutch colleagues in Rotterdam. When the bill arrives, everyone pulls out their cards simultaneously.",
      question: "What does 'going Dutch' mean in this context, and why is it the expected norm?",
      options: [
        { text: "Each person pays for the most expensive item they ordered.", correct: false, explanation: "Going Dutch simply means each person pays their own portion of the bill, not a specific most-expensive item." },
        { text: "Each person pays their own share — equality and fairness are deeply valued in Dutch culture.", correct: true, explanation: "Correct. 'Going Dutch' (paying your own share) is deeply embedded in Dutch cultural values of equality and avoiding obligation. One person paying for others creates an imbalance of debt that Dutch culture typically prefers to avoid." },
        { text: "The youngest person pays — seniority brings privilege in the Netherlands.", correct: false, explanation: "There is no such convention in Dutch culture. Individual payment is the norm regardless of age." },
        { text: "The Dutch are stingy — this is a cultural stereotype, not an actual practice.", correct: false, explanation: "Paying one's own share is a genuine cultural preference in the Netherlands, rooted in values of egalitarianism and avoiding social obligation — not stinginess." },
      ]
    }
  },
  {
    title: "Jenever Etiquette",
    pillar: 5, region_code: "NL", age_group: "25-55", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are at a traditional Dutch brown café (bruin café) in Amsterdam. Your host orders two glasses of jenever (Dutch gin). Yours is filled to the very brim.",
      question: "How is the first sip of a brimming jenever glass correctly taken?",
      options: [
        { text: "Pick up the glass carefully and tilt it slightly to avoid spilling.", correct: false, explanation: "Tilting a brimming glass to drink risks spilling. The traditional Dutch method is to lean down to the glass, not lift it." },
        { text: "Lean forward and take the first sip directly from the glass on the bar without lifting it.", correct: true, explanation: "Correct. A jenever glass poured to the brim is traditionally first sipped from the bar without lifting the glass — a practice called the 'kopstoot' setup. This is the culturally expected first sip ritual, honouring the tradition of the drink." },
        { text: "Ask the bartender to pour slightly less — a full glass is impractical.", correct: false, explanation: "A glass filled to the brim is intentional. The tradition is to sip it in place first." },
        { text: "Pour a small amount into your beer glass to reduce the level before picking it up.", correct: false, explanation: "The kopstoot (a jenever alongside a beer) is a separate tradition. Pouring jenever into your beer unprompted breaks both rituals." },
      ]
    }
  },
  {
    title: "Dutch First Names",
    pillar: 3, region_code: "NL", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You meet a Dutch senior executive, Pieter van den Berg, at a professional event in Utrecht.",
      question: "How should you address him?",
      options: [
        { text: "As 'Mr. van den Berg' — formal titles are appropriate at a first professional meeting.", correct: false, explanation: "Dutch business culture moves to first names very quickly — often immediately. Using Mr. van den Berg would feel surprisingly formal to a Dutch professional." },
        { text: "As 'Pieter' — Dutch business culture adopts first names almost immediately.", correct: true, explanation: "Correct. The Netherlands is highly egalitarian in professional culture. First names are used from the outset in almost all professional contexts. Waiting for permission to use first names would seem unnecessarily formal." },
        { text: "As 'Van den Berg' — the surname alone shows respect.", correct: false, explanation: "Using only a surname is uncommon in Dutch professional settings. First names are the norm." },
        { text: "Ask him what he prefers — cultural norms vary within the Netherlands.", correct: false, explanation: "While asking is polite, the default across the Netherlands is first names from the start. Asking creates unnecessary formality." },
      ]
    }
  },
  {
    title: "Stroopwafel Protocol",
    pillar: 5, region_code: "NL", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "During a business meeting in The Hague, coffee is served and a stroopwafel is placed on the side of each cup.",
      question: "What is the correct way to enjoy a stroopwafel with coffee?",
      options: [
        { text: "Eat it immediately alongside the coffee — it is just a biscuit.", correct: false, explanation: "The stroopwafel is designed to be placed on top of the coffee cup to allow the steam to warm and soften the caramel filling. Eating it cold misses the best part of the experience." },
        { text: "Balance it on top of the hot coffee cup for a minute to soften the caramel, then eat it.", correct: true, explanation: "Correct. The stroopwafel is meant to be placed flat on top of a hot cup of coffee or tea for about 30 seconds to one minute. The steam softens the syrup filling and enhances the flavour significantly. This is the intended and most enjoyable way to eat one." },
        { text: "Dip it in the coffee — this is the Dutch way.", correct: false, explanation: "Stroopwafels are not meant to be dipped directly into coffee. The steam-softening method (balanced on top) is the correct approach." },
        { text: "Save it for after the meeting — eating during a business meeting is impolite.", correct: false, explanation: "A stroopwafel offered with coffee is intended to be eaten during the meeting. Saving it for later would be unnecessarily restrained." },
      ]
    }
  },
  {
    title: "Bicycle Culture in the Netherlands",
    pillar: 1, region_code: "NL", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are a pedestrian walking in Amsterdam near a canal. You accidentally step into a clearly marked cycle lane.",
      question: "What is the correct response?",
      options: [
        { text: "Wait for approaching cyclists to pass you — they should slow down.", correct: false, explanation: "Cycle lanes in the Netherlands have priority and cyclists are not expected to slow for pedestrians who have entered the lane. Move out of the lane immediately." },
        { text: "Move out of the cycle lane immediately and use only the pedestrian path.", correct: true, explanation: "Correct. The Netherlands has one of the most developed cycling infrastructures in the world, and cyclists have clear right of way in cycle lanes. Pedestrians stepping into cycle lanes are considered a hazard. Move out promptly and stay on pedestrian routes." },
        { text: "Walk quickly through — cyclists are used to sharing with pedestrians.", correct: false, explanation: "Cycle lanes are for cyclists exclusively. Continuing to walk through would frustrate cyclists who have priority." },
        { text: "Make eye contact with an approaching cyclist and wait for their approval to pass.", correct: false, explanation: "Simply exit the cycle lane promptly — no negotiation is needed or appropriate." },
      ]
    }
  },
  {
    title: "Dutch Tolerance Culture",
    pillar: 1, region_code: "NL", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "During a social dinner in Amsterdam, a Dutch guest makes a direct and challenging comment about your country's politics. He seems genuinely interested in debate.",
      question: "What is the most culturally appropriate response?",
      options: [
        { text: "Change the subject — politics at dinner is inappropriate.", correct: false, explanation: "Dutch dinner conversations can be quite direct and substantive, including on political topics. Changing the subject can seem evasive." },
        { text: "Engage directly with the substance of his point — Dutch culture values open, frank discourse on all topics.", correct: true, explanation: "Correct. The Dutch have a long tradition of frank, tolerant public discourse. Engaging directly and honestly — even in disagreement — is considered respectful and intellectually serious. Avoiding the topic would be seen as lacking conviction." },
        { text: "Agree politely to avoid conflict — social harmony is always the priority.", correct: false, explanation: "Insincere agreement runs against the grain of Dutch directness. If you disagree, say so clearly and engage with the argument." },
        { text: "Take offence — political comments about other countries are rude.", correct: false, explanation: "The Dutch tendency to challenge and debate ideas is not intended as personal insult. Engagement is the expected and appropriate response." },
      ]
    }
  },
  {
    title: "The Dutch Birthday Greeting",
    pillar: 3, region_code: "NL", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You attend a Dutch birthday party. The birthday person's mother, sister, and uncle are also present. They greet you at the door.",
      question: "What is the distinctive Dutch birthday greeting protocol?",
      options: [
        { text: "Wish only the birthday person happy birthday — the party is for them.", correct: false, explanation: "This misses a particularly Dutch social custom. At a Dutch birthday, you are expected to congratulate the family members and friends of the birthday person as well." },
        { text: "Congratulate not only the birthday person but also their family members and close friends — 'Gefeliciteerd met je moeder's verjaardag!'", correct: true, explanation: "Correct. One of the most distinctly Dutch customs is congratulating the birthday person's entire inner circle on the occasion. 'Congratulations on your mother's birthday!' ('Gefeliciteerd met je moeder's verjaardag!') is a perfectly normal and expected thing to say to the birthday person's family." },
        { text: "Give a gift to the birthday person and a small token to family members.", correct: false, explanation: "While thoughtful, gifts to family members are not expected. The congratulation is the distinctive custom." },
        { text: "Sing 'Happy Birthday' in Dutch — Lang zal ze leven — as soon as you arrive.", correct: false, explanation: "Singing Lang zal ze leven is typically done as a group at a certain point, not upon individual arrival. The verbal congratulation to the family is the key custom to observe." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PORTUGAL (PT)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "The Long Portuguese Lunch",
    pillar: 4, region_code: "PT", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are in Lisbon for a business visit. Your Portuguese partner suggests lunch at 1 p.m. It is now 3:30 p.m. and the meal and conversation are still ongoing.",
      question: "What is the appropriate response to a long Portuguese business lunch?",
      options: [
        { text: "Politely suggest wrapping up — you have afternoon meetings to attend.", correct: false, explanation: "In Portugal, the business lunch is a relationship-building institution. Rushing it signals that the relationship is less important than the schedule — a significant misstep." },
        { text: "Embrace the duration — a long lunch in Portugal signals genuine hospitality and investment in the relationship.", correct: true, explanation: "Correct. Portuguese business culture is relationship-led, and the long lunch is one of its primary expressions. Participating fully and without apparent time pressure communicates that you value the relationship. If possible, clear your afternoon before a Portuguese business lunch." },
        { text: "Check your phone discreetly to flag your other commitments.", correct: false, explanation: "Checking your phone at a Portuguese business meal to signal time pressure communicates that the meal — and therefore the relationship — is lower priority than your schedule." },
        { text: "Excuse yourself after two hours regardless — anything longer is excessive.", correct: false, explanation: "Two hours is not a rule. Portuguese lunches that build genuine relationships sometimes extend to three hours or more. The relationship is the business." },
      ]
    }
  },
  {
    title: "Relationship Before Business — Portugal",
    pillar: 1, region_code: "PT", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You arrive at a first business meeting in Porto with a potential partner. You have 45 minutes and a full agenda prepared.",
      question: "What approach should you take to the agenda?",
      options: [
        { text: "Move through the agenda efficiently — your Portuguese partner will appreciate preparation.", correct: false, explanation: "While preparation is appreciated, moving through an agenda at speed without first building personal rapport misses the relational prerequisite of Portuguese business culture." },
        { text: "Begin with genuine personal conversation — family, Porto, food, shared experiences — before turning to business.", correct: true, explanation: "Correct. Portuguese business culture is relationship-led. Before the agenda comes the person. Spending the first 15–20 minutes of a first meeting on warm, genuine personal conversation signals that you understand and respect this priority." },
        { text: "Hand over your proposal immediately — it shows you are serious and prepared.", correct: false, explanation: "A document before a relationship has been established creates distance. The proposal is for after the relationship has opened, not before." },
        { text: "Ask whether your partner prefers to start with business or conversation.", correct: false, explanation: "While considerate, asking the question suggests you are uncertain. Defaulting to conversation first is culturally informed and appropriate." },
      ]
    }
  },
  {
    title: "Port Wine Protocol",
    pillar: 5, region_code: "PT", age_group: "25-55", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "At a formal dinner in Porto, port wine is served after dessert. Your host pours a Tawny port from a decanter.",
      question: "What is the correct approach to drinking and appreciating port wine in Portugal?",
      options: [
        { text: "Drink it quickly and ask for more — showing enthusiasm for port pleases a Portuguese host.", correct: false, explanation: "Port is a sipping wine meant to be savoured. Drinking it quickly and asking for refills misreads the pace and spirit of the ritual." },
        { text: "Sip it slowly, express genuine appreciation for the style (Tawny), and engage the host in conversation about it.", correct: true, explanation: "Correct. Port wine is one of Portugal's greatest cultural and commercial treasures, and Tawny is a complex, aged variety. Sipping slowly, noting the flavour, and showing genuine curiosity about the wine honours the host's selection and the country's tradition." },
        { text: "Drink it with ice — port is typically served chilled in Portugal.", correct: false, explanation: "Port wine should not be served or drunk with ice. Tawny port is served lightly chilled or at room temperature; ice would dilute and dishonour it." },
        { text: "Mix it with soda water — it reduces the alcohol content.", correct: false, explanation: "Mixing port with soda is not a Portuguese convention and would be considered a waste of a quality wine." },
      ]
    }
  },
  {
    title: "Saudade — Understanding the Word",
    pillar: 1, region_code: "PT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "During a conversation in Lisbon, your Portuguese friend mentions 'saudade' — a feeling she has when she thinks about her hometown in the Alentejo.",
      question: "How should you respond to this cultural concept?",
      options: [
        { text: "'I understand — it is like nostalgia.' Move the conversation on.", correct: false, explanation: "Equating saudade with nostalgia is an over-simplification. Saudade has deeper dimensions — it is a longing for something that may never return, tinged with beauty and melancholy simultaneously. Reducing it to nostalgia may seem dismissive." },
        { text: "Express genuine curiosity and ask her what saudade feels like — allowing her to describe it in her own words.", correct: true, explanation: "Correct. Saudade is one of the most complex and distinctive concepts in Portuguese culture and identity. It is not easily translated and means something different to each person. Inviting your friend to describe her experience of it is both culturally sensitive and deeply personal." },
        { text: "Tell her there is no equivalent in your language — it is an untranslatable feeling.", correct: false, explanation: "While true that saudade is hard to translate, this response closes the conversation rather than opening it. Show genuine interest in her experience of it." },
        { text: "Change the subject — saudade is melancholy and may not be a comfortable topic.", correct: false, explanation: "Saudade is not merely sad — it carries beauty and is a source of cultural pride in Portugal. Avoiding it misses a genuine opportunity for connection." },
      ]
    }
  },
  {
    title: "Fado Appreciation",
    pillar: 1, region_code: "PT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "Your Portuguese host takes you to a traditional fado house in Alfama, Lisbon. The fadista begins to sing. The room falls silent.",
      question: "What is the correct behaviour during a fado performance?",
      options: [
        { text: "Applaud enthusiastically after each verse — it shows appreciation.", correct: false, explanation: "Applauding between verses interrupts the continuous emotional arc of fado. Applause comes at the end of the performance." },
        { text: "Remain in attentive, respectful silence throughout and applaud warmly at the conclusion.", correct: true, explanation: "Correct. Fado demands silence and deep attention. The genre is rooted in saudade and emotional depth. Talking, moving loudly, or interrupting the silence is considered highly disrespectful. Give the performance your full, quiet presence." },
        { text: "Talk quietly with your companion — it is background music in a restaurant.", correct: false, explanation: "Fado is never background music. When a fadista performs, it is the centre of the room. The silence is part of the art form." },
        { text: "Film the performance on your phone for the memory.", correct: false, explanation: "Filming is discouraged and often prohibited in traditional fado houses. More importantly, the act of filming removes you from the emotional experience — the opposite of what fado requires." },
      ]
    }
  },
  {
    title: "Addressing Older Portuguese",
    pillar: 3, region_code: "PT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are introduced to an elderly Portuguese woman, Dona Maria, at a family gathering in Sintra.",
      question: "How should you address her?",
      options: [
        { text: "By her first name — 'Maria' — as you would in most European countries.", correct: false, explanation: "Addressing an elder Portuguese woman by first name without 'Dona' would be considered disrespectful. The title 'Dona' before the first name is the appropriate form." },
        { text: "As 'Dona Maria' — the traditional respectful title for older Portuguese women.", correct: true, explanation: "Correct. 'Dona' followed by the first name is the traditional and respectful form of address for older Portuguese women. It is a mark of courtesy and cultural sensitivity. Similarly, older men are addressed as 'Dom' or 'Senhor'." },
        { text: "As 'Senhora' with no name — titles without names are more formal.", correct: false, explanation: "'Senhora' alone is less personable than 'Dona Maria'. The title with the name is the warmest and most culturally correct form." },
        { text: "By her surname — 'Mrs. [surname]' as in English convention.", correct: false, explanation: "Portuguese convention uses 'Dona' with the first name, not the surname as in English." },
      ]
    }
  },
  {
    title: "Bacalhau — The National Dish",
    pillar: 4, region_code: "PT", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "Your Portuguese host serves you bacalhau à brás — a traditional salted codfish dish — at a family lunch in Coimbra.",
      question: "What is the culturally appropriate response to being served bacalhau?",
      options: [
        { text: "Decline — dried cod is an acquired taste and honesty is valued.", correct: false, explanation: "Declining bacalhau at a Portuguese family meal is a significant social misstep. It is the national dish, a source of deep cultural pride, and refusing it shows lack of respect for the tradition." },
        { text: "Accept with genuine appreciation and taste it with an open mind — bacalhau is Portugal's cultural treasure.", correct: true, explanation: "Correct. Bacalhau (salted dried cod) has over 365 recipes in Portuguese cooking — one for every day of the year, Portugals say. It is a national icon. Accepting it with genuine willingness and expressing appreciation honours your host and the culture." },
        { text: "Ask for a smaller portion — it looks quite rich.", correct: false, explanation: "Asking for a smaller portion before tasting suggests reluctance. Accept a full serving and eat what you can." },
        { text: "Express that you prefer fresh fish — salted cod seems like a historical workaround.", correct: false, explanation: "Commenting unfavourably on salted cod's history in the context of a family meal honouring the dish would be deeply unwelcome." },
      ]
    }
  },
  {
    title: "Portuguese Greeting",
    pillar: 3, region_code: "PT", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are at a social gathering in Lisbon and are introduced to a Portuguese couple — a man and a woman you have not met before.",
      question: "What is the standard Portuguese greeting in this context?",
      options: [
        { text: "A handshake with both — physical greetings vary by personal preference.", correct: false, explanation: "In Portugal, the standard social greeting is two cheek kisses with women and a handshake (sometimes also with two kisses if familiar) with men." },
        { text: "Two cheek kisses with the woman and a warm handshake with the man.", correct: true, explanation: "Correct. Two cheek kisses are the Portuguese norm between women and between men and women in social settings. Between men, a handshake is standard — kisses may follow if the men know each other well." },
        { text: "A single cheek kiss with both — Portugal follows the same norm as France.", correct: false, explanation: "Portugal uses two cheek kisses, not one. Starting on the right is typical, though this varies by region." },
        { text: "No physical contact — a smile and nod are appropriate for strangers.", correct: false, explanation: "Portuguese social greetings are warm and physical. A nod alone would come across as cool and reserved." },
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AFRICA (ZA)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    title: "Ubuntu in Practice",
    pillar: 1, region_code: "ZA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "You are at a community gathering in Johannesburg. A decision needs to be made that affects the whole group. The most senior person in the room has a clear preference.",
      question: "What does the Ubuntu philosophy suggest about this decision-making process?",
      options: [
        { text: "The most senior person's preference should be adopted — hierarchy is the expression of Ubuntu.", correct: false, explanation: "Ubuntu is not simply about deference to seniority — it is about collective wisdom. The group's voice matters alongside the elder's." },
        { text: "The decision should be reached through broad consultation so that everyone's voice contributes to the outcome.", correct: true, explanation: "Correct. Ubuntu ('I am because we are') frames the individual as defined by the community. Decisions that affect the group should emerge from dialogue and shared input — not unilateral authority. This is why South African community meetings (indabas) can be long but are deeply valued." },
        { text: "Let the youngest person decide — Ubuntu values youth and fresh perspectives.", correct: false, explanation: "Ubuntu does not specifically privilege youth. It values community, connection, and collective voice across all ages." },
        { text: "Avoid the decision entirely — Ubuntu means never allowing conflict to arise.", correct: false, explanation: "Ubuntu does not mean conflict avoidance. It means addressing decisions collectively and with care for everyone's dignity and input." },
      ]
    }
  },
  {
    title: "The Braai — Who Controls the Fire",
    pillar: 4, region_code: "ZA", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are invited to a braai in Cape Town. The host is managing the fire and the meat. You notice the steaks look almost done and offer to help by turning them.",
      question: "What is the appropriate response to the braai grill?",
      options: [
        { text: "Turn the steaks — you are being helpful and showing initiative.", correct: false, explanation: "The braai is the host's domain. The person managing the fire has a sacred responsibility in South African braai culture. Interfering without being invited is a significant social error." },
        { text: "Step back — the braai and everything on it belongs to the host. Offer to help with something else instead.", correct: true, explanation: "Correct. In South African braai culture, the host who manages the fire is the undisputed authority. Interfering with the grill — however well-intentioned — is a form of usurping this role. Offer to help with salads, drinks, or setting up." },
        { text: "Ask the host's permission before touching anything — 'Can I help with the meat?'", correct: false, explanation: "While polite, asking to touch the meat may put the host in an awkward position. The better move is to offer help in other areas." },
        { text: "Help only if the host has left the fire unattended.", correct: false, explanation: "Even in the host's absence, managing another's braai without explicit invitation is generally not done. Wait for the host to return." },
      ]
    }
  },
  {
    title: "Greeting in a Local Language",
    pillar: 3, region_code: "ZA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are at a community gathering in Soweto and meet a Zulu elder. You know a single Zulu phrase: 'Sawubona' (I see you).",
      question: "Is it appropriate to use this phrase, and how will it likely be received?",
      options: [
        { text: "No — using a few words of someone else's language can seem patronising.", correct: false, explanation: "In South African context, attempting a few words in someone's home language — particularly a Zulu greeting — is virtually universally received as a warm and respectful gesture." },
        { text: "Yes — even a single phrase in the local language shows genuine respect and will be warmly appreciated.", correct: true, explanation: "Correct. 'Sawubona' — 'I see you' — is a profound greeting that acknowledges the other person's full humanity. Offering it to a Zulu elder will almost certainly be received with immediate warmth and a wide smile. It signals that you know something of the culture and chose to honour it." },
        { text: "Only if you can hold a full Zulu conversation — partial knowledge is embarrassing.", correct: false, explanation: "A single sincere phrase is a greater gift than silence. No expectation of fluency is attached to a greeting." },
        { text: "Ask first whether they prefer English — not all South Africans appreciate cultural gestures.", correct: false, explanation: "Asking whether to use a Zulu greeting before a Zulu elder would be unnecessarily hesitant. Simply say 'Sawubona' and watch the response." },
      ]
    }
  },
  {
    title: "South African Wine",
    pillar: 5, region_code: "ZA", age_group: "25-55", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are at a dinner in Stellenbosch wine country. Your host pours a glass of local Pinotage — a variety unique to South Africa.",
      question: "What is the culturally appropriate response to being served Pinotage?",
      options: [
        { text: "Comment that Pinotage has a reputation for being too smoky — you prefer international varieties.", correct: false, explanation: "Criticising the national grape variety in front of a South African wine enthusiast in Stellenbosch would be quite off-putting." },
        { text: "Accept it with genuine curiosity, taste it openly, and ask about its character and origin — Pinotage is a source of South African pride.", correct: true, explanation: "Correct. Pinotage is South Africa's own grape — a cross between Pinot Noir and Cinsaut developed in the 1920s. Expressing genuine curiosity about this unique variety honours your host's pride in the local wine culture and opens a rewarding conversation." },
        { text: "Politely decline — you only drink French or Italian wines.", correct: false, explanation: "Declining wine offered in Stellenbosch in favour of European varieties is both ungracious and a missed opportunity to experience one of the world's unique wine regions." },
        { text: "Accept but do not comment — wine conversation can feel pretentious.", correct: false, explanation: "In Stellenbosch wine country, wine conversation is the most natural thing in the world. Engaging with genuine curiosity is the appropriate and enjoyable response." },
      ]
    }
  },
  {
    title: "Bring Something to the Braai",
    pillar: 4, region_code: "ZA", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are invited to a braai at a colleague's home in Pretoria for Sunday afternoon.",
      question: "What is the expected social obligation regarding what you bring?",
      options: [
        { text: "Arrive empty-handed — it is the host's responsibility to provide everything.", correct: false, explanation: "Arriving at a South African braai empty-handed is considered poor form. Contributing to the communal gathering is both expected and an expression of ubuntu." },
        { text: "Bring something to contribute — meat, drinks, a salad, or dessert.", correct: true, explanation: "Correct. The braai is a communal event and everyone is expected to contribute. Bring a good quantity of your chosen item — meat for the grill, a case of beer, a substantial salad, or a dessert. The contribution signals your commitment to the shared celebration." },
        { text: "Ask the host what to bring — it is polite to check.", correct: false, explanation: "While asking is not wrong, it is not strictly necessary. Bringing meat, drinks, or a salad is always appropriate. Simply bring something generous." },
        { text: "Bring a small token gift such as chocolates — a symbolic gesture is sufficient.", correct: false, explanation: "A small chocolate box at a braai would be inadequate. The expected contribution is a substantive food or drink item for the group to share." },
      ]
    }
  },
  {
    title: "Rainbow Nation Awareness",
    pillar: 1, region_code: "ZA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 3, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "During a conversation at a Cape Town dinner, the topic of apartheid arises. A white South African colleague makes a comment minimising its ongoing effects.",
      question: "What is the most culturally informed and sensitive response?",
      options: [
        { text: "Agree immediately — it is not your place as a visitor to challenge local views.", correct: false, explanation: "Agreeing silently with a minimisation of apartheid's legacy would not be culturally sensitive — it would be evasive. The subject deserves thoughtful engagement." },
        { text: "Listen carefully, acknowledge the complexity of the topic, and avoid taking a simplistic position as a guest.", correct: true, explanation: "Correct. South Africa's racial history is intensely complex and deeply personal for every South African. As a guest, the appropriate posture is attentive listening, thoughtful acknowledgement of the complexity, and humility about the limits of an outsider's perspective. Avoid both casual agreement and lecturing." },
        { text: "Challenge the view directly — honesty matters more than comfort.", correct: false, explanation: "Direct challenge of a South African's views on their own country's history — however well-intentioned — can come across as presumptuous from a visitor. A posture of engaged listening and careful questions is wiser." },
        { text: "Change the subject immediately — apartheid is too sensitive to discuss at dinner.", correct: false, explanation: "Changing the subject can seem dismissive of a topic that South Africans engage with daily. Thoughtful, humble engagement is the better posture." },
      ]
    }
  },
  {
    title: "Umqombothi — Accepting Traditional Beer",
    pillar: 5, region_code: "ZA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "At a traditional ceremony in a rural Zulu community, you are offered a clay pot of umqombothi — traditional sorghum beer. It is passed around the group.",
      question: "What is the appropriate response to being offered umqombothi?",
      options: [
        { text: "Decline graciously — you are uncertain about its hygiene.", correct: false, explanation: "Declining umqombothi in a traditional ceremony setting where it is being shared communally would be taken as a rejection of the community's hospitality and cultural tradition." },
        { text: "Accept with both hands, take a respectful sip, and acknowledge the gesture warmly.", correct: true, explanation: "Correct. Umqombothi carries deep cultural significance in Zulu and Xhosa communities. Being offered it is an honour. Accepting with both hands and taking a genuine sip shows respect for the tradition and the community's welcome. Your willingness matters more than your familiarity with the drink." },
        { text: "Accept but pass it on quickly without drinking — the gesture is enough.", correct: false, explanation: "Passing without sipping misses the communal act entirely. Taking a genuine sip is the appropriate and expected engagement." },
        { text: "Ask for a glass instead of drinking from the shared pot.", correct: false, explanation: "The shared pot is the traditional form. Requesting a separate glass in this setting would distance you from the communal ritual that umqombothi represents." },
      ]
    }
  },
  {
    title: "Multilingual Courtesy",
    pillar: 3, region_code: "ZA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are at a social gathering in Durban. Some guests are speaking Zulu, some Afrikaans, and some English. You speak only English.",
      question: "What is the most culturally sensitive approach to this multilingual environment?",
      options: [
        { text: "Ask everyone to speak English — it is more inclusive.", correct: false, explanation: "Requesting that others abandon their home language in a social setting to accommodate you is presumptuously self-centred. South Africa has 11 official languages and all have dignity." },
        { text: "Engage warmly in English with those who address you in English, show genuine interest in the other languages, and ask about a word or phrase.", correct: true, explanation: "Correct. Participating where you can — in English — and showing genuine curiosity about Zulu or Afrikaans demonstrates openness and respect. Even learning one word or expression and using it will be warmly received." },
        { text: "Stay silent when languages you do not understand are spoken — do not disrupt the group.", correct: false, explanation: "Complete silence is unnecessary. Warm body language, smiles, and engagement with English-speaking conversations while showing interest in the others is the right balance." },
        { text: "Leave the gathering — language barriers make meaningful participation impossible.", correct: false, explanation: "Language barriers are entirely navigable through warmth, attentiveness, and a willingness to learn. A multilingual gathering is an enriching experience, not an obstacle." },
      ]
    }
  },

  // FR — business (previously missing)
  {
    title: "The Meeting Start Time in France",
    pillar: 3, region_code: "FR", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You have a 10 h 00 meeting at a Paris office. You arrive at 09 h 58. The French colleague who scheduled it walks in at 10 h 12, greets the room warmly, and begins without apologising for the delay.",
      question: "How should you interpret and respond to this situation?",
      options: [
        { text: "Note the tardiness and mention it politely to signal that punctuality matters to you.", correct: false, explanation: "Raising the delay would embarrass your host and signal cultural inflexibility. In French professional culture a few minutes' grace is standard; the warm greeting is the real opening ritual." },
        { text: "Greet your colleague warmly, engage in brief pleasantries, and allow the meeting to begin at the colleague's pace.", correct: true, explanation: "Correct. French business culture places high value on relationship-building before diving into substance. A warm, unhurried opening — regardless of the clock — sets the right collaborative tone and signals cultural fluency." },
        { text: "Begin presenting your agenda immediately to show that you value the group's time.", correct: false, explanation: "Launching into a formal agenda before the pleasantries are complete is considered abrupt and signals that you prioritise efficiency over relationship — a poor start in a French business context." },
        { text: "Reschedule — a 12-minute delay shows disrespect for an international guest.", correct: false, explanation: "Rescheduling over a 12-minute start would be a serious overreaction. This is well within the normal flow of a French meeting opening." },
      ]
    }
  },

  // IT — business (previously missing)
  {
    title: "Exchanging Business Cards in Italy",
    pillar: 3, region_code: "IT", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "At a first business meeting in Milan, your Italian counterpart presents you with their business card using both hands and makes brief eye contact. You have your own card in your jacket pocket.",
      question: "What is the correct response?",
      options: [
        { text: "Accept the card with your right hand only, glance at it, and pocket it immediately.", correct: false, explanation: "Pocketing the card immediately without acknowledgement signals indifference. In Italian business culture the card is an extension of the person's professional identity and deserves a moment of attention." },
        { text: "Accept the card with both hands or your right hand, read it attentively for a moment, and then present your own card in return.", correct: true, explanation: "Correct. Receiving a card with visible interest — reading the name, title, and company — communicates respect. Presenting yours immediately in return completes the reciprocal ritual and enables introductions to move naturally into conversation." },
        { text: "Accept the card, write a note on it to help you remember the meeting, and thank your counterpart.", correct: false, explanation: "Writing on someone's business card in their presence is considered disrespectful in Italian business culture, as it defaces what is seen as a personal document." },
        { text: "Explain you have forgotten your cards and suggest connecting on LinkedIn instead.", correct: false, explanation: "While LinkedIn is used professionally in Italy, having no card at a first meeting creates a poor impression of preparation. Always carry cards to formal first meetings." },
      ]
    }
  },

  // ES — business (previously missing)
  {
    title: "Lunch as a Business Tool in Spain",
    pillar: 4, region_code: "ES", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "Your Spanish business partner invites you to a two-hour lunch at 14 h 00. After an hour of excellent food and conversation, business has not yet been discussed. You have a call at 16 h 00.",
      question: "What is the appropriate way to manage this situation?",
      options: [
        { text: "Steer the conversation to business matters at the earliest polite opportunity to ensure there is time to cover everything.", correct: false, explanation: "In Spain, the business lunch is primarily a relationship-building occasion. Steering to business too early signals impatience and undermines the trust the lunch is designed to build." },
        { text: "Enjoy the lunch fully and trust that business will arise naturally; if needed, quietly arrange to reschedule your 16 h 00 call.", correct: true, explanation: "Correct. The Spanish business lunch is a long-form social ritual. Being fully present — and flexible enough to protect the time — demonstrates that you value the relationship over a rigid schedule, which is exactly what your partner is assessing." },
        { text: "Excuse yourself at 15 h 45 and apologise for the constraint — efficiency must be maintained.", correct: false, explanation: "Leaving early without strong justification signals that the relationship is less important than your schedule, which can damage trust in a Spanish business context." },
        { text: "Order only a light dish so the meal finishes faster and business can begin.", correct: false, explanation: "Ordering minimally at a Spanish lunch is rude and signals disengagement. Full participation — food, wine, and conversation — is expected and appreciated." },
      ]
    }
  },

  // BR — business (previously missing)
  {
    title: "Relationship First in Brazilian Business",
    pillar: 3, region_code: "BR", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "You are attending a first business meeting in São Paulo. After introductions, your Brazilian counterpart spends twenty minutes asking about your trip, your family, and whether you have visited Brazil before. Your prepared agenda is waiting.",
      question: "How should you handle this opening phase of the meeting?",
      options: [
        { text: "Engage warmly with their questions and share openly; allow business topics to emerge naturally when the relationship warm-up feels complete.", correct: true, explanation: "Correct. Brazilian business culture operates on jeitinho and strong personal rapport before formal business. This opening phase — called conversa — is not small talk; it is a trust-building ritual that determines whether the meeting will be productive. Investing in it fully pays dividends throughout the relationship." },
        { text: "Answer briefly and redirect to the agenda to respect everyone's time.", correct: false, explanation: "Redirecting to the agenda signals that you view the relationship as transactional. In Brazil this can close doors that would otherwise have opened easily. Patience and warmth during conversa is the correct posture." },
        { text: "Match their warmth but keep answers brief to signal efficiency.", correct: false, explanation: "Brevity in this context reads as coolness or disinterest. Open, expansive conversation signals genuine engagement and is the right tone." },
        { text: "Propose setting the agenda before personal topics go too far off track.", correct: false, explanation: "Proposing a formal agenda during conversa in a Brazilian first meeting is seen as stiff and transactional. Allow the relationship to develop first." },
      ]
    }
  },

  // ZA — business (previously missing)
  {
    title: "Ubuntu in the South African Boardroom",
    pillar: 3, region_code: "ZA", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "In a mixed South African business meeting, a proposal you champion receives quiet nods but no enthusiastic agreement. The senior person present says, 'We must consult more broadly before deciding.' You had hoped for a decision today.",
      question: "What does this response signal and how should you proceed?",
      options: [
        { text: "Accept the response respectfully; broader consultation is a cultural expectation rooted in Ubuntu — collective harmony matters more than speed.", correct: true, explanation: "Correct. Ubuntu — 'I am because we are' — underpins South African professional culture, especially in Black African business contexts. Decisions that affect the group should include the group. Respecting this process and returning with a decision built on wider input will generate stronger, more durable buy-in." },
        { text: "Politely push for a decision in the room to avoid project delays.", correct: false, explanation: "Pressing for a decision against explicit deferral signals that your timeline outweighs the group's process. This damages trust and can result in a no that might otherwise have been a yes after consultation." },
        { text: "Interpret the quiet nods as informal approval and proceed on that basis.", correct: false, explanation: "Interpreting silence or nodding as consent without explicit agreement is a serious cultural misstep. An explicit collective agreement must be sought." },
        { text: "Offer a counter-proposal with a 24-hour decision deadline to manage urgency.", correct: false, explanation: "Imposing a deadline on a consultation process your hosts have defined shows disrespect for their decision-making culture and will likely backfire." },
      ]
    }
  },

  // AE — dining (previously missing)
  {
    title: "Dining During Ramadan in the UAE",
    pillar: 4, region_code: "AE", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 7,
    content_json: {
      situation: "You are visiting Dubai during Ramadan for a week of business meetings. It is 13 h 00 and you are feeling hungry. You walk past a café.",
      question: "What is the correct approach to eating and drinking during daylight hours in a public space in the UAE during Ramadan?",
      options: [
        { text: "Eat and drink freely — cafés are open and the fast only applies to Muslims.", correct: false, explanation: "While the fast is a religious obligation for Muslims, the UAE requires that eating, drinking, and smoking in public during Ramadan daylight hours be avoided out of respect. Violations can result in fines. Screen-off areas or hotel rooms are the appropriate places to eat during the day." },
        { text: "Eat discreetly at an indoor restaurant with screens — avoid eating or drinking anything in view of the public.", correct: true, explanation: "Correct. During Ramadan in the UAE, non-Muslims are expected to refrain from eating, drinking, or smoking in public during daylight hours as a mark of respect. Most hotels and restaurants set up screened areas for non-fasting guests. Observing this demonstrates cultural sensitivity and is legally required." },
        { text: "Eat quietly at an outdoor table — international visitors are exempt from Ramadan rules.", correct: false, explanation: "There is no visitor exemption for public eating during Ramadan in the UAE. Eating in public during fasting hours is disrespectful and subject to legal consequences." },
        { text: "Ask a local Muslim colleague if eating in public is acceptable — rules vary by emirate.", correct: false, explanation: "The rule applies across all seven emirates. Placing a colleague in the position of permitting behaviour that violates social norms is also uncomfortable for them." },
      ]
    }
  },

  // NL — dining (previously missing)
  {
    title: "Splitting the Bill in the Netherlands",
    pillar: 4, region_code: "NL", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You have had a relaxed dinner with three Dutch colleagues in Amsterdam. The bill arrives at the table. One colleague reaches for it and says, 'Shall we just go Dutch?'",
      question: "What does 'going Dutch' mean in this context and how should you respond?",
      options: [
        { text: "Each person pays for exactly what they ordered — split individually. Agree and calculate your share accurately.", correct: true, explanation: "Correct. 'Going Dutch' — splitting costs equally or by what each person ordered — is the entirely normal, egalitarian Dutch dining convention. There is no expectation that one person will treat the group. Accepting and calculating your share promptly and accurately is the right and expected response." },
        { text: "The most senior person should pay — offer to take the whole bill to show generosity.", correct: false, explanation: "In Dutch dining culture, neither seniority nor generosity typically overrides the preference for equal, fair splitting. Insisting on paying the whole bill can even feel uncomfortable or patronising." },
        { text: "Suggest the company expenses it — business dinners should not come from personal funds.", correct: false, explanation: "Attempting to redirect a collegial dinner to company expenses when it hasn't been arranged that way in advance is awkward and inappropriate." },
        { text: "Agree but subtly round your payment up — generosity is universally appreciated.", correct: false, explanation: "While rounding up slightly as a tip is fine, 'going Dutch' specifically signals a preference for fairness over generosity displays. Simply paying your precise share is the correct social signal." },
      ]
    }
  },
];
