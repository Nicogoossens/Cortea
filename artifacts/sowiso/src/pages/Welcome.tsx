import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Compass, Shield, ArrowRight, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

type Phase = "hero" | "quiz" | "result";

interface Question {
  id: number;
  scenario: string;
  options: { label: string; text: string }[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    scenario:
      "You have been invited to dinner at a private residence. The invitation states seven o'clock. At what time should you arrive?",
    options: [
      { label: "A", text: "Six forty-five — to assist with final preparations." },
      { label: "B", text: "Seven o'clock precisely — punctuality is a virtue." },
      { label: "C", text: "Between seven ten and seven fifteen — the customary quarter." },
    ],
    correctIndex: 2,
    explanation:
      "Arriving slightly after the stated hour — the so-called 'gentleman's quarter' — allows the host to conclude their preparations with composure. Arriving early is considered an imposition.",
  },
  {
    id: 2,
    scenario:
      "You are seated at a formally laid table. Bread rolls are placed on either side of your setting. Which is yours?",
    options: [
      { label: "A", text: "The one to my left." },
      { label: "B", text: "The one to my right." },
      { label: "C", text: "Whichever appears freshest." },
    ],
    correctIndex: 0,
    explanation:
      "The mnemonic BMW guides the formal table: Bread to the left, Meal in the centre, Water and Wine to the right. The bread roll to your left is always yours.",
  },
  {
    id: 3,
    scenario:
      "During a business dinner in Tokyo, your host presents their meishi — business card — with both hands and a respectful bow. How do you respond?",
    options: [
      { label: "A", text: "Accept with one hand and a warm smile, then set it aside." },
      { label: "B", text: "Accept with both hands, study it attentively, and place it respectfully on the table." },
      { label: "C", text: "Accept graciously and immediately reciprocate with your own card." },
    ],
    correctIndex: 1,
    explanation:
      "In Japanese business culture, the meishi is an extension of the person. It must be received with both hands, examined with genuine attention, and placed carefully on the table — never written upon or pocketed immediately.",
  },
];

