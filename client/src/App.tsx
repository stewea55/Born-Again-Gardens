import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import Plants from "@/pages/plants";
import CalendarPage from "@/pages/calendar";
import About from "@/pages/about";
import Donate from "@/pages/donate";
import Dashboard from "@/pages/dashboard";
import Cart from "@/pages/cart";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/plants" component={Plants} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/about" component={About} />
      <Route path="/donate" component={Donate} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/cart" component={Cart} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bag-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
