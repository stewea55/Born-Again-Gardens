# Born Again Gardens Design Guidelines

## Design Approach
**Reference-Based: Community-Focused Nonprofit**

Drawing inspiration from:
- **charity: water** - Clean, mission-driven storytelling with emotional impact
- **Patagonia Environmental** - Authentic, nature-connected design with strong educational component
- **Local Harvest/Farmer's Market Aesthetics** - Community-centric, approachable, transparent

Core Principles:
1. Warmth & Accessibility - Inviting to all community members
2. Educational Clarity - Complex plant data presented simply
3. Trust & Transparency - Honor system requires design that builds confidence
4. Mobile-First - Community members browse on-site at the garden

---

## Typography System

**Font Families (Google Fonts):**
- **Headlines/Display:** Inter (weights: 600, 700) - Clean, modern, trustworthy
- **Body/UI:** Inter (weights: 400, 500) - Excellent readability, pairs with itself
- **Accent/Educational:** Merriweather (weight: 400) - For plant descriptions, adds warmth

**Scale:**
- Hero Headline: text-5xl md:text-6xl lg:text-7xl
- Section Headers: text-3xl md:text-4xl
- Subsections: text-xl md:text-2xl
- Body: text-base md:text-lg
- Small/Meta: text-sm

---

## Layout System

**Spacing Primitives:** Tailwind units of **4, 6, 8, 12, 16, 20, 24** (e.g., p-4, mb-8, gap-6)

**Container Strategy:**
- Full-width hero: w-full
- Content sections: max-w-7xl mx-auto px-4 md:px-8
- Narrow content (educational): max-w-4xl mx-auto
- Cards/grid content: max-w-6xl mx-auto

**Grid Patterns:**
- Plant inventory grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Feature sections: grid-cols-1 lg:grid-cols-2 gap-12
- Donor tiers: grid-cols-2 md:grid-cols-4 gap-4
- Dashboard stats: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6

---

## Component Library

### Navigation
- Sticky header with logo left, nav center, "Sign In" + "Donate" CTAs right
- Mobile: Hamburger menu with slide-in drawer
- Prominent garden mission tagline beneath logo
- Icons: Heroicons (outline for nav, solid for active states)

### Hero Section
- Large hero image: Full-width, h-[600px] md:h-[700px] with garden/produce imagery
- Overlay gradient for text legibility
- Centered content with mission statement (text-5xl md:text-7xl font-bold)
- Dual CTAs: Primary "Support Our Mission" + Secondary "Visit the Garden" with backdrop-blur-sm bg-white/20
- Floating stats badge: "68 Plant Varieties • Honor System • 100% Community"

### Authentication Prompt
- Modal overlay with backdrop-blur
- Clear benefit bullets: "Track Donations • Get Harvest Alerts • Access Tax Forms"
- Google sign-in button (large, prominent)
- Guest continue option (text-link, less prominent but visible)
- Dismissible with reminder on cart access

### Plant Inventory Display
- Card-based grid layout
- Each card: Plant image top, name (text-lg font-semibold), harvest window badge, "Learn More" expansion
- Expanded: Medicinal benefits, harvest instructions, current availability status
- Filter bar: Season, Type (Fruit/Vegetable/Herb/Flower), Currently Available
- Visual availability indicator: Green dot (ready now), Yellow (2-4 weeks), Gray (out of season)

### Harvest Calendar
- Monthly timeline view with plant icons
- Current month highlighted prominently
- Clickable months reveal detailed plant list
- Visual key: Icons for fruits, vegetables, herbs, flowers

### Donor Recognition Section
- Tiered display without competitive ranking
- Layout: 4-column grid (Platinum/Gold/Silver/Bronze)
- Each tier: Elegant icon, "Thank you to our supporters" heading, names in simple list
- Emphasis on gratitude over amounts
- CTA: "Join our supporters" leading to donation page

### Honor System Cart
- Sticky sidebar on desktop, bottom sheet on mobile
- Clear heading: "Estimate Your Harvest"
- Item list with quantity adjusters
- Suggested donation (not "price") with range indicator
- Prominent reminder: "Take what you need, pay what you can" in warm, non-judgmental tone
- Checkout leads to payment with account creation option

### User Dashboard
- Card-based layout with 4 key sections:
  1. Donation summary (total, year-to-date, chart)
  2. Current harvest availability (3-4 featured items with images)
  3. Coming soon (upcoming 2-4 weeks)
  4. Quick actions (Download tax form, Update preferences, View full calendar)
- Welcome message with user's name and last visit date

### Educational Content Cards
- Clean, spacious layout for readability
- Plant name + scientific name
- Tabbed sections: Growth Timeline, Medicinal Benefits, Harvest Instructions
- Icon-driven visual hierarchy
- Imagery for each plant variety

### Footer
- 3-column layout: About/Mission, Quick Links, Contact/Social
- Newsletter signup with clear benefit ("Monthly garden updates")
- Social media feed preview (latest 3 posts)
- Email marketing opt-in checkbox integrated
- Founding story snippet with "Learn More" link

---

## Images

**Hero Section:**
- Large, vibrant hero image showing diverse produce or community members harvesting
- Image should convey abundance, community, and healthy food access
- Natural lighting, authentic (not stock-looking)

**Plant Inventory:**
- Individual plant photos for each of the 68 varieties
- Consistent style: natural light, clear focus on plant/produce
- Square aspect ratio (1:1) for grid consistency

**Educational Sections:**
- Instructional images for harvest techniques (hands harvesting, proper tools)
- Companion planting diagrams where relevant

**About/Mission:**
- Photos of garden space, volunteers, community members
- Authentic, candid shots that convey warmth and inclusivity

**Social Feed:**
- Pull images directly from connected social accounts
- Display in masonry or uniform grid based on source platform

---

## Animations

**Minimal, Purposeful Motion:**
- Smooth scroll for anchor navigation
- Fade-in on scroll for educational cards (once)
- Gentle hover lift (translate-y-1) on clickable cards
- No parallax, no complex scroll triggers
- Loading states: Simple spinner, no skeleton screens

---

## Accessibility
- Maintain WCAG AA contrast standards
- Focus states: ring-2 ring-offset-2 for all interactive elements
- Form inputs: Clear labels, helpful error messages, success states
- Skip navigation link for keyboard users
- Alt text for all plant/garden imagery
- Semantic HTML throughout (nav, main, article, aside)