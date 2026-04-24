import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db, counselQualityLogTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { extractToken } from "../lib/auth-middleware";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const router = Router();

const REGION_CONTEXT: Record<string, string> = {
  GB: "Great Britain. Culture values restraint, understatement, and quiet politeness. Directness is considered rude. Queuing, apologising, and dry humour are social rituals. Never be overly effusive.",
  CN: "China. Culture values collective harmony, face-saving (mianzi), and hierarchy. Refusing food may offend. Gift-giving has complex rules. Business cards are exchanged with two hands.",
  CA: "Canada. Culture values politeness, multiculturalism, and modesty. Punctuality is respected. Direct communication is expected but always polite. Environmental and social consciousness matter.",
  US: "The United States. Culture values directness, optimism, and individualism. First names are used quickly. Firm handshakes are expected. Small talk is a social lubricant.",
  FR: "France. Culture values intellectual exchange, formality, and appreciation for the arts. Use 'vous' until invited to use 'tu'. Meals are unhurried social rituals.",
  DE: "Germany. Culture values punctuality, thoroughness, and directness. Titles are used. Separating personal and professional spheres is important. Efficiency is a virtue.",
  JP: "Japan. Culture values harmony, respect for hierarchy, and non-verbal communication. Bowing is paramount. Silence is not awkward. Business cards are sacred objects.",
  AE: "The United Arab Emirates. Culture is shaped by Islamic tradition and Bedouin hospitality. Dress modestly. Right hand for greetings and eating. Ramadan protocols must be respected.",
  SG: "Singapore. A blend of Chinese, Malay, Indian, and Western influences. Meritocracy and order are valued. Kiasu (fear of losing out) shapes social behaviour.",
  IN: "India. Culture is enormously diverse by region. Hospitality is paramount. Use the right hand. Vegetarian options should be assumed. Hierarchy and elder-respect are important.",
  BR: "Brazil. Culture values warmth, physical closeness, and relationships. First names are used immediately. Punctuality is flexible. Personal touch matters in business.",
  ZA: "South Africa. Culture is richly diverse across Zulu, Xhosa, Afrikaner, and other communities. Ubuntu (collective humanity) underpins social interaction.",
  AU: "Australia. Culture values egalitarianism, informality, and a fair go. Tall poppy syndrome means boasting is penalised. Outdoor culture and sport are central.",
  MX: "Mexico. Culture values family, personal relationships (personalismo), and courtesy. Business moves slowly without trust. Meals are long social events.",
  NL: "The Netherlands. Culture values directness, egalitarianism, and pragmatism. Bluntness is not considered rude. Cycling and gezelligheid (cosiness) are cultural pillars. Punctuality is expected.",
  IT: "Italy. Culture values family, aesthetics, and the bella figura (cutting a good figure). Meals are lengthy social events. Dress matters. Regional differences are significant.",
  ES: "Spain. Culture values personal warmth, family, and lively social interaction. Late dining hours are the norm. Loyalty and personal trust precede business relationships.",
  PT: "Portugal. Culture values saudade (nostalgic longing), modest restraint, and sincere hospitality. Relationship-building is slow and earnest. Punctuality is appreciated but flexible.",
};

const MEHRABIAN_GUIDANCE: Record<string, string> = {
  JP: "Nonverbal signals dominate (posture, silence, bowing angle). Stillness and composure communicate far more than words. Silence is not awkward — it is respectful.",
  CN: "Tone and composed demeanour matter enormously. A calm voice and respectful posture signal cultural fluency. Avoid anything that could be read as confrontational in bearing.",
  AE: "Physical presence and eye contact signal sincerity. Speak with measured gravity. Spiritual composure is read in one's bearing and unhurried manner.",
  IN: "Warmth and respect in voice can smooth many missteps. A slight bow or hands pressed together communicates esteem without words.",
  SG: "Composed, measured behaviour is prized. Avoid overt gesturing or loud speech. Economy of movement signals confidence and education.",
  FR: "Articulate speech and deliberate pauses matter. Controlled expressiveness is valued; do not gesticulate excessively.",
  IT: "Expressive gesture is part of the conversation, but excess becomes performance. Manner of dress is read before you speak a word.",
  BR: "Warmth and physical closeness are expected. Firm embrace, eye contact, and animated expression signal genuine engagement.",
  CA: "Clear verbal communication is primary. Direct, polite, precise speech is valued. Minimal gesturing and steady eye contact convey credibility.",
  AU: "An easy, open posture and direct but relaxed tone win trust. Authenticity of manner is paramount; excessive formality reads as pretension.",
  GB: "Composure is all. Restrained gesture and measured tone signal breeding. Excessive warmth or demonstration is viewed with mild alarm.",
  DE: "Precision of speech is valued above warmth of tone. Stand straight, speak clearly, avoid filler words. Sincerity outweighs affability.",
  NL: "Direct verbal communication is primary. Words are chosen precisely. Excessive nonverbal theatrics are unnecessary.",
  ES: "Animated expression and vocal warmth are natural. Physical closeness is comfortable. Tone signals enthusiasm and engagement.",
  PT: "A measured and sincere tone is most trusted. Restraint signals depth of character.",
  MX: "Warmth in tone and a personal touch in greeting are expected. Voice quality and facial expression convey respect and genuine interest.",
  US: "Confident and open body language is expected. Firm handshakes, eye contact, and an animated but controlled voice signal leadership.",
  ZA: "Ubuntu is felt through warmth, openness, and an unhurried manner. Be present, engage genuinely, and listen with your whole bearing.",
};

