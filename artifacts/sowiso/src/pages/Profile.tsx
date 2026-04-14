import { useGetProfile, useGetNobleScore, useGetPillarProgress, useGetNobleScoreLog, getGetProfileQueryKey, getGetNobleScoreQueryKey, getGetPillarProgressQueryKey, getGetNobleScoreLogQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Calendar, Globe, Target, Clock } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { data: profile, isLoading: profileLoading } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const { data: nobleScore, isLoading: scoreLoading } = useGetNobleScore({ query: { queryKey: getGetNobleScoreQueryKey() } });
  const { data: pillars, isLoading: pillarsLoading } = useGetPillarProgress({ query: { queryKey: getGetPillarProgressQueryKey() } });
  const { data: logs, isLoading: logsLoading } = useGetNobleScoreLog({ limit: 10 }, { query: { queryKey: getGetNobleScoreLogQueryKey({ limit: 10 }) } });

  const isLoading = profileLoading || scoreLoading || pillarsLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-32 w-full rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-sm" />
          <Skeleton className="h-64 rounded-sm md:col-span-2" />
        </div>
        <Skeleton className="h-96 rounded-sm" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center p-8 bg-card border border-border shadow-sm rounded-sm">
        <div className="w-24 h-24 rounded-full bg-muted border-4 border-background flex items-center justify-center shadow-sm flex-shrink-0 text-3xl font-serif text-muted-foreground">
          {profile?.id.substring(0, 2).toUpperCase() || 'SO'}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-serif text-foreground">The Profile</h1>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono uppercase tracking-widest border border-primary/20">
              {profile?.subscription_tier}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="capitalize">{profile?.ambition_level} Ambition</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Active Region: <span className="uppercase">{profile?.active_region}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Member since {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Recently'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Score & Standing */}
        <div className="space-y-6">
          <Card className="bg-card border-border shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: nobleScore?.level_color || 'var(--primary)' }} />
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Noble Standing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <div className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">Current Title</div>
                <div className="text-3xl font-serif" style={{ color: nobleScore?.level_color || 'inherit' }}>
                  {nobleScore?.level_name}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-muted-foreground">Total Score</span>
                  <span className="text-2xl font-light">{nobleScore?.total_score}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000"
                    style={{ 
                      width: `${nobleScore?.next_level_threshold ? (nobleScore.total_score / nobleScore.next_level_threshold) * 100 : 100}%`,
                      backgroundColor: nobleScore?.level_color || 'var(--primary)'
                    }} 
                  />
                </div>
                {nobleScore?.next_level_threshold && (
                  <div className="text-xs text-right text-muted-foreground">
                    {nobleScore.next_level_threshold - nobleScore.total_score} points to next rank
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pillars Detail */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Domain Mastery</CardTitle>
            <CardDescription>Your titles across the five pillars of refinement.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pillars?.map((pillar) => (
                <div key={pillar.pillar} className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-40 flex-shrink-0">
                    <div className="text-sm font-medium">{pillar.pillar_domain}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Pillar {pillar.pillar}</div>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-serif italic text-foreground/80">{pillar.current_title}</span>
                      <span className="font-mono text-xs text-muted-foreground">{pillar.score} pt</span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/70 transition-all duration-1000"
                        style={{ width: `${pillar.progress_percent}%` }}
                      />
                    </div>
                    {pillar.next_title && (
                      <div className="text-[10px] text-right text-muted-foreground uppercase tracking-wider mt-1">
                        Next: {pillar.next_title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Recent History */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Recent Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="relative border-l border-border/50 ml-3 md:ml-4 space-y-8 pb-4">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6 md:pl-8">
                  <div className={`absolute w-3 h-3 rounded-full left-[-6px] top-1.5 ring-4 ring-background
                    ${log.score_delta > 0 ? 'bg-green-500' : log.score_delta < 0 ? 'bg-red-500' : 'bg-muted-foreground'}`} 
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-1">
                    <div className="text-sm font-medium text-foreground">{log.trigger}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${log.score_delta > 0 ? 'text-green-600' : log.score_delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {log.score_delta > 0 ? '+' : ''}{log.score_delta} pt
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-serif text-lg">Your ledger is currently empty.</p>
              <p className="text-sm mt-1">Visit The Atelier to begin your studies.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
