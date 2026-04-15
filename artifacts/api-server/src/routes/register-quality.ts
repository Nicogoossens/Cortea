import { Router } from "express";
import { z } from "zod";
import { requireAuthUser } from "../lib/auth-middleware";

const router = Router();

const PASS_THRESHOLD = 8;

const makePrompt = (lang: string, rules: string) =>
  `You evaluate ${lang} text written by a member seeking counsel from an elite etiquette mentor.
${rules}
Scoring: 1 = very informal or colloquial, 10 = flawless aristocratic prose.
pass = true ONLY if score >= ${PASS_THRESHOLD}. Any informality, slang, filler words, or casual phrasing = pass false.
hint: a single, short, constructive rephrasing suggestion written in ${lang} when pass is false; null when pass is true.
Respond ONLY with valid JSON, no markdown fences: {"pass": boolean, "score": number, "hint": string|null}`;

const LOCALE_SYSTEM_PROMPTS: Record<string, string> = {
  "nl": makePrompt("Dutch", "Elite Dutch uses 'u'/'uw', Latinate vocabulary, no anglicisms or diminutives, a measured dignified tone, and the aanvoegende wijs (subjunctive) where correct."),
  "fr": makePrompt("French", "Elite French uses 'vous'/'votre', subjunctive mood, Académie française elevated vocabulary, no anglicisms or familiar contractions. Tone: 18th-century Paris salon."),
  "de": makePrompt("German", "Elite German uses 'Sie'/'Ihnen', Konjunktiv II for polite requests, Hochdeutsch Duden standard, no anglicisms or abbreviations. Tone: Prussian administrative precision."),
  "es": makePrompt("Spanish", "Elite Spanish uses 'usted', subjunctive, Castilian RAE standard vocabulary ('solicitar' not 'pedir'), no anglicisms. Tone: Spanish Royal Court."),
  "pt": makePrompt("Portuguese", "Elite Portuguese uses 'o senhor'/'a senhora', personal infinitive, European PT standard, no Brazilian neologisms or anglicisms. Tone: Eça de Queirós prose style."),
  "it": makePrompt("Italian", "Elite Italian uses 'Lei'/'Suo', congiuntivo, Tuscan literary vocabulary, no anglicisms. Tone: Leopardi and Manzoni."),
  "hi": makePrompt("Hindi", "Elite Hindi uses 'आप' form, Sanskrit-derived tatsama vocabulary, respectful imperative ('कृपया ... करें'), no anglicisms or film-Hindi slang."),
  "en": makePrompt("English", "Elite English uses British aristocratic understatement, subjunctive mood, Latinate vocabulary, no contractions in formal text, no Americanisms or casual filler words. Tone: Victorian gentry correspondence."),
};

const RequestSchema = z.object({
  text: z.string().min(1).max(2000),
  locale: z.string().min(2).max(10),
});

router.post("/register-quality/check", requireAuthUser, async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "text and locale are required." });
  }

  const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const anthropicKey  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!anthropicBase || !anthropicKey) {
    req.log.warn("Anthropic env vars not configured — quality check unavailable");
    return res.status(503).json({ message: "Quality check is not currently available." });
  }

  const { text, locale } = parsed.data;
  const baseLang = locale.split("-")[0].toLowerCase();
  const systemPrompt = LOCALE_SYSTEM_PROMPTS[baseLang] ?? LOCALE_SYSTEM_PROMPTS["en"];

  try {
    const response = await fetch(`${anthropicBase}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: "user", content: `Evaluate this text for elite register:\n\n"${text}"` }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      req.log.error({ status: response.status, body: errText }, "Anthropic API error");
      return res.status(500).json({ message: "Quality check temporarily unavailable." });
    }

    const data = await response.json() as { content?: Array<{ type: string; text: string }> };
    let raw = data.content?.[0]?.text?.trim() ?? "{}";
    raw = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let result: { pass?: boolean; score?: number; hint?: string | null } = {};
    try {
      result = JSON.parse(raw);
    } catch {
      req.log.warn({ raw }, "Could not parse quality check JSON — defaulting to pass");
      result = { pass: true, score: 7, hint: null };
    }

    return res.json({
      pass:  result.pass  ?? true,
      score: result.score ?? 7,
      hint:  result.hint  ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Register quality check failed");
    return res.status(500).json({ message: "Quality check temporarily unavailable." });
  }
});

export default router;
