import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Award, Star, Medal, Trophy } from "lucide-react";
import type { Sponsor, SponsorTier } from "@shared/schema";

interface SponsorSectionProps {
  sponsors: Sponsor[];
}

const tierConfig: Record<SponsorTier, { icon: typeof Trophy; label: string; className: string; bgClass: string }> = {
  platinum: {
    icon: Trophy,
    label: "Platinum",
    className: "text-slate-600 dark:text-slate-300",
    bgClass: "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900",
  },
  gold: {
    icon: Award,
    label: "Gold",
    className: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
  },
  silver: {
    icon: Medal,
    label: "Silver",
    className: "text-gray-500 dark:text-gray-400",
    bgClass: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50",
  },
  bronze: {
    icon: Star,
    label: "Bronze",
    className: "text-orange-700 dark:text-orange-400",
    bgClass: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
  },
};

export function SponsorSection({ sponsors }: SponsorSectionProps) {
  const groupedSponsors = sponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) {
      acc[sponsor.tier] = [];
    }
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<SponsorTier, Sponsor[]>);

  const tiers: SponsorTier[] = ["platinum", "gold", "silver", "bronze"];
  const hasSponsors = sponsors.length > 0;

  return (
    <section className="py-16 bg-card">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Generous Supporters</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-serif">
            We're grateful to everyone who has contributed to our mission. 
            Your support helps us provide fresh produce to our community.
          </p>
        </div>

        {hasSponsors ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => {
              const tierInfo = tierConfig[tier];
              const TierIcon = tierInfo.icon;
              const tierSponsors = groupedSponsors[tier] || [];

              return (
                <Card key={tier} className={`${tierInfo.bgClass} border-0`} data-testid={`card-tier-${tier}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TierIcon className={`h-5 w-5 ${tierInfo.className}`} />
                      <h3 className={`font-semibold ${tierInfo.className}`}>{tierInfo.label}</h3>
                    </div>
                    
                    {tierSponsors.length > 0 ? (
                      <ul className="space-y-2">
                        {tierSponsors.map((sponsor) => (
                          <li key={sponsor.id} className="text-sm" data-testid={`text-sponsor-${sponsor.id}`}>
                            {sponsor.websiteUrl ? (
                              <a
                                href={sponsor.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {sponsor.name}
                              </a>
                            ) : (
                              sponsor.name
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Be the first {tier} sponsor
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="max-w-md mx-auto text-center p-8">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-2">Be Our First Sponsor</h3>
              <p className="text-muted-foreground mb-6 font-serif">
                Help us grow our garden and support the community. Every contribution makes a difference.
              </p>
              <Link href="/sponsor">
                <Button data-testid="button-become-sponsor">
                  <Heart className="h-4 w-4 mr-2" />
                  Support Our Mission
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {hasSponsors && (
          <div className="text-center mt-8">
            <Link href="/donate">
              <Button variant="outline" data-testid="button-join-supporters">
                <Heart className="h-4 w-4 mr-2" />
                Join Our Supporters
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
