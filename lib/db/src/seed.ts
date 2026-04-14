import { db } from "./index.js";
import { cultureProtocolsTable, scenariosTable } from "./schema/index.js";
import { sql } from "drizzle-orm";

const protocols: (typeof cultureProtocolsTable.$inferInsert)[] = [
  // ── UNITED KINGDOM ──────────────────────────────────────────────────────────
  // Pillar 1: Cultural Knowledge
  { region_code: "GB", pillar: 1, context: "social", rule_type: "Observe the Queue", rule_description: "The queue is sacred in British culture. Jumping it under any circumstance is a severe social transgression." },
  { region_code: "GB", pillar: 1, context: "social", rule_type: "The Art of Understatement", rule_description: "British communication relies heavily on understatement. 'Not bad' is high praise; 'quite interesting' may signal disapproval." },
  { region_code: "GB", pillar: 1, context: "social", rule_type: "Weather as Social Lubricant", rule_description: "Discussing the weather is a socially accepted opener — a neutral, universally accessible topic for beginning conversation." },
  { region_code: "GB", pillar: 1, context: "social", rule_type: "Avoid Personal Questions", rule_description: "Questions about salary, relationship status, or family planning are considered intrusive. Allow others to volunteer such information." },
  { region_code: "GB", pillar: 1, context: "social", rule_type: "Thank the Host", rule_description: "A telephone call or written note the following day thanking the host of a dinner party is considered proper form." },
  // Pillar 2: Appearance
  { region_code: "GB", pillar: 2, context: "formal", rule_type: "Err Toward Formality", rule_description: "When in doubt, dress more formally than the occasion demands. Being overdressed is far less offensive than the alternative." },
  { region_code: "GB", pillar: 2, context: "formal", rule_type: "Black Tie Precision", rule_description: "Black Tie requires a dinner jacket (tuxedo), black bow tie, and black patent leather shoes. Pre-tied bow ties are acceptable." },
  { region_code: "GB", pillar: 2, context: "business", rule_type: "Conservative Business Dress", rule_description: "Business formal is expected in the City. Subdued colours — navy, charcoal, grey — project reliability." },
  { region_code: "GB", pillar: 2, context: "social", rule_type: "Smart Casual Interpreted", rule_description: "'Smart casual' in Britain means collared shirts, chinos or tailored trousers. Denim and trainers are generally inappropriate." },
  { region_code: "GB", pillar: 2, context: "social", rule_type: "Grooming Standards", rule_description: "Fingernails should be clean and trimmed. Shoes should be polished. These small details are observed more than one might expect." },
  // Pillar 3: Eloquence
  { region_code: "GB", pillar: 3, context: "social", rule_type: "Title and Surname First", rule_description: "Address new acquaintances by title and surname until explicitly invited to use their first name." },
  { region_code: "GB", pillar: 3, context: "social", rule_type: "Indirect Refusal", rule_description: "Direct refusals are considered blunt. 'I'm afraid that might be a little difficult' signals a firm no in polite British discourse." },
  { region_code: "GB", pillar: 3, context: "social", rule_type: "Avoid Bragging", rule_description: "Self-promotion is viewed with deep suspicion. Allow your accomplishments to be discovered organically rather than announced." },
  { region_code: "GB", pillar: 3, context: "social", rule_type: "Irony and Dry Humour", rule_description: "British humour relies on irony and understatement. Learn to recognise and appreciate it; laughing at the right moment is essential." },
  { region_code: "GB", pillar: 3, context: "social", rule_type: "Controlled Volume", rule_description: "Speaking quietly in public spaces is considered a mark of breeding. Loud conversations on public transport are strongly disapproved of." },
  // Pillar 4: Table Manners
  { region_code: "GB", pillar: 4, context: "dining", rule_type: "Continental Style", rule_description: "Fork in the left hand, knife in the right throughout the meal. Do not switch hands American-style." },
  { region_code: "GB", pillar: 4, context: "dining", rule_type: "Soup Spoon Direction", rule_description: "Move the soup spoon away from you when filling it, and sip from the side of the spoon, not the tip." },
  { region_code: "GB", pillar: 4, context: "dining", rule_type: "Wait for the Host", rule_description: "Do not begin eating until the host has started, or has indicated that you may begin." },
  { region_code: "GB", pillar: 4, context: "dining", rule_type: "Elbows Off the Table", rule_description: "While eating, elbows should remain off the table. Between courses, this rule is slightly relaxed." },
  { region_code: "GB", pillar: 4, context: "dining", rule_type: "Bread Protocol", rule_description: "Break bread into small pieces rather than biting directly from the roll. Butter each piece individually as you eat it." },
  // Pillar 5: Drinks
  { region_code: "GB", pillar: 5, context: "social", rule_type: "Accept Tea Graciously", rule_description: "When offered tea, accept. Even if you do not wish it, refusal can cause slight offence. 'Just a small cup' is always acceptable." },
  { region_code: "GB", pillar: 5, context: "dining", rule_type: "Port Passes Left", rule_description: "At formal dinners, port circulates clockwise (passing to the left). One never reaches across; the decanter always travels." },
  { region_code: "GB", pillar: 5, context: "social", rule_type: "The Round System", rule_description: "In a pub, it is expected that each member of the party purchases a round in turn. Leaving before buying your round is poor form." },
  { region_code: "GB", pillar: 5, context: "dining", rule_type: "Wine at Table", rule_description: "Allow the host or sommelier to pour. Do not reach for the bottle yourself unless specifically invited to help yourself." },
  { region_code: "GB", pillar: 5, context: "social", rule_type: "Gin and Tonic Standards", rule_description: "The G&T is served in a tall glass with ice, a slice of citrus, and quality tonic. Requesting a poor tonic is quietly noted." },

  // ── CHINA ────────────────────────────────────────────────────────────────────
  // Pillar 1: Cultural Knowledge
  { region_code: "CN", pillar: 1, context: "social", rule_type: "Mianzi — The Concept of Face", rule_description: "Mianzi (face) is one's social currency. Never cause someone to lose face publicly; disagreements should be handled discreetly." },
  { region_code: "CN", pillar: 1, context: "business", rule_type: "Guanxi — The Network of Relationships", rule_description: "Guanxi (relationships) precede business. Time spent building personal rapport is a prerequisite, not a pleasantry." },
  { region_code: "CN", pillar: 1, context: "social", rule_type: "Seniority in All Things", rule_description: "Age and seniority command deference. Greet the eldest or most senior person first in any gathering." },
  { region_code: "CN", pillar: 1, context: "social", rule_type: "Sensitive Topics to Avoid", rule_description: "Do not raise Taiwan, Tibet, Tiananmen, or the political system. These topics will cause immediate discomfort and damage relationships." },
  { region_code: "CN", pillar: 1, context: "social", rule_type: "Harmony Above Directness", rule_description: "Maintaining group harmony is prioritised over direct communication. A vague answer may mean no; learn to read between lines." },
  // Pillar 2: Appearance
  { region_code: "CN", pillar: 2, context: "business", rule_type: "Conservative Business Attire", rule_description: "Business dress should be conservative and understated. Quality is noticed but ostentation is viewed with suspicion." },
  { region_code: "CN", pillar: 2, context: "social", rule_type: "Colours for Celebration", rule_description: "Red is the colour of luck and prosperity. Avoid white and black for celebratory occasions — these are associated with mourning." },
  { region_code: "CN", pillar: 2, context: "social", rule_type: "Temple Dress Code", rule_description: "When visiting temples, dress modestly. Shoulders and knees should be covered. Remove shoes when indicated." },
  { region_code: "CN", pillar: 2, context: "social", rule_type: "Green Hat Prohibition", rule_description: "Never wear a green hat when visiting a Chinese host. The expression 'wearing a green hat' implies marital infidelity." },
  { region_code: "CN", pillar: 2, context: "business", rule_type: "Grooming and Presentation", rule_description: "Impeccable grooming signals respect for your counterpart. A well-maintained appearance communicates seriousness of intent." },
  // Pillar 3: Eloquence
  { region_code: "CN", pillar: 3, context: "business", rule_type: "Business Cards with Both Hands", rule_description: "Present and receive business cards with both hands and a slight bow. Study the card respectfully before setting it aside." },
  { region_code: "CN", pillar: 3, context: "business", rule_type: "Family Name First", rule_description: "Chinese names are given family name first. Address counterparts as Mr/Ms [Family Name] unless invited to use a given name." },
  { region_code: "CN", pillar: 3, context: "social", rule_type: "Indirect Communication", rule_description: "Directness can be perceived as aggression. Frame suggestions carefully and allow others to save face in disagreements." },
  { region_code: "CN", pillar: 3, context: "business", rule_type: "Silence as Reflection", rule_description: "Silence during discussions signals consideration, not discomfort. Do not rush to fill silences; allow time for reflection." },
  { region_code: "CN", pillar: 3, context: "social", rule_type: "Index Finger Protocol", rule_description: "Pointing with the index finger is considered rude. Use an open hand or gesture with the whole hand when indicating direction." },
  // Pillar 4: Table Manners
  { region_code: "CN", pillar: 4, context: "dining", rule_type: "Chopstick Protocol", rule_description: "Never place chopsticks vertically in a rice bowl — this resembles incense sticks used in funeral rites. Rest them on the holder." },
  { region_code: "CN", pillar: 4, context: "dining", rule_type: "The Host Orders and Pays", rule_description: "At a hosted meal, the host orders food for the table and insists on paying. A token protest from the guest is expected and appropriate." },
  { region_code: "CN", pillar: 4, context: "dining", rule_type: "Wait for Seating by Seniority", rule_description: "Do not sit until invited. Seating reflects hierarchy — the guest of honour sits facing the door or in the most prominent position." },
  { region_code: "CN", pillar: 4, context: "dining", rule_type: "Pour for Others First", rule_description: "When pouring tea, pour for your companions before filling your own cup. This demonstrates respect and consideration." },
  { region_code: "CN", pillar: 4, context: "dining", rule_type: "Try All Dishes Offered", rule_description: "Accepting food offered by the host is a sign of respect. Refusing dishes without explanation can cause offence." },
  // Pillar 5: Drinks
  { region_code: "CN", pillar: 5, context: "dining", rule_type: "Ganbei — The Toast", rule_description: "Ganbei means 'dry cup' — drain your glass completely when toasting. Participating enthusiastically builds goodwill." },
  { region_code: "CN", pillar: 5, context: "dining", rule_type: "Baijiu Etiquette", rule_description: "Baijiu is potent Chinese spirit. Accepting a glass is courteous even if you sip only a little. Flatly refusing can offend." },
  { region_code: "CN", pillar: 5, context: "dining", rule_type: "Tea Appreciation", rule_description: "When someone refills your tea, tap two fingers gently on the table — a discreet thank you rooted in historical court etiquette." },
  { region_code: "CN", pillar: 5, context: "dining", rule_type: "Senior Pours Last", rule_description: "Pour tea for seniors before yourself. The elder or most senior guest is always served first." },
  { region_code: "CN", pillar: 5, context: "social", rule_type: "Hold the Glass Correctly", rule_description: "When receiving a toast, hold your glass with both hands or support the base with your left hand — a sign of respect for the toaster." },

  // ── CANADA ───────────────────────────────────────────────────────────────────
  // Pillar 1: Cultural Knowledge
  { region_code: "CA", pillar: 1, context: "social", rule_type: "Bilingual Awareness", rule_description: "In Quebec and officially bilingual contexts, acknowledging French culture and language demonstrates respect. Attempting a word of French is warmly received." },
  { region_code: "CA", pillar: 1, context: "social", rule_type: "Indigenous Land Acknowledgement", rule_description: "In many contexts, particularly formal ones, acknowledging the Indigenous peoples of the land is customary and appreciated." },
  { region_code: "CA", pillar: 1, context: "social", rule_type: "Inclusive Language", rule_description: "Canada places significant value on inclusive, non-discriminatory language. Be mindful of assumptions about identity, culture, and origin." },
  { region_code: "CA", pillar: 1, context: "social", rule_type: "Never Compare to the US", rule_description: "Comparing Canada unfavourably to the United States or assuming they are interchangeable cultures is a reliable way to give offence." },
  { region_code: "CA", pillar: 1, context: "social", rule_type: "Punctuality Matters", rule_description: "Arriving on time is expected. If delayed, notify the host or other party promptly. Unexplained lateness is considered disrespectful." },
  // Pillar 2: Appearance
  { region_code: "CA", pillar: 2, context: "business", rule_type: "Smart Casual in Business", rule_description: "Many Canadian business environments favour smart casual. Jeans can be appropriate in tech or creative fields, but judge by the environment." },
  { region_code: "CA", pillar: 2, context: "social", rule_type: "Seasonal Appropriateness", rule_description: "Canada's climate demands practical consideration. High-quality outerwear and appropriate footwear for conditions are observed and respected." },
  { region_code: "CA", pillar: 2, context: "formal", rule_type: "Formal When Specified", rule_description: "When an invitation specifies formal attire, treat this seriously. Canadians balance informality generally with sharp formality when called for." },
  { region_code: "CA", pillar: 2, context: "social", rule_type: "Casual Outdoors", rule_description: "Outdoor social contexts — hiking, cottage weekends, summer events — permit genuinely casual dress. This is culturally appropriate and expected." },
  { region_code: "CA", pillar: 2, context: "business", rule_type: "Clean and Neat Always", rule_description: "Regardless of the dress code level, clothing should always be clean, well-fitted, and in good repair. This baseline is non-negotiable." },
  // Pillar 3: Eloquence
  { region_code: "CA", pillar: 3, context: "social", rule_type: "First Names Quickly", rule_description: "Canadians move to first-name basis relatively quickly. Follow the other person's lead." },
  { region_code: "CA", pillar: 3, context: "social", rule_type: "The Canadian Apology", rule_description: "Canadians apologise reflexively and frequently. 'Sorry' functions as a social lubricant, not necessarily an admission of fault." },
  { region_code: "CA", pillar: 3, context: "social", rule_type: "Hold Doors", rule_description: "Holding doors for those behind you is standard courtesy. Failing to do so will be noticed." },
  { region_code: "CA", pillar: 3, context: "social", rule_type: "Direct but Courteous", rule_description: "Canadians value directness, but tempered by courtesy. You may say what you mean; simply ensure you deliver it with warmth." },
  { region_code: "CA", pillar: 3, context: "business", rule_type: "Avoid Boasting", rule_description: "As in British culture, overt self-promotion sits uncomfortably in Canadian social contexts. Let accomplishments speak through deeds." },
  // Pillar 4: Table Manners
  { region_code: "CA", pillar: 4, context: "dining", rule_type: "Splitting the Bill", rule_description: "At informal restaurants among peers, splitting the bill evenly or each paying their share is common and expected." },
  { region_code: "CA", pillar: 4, context: "dining", rule_type: "Tipping 15–20%", rule_description: "Tipping in Canadian restaurants is expected. 15% is the baseline; 20% signals satisfaction. Not tipping is considered rude." },
  { region_code: "CA", pillar: 4, context: "dining", rule_type: "Dietary Accommodations", rule_description: "It is entirely acceptable to state dietary restrictions. Canadian hosts anticipate and respect these without making guests feel awkward." },
  { region_code: "CA", pillar: 4, context: "dining", rule_type: "Wait to Be Seated in Formal Settings", rule_description: "In formal dining contexts, wait to be directed to your seat. At casual gatherings, find a seat after greeting the host." },
  { region_code: "CA", pillar: 4, context: "dining", rule_type: "Compliment the Meal", rule_description: "Expressing appreciation for the food is expected and welcomed. A specific compliment is more meaningful than a general one." },
  // Pillar 5: Drinks
  { region_code: "CA", pillar: 5, context: "social", rule_type: "Craft Beer Culture", rule_description: "Canada has a thriving craft beer scene. Demonstrating knowledge of or appreciation for local breweries signals cultural engagement." },
  { region_code: "CA", pillar: 5, context: "social", rule_type: "Canadian Whisky", rule_description: "Canadian whisky is a national product of pride. Showing familiarity with expressions such as Crown Royal demonstrates respect for local tradition." },
  { region_code: "CA", pillar: 5, context: "dining", rule_type: "Wine at Dinner", rule_description: "Bringing a bottle of wine to a dinner party is a perfectly appropriate host gift and often expected in social dining contexts." },
  { region_code: "CA", pillar: 5, context: "social", rule_type: "Drinking Responsibly", rule_description: "Canada has a culture of responsible drinking. Peer pressure around alcohol is rare; your choices will be respected without comment." },
  { region_code: "CA", pillar: 5, context: "social", rule_type: "Coffee Culture", rule_description: "Tim Hortons is a cultural institution. Sharing a 'double-double' (coffee with two creams and two sugars) is a Canadian social ritual." },
];

