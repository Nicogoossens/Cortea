import { Router } from "express";
import { z } from "zod";
import { requireAuthUser, getResolvedUserId } from "../lib/auth-middleware";
import type { AuthenticatedRequest } from "../lib/auth-middleware";
import { db } from "@workspace/db";
import { counselQualityLogTable, userUseCaseRatingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { resolvePrompt } from "../lib/register-quality-prompts";

const router = Router();

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
    return res.status(400).json({ error: "text and locale are required." });
  }

  const anthropicBase = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const anthropicKey  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!anthropicBase || !anthropicKey) {
    req.log.warn("Anthropic env vars not configured — quality check unavailable");
    return res.status(503).json({ error: "Quality check is not currently available." });
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
      return res.status(500).json({ error: "Quality check temporarily unavailable." });
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
    const userId = getResolvedUserId(req);

    // Log the quality score so it feeds into the counsel component of
    // use-case readiness scores on the next /use-cases request.
    try {
      await db.insert(counselQualityLogTable).values({
        user_id: userId,
        domain: domain ?? "general",
        score: finalScore,
      });
    } catch (logErr) {
      req.log.warn({ logErr }, "Could not persist counsel quality log");
    }

    // Invalidate use-case readiness cache independently so a transient log
    // failure does not prevent stale scores from being evicted.
    try {
      await db.delete(userUseCaseRatingsTable).where(
        eq(userUseCaseRatingsTable.user_id, userId)
      );
    } catch (cacheErr) {
      req.log.warn({ cacheErr }, "Could not invalidate use-case readiness cache after counsel check");
    }

    return res.json({
      pass:  result.pass  ?? true,
      score: finalScore,
      hint:  result.hint  ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Register quality check failed");
    return res.status(500).json({ error: "Quality check temporarily unavailable." });
  }
});

export default router;
