import { Shell } from "./components/layout/Shell";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/i18n";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Atelier from "@/pages/Atelier";
import Scenario from "@/pages/Scenario";
import Counsel from "@/pages/Counsel";
import Compass from "@/pages/Compass";
import CompassRegion from "@/pages/CompassRegion";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/atelier" component={Atelier} />
        <Route path="/atelier/:id" component={Scenario} />
        <Route path="/counsel" component={Counsel} />
        <Route path="/compass" component={Compass} />
        <Route path="/compass/:code" component={CompassRegion} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
