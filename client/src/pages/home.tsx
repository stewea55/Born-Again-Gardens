import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SponsorSection } from "@/components/sponsor-section";
import { Heart, Leaf, Calendar, Users, ArrowRight, Check, Clock, Sprout } from "lucide-react";
import heroImage from "@assets/generated_images/community_garden_golden_hour.png";
import { useQuery } from "@tanstack/react-query";
import type { Plant, Sponsor } from "@shared/schema";

const features = [
  {
    icon: Leaf,
    title: "68+ Plant Varieties",
    description: "From heirloom tomatoes to medicinal herbs, we grow a diverse selection of produce for our community.",
  },
  {
    icon: Calendar,
    title: "Year-Round Growing",
    description: "Our harvest calendar runs from April through November, with something fresh in every season.",
  },
  {
    icon: Users,
    title: "Honor System",
    description: "Take what you need, pay what you can. We believe everyone deserves access to fresh, healthy food.",
  },
];

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  const { data: sponsors = [] } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const readyPlants = plants.filter((p) => p.status === "ready");
  const comingSoonPlants = plants.filter((p) => p.status === "coming_soon");

  return (
    <div className="min-h-screen">
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Born Again Gardens community garden at sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 backdrop-blur-sm bg-white/20 text-white border-white/30">
            <Sprout className="h-3 w-3 mr-1" />
            Central Indiana Community Garden
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Fresh Produce for
            <br />
            <span className="text-primary-foreground/90">Our Community</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl font-serif">
            Take what you need, pay what you can. Born Again Gardens provides fresh, 
            organic produce to our community through an honor system that ensures 
            everyone has access to healthy food.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link href="/donate">
              <Button size="lg" className="text-base px-8" data-testid="button-hero-donate">
                <Heart className="h-5 w-5 mr-2" />
                Support Our Mission
              </Button>
            </Link>
            <Link href="/plants">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base px-8 backdrop-blur-sm bg-white/10 border-white/30 text-white hover:bg-white/20"
                data-testid="button-hero-plants"
              >
                <Leaf className="h-5 w-5 mr-2" />
                View Our Plants
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4" />
              68 Plant Varieties
            </span>
            <span className="hidden sm:block">•</span>
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4" />
              Honor System
            </span>
            <span className="hidden sm:block">•</span>
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4" />
              100% Community
            </span>
          </div>
        </div>
      </section>

      {isAuthenticated && user && (
        <section className="py-8 bg-primary/5 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-lg font-medium">
                  Welcome back, {user.firstName || "Friend"}!
                </p>
                <p className="text-muted-foreground text-sm">
                  {readyPlants.length} plants are ready for harvest right now
                </p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" data-testid="button-go-dashboard">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif">
              Born Again Gardens operates on trust and community. Here's how you can participate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover-elevate" data-testid={`card-feature-${index}`}>
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground font-serif">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What's Growing Now</h2>
              <p className="text-lg text-muted-foreground max-w-xl font-serif">
                See what's ready for harvest and what's coming soon in our garden.
              </p>
            </div>
            <Link href="/plants">
              <Button variant="outline" data-testid="button-view-all-plants">
                View All Plants
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <h3 className="font-semibold text-lg">Ready to Harvest</h3>
                  <Badge variant="secondary" className="ml-auto">{readyPlants.length}</Badge>
                </div>
                {readyPlants.length > 0 ? (
                  <div className="space-y-2">
                    {readyPlants.slice(0, 5).map((plant) => (
                      <div key={plant.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate" data-testid={`ready-plant-${plant.id}`}>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{plant.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">{plant.category}</Badge>
                      </div>
                    ))}
                    {readyPlants.length > 5 && (
                      <Link href="/plants?status=ready">
                        <Button variant="ghost" size="sm" className="w-full mt-2">
                          +{readyPlants.length - 5} more
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    Check back soon! Our growing season peaks from May through October.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="font-semibold text-lg">Coming Soon</h3>
                  <Badge variant="secondary" className="ml-auto">{comingSoonPlants.length}</Badge>
                </div>
                {comingSoonPlants.length > 0 ? (
                  <div className="space-y-2">
                    {comingSoonPlants.slice(0, 5).map((plant) => (
                      <div key={plant.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate" data-testid={`coming-plant-${plant.id}`}>
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">{plant.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">{plant.category}</Badge>
                      </div>
                    ))}
                    {comingSoonPlants.length > 5 && (
                      <Link href="/plants?status=coming_soon">
                        <Button variant="ghost" size="sm" className="w-full mt-2">
                          +{comingSoonPlants.length - 5} more
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    Stay tuned for upcoming harvests!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <SponsorSection sponsors={sponsors} />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Visit?</h2>
          <p className="text-lg text-muted-foreground mb-8 font-serif">
            Our garden is open during daylight hours. Sign in to track your donations, 
            get harvest alerts, and access your tax forms. Or simply stop by and 
            enjoy fresh produce from our community garden.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <a href="/api/login">
                <Button size="lg" variant="outline" data-testid="button-cta-signin">
                  Sign In for Full Access
                </Button>
              </a>
            )}
            <Link href="/calendar">
              <Button size="lg" variant={isAuthenticated ? "outline" : "default"} data-testid="button-cta-calendar">
                <Calendar className="h-5 w-5 mr-2" />
                View Harvest Calendar
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
