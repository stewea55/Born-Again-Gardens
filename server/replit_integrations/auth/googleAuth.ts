import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { authStorage } from "./storage";

export function setupGoogleAuth() {
  // Construct callback URL - use BASE_URL from env or default to localhost for development
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || "5000"}`;
  const callbackURL = `${baseUrl}/api/auth/google/callback`;

  console.log(`[Google Auth] Initializing with callback URL: ${callbackURL}`);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log(`[Google Auth] Processing profile for: ${profile.emails?.[0]?.value || profile.id}`);
          
          // Validate required fields
          if (!profile.id) {
            console.error("[Google Auth] Missing profile ID");
            return done(new Error("Missing profile ID"), undefined);
          }

          const email = profile.emails?.[0]?.value || null;
          if (!email) {
            console.warn(`[Google Auth] No email found for profile ${profile.id}`);
          }

          // Find or create user in database
          const user = await authStorage.upsertUser({
            id: profile.id,
            email: email,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
          });
          
          console.log(`[Google Auth] Successfully upserted user: ${user.email || user.id}`);
          return done(null, user);
        } catch (error) {
          console.error("[Google Auth] Error in OAuth callback:", error);
          return done(error, undefined);
        }
      }
    )
  );

  // Serialize user for session (saves user ID to session)
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session (loads user from database using ID)
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authStorage.getUser(id);
      if (!user) {
        console.warn(`[Google Auth] User not found during deserialization: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error(`[Google Auth] Error deserializing user ${id}:`, error);
      done(error, null);
    }
  });
}
