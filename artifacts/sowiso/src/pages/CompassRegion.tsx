import { useGetCultureCompassRegion, getGetCultureCompassRegionQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, CheckCircle2, Utensils, MessageSquare, Gift, Shirt } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CompassRegion() {
  const { code } = useParams<{ code: string }>();
  const regionCode = code || "";
  
  const { data: detail, isLoading } = useGetCultureCompassRegion(regionCode, { 
    query: { enabled: !!regionCode, queryKey: getGetCultureCompassRegionQueryKey(regionCode) } 
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-6 items-center">
          <Skeleton className="h-20 w-20 rounded-sm" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-20">
        <h2 className="font-serif text-2xl">Region Data Unavailable</h2>
        <Link href="/compass" className="text-primary hover:underline mt-4 inline-block">Return to Compass</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-16">
      <Link href="/compass" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Compass
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/60">
        <div className="flex items-center gap-6">
          <div className="text-6xl drop-shadow-sm">{detail.flag_emoji}</div>
          <div>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-2">{detail.region_name}</h1>
            <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">Region Code: {detail.region_code}</p>
          </div>
        </div>
      </div>

      {/* Core Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Core Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-xl leading-relaxed">{detail.core_value}</p>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono uppercase tracking-widest text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Absolute Taboo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-xl leading-relaxed">{detail.biggest_taboo}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Protocols */}
      <div className="space-y-6 pt-4">
        <h2 className="font-serif text-2xl border-b border-border pb-2">Essential Protocols</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <Utensils className="w-5 h-5 text-muted-foreground" /> Dining Etiquette
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.dining_etiquette}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" /> Language Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.language_notes}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <Gift className="w-5 h-5 text-muted-foreground" /> Gift Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.gift_protocol}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
              <CardTitle className="text-lg font-serif flex items-center gap-3">
                <Shirt className="w-5 h-5 text-muted-foreground" /> Dress Code
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-muted-foreground leading-relaxed">
              {detail.dress_code}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dos and Donts Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
        <div className="space-y-4">
          <h3 className="font-serif text-xl text-green-700 dark:text-green-500 flex items-center gap-2 border-b border-border pb-2">
            The Imperatives
          </h3>
          <ul className="space-y-3">
            {detail.dos.map((item, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground items-start">
                <span className="text-green-600 mt-1 flex-shrink-0">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="font-serif text-xl text-red-700 dark:text-red-500 flex items-center gap-2 border-b border-border pb-2">
            The Prohibitions
          </h3>
          <ul className="space-y-3">
            {detail.donts.map((item, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground items-start">
                <span className="text-red-600 mt-1 flex-shrink-0">✕</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
