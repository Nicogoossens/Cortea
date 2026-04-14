import { Link } from "wouter";
import { useGetProfile, useGetNobleScore, useGetPillarProgress, useCreateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Compass, Shield, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Home() {
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useGetProfile();
  const { data: nobleScore, isLoading: isScoreLoading } = useGetNobleScore();
  const { data: pillars, isLoading: isPillarsLoading } = useGetPillarProgress();
  
  const createProfile = useCreateProfile();

  useEffect(() => {
    if (profileError && (profileError as any)?.status === 404) {
      createProfile.mutate({
        data: {
          id: "default-user",
          language_code: "en",
          ambition_level: "professional"
        }
      });
    }
  }, [profileError, createProfile]);

  const isLoading = isProfileLoading || isScoreLoading || isPillarsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md md:col-span-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-md" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground">
          Welcome back.
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl font-light">
          Your pursuit of refinement continues. Review your progress or select a discipline to study today.
        </p>
      </div>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Noble Score Card */}
        <Card className="bg-card border-border shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: nobleScore?.level_color || 'var(--primary)' }} />
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-widest text-xs font-semibold">Current Standing</CardDescription>
            <CardTitle className="font-serif text-3xl">{nobleScore?.level_name || "The Initiate"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-light tracking-tighter">{nobleScore?.total_score || 0}</span>
              <span className="text-muted-foreground mb-1">/ 100</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress to {nobleScore?.next_level_threshold ? 'next level' : 'mastery'}</span>
                <span>{nobleScore?.next_level_threshold ? `${nobleScore.total_score} / ${nobleScore.next_level_threshold}` : 'Max'}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${nobleScore?.next_level_threshold ? (nobleScore.total_score / nobleScore.next_level_threshold) * 100 : 100}%`,
                    backgroundColor: nobleScore?.level_color || 'var(--primary)'
                  }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pillars Overview */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-xl">The Five Pillars</CardTitle>
            <CardDescription>Your mastery across fundamental domains of etiquette.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {pillars?.map((pillar) => (
                <div key={pillar.pillar} className="space-y-2">
                  <div className="text-sm font-medium leading-tight">{pillar.pillar_domain}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{pillar.current_title}</div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000"
                      style={{ width: `${pillar.progress_percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules */}
      <div className="space-y-6">
        <h2 className="font-serif text-2xl border-b border-border pb-2">Your Studies</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link href="/atelier" className="group">
            <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-sm bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">The Atelier</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Refine your judgement through carefully curated scenarios and situations.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/counsel" className="group">
            <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-sm bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">The Counsel</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Seek immediate, discreet guidance for pressing social dilemmas.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/compass" className="group">
            <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md hover:border-primary/30 cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-sm bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Compass className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">Cultural Compass</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Master the essential protocols and profound taboos of global regions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
}
