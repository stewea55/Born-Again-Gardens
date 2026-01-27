import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlantSchema, insertSponsorSchema, insertDonationSchema } from "@shared/schema";
import { initialPlants } from "../client/src/lib/plant-data";
import { generateTaxDocument } from "./utils/pdf-generator";
import { createPaymentIntent, confirmPaymentIntent, retrievePaymentIntent, stripe, STRIPE_PUBLISHABLE_KEY } from "./utils/stripe";
import Stripe from "stripe";
import { paymentLimiter, validatePaymentAmount } from "./middleware/security";

// Get effective user (handles masquerade)
function getEffectiveUser(req: Request): any {
  const session = req.session as any;
  const originalUser = (req as any).user;
  
  // If masquerading and we have an original admin user stored
  if (session?.masqueradingAs && session?.originalUser) {
    return session.masqueradeUser;
  }
  return originalUser;
}

// Check if current session is masquerading
function isMasquerading(req: Request): boolean {
  const session = req.session as any;
  return !!(session?.masqueradingAs && session?.originalUser);
}

// Get original admin user (when masquerading)
function getOriginalAdmin(req: Request): any {
  // Check for originalUser set by masquerade middleware first
  if ((req as any).originalUser) {
    return (req as any).originalUser;
  }
  const session = req.session as any;
  return session?.originalUser || (req as any).user;
}

// Helper to check if user is admin (checks original user, not masquerade)
function isAdmin(req: Request): boolean {
  const originalUser = getOriginalAdmin(req);
  return originalUser?.role === "admin";
}

// Middleware to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getEffectiveUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // Attach effective user for route handlers
  (req as any).effectiveUser = user;
  next();
}

