import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlantCard } from "@/components/plant-card";
import { PlantDetailModal } from "@/components/plant-detail-modal";
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/cart-context";
import type { Plant, PlantCategory } from "@shared/schema";

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

const categoryOrder: Record<PlantCategory, number> = {
  fruit: 0,
  vegetable: 1,
  herb: 2,
  flower: 3,
};

export function HarvestCalendar({ plants, onSelectMonth }: HarvestCalendarProps) {
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { items: cartItems, addToCart, updateQuantity, removeItem } = useCart();

  const plantsInMonth = plants.filter((plant) => isInHarvestWindow(plant, selectedMonth));
  const sortedPlants = [...plantsInMonth].sort((a, b) => {
    const categoryDiff = (categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99);
    if (categoryDiff !== 0) return categoryDiff;
    return a.name.localeCompare(b.name);
  });

  const handlePrev = () => {
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNext = () => {
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const handleViewDetails = (plant: Plant) => {
    setSelectedPlant(plant);
    setDetailOpen(true);
  };

  const handleAddToCart = async (plant: Plant, quantity: number = 1) => {
    try {
      if (plant.status !== "ready") {
        return;
      }

      const existing = cartItems.find(
        (item) => (item.plant?.id ?? item.plantId) === plant.id
      );

      if (quantity <= 0) {
        if (existing) {
          await removeItem(existing.id);
        }
        return;
      }

      if (existing) {
        await updateQuantity(existing.id, quantity);
      } else {
        await addToCart(plant, quantity);
      }
    } catch (error) {
      console.error("Failed to update cart quantity:", error);
    }
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
          Available in {months[selectedMonth]} ({sortedPlants.length} varieties)
        </h3>

        {sortedPlants.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-6">
            {sortedPlants.map((plant) => {
              const existingItem = cartItems.find(
                (item) => (item.plant?.id ?? item.plantId) === plant.id
              );
              const currentQuantity = existingItem
                ? parseFloat(existingItem.quantity.toString())
                : 0;

              return (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  onViewDetails={handleViewDetails}
                  onAddToCart={handleAddToCart}
                  currentQuantity={currentQuantity}
                />
              );
            })}
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

      <PlantDetailModal
        plant={selectedPlant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToCart={(plant, quantity) => {
          handleAddToCart(plant, quantity);
        }}
        currentQuantity={
          selectedPlant
            ? cartItems.find((item) => (item.plant?.id ?? item.plantId) === selectedPlant.id)
              ? parseFloat(
                  cartItems.find((item) => (item.plant?.id ?? item.plantId) === selectedPlant.id)!
                    .quantity.toString()
                )
              : 0
            : 0
        }
      />
    </div>
  );
}
