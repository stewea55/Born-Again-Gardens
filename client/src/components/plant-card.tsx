import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Leaf, Clock, Check } from "lucide-react";
import type { Plant } from "@shared/schema";

interface PlantCardProps {
  plant: Plant;
  onAddToCart?: (plant: Plant, quantity: number) => void;
  onViewDetails?: (plant: Plant) => void;
  currentQuantity?: number;
}

const categoryColors: Record<string, string> = {
  fruit: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  vegetable: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  herb: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  flower: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

const statusConfig: Record<string, { icon: typeof Check; label: string; className: string }> = {
  ready: {
    icon: Check,
    label: "Ready Now",
    className: "bg-green-500 text-white",
  },
  coming_soon: {
    icon: Clock,
    label: "Coming Soon",
    className: "bg-amber-500 text-white",
  },
  out_of_season: {
    icon: Leaf,
    label: "Out of Season",
    className: "bg-muted text-muted-foreground",
  },
};

export function PlantCard({ plant, onAddToCart, onViewDetails, currentQuantity = 0 }: PlantCardProps) {
  const statusInfo = statusConfig[plant.status] || statusConfig.out_of_season;
  const StatusIcon = statusInfo.icon;
  const canAddToCart = plant.status === "ready";
  const [quantity, setQuantity] = useState(currentQuantity);
  const [showQuantity, setShowQuantity] = useState(false);

  useEffect(() => {
    setQuantity(currentQuantity);
  }, [currentQuantity]);

  const handlePhotoClick = () => {
    // On desktop, clicking photo opens learn more modal
    if (onViewDetails) {
      onViewDetails(plant);
    } else if (onAddToCart && canAddToCart) {
      // Fallback to mobile behavior if no view details handler
      setShowQuantity(true);
      if (quantity <= 0) {
        const nextQuantity = 1;
        setQuantity(nextQuantity);
        onAddToCart(plant, nextQuantity);
      }
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart && canAddToCart && quantity > 0) {
      onAddToCart(plant, quantity);
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const nextQuantity = Math.max(0, prev + delta);
      if (onAddToCart && canAddToCart) {
        onAddToCart(plant, nextQuantity);
      }
      return nextQuantity;
    });
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-200 group md:block flex flex-col" data-testid={`card-plant-${plant.id}`}>
      {/* Mobile: Compact layout */}
      <div className="md:hidden">
        <div 
          className="aspect-square relative bg-muted overflow-hidden rounded-t-lg cursor-pointer"
          onClick={handlePhotoClick}
        >
          {plant.imageUrl ? (
            <img
              src={plant.imageUrl}
              alt={plant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          <Badge className={`absolute top-1 right-1 text-[10px] px-1 py-0 ${statusInfo.className}`}>
            <StatusIcon className="h-2 w-2 mr-0.5" />
            <span className="hidden sm:inline">{statusInfo.label}</span>
          </Badge>
        </div>
        <div className="p-2">
          <h3 className="font-medium text-xs leading-tight truncate">{plant.name}</h3>
          {showQuantity && onAddToCart && canAddToCart ? (
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(-1);
                }}
                disabled={quantity <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs font-medium min-w-[2rem] text-center">{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(1);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Desktop: Full layout */}
      <div className="hidden md:block">
        <div 
          className="aspect-square relative bg-muted overflow-hidden cursor-pointer"
          onClick={handlePhotoClick}
        >
          {plant.imageUrl ? (
            <img
              src={plant.imageUrl}
              alt={plant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          <Badge className={`absolute top-3 right-3 ${statusInfo.className}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight">{plant.name}</h3>
              {plant.scientificName && (
                <p className="text-xs text-muted-foreground italic">{plant.scientificName}</p>
              )}
            </div>
            <Badge variant="secondary" className={categoryColors[plant.category] || ""}>
              {plant.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {plant.harvestStart && plant.harvestEnd && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>Harvest: {plant.harvestStart} - {plant.harvestEnd}</span>
            </div>
          )}
          {plant.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 font-serif">
              {plant.description}
            </p>
          )}
          {showQuantity && onAddToCart && canAddToCart && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(-1);
                }}
                disabled={quantity <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuantityChange(1);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                disabled={quantity <= 0}
                data-testid={`button-add-cart-${plant.id}`}
              >
                Add to Your Basket
              </Button>
            </div>
          )}
        </CardContent>

        {onViewDetails && (
          <CardFooter className="flex gap-2 pt-0">
            <Button
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(plant);
              }}
              data-testid={`button-view-${plant.id}`}
            >
              Learn More
            </Button>
          </CardFooter>
        )}
      </div>
    </Card>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
