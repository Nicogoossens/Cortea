
export type RegisterChoice = "middle_class" | "elite" | "both";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface RegisterToggleProps {
  value: RegisterChoice;
  onChange: (r: RegisterChoice) => void;
  eliteEnabled?: boolean;
  disabled?: boolean;
}

const OPTIONS: { value: RegisterChoice; labelNL: string }[] = [
  { value: "middle_class", labelNL: "Dagelijkse wereld" },
  { value: "elite",        labelNL: "Formele wereld" },
  { value: "both",         labelNL: "Beide" },
];

function emitBiasSignal(choice: RegisterChoice) {
  fetch(`${API_BASE}/api/users/register-signal`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signal: choice }),
  }).catch(() => {});
}

export function RegisterToggle({
  value,
  onChange,
  eliteEnabled = true,
  disabled = false,
}: RegisterToggleProps) {
  function handleSelect(opt: RegisterChoice) {
    if (disabled || opt === value) return;
    emitBiasSignal(opt);
    onChange(opt);
  }

  return (
    <div
      className="flex items-center gap-1 p-0.5 border border-border/40 rounded-sm w-fit"
      role="tablist"
      aria-label="Register"
    >
      {OPTIONS.map(({ value: opt, labelNL }) => {
        // All three buttons are always shown to every user (spec §10.1).
        // Non-ambassador users who select Elite/Both will receive a 403 from
        // the session API, which is silently handled in AtelierLearningTrack
        // by reverting to middle_class — no upgrade prompt, no lock icon.
        const isActive = value === opt;

        return (
          <button
            key={opt}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => handleSelect(opt)}
            className={`px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-[2px] transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {labelNL}
          </button>
        );
      })}
    </div>
  );
}
