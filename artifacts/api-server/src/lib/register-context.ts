/**
 * TypeScript re-export of the canonical register descriptions defined in
 * `scripts/lib/register-prompts.mjs` (which itself mirrors the elite +
 * middle-class registers from `lib/db/src/schema/social-class-config.ts`).
 *
 * Imported so the api-server's TS sweepers and any future TS calibration
 * code can build prompts from the same wording as the .mjs CLI workers
 * — one source of truth.
 */

import {
  REGISTER_DESCRIPTIONS as RAW_DESCRIPTIONS,
  ELITE_REGISTER_PROMPT as RAW_ELITE,
  MIDDLE_CLASS_REGISTER_PROMPT as RAW_MIDDLE,
  buildRegisterHeader as rawBuildHeader,
  isValidRegister as rawIsValidRegister,
} from "../../../../scripts/lib/register-prompts.mjs";

export type RegisterKey = "elite" | "middle_class";

export const ELITE_REGISTER_PROMPT: string = RAW_ELITE;
export const MIDDLE_CLASS_REGISTER_PROMPT: string = RAW_MIDDLE;
export const REGISTER_DESCRIPTIONS: Record<RegisterKey, string> =
  RAW_DESCRIPTIONS as Record<RegisterKey, string>;

export function buildRegisterHeader(active: RegisterKey): string {
  return rawBuildHeader(active);
}

export function isValidRegister(value: unknown): value is RegisterKey {
  return rawIsValidRegister(value);
}

/**
 * Map a translations.formality_register value onto the social-class register.
 * - "high"   → elite
 * - "low"    → middle_class
 * - default  → elite
 */
export function formalityToRegister(formality: string | null | undefined): RegisterKey {
  if (formality === "low") return "middle_class";
  return "elite";
}

/**
 * Map a social-class register onto the calibrated_module column value.
 * The calibrated_module column accepts only "standard" | "elite".
 */
export function registerToCalibratedModule(
  register: RegisterKey,
): "standard" | "elite" {
  return register === "middle_class" ? "standard" : "elite";
}
