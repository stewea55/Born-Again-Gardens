# Quick Stripe Testing Guide

## Step 1: Add Your Stripe Keys to .env

Open your `.env` file and add these two lines (get the keys from https://dashboard.stripe.com/test/apikeys):

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

**Note:** You can skip `STRIPE_WEBHOOK_SECRET` for basic testing - it's optional.

## Step 2: Start Your Development Server

```bash
npm run dev
```

The server should start on `http://localhost:5000`

## Step 3: Test the Payment Flow

### Option A: Test with Basket Payment
1. Go to your plants page and add items to cart
2. Go to basket and click checkout
3. You'll be redirected to the payment page
4. Use test card: **4242 4242 4242 4242**
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

### Option B: Test with Donation
1. Go to `/donate` page
2. Enter an amount (e.g., $10.00)
3. Fill in your information
4. Click to proceed to payment
5. Use the same test card above

## Step 4: Verify It Works

✅ **Success indicators:**
- Payment form loads without errors
- Card input appears and accepts card number
- Payment processes successfully
- You see "Payment successful" message
- Transaction is recorded in your database

❌ **If something fails:**
- Check browser console for errors
- Check server logs for error messages
- Verify your Stripe keys are correct
- Make sure you're using test mode keys (start with `sk_test_` and `pk_test_`)

## Test Card Numbers

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

All use: Any future expiry, any CVC, any ZIP

## Quick Troubleshooting

**"Stripe is not configured"**
→ Check your `.env` file has the keys set correctly

**"Payment form not loading"**
→ Check browser console - might be missing publishable key

**"Payment failed"**
→ Check server logs - might be missing secret key or invalid keys

## What Happens During Testing

1. ✅ Payment intent is created (check Stripe Dashboard → Payments)
2. ✅ Card details are collected securely via Stripe Elements
3. ✅ Payment is processed through Stripe
4. ✅ Transaction is saved to your database
5. ⚠️ Webhook events are skipped (OK for testing without webhook secret)

## Next Steps After Testing

Once basic testing works:
1. Set up webhook secret for production-ready testing
2. Test with different card scenarios (decline, 3D Secure)
3. Switch to live keys when ready for production
