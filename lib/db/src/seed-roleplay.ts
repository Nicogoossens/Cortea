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
