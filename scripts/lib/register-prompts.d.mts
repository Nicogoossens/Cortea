export const REGISTER_KEYS: readonly ["elite", "middle_class"];
export const ELITE_REGISTER_PROMPT: string;
export const MIDDLE_CLASS_REGISTER_PROMPT: string;
export const REGISTER_DESCRIPTIONS: {
  elite: string;
  middle_class: string;
};
export function buildRegisterHeader(
  activeRegister: "elite" | "middle_class" | string,
): string;
export function isValidRegister(value: unknown): value is "elite" | "middle_class";
