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

  // ── AUSTRALIA ────────────────────────────────────────────────────────────────
  // Pillar 1: Cultural Knowledge
  { region_code: "AU", pillar: 1, context: "social", rule_type: "Mateship", rule_description: "Mateship is a foundational Australian value — loyalty, equality, and solidarity between friends. Being a reliable mate is among the highest social virtues." },
  { region_code: "AU", pillar: 1, context: "social", rule_type: "Tall Poppy Syndrome", rule_description: "Australians are suspicious of those who elevate themselves above others. Excessive self-promotion, boasting of achievements, or putting on airs invites social ridicule." },
  { region_code: "AU", pillar: 1, context: "formal", rule_type: "Indigenous Land Acknowledgement", rule_description: "At formal events, acknowledging the Traditional Owners of the land is standard and expected. A brief, respectful acknowledgement demonstrates cultural awareness." },
  { region_code: "AU", pillar: 1, context: "social", rule_type: "Egalitarian Values", rule_description: "Australian culture is resolutely egalitarian. Rank and titles carry less weight than in Europe; treating everyone — regardless of status — with equal respect is the expectation." },
  { region_code: "AU", pillar: 1, context: "social", rule_type: "Directness Without Offence", rule_description: "Australians value directness and plain speaking. Beating around the bush is seen as evasive or dishonest. Say what you mean, but with good humour." },
  // Pillar 2: Appearance
  { region_code: "AU", pillar: 2, context: "business", rule_type: "Smart Casual as Default", rule_description: "Most Australian business environments favour smart casual. Formal suits are worn in finance and law, but many sectors consider them unnecessarily stiff." },
  { region_code: "AU", pillar: 2, context: "social", rule_type: "Climate-Appropriate Dressing", rule_description: "Australia's climate demands practical choices. Quality outdoor wear, sun-safe clothing, and appropriate footwear for conditions signal good sense, not poor taste." },
  { region_code: "AU", pillar: 2, context: "social", rule_type: "Understated Grooming", rule_description: "High grooming standards are expected but loudly displayed luxury is viewed with suspicion. Clean, practical, and well-maintained counts for more than designer labels." },
  { region_code: "AU", pillar: 2, context: "social", rule_type: "BBQ and Outdoor Dress", rule_description: "Casual outdoor gatherings call for clean, comfortable clothing. Over-dressing for a backyard BBQ is as awkward as under-dressing for a formal dinner — read the occasion." },
  { region_code: "AU", pillar: 2, context: "formal", rule_type: "Formal When Called For", rule_description: "When an invitation specifies formal attire, Australians take it seriously. The relaxed general standard makes formal occasions stand out; dress accordingly." },
  // Pillar 3: Eloquence
  { region_code: "AU", pillar: 3, context: "social", rule_type: "First Names Immediately", rule_description: "Australians move to first names almost instantly. Using titles or surnames in casual conversation quickly feels stiff and creates unnecessary distance." },
  { region_code: "AU", pillar: 3, context: "social", rule_type: "Self-Deprecating Humour", rule_description: "Mocking yourself lightly is a social virtue in Australia. It signals confidence and invites connection. Those who take themselves too seriously attract gentle ridicule." },
  { region_code: "AU", pillar: 3, context: "social", rule_type: "Banter as Affection", rule_description: "Light-hearted teasing — 'taking the mickey' — is a primary expression of affection among Australians. Being teased is generally a sign of acceptance, not hostility." },
  { region_code: "AU", pillar: 3, context: "business", rule_type: "Direct Feedback Culture", rule_description: "Australian workplaces value direct, honest feedback. Diplomatic circumlocutions are seen as time-wasting. Deliver criticism constructively but plainly." },
  { region_code: "AU", pillar: 3, context: "social", rule_type: "No Pretension", rule_description: "Affectation — of accent, of expertise, of status — is swiftly and mercilessly noticed. Speak naturally and honestly; authenticity is highly valued." },
  // Pillar 4: Table Manners
  { region_code: "AU", pillar: 4, context: "dining", rule_type: "BBQ Protocol", rule_description: "At an Australian BBQ, the host manages the grill. Do not offer to take over unless explicitly invited. Bring something to contribute — drinks, salad, or dessert." },
  { region_code: "AU", pillar: 4, context: "dining", rule_type: "BYO Culture", rule_description: "Many Australian casual gatherings operate on BYO (bring your own) for alcohol. Arriving empty-handed to a BYO occasion is poor form. Bring more than you expect to consume." },
  { region_code: "AU", pillar: 4, context: "dining", rule_type: "Egalitarian Bill Splitting", rule_description: "Bills in casual dining are frequently split equally among the table. Meticulous individual accounting is considered petty; contribute your fair share without fuss." },
  { region_code: "AU", pillar: 4, context: "dining", rule_type: "Tipping Norms", rule_description: "Tipping is appreciated but not mandatory — service staff are paid properly. Rounding up or leaving 10% for good service is sufficient and welcome." },
  { region_code: "AU", pillar: 4, context: "dining", rule_type: "Continental Cutlery Style", rule_description: "At formal dinners, Australian table manners follow the continental style: fork left, knife right. Switching hands is unnecessary and marks one as unversed." },
  // Pillar 5: Drinks
  { region_code: "AU", pillar: 5, context: "social", rule_type: "Shouting Rounds", rule_description: "'Shouting' — buying a round of drinks for the group — is a deeply ingrained ritual. Accepting drinks without reciprocating is noticed and poorly received." },
  { region_code: "AU", pillar: 5, context: "social", rule_type: "Serious Coffee Culture", rule_description: "Australia has a sophisticated coffee culture. The flat white originated here; the long black is the preferred alternative to Americano. Instant coffee is served only in emergencies." },
  { region_code: "AU", pillar: 5, context: "social", rule_type: "Wine Without Pretension", rule_description: "Australia produces world-class wines, but discussing them with excessive expertise is seen as showy. Enthusiasm and genuine curiosity are preferred over connoisseur performance." },
  { region_code: "AU", pillar: 5, context: "social", rule_type: "BYOB at Casual Gatherings", rule_description: "When attending a casual gathering, bringing a six-pack, a bottle of wine, or a bottle of spirits as a contribution is standard practice and socially expected." },
  { region_code: "AU", pillar: 5, context: "dining", rule_type: "The Designated Driver", rule_description: "In social groups, the role of designated driver is taken seriously and respected. Never pressure someone who is driving to drink; offer them a quality non-alcoholic alternative." },
];

