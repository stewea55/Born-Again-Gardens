import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/stats-card";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Calendar,
  FileText,
  Settings,
  ArrowRight,
  Check,
  Clock,
  Leaf,
  Download,
  Bell,
  Mail,
} from "lucide-react";
import type { Plant, Donation, UserPreferences } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to access your dashboard",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isLoading, isAuthenticated, toast]);

  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
    enabled: isAuthenticated,
  });

  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
    enabled: isAuthenticated,
  });

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/user/preferences"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl px-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const readyPlants = plants.filter((p) => p.status === "ready");
  const comingSoonPlants = plants.filter((p) => p.status === "coming_soon");
  const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  const currentYear = new Date().getFullYear();
  const yearDonations = donations.filter((d) => d.taxYear === currentYear);
  const yearTotal = yearDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  return (
    <div className="min-h-screen">
      <section className="bg-muted/30 py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Welcome back, {user?.firstName || "Friend"}!
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening at Born Again Gardens
              </p>
            </div>
            <Link href="/plants">
              <Button data-testid="button-browse-plants">
                <Leaf className="h-4 w-4 mr-2" />
                Browse Plants
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Donated"
            value={`$${totalDonated.toFixed(2)}`}
            description="Lifetime contributions"
            icon={Heart}
          />
          <StatsCard
            title="This Year"
            value={`$${yearTotal.toFixed(2)}`}
            description={`${currentYear} tax year`}
            icon={Calendar}
          />
          <StatsCard
            title="Ready Now"
            value={readyPlants.length}
            description="Plants to harvest"
            icon={Check}
          />
          <StatsCard
            title="Coming Soon"
            value={comingSoonPlants.length}
            description="In next 2-4 weeks"
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Ready to Harvest
                  </CardTitle>
                  <CardDescription>
                    These plants are ready for picking right now
                  </CardDescription>
                </div>
                <Link href="/plants?status=ready">
                  <Button variant="ghost" size="sm" data-testid="button-view-ready">
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {readyPlants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {readyPlants.slice(0, 6).map((plant) => (
                      <div
                        key={plant.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                        data-testid={`dashboard-ready-${plant.id}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Leaf className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{plant.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{plant.category}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Ready
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Leaf className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No plants ready for harvest right now</p>
                    <p className="text-sm">Check back during the growing season (April-November)</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Coming Soon
                  </CardTitle>
                  <CardDescription>
                    Expected in the next 2-4 weeks
                  </CardDescription>
                </div>
                <Link href="/plants?status=coming_soon">
                  <Button variant="ghost" size="sm" data-testid="button-view-coming">
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {comingSoonPlants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {comingSoonPlants.slice(0, 4).map((plant) => (
                      <div
                        key={plant.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                        data-testid={`dashboard-coming-${plant.id}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{plant.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{plant.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming harvests at this time</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Donation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {donations.length > 0 ? (
                  <div className="space-y-3">
                    {donations.slice(0, 5).map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between" data-testid={`donation-${donation.id}`}>
                        <div>
                          <p className="font-medium">${donation.amount}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(donation.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{donation.taxYear}</Badge>
                      </div>
                    ))}
                    <Separator />
                    <Link href="/donations">
                      <Button variant="ghost" size="sm" className="w-full" data-testid="button-view-donations">
                        View all donations
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Heart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No donations yet</p>
                    <Link href="/donate">
                      <Button variant="outline" size="sm" className="mt-3" data-testid="button-first-donation">
                        Make your first donation
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Tax Forms
                </CardTitle>
              </CardHeader>
              <CardContent>
                {yearTotal > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{currentYear} Summary</p>
                        <p className="text-sm text-muted-foreground">${yearTotal.toFixed(2)} total</p>
                      </div>
                      <Button size="sm" variant="outline" data-testid="button-download-tax">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Download your donation summary for tax purposes
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Make a donation to receive tax documentation
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="harvest-alerts"
                    checked={preferences?.harvestAlerts || false}
                    data-testid="checkbox-harvest-alerts"
                  />
                  <div>
                    <Label htmlFor="harvest-alerts" className="cursor-pointer flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Harvest Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when new plants are ready
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="email-marketing"
                    checked={preferences?.emailMarketing || false}
                    data-testid="checkbox-email-marketing"
                  />
                  <div>
                    <Label htmlFor="email-marketing" className="cursor-pointer flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Newsletter
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive garden updates and news
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
