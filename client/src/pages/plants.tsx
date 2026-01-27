import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PlantCard } from "@/components/plant-card";
import { PlantDetailModal } from "@/components/plant-detail-modal";
import { CartSidebar } from "@/components/cart-sidebar";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Leaf, X } from "lucide-react";
import type { Plant, PlantCategory, PlantStatus } from "@shared/schema";

const monthAbbr: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const getAutoStatus = (plant: Plant): PlantStatus => {
  if (!plant.harvestStart || !plant.harvestEnd) return "out_of_season";

  const start = monthAbbr[plant.harvestStart.toLowerCase()] ?? -1;
  const end = monthAbbr[plant.harvestEnd.toLowerCase()] ?? -1;

  if (start === -1 || end === -1) return "out_of_season";

  const currentMonth = new Date().getMonth();
  const isInSeason =
    start <= end
      ? currentMonth >= start && currentMonth <= end
      : currentMonth >= start || currentMonth <= end;

  if (isInSeason) {
    return "ready";
  }

  const nextMonth = (currentMonth + 1) % 12;
  const twoMonthsOut = (currentMonth + 2) % 12;
  const comingSoon =
    start <= end
      ? (nextMonth >= start && nextMonth <= end) || (twoMonthsOut >= start && twoMonthsOut <= end)
      : (nextMonth >= start || nextMonth <= end) || (twoMonthsOut >= start || twoMonthsOut <= end);

  return comingSoon ? "coming_soon" : "out_of_season";
};

export default function Plants() {
  const { items: cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PlantCategory | "all" | "produce">("all");
  const [statusFilter, setStatusFilter] = useState<PlantStatus | "all" | "auto">(
    (searchParams.get("status") as PlantStatus | "auto") || "ready"
  );
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  const filteredPlants = useMemo(() => {
    const filtered = plants.filter((plant) => {
      const matchesSearch =
        search === "" ||
        plant.name.toLowerCase().includes(search.toLowerCase()) ||
        plant.scientificName?.toLowerCase().includes(search.toLowerCase());

      // Combine fruits and vegetables when filtering
      let matchesCategory = false;
      if (categoryFilter === "all") {
        matchesCategory = true;
      } else if (categoryFilter === "fruit" || categoryFilter === "vegetable") {
        // Show both fruits and vegetables when either is selected
        matchesCategory = plant.category === "fruit" || plant.category === "vegetable";
      } else {
        matchesCategory = plant.category === categoryFilter;
      }

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "auto" ? getAutoStatus(plant) === "ready" : plant.status === statusFilter);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [plants, search, categoryFilter, statusFilter]);

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

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("ready");
  };

  const hasActiveFilters = search !== "" || categoryFilter !== "all" || statusFilter !== "ready";

  const statuses: { value: PlantStatus | "all" | "auto"; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "ready", label: "Ready Now" },
    { value: "coming_soon", label: "Coming Soon" },
    { value: "out_of_season", label: "Out of Season" },
    { value: "auto", label: "Auto (By Harvest)" },
  ];

  return (
    <div className="min-h-screen">
      <section className="py-12 border-b" style={{ backgroundColor: '#7C5366' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ color: '#FDF6E3' }}>Our Plants</h1>
          <p className="text-sm max-w-2xl italic text-center mx-auto" style={{ color: '#FDF6E3' }}>
            Easily add plants to your basket after harvesting. Don't know how to harvest? Click on the plant and learn key features such as harvesting instructions, medicinal benefits, and which plants are companions.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Estimate Your Harvest Card */}
        <div className="mb-8">
          <CartSidebar
            items={cartItems.map((item) => ({
              id: item.id,
              plant: {
                id: item.plant?.id || item.plantId,
                name: item.plant?.name || "Unknown",
                suggestedDonation: item.plant?.suggestedDonation || null,
                unit: item.plant?.unit || null,
              },
              quantity: parseFloat(item.quantity.toString()),
            }))}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {/* Category Filter Buttons - Prominent at top */}
            <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                className="text-xs md:text-sm"
                onClick={() => setCategoryFilter("all")}
                data-testid="button-filter-all"
              >
                All
              </Button>
              <Button
                variant={categoryFilter === "produce" ? "default" : "outline"}
                size="sm"
                className="text-xs md:text-sm"
                onClick={() => setCategoryFilter("produce")}
                data-testid="button-filter-produce"
              >
                Produce
              </Button>
              <Button
                variant={categoryFilter === "herb" ? "default" : "outline"}
                size="sm"
                className="text-xs md:text-sm"
                onClick={() => setCategoryFilter("herb")}
                data-testid="button-filter-herb"
              >
                Herbs
              </Button>
              <Button
                variant={categoryFilter === "flower" ? "default" : "outline"}
                size="sm"
                className="text-xs md:text-sm"
                onClick={() => setCategoryFilter("flower")}
                data-testid="button-filter-flower"
              >
                Flowers
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-plants"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PlantStatus | "all" | "auto")}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {search && (
                  <Badge variant="secondary">
                    Search: {search}
                    <button onClick={() => setSearch("")} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="secondary">
                    {categoryFilter === "produce" ? "produce" : categoryFilter}
                    <button onClick={() => setCategoryFilter("all")} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== "ready" && (
                  <Badge variant="secondary">
                    {statusFilter === "auto" ? "auto (by harvest)" : statusFilter.replace("_", " ")}
                    <button onClick={() => setStatusFilter("ready")} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear all
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPlants.length} of {plants.length} plants
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="h-[120px] md:h-[400px] bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredPlants.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-6">
                {filteredPlants.map((plant) => {
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
              <div className="text-center py-16">
                <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                {statusFilter === "ready" ? (
                  <>
                    <h3 className="text-xl font-semibold mb-2">No plants ready right now</h3>
                    <p className="text-muted-foreground mb-4 font-serif">
                      Looks like our garden is taking a little siesta! The plants are still growing and will be ready to harvest soon. As they say, good things come to those who wait... and water! 🌱
                    </p>
                    <Button variant="outline" onClick={() => setStatusFilter("all")} data-testid="button-view-all">
                      View All Plants
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold mb-2">No plants found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or search term
                    </p>
                    <Button variant="outline" onClick={clearFilters} data-testid="button-reset-filters">
                      Reset Filters
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
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
