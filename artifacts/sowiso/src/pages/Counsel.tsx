import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Send, Loader2 } from "lucide-react";

const CATEGORIES = [
  "Dining", "Introductions", "Dress Code", "Gifting", "Digital Protocol", "Hosting", "Apologies"
];

export default function Counsel() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!query.trim() && !selectedCategory) return;
    
    setIsSubmitting(true);
    
    // Simulate API delay for the prototype
    setTimeout(() => {
      setResponse(`In matters of ${selectedCategory?.toLowerCase() || 'such delicacy'}, one must err on the side of understated grace. The situation you describe requires tact rather than force. I recommend observing a moment of deliberate pause before responding, ensuring your demeanor remains unflappable. When you do proceed, let your actions be guided by consideration for the comfort of others rather than the assertion of your own rightness. A formal apology is unnecessary; a slight inclination of the head and a pivot in conversation will serve you far better.`);
      setIsSubmitting(false);
    }, 2000);
  };

  const handleReset = () => {
    setQuery("");
    setSelectedCategory(null);
    setResponse(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 mx-auto bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">The Counsel</h1>
        <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-2xl mx-auto">
          Immediate, discreet guidance for pressing social dilemmas. Describe your situation, and receive considered counsel.
        </p>
      </div>

      {!response ? (
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-6 md:p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground tracking-wide">Select Domain</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <Badge 
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className={`cursor-pointer px-4 py-1.5 rounded-sm transition-all text-sm font-normal ${
                      selectedCategory === cat 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-foreground tracking-wide">Describe the Situation</label>
              <Textarea 
                placeholder="E.g., I have arrived at a black tie event, but my host is dressed casually..."
                className="min-h-[150px] resize-none bg-background border-border/60 focus:border-primary/50 text-base p-4 rounded-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-border/30">
              <Button 
                size="lg" 
                className="font-serif px-8 bg-primary hover:bg-primary/90 text-primary-foreground w-full md:w-auto"
                onClick={handleSubmit}
                disabled={(!query.trim() && !selectedCategory) || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Consulting...
                  </>
                ) : (
                  <>
                    Seek Guidance
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <Card className="border-primary/20 bg-card shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-2 pt-8 px-8">
              <CardDescription className="uppercase tracking-widest text-xs font-semibold text-primary">Mentor's Counsel</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-4">
              <p className="text-xl leading-relaxed font-serif text-foreground">
                {response}
              </p>
            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleReset} className="font-serif">
              Seek Further Counsel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
