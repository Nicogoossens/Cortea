import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const POLL_INTERVAL_MS = 60_000;
const WARN_THRESHOLD_SECONDS = 5 * 60;

interface SessionResponse {
  ttl_seconds: number;
  expires_at: string | null;
  is_admin: boolean;
}

export function SessionExpiryWatcher() {
  const { isAdmin, isAuthenticated, login } = useAuth();
  const [, navigate] = useLocation();
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toastShownRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function checkSession() {
    if (!isAuthenticated || !isAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/session`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json() as SessionResponse;

      if (data.ttl_seconds <= WARN_THRESHOLD_SECONDS && !toastShownRef.current) {
        toastShownRef.current = true;
        const minutes = Math.ceil(data.ttl_seconds / 60);
        toast({
          title: "Your session is about to expire",
          description: `Your admin session expires in ${minutes} minute${minutes !== 1 ? "s" : ""}. Sign in again to avoid losing unsaved work.`,
          duration: Infinity,
          action: (
            <ToastAction altText="Sign in" onClick={() => setReAuthOpen(true)}>
              Sign in
            </ToastAction>
          ),
        });
      } else if (data.ttl_seconds > WARN_THRESHOLD_SECONDS) {
        toastShownRef.current = false;
      }
    } catch {
      // Network errors are silent — the admin will still get a 403 as a fallback.
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    checkSession();
    intervalRef.current = setInterval(checkSession, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, isAdmin]);

  async function handleReAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/signin-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = await res.json() as {
        message?: string;
        error?: string;
        user_id?: string;
        full_name?: string | null;
        is_admin?: boolean;
      };

      if (!res.ok) {
        setError(body.error ?? "Sign-in failed. Please try again.");
        setLoading(false);
        return;
      }

      if (body.user_id) {
        login(body.user_id, { name: body.full_name ?? undefined, isAdmin: body.is_admin });
      }

      toastShownRef.current = false;
      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        setReAuthOpen(false);
        setSuccess(false);
        setEmail("");
        setPassword("");
        setError(null);
      }, 1500);
    } catch {
      setError("A network error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <Dialog open={reAuthOpen} onOpenChange={setReAuthOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Re-authenticate
          </DialogTitle>
          <DialogDescription className="text-xs font-light">
            Your session is expiring. Sign in again to continue without leaving the page.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center">
            <p className="text-sm font-mono text-green-600">Session renewed successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleReAuth} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="reauth-email" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <Input
                id="reauth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="font-mono text-sm h-9"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="reauth-password" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  id="reauth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-mono text-sm h-9 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-3.5 h-3.5" />
                    : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs text-destructive font-mono">{error}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                className="font-mono text-xs flex-1"
                disabled={loading || !email.trim() || !password}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sign in"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="font-mono text-xs"
                disabled={loading}
                onClick={() => {
                  setReAuthOpen(false);
                  navigate("/signin");
                }}
              >
                Full sign-in page
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
