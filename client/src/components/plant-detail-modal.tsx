import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Leaf, Calendar, Heart, Scissors, Plus, Minus } from "lucide-react";
import type { Plant } from "@shared/schema";

interface PlantDetailModalProps {
  plant: Plant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (plant: Plant, quantity: number) => void;
  currentQuantity?: number;
}

const categoryColors: Record<string, string> = {
  fruit: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  vegetable: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  herb: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  flower: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

export function PlantDetailModal({ plant, open, onOpenChange, onAddToCart, currentQuantity = 0 }: PlantDetailModalProps) {
  const [quantity, setQuantity] = useState(Math.max(1, currentQuantity || 1));
  const canAddToCart = plant?.status === "ready";

  useEffect(() => {
    // Sync quantity with cart when modal opens or currentQuantity changes
    if (open && plant) {
      setQuantity(Math.max(0, currentQuantity || 0) || 1);
    }
  }, [open, plant, currentQuantity]);

  if (!plant) return null;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(0, quantity + delta);
    setQuantity(newQuantity);
    // Update cart immediately when quantity changes
    if (onAddToCart && canAddToCart) {
      onAddToCart(plant, newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart && canAddToCart && quantity > 0) {
      onAddToCart(plant, quantity);
      // Close modal after adding to cart
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              {plant.imageUrl ? (
                <img src={plant.imageUrl} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <Leaf className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-1">{plant.name}</DialogTitle>
              {plant.scientificName && (
                <p className="text-sm text-muted-foreground italic mb-2">{plant.scientificName}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={categoryColors[plant.category] || ""}>
                  {plant.category}
                </Badge>
                {plant.harvestStart && plant.harvestEnd && (
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {plant.harvestStart} - {plant.harvestEnd}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
              <TabsTrigger value="benefits" data-testid="tab-benefits">Benefits</TabsTrigger>
              <TabsTrigger value="harvest" data-testid="tab-harvest">Harvest</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground font-serif">
                  {plant.description || "Information about this plant will be added soon."}
                </p>
              </div>

              {plant.companionPlants && (
                <div>
                  <h4 className="font-semibold mb-2">Companion Plants</h4>
                  <p className="text-muted-foreground font-serif">{plant.companionPlants}</p>
                </div>
              )}

              {plant.suggestedDonation && (
                <div className="bg-accent/50 rounded-lg p-4">
                  <p className="text-sm font-medium">Suggested Donation</p>
                  <p className="text-2xl font-bold text-primary">
                    ${plant.suggestedDonation} <span className="text-sm font-normal text-muted-foreground">per {plant.unit || "lb"}</span>
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="benefits" className="mt-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Medicinal & Health Benefits</h4>
                  <p className="text-muted-foreground font-serif">
                    {plant.medicinalBenefits || "Health benefits information for this plant will be added soon. Check back later!"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="harvest" className="mt-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Scissors className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Harvest Instructions</h4>
                  <p className="text-muted-foreground font-serif">
                    {plant.harvestInstructions || "Detailed harvest instructions will be added soon. Our volunteers can help you at the garden!"}
                  </p>
                </div>
              </div>

              {plant.harvestStart && plant.harvestEnd && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Harvest Window</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    In central Indiana (Zone 5b/6a), {plant.name.toLowerCase()} is typically ready to harvest from <strong>{plant.harvestStart}</strong> through <strong>{plant.harvestEnd}</strong>.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {onAddToCart && canAddToCart && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-9 p-0"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-9 p-0"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                className="flex-1" 
                onClick={handleAddToCart} 
                disabled={quantity <= 0}
                data-testid="button-modal-add-cart"
              >
                <Plus className="h-4 w-4 mr-2" />
                {quantity > 0 ? "Add to Harvest Basket" : "Remove from Basket"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
