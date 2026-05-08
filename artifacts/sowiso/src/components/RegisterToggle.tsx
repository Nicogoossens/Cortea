import { Link } from "wouter";
import { Lock } from "lucide-react";

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
        const isEliteLocked = opt === "elite" && !eliteEnabled;
        const isActive = value === opt;

        if (isEliteLocked) {
          return (
            <Link
              key={opt}
              href="/membership"
              role="tab"
              aria-selected={false}
              aria-disabled={true}
              title="Beschikbaar voor Ambassador-leden"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-[2px] border border-amber-500/40 bg-amber-500/[0.04] text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              <Lock className="w-2.5 h-2.5" aria-hidden="true" />
              {labelNL}
            </Link>
          );
        }

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
