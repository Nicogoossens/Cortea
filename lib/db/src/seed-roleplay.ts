import { db } from "./index";
import { roleplayScenarioTable } from "./schema/roleplay_scenarios";

const ROLEPLAY_SCENARIOS = [
  {
    title: "Business Dinner as Host",
    context: "Zakelijk diner als gastheer — Business dining etiquette",
    situation: "You are hosting an important client dinner at a Michelin-starred restaurant in London. Your client has flown in from Tokyo and is unfamiliar with British formal dining customs. The evening is critical to closing a significant partnership agreement.",
    pillar: 2,
    difficulty_level: 2,
    estimated_minutes: 15,
    role_a: {
      name: "The Host",
      description: "You are the senior partner hosting the dinner. Your role is to ensure your guest feels at ease, navigate the formalities gracefully, and steer the conversation toward a successful close without appearing transactional.",
      questions: [
        {
          question: "Your guest arrives slightly early while you are still at the table reviewing notes. What do you do?",
          options: [
            { text: "Rise immediately, greet them warmly, and signal the maitre d' to escort them to the table.", correct: true, explanation: "Rising to greet a guest immediately signals respect and sets a gracious tone for the evening." },
            { text: "Finish your notes first, then look up and wave them over.", correct: false, explanation: "Keeping a guest waiting while you complete personal tasks is a significant breach of hosting etiquette." },
            { text: "Remain seated but gesture warmly to the chair opposite.", correct: false, explanation: "Remaining seated upon a guest's arrival conveys indifference — always rise to greet." },
          ],
        },
        {
          question: "The sommelier approaches to take the wine order. Your guest mentions they rarely drink. What is the correct approach?",
          options: [
            { text: "Order a bottle of the house's finest red and suggest they simply taste a small glass.", correct: false, explanation: "Pressuring a guest who has expressed preference not to drink is disrespectful and creates discomfort." },
            { text: "Ask the sommelier to recommend an exceptional non-alcoholic pairing for your guest while you select wine for yourself.", correct: true, explanation: "Accommodating your guest's preference graciously, while ensuring the sommelier provides an equally considered alternative, shows refined hosting instinct." },
            { text: "Apologise and suggest skipping wine altogether to make your guest comfortable.", correct: false, explanation: "Sacrificing the wine experience for yourself is unnecessary — the correct approach is to honour both preferences simultaneously." },
          ],
        },
        {
          question: "Your guest commits a clear breach of table etiquette — placing their mobile phone on the table. How do you handle this?",
          options: [
            { text: "Discreetly place your own phone face-down on the table to signal the norm, then gently mention that you prefer to keep the evening device-free.", correct: true, explanation: "Leading by example and making a gentle suggestion is far more elegant than a direct correction, which would embarrass the guest." },
            { text: "Point out directly that mobile phones are not appropriate at the dining table.", correct: false, explanation: "A direct correction in this setting embarrasses your guest and undermines the warmth of the evening." },
            { text: "Ignore it entirely — it is not your place to correct a client's behaviour.", correct: false, explanation: "A gracious host creates an environment of refined conduct; ignoring breaches entirely is a missed opportunity for gentle guidance." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Guest",
      description: "You are the visiting executive from Tokyo, unfamiliar with British formal dining conventions. Your role is to observe, adapt, and engage in a way that honours both your host and the occasion — while representing your company with distinction.",
      questions: [
        {
          question: "You arrive to find your host still seated. What do you do?",
          options: [
            { text: "Walk over and take the seat opposite, waiting for your host to acknowledge you.", correct: false, explanation: "Taking your seat before your host has formally greeted and seated you is presumptuous — wait to be invited." },
            { text: "Wait near the entrance, make eye contact with your host, and allow them to come to you.", correct: true, explanation: "Allowing the host to set the pace of arrival and seating demonstrates excellent social restraint and respect for the hosting role." },
            { text: "Ask a member of staff to announce your arrival.", correct: false, explanation: "Announcing yourself through staff in an informal dining context is overly formal and creates awkwardness." },
          ],
        },
        {
          question: "You are uncertain which bread roll is yours — left or right of your place setting. Your host has not yet taken theirs. What do you do?",
          options: [
            { text: "Wait and observe which roll your host takes, then take the opposite side.", correct: true, explanation: "Observing your host and mirroring is the correct approach when uncertain — bread is always to the left, but waiting to confirm is the elegant choice." },
            { text: "Quietly ask the server which is yours.", correct: false, explanation: "Asking staff about basic place setting etiquette may draw attention to your uncertainty — better to observe and follow your host." },
            { text: "Take neither roll and make no mention of it.", correct: false, explanation: "Avoiding the bread entirely and leaving it unacknowledged is unnecessary — once your host takes theirs, the etiquette becomes clear." },
          ],
        },
        {
          question: "Your host offers a toast in your honour. What is the correct response?",
          options: [
            { text: "Raise your glass, make eye contact with your host, and offer a brief, gracious reply acknowledging the occasion.", correct: true, explanation: "Responding to a toast with poise, eye contact, and a brief acknowledgment is the hallmark of refined social conduct." },
            { text: "Simply sip your glass without speaking, to avoid drawing attention to yourself.", correct: false, explanation: "Remaining silent after a toast in your honour is considered dismissive — a brief, warm acknowledgment is expected." },
            { text: "Immediately offer a counter-toast of equal length before sipping.", correct: false, explanation: "A lengthy counter-toast when caught off guard can feel performative — a simple, heartfelt acknowledgment is more appropriate." },
          ],
        },
      ],
    },
  },
  {
    title: "Introduction in Diplomatic Circles",
    context: "Introductie in diplomatieke kring — Diplomatic introduction protocol",
    situation: "A formal reception at the embassy of a G7 nation. Guests include ambassadors, senior ministers, and heads of international organisations. The atmosphere is formal and protocol-conscious. You are attending on behalf of your organisation.",
    pillar: 1,
    difficulty_level: 3,
    estimated_minutes: 20,
    role_a: {
      name: "The Established Guest",
      description: "You are a senior figure who has attended many such events and is well-known in this circle. You are introducing a distinguished newcomer to the room's key figures. Your handling of the introduction shapes the newcomer's standing for the evening.",
      questions: [
        {
          question: "You wish to introduce your guest to the host ambassador. In what order do you make the introduction?",
          options: [
            { text: "Present your guest to the ambassador: 'Ambassador, may I present…' naming your guest and their role.", correct: true, explanation: "In formal protocol, the person of higher rank or host position is named first — you present others to them, not them to others." },
            { text: "Introduce the ambassador to your guest: 'This is His Excellency…' facing your guest.", correct: false, explanation: "In diplomatic and formal settings, you present lower-rank individuals to higher-rank ones — the ambassador receives the introduction, not the guest." },
            { text: "Simply bring the two together and allow them to introduce themselves.", correct: false, explanation: "Leaving two parties to introduce themselves without facilitation is a missed duty of the introducer and can cause awkwardness in formal protocol settings." },
          ],
        },
        {
          question: "Your guest's name or title is complex and you are unsure of the correct pronunciation. How do you handle the introduction?",
          options: [
            { text: "Before the event, confirm the correct pronunciation with your guest privately, then introduce with confidence.", correct: true, explanation: "Preparation is the cornerstone of graceful hosting — verifying pronunciation in advance prevents the embarrassment of a stumbled introduction." },
            { text: "Use only the guest's title without their name to avoid the risk of mispronunciation.", correct: false, explanation: "Omitting someone's name in an introduction reduces their personhood to a title, which can feel dismissive." },
            { text: "Pronounce the name as best you can and apologise in advance for any error.", correct: false, explanation: "Pre-emptive apologies draw attention to the potential error and undermine the confidence of the introduction." },
          ],
        },
        {
          question: "A more junior official interrupts your introduction with an unrelated question. What do you do?",
          options: [
            { text: "Politely acknowledge the official — 'One moment' — complete the introduction, then turn to address them.", correct: true, explanation: "Completing an ongoing introduction before attending to an interruption is correct — the introduction takes precedence, and the handling must be gracious, not dismissive." },
            { text: "Pause the introduction immediately and address the official's question.", correct: false, explanation: "Pausing an introduction mid-flow to attend to a junior official is a breach of the courtesy owed to the person being introduced." },
            { text: "Ignore the official entirely and continue the introduction as though nothing happened.", correct: false, explanation: "Ignoring someone entirely, even a junior official, is unnecessarily cold — a brief acknowledgment followed by continuation is the balanced approach." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Newcomer",
      description: "You are attending a high-level diplomatic reception for the first time. You are well-qualified but unfamiliar with the unwritten codes of this environment. Your composure and attentiveness will define your standing in this room.",
      questions: [
        {
          question: "You are introduced to an ambassador. They extend their hand. What do you do?",
          options: [
            { text: "Receive the handshake with a firm but measured grip, make direct eye contact, and offer your name and a brief acknowledgment of the honour.", correct: true, explanation: "A composed, confident handshake with eye contact and a brief gracious response is the correct protocol when meeting a senior diplomat." },
            { text: "Bow slightly before taking the handshake, as a sign of deep respect.", correct: false, explanation: "Bowing before a handshake is appropriate in specific cultural contexts but not standard in Western diplomatic protocol — it can create confusion." },
            { text: "Wait for the ambassador to speak first before responding in any way.", correct: false, explanation: "Waiting in complete silence for the other party to initiate all speech reads as discomfort rather than composure — a brief, warm acknowledgment is expected." },
          ],
        },
        {
          question: "You are in conversation with a senior official when someone more senior enters the room. Your companion begins to excuse themselves. What do you do?",
          options: [
            { text: "Gracefully acknowledge the shift, offer a composed closing to your exchange, and allow your companion to attend to the new arrival.", correct: true, explanation: "Reading the room and releasing your companion graciously — without awkwardness or clinging — is a mark of social intelligence." },
            { text: "Quickly introduce a new topic to keep your companion engaged.", correct: false, explanation: "Attempting to hold a companion's attention when they are clearly required elsewhere creates tension and signals an inability to read social cues." },
            { text: "Follow your companion as they move toward the more senior guest.", correct: false, explanation: "Following uninvited into someone else's greeting of a senior official is presumptuous and may be perceived as an attempt to gain improper access." },
          ],
        },
        {
          question: "You are offered a business card by a Japanese official. What is the correct protocol?",
          options: [
            { text: "Receive the card with both hands, examine it briefly and attentively, then place it respectfully on the table or in a card holder — never in a pocket immediately.", correct: true, explanation: "In Japanese business culture, the meishi (business card) exchange is a formal ritual. Receiving with both hands and examining it shows respect for the person's identity and role." },
            { text: "Accept with one hand and immediately place it in your jacket pocket to keep it safe.", correct: false, explanation: "Immediately pocketing a business card in Japanese protocol is considered dismissive — it suggests you are not interested in the person." },
            { text: "Accept it and place it face-down on the table to avoid looking at it while in conversation.", correct: false, explanation: "Placing the card face-down is considered disrespectful — the face of the card represents the person." },
          ],
        },
      ],
    },
  },
  {
    title: "The Art of the House Guest",
    context: "Logeren als gast — Country house etiquette",
    situation: "You have been invited for a weekend at a distinguished family's country estate in the Cotswolds. The household runs on tradition and the unspoken codes of English country house life. Your conduct across the two days will be closely — if discreetly — noted.",
    pillar: 1,
    difficulty_level: 2,
    estimated_minutes: 15,
    role_a: {
      name: "The Host",
      description: "You are the host, welcoming a guest whom your spouse has invited from their professional circles. You wish to ensure the weekend runs gracefully while giving your guest the space to feel genuinely at ease — not observed.",
      questions: [
        {
          question: "Your guest arrives and your household staff are busy. What do you do?",
          options: [
            { text: "Greet your guest at the door yourself, show them to their room personally, and point out the essentials — bathroom, breakfast times, the drawing room.", correct: true, explanation: "A gracious host makes the guest's arrival seamless and personal — delegating the welcome entirely to staff on arrival day is cool, not elegant." },
            { text: "Have the housekeeper receive the guest and show them to their room while you finish your current conversation.", correct: false, explanation: "Delegating the entire arrival greeting to staff on a guest's first visit sends a message of indifference — the host's personal presence at arrival is a mark of warmth." },
            { text: "Call your guest's name from inside the house and wait for them to find their way in.", correct: false, explanation: "Calling from inside without greeting at the door is the antithesis of gracious hosting — the threshold is where welcome begins." },
          ],
        },
        {
          question: "Breakfast is served at 8:30. Your guest appears at 9:15. The household is already in motion. What do you do?",
          options: [
            { text: "Greet them warmly and ask the kitchen to prepare a fresh plate — no mention of the time.", correct: true, explanation: "A gracious host ensures a late guest does not feel embarrassed. The comfort of your guest takes precedence over the schedule." },
            { text: "Politely remind them of the breakfast time for tomorrow while handing them whatever remains.", correct: false, explanation: "Reminding a guest of their lateness on their first morning is a social correction that undermines their comfort in your home." },
            { text: "Suggest they find something in the kitchen themselves, as breakfast has concluded.", correct: false, explanation: "Sending a guest to fend for themselves at breakfast is a marked failure of hospitality." },
          ],
        },
        {
          question: "Your guest is leaving. They offer a very generous tip to your household staff directly. What do you do?",
          options: [
            { text: "Graciously allow it — it is a gesture of appreciation from your guest, and your staff receive it with good grace.", correct: true, explanation: "Allowing a guest's generous gesture to stand reflects well on all parties. Intervening would embarrass both your guest and your staff." },
            { text: "Discreetly intervene and explain that tipping the household staff is not customary in your home.", correct: false, explanation: "Correcting a guest's act of generosity — however well-intentioned — is far more awkward than allowing it to stand." },
            { text: "Express mild surprise and suggest the money be donated to the estate's charity instead.", correct: false, explanation: "Redirecting a personal gift to a charity without the giver's consent is presumptuous and awkward." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Guest",
      description: "You are a guest at a distinguished country house for the first time. You are socially confident in professional settings but less experienced with the specific rhythms of English country house life. Your task is to be the ideal guest: present, gracious, and undemanding.",
      questions: [
        {
          question: "You arrive and are shown to your room. What do you do with the tipping?",
          options: [
            { text: "At the end of your stay, leave a modest and appropriate sum in an envelope in your room for the staff member who attended you.", correct: true, explanation: "Tipping at the end of a country house stay by leaving a discreet envelope is the accepted and gracious practice." },
            { text: "Tip generously on arrival to ensure excellent service throughout your stay.", correct: false, explanation: "Tipping on arrival to influence service is transactional rather than gracious — and conspicuous in a household setting." },
            { text: "Do not tip at all — you are a personal guest, not a hotel patron.", correct: false, explanation: "While not obligatory, a discreet tip for household staff is a widely observed courtesy in country house settings and is appreciated." },
          ],
        },
        {
          question: "You find the bedroom somewhat cool in the night. What do you do?",
          options: [
            { text: "Locate the extra blankets in the wardrobe — country houses typically provide them — and manage independently without disturbing anyone.", correct: true, explanation: "A well-judged guest is resourceful and discreet — seeking out provided amenities independently avoids burdening the household at night." },
            { text: "Call out for a member of staff to bring an extra blanket.", correct: false, explanation: "Calling out for staff in the middle of the night for a minor comfort issue is an imposition on the household and signals poor guest instinct." },
            { text: "Mention the temperature to your hosts at breakfast the following morning.", correct: false, explanation: "Drawing attention to a discomfort after the fact — especially one you could have solved independently — implies the household fell short." },
          ],
        },
        {
          question: "Your hosts suggest a walk across the estate at 10am. You are not particularly interested in walking. What do you do?",
          options: [
            { text: "Join the walk with genuine goodwill — participation in the household's planned activities is part of being a gracious guest.", correct: true, explanation: "A well-mannered guest adapts to their host's programme. Opting out of activities without good reason can read as disengaged." },
            { text: "Decline politely and explain you would prefer to remain at the house.", correct: false, explanation: "While a guest's preferences matter, consistently opting out of communal activities marks you as a difficult guest in country house culture." },
            { text: "Join reluctantly but make clear throughout the walk that it is not to your taste.", correct: false, explanation: "Expressing visible reluctance is worse than not joining at all — it dampens the experience for everyone." },
          ],
        },
      ],
    },
  },
  {
    title: "The Black-Tie Gala Arrival",
    context: "Aankomst bij een gala — Formal evening presence",
    situation: "You are attending a black-tie charity gala at a historic London hotel in honour of a cause your family has long supported. The ballroom is filling with peers, philanthropists, and members of the press. Your bearing across the first thirty minutes will set your standing for the evening.",
    pillar: 2,
    difficulty_level: 2,
    estimated_minutes: 15,
    role_a: {
      name: "The Honoured Attendee",
      description: "You are a long-standing patron of the cause and a familiar face at such events. Your role is to model effortless poise — greeting acquaintances, deflecting attention gracefully, and putting newcomers at ease.",
      questions: [
        {
          question: "A photographer from a society publication asks for a portrait as you enter the ballroom. What do you do?",
          options: [
            { text: "Pause briefly, stand in good light, offer a composed half-smile, and thank them by name if known.", correct: true, explanation: "A brief, composed pause acknowledges the photographer's work without seeming self-important — the hallmark of practised poise." },
            { text: "Decline politely and continue into the room without breaking stride.", correct: false, explanation: "Curt refusal of an event photographer reads as ungracious — unless the occasion is private, a brief portrait is part of the protocol." },
            { text: "Stop and offer several poses in different directions to ensure good coverage.", correct: false, explanation: "Lingering and posing extensively is the mark of someone who craves attention — the elegant pose is brief and unhurried." },
          ],
        },
        {
          question: "An acquaintance you barely remember approaches with effusive familiarity. What is the correct response?",
          options: [
            { text: "Greet them warmly by their evident familiarity, listen briefly for a clue to context, and respond as though you placed them immediately.", correct: true, explanation: "A gracious recovery — warm reception and attentive listening — preserves dignity for both parties without requiring you to admit memory failure." },
            { text: "Confess that you cannot quite place them and ask where you met.", correct: false, explanation: "Pressing someone to remind you of their identity in a public setting can embarrass them and signals poor social memory." },
            { text: "Respond with cool politeness to discourage the encounter.", correct: false, explanation: "Coolness in response to warmth is unkind and reads as snobbery — even uncertain encounters deserve generous reception." },
          ],
        },
        {
          question: "You notice a guest standing alone, visibly unsure of where to position themselves. What do you do?",
          options: [
            { text: "Approach naturally, introduce yourself, and draw them into a small group you are part of.", correct: true, explanation: "Rescuing a stranded guest is one of the highest expressions of social grace — it costs little and reflects extraordinarily well on you." },
            { text: "Smile from a distance to acknowledge them without intruding.", correct: false, explanation: "A distant smile may comfort momentarily but leaves the guest stranded — true poise extends a hand." },
            { text: "Alert a member of the host committee so that they may attend to the guest.", correct: false, explanation: "Delegating the rescue is correct only when you cannot do it yourself — when you can, it is your honour to act directly." },
          ],
        },
      ],
    },
    role_b: {
      name: "The First-Time Guest",
      description: "You have been invited to your first black-tie event of this calibre. Your evening dress is correct and your invitation is in order. What remains is to carry yourself with quiet confidence and give nothing away of your inexperience.",
      questions: [
        {
          question: "You arrive and discover the cloakroom queue is long. The reception is starting. What do you do?",
          options: [
            { text: "Wait patiently in the queue — entering the reception still in outer dress is a clear breach.", correct: true, explanation: "Entering the formal reception still wearing a coat or scarf marks you as inexperienced. The queue is unavoidable." },
            { text: "Carry your coat folded over your arm into the reception and find a chair to drape it on.", correct: false, explanation: "Carrying outerwear into a formal reception is undignified and visually disruptive — the cloakroom is not optional." },
            { text: "Ask a member of staff to take your coat directly so you can bypass the queue.", correct: false, explanation: "Requesting bespoke service to skip a queue is presumptuous and likely to be politely refused." },
          ],
        },
        {
          question: "You accept a drink from a passing tray. The waiter moves on before you can thank them. What do you do?",
          options: [
            { text: "Catch their eye on their next pass and offer a brief nod of thanks.", correct: true, explanation: "Acknowledging staff with a quiet nod when the moment returns shows that you treat all attendees with civility — observed and appreciated by those who notice." },
            { text: "Call after them so they may receive your thanks immediately.", correct: false, explanation: "Calling out to staff in a formal reception draws attention to yourself and to them in an awkward way." },
            { text: "Make no further acknowledgment — service is the staff's role, not yours to praise.", correct: false, explanation: "Treating service staff as invisible is widely noted as a sign of poor breeding, regardless of the formality of the event." },
          ],
        },
        {
          question: "A senior figure introduces you to their spouse. You have heard the spouse holds controversial views you strongly disagree with. What do you do?",
          options: [
            { text: "Greet the spouse with warmth and neutral courtesy — the gala is neither the time nor the place for political encounter.", correct: true, explanation: "Reading the social register correctly — and reserving disagreement for private settings — is the foundation of public composure." },
            { text: "Greet politely but briefly, then excuse yourself before conversation can begin.", correct: false, explanation: "An abrupt departure after a formal introduction is conspicuous and reads as judgement, which embarrasses your introducer." },
            { text: "Use the introduction as an opportunity to gently raise your concerns.", correct: false, explanation: "Raising contested views moments after introduction is a serious breach — it places your host in an impossible position." },
          ],
        },
      ],
    },
  },
  {
    title: "The Letter of Condolence",
    context: "Condoléancebrief — Written sympathy in correspondence",
    situation: "A respected senior colleague has lost their spouse. The news has reached you through a mutual acquaintance. You have worked closely with this person for many years but have never met their family. You wish to write a letter of condolence that is sincere, appropriate to the relationship, and free from the missteps that frequently mar such correspondence.",
    pillar: 3,
    difficulty_level: 3,
    estimated_minutes: 15,
    role_a: {
      name: "The Writer",
      description: "You are the colleague composing the letter. Your task is to honour the moment with restraint, warmth, and the unmistakable mark of genuine attention — a letter that gives comfort without performance.",
      questions: [
        {
          question: "On what medium do you write your letter?",
          options: [
            { text: "Plain or lightly bordered cream stationery, hand-written in ink, in your own hand.", correct: true, explanation: "Hand-written condolence on quality stationery is the universally observed standard — typed or printed letters are inadequate to the occasion." },
            { text: "A carefully composed email sent the same day, ensuring the message reaches them swiftly.", correct: false, explanation: "Email, however well composed, falls short of the gravity of bereavement — only a hand-written letter conveys due respect." },
            { text: "A printed letter on company letterhead, signed in ink, sent by post.", correct: false, explanation: "Company letterhead transforms a personal letter into a corporate gesture — a private letter on personal paper is required." },
          ],
        },
        {
          question: "How do you open the letter?",
          options: [
            { text: "Address them by their accustomed name and begin simply: 'I was deeply saddened to hear of [spouse's name]'s death.'", correct: true, explanation: "Direct, simple, and naming the deceased honours both the loss and the person. Euphemism distances; clarity comforts." },
            { text: "Address them formally and write: 'I was so sorry to hear of your recent loss, and wished to extend my deepest sympathies at this difficult time.'", correct: false, explanation: "Stock phrases such as 'difficult time' and 'extend sympathies' read as formula — sincere condolence avoids cliché." },
            { text: "Open with a reflection on the fragility of life before naming the bereavement.", correct: false, explanation: "Philosophical openings risk centering your own reflection rather than the bereaved person — keep yourself out of the opening." },
          ],
        },
        {
          question: "You did not know the deceased personally. How do you handle this in the letter?",
          options: [
            { text: "Acknowledge it honestly and refer instead to what you know of them through your colleague — a remembered remark, a clear devotion.", correct: true, explanation: "A specific, honest reference — even at one remove — is far warmer than fabricated familiarity." },
            { text: "Write as though you knew them, expressing how much they meant to you personally.", correct: false, explanation: "False familiarity is one of the most painful missteps in condolence — the bereaved knows immediately and the letter is ruined." },
            { text: "Avoid mentioning the deceased entirely and focus only on offering practical support.", correct: false, explanation: "Failing to name or mention the deceased can read as evasion — the deceased should be honoured, not avoided." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Recipient",
      description: "You are the bereaved colleague, receiving many letters in the weeks following your loss. You note — without commenting publicly — which letters comfort and which do not. Your responses, in time, will reflect the care with which each letter was composed.",
      questions: [
        {
          question: "A colleague writes a long letter offering you specific practical help: meals, transport, errands. How do you respond?",
          options: [
            { text: "Reply, in time, with thanks — accepting one specific offer if useful, or declining warmly and naming what their letter meant to you.", correct: true, explanation: "Specific responses to specific offers — accepting or declining with grace — honour the writer's care and your own dignity." },
            { text: "Send a generic acknowledgment to all letters at once via printed card.", correct: false, explanation: "Mass acknowledgment of intimate condolence reduces personal letters to administrative matters — when strength returns, individual replies are correct." },
            { text: "Reply immediately accepting all offers to demonstrate gratitude.", correct: false, explanation: "Hasty over-acceptance creates obligations you cannot meet and reads as need rather than grace." },
          ],
        },
        {
          question: "A letter arrives from a senior figure containing several factual errors about your spouse. What do you do?",
          options: [
            { text: "Reply graciously thanking them, without correcting the errors — the sentiment was genuine, and the corrections serve no purpose.", correct: true, explanation: "Receiving condolence with grace, errors and all, is the higher path — correction would embarrass and serves only your own irritation." },
            { text: "Reply with thanks and a gentle, kindly correction so they will know.", correct: false, explanation: "However gently framed, correcting a condolence letter creates discomfort for the writer and adds nothing to your healing." },
            { text: "Do not reply, as the letter felt insufficiently considered.", correct: false, explanation: "Withholding reply for perceived inadequacy is ungracious — every act of attempted comfort merits some acknowledgment." },
          ],
        },
        {
          question: "Months later, you encounter a colleague at a function who never wrote. How do you behave?",
          options: [
            { text: "Greet them with the same warmth as anyone else — no reference, no coolness, no test.", correct: true, explanation: "Carrying no record of others' shortcomings into your bearing is the deepest mark of dignity — the absent letter is forgotten." },
            { text: "Greet them politely but with measurable reserve so the absence is felt.", correct: false, explanation: "Punishing through coolness is the antithesis of grace — your bearing should never be a vehicle for grievance." },
            { text: "Mention lightly that you noticed they did not write, to offer them a chance to address it.", correct: false, explanation: "Naming the absence places them in an impossible position publicly — and reduces you to record-keeper." },
          ],
        },
      ],
    },
  },
  {
    title: "The Difficult Email",
    context: "Een lastige e-mail — Modern correspondence under pressure",
    situation: "You must write to a senior client whose project is significantly behind schedule due to repeated indecision on their side. Your firm's exposure is growing. The email must convey the gravity of the position without apportioning blame, while preserving the relationship and prompting prompt action.",
    pillar: 3,
    difficulty_level: 3,
    estimated_minutes: 15,
    role_a: {
      name: "The Sender",
      description: "You are the senior account lead. You must compose an email that is firm, courteous, factually unimpeachable, and impossible to misread — without becoming an instrument the client could later use against you.",
      questions: [
        {
          question: "What is the correct subject line?",
          options: [
            { text: "Project [Name]: Updated Timeline & Decisions Required by [Date]", correct: true, explanation: "Specific, factual, action-oriented subject lines are read first and frame the message correctly. Avoid both alarming and vague phrasings." },
            { text: "URGENT: Project Status Concerns", correct: false, explanation: "'URGENT' in subject lines is the mark of inexperience — it inflates tone before the body is read and discounts you in future." },
            { text: "Quick check-in", correct: false, explanation: "Soft, vague subject lines on a serious matter are read as evasive and fail to convey the gravity required." },
          ],
        },
        {
          question: "How do you reference the client's role in the delay?",
          options: [
            { text: "List the outstanding decisions awaiting their input by date, without commentary on cause — the dates speak for themselves.", correct: true, explanation: "Letting documented facts establish the position avoids accusation while making the situation undeniable. This is the mark of senior correspondence." },
            { text: "State plainly that the delay is due to their team's slow decision-making.", correct: false, explanation: "Direct attribution of blame in writing creates an adversarial record that closes off resolution and damages relationships." },
            { text: "Avoid any reference to the cause and present the timeline as a neutral situation.", correct: false, explanation: "Omitting the documented record of pending decisions leaves you exposed and signals to the client there is no pressure to act." },
          ],
        },
        {
          question: "How do you close the email?",
          options: [
            { text: "Propose a specific call within the next 48 hours and offer two concrete time options.", correct: true, explanation: "A specific, actionable close with concrete options moves the matter forward and demonstrates respect for their time." },
            { text: "Close with 'Please let me know your thoughts at your earliest convenience.'", correct: false, explanation: "Vague closing phrases on time-critical matters invite further delay — the very thing you are trying to break." },
            { text: "Close with 'I trust this matter has your immediate attention.'", correct: false, explanation: "This phrasing reads as imperious and is widely considered a sign of poor correspondence judgement in senior contexts." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Recipient",
      description: "You are the senior client receiving the email. You sense the seriousness behind the courteous tone. Your reply will determine whether the relationship deepens through this challenge or fractures.",
      questions: [
        {
          question: "How quickly do you reply?",
          options: [
            { text: "Within the working day — a brief acknowledgment confirming receipt and proposing one of the offered call times.", correct: true, explanation: "Same-day acknowledgment of a serious correspondence is correct, even when the substantive reply must follow. It signals that you have heard." },
            { text: "Within 48 hours, with a complete substantive reply addressing every point.", correct: false, explanation: "Delaying acknowledgment to compose a complete reply leaves the sender uncertain whether they have been heard — acknowledge first, substantiate later." },
            { text: "Within a week, after consulting all relevant parties internally.", correct: false, explanation: "A week's silence on a time-critical email is, in itself, a reply — and not a flattering one." },
          ],
        },
        {
          question: "Your initial reaction is defensive — you feel the email exaggerates. What do you do?",
          options: [
            { text: "Set the email aside for two hours, then re-read with fresh attention before replying.", correct: true, explanation: "Allowing time between strong reaction and reply is the cornerstone of mature correspondence — never reply in heat." },
            { text: "Reply immediately with your concerns about the framing.", correct: false, explanation: "Replying defensively in the moment fixes a position you may regret and worsens the underlying problem." },
            { text: "Forward the email to your team with annotations expressing your displeasure.", correct: false, explanation: "Annotated forwards have a habit of resurfacing and of being read by those for whom they were not intended." },
          ],
        },
        {
          question: "You realise on reflection that your team is indeed largely responsible for the delay. What do you do?",
          options: [
            { text: "Acknowledge it briefly and graciously in your reply, and propose how you will accelerate decisions going forward.", correct: true, explanation: "Owning a delay with brevity and forward focus repairs the relationship and earns lasting respect. Equivocation does the opposite." },
            { text: "Defend your team's pace by explaining the complexity of the decisions involved.", correct: false, explanation: "Justification of inaction in writing is rarely persuasive and tends to entrench the situation." },
            { text: "Reply addressing only the proposed call, without referencing the substance.", correct: false, explanation: "Dodging the substance signals you have not engaged seriously and erodes the sender's confidence further." },
          ],
        },
      ],
    },
  },
  {
    title: "The Handwritten Note of Thanks",
    context: "Bedankbrief in eigen hand — The art of the thank-you note",
    situation: "You have just returned home from a weekend at a friend's family home, where you were treated with extraordinary care across three days. Custom — and your own sense of gratitude — calls for a hand-written note. The note must arrive promptly, strike the right register, and convey true warmth without falling into formula.",
    pillar: 3,
    difficulty_level: 1,
    estimated_minutes: 10,
    role_a: {
      name: "The Writer",
      description: "You are composing the thank-you note. Your task is to capture the singular character of the visit in a few short paragraphs of considered prose.",
      questions: [
        {
          question: "When do you send the note?",
          options: [
            { text: "Within 48 hours of returning home — the sooner, the warmer.", correct: true, explanation: "A thank-you note's value diminishes with each passing day. Within 48 hours signals true gratitude rather than residual obligation." },
            { text: "Within two weeks, allowing time for considered composition.", correct: false, explanation: "Two weeks is too long — by then the note feels dutiful rather than spontaneous." },
            { text: "Whenever you next see them in person, omitting the note as a redundancy.", correct: false, explanation: "A spoken thanks at next meeting cannot replace a written note for hosting of substance — they serve different purposes." },
          ],
        },
        {
          question: "What specific element do you reference in the note?",
          options: [
            { text: "A particular moment from the visit — a conversation, a meal, a view — that genuinely moved you.", correct: true, explanation: "Specific reference proves attention. A note that could have been written without the visit is no note at all." },
            { text: "A general expression of appreciation for the lovely weekend.", correct: false, explanation: "General notes read as form correspondence and convey little of the personal regard they should." },
            { text: "A list of all the things you enjoyed, to demonstrate that nothing went unappreciated.", correct: false, explanation: "Exhaustive listing reads as bookkeeping rather than feeling — one or two specifics, well chosen, do far more." },
          ],
        },
        {
          question: "How do you sign the note?",
          options: [
            { text: "Warmly and personally — 'With love' or 'With deep affection' as appropriate to the relationship — and your first name only.", correct: true, explanation: "Sign-offs should match the warmth of the relationship. To intimates, only the first name; to closer friends, an affectionate close." },
            { text: "Formally — 'Yours sincerely' followed by your full name.", correct: false, explanation: "A formal sign-off to close hosts feels strangely distant — the warmth of the visit should carry into the close." },
            { text: "With 'Many thanks again' followed by your initials.", correct: false, explanation: "Initials are too informal for a considered thank-you note; they suggest haste rather than care." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Hostess",
      description: "You are the hostess receiving notes from your weekend's guests. The notes — and their absence — register clearly with you, though you would never speak of it.",
      questions: [
        {
          question: "A note arrives that is brief but warm and specific. How do you receive it?",
          options: [
            { text: "Read it with pleasure, place it on your writing desk for the week, and remember the guest with affection.", correct: true, explanation: "A short, well-judged note is often the most pleasing — length is no measure of warmth." },
            { text: "Note its brevity and conclude that the guest's gratitude was modest.", correct: false, explanation: "Equating length with feeling is a misreading of the form — the most accomplished correspondents are often the briefest." },
            { text: "Reply with a long letter to model the standard you would prefer.", correct: false, explanation: "Replying to a thank-you note with corrective length is a peculiar gesture and likely to bewilder the recipient." },
          ],
        },
        {
          question: "Two weeks pass and one guest has not written. What do you do?",
          options: [
            { text: "Carry no record of it in your bearing, and welcome them as warmly as ever should the occasion arise.", correct: true, explanation: "Hosts who keep silent ledgers of correspondence undermine their own grace — the welcome must be unconditional." },
            { text: "Mention it discreetly to a mutual friend so word may reach them.", correct: false, explanation: "Routing displeasure through third parties is among the least gracious uses of correspondence and the least trustworthy of mutual friends." },
            { text: "Decline to invite them again as a quiet correction.", correct: false, explanation: "Adjusting future invitations as silent reproach is ungenerous — better to host fewer people whom you wish to see than to keep accounts." },
          ],
        },
        {
          question: "You receive a printed thank-you card with only a signature. How do you regard it?",
          options: [
            { text: "Receive it with mild thanks, recognising the gesture is well-intended even if it falls short of the form.", correct: true, explanation: "A pre-printed card with only a signature is inadequate to substantial hosting, but the kind reading is to receive the intent without comment." },
            { text: "Disregard it entirely, as it does not constitute a true note.", correct: false, explanation: "Disregarding any gesture of thanks, however imperfect, is ungenerous — the standard you hold yourself to need not be the standard you impose on others." },
            { text: "Mention to the guest at next meeting that hand-written notes are the preferred form.", correct: false, explanation: "Instructing others on correspondence form is rarely well received and damages the relationship more than the original lapse did." },
          ],
        },
      ],
    },
  },
  {
    title: "The Japanese Kaiseki Dinner",
    context: "Kaiseki diner in Kyoto — Japanese formal dining",
    situation: "You are hosting a long-standing French business partner at a celebrated kaiseki restaurant in Kyoto. The meal will unfold across many courses, each composed with seasonal precision. The setting is traditional: tatami mats, low table, sliding shoji screens. Your conduct will be observed by the chef, the okami (proprietress), and your guest in roughly equal measure.",
    pillar: 4,
    difficulty_level: 3,
    estimated_minutes: 20,
    role_a: {
      name: "The Host",
      description: "You are familiar with kaiseki and have arranged the evening. Your role is to honour the traditions of the house, guide your guest unobtrusively, and ensure that both the chef's artistry and your guest's experience are equally respected.",
      questions: [
        {
          question: "Upon entering the private tatami room, what do you do first?",
          options: [
            { text: "Remove your shoes at the genkan, step up onto the tatami in stockinged feet, and indicate the seat of honour to your guest.", correct: true, explanation: "Removing shoes precisely at the threshold and offering the seat of honour to the guest are foundational kaiseki courtesies." },
            { text: "Step into the tatami room first to assess the seating before inviting your guest in.", correct: false, explanation: "Entering before your guest in their honour reverses the courtesy — the guest enters first, into the seat you indicate." },
            { text: "Wait at the genkan for the okami to seat both of you.", correct: false, explanation: "Standing motionless at the threshold passes hosting responsibility to the staff and is a failure of the host's role." },
          ],
        },
        {
          question: "The first course arrives with a bowl whose lid is sealed by steam. Your guest struggles to open theirs. What do you do?",
          options: [
            { text: "Demonstrate quietly with your own bowl — squeeze the sides gently to release the seal — without commenting on their difficulty.", correct: true, explanation: "Wordless demonstration preserves your guest's dignity while solving the problem. Direct instruction would embarrass." },
            { text: "Reach across and open your guest's bowl for them.", correct: false, explanation: "Reaching across the table to handle another's place setting breaches Japanese dining decorum and infantilises the guest." },
            { text: "Call the staff over to assist your guest with the lid.", correct: false, explanation: "Drawing staff attention to a guest's struggle magnifies the embarrassment rather than resolving it discreetly." },
          ],
        },
        {
          question: "The chef appears between courses to greet you personally. How do you receive him?",
          options: [
            { text: "Place your chopsticks down, sit upright, bow your head briefly, and offer thanks for the meal so far — naming a specific dish if you can.", correct: true, explanation: "Setting down implements, sitting upright, bowing, and naming a specific dish honours the chef's craft in the manner he most values." },
            { text: "Continue eating but smile and nod as he speaks.", correct: false, explanation: "Continuing to eat while the chef addresses you fails to give the moment the attention it requires in Japanese dining culture." },
            { text: "Stand and shake his hand to express your appreciation.", correct: false, explanation: "Standing and offering a handshake disrupts the room's register and imposes a Western form on a Japanese moment." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Guest",
      description: "You are the visiting French executive, encountering kaiseki for the first time. Your task is to receive each course with attention, follow your host's lead with precision, and avoid the small but visible errors that mark the inexperienced foreigner.",
      questions: [
        {
          question: "You are unsure whether to lift your bowl to your mouth or leave it on the table while eating. What do you do?",
          options: [
            { text: "Lift small rice and miso bowls to chest height while eating — leaving them on the table is incorrect for these.", correct: true, explanation: "Lifting smaller bowls to eat is correct Japanese practice; leaving them on the table and bending toward them looks unrefined." },
            { text: "Leave all bowls on the table to avoid the risk of spilling.", correct: false, explanation: "Leaving rice and soup bowls on the table is considered uncouth — the bowls are designed to be lifted." },
            { text: "Lift every bowl regardless of size, to demonstrate familiarity with the form.", correct: false, explanation: "Lifting larger plates and serving dishes is incorrect — only the smaller individual bowls are lifted." },
          ],
        },
        {
          question: "You wish to take a piece of food from a shared dish. What do you do?",
          options: [
            { text: "Reverse your chopsticks and use the clean ends to transfer the food, or use the serving chopsticks if provided.", correct: true, explanation: "Using clean ends or designated serving chopsticks is the correct method; touching shared food with the eating end is a clear breach." },
            { text: "Pass the food directly from your chopsticks to a serving plate.", correct: false, explanation: "Passing food chopstick-to-chopstick has profound funerary associations in Japan and is a serious taboo at the table." },
            { text: "Use your chopsticks normally to take from the shared dish.", correct: false, explanation: "Touching shared food with the end you have eaten from is unhygienic and considered disrespectful to fellow diners." },
          ],
        },
        {
          question: "Your host raises a sake cup in your direction. What do you do?",
          options: [
            { text: "Lift your cup with both hands, lower its rim slightly below your host's in deference, accept his pour, then offer to pour for him.", correct: true, explanation: "The reciprocal sake pour, with both hands and the deferential lower rim, is one of the most observed of Japanese dining courtesies." },
            { text: "Raise your cup with one hand and meet your host's cup at equal height.", correct: false, explanation: "Equal-height meeting and one-handed reception both reduce the courtesy — both hands and a humble lower rim are correct." },
            { text: "Pour your own sake first to spare your host the trouble.", correct: false, explanation: "Pouring one's own sake is widely considered impolite in formal Japanese settings — the pour is reciprocal and given." },
          ],
        },
      ],
    },
  },
  {
    title: "The French Wine Dinner",
    context: "Diner in Bourgondië — French wine country dining",
    situation: "You have been invited to a multi-generational family lunch at a vigneron's home in Burgundy. Wines from the family's own cellar — some quite old — will accompany the meal. The luncheon will run for several hours. Your knowledge of French wine is reasonable but not expert.",
    pillar: 4,
    difficulty_level: 2,
    estimated_minutes: 15,
    role_a: {
      name: "The Vigneron",
      description: "You are the host, the vigneron whose family has worked these vines for four generations. The wines you serve carry stories. Your role is to share them generously without lecturing, and to read your guests for genuine engagement.",
      questions: [
        {
          question: "You are about to pour a 1985 Grand Cru you have been saving. How do you introduce it?",
          options: [
            { text: "Mention briefly the year, the parcel, and one personal detail — perhaps who made it or what the harvest was like — then pour.", correct: true, explanation: "Brief context honours the wine and your guests' attention without becoming a lecture. Less is more around the table." },
            { text: "Recite the wine's full history, the producer's biography, and the regional context before pouring.", correct: false, explanation: "Lengthy preambles before pouring exhaust the table — share the rich history if asked, not by default." },
            { text: "Pour without comment and allow the wine to speak for itself.", correct: false, explanation: "Pouring an exceptional bottle without acknowledgment passes over the moment your guests would have most enjoyed sharing in." },
          ],
        },
        {
          question: "A guest, after one sip, declares they prefer red wines and pushes the white aside. What do you do?",
          options: [
            { text: "Smile, ask whether they would prefer the red poured early, and pour it without further comment.", correct: true, explanation: "Accommodating preferences without remark protects both the guest's dignity and the table's atmosphere — the wine is for them, not from them." },
            { text: "Encourage them to give the white another taste with the next course.", correct: false, explanation: "Pressing a guest to reconsider a stated preference, even gently, is the antithesis of hosting — they spoke clearly." },
            { text: "Quietly remove the white and offer no replacement until the next course arrives.", correct: false, explanation: "Withholding any wine while others continue to be served leaves the guest stranded and visibly singled out." },
          ],
        },
        {
          question: "Your young son spills his glass of red across the linen cloth. The dining room falls quiet. What do you do?",
          options: [
            { text: "Laugh briefly, blot what you can with the cloth, sprinkle a little salt on the stain, and continue the conversation as though nothing of consequence had happened.", correct: true, explanation: "A practised host's response — light, swift, unfussy — restores the room and protects the child from undue attention." },
            { text: "Reprimand your son so that the table understands such accidents are not acceptable.", correct: false, explanation: "Reprimanding a child publicly during a luncheon makes everyone uncomfortable and prolongs the disturbance." },
            { text: "Stop the meal to change the cloth completely before continuing.", correct: false, explanation: "Halting the meal for a complete cloth change magnifies the incident — the meal must flow on." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Guest",
      description: "You are the foreign guest at the table. Your French is good and your wine knowledge respectable but not expert. Your task is to show genuine interest, follow the rhythm of the table, and avoid the missteps that mark the foreigner abroad.",
      questions: [
        {
          question: "You are uncertain how much to pour your neighbour from a shared bottle. What do you do?",
          options: [
            { text: "Pour roughly one-third of the glass — never more — and pour without lifting the bottle's neck above the rim.", correct: true, explanation: "Approximately one-third is the standard French pour, allowing aroma to develop. Over-pouring marks the inexperienced." },
            { text: "Fill the glass two-thirds full as a gesture of generosity.", correct: false, explanation: "A two-thirds-full wine glass is unsophisticated — it deprives the wine of the air it requires and reads as inelegant abundance." },
            { text: "Pour only a small amount in case they prefer the next wine instead.", correct: false, explanation: "Half-pours during a sustained luncheon read as ungenerous and require constant re-pouring, disrupting the flow of the meal." },
          ],
        },
        {
          question: "You truly enjoy a particular wine and wish to express this to the host. What do you say?",
          options: [
            { text: "Catch the host's eye and offer a brief, specific remark — perhaps on the wine's length, its character with the dish, or its evolution in the glass.", correct: true, explanation: "Specific, restrained appreciation is far more flattering to a vigneron than effusive general praise." },
            { text: "Declare loudly to the table that this is the finest wine you have ever tasted.", correct: false, explanation: "Effusive declarations across the table read as performative and embarrass a host who values restraint." },
            { text: "Ask for the bottle to be passed so you can read the label and remember it.", correct: false, explanation: "Reading labels at the table is the mark of the wine collector rather than the gracious diner — ask the host quietly later." },
          ],
        },
        {
          question: "The host opens a wine you find frankly past its prime. How do you handle this?",
          options: [
            { text: "Drink it appreciatively without comment — the wine was offered as a gift of memory, and that is what you receive.", correct: true, explanation: "An aged bottle from a personal cellar is a gesture of trust — its condition is irrelevant beside the gesture itself." },
            { text: "Diplomatically mention that the wine appears to have aged beyond its peak.", correct: false, explanation: "Telling a host their wine is past its prime — however gently — wounds them in a way they will long remember." },
            { text: "Take a small sip and leave the rest, hoping the omission is unnoticed.", correct: false, explanation: "Conspicuous abstention from a wine the host has chosen to honour you is a clearer rebuke than any words." },
          ],
        },
      ],
    },
  },
  {
    title: "The Family Table in Italy",
    context: "Familiediner in Toscane — The long Italian Sunday lunch",
    situation: "You have been invited to a Sunday family lunch at the home of an Italian friend in Tuscany. Three generations are present. The table is set in the garden under a pergola. Lunch will last four hours. The atmosphere is warm but the codes are precise — and not always written.",
    pillar: 4,
    difficulty_level: 1,
    estimated_minutes: 15,
    role_a: {
      name: "The Matriarch (la nonna)",
      description: "You are the family matriarch. You have prepared much of the food yourself across three days. You watch carefully — though you would never say so — to see how each guest receives what is offered.",
      questions: [
        {
          question: "A foreign guest takes a single small portion of your hand-rolled pasta. What do you do?",
          options: [
            { text: "Smile, place a generous additional portion on their plate without asking, and say firmly: 'Mangia, mangia.'", correct: true, explanation: "Refusing a polite first portion in matters of grandmother-cooked pasta is part of the ritual — generous insistence is the proper response." },
            { text: "Accept their preference and move on to the next person.", correct: false, explanation: "Permitting a small first portion of nonna's pasta to stand is unthinkable in the cultural register — refusal of the increase is the guest's only choice." },
            { text: "Inquire whether the pasta is to their liking.", correct: false, explanation: "Asking whether the food pleases puts the guest in the difficult position of either lying or wounding — never inquire." },
          ],
        },
        {
          question: "A guest asks for parmesan to grate over a seafood pasta. What do you do?",
          options: [
            { text: "Smile politely and say, gently, that this particular dish is traditionally served without cheese.", correct: true, explanation: "Cheese with seafood pasta is a known cultural breach — a kind correction protects both the dish and the guest from a worse error." },
            { text: "Bring the parmesan immediately to honour the guest's request.", correct: false, explanation: "Yielding entirely to a request that violates the dish would shock other guests at the table and reduces your role as cook." },
            { text: "Pretend you have run out of parmesan to avoid the issue.", correct: false, explanation: "Polite evasions are seen through immediately and communicate disapproval without giving the guest a chance to learn." },
          ],
        },
        {
          question: "Lunch has been underway for three hours. A guest excuses themselves citing other plans. What do you do?",
          options: [
            { text: "Express warm regret, insist they return soon, and walk them to the gate yourself with a small gift if one is to hand.", correct: true, explanation: "Walking a departing guest to the gate, with regret and an open invitation, is the closing courtesy of an Italian family meal." },
            { text: "Allow them to leave from the table to spare the disruption to the meal.", correct: false, explanation: "Permitting a guest to depart unaccompanied from a family meal is cool by Italian standards — they must be walked out." },
            { text: "Express disappointment that they are leaving while there is still so much food.", correct: false, explanation: "Expressed disappointment puts the guest in an awkward position and diminishes the warmth of the close." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Foreign Guest",
      description: "You are the visiting friend, joining this family lunch for the first time. Your task is to receive the immense generosity of the table without overwhelm, follow the family's rhythms, and depart having strengthened the connection.",
      questions: [
        {
          question: "By the third course you are genuinely full. The fourth course is being brought out. What do you do?",
          options: [
            { text: "Accept a small portion graciously, eat slowly, and acknowledge the dish with sincere praise — finishing it is not the test.", correct: true, explanation: "Receiving each course with attention, even partially, honours the cook. It is praising — not finishing — that matters most." },
            { text: "Decline firmly, explaining that you cannot manage another course.", correct: false, explanation: "Firm refusal of a course in this setting reads as dismissive of the matriarch's efforts and breaks the rhythm of the meal." },
            { text: "Eat the full portion to honour the cook regardless of comfort.", correct: false, explanation: "Forcing oneself to finish in visible discomfort distresses the host and is unnecessary — a graceful partial portion suffices." },
          ],
        },
        {
          question: "A heated political debate breaks out across the table. You hold strong views. What do you do?",
          options: [
            { text: "Listen attentively, offer mild observations only if directly asked, and never take a side.", correct: true, explanation: "As a foreign guest in a family setting, taking sides in domestic political debate is to overstep — observation is your role." },
            { text: "Engage your views fully — Italians appreciate spirited debate and would expect you to participate.", correct: false, explanation: "Foreign guests holding forth on Italian domestic politics, however welcome the spirited debate, is a clear overstep of position." },
            { text: "Stand and excuse yourself from the discussion to demonstrate disapproval of the topic.", correct: false, explanation: "Theatrical withdrawal from family discussion at the table is rude and signals judgement of those continuing the conversation." },
          ],
        },
        {
          question: "Lunch is winding down and you wish to leave. How do you do so?",
          options: [
            { text: "Wait for a natural pause, address the matriarch directly with your thanks, and accept the inevitable warm protests with grace before departing.", correct: true, explanation: "Direct, warm thanks to the matriarch — and the protected acceptance of farewell protests — close the meal correctly." },
            { text: "Slip away quietly so as not to disturb the family in conversation.", correct: false, explanation: "Departing without a formal goodbye is the gravest breach — the close of the meal is as important as the welcome." },
            { text: "Announce to the entire table at once that you must take your leave.", correct: false, explanation: "A blanket announcement reduces the personal warmth of the close — direct address to the matriarch is essential." },
          ],
        },
      ],
    },
  },
  {
    title: "The Japanese Tea Ceremony",
    context: "Chanoyu — Cha-no-yu, the way of tea",
    situation: "You have been invited as a guest to a chanoyu tea ceremony in Kyoto, hosted by a respected tea master in a traditional chashitsu (tea room). You will be one of three guests; the most senior is the shōkyaku (principal guest). The ceremony will last over an hour and unfolds with deliberate, choreographed precision. Every gesture matters.",
    pillar: 5,
    difficulty_level: 3,
    estimated_minutes: 20,
    role_a: {
      name: "The Shōkyaku (Principal Guest)",
      description: "You are the principal guest, seated closest to the host. The other guests will follow your lead. You bear the responsibility of speaking on behalf of the guests when convention requires, and of setting the register of attention for the room.",
      questions: [
        {
          question: "You enter the tea room through the nijiriguchi (low entrance). Once inside, what do you do first?",
          options: [
            { text: "Move to the tokonoma alcove and admire — in respectful silence — the hanging scroll and seasonal flower before taking your seat.", correct: true, explanation: "Acknowledging the tokonoma's display before seating is the principal guest's first responsibility — these objects were chosen for this guest, this day." },
            { text: "Take your seat immediately in the position closest to the host.", correct: false, explanation: "Sitting before acknowledging the tokonoma is a clear breach — the alcove must be received before the body settles." },
            { text: "Greet the host first and ask which seat is yours.", correct: false, explanation: "The host's silence at this stage is intentional — verbal greeting in the chashitsu before the ceremony begins is incorrect." },
          ],
        },
        {
          question: "The host presents the chawan (tea bowl) to you. How do you receive it?",
          options: [
            { text: "Take it with the right hand, place it in the palm of the left, rotate it twice clockwise so the front faces away from you, then drink in three sips.", correct: true, explanation: "Rotating the bowl so its decorated front faces away from you honours the host's craftsmanship and is the prescribed form." },
            { text: "Receive it with both hands and drink directly from the front of the bowl.", correct: false, explanation: "Drinking from the front of the chawan is a serious breach — the front is the most beautiful face and must not touch the lips." },
            { text: "Examine the bowl's design at length before drinking, to honour its beauty.", correct: false, explanation: "Examination of the bowl belongs after drinking, not before — the prescribed sequence is precise." },
          ],
        },
        {
          question: "After drinking, the host invites you to inspect the chawan more closely. What do you do?",
          options: [
            { text: "Lower the bowl close to the tatami before lifting it, examine it slowly with both hands, and offer a brief sincere comment to the host about its character.", correct: true, explanation: "Lowering the bowl close to the mat protects against accidental drop and honours the object's value. A short, specific comment is the correct close." },
            { text: "Lift the bowl high to study it in good light and turn it over to see the maker's mark.", correct: false, explanation: "Lifting the bowl high above the tatami exposes it to risk and is considered ungrounded handling." },
            { text: "Decline politely as you do not feel qualified to comment on the bowl's craftsmanship.", correct: false, explanation: "Declining the host's invitation to inspect is to decline the heart of the ceremony — the dialogue with the object is essential." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Second Guest",
      description: "You are the second-seated guest, following the lead of the shōkyaku. Your role is to mirror their conduct precisely, never to initiate, and to support the rhythm of the ceremony through perfect, quiet attention.",
      questions: [
        {
          question: "The shōkyaku speaks to the host. What do you do?",
          options: [
            { text: "Remain silent, attentive, and motionless — only the principal guest speaks unless directly addressed.", correct: true, explanation: "The hierarchy of speech in chanoyu is strict — the shōkyaku represents the guests and others speak only when invited." },
            { text: "Add your own brief observation to support the shōkyaku's remark.", correct: false, explanation: "Unsolicited support of the principal guest's speech disrupts the ceremony's strict choreography of voices." },
            { text: "Whisper a translation to a foreign guest beside you.", correct: false, explanation: "Whispering during the ceremony breaks the silence that is itself an offering — translation must wait." },
          ],
        },
        {
          question: "Your knees are aching from prolonged seiza (kneeling). What do you do?",
          options: [
            { text: "Endure quietly, shifting only minutely, and accept some discomfort as part of the discipline of the ceremony.", correct: true, explanation: "Tolerating physical discomfort with composure is a recognised part of chanoyu — visible adjustment disrupts the room." },
            { text: "Quietly extend your legs to one side once your discomfort grows.", correct: false, explanation: "Extending legs visibly during the formal portions of the ceremony is a clear breach — the position holds the room." },
            { text: "Stand briefly to relieve your circulation before resuming seiza.", correct: false, explanation: "Standing during the ceremony is among the most disruptive possible actions — the body remains low throughout." },
          ],
        },
        {
          question: "The chawan is passed to you after the principal guest has drunk. What do you do?",
          options: [
            { text: "Receive it from the principal guest with a slight bow, wipe the rim where they drank with the fukusa or paper provided, and follow the same form of drinking.", correct: true, explanation: "The wipe of the rim and the bow honour both the previous guest and the bowl. The form of drinking remains identical." },
            { text: "Drink directly from where the principal guest drank to maintain the bowl's continuity.", correct: false, explanation: "Drinking from the same point on the rim without wiping is unhygienic and not the prescribed form." },
            { text: "Pass the bowl onward to the third guest without drinking, as you are not the principal.", correct: false, explanation: "Skipping the offered bowl is a refusal of the host's hospitality — every guest drinks in turn." },
          ],
        },
      ],
    },
  },
  {
    title: "The Wedding Receiving Line",
    context: "Receiving line bij een trouwerij — Ceremony of welcome at a wedding",
    situation: "You are attending the wedding of a longtime friend at a country estate. The receiving line stretches from the hall into the drawing room — the bride and groom, both sets of parents, and the maid of honour stand to greet each of the 180 guests in turn. A glass of champagne in hand, you are approaching your turn.",
    pillar: 5,
    difficulty_level: 1,
    estimated_minutes: 10,
    role_a: {
      name: "The Guest",
      description: "You are passing through the receiving line. Six handshakes await. The line behind you is long. Your task is to honour each greeting briefly, warmly, and with no delay to those who follow.",
      questions: [
        {
          question: "You reach the bride's mother first and you have not previously met her. What do you say?",
          options: [
            { text: "'Mrs. [Surname], congratulations to your family — it has been a beautiful day. I'm [Your Name], a friend of [Bride] from university.'", correct: true, explanation: "Naming yourself with brief context spares the bride's mother the awkwardness of trying to place you and gives her something specific to receive." },
            { text: "'What a beautiful wedding, you must be so proud.'", correct: false, explanation: "A generic greeting that omits self-introduction leaves the parent uncertain of who you are and how to respond." },
            { text: "Spend a moment expressing how stunning the floral arrangements and venue are.", correct: false, explanation: "Lengthy compliments at the receiving line delay every guest behind you — brevity is the higher courtesy." },
          ],
        },
        {
          question: "You reach the bride. She is your close friend and you have not seen her in months. What do you do?",
          options: [
            { text: "Embrace her briefly, tell her she looks radiant, congratulate her warmly, and move on — saving the proper conversation for later in the evening.", correct: true, explanation: "Even with a close friend, the receiving line is not the place for catch-up. The line behind you is the priority — find each other later." },
            { text: "Embrace her at length and tell her properly how moved you were by the ceremony.", correct: false, explanation: "Long embraces at the line back up the queue significantly — close friendship makes brief courtesy more important, not less." },
            { text: "Suggest you find each other for a long talk at the reception, then continue.", correct: false, explanation: "Even verbalised plans for later catch-up cost time at the line — a warm look and a brief embrace conveys the same." },
          ],
        },
        {
          question: "You arrive at the groom's father, who you sense is becoming weary from the receiving. What do you say?",
          options: [
            { text: "Greet him warmly, congratulate him briefly on the splendid day, and move on without prolonging.", correct: true, explanation: "Reading fatigue and shortening your moment is the kindest reply — he will remember the consideration without ever placing it." },
            { text: "Mention to him sympathetically how tiring the receiving line must be.", correct: false, explanation: "Drawing attention to the parent's fatigue is unkind and embarrassing — the considerate response is silent action." },
            { text: "Offer to fetch him a glass of water before continuing the line.", correct: false, explanation: "Stepping away to fetch water complicates the line and embarrasses him — quiet brevity is the better gift." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Bride",
      description: "You are the bride, having stood for over an hour. Your face aches from smiling. You must greet each of 180 guests as though they were the only one — and remember everything they say.",
      questions: [
        {
          question: "A guest you do not recognise embraces you warmly. What do you do?",
          options: [
            { text: "Return the warmth fully, thank them sincerely for coming, and allow them to identify themselves naturally.", correct: true, explanation: "Returning warmth without breaking to ask identity protects everyone — names usually surface in the brief exchange that follows." },
            { text: "Ask politely for their name so you may thank them properly.", correct: false, explanation: "Asking guests their name in the line — even gently — embarrasses them and yourself, and slows the line." },
            { text: "Glance over at the maid of honour for a quiet identification.", correct: false, explanation: "Visible side-glances for help signal that you do not know the guest, which is precisely what you wish to avoid." },
          ],
        },
        {
          question: "An elderly aunt of your spouse's begins to tell you a long anecdote in the line. What do you do?",
          options: [
            { text: "Listen warmly for a moment, gently take her hand, and say: 'I cannot wait to hear all of it properly later — please find me.'", correct: true, explanation: "Touch and explicit invitation gracefully transition the moment without dismissing the relative — the warmth is preserved, the line moves on." },
            { text: "Interrupt politely to thank her and turn to the next guest.", correct: false, explanation: "Direct interruption of an elderly relative — especially of one's new in-law family — is sharp and will be remembered." },
            { text: "Allow the anecdote to finish in full, however long the line grows.", correct: false, explanation: "Allowing a single anecdote to delay 100 remaining guests is a failure to manage the moment — graceful redirection is essential." },
          ],
        },
        {
          question: "A close friend reaches you visibly emotional, with tears. What do you do?",
          options: [
            { text: "Embrace them briefly with full feeling, hold their hand for a beat, then release them gently with a quiet 'thank you' — knowing the line has paused for this and that is right.", correct: true, explanation: "Some moments justify the line waiting. A close friend's tears at your wedding are among them — receive the moment fully but briefly." },
            { text: "Move them swiftly through the line so the queue does not back up.", correct: false, explanation: "Sweeping past genuine emotion to manage logistics costs you the very thing the day is about." },
            { text: "Step out of the line entirely with them for a private moment.", correct: false, explanation: "Stepping out of the line entirely halts the entire reception and is disproportionate — a brief, full moment in place is correct." },
          ],
        },
      ],
    },
  },
  {
    title: "The Royal Investiture",
    context: "Investituur door de Koning — Royal investiture protocol",
    situation: "You are to receive a state honour at a royal investiture at Buckingham Palace. The ceremony is rigorous in its protocol: the order in which the recipient enters the room, the form of the bow or curtsey, the manner of approach, and the form of address. You will have one short conversation with the Sovereign and several seconds in which everything must go right.",
    pillar: 5,
    difficulty_level: 3,
    estimated_minutes: 15,
    role_a: {
      name: "The Recipient",
      description: "You are the recipient of the honour. You have been briefed by the Equerry but the moment itself is unrehearsed in real time. Your composure across these few minutes will be your contribution to the dignity of the occasion.",
      questions: [
        {
          question: "Your name is announced and you are signalled to enter. What do you do?",
          options: [
            { text: "Walk forward at a steady, measured pace, stop at the marker on the floor, turn to face the Sovereign, and offer the prescribed bow (gentleman) or curtsey (lady).", correct: true, explanation: "Steady pace, the marker, the turn, and the prescribed bow or curtsey are the precise sequence taught and expected — every element matters." },
            { text: "Walk briskly forward to the Sovereign, smiling broadly, and offer a deep bow before they speak.", correct: false, explanation: "Briskness, broad smiling, and excessive bowing are all marks of nervousness that disturb the ceremony's register." },
            { text: "Approach slowly, looking down out of respect, and wait for the Sovereign to speak first.", correct: false, explanation: "Looking down breaks the visual contact required and signals discomfort rather than the composure expected." },
          ],
        },
        {
          question: "The Sovereign asks you a personal question — for instance, about your work or your family. How do you reply?",
          options: [
            { text: "Reply briefly and clearly, address the Sovereign as 'Your Majesty' the first time and 'Ma'am' or 'Sir' thereafter, and allow the Sovereign to lead the conversation.", correct: true, explanation: "Brief replies, correct forms of address, and allowing the Sovereign to lead are the foundation of the brief audience." },
            { text: "Offer a longer reply, with anecdotes, to share more of yourself with the Sovereign.", correct: false, explanation: "Lengthy replies with anecdotes overstay the moment — the audience is brief by design and your role is responsive." },
            { text: "Reply with a question of your own to demonstrate engagement.", correct: false, explanation: "Posing questions to the Sovereign reverses the direction of the audience and is not part of the form." },
          ],
        },
        {
          question: "The Sovereign extends a hand at the close of the audience. What do you do?",
          options: [
            { text: "Take the hand with a brief, light touch, offer a final bow or curtsey, and walk backwards three or four steps before turning to leave.", correct: true, explanation: "Walking backwards from the Sovereign — never turning the back immediately — is the prescribed close of the audience." },
            { text: "Take the hand firmly, offer thanks, and turn to leave by the same route you entered.", correct: false, explanation: "Turning the back to the Sovereign immediately on departure breaches the form — the brief backward steps are essential." },
            { text: "Take the hand and bend to kiss it as a sign of deepest respect.", correct: false, explanation: "Kissing the Sovereign's hand is not part of contemporary British investiture protocol and would be unusual and inappropriate." },
          ],
        },
      ],
    },
    role_b: {
      name: "The Equerry",
      description: "You are the Equerry guiding recipients through the protocol. You have done this many hundreds of times. Your role is to brief, position, and reassure each recipient so that the ceremony unfolds without incident.",
      questions: [
        {
          question: "A recipient is visibly nervous and trembling slightly as their turn approaches. What do you do?",
          options: [
            { text: "Step quietly close, offer a calm word of reassurance — 'Take your time, the Sovereign is very kind' — and signal them forward at the right moment.", correct: true, explanation: "Quiet, specific reassurance from a figure who knows the room is one of the highest services an Equerry provides." },
            { text: "Inform them firmly that they must compose themselves before approaching.", correct: false, explanation: "Sharp instruction to a nervous recipient worsens their state and damages the moment for them entirely." },
            { text: "Allow them to walk forward in their current state without comment.", correct: false, explanation: "Withholding reassurance when it is clearly needed is a missed duty of the role." },
          ],
        },
        {
          question: "A recipient bows incorrectly — a deep theatrical bow rather than the prescribed brief bow. What do you do?",
          options: [
            { text: "Note it silently — the Sovereign and household will pass over it without comment, and so should you.", correct: true, explanation: "Once the bow is given it is past — drawing attention to it would compound the moment and serves no purpose." },
            { text: "Quietly approach the recipient afterwards and explain the correct form.", correct: false, explanation: "Correction after the moment is a kindness only on a future occasion — for this single audience, it would only embarrass." },
            { text: "Make eye contact with the Sovereign briefly to acknowledge the unusual bow.", correct: false, explanation: "Making eye contact with the Sovereign about a recipient's behaviour is an inappropriate breach of the household's discretion." },
          ],
        },
        {
          question: "A recipient turns immediately and walks away after the audience, forgetting the prescribed backward steps. What do you do?",
          options: [
            { text: "Allow it without intervention — the recipient has done their best and the ceremony continues.", correct: true, explanation: "The dignity of the ceremony is preserved by absorbing small breaches gracefully, not by enforcement after the fact." },
            { text: "Step forward and quietly redirect the recipient back to perform the correct departure.", correct: false, explanation: "Recalling a recipient back to redo their departure would humiliate them and disturb the room significantly." },
            { text: "Make a note in the household record so the recipient may be advised after.", correct: false, explanation: "Maintaining records of recipients' minor protocol failures is no part of the Equerry's role and would be ungenerous." },
          ],
        },
      ],
    },
  },
];

async function seed() {
  console.log("Seeding roleplay scenarios…");
  for (const s of ROLEPLAY_SCENARIOS) {
    await db.insert(roleplayScenarioTable).values(s).onConflictDoNothing();
  }
  console.log(`Inserted ${ROLEPLAY_SCENARIOS.length} roleplay scenarios.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