// 3 scenarios per pillar per region = 3 × 5 × 3 = 45 total
const scenarios: (typeof scenariosTable.$inferInsert)[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // UK — Pillar 1: Cultural Knowledge
  // ─────────────────────────────────────────────────────────────────────────────
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
        { text: "It means I can arrive any time between 7:30 and 8.", correct: false, explanation: "This misreads the invitation. Arriving after 7:30 would be late." },
        { text: "I should arrive at 8, as dinner is at 8.", correct: false, explanation: "Arriving at 8 would mean missing the aperitif hour entirely. Your host would have been waiting since 7:30." },
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
        { text: "No thank you, I'm quite alright.", correct: false, explanation: "A flat refusal passes up an opportunity for social warmth. Accepting tea — even just a little — is the more gracious response." },
        { text: "Just a small cup would be lovely, thank you.", correct: true, explanation: "Accepting tea graciously is one of the simplest ways to set a warm tone with a British host. 'Just a small cup' is a perfect, polite acceptance." },
        { text: "Do you have coffee instead?", correct: false, explanation: "Immediately requesting an alternative signals that you haven't appreciated the gesture. Accept the tea offered." },
        { text: "Oh, are you having one yourself?", correct: false, explanation: "Making the host justify the offer is awkward. Simply accept or decline with grace." },
      ]
    }
  },
  {
    title: "The Queue",
    pillar: 1, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You arrive at a busy London deli and notice a long queue. A space opens near the counter and no one is standing in it, though others are clearly waiting.",
      question: "What do you do?",
      options: [
        { text: "Step into the open space — it's not technically in the queue.", correct: false, explanation: "Queue-jumping, even through a technicality, is among the gravest social transgressions in British culture. The intent matters as much as the act." },
        { text: "Join the back of the queue and wait patiently.", correct: true, explanation: "Exactly right. Joining the queue at its end without question or complaint is the only acceptable behaviour. Patience is worn with quiet pride." },
        { text: "Ask the nearest person if there is actually a queue.", correct: false, explanation: "While not as offensive as jumping the queue, questioning its existence is unnecessary and mildly irritating. The queue is evident; simply join it." },
        { text: "Wait for someone to invite you forward.", correct: false, explanation: "No such invitation will come. The British queue operates on mutual silent understanding. Find the end and join it." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // UK — Pillar 2: Appearance
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Black Tie Event",
    pillar: 2, region_code: "GB", age_group: "25-55", gender_applicability: "all",
    context: "formal", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You receive an invitation to a formal charity dinner. The dress code stated is 'Black Tie'. You are unsure what to wear.",
      question: "Which of the following is correct for a Black Tie event?",
      options: [
        { text: "A dark navy suit with a black tie — the 'black tie' refers to the tie.", correct: false, explanation: "Black Tie as a dress code refers to a specific formality level, not merely the neckwear colour. A lounge suit, however dark, is insufficient." },
        { text: "A dinner jacket (tuxedo) with a formal white dress shirt and black bow tie.", correct: true, explanation: "Precisely. Black Tie requires a dinner jacket, a formal shirt — typically with a pleated front — and a black bow tie. Black patent leather shoes complete the ensemble." },
        { text: "Any smart suit will do — Black Tie is loosely interpreted in modern society.", correct: false, explanation: "Not at a formal charity dinner. When the dress code is stated, it should be honoured. Arriving under-dressed reflects poorly on both you and your host." },
        { text: "A black tie must be worn, but otherwise dress as you wish.", correct: false, explanation: "Black Tie is a formal dress code, not a directive about neckwear colour. It specifies a dinner jacket, not simply any attire with a black tie." },
      ]
    }
  },
  {
    title: "Smart Casual Interpretation",
    pillar: 2, region_code: "GB", age_group: "20-45", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are invited to a British colleague's home for a casual Sunday lunch. The invitation says 'smart casual'.",
      question: "Which outfit is most appropriate?",
      options: [
        { text: "Clean jeans, a well-fitted collared shirt, and leather shoes or neat loafers.", correct: true, explanation: "This is the standard interpretation of smart casual in Britain. Clean, well-fitting clothes without excessive formality — but clearly not leisure wear." },
        { text: "Athletic wear — it's Sunday and described as casual.", correct: false, explanation: "'Smart casual' implies a level of consideration above everyday leisure wear. Sportswear would be considered disrespectful of the occasion." },
        { text: "A full suit — better to be overdressed than underdressed.", correct: false, explanation: "For a casual Sunday lunch, arriving in a suit would be conspicuously overdressed and slightly awkward for your host." },
        { text: "Jeans and a graphic T-shirt — it's casual after all.", correct: false, explanation: "The 'smart' in smart casual means something considered and put together. A graphic T-shirt lacks the appropriate polish for a British social occasion." },
      ]
    }
  },
  {
    title: "The Shoe Standard",
    pillar: 2, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are attending an important business meeting in the City of London. You have dressed impeccably but noticed your shoes are scuffed and unpolished.",
      question: "How significant is this oversight in a British business context?",
      options: [
        { text: "Minimal — no one pays attention to shoes.", correct: false, explanation: "In British business culture — particularly in the City — shoes are carefully noticed. Scuffed shoes signal inattention to detail, which reflects on professional standards." },
        { text: "Highly significant — shoes are among the first things observed and reflect personal standards.", correct: true, explanation: "Precisely. The British professional tradition holds that well-maintained shoes indicate a person of care and substance. Shoes communicate character." },
        { text: "Only significant if you are meeting very senior people.", correct: false, explanation: "Every encounter in a professional context matters. Forming the habit of polished shoes ensures consistency regardless of who you meet." },
        { text: "Somewhat significant — but a confident manner compensates.", correct: false, explanation: "Confidence is valuable, but it does not erase the signal sent by visible neglect of one's appearance. Both matter independently." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // UK — Pillar 3: Eloquence
  // ─────────────────────────────────────────────────────────────────────────────
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
        { text: "Decline politely — you prefer to connect on LinkedIn.", correct: false, explanation: "Declining a business card in a professional setting is considered rude. Accept it graciously regardless of your digital preferences." },
      ]
    }
  },
  {
    title: "The Understated Compliment",
    pillar: 3, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "A British colleague reviews your presentation and says 'I thought it was really quite good, actually.' You are trying to understand how they really feel.",
      question: "How should you interpret this response?",
      options: [
        { text: "They are moderately pleased — 'quite good' suggests room for improvement.", correct: false, explanation: "In British understatement, 'quite good' is actually a generous compliment. The qualifier 'actually' often signals genuine surprise at quality." },
        { text: "This is a strong compliment — British understatement means praise is carefully rationed.", correct: true, explanation: "Precisely. 'Really quite good, actually' is British English for genuine approval. Effusive praise would be 'remarkable' — and even then delivered without exclamation." },
        { text: "They disliked it but are being polite.", correct: false, explanation: "Polite British disappointment is 'interesting' or 'an interesting approach'. 'Quite good' is genuinely positive — high praise in this register." },
        { text: "They are confused and don't know what to say.", correct: false, explanation: "British professionals almost never offer verbal confusion as a response. 'Quite good, actually' has a clear and positive meaning in British social register." },
      ]
    }
  },
  {
    title: "Addressing a New Acquaintance",
    pillar: 3, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are introduced to Dr. Margaret Holt at a formal dinner. The host introduces her by her full title. You wish to address her during conversation.",
      question: "How do you address her?",
      options: [
        { text: "Margaret — you were formally introduced and feel at ease.", correct: false, explanation: "In British formal contexts, using a first name without invitation is considered presumptuous, however relaxed the setting feels. Wait for explicit permission." },
        { text: "Dr. Holt, as that is how she was introduced.", correct: true, explanation: "Correct. You address someone by the title and surname under which they were introduced until they invite you to use their given name. This is non-negotiable in formal British settings." },
        { text: "Dr. Margaret, as a polite compromise.", correct: false, explanation: "Combining a title with a first name is neither formally correct nor particularly British. Use 'Dr. Holt' until invited otherwise." },
        { text: "'Excuse me, what would you prefer I call you?' — to be accommodating.", correct: false, explanation: "While well-intentioned, asking this question in a formal setting is considered gauche. The correct form is simply to use the title under which she was introduced." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // UK — Pillar 4: Table Manners
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Bread Roll",
    pillar: 4, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "A bread roll is placed before you at the start of a formal dinner. You are hungry and wish to eat it.",
      question: "What is the correct way to eat a bread roll?",
      options: [
        { text: "Bite directly into the roll — it is informal food.", correct: false, explanation: "Even informal food is subject to table etiquette. Biting directly into a bread roll is considered ungainly in a formal British dining context." },
        { text: "Break off the entire top half, butter it, and eat in two portions.", correct: false, explanation: "Large portions are generally to be avoided. The correct approach is smaller pieces, each buttered individually as they are consumed." },
        { text: "Break off a small piece, butter only that piece, and eat it before breaking the next.", correct: true, explanation: "Precisely. Bread is broken into small pieces, one piece buttered at a time. This is the accepted dining standard at a formal British table." },
        { text: "Wait until others begin eating — then watch how they proceed.", correct: false, explanation: "While observing others is sensible, this does not identify the correct method. Break the roll into small pieces and butter each piece individually." },
      ]
    }
  },
  {
    title: "The Soup Course",
    pillar: 4, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "Soup is served at a formal British dinner. You are unsure how to properly use the soup spoon.",
      question: "What is the correct technique?",
      options: [
        { text: "Fill the spoon by pushing it toward you, then sip from the front.", correct: false, explanation: "Both actions are incorrect. The spoon moves away from you when filling, and soup is sipped from the side — not the front — of the spoon." },
        { text: "Fill the spoon by moving it away from you, and sip from the side of the spoon.", correct: true, explanation: "Correct on both counts. Moving the spoon away from you prevents drips toward the table, and sipping from the side is the proper technique." },
        { text: "Tilt the bowl toward you to gather the last of the soup.", correct: false, explanation: "If anything, the bowl may be very gently tilted away from you to gather the last spoonfuls — and even this is controversial in the most formal settings." },
        { text: "Blow on the soup to cool it before sipping.", correct: false, explanation: "Blowing on food or drink at a British dinner table is considered ill-mannered. Wait for it to cool naturally or sip cautiously from the edge." },
      ]
    }
  },
  {
    title: "Utensil Etiquette",
    pillar: 4, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are midway through the main course at a formal British dinner. You need to set your knife and fork down to take a sip of water.",
      question: "How should you position your cutlery to signal that you have not yet finished eating?",
      options: [
        { text: "Leave them randomly on the plate — it is obvious you are still eating.", correct: false, explanation: "Cutlery placement is a precise communication to waiting staff. Leaving utensils randomly creates ambiguity and may result in your plate being removed prematurely." },
        { text: "Cross the knife and fork in an X pattern on the plate.", correct: true, explanation: "Correct. The crossed position signals to staff that you have not finished and do not wish your plate to be removed." },
        { text: "Rest one on the plate, one leaning against it.", correct: false, explanation: "This unstable arrangement risks both noise and accidental removal. Crossed or rested in a 'V' at the bottom of the plate are the recognised signals." },
        { text: "Place them parallel on the right side of the plate.", correct: false, explanation: "Parallel cutlery at the right side (or the 4:20 position) signals that you have finished. This would prompt staff to clear your plate while you are still eating." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // UK — Pillar 5: Drinks
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Port Decanter",
    pillar: 5, region_code: "GB", age_group: "25-60", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "Port is being served at a formal dinner. The decanter is in front of you and your neighbour on your right does not yet have port.",
      question: "What should you do with the decanter?",
      options: [
        { text: "Pour for your neighbour on the right, then yourself.", correct: false, explanation: "Port circulates to the left (clockwise when viewed from above). Serving to the right would reverse the customary direction of travel." },
        { text: "Pass the decanter to the left without pouring for your right-hand neighbour.", correct: true, explanation: "Correct. Port passes to the left. Serve yourself, then pass it left. If your right-hand neighbour requires port, the decanter will reach them in its own time." },
        { text: "Pour for everyone at the table before it passes.", correct: false, explanation: "The decanter travels around the table sequentially. Each person pours for themselves and passes it along — not round the entire table at once." },
        { text: "Ask the host which direction port should travel tonight.", correct: false, explanation: "Port always passes to the left at a formal British dinner. This is a fixed convention that requires no consultation." },
      ]
    }
  },
  {
    title: "The Pub Round",
    pillar: 5, region_code: "GB", age_group: "18-40", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You join a group of British friends at a pub. There are four of you. One person buys the first round of drinks for everyone.",
      question: "What is the social obligation this creates?",
      options: [
        { text: "None — buying drinks is purely a voluntary gesture.", correct: false, explanation: "In Britain, buying the first round creates an implicit expectation that each person in the group will take their turn buying a round for everyone." },
        { text: "Each person is expected to buy a round in turn for the whole group.", correct: true, explanation: "Precisely. The round system is a deeply embedded British social contract. Leaving before buying your round is considered poor form and remembered." },
        { text: "You should thank them and offer to cover the tip.", correct: false, explanation: "This sidesteps the social obligation. The expectation is that you will buy a round for the entire group when it is your turn." },
        { text: "You should immediately buy the next round to settle the debt.", correct: false, explanation: "While generous, immediately buying the next round may disrupt the natural flow. Simply buy your round when the time comes — neither first nor last unnecessarily." },
      ]
    }
  },
  {
    title: "Tea Service Sequence",
    pillar: 5, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are hosting a formal afternoon tea. A long-standing debate in British society concerns whether milk goes in the cup before or after the tea.",
      question: "Which approach is considered the proper formal sequence?",
      options: [
        { text: "Milk first — this was the original correct practice.", correct: false, explanation: "While historically milk-first was practical (cold milk in fine porcelain prevented cracking), in formal contexts today pouring tea first is the conventional sequence." },
        { text: "Tea first, then add milk to taste.", correct: true, explanation: "At a formal afternoon tea, one pours tea first and adds milk after, to one's own preference. The host should offer the milk jug after pouring tea." },
        { text: "Milk first — the Earl of Pemberton established this standard in 1904.", correct: false, explanation: "This is not an established standard. The milk-first versus tea-first debate has never been definitively settled, though tea-first is the contemporary formal norm." },
        { text: "It depends on the quality of the porcelain.", correct: false, explanation: "While the historical reason for milk-first related to porcelain fragility, this is no longer a practical consideration. Tea first is the accepted formal sequence." },
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CHINA — Pillar 1: Cultural Knowledge
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Gift Presentation",
    pillar: 1, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You wish to bring a gift to a Chinese business host. You have chosen a handsome wall clock as a thoughtful and practical gift.",
      question: "Is this an appropriate gift choice?",
      options: [
        { text: "Yes — a clock is a practical, quality gift suitable for any culture.", correct: false, explanation: "In Chinese culture, giving a clock (especially as a gift) is deeply inauspicious. The phrase 'giving a clock' sounds identical to 'attending a funeral' in Mandarin." },
        { text: "No — clocks are associated with death and funerals in Chinese culture.", correct: true, explanation: "Precisely. 'Sòng zhōng' (giving a clock) is a homophone of attending someone's funeral. This gift should never be given to a Chinese host. Choose wine, fruit, or quality tea instead." },
        { text: "Only if the clock is very expensive — quality overcomes superstition.", correct: false, explanation: "No level of quality mitigates this cultural association. The gift itself, regardless of value, carries an unmistakably unfortunate connotation." },
        { text: "Ask your host first — superstitions vary by generation.", correct: false, explanation: "Placing the host in the position of explaining a cultural taboo is uncomfortable for both parties. Simply choose a different gift from the outset." },
      ]
    }
  },
  {
    title: "The Face-Saving Moment",
    pillar: 1, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 4, noble_score_impact: 7,
    content_json: {
      situation: "In a meeting with Chinese colleagues, a senior manager makes a factual error in their presentation. You know the correct information and it is material to the discussion.",
      question: "How do you handle this?",
      options: [
        { text: "Correct the error immediately and directly — accuracy is paramount.", correct: false, explanation: "Correcting a senior manager directly in front of colleagues causes them to lose face. This creates lasting damage to the relationship regardless of accuracy." },
        { text: "Stay silent — face preservation is more important than the information.", correct: false, explanation: "Complete silence on material information is also unsatisfactory. The art is to introduce the correct information without directly contradicting the senior person." },
        { text: "Raise the matter privately or frame a question that allows the speaker to correct themselves.", correct: true, explanation: "Precisely. Asking a question such as 'I wondered if the figure might be X — could you clarify?' allows the speaker to correct the record without loss of face. Relationships and accuracy are both preserved." },
        { text: "Speak to a junior colleague about it after the meeting.", correct: false, explanation: "If the information is material to the current discussion, addressing it after the meeting may be too late. The diplomatic question in the moment is the best approach." },
      ]
    }
  },
  {
    title: "Meeting the Senior Guest",
    pillar: 1, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are attending a business dinner in Beijing. Five Chinese guests enter the room together. You rise to greet them.",
      question: "In what order should you greet the guests?",
      options: [
        { text: "Greet the person who makes eye contact with you first.", correct: false, explanation: "In Chinese culture, seniority governs the order of greeting. Eye contact alone does not determine the correct sequence." },
        { text: "Greet the most senior or eldest person first, then proceed in order of seniority.", correct: true, explanation: "Correct. Age and seniority always take precedence. If you are uncertain, observe who the others defer to — that individual should be greeted first." },
        { text: "Greet them all simultaneously with a general bow.", correct: false, explanation: "While a respectful gesture, a general bow does not substitute for individually greeting each person in the appropriate order of seniority." },
        { text: "Wait for them to greet you first.", correct: false, explanation: "As the host or receiving party, it is your responsibility to greet your guests. Waiting passively would be considered a lack of hospitality." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // CHINA — Pillar 2: Appearance
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Wedding Colour",
    pillar: 2, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are invited to a Chinese colleague's traditional wedding ceremony. You are choosing what to wear.",
      question: "Which colours should you avoid, and why?",
      options: [
        { text: "Avoid red — it is too bold and will draw attention from the bride.", correct: false, explanation: "Red is the traditional colour of joy, luck, and celebration in Chinese culture. At a wedding, wearing red is entirely appropriate unless you are told otherwise." },
        { text: "Avoid white and black — these are associated with mourning and funerals.", correct: true, explanation: "Correct. White and black are mourning colours in Chinese tradition and are deeply inappropriate at celebratory occasions such as weddings. Choose bright, auspicious colours." },
        { text: "Avoid all bright colours — conservative dress shows respect.", correct: false, explanation: "Conservative drabness is not the appropriate choice for a Chinese celebration. Joyful, bright colours are welcomed and expected at a wedding." },
        { text: "Any colour is acceptable in modern China — these are old traditions.", correct: false, explanation: "These traditions remain meaningful to many families. Assuming they are obsolete risks causing offence, particularly to older generations present at the wedding." },
      ]
    }
  },
  {
    title: "Temple Dress Requirements",
    pillar: 2, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are visiting a prominent Buddhist temple in Shanghai. It is a hot summer day and you are wearing shorts and a sleeveless top.",
      question: "What should you do before entering?",
      options: [
        { text: "Enter as you are — it is a tourist attraction and dress codes are informal.", correct: false, explanation: "Temples are active places of worship, not merely tourist attractions. Modest dress is required out of respect for the sacred space and those who worship there." },
        { text: "Purchase or borrow appropriate cover-ups, ensuring shoulders and knees are covered.", correct: true, explanation: "Correct. Most temples provide or sell sarongs or cover-ups for visitors. Covering shoulders and knees before entering is a basic sign of respect in any Buddhist sacred space." },
        { text: "Only enter the outer courtyard and avoid the main hall.", correct: false, explanation: "While avoiding the most sacred areas reduces offence, modifying your dress appropriately allows you to experience the full visit with proper respect." },
        { text: "It is sufficient to remove your shoes at the entrance.", correct: false, explanation: "Shoe removal may also be required, but this does not substitute for modest dress covering shoulders and knees in a temple setting." },
      ]
    }
  },
  {
    title: "The Business Meeting Presentation",
    pillar: 2, region_code: "CN", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are attending an important business meeting in Beijing with senior Chinese executives. You are deciding what to wear.",
      question: "What is the most appropriate presentation?",
      options: [
        { text: "Casual professional — open-collar shirt, neat trousers. Modern Chinese business is informal.", correct: false, explanation: "This underestimates the formality expected in a senior Chinese business context. Conservative formal dress signals seriousness and respect." },
        { text: "Conservative formal dress — dark, quality suit, polished shoes, understated accessories.", correct: true, explanation: "Precisely. Senior business meetings in China command formal presentation. Quality is noticed and respected; ostentation is viewed with suspicion. Subdued and polished is optimal." },
        { text: "Traditional Chinese attire — a qipao or tangzhuang — to show cultural respect.", correct: false, explanation: "While the intention is admirable, a non-Chinese person appearing in traditional Chinese dress can read as performative and cause awkwardness rather than appreciation." },
        { text: "A stylish Western designer suit with visible brand logos.", correct: false, explanation: "Visible luxury branding can be perceived as ostentatious. Quality should speak for itself through cut and fabric, not branded labels." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // CHINA — Pillar 3: Eloquence
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "Receiving the Business Card",
    pillar: 3, region_code: "CN", age_group: "25-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "A senior Chinese executive presents their business card to you with both hands at the beginning of a meeting.",
      question: "What is the correct response?",
      options: [
        { text: "Accept it with one hand, glance at it, and set it on the table.", correct: false, explanation: "Accepting with one hand is considered careless and slightly disrespectful. Both hands should be used to receive a card, mirroring the respect shown in its presentation." },
        { text: "Accept it with both hands, study it respectfully for a moment, then place it carefully on the table before you.", correct: true, explanation: "This is precisely correct. The business card represents the person. Receiving it with both hands and treating it with visible respect demonstrates understanding of Chinese business etiquette." },
        { text: "Accept it and immediately offer yours in return without looking at it.", correct: false, explanation: "Immediately reciprocating without reading the card suggests the exchange is merely transactional. Take a moment to acknowledge the card before presenting your own." },
        { text: "Write a note on the card to remind yourself of the context.", correct: false, explanation: "Writing on a business card — especially in front of the person who gave it — is considered deeply disrespectful. The card is an extension of the person's identity." },
      ]
    }
  },
  {
    title: "Negotiating Without Offence",
    pillar: 3, region_code: "CN", age_group: "30-55", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 4, noble_score_impact: 7,
    content_json: {
      situation: "A Chinese business partner proposes a price you find unacceptable. You wish to negotiate. You are in a group meeting.",
      question: "What is the most effective and appropriate approach?",
      options: [
        { text: "State clearly that the price is too high and propose your figure directly.", correct: false, explanation: "Direct contradiction in a group setting risks causing your counterpart to lose face. This damages the relationship and typically makes negotiation harder, not easier." },
        { text: "Express appreciation for the proposal, then raise concerns diplomatically and suggest a further conversation.", correct: true, explanation: "Correct. Acknowledging the proposal with appreciation preserves face. Framing a follow-up conversation allows negotiation to proceed without public confrontation." },
        { text: "Laugh it off and propose your figure as a joke first to soften the message.", correct: false, explanation: "Humour in formal Chinese business contexts can easily misfire. This approach risks being perceived as dismissive rather than diplomatic." },
        { text: "Accept and renegotiate in private correspondence immediately after.", correct: false, explanation: "While private follow-up is wise, accepting in public creates a commitment that may be difficult to walk back. Express initial interest while reserving final agreement." },
      ]
    }
  },
  {
    title: "The Silent Moment",
    pillar: 3, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "During a business discussion with your Chinese counterpart, they go silent for thirty seconds after you make a proposal.",
      question: "How should you respond to this silence?",
      options: [
        { text: "Fill the silence immediately — offer to clarify or revise your proposal.", correct: false, explanation: "Rushing to fill silence in Chinese business culture signals nervousness and undermines your position. Silence indicates reflection, not rejection." },
        { text: "Remain composed and wait — silence indicates they are thinking, not refusing.", correct: true, explanation: "Precisely. In Chinese communication culture, silence after a proposal is typically a sign of consideration and respect. Maintaining composure demonstrates confidence and cultural awareness." },
        { text: "Apologise and ask if you have offended them.", correct: false, explanation: "Apologising for silence suggests you have misread the situation and introduces unnecessary awkwardness. Simply remain patient and composed." },
        { text: "Speak more quietly to signal that you are comfortable with the pace.", correct: false, explanation: "Adjusting your volume is unlikely to communicate anything useful. The most eloquent response to silence is composed, patient silence in return." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // CHINA — Pillar 4: Table Manners
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Banquet Seat",
    pillar: 4, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 4, noble_score_impact: 7,
    content_json: {
      situation: "You are the guest of honour at a formal Chinese banquet. You enter the private dining room and see a large round table. Several Chinese colleagues are already present.",
      question: "Where should you sit?",
      options: [
        { text: "Take any available seat — round tables have no hierarchy.", correct: false, explanation: "At Chinese formal banquets, seating is highly structured by hierarchy. The guest of honour typically faces the door, with the host's back to the door." },
        { text: "Wait for the host to indicate your seat.", correct: true, explanation: "Always allow the host to direct seating at a Chinese formal dinner. Seating reflects hierarchy, and choosing your own seat may create awkwardness." },
        { text: "Sit closest to the door for easy exit.", correct: false, explanation: "The seat closest to the door is traditionally the host's seat. The guest of honour typically sits furthest from the door." },
        { text: "Sit next to the most senior-looking guest.", correct: false, explanation: "This may be correct by chance, but attempting to assess seniority yourself creates unnecessary risk. Simply wait for direction." },
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
        { text: "Stick them vertically into the rice bowl so they don't roll away.", correct: false, explanation: "This is one of the most serious taboos in Chinese dining. Chopsticks standing upright in rice evoke the incense sticks used in funeral rites — deeply inauspicious." },
        { text: "Rest them horizontally across the top of the rice bowl.", correct: false, explanation: "While better than vertical placement, the proper solution is to use the chopstick rest if provided, or lay them across the edge of the plate." },
        { text: "Rest them on the chopstick holder provided, or lay them parallel across your plate.", correct: true, explanation: "Correct. Using the chopstick holder — or resting them horizontally across the edge of a dish — is the proper, considered approach." },
        { text: "Hand them to a neighbouring diner to hold.", correct: false, explanation: "This is unnecessarily imposing. Simply use the chopstick holder or rest them on your plate." },
      ]
    }
  },
  {
    title: "Serving the Shared Dish",
    pillar: 4, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "At a Chinese banquet, shared dishes are placed at the centre of the table. You wish to take some food from a dish using your chopsticks.",
      question: "What is the correct approach?",
      options: [
        { text: "Use your personal chopsticks to take food directly from the shared dish.", correct: false, explanation: "Using personal chopsticks in a shared dish — the chopsticks you have eaten with — is considered unhygienic and inconsiderate in formal Chinese dining." },
        { text: "Use the dedicated serving chopsticks or spoons provided for each dish.", correct: true, explanation: "Precisely. Serving chopsticks or spoons are placed beside shared dishes for exactly this purpose. Use them to transfer food to your personal plate before eating." },
        { text: "Flip your chopsticks and use the clean, uncontacted ends.", correct: false, explanation: "While this is sometimes seen as a polite compromise, it is not universally accepted and still risks appearing informal. Use the serving utensils provided." },
        { text: "Wait for the host to serve you first.", correct: false, explanation: "At a banquet, the host will often encourage guests to help themselves. Waiting passively for each course to be served to you personally may hold up the meal." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // CHINA — Pillar 5: Drinks
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Ganbei Toast",
    pillar: 5, region_code: "CN", age_group: "18-50", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "Your host raises a glass of baijiu and calls 'Ganbei!' directing the toast toward you, the foreign guest. You do not drink spirits.",
      question: "What is the most appropriate response?",
      options: [
        { text: "Firmly decline — you never drink spirits.", correct: false, explanation: "A flat refusal, particularly without explanation, can cause your host to lose face and signals an unwillingness to engage in the relationship." },
        { text: "Drink the glass fully — it is rude not to.", correct: false, explanation: "While enthusiastic participation is appreciated, you are not obliged to drain the glass if spirits are genuinely not something you consume." },
        { text: "Raise the glass, touch it to your lips to acknowledge the toast, then explain gently that spirits don't agree with you.", correct: true, explanation: "This is the measured, respectful approach. Acknowledging the gesture fully then excusing yourself graciously preserves face on all sides." },
        { text: "Ask the waiter to bring you something else first.", correct: false, explanation: "Delaying the toast to organise an alternative drink creates awkwardness. Handle the situation directly with grace." },
      ]
    }
  },
  {
    title: "The Tea Refill",
    pillar: 5, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "A Chinese colleague refills your teacup during a business lunch.",
      question: "What is the polite gesture to acknowledge this act?",
      options: [
        { text: "Say 'thank you' verbally — no gesture is necessary.", correct: false, explanation: "While verbal thanks is not wrong, there is a traditional non-verbal gesture specifically for this occasion that signals cultural awareness." },
        { text: "Tap two fingers gently on the table near your cup.", correct: true, explanation: "Precisely. Tapping two fingers (bent to resemble a kowtow) on the table is a traditional, discreet way of expressing gratitude for a tea refill. It is a mark of genuine cultural courtesy." },
        { text: "Immediately refill their cup in return.", correct: false, explanation: "While pouring for others first is a good general principle, immediately reciprocating the refill can seem reflexive rather than considerate. A gentle acknowledgement is the primary response." },
        { text: "Nod your head and smile — that is universally understood.", correct: false, explanation: "A nod and smile are pleasant but miss an opportunity to demonstrate cultural knowledge. The two-finger tap is a meaningful specific gesture in this context." },
      ]
    }
  },
  {
    title: "Pouring Tea at the Table",
    pillar: 5, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You have been asked to pour tea from the teapot for the table. There are four people, including yourself.",
      question: "What is the correct sequence for pouring?",
      options: [
        { text: "Pour your own cup first, then the others.", correct: false, explanation: "Pouring for yourself first is considered self-serving in Chinese culture. Pour for others as a gesture of consideration and respect." },
        { text: "Pour for the most senior person first, then the others in order, and yourself last.", correct: true, explanation: "Correct. Pouring for the eldest or most senior guest first, working your way around to yourself last, is the respectful sequence in Chinese social dining." },
        { text: "Pour for the person sitting nearest the teapot first.", correct: false, explanation: "Convenience of proximity does not override the principle of seniority. Pour in order of seniority, not proximity." },
        { text: "Pour equal amounts simultaneously by switching cups rapidly — efficiency shows respect.", correct: false, explanation: "This approach prioritises efficiency over ritual. Each cup should be poured individually with care, beginning with the most senior guest." },
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CANADA — Pillar 1: Cultural Knowledge
  // ─────────────────────────────────────────────────────────────────────────────
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
    title: "The American Assumption",
    pillar: 1, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You meet a Canadian at a social event and remark, 'Oh, you must be American — the accent is similar!' They respond politely but their expression shifts.",
      question: "What have you likely done, and how should you respond?",
      options: [
        { text: "Nothing significant — it is an easy mistake and they would understand.", correct: false, explanation: "Being mistaken for American is one of the most reliably irritating assumptions for Canadians. Canadian identity is distinct and deeply valued." },
        { text: "You have touched a cultural nerve — apologise briefly and ask about their background with genuine interest.", correct: true, explanation: "Precisely. A brief, sincere apology followed by genuine curiosity demonstrates awareness and respect. Canadians have a strong national identity quite distinct from their southern neighbours." },
        { text: "Explain that Americans and Canadians are broadly similar — most people agree.", correct: false, explanation: "This would compound the original error. Canadians are not 'broadly similar' to Americans in self-perception and take the distinction seriously." },
        { text: "Make a joke about it to lighten the atmosphere.", correct: false, explanation: "Humour at this moment risks deepening the offence. A sincere, brief acknowledgement of the mistake is far more effective." },
      ]
    }
  },
  {
    title: "The Punctuality Standard",
    pillar: 1, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are invited to a Canadian colleague's home for dinner at 7pm. You get caught in traffic and realise you will be fifteen minutes late.",
      question: "What is the appropriate course of action?",
      options: [
        { text: "Arrive when you arrive — fifteen minutes is not significant.", correct: false, explanation: "In Canadian social culture, punctuality is expected and unexplained lateness is considered disrespectful. Fifteen minutes without notice is not trivial." },
        { text: "Send a brief message apologising and giving your estimated arrival time.", correct: true, explanation: "Precisely. Notifying your host promptly, with an apology and an estimated time, is the correct and considerate action. This allows them to adjust accordingly and demonstrates respect for their effort." },
        { text: "Arrive and apologise profusely when you get there.", correct: false, explanation: "Apologising upon arrival is better than not apologising, but the considerate act is to notify your host in advance, not after the fact." },
        { text: "Cancel and reschedule — it is better not to arrive late at all.", correct: false, explanation: "Cancelling at short notice over a fifteen-minute delay causes more disruption than a brief, apologetic late arrival with advance notice." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // CANADA — Pillar 2: Appearance
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "Cottage Weekend Attire",
    pillar: 2, region_code: "CA", age_group: "18-50", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 3,
    content_json: {
      situation: "A Canadian colleague invites you to their family cottage for the weekend. You are packing.",
      question: "What is appropriate attire for a Canadian cottage weekend?",
      options: [
        { text: "Smart casual throughout — maintaining a polished appearance is always appropriate.", correct: false, explanation: "A cottage weekend is a genuinely casual occasion. Arriving in smart casual clothing for outdoor activities would be conspicuously overdressed." },
        { text: "Genuinely casual, practical outdoor clothing — comfortable and weather-appropriate.", correct: true, explanation: "Precisely. The cottage context is one of the few social situations in Canadian culture where genuinely casual, practical dress is fully appropriate and expected. Bring layers for variable weather." },
        { text: "Formal wear for the first evening — first impressions matter.", correct: false, explanation: "Wearing formal attire to a casual cottage setting would cause significant awkwardness. Match the occasion." },
        { text: "Swimwear throughout — it is a cottage, after all.", correct: false, explanation: "Swimwear is appropriate near the water but not for general wear. Casual, comfortable clothing is the correct choice for the overall weekend." },
      ]
    }
  },
  {
    title: "The Tech Company Interview",
    pillar: 2, region_code: "CA", age_group: "20-40", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You have an interview at a Canadian technology company known for a relaxed, modern culture. The invitation gives no dress code guidance.",
      question: "What is the most appropriate attire?",
      options: [
        { text: "Jeans and a graphic T-shirt — tech companies are casual and you will fit in.", correct: false, explanation: "While tech environments in Canada are generally casual, arriving in casual attire for an interview signals insufficient preparation and respect for the process." },
        { text: "A dark business suit — formality always makes a positive first impression.", correct: false, explanation: "A full business suit in a casual tech environment may read as overly stiff and disconnected from the company culture. Calibrate to the context." },
        { text: "Smart casual — well-fitted trousers or dark jeans, a collared shirt or neat top, clean shoes.", correct: true, explanation: "Precisely. Smart casual strikes the right balance: professional enough to show seriousness, relaxed enough to signal cultural fit. Clean, well-fitted clothing is the foundation." },
        { text: "Ask the recruiter what to wear — it shows initiative.", correct: false, explanation: "While initiative is valued, asking about dress code for a casual tech interview can signal uncertainty about professional norms. Smart casual is a safe and thoughtful default." },
      ]
    }
  },
  {
    title: "Winter Outerwear",
    pillar: 2, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 3,
    content_json: {
      situation: "It is January in Toronto (-15°C) and you are attending a business networking event that begins in the lobby of an office building.",
      question: "What does appropriate winter dress signal in this Canadian context?",
      options: [
        { text: "Very little — weather practicality is separate from professional appearance.", correct: false, explanation: "In Canada's climate, appropriate outerwear signals practical competence and awareness of local conditions. Underestimating the cold is noted." },
        { text: "Practical, high-quality winter outerwear signals adaptation to Canadian conditions and attention to appropriate preparation.", correct: true, explanation: "Precisely. Arriving appropriately dressed for the actual climate communicates practical intelligence and respect for local conditions — both professional virtues in Canada." },
        { text: "That you are local — only Canadians dress properly for winter.", correct: false, explanation: "Anyone, regardless of origin, can demonstrate appropriate winter preparation. The signal is one of practical care, not nationality." },
        { text: "Nothing beyond warmth — functional outdoor gear has no professional implications.", correct: false, explanation: "The quality and care with which you present yourself in any context — including winter outerwear — is observed. Practical does not mean careless." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // CANADA — Pillar 3: Eloquence
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Language Question",
    pillar: 3, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You are in Montreal for a conference. You approach a local shopkeeper to ask for directions. You are not sure if they speak English.",
      question: "How do you begin the interaction most appropriately?",
      options: [
        { text: "Begin in English immediately — most people in Canada speak English.", correct: false, explanation: "In Quebec, French is the primary language and an important part of cultural identity. Beginning in English without acknowledgement can be perceived as dismissive." },
        { text: "Open with 'Bonjour/Hi' — acknowledging both languages — then proceed in whichever they respond in.", correct: true, explanation: "The 'Bonjour/Hi' greeting acknowledges Quebec's bilingual reality. It opens the door for the other person to respond in their preferred language." },
        { text: "Attempt the entire interaction in French, even if your French is poor.", correct: false, explanation: "While a token effort in French is appreciated, struggling through the entire conversation when the other party likely speaks English may cause unnecessary difficulty." },
        { text: "Ask 'Parlez-vous anglais?' before saying anything else.", correct: false, explanation: "Opening by asking if they speak English, before acknowledging French at all, can come across as presumptuous. The Bonjour/Hi approach is far more gracious." },
      ]
    }
  },
  {
    title: "The Canadian Apology",
    pillar: 3, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are walking through a crowded Canadian market. Someone bumps into you. Before you can say anything, they immediately say 'Sorry!' even though it was not clearly their fault.",
      question: "How should you interpret this reflexive apology?",
      options: [
        { text: "They are admitting fault — accept the apology formally.", correct: false, explanation: "In Canadian culture, 'sorry' functions as a social lubricant rather than a formal admission of fault. It signals goodwill and de-escalation, not guilt." },
        { text: "It is a culturally reflexive courtesy — acknowledge it briefly and move on.", correct: true, explanation: "Precisely. Canadians often apologise reflexively in any collision or inconvenience, regardless of fault. The appropriate response is a brief, friendly acknowledgement — perhaps 'No, no — sorry myself' — and continuing." },
        { text: "It is meaningless — ignore it and carry on.", correct: false, explanation: "While the apology is not a formal admission of fault, ignoring it entirely is unnecessarily cold. A brief acknowledgement maintains the pleasant social register Canadians expect." },
        { text: "Apologise extensively in return — this is the expected reciprocation.", correct: false, explanation: "A brief, friendly reciprocation is appropriate, but extensive apology from both parties becomes circular and unnecessarily prolonged. One exchange is sufficient." },
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
  // ─────────────────────────────────────────────────────────────────────────────
  // CANADA — Pillar 4: Table Manners
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Dietary Request",
    pillar: 4, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are attending a dinner party at a Canadian colleague's home. You are vegetarian and the host has not asked about dietary restrictions.",
      question: "When and how should you communicate your dietary requirements?",
      options: [
        { text: "Do not mention it — it is rude to impose restrictions on a host.", correct: false, explanation: "In Canada, dietary restrictions are openly discussed and widely respected. Staying silent and then being unable to eat most of the meal is far more disruptive to your host than a simple advance notice." },
        { text: "Mention it in advance when confirming attendance, briefly and without drama.", correct: true, explanation: "Precisely. A brief advance notice allows your host to accommodate you without disruption. Most Canadian hosts actively appreciate knowing dietary needs early." },
        { text: "Wait until you arrive and then explain quietly — this minimises disruption.", correct: false, explanation: "Informing the host upon arrival leaves them no opportunity to prepare alternatives. Advance notice is significantly more considerate." },
        { text: "Eat what you can and avoid drawing attention to what you cannot eat.", correct: false, explanation: "This may result in you eating very little or appearing to pick at your food — which can concern or embarrass the host. A simple advance communication is the better approach." },
      ]
    }
  },
  {
    title: "Complimenting the Meal",
    pillar: 4, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 3,
    content_json: {
      situation: "You are at a dinner party in Vancouver. The host has made a delicious roast that you genuinely enjoyed.",
      question: "What is the appropriate way to express your appreciation?",
      options: [
        { text: "Say nothing — in modest Canadian culture, pointing out the quality of the food implies you are surprised.", correct: false, explanation: "Silence on the quality of the meal would be considered unusual and slightly cold. Expressing appreciation for effort and quality is entirely expected." },
        { text: "Compliment the meal specifically — 'the roast was exceptional, particularly the way it was seasoned'.", correct: true, explanation: "Precisely. A specific compliment is far more meaningful than a general one, and Canadians welcome sincere appreciation. Specificity shows that you genuinely noticed and valued the effort." },
        { text: "Say 'Everything was great, thank you' and leave it at that.", correct: false, explanation: "This is acceptable but rather generic. A specific compliment about a particular dish or preparation demonstrates genuine attention and is more gratifying to the host." },
        { text: "Offer to cook next time to balance the social debt.", correct: false, explanation: "While generous in intent, this can feel slightly transactional. A warm, specific compliment on the meal is the primary and sufficient response." },
      ]
    }
  },
  {
    title: "The Dinner Party Seating",
    pillar: 4, region_code: "CA", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You arrive at a Canadian friend's dinner party where eight people will be dining. There are no place cards at the table.",
      question: "What is the appropriate approach to finding a seat?",
      options: [
        { text: "Sit wherever you wish immediately — it is a casual gathering.", correct: false, explanation: "Even at a casual dinner party, it is considerate to greet the host first and take their lead on seating. Sitting before greeting the host is slightly abrupt." },
        { text: "Greet the host, then wait briefly to see if they direct seating or indicate you can choose.", correct: true, explanation: "Correct. Greeting the host first is always appropriate. Most Canadian hosts will either direct you to a seat or cheerfully invite you to sit wherever you like. Follow their lead." },
        { text: "Ask loudly where everyone should sit so the host can organise the table.", correct: false, explanation: "Making a public announcement about seating arrangements places unnecessary attention on the logistics. Simply greet the host and follow their informal direction." },
        { text: "Take the seat at the head of the table — it is the most prominent position.", correct: false, explanation: "The head of the table is conventionally reserved for the host. Taking it without being directed there would be presumptuous." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // CANADA — Pillar 5: Drinks
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Wine as Host Gift",
    pillar: 5, region_code: "CA", age_group: "25-55", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are attending a dinner party at a Canadian acquaintance's home for the first time. You wish to bring a host gift.",
      question: "Is a bottle of wine an appropriate host gift in this context?",
      options: [
        { text: "No — wine is too generic and the host may not drink alcohol.", correct: false, explanation: "Wine remains the single most common and accepted host gift in Canadian social dining culture. If you know the host does not drink, choose an alternative — but wine is otherwise entirely appropriate." },
        { text: "Yes — a bottle of wine is a well-regarded and widely appropriate host gift.", correct: true, explanation: "Precisely. A quality bottle of wine is one of the most universally appreciated host gifts in Canada. It signals thought and generosity without being excessive." },
        { text: "Only if it is a Canadian wine — showing local knowledge is appreciated.", correct: false, explanation: "While a Canadian wine is an excellent and thoughtful choice, it is not the only appropriate option. Any quality wine is well-received." },
        { text: "Only bring flowers — wine may feel presumptuous.", correct: false, explanation: "Flowers are also a fine host gift, but wine is neither presumptuous nor inappropriate. Both are excellent choices for a Canadian dinner party." },
      ]
    }
  },
  {
    title: "The Tim Hortons Order",
    pillar: 5, region_code: "CA", age_group: "18-60", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 3,
    content_json: {
      situation: "A Canadian colleague offers to pick up coffees from Tim Hortons. They ask how you take your coffee.",
      question: "What is the significance of this seemingly simple social exchange?",
      options: [
        { text: "None — it is simply a practical question about coffee preferences.", correct: false, explanation: "While the question is indeed practical, Tim Hortons occupies a specific cultural role in Canada. Familiarity with the institution and its terminology is a small but genuine signal of cultural engagement." },
        { text: "It is an opportunity to demonstrate cultural familiarity — knowing 'double-double' signals engagement with Canadian culture.", correct: true, explanation: "Precisely. A 'double-double' (two creams and two sugars) is the most famous Tim Hortons order. Knowing it signals that you are engaged with Canadian culture at a human level — a small but meaningful connection." },
        { text: "You should decline coffee — accepting always creates a social debt.", correct: false, explanation: "No such debt is created. Accepting coffee offered by a colleague is a natural social courtesy. Declining without reason is unnecessarily formal." },
        { text: "It is a test of whether you prefer Tim Hortons or Starbucks — Canadians are tribal about this.", correct: false, explanation: "While Canadians may have preferences between the two, this is not the primary meaning of the exchange. The social gesture and the specific Canadian coffee culture of Tim Hortons are the relevant dimensions." },
      ]
    }
  },
  {
    title: "The Craft Beer Conversation",
    pillar: 5, region_code: "CA", age_group: "19-45", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "You are at a social gathering in Vancouver. A Canadian friend hands you a locally brewed craft beer and asks what you think of the local brewing scene.",
      question: "What response best demonstrates cultural engagement?",
      options: [
        { text: "'I don't really follow the beer scene — it all tastes the same to me.'", correct: false, explanation: "This response dismisses a topic your host has specifically raised with enthusiasm. Even modest genuine curiosity is far better than indifference." },
        { text: "Show genuine curiosity — ask about the specific brewery, what makes it distinctive, and express genuine interest in trying something local.", correct: true, explanation: "Precisely. Showing genuine curiosity and appreciation for local craft brewing demonstrates cultural engagement and makes for warm conversation. You need not be an expert — genuine interest is the key." },
        { text: "'I prefer European beers — Canada doesn't have the tradition.'", correct: false, explanation: "This response is dismissive of a genuine and growing craft tradition. Canada has produced internationally recognised breweries, and this comparison would be received poorly." },
        { text: "Agree enthusiastically regardless of your actual view — positivity is always appropriate.", correct: false, explanation: "Insincere enthusiasm is easily detected and creates an artificial conversation. Genuine curiosity, even if you are unfamiliar with the topic, is far more engaging and authentic." },
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AUSTRALIA — Pillar 1: Cultural Knowledge
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Promotion Announcement",
    pillar: 1, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "Your Australian colleague has just been promoted to a senior management position. At the team lunch, they mention it briefly and then immediately change the subject.",
      question: "How do you respond to your colleague's promotion?",
      options: [
        { text: "Make a toast and give a long speech about their remarkable achievements and career trajectory.", correct: false, explanation: "Australians are deeply uncomfortable with public elevation. A long speech of praise triggers the 'tall poppy' instinct — your colleague changed the subject deliberately." },
        { text: "Offer a warm but brief congratulations, then let the conversation move on as they indicated.", correct: true, explanation: "Precisely right. Matching your colleague's own level of understatement is the socially intelligent response. They downplayed it intentionally; honour that." },
        { text: "Express surprise — you hadn't noticed they were particularly outstanding.", correct: false, explanation: "While Australians value modesty, expressing surprise at someone's success is unkind rather than egalitarian." },
        { text: "Say nothing — mentioning it at all might embarrass them further.", correct: false, explanation: "A brief, genuine congratulations is entirely appropriate. Saying nothing would seem cold. The key is brevity, not silence." },
      ]
    }
  },
  {
    title: "The Land Acknowledgement",
    pillar: 1, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "formal", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 6,
    content_json: {
      situation: "You have been asked to open a formal business conference in Sydney. You are aware of the practice of acknowledging the Traditional Owners of the land.",
      question: "How should you open the conference?",
      options: [
        { text: "Skip the acknowledgement — it is a political gesture and not necessary in a business context.", correct: false, explanation: "In contemporary Australia, a land acknowledgement at formal events is considered standard courtesy, not a political statement. Omitting it is increasingly noticed and considered an oversight." },
        { text: "Open with a sincere acknowledgement of the Gadigal people of the Eora Nation as the Traditional Custodians of the land.", correct: true, explanation: "Correct. A respectful, sincere acknowledgement of the relevant Traditional Custodians demonstrates cultural awareness and respect. It should be delivered genuinely, not as a formality." },
        { text: "Ask an Australian colleague if it is really necessary before deciding.", correct: false, explanation: "While consulting locally is wise, at a formal conference in a major city this is now expected. Asking whether it is 'necessary' signals unfamiliarity with contemporary Australian norms." },
        { text: "Give an extended speech on Australian history to demonstrate your awareness.", correct: false, explanation: "An extended lecture is not appropriate. The acknowledgement should be brief, sincere, and respectful — its power lies in its genuine simplicity." },
      ]
    }
  },
  {
    title: "The Moving Request",
    pillar: 1, region_code: "AU", age_group: "18-30", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "An Australian friend asks if you can help them move house on Saturday. You have no other plans that day.",
      question: "What is the appropriate response?",
      options: [
        { text: "Decline politely — physical labour is not something you normally offer to do for acquaintances.", correct: false, explanation: "In Australian culture, helping a mate move is an expression of mateship — one of the culture's highest values. Declining without a genuine reason is seen as letting someone down." },
        { text: "Agree readily and show up on time, ready to help without complaint.", correct: true, explanation: "Exactly right. Showing up willingly and working hard without complaint is the Australian ideal of being a good mate. The reciprocity of mateship is taken seriously." },
        { text: "Agree but suggest they hire a removal company instead.", correct: false, explanation: "While this is practical, it sidesteps the request for personal help. Your friend asked for your presence, not your logistical advice." },
        { text: "Say you will try to make it — keeping options open is polite.", correct: false, explanation: "Vagueness is not considered polite in Australia — it is evasive. A mate gives a straight answer." },
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AUSTRALIA — Pillar 2: Appearance
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Business Meeting Dress",
    pillar: 2, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You have a first meeting with an Australian technology company in Melbourne. The email confirms it is a 'business casual' environment.",
      question: "What do you wear to the meeting?",
      options: [
        { text: "A full formal suit with tie — it is always better to be overdressed for a first impression.", correct: false, explanation: "In Australian business culture, a full formal suit to a business casual tech meeting would immediately mark you as out of place and out of touch with local norms." },
        { text: "Smart casual — well-fitted chinos or trousers, a collared shirt, clean shoes.", correct: true, explanation: "Correct. Smart casual is the sweet spot for Australian business casual. Well-presented and professional without unnecessary formality." },
        { text: "Jeans and a T-shirt — they said casual, so casual it is.", correct: false, explanation: "'Business casual' still means business. Jeans and a T-shirt would be underdressed and signal poor professional judgement." },
        { text: "Ask the organiser for a precise dress code before deciding.", correct: false, explanation: "While clarifying is reasonable in some cultures, asking for more precision on 'business casual' in Australia would likely seem overly anxious. Use good judgement." },
      ]
    }
  },
  {
    title: "The Backyard BBQ Arrival",
    pillar: 2, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You have been invited to a Sunday afternoon BBQ at a colleague's home. The invitation says 'come as you are'.",
      question: "What do you wear?",
      options: [
        { text: "Smart casual — you want to make a good impression.", correct: false, explanation: "While not wrong, 'smart casual' at a backyard BBQ in Australia may read as slightly overdressed and a little stiff. Clean, comfortable, practical clothing is the mark." },
        { text: "Clean, comfortable casual clothing — neat but relaxed, appropriate for outdoors.", correct: true, explanation: "Exactly right. 'Come as you are' means relaxed but presentable — clean clothes that are comfortable outdoors. This reads perfectly in the Australian social context." },
        { text: "Formal wear — this is a social occasion at a colleague's home.", correct: false, explanation: "A BBQ in formal wear would be immediately and memorably peculiar. Read the room — or the invitation." },
        { text: "Activewear — it is Sunday and it will be outdoors.", correct: false, explanation: "Activewear at a social BBQ is underdressed for a colleague's home. Clean casual is the standard; activewear suggests you didn't consider the occasion." },
      ]
    }
  },
  {
    title: "The Gala Dinner",
    pillar: 2, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "formal", difficulty_level: 2, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You receive an invitation to an industry gala dinner in Sydney. The dress code states 'Black Tie'.",
      question: "What do you wear?",
      options: [
        { text: "A dark business suit — Australia is casual, so Black Tie is probably just a suggestion.", correct: false, explanation: "Australians generally relax formality, but when they specify Black Tie they mean it. A business suit at a Black Tie event is a noticeable error." },
        { text: "A dinner jacket (tuxedo) with black bow tie, formal trousers, and black dress shoes.", correct: true, explanation: "Correct. Black Tie in Australia means what it says. The relaxed general standard makes formal occasions stand out — honour the dress code fully." },
        { text: "A smart cocktail suit — it is close to Black Tie and more versatile.", correct: false, explanation: "A cocktail suit is not Black Tie. When the dress code is specified, respect it precisely." },
        { text: "Ask the organiser if Black Tie is strictly required.", correct: false, explanation: "The invitation specifies Black Tie. Asking whether it is 'strictly required' reads as looking for an excuse not to comply. Simply dress accordingly." },
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AUSTRALIA — Pillar 3: Eloquence
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The New Colleague",
    pillar: 3, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You join an Australian company and meet your new manager, Dr. Sarah Mitchell, for the first time. She introduces herself simply as 'Sarah'.",
      question: "How do you address her going forward?",
      options: [
        { text: "Continue to call her Dr. Mitchell — she holds a doctorate and should be addressed correctly.", correct: false, explanation: "She introduced herself as Sarah. In Australian workplace culture, using a title when someone has offered their first name creates unnecessary formality and may cause mild awkwardness." },
        { text: "Call her Sarah, as she has introduced herself.", correct: true, explanation: "Exactly right. In Australia, first names are adopted almost immediately once offered. Using a title when someone has given their first name goes against the egalitarian workplace norm." },
        { text: "Ask her how she prefers to be addressed — this shows respect.", correct: false, explanation: "She has already answered this by introducing herself as Sarah. Asking again is redundant and slightly awkward." },
        { text: "Use 'Dr. Mitchell' in formal settings and 'Sarah' in casual ones.", correct: false, explanation: "This distinction would feel strange in most Australian workplaces. She said Sarah; use Sarah consistently." },
      ]
    }
  },
  {
    title: "The Teasing Colleague",
    pillar: 3, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "At a team lunch, an Australian colleague makes a light-hearted joke at your expense — ribbing you about spilling coffee earlier that morning. The group laughs warmly.",
      question: "How do you respond?",
      options: [
        { text: "Take offence — being mocked in front of colleagues is unprofessional.", correct: false, explanation: "In Australian culture, light-hearted teasing from a colleague is typically a sign of acceptance and affection, not disrespect. Taking genuine offence would create real awkwardness." },
        { text: "Laugh along and make a self-deprecating remark in return.", correct: true, explanation: "Perfect. Joining in with good humour — especially by gently mocking yourself — signals that you understand Australian social dynamics and are comfortable in the group." },
        { text: "Smile politely but say nothing — don't encourage it.", correct: false, explanation: "Polite silence reads as either awkwardness or mild displeasure. Joining the banter, even briefly, is the warmer and more socially fluent response." },
        { text: "Tease the colleague back sharply to assert yourself.", correct: false, explanation: "A sharp retort may escalate unexpectedly. Keeping it light and self-deprecating is safer and more in the spirit of the exchange." },
      ]
    }
  },
  {
    title: "The Performance Review",
    pillar: 3, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "business", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "Your Australian manager asks for your honest assessment of a project that did not go as well as hoped. You had reservations about the approach from the beginning.",
      question: "How do you respond?",
      options: [
        { text: "Be diplomatic — focus on the positives and gently hint at any issues.", correct: false, explanation: "Excessive diplomacy frustrates Australian business culture. If your manager asks for honest feedback, give it — with clarity and without harshness." },
        { text: "Give a direct, honest assessment, noting what worked and what did not, with specific examples.", correct: true, explanation: "Correct. Australians value direct, honest feedback in professional settings. Being specific, constructive, and plain-spoken is seen as professional and trustworthy." },
        { text: "Avoid mentioning your earlier reservations — it would seem like saying 'I told you so'.", correct: false, explanation: "If the reservations are relevant to understanding what went wrong, sharing them diplomatically is useful and honest. Pretending you had no concerns is not constructive." },
        { text: "Agree with whatever your manager says to maintain harmony.", correct: false, explanation: "If your manager specifically asks for your view, simply agreeing is unhelpful. Australian workplace culture respects those who contribute their genuine perspective." },
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AUSTRALIA — Pillar 4: Table Manners
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The BBQ Host",
    pillar: 4, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are a guest at an Australian backyard BBQ. The host is cooking at the grill. You consider yourself a skilled cook and notice the steaks could be turned sooner.",
      question: "What do you do?",
      options: [
        { text: "Take over at the grill — your host will appreciate your expertise.", correct: false, explanation: "The host manages the BBQ. Taking over uninvited — however well-intentioned — is a significant breach of BBQ protocol in Australia." },
        { text: "Quietly mention to the host that the steaks might need turning.", correct: false, explanation: "Unless the host asks for help, offering unsolicited cooking advice is presumptuous. The host has it under control." },
        { text: "Say nothing — the BBQ belongs to the host, and you are there to enjoy yourself as a guest.", correct: true, explanation: "Exactly right. In Australia, the host controls the BBQ absolutely. Your role as a guest is to enjoy the company, not manage the grill." },
        { text: "Loudly ask other guests if they agree the steaks look done.", correct: false, explanation: "Drawing the group's attention to a perceived failing is worse than saying nothing. It embarrasses your host in their own home." },
      ]
    }
  },
  {
    title: "The Restaurant Bill",
    pillar: 4, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are dining with four Australian colleagues after a team meeting. The bill arrives. No one ordered significantly more than anyone else.",
      question: "What is the expected approach to the bill?",
      options: [
        { text: "Calculate each person's exact share, including their drinks and any extras.", correct: false, explanation: "Meticulous individual accounting is seen as petty in Australia. Among friends or colleagues with similar orders, splitting equally is the norm and far smoother." },
        { text: "Split the bill equally among the four of you.", correct: true, explanation: "Correct. Equal splitting is the default among Australians in casual dining. It is quick, fair enough, and avoids the awkwardness of detailed accounting." },
        { text: "Wait for someone else to suggest how to handle it.", correct: false, explanation: "Being passive leaves others to manage the situation. Contributing actively to the bill conversation is normal and expected." },
        { text: "Insist on paying the whole bill — generosity is always appreciated.", correct: false, explanation: "While generous, insisting on covering the full bill for a group of colleagues who didn't expect it creates awkwardness and obligation." },
      ]
    }
  },
  {
    title: "The BYO Dinner",
    pillar: 4, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are invited to a friend's home for a casual dinner. The host mentions it is BYO — bring your own drinks.",
      question: "What do you bring?",
      options: [
        { text: "Nothing — BYO means the host handles the food and you provide only for yourself.", correct: false, explanation: "BYO means you bring drinks to share, not just enough for yourself. Arriving with only your own portion is considered mean-spirited." },
        { text: "A bottle of wine or a six-pack of beer — enough to share generously through the evening.", correct: true, explanation: "Correct. BYO in Australia means contributing to the group's drinks for the evening. Bringing enough to share generously is the expectation and the spirit of it." },
        { text: "A single drink for yourself — you are on a health programme.", correct: false, explanation: "If you have particular dietary reasons to limit your intake, a brief explanation is fine, but still bring something to contribute to the group." },
        { text: "Expensive spirits — to impress the other guests.", correct: false, explanation: "Expensive spirits may create an awkward dynamic. A good bottle of wine or quality beer is perfectly appropriate — and showing off is not the Australian spirit." },
      ]
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AUSTRALIA — Pillar 5: Drinks
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Pub Round",
    pillar: 5, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 5,
    content_json: {
      situation: "You are at a pub with five Australian colleagues after work. One colleague buys the first round. The drinks are consumed and conversation continues.",
      question: "What do you do next?",
      options: [
        { text: "Wait — someone will inevitably offer to buy the next round when they are ready.", correct: false, explanation: "Waiting passively for others to shout means you are not participating in the round system. This is noticed and remembered." },
        { text: "Offer to buy the next round — it is your turn to shout.", correct: true, explanation: "Exactly right. The round system — 'shouting' in Australian terms — is fundamental to pub culture. Taking your turn without prompting is expected and demonstrates you understand the social contract." },
        { text: "Buy only your own drink — you prefer not to be involved in rounds.", correct: false, explanation: "Opting out of rounds while continuing to drink with the group is strongly frowned upon. If you are staying, you participate." },
        { text: "Offer to transfer money to the first person who paid.", correct: false, explanation: "Transferring money rather than buying the round misses the social point entirely. The gesture of going to the bar and buying for the group is what matters." },
      ]
    }
  },
  {
    title: "The Coffee Order",
    pillar: 5, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 1, estimated_minutes: 2, noble_score_impact: 4,
    content_json: {
      situation: "You are having a morning meeting with Australian colleagues at a café. The server asks for your order. You usually drink drip filter coffee at home.",
      question: "What do you order?",
      options: [
        { text: "A drip filter coffee.", correct: false, explanation: "Drip filter coffee is not typically offered in Australian cafés, which operate on espresso-based drinks. Asking for it signals unfamiliarity with the local coffee culture." },
        { text: "A long black — espresso topped with hot water, the closest to your preference.", correct: true, explanation: "A long black is the Australian equivalent of a simple black coffee — espresso-based, strong, and widely available. It is an entirely appropriate and knowledgeable order." },
        { text: "An Americano.", correct: false, explanation: "While understood, ordering an 'Americano' in Australia may get a slightly puzzled look. The local term is 'long black' and using it signals cultural awareness." },
        { text: "Whatever is most popular — you don't want to seem fussy.", correct: false, explanation: "Australians have strong coffee preferences and order specifically. Asking for 'whatever is popular' would seem indecisive and may result in a surprise." },
      ]
    }
  },
  {
    title: "The Wine Conversation",
    pillar: 5, region_code: "AU", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 5,
    content_json: {
      situation: "At a dinner with Australian hosts, the conversation turns to Australian wine. Your host pours a Barossa Valley Shiraz and asks what you think of it.",
      question: "How do you respond?",
      options: [
        { text: "Give a detailed technical tasting note — discussing tannins, terroir, and the vintage.", correct: false, explanation: "An elaborate technical performance is likely to read as pretentious in Australian company. Genuine enthusiasm and curiosity are preferred over connoisseur display." },
        { text: "Express genuine enjoyment and ask what makes Barossa Shiraz distinctive.", correct: true, explanation: "Exactly right. Showing genuine pleasure and curiosity about the wine's character invites good conversation. Australians are proud of their wine regions — genuine interest is warmly received." },
        { text: "Mention that you prefer French wines — Australian wine has improved but still can't compare.", correct: false, explanation: "This is dismissive of a genuine world-class wine region. Australia produces wines that compete internationally; this comment would be poorly received." },
        { text: "Say you are not really a wine person to avoid saying the wrong thing.", correct: false, explanation: "While honest, opting out of the conversation entirely when your host has specifically invited your view is a missed social opportunity. A simple honest response — 'it is rich and full — I really like it' — is perfectly fine." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Bolton Cluster 1 — The Art of Listening
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Interrupted Confidence",
    pillar: 3, region_code: "GB", age_group: "all", gender_applicability: "all",
    context: "social", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 8,
    bolton_cluster: 1,
    behavioral_tags: ["listening", "attentiveness", "empathy"],
    correction_style: "A cultivated listener waits with composed patience. The impulse to fill silence or redirect a conversation reveals a preoccupation with one's own thoughts rather than an attentiveness to the speaker. The distinguished response is to hold space gracefully and allow the other to finish.",
    content_json: {
      situation: "A colleague is sharing a difficult personal experience during a quiet moment at a professional dinner. They pause mid-sentence, appearing to gather themselves. You sense they are not finished.",
      question: "What is the most refined course of action in this moment?",
      options: [
        { text: "Wait in composed silence, maintaining calm, attentive eye contact.", correct: true, explanation: "Precisely. A pause is not an invitation to speak — it is a request for patient presence. A truly cultivated listener holds stillness and allows the speaker to continue at their own pace." },
        { text: "Offer a reassuring sentence — 'Take your time, it sounds difficult.'", correct: false, explanation: "Well-intentioned, but speaking into a pause interrupts the speaker's internal process. Unless distress is acute, composed silence is a far greater act of consideration." },
        { text: "Gently change the subject to relieve the discomfort.", correct: false, explanation: "Redirecting the conversation denies the speaker the space they are seeking. It signals that your comfort takes precedence over their need to be heard — a social error of some consequence." },
        { text: "Lean forward and ask a question to show engagement.", correct: false, explanation: "A question, however well-meant, interrupts. Active listening is demonstrated through stillness and attention, not speech. Trust the silence." },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Bolton Cluster 2 — Assertiveness and Composure Under Social Pressure
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Persistent Host",
    pillar: 4, region_code: "CN", age_group: "all", gender_applicability: "all",
    context: "dining", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 8,
    bolton_cluster: 2,
    behavioral_tags: ["assertiveness", "boundary_setting", "face_preservation"],
    correction_style: "Confident composure is expressed not through direct refusal, but through gracious firmness. A repeated, kind declination — delivered with warmth and appreciation — is both socially sound and personally dignified. The cultivated guest neither capitulates under pressure nor sharpens into confrontation.",
    content_json: {
      situation: "At a formal dinner in Beijing, your host repeatedly offers you a dish you cannot eat due to a dietary restriction. They insist warmly, saying it is a great speciality and would bring you luck. You have already declined twice, politely.",
      question: "How do you decline a third time with grace?",
      options: [
        { text: "Accept a small portion and move it around your plate discreetly.", correct: false, explanation: "While this preserves immediate harmony, it risks discovery and greater embarrassment for both parties. It also denies you the opportunity to model gracious firmness — a virtue of equal value in Chinese hospitality.", behavior_signal: "passive" },
        { text: "Decline with composed warmth — 'Your generosity truly moves me; I must respectfully decline for health reasons, but I am deeply honoured by your care.'", correct: true, explanation: "Excellent. This formulation acknowledges the host's generosity, preserves their face, and declines with quiet authority. Framing the refusal as a health matter removes any implication of personal preference or rejection of the culture.", behavior_signal: "assertive" },
        { text: "Firmly say no and explain that you have a strict dietary requirement.", correct: false, explanation: "Bluntness — even truthful bluntness — in this context risks damaging the host's face. Firmness must be delivered within the container of warmth and gratitude.", behavior_signal: "aggressive" },
        { text: "Ask another guest to help you by taking the dish, without explaining.", correct: false, explanation: "Deflecting in this manner creates confusion and does not address the host directly. It sidesteps the social obligation to respond with dignified honesty.", behavior_signal: "passive_aggressive" },
      ]
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // Bolton Cluster 3 — Conflict Resolution and Social Repair
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: "The Misread Remark",
    pillar: 3, region_code: "US", age_group: "all", gender_applicability: "all",
    context: "professional", difficulty_level: 2, estimated_minutes: 3, noble_score_impact: 8,
    bolton_cluster: 3,
    behavioral_tags: ["conflict_resolution", "repair", "emotional_composure"],
    correction_style: "Social friction, when met with prompt and genuine acknowledgement, rarely becomes lasting damage. The cultivated response is to own the misstep without theatre — a brief, composed expression of regret followed by a sincere question about the other person's perspective. This transforms a rupture into a mark of character.",
    content_json: {
      situation: "During a business meeting in New York, a comment you made — intended lightly — appeared to offend a colleague. They have withdrawn from conversation and seem cool toward you. The meeting has ended and you are standing near each other.",
      question: "What is the most distinguished way to address this?",
      options: [
        { text: "Approach them privately and say, 'I noticed my remark earlier may not have landed as I intended — I hope it didn't offend you. I'd welcome your thoughts if I was off-key.'", correct: true, explanation: "Precisely calibrated. This acknowledges the rupture without dramatising it, invites dialogue, and signals self-awareness — without grovelling or making the moment larger than it needs to be.", behavior_signal: "collaborate" },
        { text: "Say nothing — the moment has passed and drawing attention to it will make it worse.", correct: false, explanation: "Unaddressed friction hardens into distance. A quiet, private approach is nearly always the correct remedy. Allowing coolness to persist is a missed opportunity for social repair.", behavior_signal: "avoid" },
        { text: "Send a brief message later — 'Hope all is well, didn't mean anything by the comment earlier!'", correct: false, explanation: "Text or message dilutes the sincerity of an apology and allows ambiguity of tone. A composed, private, in-person acknowledgement carries far more weight and dignity.", behavior_signal: "accommodate" },
        { text: "Speak to a mutual colleague and ask them to pass along your apologies.", correct: false, explanation: "Delegating an apology removes the personal accountability that gives it meaning. It also risks misrepresentation and places a social burden on a third party.", behavior_signal: "avoid" },
      ]
    }
  },
];

const FLAG_FORCE = process.argv.includes("--force");

async function seed() {
  console.log("Seeding SOWISO database (Atelier content)…");

  if (FLAG_FORCE) {
    // --force: clear and reseed (only safe in dev/staging with explicit intent)
    await db.execute(sql`TRUNCATE TABLE culture_protocols, scenarios RESTART IDENTITY CASCADE`);
    console.log("  --force: tables cleared for full reseed");
    await db.insert(cultureProtocolsTable).values(protocols);
    console.log(`  ${protocols.length} culture protocols inserted`);
    await db.insert(scenariosTable).values(scenarios);
    console.log(`  ${scenarios.length} scenarios inserted`);
  } else {
    // Idempotent upsert: insert rows that don't yet exist, keyed by natural unique constraints.
    // New records added to seed data in future deploys will be inserted; existing rows are skipped.
    const protocolResult = await db
      .insert(cultureProtocolsTable)
      .values(protocols)
      .onConflictDoNothing({ target: [cultureProtocolsTable.region_code, cultureProtocolsTable.pillar, cultureProtocolsTable.rule_type] });
    const protocolsAdded = protocolResult.rowCount ?? 0;
    console.log(`  Culture protocols: ${protocolsAdded} new rows inserted (${protocols.length} total in seed, ${protocols.length - protocolsAdded} already present)`);

    const scenarioResult = await db
      .insert(scenariosTable)
      .values(scenarios)
      .onConflictDoNothing({ target: [scenariosTable.region_code, scenariosTable.pillar, scenariosTable.title] });
    const scenariosAdded = scenarioResult.rowCount ?? 0;
    console.log(`  Scenarios: ${scenariosAdded} new rows inserted (${scenarios.length} total in seed, ${scenarios.length - scenariosAdded} already present)`);
  }

  console.log("Atelier seed complete.");
}

export { seed as runAtelierSeed };

if (process.argv[1] && process.argv[1].includes("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
