import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Users, MessageSquare, Send,
} from "lucide-react";
import { IncompleteProfileBanner } from "@/components/IncompleteProfileBanner";
import { Link } from "wouter";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface RoleplayQuestion {
  question: string;
  options: { text: string; correct: boolean; explanation: string }[];
}

interface RoleplayRole {
  name: string;
  description: string;
  questions: RoleplayQuestion[];
}

interface RoleplayScenario {
  id: number;
  title: string;
  context: string;
  situation: string;
  pillar: number;
  difficulty_level: number;
  estimated_minutes: number;
  role_a: RoleplayRole;
  role_b: RoleplayRole;
}

interface CompanionInfo {
  linked: boolean;
  companion?: { id: string; name: string };
}

type Phase = "role_select" | "playing" | "completed" | "reflection";

export default function RoleplayScenario() {
  usePageTitle("Roleplay Scenario");
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [scenario, setScenario] = useState<RoleplayScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [companion, setCompanion] = useState<CompanionInfo | null>(null);

  const [phase, setPhase] = useState<Phase>("role_select");
  const [selectedRole, setSelectedRole] = useState<"A" | "B" | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ question_index: number; selected_option_index: number; correct: boolean }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const [reflectionText, setReflectionText] = useState("");
  const [submittingReflection, setSubmittingReflection] = useState(false);
  const [reflectionSent, setReflectionSent] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_BASE}/api/roleplay/scenarios/${id}`).then((r) => r.ok ? r.json() : null),
      isAuthenticated
        ? fetch(`${API_BASE}/api/companion`, { credentials: "include" }).then((r) => r.ok ? r.json() : null)
        : Promise.resolve(null),
    ]).then(([s, c]) => {
      setScenario(s);
      setCompanion(c);
    }).finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  const activeRole = selectedRole === "A" ? scenario?.role_a : scenario?.role_b;
  const questions = activeRole?.questions ?? [];
  const currentQ = questions[currentQuestion];
  const totalQuestions = questions.length;

  function handleOptionSelect(idx: number) {
    if (showFeedback) return;
    setSelectedOption(idx);
  }

  function handleConfirmAnswer() {
    if (selectedOption === null || !currentQ) return;
    const correct = currentQ.options[selectedOption]?.correct ?? false;
    setAnswers((prev) => [...prev, { question_index: currentQuestion, selected_option_index: selectedOption, correct }]);
    setShowFeedback(true);
  }

  function handleNext() {
    if (currentQuestion + 1 < totalQuestions) {
      setCurrentQuestion((q) => q + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      handleComplete();
    }
  }

  async function handleComplete() {
    const finalAnswers = answers;
    const score = Math.round((finalAnswers.filter((a) => a.correct).length / totalQuestions) * 100);

    if (isAuthenticated) {
      setSaving(true);
      try {
        await fetch(`${API_BASE}/api/roleplay/complete`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenario_id: parseInt(id!, 10), role: selectedRole, answers: finalAnswers, score }),
        });
      } catch { /* non-fatal */ }
      setSaving(false);
    }
    setPhase("completed");
  }

  async function handleSendReflection() {
    if (!companion?.companion || !reflectionText.trim()) return;
    setSubmittingReflection(true);
    try {
      const res = await fetch(`${API_BASE}/api/roleplay/reflections`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_id: parseInt(id!, 10),
          target_user_id: companion.companion.id,
          content: reflectionText.trim(),
        }),
      });
      if (res.ok) {
        setReflectionSent(true);
        setReflectionText("");
      }
    } finally {
      setSubmittingReflection(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-sm" />
        <Skeleton className="h-32 rounded-sm" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="font-serif text-xl text-muted-foreground">This roleplay scenario could not be found.</p>
        <Link href="/atelier"><Button variant="outline">Return to Atelier</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <IncompleteProfileBanner />

      <div className="flex items-center gap-3">
        <Link href="/atelier">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-widest">
            <ChevronLeft className="w-3.5 h-3.5" /> Atelier
          </button>
        </Link>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono text-xs rounded-sm">Roleplay</Badge>
          <Badge variant="outline" className="font-mono text-xs rounded-sm">Pillar {scenario.pillar}</Badge>
          <span className="text-xs font-mono text-muted-foreground">~{scenario.estimated_minutes} min</span>
        </div>
        <h1 className="text-3xl font-serif text-foreground">{scenario.title}</h1>
        <p className="text-sm text-muted-foreground italic">{scenario.context}</p>
      </div>

      <div className="border border-border/40 rounded-sm p-5 bg-muted/10">
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">Situation</p>
        <p className="text-foreground leading-relaxed">{scenario.situation}</p>
      </div>

      {phase === "role_select" && (
        <div className="space-y-4">
          <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Choose your role</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "A" as const, role: scenario.role_a },
              { key: "B" as const, role: scenario.role_b },
            ].map(({ key, role }) => (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                className={`text-left border rounded-sm p-5 transition-all duration-200 space-y-2 ${
                  selectedRole === key
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/40 bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Role {key}</span>
                  {selectedRole === key && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="font-serif text-lg text-foreground">{role.name}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
                <p className="text-xs text-muted-foreground font-mono">{role.questions.length} questions</p>
              </button>
            ))}
          </div>
          {selectedRole && (
            <Button
              onClick={() => setPhase("playing")}
              className="w-full font-mono uppercase tracking-widest text-xs"
            >
              Begin as {selectedRole === "A" ? scenario.role_a.name : scenario.role_b.name}
            </Button>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {companion?.linked
                ? `Your companion ${companion.companion?.name ?? ""} may take the other role independently.`
                : "You may complete this scenario independently. Connect with a companion to share results."}
            </span>
          </div>
        </div>
      )}

      {phase === "playing" && currentQ && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Role {selectedRole} — {activeRole?.name}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {currentQuestion + 1} / {totalQuestions}
            </span>
          </div>

          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-6">
              <p className="font-serif text-lg text-foreground leading-relaxed">{currentQ.question}</p>
              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={showFeedback}
                    className={`w-full text-left border rounded-sm p-4 text-sm transition-all duration-150 leading-relaxed ${
                      showFeedback && opt.correct
                        ? "border-green-500 bg-green-50/50 dark:bg-green-900/20 text-foreground"
                        : showFeedback && selectedOption === idx && !opt.correct
                          ? "border-destructive bg-destructive/5 text-foreground"
                          : selectedOption === idx
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>

              {showFeedback && (
                <div className={`px-4 py-3 rounded-sm text-sm ${
                  currentQ.options[selectedOption!]?.correct
                    ? "bg-green-50/50 dark:bg-green-900/20 border border-green-500/30 text-foreground"
                    : "bg-muted border border-border/40 text-foreground/80"
                }`}>
                  {currentQ.options[selectedOption!]?.explanation}
                </div>
              )}

              {!showFeedback ? (
                <Button
                  onClick={handleConfirmAnswer}
                  disabled={selectedOption === null}
                  className="w-full font-mono uppercase tracking-widest text-xs"
                >
                  Confirm
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="w-full font-mono uppercase tracking-widest text-xs gap-2"
                >
                  {currentQuestion + 1 < totalQuestions ? "Next" : "Complete"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {phase === "completed" && (
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
                <CardTitle className="font-serif text-2xl">Scenario Complete</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Your role</span>
                <span className="font-medium">Role {selectedRole} — {activeRole?.name}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Questions answered</span>
                <span className="font-medium">{answers.filter((a) => a.correct).length} / {totalQuestions} correct</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="font-serif text-xl text-primary">
                  {Math.round((answers.filter((a) => a.correct).length / totalQuestions) * 100)} pts
                </span>
              </div>
            </CardContent>
          </Card>

          {companion?.linked && companion.companion && (
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <CardTitle className="font-serif text-lg">Leave a Reflection</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share a brief note for {companion.companion.name} — not a judgement, but an addition.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {reflectionSent ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Reflection sent to {companion.companion.name}.
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={reflectionText}
                      onChange={(e) => setReflectionText(e.target.value)}
                      placeholder={`What would you have done differently in this situation? A brief note for ${companion.companion.name}…`}
                      className="resize-none text-sm font-light leading-relaxed"
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{reflectionText.length}/1000</span>
                      <Button
                        size="sm"
                        onClick={handleSendReflection}
                        disabled={submittingReflection || !reflectionText.trim()}
                        className="font-mono uppercase tracking-widest text-xs gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Reflection
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 flex-wrap">
            <Link href="/companion">
              <Button variant="outline" className="font-mono uppercase tracking-widest text-xs">
                View Companion Dashboard
              </Button>
            </Link>
            <Link href="/atelier">
              <Button variant="ghost" className="font-mono uppercase tracking-widest text-xs">
                Return to Atelier
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
