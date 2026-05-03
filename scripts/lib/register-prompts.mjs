/**
 * SOWISO Register Prompts — single source of truth.
 *
 * Derived from `lib/db/src/schema/social-class-config.ts`. Both supported
 * social-class registers (elite + middle_class) are described here so that
 * every translation/calibration prompt across the codebase shares one
 * canonical wording.
 *
 * Imported by:
 *   - scripts/translate-ui.mjs
 *   - scripts/elite-register-worker.mjs
 *   - artifacts/sowiso/scripts/translate.mjs
 *   - artifacts/api-server/src/lib/register-context.ts (TS re-export)
 */

export const REGISTER_KEYS = ["elite", "middle_class"];

export const ELITE_REGISTER_PROMPT = `ELITE register — formal, refined, prestige-class voice.
Formal address forms only ('u'/'vous'/'Sie'/'usted'/'Lei'/'o senhor'/'aap'),
Latinate vocabulary, subjunctive/conjunctive moods where the grammar supports it,
no contractions in formal sentences, no slang, no anglicisms with native equivalents.
Tone: dignified, measured, drawing on each language's classical literary tradition.`;

export const MIDDLE_CLASS_REGISTER_PROMPT = `MIDDLE CLASS register — warm, plain, direct everyday voice.
Natural address forms ('jij'/'u', 'tu'/'vous', 'du'/'Sie', 'tú'/'usted', 'tu'/'Lei',
'você', 'tum'/'aap'), concrete familiar vocabulary, contractions where natural,
short clear sentences. Tone: friendly, encouraging, like a helpful colleague.`;

export const REGISTER_DESCRIPTIONS = {
  elite: ELITE_REGISTER_PROMPT,
  middle_class: MIDDLE_CLASS_REGISTER_PROMPT,
};

/**
 * Build a system-prompt header that describes BOTH registers and names the
 * active variant. Use as the leading section of any AI prompt that needs
 * register-aware tone.
 */
export function buildRegisterHeader(activeRegister) {
  const active = REGISTER_KEYS.includes(activeRegister) ? activeRegister : "elite";
  return [
    `SOWISO supports two social-class registers (lib/db/src/schema/social-class-config.ts):`,
    ``,
    ELITE_REGISTER_PROMPT,
    ``,
    MIDDLE_CLASS_REGISTER_PROMPT,
    ``,
    `Active register for this batch: ${active.toUpperCase()}.`,
  ].join("\n");
}

export function isValidRegister(value) {
  return REGISTER_KEYS.includes(value);
}
