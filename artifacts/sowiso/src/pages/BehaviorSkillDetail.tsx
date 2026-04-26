import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useGetProfile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { LockOverlay } from "@/components/LockOverlay";
import { ArrowLeft, ArrowRight, Clock, BookOpen } from "lucide-react";

interface SkillSection {
  heading: string;
  paragraphs: string[];
}

interface SkillTip {
  label: string;
  text: string;
}

interface BehaviorSkillContent {
  id: string;
  name: string;
  principle: string;
  readingMinutes: number;
  introduction: string;
  sections: SkillSection[];
  tips: SkillTip[];
  closing: string;
}

const SKILL_CONTENT: BehaviorSkillContent[] = [
  {
    id: "active-listening",
    name: "Active Listening",
    principle: "True understanding arrives only when you stop formulating your reply and give your full attention to the other person.",
    readingMinutes: 5,
    introduction:
      "In an era of perpetual distraction, the capacity to listen with complete attention has become one of the rarest and most valued social gifts a person can offer. Active listening is not a passive state — it is a disciplined practice of presence, curiosity, and restraint that, when mastered, transforms the quality of every relationship it touches.",
    sections: [
      {
        heading: "The Architecture of Attention",
        paragraphs: [
          "Most people listen not to understand, but to reply. The mind, trained by habit and the pressure of social performance, begins composing a response while the other person is still speaking. The result is a conversation that proceeds on parallel tracks — two people taking turns broadcasting rather than genuinely exchanging.",
          "True listening requires a conscious dismantling of this reflex. It begins with the decision to suspend your own narrative entirely — to place your opinions, anxieties, and ready-made answers in abeyance for the duration of another's speech. This is not self-erasure; it is temporary generosity. What you gain in return is access to the other person's actual meaning, which is almost always richer and more nuanced than first impression suggests.",
          "Attention operates on several levels simultaneously. The surface level is verbal — the words chosen, the arguments constructed, the facts offered. Beneath this lies the emotional layer: the hesitations, the slight catches in the voice, the places where language strains against feeling. A skilled listener tracks both layers at once, understanding that the emotional subtext often carries the real message.",
        ],
      },
      {
        heading: "Silence as an Instrument",
        paragraphs: [
          "Sophisticated listeners understand that silence is not a void to be filled but a space to be honoured. After someone finishes speaking, a pause of even two or three seconds before responding signals that you have genuinely absorbed what was said — that you are thinking, not simply waiting for your turn. This small act of restraint conveys more respect than any eloquent reply.",
          "Resist the instinct to complete other people's sentences, to leap ahead with solutions the moment a problem is mentioned, or to redirect the conversation toward your own experience. Each of these habits, however well-intentioned, communicates that you find your own thoughts more interesting than theirs.",
          "When in doubt, ask. A well-placed question — open-ended, genuinely curious — accomplishes several things at once: it demonstrates that you have been paying attention, it invites the speaker to go deeper, and it signals that you value their perspective enough to want more of it.",
        ],
      },
      {
        heading: "The Social Dividend",
        paragraphs: [
          "The person who listens with full attention is, paradoxically, the person who tends to be remembered most positively after a gathering. We live in a culture that rewards those who speak well, but the deepest impression is left by those who make others feel genuinely heard. Trust, intimacy, and loyalty are built not primarily through what we say, but through the quality of our reception.",
          "In professional contexts, active listening translates directly into better decisions and stronger relationships. A negotiator who truly hears the other party's concerns gains a negotiating advantage that no script can replicate. A leader who listens before directing earns a calibre of loyalty that instruction alone cannot purchase.",
        ],
      },
    ],
    tips: [
      {
        label: "Hold your thoughts",
        text: "When a response forms in your mind, note it mentally — but continue listening. Only speak when the other person has fully finished.",
      },
      {
        label: "Reflect before answering",
        text: "After silence falls, briefly restate the essence of what you heard before offering your own view. This confirms understanding and validates the speaker.",
      },
      {
        label: "Watch the body",
        text: "Lean slightly forward, maintain relaxed eye contact, and keep your hands visible and still. These signals communicate receptiveness without a single word.",
      },
      {
        label: "Ask the second question",
        text: "After receiving a first answer, ask a genuine follow-up. Most people stop at the surface; the second question reaches the substance.",
      },
      {
        label: "Notice what is omitted",
        text: "What a person does not say is often as revealing as what they do. Skilled listeners track the contours of avoidance with the same care they give to speech.",
      },
    ],
    closing:
      "Active listening is ultimately an act of respect made tangible — a declaration that the person before you merits your complete, undivided attention. Practised consistently, it becomes the foundation upon which all other social graces are built.",
  },
  {
    id: "body-language",
    name: "Reading Body Language",
    principle: "What is left unspoken often communicates more than the words themselves.",
    readingMinutes: 5,
    introduction:
      "Every social encounter takes place on two stages simultaneously: the verbal stage, where words are exchanged, and the physical stage, where posture, gesture, and expression reveal states that language alone cannot fully convey. The person who reads only the first stage misses half the performance.",
    sections: [
      {
        heading: "The Grammar of the Body",
        paragraphs: [
          "Non-verbal signals operate according to patterns as legible as language — provided one has learned the alphabet. Posture communicates status and confidence; the angle of the torso reveals engagement or retreat; the quality of eye contact signals honesty, dominance, or anxiety depending on its duration and steadiness. None of these signals is absolute in isolation, but taken together, across time, they form a coherent picture.",
          "The face is the most expressive surface. Micro-expressions — fleeting contractions of the facial muscles lasting a fraction of a second — register genuine emotion before the social mind can suppress them. A flash of contempt, a glimpse of anxiety, a moment of genuine delight: these appear and vanish too quickly for most people to register consciously, yet they inform our intuitive assessments of trustworthiness and authenticity.",
          "Hands are the second great channel. Open palms signal openness and candour; clenched fists or tightly interlaced fingers suggest tension or withholding. The person who touches their face or neck while speaking is often experiencing stress. The person whose hands remain still and visible is generally at ease and in command.",
        ],
      },
      {
        heading: "Reading the Room",
        paragraphs: [
          "The gracious host scans the room not for idle entertainment but for signals of discomfort, disengagement, or need. A guest hovering at the edge of a group who cannot quite break in; a couple whose body language has subtly closed off from each other mid-conversation; a visitor whose eyes have begun to drift toward the door — these are invitations for a skilled host to intervene, redirect, or simply provide a natural exit.",
          "At a dinner table, turn your body fully toward whoever is speaking. The half-turn — body aimed elsewhere while the face is angled politely — is legible as distraction and rarely goes unnoticed by the perceptive guest. Similarly, watch the feet: even when the face is arranged attentively, feet that point away from the speaker reveal the direction in which the mind is already moving.",
        ],
      },
      {
        heading: "The Ethics of Mirroring",
        paragraphs: [
          "Mirroring — subtly adopting the posture or rhythm of the person you are speaking with — is among the most powerful tools of rapport available to a skilled conversationalist. When done naturally and without artifice, it signals that you are attuned to the other person and creates a felt sense of alignment.",
          "The key word is naturally. Mirroring that is mechanical or exaggerated becomes mimicry and feels invasive. The goal is not to copy but to resonate — to allow genuine rapport to express itself physically, as it does when two people who are genuinely comfortable together unconsciously adopt similar postures over the course of a conversation.",
        ],
      },
    ],
    tips: [
      {
        label: "Start with clusters",
        text: "Never read a single signal in isolation. Crossed arms may mean discomfort, but they may also mean cold. Look for clusters of three or more aligned signals before drawing a conclusion.",
      },
      {
        label: "Establish a baseline",
        text: "Before interpreting any person's signals, observe their natural resting state early in the encounter. Deviations from their baseline, not from some imagined universal norm, are the meaningful data.",
      },
      {
        label: "Watch the feet",
        text: "The feet are the least consciously controlled part of the body and therefore the most honest. They point where genuine interest lies.",
      },
      {
        label: "Use open posture intentionally",
        text: "Position yourself with shoulders back, arms uncrossed, and weight evenly distributed. Open posture invites candour from others and projects quiet confidence.",
      },
      {
        label: "Give graceful rescue cues",
        text: "When you detect that someone needs rescuing from a tedious conversation, approach with a natural bridging remark that allows both parties a dignified transition.",
      },
    ],
    closing:
      "The person who reads body language with sensitivity is not manipulating the room — they are serving it. They notice what others overlook, respond to needs that were never voiced, and create environments in which people feel genuinely seen.",
  },
  {
    id: "graceful-disagreement",
    name: "The Grace of Disagreement",
    principle: "One may hold a firm conviction and still speak of it with warmth and without apology.",
    readingMinutes: 5,
    introduction:
      "Disagreement is not a failure of social grace — it is an inevitable feature of any gathering of intelligent people. What distinguishes the socially accomplished person is not an absence of strong opinions but a cultivated mastery of how those opinions are expressed: firmly, warmly, and without either aggression or unnecessary retreat.",
    sections: [
      {
        heading: "The False Choice",
        paragraphs: [
          "Most people, when confronted with disagreement, make one of two errors. The first is capitulation — smiling, nodding, adjusting one's stated position to match the room in order to avoid friction. This preserves surface harmony at the cost of authenticity and, in the long run, respect. People notice when a position evaporates at the first sign of resistance, and what they conclude is rarely flattering.",
          "The second error is confrontation — stating one's own view with such force and so little acknowledgement of the other person's perspective that disagreement becomes a contest rather than an exchange. Confrontation wins arguments occasionally but loses relationships reliably.",
          "Graceful disagreement navigates between these poles. It is the practice of holding your ground while genuinely engaging with what the other person has said — finding the element of truth or legitimate concern in their view before presenting your own.",
        ],
      },
      {
        heading: "The Architecture of a Graceful Counter",
        paragraphs: [
          "Begin with acknowledgement. Not false agreement — genuine recognition that the other person's view has merit, or at least that you understand why they hold it. 'I see why that reading is appealing' is not a concession; it is the opening of a real conversation. It signals that you have actually listened, which makes everything you say next more worth hearing.",
          "Then introduce your perspective with language that marks it as your own view rather than objective fact. 'I see it rather differently' or 'My reading of the situation is' positions the disagreement as a difference of perspective rather than a correction, which significantly reduces defensiveness on both sides.",
          "Close by leaving the question genuinely open where the evidence warrants it. Intellectual honesty — acknowledging where certainty ends and interpretation begins — is not weakness. It is the mark of a mind that can be trusted.",
        ],
      },
      {
        heading: "Tone as the Determining Variable",
        paragraphs: [
          "The content of a disagreement matters less than the tone in which it is delivered. The same words spoken warmly and those spoken coldly land in entirely different registers. Warmth is not the same as softness: one can be both warm and unflinching. The voice that is calm, unhurried, and gently amused at the complexity of the question at hand disarms defensiveness more effectively than any rhetorical strategy.",
          "In formal or mixed company, subject matter matters as well. Politics and religion are traditional exceptions to open disagreement for good reason: the positions people hold on these subjects are often tied to identity rather than argument, and no exchange of views at a dinner table has yet resolved them. Exercising restraint in these territories is not intellectual cowardice — it is social wisdom.",
        ],
      },
    ],
    tips: [
      {
        label: "Acknowledge before countering",
        text: "Find one genuine element of the opposing view to recognise before introducing your own. This is not weakness — it is the price of being heard.",
      },
      {
        label: "Own your perspective",
        text: "Use 'I' language: 'My reading is,' 'I understand it differently.' This frames the disagreement as a difference of interpretation rather than a contest of facts.",
      },
      {
        label: "Slow down",
        text: "A slower pace signals confidence. Speaking too quickly when challenged suggests anxiety; measured delivery signals that you are comfortable holding your position.",
      },
      {
        label: "Match warmth, not heat",
        text: "When the other person's tone rises, lower yours. Calm is contagious, but only if someone in the exchange models it.",
      },
      {
        label: "Know when to let it rest",
        text: "Not every disagreement needs to be resolved in the moment. Some are best concluded with 'We shall have to see' and a slight smile — preserving goodwill for a more private and productive conversation later.",
      },
    ],
    closing:
      "The person who can disagree with grace is the person whose agreement means something. Indiscriminate agreement costs nothing and is worth about as much. Disagreement handled well is a form of respect — it says that you take the other person seriously enough to engage honestly with what they have said.",
  },
  {
    id: "art-of-introduction",
    name: "The Considered Introduction",
    principle: "How you introduce two people shapes the first impressions they form of each other — and of you.",
    readingMinutes: 4,
    introduction:
      "An introduction, performed well, is one of the most generous things one person can do for two others. It is the act of creating the conditions for a relationship that did not previously exist — and like all acts of creation, it rewards thought, care, and a certain unhurried confidence in its execution.",
    sections: [
      {
        heading: "The Protocol and Its Purpose",
        paragraphs: [
          "Formal convention specifies the order of introduction: the less distinguished guest is introduced to the more distinguished one — in practice, this means presenting the younger person to the elder, the junior colleague to the senior, the guest to the host, and the gentleman to the lady. The convention is clear enough. The art lies in understanding why it exists.",
          "The ordering of introduction confers a quiet honour on the more distinguished party: the world is being turned in their direction, so to speak. It signals awareness of hierarchy without making hierarchy the centre of attention. When the convention is observed naturally and without ceremony, it functions smoothly. When it is applied rigidly in contexts where flexibility would serve better, it becomes a hindrance rather than an aid.",
        ],
      },
      {
        heading: "The Gift of the Bridge",
        paragraphs: [
          "Beyond protocol, the highest form of introduction offers a genuine conversational bridge. This is the brief, considered detail about each person that allows the introduction to do more than merely exchange names — it sparks a natural beginning. 'Isabella is a ceramicist who has just returned from residency in Kyoto; Frederica spent three years in Japan working in textile preservation' is an introduction that practically writes the first five minutes of conversation for both parties.",
          "Such a bridge is only possible if the introducer has actually listened to both people — has paid enough attention to their interests, work, and preoccupations to know what they might find interesting in each other. This is why the considered introduction is simultaneously a social gift and an implicit test of one's own attentiveness.",
          "If you are not certain what to offer as a bridge, a question directed at one party that draws in the other works equally well: 'Alessandro has just come from Vienna — Isabel, didn't you spend last autumn there?' The question does the bridging work without requiring a complete biographical synopsis.",
        ],
      },
      {
        heading: "Common Errors and Their Remedies",
        paragraphs: [
          "The most common failure of introduction is the rushed name exchange — two names delivered in quick succession with nothing to anchor them. Both parties smile, nod, and are no better acquainted than they were before. A slight slowing of pace, a breath between the two names, and even one well-chosen connecting phrase transform this non-introduction into something functional.",
          "A second common error is the overly elaborate introduction — a full biographical essay delivered to an audience of two, which places the introducer at the centre of the exchange rather than the two people being introduced. The goal is to launch a conversation, not to deliver a presentation. Brevity combined with precision is the standard.",
        ],
      },
    ],
    tips: [
      {
        label: "Slow the pace",
        text: "Speak each name clearly and without rush. A brief pause between names gives both parties a moment to receive the other's attention.",
      },
      {
        label: "Offer one specific detail",
        text: "One well-chosen fact about each person does more work than a generic phrase. Specificity signals attentiveness.",
      },
      {
        label: "Create the bridge",
        text: "When possible, offer a point of connection — a shared interest, a mutual acquaintance, a complementary field of expertise — that gives the conversation a natural starting point.",
      },
      {
        label: "Avoid the biographical essay",
        text: "Keep the introduction brief. You are not delivering a speech; you are opening a door. The conversation that follows will fill in the rest.",
      },
      {
        label: "Follow through",
        text: "If you introduce two people, spend a moment to ensure they have genuinely connected before you move on. An introduction that is abandoned immediately feels perfunctory.",
      },
    ],
    closing:
      "The considered introduction is a quiet art, and its practice reveals a good deal about the character of the person performing it. It requires listening, memory, a degree of social imagination, and the generosity to make others the beneficiaries of your attention.",
  },
  {
    id: "table-conversation",
    name: "Table Conversation",
    principle: "A good conversationalist gives attention freely and asks questions that make others feel interesting.",
    readingMinutes: 5,
    introduction:
      "The dinner table is the crucible of social life. It is the setting in which conversation is both most expected and most revealing — where the quality of one's attention, curiosity, and restraint are on display for the duration of a meal. A gracious guest neither monopolises nor retreats; they cultivate the whole table.",
    sections: [
      {
        heading: "The Direction of Attention",
        paragraphs: [
          "The first obligation of a table guest is attentiveness to those nearby. Convention at formal dinners traditionally divides the meal: the first course is spent with the guest to one's right, the second with the guest to one's left, with a general turn of the table occurring after the entrée. This convention exists not as rigid protocol but as a practical solution to the perennial risk that a compelling neighbour monopolises the full evening while others are stranded.",
          "In less formal settings, the obligation remains: no guest at a table of eight should spend the entire meal in a private conversation with a single person while the others drift into disconnected clusters. The accomplished guest contributes to the whole, drawing in quieter voices, redirecting conversations that have narrowed too far, and ensuring that the table functions as a genuine gathering rather than a collection of separate encounters.",
        ],
      },
      {
        heading: "The Art of the Question",
        paragraphs: [
          "The most valuable tool in the table conversationalist's repertoire is not an anecdote or an opinion — it is a well-crafted question. Questions that open rather than narrow, that invite genuine reflection rather than a simple factual answer, are the engine of good dinner conversation.",
          "The difference between a good question and a flat one is specificity and genuine curiosity. 'What do you do?' is a transaction. 'What drew you to that field in the first place?' is a conversation. 'Have you been busy lately?' invites a yes or no. 'What has been occupying your mind most this autumn?' invites a life.",
          "This kind of question requires you to have been listening. You cannot ask a specific follow-up to an answer you did not hear. Table conversation, like all good conversation, is therefore inseparable from attentiveness — each feeds and reinforces the other.",
        ],
      },
      {
        heading: "The Topics That Sustain and Those That Consume",
        paragraphs: [
          "Not all topics are equally suited to the dinner table. The traditional proscriptions against politics and religion in mixed company are imperfect guides but not worthless ones. The problem is not that these subjects are unimportant — they are among the most important — but that positions held on them are often tied to identity rather than argument. A dinner table cannot resolve what a lifetime of experience and reflection has shaped, and the attempt to do so tends to produce heat without light.",
          "The subjects that sustain dinner conversation are those that invite genuine reflection and allow multiple participants to contribute from their own experience: travel, the experience of beauty, the surprises of a professional life, curiosity about how things work. These are universal enough to include everyone and specific enough to be genuinely interesting.",
          "Humour, when well-deployed, is among the most effective tools at a table. Self-deprecating wit, in particular — the ability to take one's own foibles lightly — puts other guests at ease and signals a lack of pretension that invites candour. Avoid humour at others' expense: even when it produces a laugh, the laughter is faintly uncomfortable.",
        ],
      },
    ],
    tips: [
      {
        label: "Rescue the stranded",
        text: "Notice when a nearby guest has been left out of the conversation and draw them in with a question directed specifically at them.",
      },
      {
        label: "Offer rather than perform",
        text: "Share experiences that open the topic to others, not anecdotes that end it. The story that begins 'something similar happened to me once' and invites a response is more valuable than the story that leaves no room for reply.",
      },
      {
        label: "Avoid the recitation",
        text: "A string of opinions delivered with authority closes conversation down. Position views as provisional and genuinely invite other perspectives.",
      },
      {
        label: "Hold lightly to your agenda",
        text: "If you arrive with a specific topic you want to discuss, let the table find its own rhythm first. Imposing an agenda on a dinner conversation is rarely as invisible as the imposer believes.",
      },
      {
        label: "Know when the story has peaked",
        text: "Every anecdote has a natural high point. Stop there. The impulse to continue past the peak — to explain, to elaborate — erases the impression the story had just made.",
      },
    ],
    closing:
      "The ideal dinner guest leaves others feeling that the evening was animated by their presence — not by the guest's performance, but by the quality of attention they gave and the ease with which they invited others to contribute. The measure of a great conversationalist is not how interesting they were, but how interesting they made everyone else feel.",
  },
  {
    id: "digital-conduct",
    name: "Digital Conduct",
    principle: "The same courtesy that governs the drawing room governs the inbox and the message thread.",
    readingMinutes: 4,
    introduction:
      "The principles of etiquette were not invented for a particular medium. They were articulated in response to a fundamental social reality — that the quality of our interactions with others reflects the degree of respect we hold for them. That reality has not changed because the medium has. If anything, digital communication demands more deliberate care, because the channels it relies on strip away tone, expression, and context, leaving words to do all the work alone.",
    sections: [
      {
        heading: "The Weight of the Written Word",
        paragraphs: [
          "Spoken language is buffered by voice — by tone, warmth, humour, hesitation, and the thousand inflections that transform raw meaning into human communication. Written language has none of these. A single phrase — 'Fine, let's do that' — can be read as enthusiastic agreement, reluctant capitulation, or barely concealed irritation, depending on the reader's mood and the relationship between the parties. The writer, who had one meaning in mind, is often oblivious to the others.",
          "The discipline of digital conduct begins with the recognition that your written words will be received without the benefit of your voice, face, or physical presence. They must therefore carry that weight themselves. A little additional warmth in a message rarely costs much; a little coldness, unintended or otherwise, can do disproportionate damage.",
        ],
      },
      {
        heading: "The Obligation of Response",
        paragraphs: [
          "Promptness in reply is not a convenience extended to the person who wrote to you — it is a form of respect. Leaving messages unreturned or unanswered for extended periods communicates, whatever the actual intention, that the matter and the person who raised it are not among your priorities. In professional life this impression can be costly; in personal life it is simply unkind.",
          "The standard of promptness is calibrated to the urgency and the relationship. A message from a close friend does not demand a reply within the hour; a professional query that requires action within a day or two generally does. What is not acceptable — in either domain — is the indefinite silence that leaves the other person uncertain whether you have received, read, or simply chosen to ignore what they sent.",
          "When you cannot respond fully, acknowledge receipt. A brief 'Received — I'll come back to this properly on Thursday' costs ten seconds and saves the sender days of uncertainty.",
        ],
      },
      {
        heading: "Tone, Haste, and the Uncancellable Send",
        paragraphs: [
          "The send button is irrevocable. Whatever you have written, whatever the mood in which you wrote it, once sent it exists in the world — forwarded, screenshotted, quoted out of context — beyond your control. This is not a reason for paralysis, but it is a strong argument for the discipline of delay.",
          "Anything written in anger, frustration, or haste benefits from a pause before sending. Even five minutes of distance is often enough to reveal a turn of phrase that reads more harshly than intended, an accusation that would be better addressed in conversation, or a conclusion drawn before all the evidence was in. The message that waits for cooler judgement is almost always better than the one that went immediately.",
          "In group threads and shared channels, be sparing with your contributions. The volume of messages that pass through professional and social channels daily is already substantial. A contribution that adds genuine substance or warmth is welcome; a response that says only 'agreed' or forwards information everyone already has contributes to noise rather than conversation.",
        ],
      },
    ],
    tips: [
      {
        label: "Read before you send",
        text: "Before sending anything substantive, read it once as if you were the recipient — particularly on days when you are tired, anxious, or frustrated.",
      },
      {
        label: "Acknowledge promptly",
        text: "If a full reply must wait, acknowledge receipt and offer a timeframe. Silence is the most ambiguous response of all.",
      },
      {
        label: "Avoid the late-night send",
        text: "Messages written late at night and in haste rarely read the same in the morning. When in doubt, draft and sleep on it.",
      },
      {
        label: "Match the register",
        text: "Adjust your tone and formality to match the relationship and platform. The same breezy register that works between close friends can read as disrespectful in a professional context.",
      },
      {
        label: "Spare the group thread",
        text: "In group communications, ask whether your contribution adds genuine substance. The discipline of restraint in collective spaces is as much a social courtesy as promptness in personal ones.",
      },
    ],
    closing:
      "Digital conduct ultimately asks only what all conduct asks: that we consider the experience of the person receiving our communication. The channel is new; the obligation is ancient. Apply the same thought, care, and warmth to the message thread that you would to the drawing room, and the results will look and feel much the same.",
  },
  {
    id: "graceful-exit",
    name: "The Graceful Exit",
    principle: "Knowing when and how to leave a conversation is as important as knowing how to begin one.",
    readingMinutes: 4,
    introduction:
      "Conversations, like meals, have a natural arc. They build toward moments of genuine exchange, reach a kind of fullness, and then — if left unattended — begin to thin. The person who recognises this arc and who knows how to close an encounter at its natural peak leaves a better impression than one who either departs too abruptly or lingers past the point where the exchange has anything further to offer.",
    sections: [
      {
        heading: "The Fear of Departure",
        paragraphs: [
          "Most people find endings uncomfortable. The social fear of seeming rude, indifferent, or dismissive leads to a peculiar form of conversational paralysis in which people remain in conversations they are no longer genuinely contributing to — nodding, offering thin responses, avoiding the exit they have been planning for the past ten minutes.",
          "This prolonged not-quite-departure is, ironically, more awkward than a clean exit would have been. It leaves both parties aware that the conversation has passed its natural end but uncertain of the social mechanism to close it. The person who provides that mechanism — clearly, warmly, and with a forward-looking remark — does the other person a genuine service.",
        ],
      },
      {
        heading: "The Structure of a Clean Close",
        paragraphs: [
          "A graceful exit has three components. The first is a signal — a slight change in posture, a summarising remark that feels like a conclusion, or an explicit reference to the pleasure the conversation has brought. 'I've so enjoyed hearing your perspective on this' does the signalling work without any sense of hurry.",
          "The second component is the forward bridge — a remark that gestures toward a future encounter or the continuation of the relationship. 'I'll look forward to seeing the finished piece' or 'I hope our paths cross again in Berlin' closes the present conversation while opening a future one. This is not merely polite — it communicates that the departure is not a rejection.",
          "The third component is the physical closure: the slight step back, the warm handshake, the unhurried goodbye. Do not begin the farewell and then remain standing. Once the exit has begun, complete it. The half-departure — the farewell followed by a further five minutes of conversation — is among the most draining social experiences, because neither party knows quite where they stand.",
        ],
      },
      {
        heading: "Departing a Gathering",
        paragraphs: [
          "When leaving a larger gathering, the French have a practice — known elsewhere as the 'Irish goodbye' — of departing without individually saying farewell to every guest. In some social circles this is accepted; in others it reads as indifference. The safer standard, where relationships warrant it, is to take leave personally of the host first and foremost, and then of any guests with whom you have had meaningful conversation during the evening.",
          "The farewell to the host deserves particular care. It is the moment to express, briefly but sincerely, your appreciation for the occasion — the care they have taken, a specific pleasure the evening brought you. A generic 'wonderful evening' has been said a thousand times; 'the arrangement of the table was extraordinary, and I had quite the most interesting conversation of my autumn with your neighbour from Lisbon' will be remembered.",
        ],
      },
    ],
    tips: [
      {
        label: "Signal before you close",
        text: "Give the other person a moment to prepare for the departure rather than ending the conversation abruptly. A summarising remark serves as a natural signal.",
      },
      {
        label: "Offer a forward bridge",
        text: "Close with a remark that gestures toward the future — a hope to continue, a reference to a shared project, a genuine wish. This frames the departure as a pause rather than an end.",
      },
      {
        label: "Complete the exit",
        text: "Once you have said farewell, depart. The prolonged goodbye is almost always more disruptive than the departure itself.",
      },
      {
        label: "Thank the host last",
        text: "The most important farewell of any gathering is the one you give the host. Make it personal, specific, and warm.",
      },
      {
        label: "Resist the final topic",
        text: "The impulse to introduce one more subject at the threshold is common and usually regrettable. If something important remains, agree to continue it another time.",
      },
    ],
    closing:
      "The graceful exit is a courtesy extended to the other person — it frees them from the awkwardness of the prolonged ending and leaves them with a final impression that is clear, warm, and forward-looking. Like all acts of social grace, it is ultimately an act of attentiveness to someone else's experience.",
  },
  {
    id: "language-of-gratitude",
    name: "The Language of Gratitude",
    principle: "Expressed appreciation, when specific and sincere, strengthens the bonds that sophisticated social life depends upon.",
    readingMinutes: 4,
    introduction:
      "Gratitude is among the most commonly felt and least artfully expressed of human experiences. We experience genuine appreciation many times in any given week — for a kindness received, a difficulty shouldered on our behalf, a gift of time or expertise or care — and yet the expression we offer in return is often so generic as to leave no mark. The language of gratitude is a skill, and like all skills, it rewards deliberate practice.",
    sections: [
      {
        heading: "Specificity as the Currency of Meaning",
        paragraphs: [
          "The most reliable way to make expressed gratitude meaningful is to be specific. 'Thank you for dinner' acknowledges an event. 'Thank you for the extraordinary care you took with the seating — the conversation I had with your neighbour from Rome has already changed how I think about that period of Italian history' acknowledges a person.",
          "Specificity communicates three things simultaneously: that you were paying attention, that the gesture or effort made a genuine difference, and that you have thought about it enough to articulate precisely what it gave you. Each of these is a gift in return — a form of recognition that goes beyond the surface of social obligation.",
          "This does not require elaborate sentences or formal language. It requires only the habit of pausing, before expressing thanks, to identify precisely what you are grateful for and why it mattered. That single moment of reflection transforms a routine expression into something the recipient will remember.",
        ],
      },
      {
        heading: "The Written Note",
        paragraphs: [
          "In a culture saturated with text messages and emails, a handwritten note carries a weight that digital communication rarely matches. It signals that the writer thought the occasion important enough to require physical effort — the choice of paper, the deliberate pace of writing by hand, the act of addressing and sending. These small investments of time communicate a quality of regard that efficiency cannot replicate.",
          "A written note of thanks after a significant dinner, a meaningful meeting, or an act of particular generosity is not merely polite — it is an investment in the relationship. Notes of this kind are among the very few social communications that are genuinely kept. The box of handwritten correspondence that outlives the digital archive is a real phenomenon.",
          "The note need not be long. Two or three sentences, specific and warm, are more effective than a page of generic appreciation. The goal is not to impress but to express — to give the recipient a precise, honest record of what their generosity meant.",
        ],
      },
      {
        heading: "The Timing and Register of Thanks",
        paragraphs: [
          "Gratitude expressed too long after the fact loses some of its impact, though it is almost always better late than never. The ideal window for written thanks is within twenty-four to forty-eight hours of the occasion — early enough that the event is fresh, but not so immediate that the note feels reflexive.",
          "The register of your thanks should match the register of the gift. A casual kindness from a close friend calls for a warm, personal note in a natural voice. A significant professional courtesy may warrant something slightly more formal. The aim in both cases is authenticity — a tone that sounds like you, not like a template.",
        ],
      },
    ],
    tips: [
      {
        label: "Name the specific act",
        text: "Before expressing thanks, identify precisely what you are grateful for. 'The arrangement of the flowers' rather than 'everything' — the specific detail is what makes the thanks register.",
      },
      {
        label: "Name the effect",
        text: "Where possible, describe what the generosity gave you — how it changed your afternoon, enriched your understanding, relieved a difficulty. This transforms the acknowledgement of an act into the acknowledgement of a person.",
      },
      {
        label: "Write the note",
        text: "For significant occasions — a dinner, a meaningful introduction, a gift of time — a handwritten note is almost always the right response. It need not be long.",
      },
      {
        label: "Avoid the delayed avalanche",
        text: "Expressing thanks for multiple occasions in a single catch-up message dilutes all of them. Where possible, thank promptly and separately.",
      },
      {
        label: "Allow gratitude to be reciprocal",
        text: "Accept thanks graciously when it is offered. 'It was nothing' erases the other person's experience. 'I'm glad it was useful' honours it.",
      },
    ],
    closing:
      "The language of gratitude, practised with specificity and sincerity, is among the most quietly powerful tools of social life. It costs relatively little — only attention and a moment of genuine reflection — and it returns, in trust, warmth, and the deepening of relationships, far more than the investment it required.",
  },
];