const OBJECTIVE_CONTEXT: Record<string, string> = {
  business: "The person's primary objective is professional refinement — business meetings, client relations, boardroom conduct, and corporate social events.",
  elite: "The person moves in elite social circles and seeks to conduct themselves with the ease and distinction of high society — private clubs, charity galas, aristocratic gatherings.",
  romantic: "The person's focus is romantic and interpersonal social conduct — courtship, first impressions, social gatherings, and the art of charming conversation.",
  world_traveller: "The person is an experienced international traveller — their questions arise from navigating diverse cultural customs, luxury hospitality, and international social environments.",
};

const SPHERE_DESCRIPTIONS: Record<string, string> = {
  business: "business and professional settings — boardrooms, client dinners, networking events, and formal negotiations",
  gastronomy: "gastronomic and fine dining environments — restaurant etiquette, wine service, tasting menus, and culinary occasions",
  arts_culture: "arts, culture, and heritage settings — gallery openings, museum visits, cultural institutions, and intellectual gatherings",
  music_entertainment: "music and entertainment occasions — concerts, performances, private screenings, and cultural events",
  formal_events: "formal occasions and ceremonies — galas, awards evenings, state functions, and black-tie affairs",
  lifestyle_wellness: "lifestyle and wellness environments — spas, private clubs, health retreats, and social leisure",
  travel_hospitality: "travel and hospitality settings — luxury hotels, private transfers, international travel, and concierge interactions",
};

router.post("/counsel", async (req, res) => {
  const { query, domain, region_code, situation, situational_interests, objective } = req.body as {
    query?: string;
    domain?: string;
    region_code?: string;
    situation?: string;
    situational_interests?: string[];
    objective?: string;
  };

  if (!query && !domain) {
    res.status(400).json({ error: "query or domain is required" });
    return;
  }

  const region = (region_code || "GB").toUpperCase();
  const regionContext = REGION_CONTEXT[region] ?? REGION_CONTEXT["GB"];
  const mehrabian = MEHRABIAN_GUIDANCE[region] ?? "";

  const sphereDescs = (situational_interests ?? [])
    .map((s) => SPHERE_DESCRIPTIONS[s])
    .filter(Boolean);
  const sphereContext = sphereDescs.length > 0
    ? `\nSocial environments: This person moves primarily in ${sphereDescs.join("; and ")}. Draw on examples and nuances appropriate to these settings without naming them explicitly.`
    : "";

  const objectiveContext = objective && OBJECTIVE_CONTEXT[objective]
    ? `\nPersonal objective: ${OBJECTIVE_CONTEXT[objective]}`
    : "";

  const systemPrompt = `You are a discreet and highly cultured etiquette mentor in the tradition of the finest European finishing schools and diplomatic corps. Your register is elevated, composed, and reassuring — never preachy, never verbose.

Regional context: ${regionContext}
${mehrabian ? `\nTone and nonverbal calibration: ${mehrabian}` : ""}${objectiveContext}${sphereContext}${situation ? `\nPre-session context: The person is preparing for the following situation — "${situation}". Calibrate your guidance specifically to this setting and its social expectations.` : ""}
Your guidance must follow this three-part structure — written as flowing prose, never as numbered steps or bullets:
First, acknowledge the social difficulty with composed empathy. Then, illuminate the cultural expectation or principle at play with quiet authority. Finally, offer a precise, actionable recommendation for what one should do or say.

Additional requirements:
- Written in a formal but warm literary register (think a trusted advisor, not a textbook)
- Calibrated to the specific region's customs, including tone and nonverbal posture where relevant
- Between 80 and 160 words — no more
- Never name psychological constructs directly — all behavioural guidance must be expressed in etiquette language

If a domain is specified, focus your guidance there. If the situation is ambiguous, address the most likely interpretation gracefully.`;

  const userMessage = [
    domain ? `Domain: ${domain}` : null,
    query ? `Situation: ${query}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const TIMEOUT_MS = 25_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const message = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal },
    );
    clearTimeout(timer);

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ guidance: text });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      res.status(504).json({ error: "The counsel timed out. Please try again shortly." });
      return;
    }
    console.error("Counsel AI error:", err);
    res.status(500).json({ error: "The mentor is unavailable. Please try again shortly." });
  }
});

const LogQualitySchema = z.object({
  domain: z.string().min(1).max(60),
  score: z.number().min(1).max(10),
});

router.post("/counsel/log-quality", async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.session_token, token))
    .limit(1);
  if (!user) {
    return res.status(401).json({ message: "Invalid session." });
  }

  const parsed = LogQualitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "domain and score (1-10) are required." });
  }

  const { domain, score } = parsed.data;
  try {
    await db.insert(counselQualityLogTable).values({
      user_id: user.id,
      domain,
      score,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Failed to log counsel quality:", err);
    return res.status(500).json({ message: "Could not log counsel interaction." });
  }
});

export default router;
