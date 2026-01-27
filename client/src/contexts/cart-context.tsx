import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Plant, CartItem } from "@shared/schema";

interface CartItemWithPlant extends CartItem {
  plant: Plant | null;
}

interface CartContextType {
  items: CartItemWithPlant[];
  isLoading: boolean;
  addToCart: (plant: Plant, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalSuggested: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CartItemWithPlant[]>([]);

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery<CartItemWithPlant[]>({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      const response = await fetch("/api/cart", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }
      return response.json();
    },
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    setItems(cartItems);
  }, [cartItems]);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ plant, quantity }: { plant: Plant; quantity: number }) => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plantId: plant.id,
          quantity: quantity || 1,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        throw new Error("Failed to update cart");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to remove item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to clear cart");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const addToCart = async (plant: Plant, quantity: number = 1) => {
    await addToCartMutation.mutateAsync({ plant, quantity });
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    await updateQuantityMutation.mutateAsync({ itemId, quantity });
  };

  const removeItem = async (itemId: number) => {
    await removeItemMutation.mutateAsync(itemId);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  const totalSuggested = items.reduce((sum, item) => {
    if (!item.plant?.suggestedDonation) return sum;
    const price = parseFloat(item.plant.suggestedDonation);
    const qty = parseFloat(item.quantity.toString());
    return sum + price * qty;
  }, 0);

  const itemCount = items.reduce((sum, item) => {
    return sum + parseFloat(item.quantity.toString());
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        totalSuggested,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
