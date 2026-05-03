import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface InvitationData {
  token: string;
  status: string;
  expires_at: string;
  inviter_name: string;
}

export default function InviteLanding() {
  usePageTitle("You have been invited");
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/invitations/${token}`)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok) setInvitation(data);
        else setError(data.message ?? "This invitation could not be found.");
      })
      .catch(() => setError("Unable to verify this invitation."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleRedeem() {
    if (!isAuthenticated) {
      sessionStorage.setItem("pending_invite_token", token ?? "");
      navigate("/register");
      return;
    }
    setRedeeming(true);
    try {
      const res = await fetch(`${API_BASE}/api/invitations/redeem`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemed(true);
      } else {
        setError(data.message ?? "Unable to accept this invitation.");
      }
    } catch {
      setError("Unable to accept this invitation.");
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl font-serif text-foreground">An Invitation Awaits</h1>
          <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">SOWISO Etiquette</p>
        </div>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        )}

        {!loading && redeemed && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="font-serif text-xl text-foreground">You are now companions.</p>
              <p className="text-sm text-muted-foreground">
                Your progress and refinement journey will now be shared with your companion.
                You may adjust your sharing preferences at any time from your profile.
              </p>
            </div>
            <Link href="/companion">
              <Button className="w-full font-mono uppercase tracking-widest text-xs">
                View Companion Dashboard
              </Button>
            </Link>
          </div>
        )}

        {!loading && !redeemed && error && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="w-12 h-12 text-amber-500" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="font-serif text-xl text-foreground">Invitation Unavailable</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="w-full font-mono uppercase tracking-widest text-xs">
                Return to SOWISO
              </Button>
            </Link>
          </div>
        )}

        {!loading && !redeemed && !error && invitation && (
          <div className="space-y-6">
            <div className="border border-border/50 rounded-sm p-6 text-left space-y-4 bg-muted/20">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">{invitation.inviter_name}</span>{" "}
                has invited you to join them as a companion on SOWISO — a platform for professional
                etiquette refinement and social mastery.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                As companions, you will be able to share your Noble Score, pillar progress, and
                roleplay scenario results — and leave reflections for one another in the spirit of
                mutual refinement.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  Expires{" "}
                  {new Date(invitation.expires_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRedeem}
                disabled={redeeming}
                className="w-full font-mono uppercase tracking-widest text-xs"
              >
                {redeeming ? "Accepting…" : isAuthenticated ? "Accept & Link" : "Register & Accept"}
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground">
                  Already a member?{" "}
                  <button
                    onClick={() => {
                      sessionStorage.setItem("pending_invite_token", token ?? "");
                      navigate("/signin");
                    }}
                    className="text-primary underline underline-offset-2"
                  >
                    Sign in first
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
