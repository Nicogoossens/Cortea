import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

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

router.post("/counsel", async (req, res) => {
  const { query, domain, region_code } = req.body as {
    query?: string;
    domain?: string;
    region_code?: string;
  };

  if (!query && !domain) {
    res.status(400).json({ error: "query or domain is required" });
    return;
  }

  const region = (region_code || "GB").toUpperCase();
  const regionContext = REGION_CONTEXT[region] ?? REGION_CONTEXT["GB"];

  const systemPrompt = `You are a discreet and highly cultured etiquette mentor in the tradition of the finest European finishing schools and diplomatic corps. Your register is elevated, composed, and reassuring — never preachy, never verbose.

Regional context: ${regionContext}

Your guidance must be:
- Precise and actionable, not vague
- Written in a formal but warm literary register (think a trusted advisor, not a textbook)
- Calibrated to the specific region's customs
- Between 80 and 160 words — no more
- Free of bullet points; written as flowing prose

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

export default router;
