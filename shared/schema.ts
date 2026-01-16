import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Plant categories
export type PlantCategory = "fruit" | "vegetable" | "herb" | "flower";
export type PlantStatus = "ready" | "coming_soon" | "out_of_season";

// Plants table - stores all 68+ plant varieties
export const plants = pgTable("plants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  scientificName: text("scientific_name"),
  category: text("category").notNull().$type<PlantCategory>(),
  description: text("description"),
  harvestStart: text("harvest_start"), // Month name e.g. "May"
  harvestEnd: text("harvest_end"), // Month name e.g. "September"
  medicinalBenefits: text("medicinal_benefits"),
  harvestInstructions: text("harvest_instructions"),
  companionPlants: text("companion_plants"),
  suggestedDonation: decimal("suggested_donation", { precision: 10, scale: 2 }),
  unit: text("unit").default("lb"), // lb, bunch, each, pint
  status: text("status").notNull().$type<PlantStatus>().default("out_of_season"),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sponsor tiers
export type SponsorTier = "platinum" | "gold" | "silver" | "bronze";

// Sponsors table - for donor recognition
export const sponsors = pgTable("sponsors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  tier: text("tier").notNull().$type<SponsorTier>(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User donations tracking
export const donations = pgTable("donations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  notes: text("notes"),
  taxYear: integer("tax_year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences for email marketing etc
export const userPreferences = pgTable("user_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().unique(),
  emailMarketing: boolean("email_marketing").default(false),
  harvestAlerts: boolean("harvest_alerts").default(false),
  newsletterFrequency: text("newsletter_frequency").default("weekly"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart items (can be used by guests or logged-in users)
export const cartItems = pgTable("cart_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: text("session_id").notNull(), // For guest carts
  userId: varchar("user_id"), // Optional for logged-in users
  plantId: integer("plant_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social media posts for blog display
export const socialPosts = pgTable("social_posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  platform: text("platform").notNull(), // instagram, facebook, etc
  postUrl: text("post_url"),
  imageUrl: text("image_url"),
  content: text("content"),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const plantsRelations = relations(plants, ({ many }) => ({
  cartItems: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  plant: one(plants, {
    fields: [cartItems.plantId],
    references: [plants.id],
  }),
}));

// Insert schemas
export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
  createdAt: true,
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
});

// Types
export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