export default function Welcome() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("hero");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [revealed, setRevealed] = useState(false);

  const question = QUESTIONS[currentQ];
  const score = answers.filter((a, i) => a === QUESTIONS[i].correctIndex).length;

  function selectAnswer(idx: number) {
    if (revealed) return;
    const next = [...answers];
    next[currentQ] = idx;
    setAnswers(next);
    setRevealed(true);
  }

  function advance() {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
      setRevealed(false);
    } else {
      setPhase("result");
    }
  }

  function getScoreLabel() {
    if (score === 3) return "Flawless";
    if (score === 2) return "Accomplished";
    if (score === 1) return "Promising";
    return "Nascent";
  }

  function getScoreMessage() {
    if (score === 3) return "You answered all three correctly. Your instincts are already well-formed. SOWISO will refine what is already exceptional.";
    if (score === 2) return "Two of three — a commendable result. SOWISO will attend to the finer distinctions that separate the accomplished from the distinguished.";
    if (score === 1) return "One of three. There is rich ground ahead. SOWISO will guide you through the invisible codes that govern the highest circles.";
    return "The conventions of refinement are not born but cultivated. SOWISO exists for precisely this journey.";
  }

  if (phase === "hero") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-16 animate-in fade-in duration-700 py-12">
        <div className="space-y-6 max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-[0.4em] text-muted-foreground">
            The Art of Conduct
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-tight">
            How refined<br />
            <span className="text-primary">are you?</span>
          </h1>
          <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-xl mx-auto">
            Three scenarios. Three moments of truth. Discover where you stand
            before the world's most exacting standards of conduct.
          </p>
        </div>

        <Button
          size="lg"
          className="font-serif text-lg px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-3 rounded-sm"
          onClick={() => setPhase("quiz")}
        >
          Begin the Assessment
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl w-full pt-8 border-t border-border">
          {[
            { icon: BookOpen, label: "The Atelier", desc: "Scenario-based etiquette training" },
            { icon: Shield,   label: "The Counsel", desc: "Discreet AI guidance in 30 seconds" },
            { icon: Compass,  label: "The Compass", desc: "Cultural guides for 14 world regions" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center space-y-2">
              <Icon className="w-6 h-6 mx-auto text-primary/60" aria-hidden="true" />
              <div className="font-serif text-sm text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground font-light">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const selected = answers[currentQ];
    const isCorrect = selected === question.correctIndex;

    return (
      <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500 py-8">
        <div className="flex items-center gap-3">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i < currentQ
                  ? "bg-primary"
                  : i === currentQ
                  ? "bg-primary/50"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Scenario {question.id} of {QUESTIONS.length}
          </p>
          <p className="text-xl md:text-2xl font-serif text-foreground leading-relaxed">
            {question.scenario}
          </p>
        </div>

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            let variant: "correct" | "incorrect" | "neutral" | "dimmed" = "neutral";
            if (revealed) {
              if (idx === question.correctIndex) variant = "correct";
              else if (idx === selected) variant = "incorrect";
              else variant = "dimmed";
            }

            return (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                disabled={revealed}
                className={`w-full text-left px-6 py-4 rounded-sm border transition-all duration-300 flex items-start gap-4 ${
                  variant === "correct"
                    ? "border-green-400 bg-green-50/60 text-green-900"
                    : variant === "incorrect"
                    ? "border-red-400 bg-red-50/60 text-red-900"
                    : variant === "dimmed"
                    ? "border-border/40 bg-muted/20 text-muted-foreground opacity-50"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                }`}
              >
                <span className={`font-mono text-xs mt-0.5 font-bold ${
                  variant === "correct" ? "text-green-600" :
                  variant === "incorrect" ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {opt.label}
                </span>
                <span className="font-light leading-relaxed">{opt.text}</span>
                {revealed && idx === question.correctIndex && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto shrink-0 mt-0.5" aria-hidden="true" />
                )}
                {revealed && idx === selected && idx !== question.correctIndex && (
                  <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0 mt-0.5" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-4">
            <div className={`px-5 py-4 rounded-sm border text-sm font-light leading-relaxed ${
              isCorrect
                ? "border-green-300/60 bg-green-50/40 text-green-800"
                : "border-amber-300/60 bg-amber-50/40 text-amber-800"
            }`}>
              <span className="font-semibold font-mono text-xs uppercase tracking-wider mr-2">
                {isCorrect ? "Correct." : "Not quite."}
              </span>
              {question.explanation}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={advance}
                className="font-serif bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-sm"
              >
                {currentQ < QUESTIONS.length - 1 ? "Next Scenario" : "See My Result"}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700 py-8 text-center">
      <div className="space-y-6">
        <p className="text-xs font-mono uppercase tracking-[0.4em] text-muted-foreground">
          Your Assessment
        </p>
        <div className="text-8xl font-serif text-primary">{score}<span className="text-4xl text-muted-foreground">/3</span></div>
        <h2 className="text-3xl font-serif text-foreground">{getScoreLabel()}</h2>
        <p className="text-muted-foreground font-light leading-relaxed max-w-lg mx-auto">
          {getScoreMessage()}
        </p>
      </div>

      <div className="border border-border rounded-sm p-8 space-y-6 text-left bg-card">
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-foreground">Join SOWISO</h3>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Continue your study of refinement. Track your Noble Score, train across five pillars of etiquette, and consult the Counsel on any situation — from dining in Paris to negotiating in Tokyo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: "The Atelier", desc: "Scenario training" },
            { label: "The Counsel", desc: "Instant AI guidance" },
            { label: "The Compass", desc: "14 world regions" },
          ].map(({ label, desc }) => (
            <div key={label} className="space-y-1">
              <div className="font-serif text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground font-mono">{desc}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            size="lg"
            className="flex-1 font-serif bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-sm"
            onClick={() => navigate("/register")}
          >
            Create Your Account
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="font-serif rounded-sm"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </Button>
        </div>
      </div>

      <button
        onClick={() => { setPhase("quiz"); setCurrentQ(0); setAnswers([null, null, null]); setRevealed(false); }}
        className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-4 font-mono"
      >
        Repeat the assessment
      </button>
    </div>
  );
}
