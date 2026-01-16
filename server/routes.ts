import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlantSchema, insertSponsorSchema, insertDonationSchema } from "@shared/schema";
import { initialPlants } from "../client/src/lib/plant-data";

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
      res.json(donations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donations" });
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
      res.json(prefs || { userId, emailMarketing: false, harvestAlerts: false });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
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

  // Get all donations (admin only)
  app.get("/api/admin/donations", requireAuth, requireAdmin, async (req, res) => {
    try {
      const donations = await storage.getDonations();
      res.json(donations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch donations" });
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