const scenarios: (typeof scenariosTable.$inferInsert)[] = [
  // ── UK Scenarios ─────────────────────────────────────────────────────────────
  {
    title: "The Dinner Invitation",
    pillar: 1, region_code: "GB", age_group: "18-30", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You have been invited to a dinner party at the home of a British colleague. The invitation reads '7:30 for 8'. You arrive at the door at exactly 7:30.",
      question: "What does '7:30 for 8' mean, and did you arrive at the correct time?",
      options: [
        { text: "It means dinner is at 7:30. I am perfectly on time.", correct: false, explanation: "'7:30 for 8' means drinks and mingling begin at 7:30, with dinner served at 8. Arriving at 7:30 is entirely correct." },
        { text: "It means drinks begin at 7:30 and dinner is at 8. I am on time.", correct: true, explanation: "Precisely so. This phrasing is standard in British formal entertaining. Arriving at 7:30 allows time for aperitifs before sitting for dinner at 8." },
        { text: "It means I can arrive any time between 7:30 and 8.", correct: false, explanation: "This misreads the invitation. Arriving after 7:30 would be late; the host expects guests at 7:30 for a pre-dinner gathering." },
        { text: "I should arrive at 8, as dinner is at 8.", correct: false, explanation: "Arriving at 8 would mean missing the aperitif hour, which is part of the occasion. Your host would have been waiting since 7:30." },
      ]
    }
  },
  {
    title: "The Tea Refusal",
    pillar: 1, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "A British acquaintance has welcomed you into their home and immediately asks, 'Can I get you a cup of tea?' You do not particularly want tea.",
      question: "How should you respond?",
      options: [
        { text: "No thank you, I'm quite alright.", correct: false, explanation: "A flat refusal, while not outrageous, passes up an opportunity for social warmth. Accepting tea — even just a little — is the more gracious response." },
        { text: "Just a small cup would be lovely, thank you.", correct: true, explanation: "Accepting tea graciously is one of the simplest and most effective ways to set a warm tone with a British host. 'Just a small cup' is a perfect, polite acceptance." },
        { text: "Do you have coffee instead?", correct: false, explanation: "Immediately requesting an alternative signals that you haven't appreciated the gesture. Accept the tea offered, or decline gently without redirecting to a preference." },
        { text: "Oh, are you having one yourself?", correct: false, explanation: "Making the host justify the offer is awkward. Simply accept or decline with grace." },
      ]
    }
  },
  {
    title: "The Business Card Exchange",
    pillar: 3, region_code: "GB", age_group: "25-45", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are at a London networking event and are introduced to a senior partner at a prestigious firm. He offers his business card.",
      question: "What is the most appropriate response?",
      options: [
        { text: "Take it quickly and slip it into your jacket pocket.", correct: false, explanation: "Pocketing a card immediately without reading it signals indifference to the person presenting it. A brief, respectful examination is expected." },
        { text: "Accept it with both hands, glance at it respectfully, then place it carefully in your card holder.", correct: true, explanation: "Precisely correct. Accepting with both hands and taking a moment to read the card demonstrates that you value the introduction and the person behind it." },
        { text: "Take it and immediately offer your own card in return.", correct: false, explanation: "Rushing to reciprocate before acknowledging what you have received misses the ritual of the exchange. Read the card first, then offer yours." },
        { text: "Decline politely — you prefer to connect on LinkedIn.", correct: false, explanation: "Declining a business card in a professional setting, however well-intentioned, is considered rude. Accept it graciously regardless of your digital preferences." },
      ]
    }
  },
  // ── China Scenarios ───────────────────────────────────────────────────────────
  {
    title: "The Banquet Seat",
    pillar: 1, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 4, noble_score_impact: 7,
    content_json: {
      situation: "You are the guest of honour at a formal Chinese banquet. You enter the private dining room and see a large round table. Several Chinese colleagues are already present.",
      question: "Where should you sit?",
      options: [
        { text: "Take any available seat — round tables have no hierarchy.", correct: false, explanation: "At Chinese formal banquets, seating is highly structured by hierarchy. The guest of honour typically faces the door, with the host's back to the door." },
        { text: "Wait for the host to indicate your seat.", correct: true, explanation: "Always allow the host to direct seating at a Chinese formal dinner. Seating reflects hierarchy, and choosing your own seat may place you incorrectly and cause awkwardness." },
        { text: "Sit closest to the door for easy exit.", correct: false, explanation: "The seat closest to the door is traditionally the host's seat, so they can attend to arriving guests. The guest of honour typically sits furthest from the door." },
        { text: "Sit next to the most senior-looking guest.", correct: false, explanation: "This may be correct by chance, but attempting to assess seniority and seat yourself accordingly creates unnecessary risk. Simply wait for direction." },
      ]
    }
  },
  {
    title: "The Chopstick Dilemma",
    pillar: 4, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are eating rice at a Chinese dinner and need to set your chopsticks down for a moment.",
      question: "Where should you place your chopsticks?",
      options: [
        { text: "Stick them vertically into the rice bowl so they don't roll away.", correct: false, explanation: "This is one of the most serious taboos in Chinese dining. Chopsticks standing upright in a rice bowl evoke the incense sticks used in funeral rites — deeply inauspicious." },
        { text: "Rest them horizontally across the top of the rice bowl.", correct: false, explanation: "While better than vertical placement, the proper solution is to use the chopstick rest if provided, or lay them across the edge of the plate." },
        { text: "Rest them on the chopstick holder provided, or lay them parallel across your plate.", correct: true, explanation: "Correct. Using the chopstick holder — or resting them horizontally across the edge of a dish — is the proper, considered approach." },
        { text: "Hand them to a neighbouring diner to hold.", correct: false, explanation: "This is unnecessarily imposing. Simply use the chopstick holder or rest them on your plate." },
      ]
    }
  },
  {
    title: "The Ganbei Toast",
    pillar: 5, region_code: "CN", age_group: "18-50", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "Your host raises a glass of baijiu and calls 'Ganbei!' directing the toast toward you, the foreign guest. You do not drink spirits.",
      question: "What is the most appropriate response?",
      options: [
        { text: "Firmly decline — you never drink spirits.", correct: false, explanation: "A flat refusal, particularly without explanation, can cause your host to lose face and signals an unwillingness to engage in the relationship." },
        { text: "Drink the glass fully — it is rude not to.", correct: false, explanation: "While enthusiastic participation is appreciated, you are not obliged to drain the glass if spirits are genuinely not something you consume. A polite compromise exists." },
        { text: "Raise the glass, touch it to your lips to acknowledge the toast, then explain gently that spirits don't agree with you.", correct: true, explanation: "This is the measured, respectful approach. Acknowledging the gesture fully then excusing yourself graciously preserves face on all sides." },
        { text: "Ask the waiter to bring you something else first.", correct: false, explanation: "Delaying the toast to organise an alternative drink draws attention to the refusal and creates awkwardness. Handle the situation directly with grace." },
      ]
    }
  },
  // ── Canada Scenarios ──────────────────────────────────────────────────────────
  {
    title: "The Restaurant Bill",
    pillar: 1, region_code: "CA", age_group: "18-35", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You have had a lovely dinner with three Canadian friends at a mid-range restaurant. The bill arrives at the table.",
      question: "What is the typical expectation regarding the bill and the tip?",
      options: [
        { text: "One person pays and settles with the others later.", correct: false, explanation: "While this occasionally happens among close friends, it is not the cultural default. Splitting evenly or each paying one's share is the typical approach." },
        { text: "Split the bill evenly and leave a tip of 15–20% combined.", correct: true, explanation: "Exactly. Splitting evenly among friends is standard Canadian dining etiquette. A tip of 15–20% on the pre-tax total is expected and important to service staff." },
        { text: "Each person pays exactly what they ordered, with no tip required.", correct: false, explanation: "Not tipping in Canada is considered rude. Restaurant staff depend significantly on tips. 15% is the baseline regardless of the bill-splitting method." },
        { text: "The person who suggested the restaurant pays for everyone.", correct: false, explanation: "This is not a Canadian convention. It may occur among very close friends, but it is not a cultural expectation at a casual dinner." },
      ]
    }
  },
  {
    title: "The Language Question",
    pillar: 3, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are in Montreal for a conference. You approach a local shopkeeper to ask for directions. You are not sure if they speak English.",
      question: "How do you begin the interaction most appropriately?",
      options: [
        { text: "Begin in English immediately — most people in Canada speak English.", correct: false, explanation: "In Quebec, French is the primary language and an important part of cultural identity. Beginning in English without acknowledgement can be perceived as dismissive." },
        { text: "Open with 'Bonjour/Hi' — acknowledging both languages — then proceed in whichever they respond in.", correct: true, explanation: "The 'Bonjour/Hi' greeting is a widely used and respected way to acknowledge Quebec's bilingual reality. It opens the door for the other person to respond in their preferred language." },
        { text: "Attempt the entire interaction in French, even if your French is poor.", correct: false, explanation: "While a token effort in French is appreciated, struggling through the entire conversation when the other party likely speaks English may cause unnecessary difficulty." },
        { text: "Ask 'Parlez-vous anglais?' before saying anything else.", correct: false, explanation: "Opening by asking if they speak English, before acknowledging French at all, can come across as presumptuous. The Bonjour/Hi approach is far more gracious." },
      ]
    }
  },
  {
    title: "The Door Etiquette",
    pillar: 3, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 3,
    content_json: {
      situation: "You are entering a coffee shop and notice someone is about two metres behind you.",
      question: "What do you do with the door?",
      options: [
        { text: "Pass through and let the door swing closed — two metres is too far to hold it.", correct: false, explanation: "In Canadian social culture, holding the door for someone two metres (or even more) behind you is entirely standard. Letting it swing is considered inconsiderate." },
        { text: "Hold the door open and wait for the person to reach it.", correct: true, explanation: "Correct. Holding doors — and thanking those who hold them for you — is a deeply ingrained Canadian courtesy. It is one of the small things that matters considerably." },
        { text: "Push the door open widely and step aside to let them through first.", correct: false, explanation: "While generous, this may create an awkward interaction. Simply holding the door as you pass through is the natural, expected gesture." },
        { text: "Glance back, make eye contact, and then walk through quickly.", correct: false, explanation: "Acknowledging the person but then letting the door go is worse than not noticing them at all — it signals you saw them but chose not to hold the door." },
      ]
    }
  },
];

async function seed() {
  console.log("Seeding SOWISO database...");

  await db.execute(sql`TRUNCATE TABLE culture_protocols, scenarios RESTART IDENTITY CASCADE`);
  console.log("  Tables cleared");

  await db.insert(cultureProtocolsTable).values(protocols);
  console.log(`  ${protocols.length} culture protocols inserted (UK/CN/CA x 5 pillars x 5 rules each)`);

  await db.insert(scenariosTable).values(scenarios);
  console.log(`  ${scenarios.length} scenarios inserted (3 per region)`);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
