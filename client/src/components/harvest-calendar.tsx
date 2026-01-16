import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { useState } from "react";
import type { Plant } from "@shared/schema";

interface HarvestCalendarProps {
  plants: Plant[];
  onSelectMonth?: (month: string) => void;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const monthAbbr: Record<string, number> = {
  "jan": 0, "january": 0,
  "feb": 1, "february": 1,
  "mar": 2, "march": 2,
  "apr": 3, "april": 3,
  "may": 4,
  "jun": 5, "june": 5,
  "jul": 6, "july": 6,
  "aug": 7, "august": 7,
  "sep": 8, "september": 8, "sept": 8,
  "oct": 9, "october": 9,
  "nov": 10, "november": 10,
  "dec": 11, "december": 11,
};

function parseMonth(monthStr: string): number {
  const normalized = monthStr.toLowerCase().trim();
  return monthAbbr[normalized] ?? -1;
}

function isInHarvestWindow(plant: Plant, monthIndex: number): boolean {
  if (!plant.harvestStart || !plant.harvestEnd) return false;
  
  const start = parseMonth(plant.harvestStart);
  const end = parseMonth(plant.harvestEnd);
  
  if (start === -1 || end === -1) return false;
  
  if (start <= end) {
    return monthIndex >= start && monthIndex <= end;
  } else {
    return monthIndex >= start || monthIndex <= end;
  }
}

const categoryColors: Record<string, string> = {
  fruit: "bg-red-500",
  vegetable: "bg-green-500",
  herb: "bg-purple-500",
  flower: "bg-pink-500",
};

export function HarvestCalendar({ plants, onSelectMonth }: HarvestCalendarProps) {
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const plantsInMonth = plants.filter((plant) => isInHarvestWindow(plant, selectedMonth));

  const handlePrev = () => {
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNext = () => {
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrev} data-testid="button-prev-month">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-2xl">{months[selectedMonth]}</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleNext} data-testid="button-next-month">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1 mb-6">
            {months.map((month, index) => (
              <Button
                key={month}
                variant={index === selectedMonth ? "default" : index === currentMonth ? "secondary" : "ghost"}
                size="sm"
                className="text-xs px-2"
                onClick={() => setSelectedMonth(index)}
                data-testid={`button-month-${month.toLowerCase()}`}
              >
                {month.slice(0, 3)}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Fruit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Vegetable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Herb</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span>Flower</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold text-lg mb-4">
          Available in {months[selectedMonth]} ({plantsInMonth.length} varieties)
        </h3>

        {plantsInMonth.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plantsInMonth.map((plant) => (
              <Card key={plant.id} className="hover-elevate" data-testid={`calendar-plant-${plant.id}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${categoryColors[plant.category] || "bg-gray-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{plant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plant.harvestStart} - {plant.harvestEnd}
                    </p>
                  </div>
                  {plant.status === "ready" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                      Ready
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No plants harvesting in {months[selectedMonth]}</p>
              <p className="text-sm text-muted-foreground mt-1">
                This is typically the dormant season for our garden
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
