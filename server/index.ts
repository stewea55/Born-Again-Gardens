import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import passport from "passport";
import session from "express-session";
import { setupGoogleAuth } from "./replit_integrations/auth/googleAuth";
import { registerAuthRoutes } from "./replit_integrations/auth/routes";
import { stripe } from "./utils/stripe";
import Stripe from "stripe";
import { securityHeaders, sanitizeForLogging, validateSessionSecret, validateWebhookSecret } from "./middleware/security";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Register Stripe webhook route BEFORE json middleware (needs raw body)
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // In production, webhook secret is REQUIRED (validated at startup)
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "Webhook secret not configured" });
    }
    console.warn("[Stripe] Webhook secret not configured - webhook verification skipped (OK for testing)");
    res.json({ received: true, warning: "Webhook secret not configured - verification skipped" });
    return;
  }

  let event: Stripe.Event;

  try {
    // Use the raw body buffer for signature verification
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe] Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("[Stripe] PaymentIntent succeeded:", paymentIntent.id);
      // Payment intent succeeded - transaction should already be created
      // You can update transaction status here if needed
      break;
    case "payment_intent.payment_failed":
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log("[Stripe] PaymentIntent failed:", failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Apply security headers globally
app.use(securityHeaders);

// Validate security settings BEFORE starting server
try {
  validateSessionSecret();
  validateWebhookSecret();
} catch (error: any) {
  console.error("\n" + "=".repeat(60));
  console.error("🚨 SECURITY VALIDATION FAILED");
  console.error("=".repeat(60));
  console.error(error.message);
  console.error("=".repeat(60) + "\n");
  process.exit(1);
}

// Setup session middleware (before routes)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Setup Google OAuth
setupGoogleAuth();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Sanitize sensitive data before logging
        const sanitized = sanitizeForLogging(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(sanitized)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Register auth routes
  registerAuthRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

    // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  httpServer.listen(port, (err?: Error) => {
    if (err) {
      log(`Error starting server: ${err.message}`);
      process.exit(1);
    }
    log(`Config: PORT=${port} BASE_URL=${baseUrl}`);
    log(`Serving on port ${port}`);
  });
})();