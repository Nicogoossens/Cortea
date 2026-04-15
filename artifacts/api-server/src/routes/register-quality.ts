import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const router = Router();

if (!process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL || !process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
  throw new Error("Anthropic AI integration env vars are not set");
}

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const PASS_THRESHOLD = 8;

const makePrompt = (lang: string, rules: string) =>
  `You evaluate ${lang} text written by a user seeking counsel from an elite etiquette mentor.
${rules}
Scoring: 1 = very informal / colloquial, 10 = flawless aristocratic prose.
pass = true ONLY if score >= ${PASS_THRESHOLD}. Any informality, slang, filler words, or casual phrasing = pass false.
hint: a single, short, constructive rephrasing suggestion in ${lang} when pass is false, null when pass is true.
Respond ONLY with valid JSON (no markdown): {"pass": boolean, "score": number, "hint": string|null}`;

const LOCALE_SYSTEM_PROMPTS: Record<string, string> = {
  "nl": makePrompt("Dutch", "Elite Dutch uses 'u'/'uw', Latinate vocabulary, no anglicisms or diminutives, measured dignified tone."),
  "fr": makePrompt("French", "Elite French uses 'vous', subjunctive mood, Académie française vocabulary, no anglicisms or familiar contractions."),
  "de": makePrompt("German", "Elite German uses 'Sie'/'Ihnen', Konjunktiv II for requests, Hochdeutsch, no anglicisms or abbreviations."),
  "es": makePrompt("Spanish", "Elite Spanish uses 'usted', subjunctive, Castilian RAE standard vocabulary, no anglicisms."),
  "pt": makePrompt("Portuguese", "Elite Portuguese uses 'o senhor'/'a senhora', personal infinitive, European PT standard, no anglicisms."),
  "it": makePrompt("Italian", "Elite Italian uses 'Lei' form, congiuntivo, Tuscan literary vocabulary, no anglicisms."),
  "hi": makePrompt("Hindi", "Elite Hindi uses 'आप' form, Sanskrit-derived tatsama vocabulary, respectful imperative, no anglicisms."),
  "en": makePrompt("English", "Elite English uses British aristocratic understatement, subjunctive, Latinate vocabulary, no contractions or casual filler words."),
};

const RequestSchema = z.object({
  text: z.string().min(1).max(2000),
  locale: z.string().min(2).max(10),
});

router.post("/register-quality/check", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "text and locale are required." });
  }

  const { text, locale } = parsed.data;
  const baseLang = locale.split("-")[0].toLowerCase();
  const systemPrompt = LOCALE_SYSTEM_PROMPTS[baseLang] ?? LOCALE_SYSTEM_PROMPTS["en"];

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `Evaluate this text for elite register:\n\n"${text}"`,
      }],
    });

    let raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "{}";
    // Strip markdown code fences if the model wraps its response
    raw = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let result: { pass?: boolean; score?: number; hint?: string | null } = {};
    try {
      result = JSON.parse(raw);
    } catch {
      req.log.warn({ raw }, "Could not parse quality check JSON");
      result = { pass: true, score: 7, hint: null };
    }

    return res.json({
      pass: result.pass ?? true,
      score: result.score ?? 7,
      hint: result.hint ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Register quality check failed");
    return res.status(500).json({ message: "Quality check temporarily unavailable." });
  }
});

export default router;
