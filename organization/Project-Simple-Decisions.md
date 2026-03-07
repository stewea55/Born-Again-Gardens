# Project Simple Decisions

A short, simple summary of what we decided. Written so a 5th grader could get it.  
**When Project-Decisions.md is updated, update this file too** — same sections, 1–2 sentences each.

---

## Platform and infra

We use Supabase for login and data, Stripe for payments, and we'll host the site on Vercel or Railway.

## API

Our API lives at bornagaingardens.org/api/v1 and we version it from day one. Things we might want to change later (like hero images) live in the database and the site gets them through the API. All the words on the pages stay in the code, not in the database. We follow clear rules: GET only reads, POST creates, PATCH updates, DELETE removes. We use one endpoint with filters (like /plants?status=available) instead of lots of different URLs. User stuff lives under /me. We use snake_case everywhere. Every response has the same shape (data + meta), and errors look the same too. We keep it simple so it's easy to work with and can be cached later if we need it.

## Product

The app lets people donate, pay for things, and see updates. The main thing everyone can look at is the plant catalog.

## Data and access

The plant catalog is for everyone to look at (read-only). We filter by type (fruit, vegetable, herb, flower) and only show plants that are in harvest this month. The catalog price field is now called market_price. Only payment and checkout history are private; those are protected so only the right person or our backend can see them.

**Date:** 2026-03-01  
Plant catalog pricing now uses `market_price` (same idea as before, new field name).

## Database (Supabase)

We keep everything in the public schema. Our tables (exact names in Supabase) are: hero_images, plant_catalog, profiles, user_preference, sponsors_public, sponsors_section_config, guests, transaction, harvest_quantity, resources, volunteers, shop_catalog. Guest checkouts go in the guests table. The sponsors table (sponsors_public) is for the home page "Our Generous Sponsors" only; anyone can see it, only admins can edit it. We turn on security (RLS) per table so only the right people can see or change data. Form-API-to-DB.md tracks which form fields go to which table and column.

**Date:** 2026-02-25  
For profiles, new users get a profile row through the auth trigger, and RLS only allows inserting a row for your own user id.
Profiles are the parent record and preferences point to them, not the other way around.
The trigger also creates a simple preferences row for each new user.

## Guest (no login)

If someone checks out as a guest, we save a one-time record in the guests table. We don't remember them next time; they're a new visitor unless they log in.

## Company / sponsor (contact only)

Companies don't pay on the website. They contact us (email info@bornagaingardens.org or phone 317-385-4165) and we handle payment offline. The sponsorships page shows how to contact us. We add sponsor names to the home page by hand when a company donates.

## Auth and checkout

On the payment page, the person must pick one: sign in with Google or checkout as guest. They fill out the guest form (if guest) and check the privacy policy before paying. If they're already signed in with Google, we use their Google name and email and they just check the privacy policy and pay. Everyone can delete their account from the dashboard; we tell them we may keep some info we need for the law. Admins now use the `/admin` page to edit core tables through the app (with Supabase security still in charge).

## Frontend / UI

The big picture at the top of each page (hero) goes edge-to-edge with no rounded corners and the same size and transparency everywhere. The logo in the header comes from the database (the "bag_logo" image in the resources table) and when you click it you go to the home page. If we don't have that image yet, we show a simple circle with "BAG" instead.

**Date:** 2026-02-25  
On the profile page, there is a Sign out button so users can log out without deleting their profile.

**Date:** 2026-02-26  
Payments follow these routes: shop to cart to payment, harvest to basket to payment, donate to payment. There is no payment from the sponsorships page—companies contact us instead.
Cart, basket, and donate require a popup choice (Google or guest) before payment.
Guest checkout uses full_name and email. Guests use the browser to remember their cart and basket; when they pay we save that into the guests table. Signed-in users have their cart and basket saved on the server in their profile. If someone was a guest and then signs in, their guest cart and basket replace whatever was in their profile.
We are using Stripe test keys (sandbox) while building locally and will switch keys for production later.
The payment form appears on our payment page (Stripe Embedded Checkout). We create the Stripe session first, then save the transaction with that session id; when Stripe tells us payment is done, we update by that id.

**Date:** 2026-03-01  
The admin page now has tabs to edit plants, users, guests, transactions, resources, shop rows, sponsors, and volunteer signups.  
Volunteer upcoming events are now editable from admin and show as clickable bullets on the volunteer page.  
The home sponsors section now reads from the sponsors table, so logo changes in admin show on the site.

**Date:** 2026-03-02  
The admin dashboard link in the hamburger menu and the `/admin` page are only for users who are admins. Regular signed-in users never see the link; if someone tries to open `/admin` without being an admin, they are sent back to the home page.
The sponsors editor now has a catalog + canvas in admin only. Logo and name are separate objects, so we can place, resize, and remove them independently. Clicking X removes only that object from the canvas, not the sponsor row in the database.
The home sponsors section now only shows logo + company name from the last saved admin canvas layout, and visitors cannot edit it.
The home page "Ready to Visit?" card (with the Create Account button) is only for people who are signed out. If someone is already signed in, that whole card is hidden.

**Date:** 2026-03-07  
On basket, wording now says Market Price and Payment Amount, and each plant line shows price per unit from the plant catalog.  
On harvest, Add to basket and Confirm never show together: quantity 0 means Add (click-outside closes), quantity above 0 means Confirm (only Confirm closes and saves).  
We removed temporary shop/payment wording and added a new homepage wishlist link card.

**Date:** 2026-03-07 (Basket CYA)  
We added a disclaimer on the basket page that selections are for in-person harvest planning only. We removed the "Closing this popup keeps you on this page" line from the sign-in popup. When someone pays from the basket flow, they must check a box saying they understand basket items are for in-person harvest planning only; donate and cart flows are unchanged.

**Date:** 2026-03-07  
On the shop page, when we have products the first card now shows "Our shop" so it’s never empty; the “still building” message still shows when there are no products.

**Date:** 2026-03-07 (Zero-payment harvest)  
If someone submits the basket with $0 payment, we don't show the sign-in popup. We record their harvest quantities in the database (same as when they pay), clear their basket, and send them to a thank-you page at /harvested that says thanks for visiting and suggests volunteering.
