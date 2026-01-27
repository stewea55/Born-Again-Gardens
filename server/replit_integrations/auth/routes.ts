import type { Express } from "express";
import passport from "passport";
import { authStorage } from "./storage";

export function registerAuthRoutes(app: Express): void {
  // Login route - redirects to Google OAuth
  app.get("/api/login", (req, res) => {
    try {
      console.log(`[Auth] Login request from ${req.ip}`);
      res.redirect("/api/auth/google");
    } catch (error) {
      console.error("[Auth] Error in login route:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Initiate Google OAuth login
  app.get("/api/auth/google", (req, res, next) => {
    try {
      console.log(`[Auth] Initiating Google OAuth from ${req.ip}`);
      passport.authenticate("google", {
        scope: ["profile", "email"]
      })(req, res, next);
    } catch (error) {
      console.error("[Auth] Error initiating Google OAuth:", error);
      res.status(500).json({ error: "Failed to initiate authentication" });
    }
  });

  // Google OAuth callback
  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      console.log(`[Auth] Google OAuth callback received`);
      const authenticate = passport.authenticate("google", { 
        failureRedirect: "/?error=auth_failed",
        session: true
      });
      authenticate(req, res, (err?: Error | null) => {
        if (err) {
          console.error("[Auth] Authentication error:", err);
          console.error("[Auth] Error details:", err?.message, err?.stack);
          return res.redirect("/?error=auth_failed&details=" + encodeURIComponent(err?.message || "unknown"));
        }
        if (!(req as any).user) {
          console.error("[Auth] No user object after authentication");
          return res.redirect("/?error=auth_failed&details=no_user");
        }
        next();
      });
    },
    (req, res) => {
      try {
        const user = (req as any).user;
        if (!user) {
          console.error("[Auth] No user in request after authentication");
          return res.redirect("/?error=auth_failed&details=no_user_session");
        }
        console.log(`[Auth] Successful authentication for user: ${user.email || user.id}`);
        // Successful authentication, redirect to home
        res.redirect("/");
      } catch (error) {
        console.error("[Auth] Error in callback handler:", error);
        res.redirect("/?error=auth_failed&details=callback_error");
      }
    }
  );

  // Get current authenticated user
  app.get("/api/auth/user", (req: any, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout - support both GET and POST
  app.get("/api/logout", (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error("[Auth] Logout error:", err);
        return res.redirect("/?error=logout_failed");
      }
      res.redirect("/");
    });
  });

  app.post("/api/logout", (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}