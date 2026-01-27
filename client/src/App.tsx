import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/contexts/cart-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { MasqueradeBanner } from "@/components/masquerade-banner";
import Home from "@/pages/home";
import Plants from "@/pages/plants";
import CalendarPage from "@/pages/calendar";
import About from "@/pages/about";
import Sponsor from "@/pages/sponsor";
import Donate from "@/pages/donate";
import Volunteer from "@/pages/volunteer";
import Dashboard from "@/pages/dashboard";
import Basket from "@/pages/basket";
import Payment from "@/pages/payment";
import Donations from "@/pages/donations";
import AdminDashboard from "@/pages/admin/index";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/plants" component={Plants} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/about" component={About} />
      <Route path="/sponsor" component={Sponsor} />
      <Route path="/donate" component={Donate} />
      <Route path="/volunteer" component={Volunteer} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/donations" component={Donations} />
      <Route path="/basket" component={Basket} />
      <Route path="/payment" component={Payment} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="bag-ui-theme">
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <TooltipProvider>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col">
              <MasqueradeBanner />
              <Navigation />
              <main className="flex-1">
                <Router />
              </main>
              <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
