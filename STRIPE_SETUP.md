# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payment processing for your Born Again Gardens application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe API Keys (get these from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key (use sk_live_... for production)
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key (use pk_live_... for production)

# Stripe Webhook Secret (get this after setting up webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_...  # Your webhook signing secret
```

## Getting Your Stripe Keys

1. **Test Mode Keys** (for development):
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your "Publishable key" and "Secret key"
   - Add them to your `.env` file

2. **Live Mode Keys** (for production):
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your "Publishable key" and "Secret key"
   - Add them to your `.env` file

## Setting Up Webhooks

Webhooks allow Stripe to notify your application when payment events occur.

### For Local Development:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add it to your `.env` file

### For Production:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to your production `.env` file

## Testing Payments

### Test Card Numbers:

Use these test card numbers in the payment form:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Use any:
- Future expiry date (e.g., 12/34)
- Any 3-digit CVC
- Any ZIP code

## Features Implemented

✅ **Payment Intent Creation**: Creates Stripe payment intents for each payment
✅ **Stripe Elements Integration**: Secure card input using Stripe's pre-built UI components
✅ **Payment Confirmation**: Handles payment confirmation and success/failure states
✅ **Transaction Recording**: Records transactions in your database with Stripe payment intent IDs
✅ **Webhook Support**: Handles Stripe webhook events for payment status updates
✅ **Multiple Payment Types**: Supports basket payments, donations, and sponsorships

## Payment Flow

1. User enters payment amount (or uses cart total)
2. Frontend creates a payment intent via `/api/payments/create-intent`
3. User enters card details using Stripe Elements
4. Payment is confirmed via Stripe's API
5. On success, transaction is recorded via `/api/transactions` with payment intent ID
6. Webhook confirms payment status (optional but recommended)

## API Endpoints

- `GET /api/payments/config` - Returns Stripe publishable key
- `POST /api/payments/create-intent` - Creates a payment intent
- `POST /api/payments/confirm` - Confirms a payment intent (used internally)
- `POST /api/webhooks/stripe` - Handles Stripe webhook events
- `POST /api/transactions` - Records transaction after successful payment

## Troubleshooting

### "Stripe is not configured" error
- Check that `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set in your `.env` file
- Restart your server after adding environment variables

### Webhook signature verification failed
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- For local development, use the secret from `stripe listen` command
- For production, use the secret from your Stripe Dashboard webhook endpoint

### Payment form not loading
- Check browser console for errors
- Verify `/api/payments/config` returns the publishable key
- Ensure Stripe publishable key is valid

## Security Notes

- Never expose your secret key in client-side code
- Always use HTTPS in production
- Verify webhook signatures to ensure requests are from Stripe
- Store sensitive keys in environment variables, never in code

## Next Steps

1. Add your Stripe keys to `.env`
2. Test payments using test card numbers
3. Set up webhooks for production
4. Switch to live keys when ready for production
5. Monitor payments in Stripe Dashboard

For more information, visit: https://stripe.com/docs/payments