const SKILL_IDS = SKILL_CONTENT.map((s) => s.id);

export default function BehaviorSkillDetail() {
  const params = useParams<{ id: string }>();
  const skillId = params.id ?? "";

  const skill = useMemo(() => SKILL_CONTENT.find((s) => s.id === skillId) ?? null, [skillId]);
  const currentIndex = SKILL_IDS.indexOf(skillId);
  const prevSkill = currentIndex > 0 ? SKILL_CONTENT[currentIndex - 1] : null;
  const nextSkill = currentIndex < SKILL_CONTENT.length - 1 ? SKILL_CONTENT[currentIndex + 1] : null;

  const { isAuthenticated } = useAuth();
  const { data: profile } = useGetProfile();

  const tier = profile?.subscription_tier ?? "guest";
  const hasFullAccess = tier === "traveller" || tier === "ambassador";

  usePageTitle(skill ? `${skill.name} — Behavior Skills` : "Behavior Skills");

  if (!skill) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Not found</p>
        <p className="text-muted-foreground font-light">This skill article does not exist.</p>
        <Link href="/counsel">
          <div className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2 cursor-pointer mt-2">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Return to The Counsel
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
      {/* Back link */}
      <Link href="/counsel">
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
          The Counsel
        </div>
      </Link>

      {/* Header */}
      <header className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">
          Behavior Skills
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl text-foreground leading-snug">
          {skill.name}
        </h1>
        <blockquote className="border-l-2 border-primary/30 pl-4 text-sm italic font-light text-primary/80 leading-relaxed max-w-xl">
          {skill.principle}
        </blockquote>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{skill.readingMinutes} min read</span>
          <span className="mx-1.5 opacity-30">·</span>
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Extended article</span>
        </div>
      </header>

      {/* Gated content */}
      {!hasFullAccess ? (
        <div className="relative min-h-[320px] overflow-hidden rounded-sm">
          {/* Teaser content — visible but blurred beneath the overlay */}
          <div className="space-y-6 pointer-events-none select-none opacity-60 blur-[1px]" aria-hidden="true">
            <p className="text-base text-muted-foreground font-light leading-relaxed">
              {skill.introduction}
            </p>
            <div className="space-y-4">
              {skill.sections[0] && (
                <>
                  <h2 className="font-serif text-lg text-foreground">{skill.sections[0].heading}</h2>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {skill.sections[0].paragraphs[0]}
                  </p>
                </>
              )}
            </div>
          </div>
          <LockOverlay
            variant="section"
            requiredTier="traveller"
            teaser="Full skill articles — extended reading, practical techniques, and contextual examples — are available to Traveller and Ambassador members."
            isAuthenticated={isAuthenticated}
          />
        </div>
      ) : (
        <article className="space-y-10">
          {/* Introduction */}
          <p className="text-base text-foreground/80 font-light leading-relaxed">
            {skill.introduction}
          </p>

          {/* Sections */}
          {skill.sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="font-serif text-lg text-foreground">{section.heading}</h2>
              {section.paragraphs.map((para, i) => (
                <p key={i} className="text-sm text-muted-foreground font-light leading-relaxed">
                  {para}
                </p>
              ))}
            </section>
          ))}

          {/* Practical Tips */}
          <section className="space-y-4">
            <h2 className="font-serif text-lg text-foreground">Practical Guidance</h2>
            <ul className="space-y-3">
              {skill.tips.map((tip) => (
                <li key={tip.label} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary/40 translate-y-[5px]" aria-hidden="true" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{tip.label}</p>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">{tip.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Closing */}
          <p className="text-sm text-muted-foreground font-light italic leading-relaxed border-t border-border/30 pt-6">
            {skill.closing}
          </p>
        </article>
      )}

      {/* Prev / Next navigation */}
      <nav
        aria-label="Skill navigation"
        className="flex items-center justify-between gap-4 border-t border-border/30 pt-6"
      >
        {prevSkill ? (
          <Link href={`/counsel/skills/${prevSkill.id}`}>
            <div className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
              <span className="font-light">{prevSkill.name}</span>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextSkill ? (
          <Link href={`/counsel/skills/${nextSkill.id}`}>
            <div className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <span className="font-light">{nextSkill.name}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </div>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
