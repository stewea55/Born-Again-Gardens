import { type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";

/**
 * Security middleware for protecting user data and payment information
 */

// Sanitize sensitive data from logs
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== "object") return data;
  
  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "key",
    "creditCard",
    "cardNumber",
    "cvv",
    "ssn",
    "email",
    "phone",
    "address",
    "clientSecret",
    "paymentMethodId",
    "paymentIntentId",
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Rate limiting for API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Trust proxy for accurate IP detection
});

// Stricter rate limiting for payment endpoints
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment requests per windowMs
  message: "Too many payment requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  trustProxy: true,
});

// Rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  trustProxy: true,
});

// Validate payment amounts
export function validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
  if (typeof amount !== "number" || isNaN(amount)) {
    return { valid: false, error: "Amount must be a valid number" };
  }
  
  if (amount <= 0) {
    return { valid: false, error: "Amount must be greater than zero" };
  }
  
  // Maximum payment amount: $100,000
  if (amount > 100000) {
    return { valid: false, error: "Amount exceeds maximum allowed" };
  }
  
  // Minimum payment amount: $0.50
  if (amount < 0.5) {
    return { valid: false, error: "Amount must be at least $0.50" };
  }
  
  // Check for reasonable decimal places (max 2)
  const decimalPlaces = (amount.toString().split(".")[1] || "").length;
  if (decimalPlaces > 2) {
    return { valid: false, error: "Amount can have at most 2 decimal places" };
  }
  
  return { valid: true };
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Strict Transport Security (HTTPS only in production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com"
  );
  
  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions Policy
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  next();
}

// Validate session secret in production
export function validateSessionSecret(): void {
  if (process.env.NODE_ENV === "production") {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret === "your-secret-key-change-this" || sessionSecret.length < 32) {
      throw new Error(
        "CRITICAL SECURITY ERROR: SESSION_SECRET must be set to a strong random string (at least 32 characters) in production!"
      );
    }
  }
}

// Validate Stripe webhook secret in production
export function validateWebhookSecret(): void {
  if (process.env.NODE_ENV === "production") {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !webhookSecret.startsWith("whsec_")) {
      throw new Error(
        "CRITICAL SECURITY ERROR: STRIPE_WEBHOOK_SECRET must be set in production for webhook verification!"
      );
    }
  }
}
