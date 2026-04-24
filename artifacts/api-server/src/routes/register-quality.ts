import { Router } from "express";
import { z } from "zod";
import { requireAuthUser } from "../lib/auth-middleware";
import type { AuthenticatedRequest } from "../lib/auth-middleware";

const router = Router();

const PASS_THRESHOLD = 8;

const makePrompt = (lang: string, rules: string) =>
  `You evaluate ${lang} text written by a member seeking counsel from an elite etiquette mentor.
${rules}
Scoring: 1 = very informal or colloquial, 10 = flawless aristocratic prose.
pass = true ONLY if score >= ${PASS_THRESHOLD}. Any informality, slang, filler words, or casual phrasing = pass false.
hint: a single, short, constructive rephrasing suggestion written in ${lang} when pass is false; null when pass is true.
Respond ONLY with valid JSON, no markdown fences: {"pass": boolean, "score": number, "hint": string|null}`;

// Full-locale keys take precedence over base-language keys.
// Resolution order: "<lang-REGION>" → "<lang>" → "en"
const LOCALE_SYSTEM_PROMPTS: Record<string, string> = {
  // ── English regional variants ──────────────────────────────────────────────
  "en-GB": makePrompt("British English", "Elite British English uses aristocratic understatement, subjunctive mood, Latinate vocabulary (Received Pronunciation register), no contractions in formal text, no Americanisms or casual filler words. Tone: Victorian gentry correspondence and Debrett's etiquette."),
  "en-US": makePrompt("American English", "Elite American English uses formal register, complete sentences, Latinate vocabulary, no contractions, no slang or colloquialisms. Tone: Ivy League academic correspondence."),
  "en-AU": makePrompt("Australian English", "Elite Australian English uses formal British-derived register, Latinate vocabulary, 'one' or 'you' (formal), no colloquialisms, no slang. Tone: Old-school Australian diplomatic service."),
  "en-CA": makePrompt("Canadian English", "Elite Canadian English uses formal British-influenced register, Latinate vocabulary, no contractions, no Americanisms. Tone: Canadian federal official correspondence."),
  // ── Dutch regional variants ────────────────────────────────────────────────
  "nl-NL": makePrompt("Dutch (Netherlands)", "Elite Netherlands Dutch uses 'u'/'uw', aanvoegende wijs (subjunctive), Latinate vocabulary, no anglicisms or diminutives, measured dignified tone. Tone: Dutch Golden Age chancellery prose."),
  "nl-BE": makePrompt("Belgian Dutch (Flemish)", "Elite Flemish uses 'u'/'uw', formal Flemish register, no anglicisms or diminutives, Latinate vocabulary. Tone: Belgian royal correspondence — more reserved than Netherlands Dutch."),
  // ── French ────────────────────────────────────────────────────────────────
  "fr-FR": makePrompt("French", "Elite French uses 'vous'/'votre', subjunctive, Académie française elevated vocabulary, no anglicisms or familiar contractions. Tone: 18th-century Paris salon."),
  // ── German ────────────────────────────────────────────────────────────────
  "de-DE": makePrompt("German", "Elite German uses 'Sie'/'Ihnen', Konjunktiv II for polite requests, Hochdeutsch Duden standard, no anglicisms or abbreviations. Tone: Prussian administrative precision."),
  // ── Spanish regional variants ─────────────────────────────────────────────
  "es-ES": makePrompt("Castilian Spanish", "Elite Castilian uses 'usted', voseo avoided, subjunctive freely, Latinate vocabulary ('solicitar' not 'pedir'), no Latin American colloquialisms, no anglicisms. Tone: Spanish Royal Court."),
  "es-MX": makePrompt("Mexican Spanish", "Elite Mexican Spanish uses 'usted' mandatory in formal contexts, correct subjunctive, neutral Latin American vocabulary, no Spain-specific idioms and anglicisms. Tone: formal Mexican official register."),
  // ── Portuguese regional variants ──────────────────────────────────────────
  "pt-PT": makePrompt("European Portuguese", "Elite European Portuguese uses 'o senhor'/'a senhora', personal infinitive, future subjunctive correctly, no Brazilian neologisms or anglicisms. Tone: Eça de Queirós prose elegance."),
  "pt-BR": makePrompt("Brazilian Portuguese", "Elite Brazilian Portuguese uses 'você' in formal contexts, correct subjunctive, neutral Brazilian vocabulary, no Portugal-specific archaisms. Tone: formal Brazilian official prose."),
  // ── Italian ───────────────────────────────────────────────────────────────
  "it-IT": makePrompt("Italian", "Elite Italian uses 'Lei'/'Suo', congiuntivo, Tuscan literary vocabulary, no anglicisms. Tone: Leopardi and Manzoni."),
  // ── Hindi ─────────────────────────────────────────────────────────────────
  "hi-IN": makePrompt("Hindi", "Elite Hindi uses 'आप' form, Sanskrit-derived tatsama vocabulary, respectful imperative ('कृपया ... करें'), no anglicisms or film-Hindi slang."),
  // ── Base-language fallbacks (used when no region-specific variant matches) ─
  "nl": makePrompt("Dutch", "Elite Dutch uses 'u'/'uw', Latinate vocabulary, no anglicisms or diminutives, a measured dignified tone, and the aanvoegende wijs (subjunctive) where correct."),
  "fr": makePrompt("French", "Elite French uses 'vous'/'votre', subjunctive mood, Académie française elevated vocabulary, no anglicisms or familiar contractions. Tone: 18th-century Paris salon."),
  "de": makePrompt("German", "Elite German uses 'Sie'/'Ihnen', Konjunktiv II for polite requests, Hochdeutsch Duden standard, no anglicisms or abbreviations. Tone: Prussian administrative precision."),
  "es": makePrompt("Spanish", "Elite Spanish uses 'usted', subjunctive, Castilian RAE standard vocabulary ('solicitar' not 'pedir'), no anglicisms. Tone: Spanish Royal Court."),
  "pt": makePrompt("Portuguese", "Elite Portuguese uses 'o senhor'/'a senhora', personal infinitive, European PT standard, no Brazilian neologisms or anglicisms. Tone: Eça de Queirós prose style."),
  "it": makePrompt("Italian", "Elite Italian uses 'Lei'/'Suo', congiuntivo, Tuscan literary vocabulary, no anglicisms. Tone: Leopardi and Manzoni."),
  "hi": makePrompt("Hindi", "Elite Hindi uses 'आप' form, Sanskrit-derived tatsama vocabulary, respectful imperative ('कृपया ... करें'), no anglicisms or film-Hindi slang."),
  "en": makePrompt("English", "Elite English uses British aristocratic understatement, subjunctive mood, Latinate vocabulary, no contractions in formal text, no Americanisms or casual filler words. Tone: Victorian gentry correspondence."),
};

