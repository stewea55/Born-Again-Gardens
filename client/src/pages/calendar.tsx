import { useQuery } from "@tanstack/react-query";
import { HarvestCalendar } from "@/components/harvest-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Sun, Snowflake, Droplets, Wind } from "lucide-react";
import type { Plant } from "@shared/schema";

const seasonInfo = [
  {
    icon: Droplets,
    season: "Spring (Apr-Jun)",
    description: "Cool-season crops like lettuce, spinach, and early berries",
    color: "text-green-600",
  },
  {
    icon: Sun,
    season: "Summer (Jul-Aug)",
    description: "Peak harvest with tomatoes, peppers, melons, and berries",
    color: "text-amber-600",
  },
  {
    icon: Wind,
    season: "Fall (Sep-Nov)",
    description: "Figs, late peppers, root vegetables, and cold-hardy greens",
    color: "text-orange-600",
  },
  {
    icon: Snowflake,
    season: "Winter (Dec-Mar)",
    description: "Garden rests. Planning and preparation for spring!",
    color: "text-blue-600",
  },
];

export default function CalendarPage() {
  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  return (
    <div className="min-h-screen">
      <section className="bg-muted/30 py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Harvest Calendar</h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-serif">
            Plan your visits with our month-by-month guide to what's in season. 
            Central Indiana (Zone 5b/6a) has a growing season from April through November.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {seasonInfo.map((info, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-season-${index}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <info.icon className={`h-5 w-5 ${info.color}`} />
                  <span className="font-semibold">{info.season}</span>
                </div>
                <p className="text-sm text-muted-foreground">{info.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        ) : plants.length > 0 ? (
          <HarvestCalendar plants={plants} />
        ) : (
          <div className="text-center py-16">
            <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No plant data available</h3>
            <p className="text-muted-foreground">
              Check back soon as we add our plant inventory!
            </p>
          </div>
        )}

        <section className="mt-16 bg-card rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Growing Zone Information</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none font-serif">
            <p>
              Born Again Gardens is located in central Indiana, which falls within USDA Hardiness 
              Zones 5b to 6a. This means we experience:
            </p>
            <ul>
              <li><strong>Last Spring Frost:</strong> Late April to early May</li>
              <li><strong>First Fall Frost:</strong> Mid-October</li>
              <li><strong>Growing Season:</strong> Approximately 170 days</li>
            </ul>
            <p>
              Our harvest calendar is tailored to these conditions. Cool-season crops like lettuce 
              and spinach thrive in spring and fall, while heat-loving plants like tomatoes and 
              peppers peak in the summer months. Some hardy plants like kale actually taste sweeter 
              after a light frost!
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
