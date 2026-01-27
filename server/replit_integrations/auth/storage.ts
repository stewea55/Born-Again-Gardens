import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Ensure id is provided (required for Google OAuth)
      if (!userData.id) {
        throw new Error("User ID is required");
      }

      // First, try to match by Google ID
      const [existingById] = await db.select().from(users).where(eq(users.id, userData.id));
      if (existingById) {
        const [updatedById] = await db
          .update(users)
          .set({
            email: userData.email ?? existingById.email,
            firstName: userData.firstName ?? existingById.firstName,
            lastName: userData.lastName ?? existingById.lastName,
            profileImageUrl: userData.profileImageUrl ?? existingById.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingById.id))
          .returning();

        if (!updatedById) {
          throw new Error("Failed to update user by ID");
        }
        return updatedById;
      }

      // Next, if we have an email, try to match by email to avoid unique constraint errors
      if (userData.email) {
        const [existingByEmail] = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email));

        if (existingByEmail) {
          const [updatedByEmail] = await db
            .update(users)
            .set({
              firstName: userData.firstName ?? existingByEmail.firstName,
              lastName: userData.lastName ?? existingByEmail.lastName,
              profileImageUrl: userData.profileImageUrl ?? existingByEmail.profileImageUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingByEmail.id))
            .returning();

          if (!updatedByEmail) {
            throw new Error("Failed to update user by email");
          }
          return updatedByEmail;
        }
      }

      const [user] = await db.insert(users).values(userData).returning();
      
      if (!user) {
        throw new Error("Failed to upsert user");
      }
      
      return user;
    } catch (error) {
      console.error("[Auth Storage] Error upserting user:", error);
      console.error("[Auth Storage] User data:", JSON.stringify(userData, null, 2));
      throw error;
    }
  }
}

export const authStorage = new AuthStorage();
