import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PlantCard } from "@/components/plant-card";
import { PlantDetailModal } from "@/components/plant-detail-modal";
import { CartSidebar } from "@/components/cart-sidebar";
import { AuthPromptModal } from "@/components/auth-prompt-modal";
import { useAuth } from "@/hooks/use-auth";
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

interface CartItem {
  id: number;
  plant: {
    id: number;
    name: string;
    suggestedDonation: string | null;
    unit: string | null;
  };
  quantity: number;
}

export default function Plants() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PlantCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PlantStatus | "all">(
    (searchParams.get("status") as PlantStatus) || "all"
  );
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [nextCartId, setNextCartId] = useState(1);

  const { data: plants = [], isLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const matchesSearch =
        search === "" ||
        plant.name.toLowerCase().includes(search.toLowerCase()) ||
        plant.scientificName?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || plant.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || plant.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [plants, search, categoryFilter, statusFilter]);

  const handleViewDetails = (plant: Plant) => {
    setSelectedPlant(plant);
    setDetailOpen(true);
  };

  const handleAddToCart = (plant: Plant) => {
    const existing = cartItems.find((item) => item.plant.id === plant.id);
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.plant.id === plant.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          id: nextCartId,
          plant: {
            id: plant.id,
            name: plant.name,
            suggestedDonation: plant.suggestedDonation,
            unit: plant.unit,
          },
          quantity: 1,
        },
      ]);
      setNextCartId(nextCartId + 1);
    }

    if (!isAuthenticated && cartItems.length === 0) {
      setAuthPromptOpen(true);
    }
  };

  const handleUpdateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter((item) => item.id !== itemId));
    } else {
      setCartItems(
        cartItems.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveItem = (itemId: number) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters = search !== "" || categoryFilter !== "all" || statusFilter !== "all";

  const categories: { value: PlantCategory | "all"; label: string }[] = [
    { value: "all", label: "All Categories" },
    { value: "fruit", label: "Fruits" },
    { value: "vegetable", label: "Vegetables" },
    { value: "herb", label: "Herbs" },
    { value: "flower", label: "Flowers" },
  ];

  const statuses: { value: PlantStatus | "all"; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "ready", label: "Ready Now" },
    { value: "coming_soon", label: "Coming Soon" },
    { value: "out_of_season", label: "Out of Season" },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-muted/30 py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Our Plants</h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-serif">
            Explore our collection of 68+ plant varieties. Learn about their medicinal benefits, 
            harvest instructions, and add them to your basket to estimate your donation.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
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

              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as PlantCategory | "all")}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PlantStatus | "all")}>
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
                    {categoryFilter}
                    <button onClick={() => setCategoryFilter("all")} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary">
                    {statusFilter.replace("_", " ")}
                    <button onClick={() => setStatusFilter("all")} className="ml-1">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredPlants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onViewDetails={handleViewDetails}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No plants found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search term
                </p>
                <Button variant="outline" onClick={clearFilters} data-testid="button-reset-filters">
                  Reset Filters
                </Button>
              </div>
            )}
          </div>

          <div className="lg:w-80">
            <CartSidebar
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </div>
      </div>

      <PlantDetailModal
        plant={selectedPlant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToCart={(plant) => {
          handleAddToCart(plant);
          setDetailOpen(false);
        }}
      />

      <AuthPromptModal
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
        onContinueAsGuest={() => setAuthPromptOpen(false)}
      />
    </div>
  );
}