/** Resolve prompt: full locale first, then base language, then English fallback */
function resolvePrompt(locale: string): string {
  const normalised = locale.trim().toLowerCase().replace("_", "-");
  // Normalise: "en-gb" → "en-GB", "nl-be" → "nl-BE"
  const [lang, region] = normalised.split("-");
  const full = region ? `${lang}-${region.toUpperCase()}` : lang;
  return LOCALE_SYSTEM_PROMPTS[full] ?? LOCALE_SYSTEM_PROMPTS[lang] ?? LOCALE_SYSTEM_PROMPTS["en"];
}

const VALID_DOMAINS = ["gastronomy", "business", "eloquence", "formal_events", "dress_code", "cultural_knowledge"] as const;

const RequestSchema = z.object({
  text: z.string().min(1).max(2000),
  locale: z.string().min(2).max(10),
  domain: z.enum(VALID_DOMAINS).optional(),
});

router.post("/register-quality/check", requireAuthUser, async (req, res) => {
  const authReq = req as unknown as AuthenticatedRequest;
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

  const { text, locale, domain } = parsed.data;
  const systemPrompt = resolvePrompt(locale);

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

    const finalScore = result.score ?? 7;

    return res.json({
      pass:  result.pass  ?? true,
      score: finalScore,
      hint:  result.hint  ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Register quality check failed");
    return res.status(500).json({ message: "Quality check temporarily unavailable." });
  }
});

export default router;