// Middleware to require admin (always checks original user)
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Global masquerade middleware - swaps req.user when admin is masquerading
  app.use((req: Request, res: Response, next: NextFunction) => {
    const session = req.session as any;
    if (session?.masqueradingAs && session?.originalUser && session?.masqueradeUser) {
      // Store original user for admin operations
      (req as any).originalUser = (req as any).user;
      // Swap to masqueraded user for all downstream handlers
      (req as any).user = session.masqueradeUser;
    }
    next();
  });
  
  // ==================== PUBLIC ROUTES ====================

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // Get all plants
  app.get("/api/plants", async (req, res) => {
    try {
      const plants = await storage.getPlants();
      res.json(plants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plants" });
    }
  });

  // Get single plant
  app.get("/api/plants/:id", async (req, res) => {
    try {
      const plant = await storage.getPlant(parseInt(req.params.id));
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json(plant);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plant" });
    }
  });

  // Get all sponsors
  app.get("/api/sponsors", async (req, res) => {
    try {
      const sponsors = await storage.getSponsors();
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sponsors" });
    }
  });

  // Seed plants (admin only)
  app.post("/api/seed-plants", requireAuth, requireAdmin, async (req, res) => {
    try {
      const existingPlants = await storage.getPlants();
      if (existingPlants.length >= 68) {
        return res.json({ message: "Plants already seeded", count: existingPlants.length });
      }

      const currentMonth = new Date().getMonth();
      const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      
      const monthAbbr: Record<string, number> = {
        "january": 0, "february": 1, "march": 2, "april": 3, "may": 4, "june": 5,
        "july": 6, "august": 7, "september": 8, "october": 9, "november": 10, "december": 11,
      };

      for (const plantData of initialPlants) {
        // Determine status based on current month
        let status: "ready" | "coming_soon" | "out_of_season" = "out_of_season";
        
        if (plantData.harvestStart && plantData.harvestEnd) {
          const start = monthAbbr[plantData.harvestStart.toLowerCase()];
          const end = monthAbbr[plantData.harvestEnd.toLowerCase()];
          
          if (start !== undefined && end !== undefined) {
            const isInSeason = start <= end 
              ? (currentMonth >= start && currentMonth <= end)
              : (currentMonth >= start || currentMonth <= end);
            
            if (isInSeason) {
              status = "ready";
            } else {
              // Check if coming soon (within next 2 months)
              const nextMonth = (currentMonth + 1) % 12;
              const twoMonthsOut = (currentMonth + 2) % 12;
              const comingSoon = start <= end
                ? (nextMonth >= start && nextMonth <= end) || (twoMonthsOut >= start && twoMonthsOut <= end)
                : (nextMonth >= start || nextMonth <= end) || (twoMonthsOut >= start || twoMonthsOut <= end);
              
              if (comingSoon) {
                status = "coming_soon";
              }
            }
          }
        }

        await storage.createPlant({
          ...plantData,
          status,
          inStock: status === "ready",
        });
      }

      res.json({ message: "Plants seeded successfully", count: initialPlants.length });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: "Failed to seed plants" });
    }
  });

  // ==================== AUTHENTICATED USER ROUTES ====================

  // Get user's donations
  app.get("/api/donations", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).effectiveUser.id;
      const donations = await storage.getDonationsByUser(userId);
      // Filter out donations hidden by admin
      const visibleDonations = donations.filter((d) => d.isVisibleToUser !== false);
      res.json(visibleDonations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  // Create company user for donations
  app.post("/api/donations/create-company-user", async (req, res) => {
    try {
      const { companyName, companyUrl, companyEmail } = req.body;

      if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
        return res.status(400).json({ error: "Company name is required" });
      }

      const trimmedName = companyName.trim();
      const trimmedUrl = companyUrl && typeof companyUrl === "string" ? companyUrl.trim() : undefined;
      const trimmedEmail = companyEmail && typeof companyEmail === "string" && companyEmail.trim() ? companyEmail.trim() : undefined;

      // Check if company user already exists by email (if provided) or name
      const existingUsers = await storage.getAllUsers();
      const existingCompany = existingUsers.find(
        (u) => u.role === "company" && 
        ((trimmedEmail && u.email === trimmedEmail) || u.firstName?.toLowerCase() === trimmedName.toLowerCase())
      );

      if (existingCompany) {
        return res.json(existingCompany);
      }

      // Create new company user - only include email if provided, otherwise leave it undefined
      // This ensures the email field stays empty in the database if not provided
      const userData: any = {
        firstName: trimmedName,
        lastName: null,
        role: "company",
      };

      // Only include email if provided
      if (trimmedEmail) {
        userData.email = trimmedEmail;
      }

      // Only include companyUrl if provided
      if (trimmedUrl) {
        userData.companyUrl = trimmedUrl;
      }

      // Only include companyEmail if provided
      if (trimmedEmail) {
        userData.companyEmail = trimmedEmail;
      }

      const companyUser = await storage.upsertUser(userData);

      res.json(companyUser);
    } catch (error) {
      console.error("[Donations] Error creating company user:", error);
      res.status(500).json({ error: "Failed to create company user" });
    }
  });

  // Create guest user for manual entry (donate flow)
  app.post("/api/users/create-guest", async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body;

      if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
        return res.status(400).json({ error: "First name is required" });
      }

      if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
        return res.status(400).json({ error: "Last name is required" });
      }

      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email is required" });
      }

      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedEmail = email.trim().toLowerCase();

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // Check if user already exists by email
      const existingUsers = await storage.getAllUsers();
      const existingUser = existingUsers.find(
        (u) => u.email && u.email.toLowerCase() === trimmedEmail
      );

      if (existingUser) {
        // Return existing user
        return res.json(existingUser);
      }

      // Create new guest user
      const userData: any = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        role: "user",
      };

      const guestUser = await storage.upsertUser(userData);

      res.json(guestUser);
    } catch (error) {
      console.error("[Users] Error creating guest user:", error);
      res.status(500).json({ error: "Failed to create guest user" });
    }
  });

  // Create a donation
  app.post("/api/donations", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).effectiveUser.id;
      const result = insertDonationSchema.safeParse({
        ...req.body,
        userId,
        taxYear: new Date().getFullYear(),
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }

      const donation = await storage.createDonation(result.data);
      res.json(donation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create donation" });
    }
  });

  // Get user preferences
  app.get("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).effectiveUser.id;
      const prefs = await storage.getUserPreferences(userId);
      res.json(
        prefs || {
          userId,
          emailMarketing: false,
          harvestAlerts: false,
          taxDocumentsVisible: true,
        }
      );
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // ==================== CART ROUTES ====================

  // Helper to get session ID (for guest carts) or user ID (for logged-in users)
  function getCartIdentifier(req: Request): string {
    const user = (req as any).user;
    const session = req.session as any;
    // Use user ID if logged in, otherwise use session ID
    return user?.id || session?.id || req.sessionID || "guest";
  }

  // Get cart items
  app.get("/api/cart", async (req, res) => {
    try {
      const cartId = getCartIdentifier(req);
      const items = await storage.getCartItems(cartId);
      // Fetch plant details for each cart item
      const itemsWithPlants = await Promise.all(
        items.map(async (item) => {
          const plant = await storage.getPlant(item.plantId);
          return {
            ...item,
            plant: plant || null,
          };
        })
      );
      res.json(itemsWithPlants.filter((item) => item.plant !== null));
    } catch (error) {
      console.error("[Cart] Error fetching cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  // Add item to cart
  app.post("/api/cart", async (req, res) => {
    try {
      const cartId = getCartIdentifier(req);
      const { plantId, quantity } = req.body;

      if (!plantId || !quantity) {
        return res.status(400).json({ error: "plantId and quantity are required" });
      }

      // Check if item already exists in cart
      const existingItems = await storage.getCartItems(cartId);
      const existingItem = existingItems.find((item) => item.plantId === plantId);

      if (existingItem) {
        // Update quantity
        const updated = await storage.updateCartItem(
          existingItem.id,
          parseFloat(existingItem.quantity) + parseFloat(quantity.toString())
        );
        const plant = await storage.getPlant(plantId);
        res.json({ ...updated, plant: plant || null });
      } else {
        // Add new item
        const user = (req as any).user;
        const newItem = await storage.addCartItem({
          sessionId: cartId,
          userId: user?.id || null,
          plantId: parseInt(plantId),
          quantity: quantity.toString(),
        });
        const plant = await storage.getPlant(plantId);
        res.json({ ...newItem, plant: plant || null });
      }
    } catch (error) {
      console.error("[Cart] Error adding to cart:", error);
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  });

  // Update cart item quantity
  app.put("/api/cart/:id", async (req, res) => {
    try {
      const cartId = getCartIdentifier(req);
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (quantity <= 0) {
        await storage.removeCartItem(itemId);
        return res.json({ message: "Item removed" });
      }

      const updated = await storage.updateCartItem(itemId, parseFloat(quantity.toString()));
      if (!updated) {
        return res.status(404).json({ error: "Cart item not found" });
      }

      const plant = await storage.getPlant(updated.plantId);
      res.json({ ...updated, plant: plant || null });
    } catch (error) {
      console.error("[Cart] Error updating cart:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  // Remove item from cart
  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.removeCartItem(itemId);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("[Cart] Error removing from cart:", error);
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  });

  // Clear cart
  app.delete("/api/cart", async (req, res) => {
    try {
      const cartId = getCartIdentifier(req);
      await storage.clearCart(cartId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("[Cart] Error clearing cart:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // ==================== STRIPE PAYMENT ROUTES ====================

  // Get Stripe publishable key
  app.get("/api/payments/config", async (_req, res) => {
    res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
  });

  // Create a Stripe payment intent (with rate limiting and validation)
  app.post("/api/payments/create-intent", paymentLimiter, async (req, res) => {
    try {
      const { amount, paymentType, metadata = {} } = req.body;

      // Validate amount using security middleware
      const validation = validatePaymentAmount(amount);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      const paymentIntent = await createPaymentIntent(amount, {
        paymentType: paymentType || "unknown",
        ...metadata,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("[Stripe] Error creating payment intent:", error.message);
      res.status(500).json({ error: error.message || "Failed to create payment intent" });
    }
  });

  // Confirm a payment intent (with rate limiting)
  app.post("/api/payments/confirm", paymentLimiter, async (req, res) => {
    try {
      const { paymentIntentId, paymentMethodId } = req.body;

      if (!paymentIntentId || !paymentMethodId) {
        return res.status(400).json({ error: "paymentIntentId and paymentMethodId are required" });
      }

      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      const paymentIntent = await confirmPaymentIntent(paymentIntentId, paymentMethodId);

      res.json({
        status: paymentIntent.status,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      });
    } catch (error: any) {
      console.error("[Stripe] Error confirming payment:", error);
      res.status(500).json({ error: error.message || "Failed to confirm payment" });
    }
  });


  // ==================== TRANSACTION ROUTES ====================

  // Create transaction and donation
  app.post("/api/transactions", async (req, res) => {
    try {
      const user = (req as any).user;
      const effectiveUser = (req as any).effectiveUser;
      const { amount, cartItems, paymentType, donationType, companyName, companyEmail, contactName, frequency, emailOptIn, userId: providedUserId, firstName, lastName, email } = req.body;

      let userId: string;

      // Determine userId based on authentication and payment type
      if (effectiveUser || user) {
        // User is authenticated
        userId = (effectiveUser || user).id;
      } else if (paymentType === "basket") {
        // Basket flow requires authentication
        return res.status(401).json({ error: "Authentication required for basket payments" });
      } else if (paymentType === "sponsor" && companyName) {
        // Sponsor flow: find or create company user
        const existingUsers = await storage.getAllUsers();
        const existingCompany = existingUsers.find(
          (u) => u.role === "company" && 
          ((companyEmail && u.email === companyEmail) || u.firstName?.toLowerCase() === companyName.toLowerCase())
        );

        if (existingCompany) {
          userId = existingCompany.id;
        } else {
          // Create company user
          const companyUserData: any = {
            firstName: companyName,
            lastName: null,
            role: "company",
          };
          if (companyEmail) {
            companyUserData.email = companyEmail;
            companyUserData.companyEmail = companyEmail;
          }
          const companyUser = await storage.upsertUser(companyUserData);
          userId = companyUser.id;
        }
      } else if (paymentType === "donate" && providedUserId) {
        // Donate flow: use provided user ID (created earlier)
        userId = providedUserId;
      } else if (paymentType === "donate" && firstName && lastName && email) {
        // Donate flow: find or create guest user
        const existingUsers = await storage.getAllUsers();
        const existingUser = existingUsers.find(
          (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create guest user
          const guestUserData: any = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            role: "user",
          };
          const guestUser = await storage.upsertUser(guestUserData);
          userId = guestUser.id;
        }
      } else {
        return res.status(400).json({ error: "User information is required" });
      }

      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ error: "Invalid payment amount" });
      }

      let suggestedTotal = 0;
      let donationAmount = paymentAmount;

      // Handle basket flow
      if (paymentType === "basket") {
        if (!cartItems || !Array.isArray(cartItems)) {
          return res.status(400).json({ error: "Cart items are required for basket payments" });
        }

        // Calculate suggested total from cart items
        suggestedTotal = cartItems.reduce((sum: number, item: any) => {
          const plant = item.plant;
          if (!plant?.suggestedDonation) return sum;
          const price = parseFloat(plant.suggestedDonation);
          const qty = parseFloat(item.quantity?.toString() || "0");
          return sum + price * qty;
        }, 0);

        // Calculate donation amount: 0 if payment < suggested total, else difference
        donationAmount = paymentAmount < suggestedTotal ? 0 : paymentAmount - suggestedTotal;
      }

      // Get payment intent ID from request if provided
      const paymentIntentId = req.body.paymentIntentId || null;
      
      // Verify payment intent if provided
      let paymentStatus = "completed";
      if (paymentIntentId && stripe) {
        try {
          const paymentIntent = await retrievePaymentIntent(paymentIntentId);
          paymentStatus = paymentIntent.status === "succeeded" ? "completed" : "pending";
        } catch (error) {
          console.error("[Transaction] Error verifying payment intent:", error);
          // Continue with transaction creation but mark as pending
          paymentStatus = "pending";
        }
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        sessionId: req.sessionID,
        amount: paymentAmount.toString(),
        paymentMethod: "stripe",
        paymentIntentId: paymentIntentId,
        status: paymentStatus,
        cartItems: cartItems || null,
      });

      // Create donation record
      let donation = null;
      if (donationAmount > 0 || paymentType === "donate" || paymentType === "sponsor") {
        const donationData: any = {
          userId,
          amount: (paymentType === "basket" ? donationAmount : paymentAmount).toString(),
          paymentMethod: "stripe",
          transactionId: transaction.id.toString(),
          notes: paymentType === "basket" 
            ? `Payment of $${paymentAmount.toFixed(2)} for cart items. Suggested total: $${suggestedTotal.toFixed(2)}`
            : paymentType === "sponsor"
            ? `Sponsorship: ${companyName || "N/A"}${frequency === "monthly" ? " (Monthly)" : ""}`
            : "General donation",
          taxYear: new Date().getFullYear(),
        };

        donation = await storage.createDonation(donationData);
      }

      // Company user creation is already handled above in userId determination

      // Clear cart after successful transaction (only for basket)
      if (paymentType === "basket") {
        const cartId = getCartIdentifier(req);
        await storage.clearCart(cartId);
      }

      res.json({
        transaction,
        donation,
        suggestedTotal,
        paymentAmount,
        donationAmount: paymentType === "basket" ? donationAmount : paymentAmount,
      });
    } catch (error) {
      console.error("[Transaction] Error creating transaction:", error);
      res.status(500).json({ error: "Failed to process transaction" });
    }
  });

  // Generate tax document PDF
  app.get("/api/donations/tax-document/:userId", requireAuth, async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      const currentUser = (req as any).effectiveUser;

      // Users can only download their own tax documents unless they're admin
      if (targetUserId !== currentUser.id && currentUser.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }

      if (currentUser.role !== "admin") {
        const prefs = await storage.getUserPreferences(targetUserId);
        if (prefs?.taxDocumentsVisible === false) {
          return res.status(403).json({ error: "Tax documents are not available" });
        }
      }

      const user = await storage.getUser(targetUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const donations = await storage.getDonationsByUser(targetUserId);
      const taxYear = parseInt(req.query.year as string) || new Date().getFullYear();

      // Organization information (should be in env or config)
      const organizationName = process.env.ORG_NAME || "Born Again Gardens";
      const organizationEIN = process.env.ORG_EIN || "XX-XXXXXXX";
      const organizationAddress =
        process.env.ORG_ADDRESS || "123 Garden Street, City, State ZIP";

      const pdfBuffer = await generateTaxDocument({
        user,
        donations,
        taxYear,
        organizationName,
        organizationEIN,
        organizationAddress,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="tax-document-${taxYear}-${user.id}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[Tax Document] Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate tax document" });
    }
  });

  // Update user preferences
  app.put("/api/user/preferences", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).effectiveUser.id;
      const prefs = await storage.upsertUserPreferences({
        userId,
        ...req.body,
      });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  // Get all users (admin only)
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get all user preferences (admin only)
  app.get("/api/admin/user-preferences", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const prefs = await storage.getAllUserPreferences();
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  // Get all donations (admin only)
  app.get("/api/admin/donations", requireAuth, requireAdmin, async (req, res) => {
    try {
      const donations = await storage.getDonations();
      res.json(donations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donations" });
    }
  });

  // Update donation visibility (admin only)
  app.put("/api/admin/donations/:id/visibility", requireAuth, requireAdmin, async (req, res) => {
    try {
      const donationId = parseInt(req.params.id);
      const { isVisibleToUser } = req.body;

      const donation = await storage.updateDonation(donationId, {
        isVisibleToUser: isVisibleToUser !== undefined ? isVisibleToUser : true,
      });

      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }

      res.json(donation);
    } catch (error) {
      console.error("[Admin] Error updating donation visibility:", error);
      res.status(500).json({ error: "Failed to update donation visibility" });
    }
  });

  // Update user role (admin only)
  app.put("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Update tax document visibility (admin only)
  app.put("/api/admin/users/:id/tax-visibility", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const { taxDocumentsVisible } = req.body;

      if (typeof taxDocumentsVisible !== "boolean") {
        return res.status(400).json({ error: "taxDocumentsVisible must be a boolean" });
      }

      const existing = await storage.getUserPreferences(userId);
      const prefs = await storage.upsertUserPreferences({
        userId,
        emailMarketing: existing?.emailMarketing ?? false,
        harvestAlerts: existing?.harvestAlerts ?? false,
        newsletterFrequency: existing?.newsletterFrequency ?? "weekly",
        taxDocumentsVisible,
      });

      res.json(prefs);
    } catch (error) {
      console.error("[Admin] Error updating tax document visibility:", error);
      res.status(500).json({ error: "Failed to update tax document visibility" });
    }
  });

  // Masquerade as user (admin only)
  app.post("/api/admin/masquerade", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      const targetUser = await storage.getUser(userId);
      
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent masquerading as another admin
      if (targetUser.role === "admin") {
        return res.status(403).json({ error: "Cannot masquerade as another admin" });
      }

      // Store original admin user and target user in session
      const session = req.session as any;
      session.originalUser = (req as any).user;
      session.masqueradingAs = userId;
      session.masqueradeUser = targetUser;
      
      // Log the masquerade action for audit
      console.log(`Admin ${(req as any).user.id} started masquerading as user ${userId}`);
      
      res.json({ 
        message: "Masquerade started", 
        user: targetUser,
        originalAdmin: { id: (req as any).user.id, email: (req as any).user.email }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start masquerade" });
    }
  });

  // End masquerade
  app.post("/api/admin/end-masquerade", requireAuth, async (req, res) => {
    try {
      const session = req.session as any;
      
      if (!session.masqueradingAs || !session.originalUser) {
        return res.status(400).json({ error: "Not currently masquerading" });
      }

      // Log the end of masquerade
      console.log(`Admin ${session.originalUser.id} ended masquerade as user ${session.masqueradingAs}`);
      
      const originalUser = session.originalUser;
      
      // Clear masquerade session data
      delete session.masqueradingAs;
      delete session.masqueradeUser;
      delete session.originalUser;
      
      res.json({ message: "Masquerade ended", user: originalUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to end masquerade" });
    }
  });

  // Get current masquerade status
  app.get("/api/admin/masquerade-status", requireAuth, async (req, res) => {
    try {
      const session = req.session as any;
      
      if (session.masqueradingAs && session.originalUser) {
        res.json({
          isMasquerading: true,
          asUser: session.masqueradeUser,
          originalAdmin: { id: session.originalUser.id, email: session.originalUser.email }
        });
      } else {
        res.json({ isMasquerading: false });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get masquerade status" });
    }
  });

  // Create plant (admin only)
  app.post("/api/admin/plants", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = insertPlantSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }
      const plant = await storage.createPlant(result.data);
      res.json(plant);
    } catch (error) {
      res.status(500).json({ error: "Failed to create plant" });
    }
  });

  // Update plant (admin only)
  app.put("/api/admin/plants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const plant = await storage.updatePlant(parseInt(req.params.id), req.body);
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json(plant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update plant" });
    }
  });

  // Update plant status to auto-calculated value (admin only)
  app.put("/api/admin/plants/:id/auto-status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const plantId = parseInt(req.params.id);
      const plant = await storage.getPlant(plantId);
      
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      // Reuse the same logic from seed-plants route
      const currentMonth = new Date().getMonth();
      const monthAbbr: Record<string, number> = {
        "january": 0, "february": 1, "march": 2, "april": 3, "may": 4, "june": 5,
        "july": 6, "august": 7, "september": 8, "october": 9, "november": 10, "december": 11,
      };

      let status: "ready" | "coming_soon" | "out_of_season" = "out_of_season";
      
      if (plant.harvestStart && plant.harvestEnd) {
        const start = monthAbbr[plant.harvestStart.toLowerCase()];
        const end = monthAbbr[plant.harvestEnd.toLowerCase()];
        
        if (start !== undefined && end !== undefined) {
          const isInSeason = start <= end 
            ? (currentMonth >= start && currentMonth <= end)
            : (currentMonth >= start || currentMonth <= end);
          
          if (isInSeason) {
            status = "ready";
          } else {
            const nextMonth = (currentMonth + 1) % 12;
            const twoMonthsOut = (currentMonth + 2) % 12;
            const comingSoon = start <= end
              ? (nextMonth >= start && nextMonth <= end) || (twoMonthsOut >= start && twoMonthsOut <= end)
              : (nextMonth >= start || nextMonth <= end) || (twoMonthsOut >= start || twoMonthsOut <= end);
            
            if (comingSoon) {
              status = "coming_soon";
            }
          }
        }
      }

      const updated = await storage.updatePlant(plantId, {
        status,
        inStock: status === "ready",
      });

      if (!updated) {
        return res.status(404).json({ error: "Plant not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("[Admin] Error updating auto-status:", error);
      res.status(500).json({ error: "Failed to update plant status" });
    }
  });

  // Delete plant (admin only)
  app.delete("/api/admin/plants/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deletePlant(parseInt(req.params.id));
      res.json({ message: "Plant deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete plant" });
    }
  });

  // Create sponsor (admin only)
  app.post("/api/admin/sponsors", requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = insertSponsorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }
      const sponsor = await storage.createSponsor(result.data);
      res.json(sponsor);
    } catch (error) {
      res.status(500).json({ error: "Failed to create sponsor" });
    }
  });

  // Update sponsor (admin only)
  app.put("/api/admin/sponsors/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const sponsor = await storage.updateSponsor(parseInt(req.params.id), req.body);
      if (!sponsor) {
        return res.status(404).json({ error: "Sponsor not found" });
      }
      res.json(sponsor);
    } catch (error) {
      res.status(500).json({ error: "Failed to update sponsor" });
    }
  });

  // Delete sponsor (admin only)
  app.delete("/api/admin/sponsors/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteSponsor(parseInt(req.params.id));
      res.json({ message: "Sponsor deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sponsor" });
    }
  });

  return httpServer;
}
