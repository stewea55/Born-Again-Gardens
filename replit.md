# Born Again Gardens

## Overview

Born Again Gardens is a community garden nonprofit website serving central Indiana with fresh, organic produce on an honor system. The application allows community members to browse available plants, view harvest calendars, make donations, and manage their accounts. Administrators can manage plant inventory, sponsors, and user accounts.

The platform features:
- Plant inventory with 68+ varieties organized by category and harvest season
- Interactive harvest calendar showing seasonal availability
- Honor-based donation system ("Take what you need, pay what you can")
- Sponsor recognition tiers for donors
- User dashboard with donation tracking and preferences
- Admin dashboard for content management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Build Tool**: Vite with React plugin

The frontend follows a component-based architecture with:
- Reusable UI components in `client/src/components/ui/`
- Feature components in `client/src/components/`
- Page components in `client/src/pages/`
- Custom hooks in `client/src/hooks/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Style**: RESTful JSON API under `/api/*` routes
- **Session Management**: Express session with PostgreSQL store (connect-pg-simple)

The server structure:
- `server/index.ts` - Express app setup and middleware
- `server/routes.ts` - API route registration
- `server/storage.ts` - Data access layer abstraction
- `server/db.ts` - Database connection using Drizzle ORM

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema validation
- **Schema Location**: `shared/schema.ts` for all table definitions
- **Migrations**: Drizzle Kit with `migrations/` output directory

Key database tables:
- `users` - User accounts with role-based access
- `sessions` - Session storage for authentication
- `plants` - Plant inventory with harvest windows and metadata
- `sponsors` - Donor recognition entries with tier levels
- `donations` - User donation records
- `userPreferences` - User notification settings
- `cartItems` - Shopping cart persistence

### Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Implementation**: Passport.js with custom OIDC strategy
- **Session Storage**: PostgreSQL-backed sessions
- **Location**: `server/replit_integrations/auth/`

Authentication flow:
1. User initiates login via `/api/login`
2. Redirected to Replit OIDC provider
3. Callback processes tokens and creates/updates user
4. Session established with user claims

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds static assets, esbuild bundles server code
- **Output**: `dist/public/` for client, `dist/index.cjs` for server

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect authentication provider
- **PostgreSQL**: Primary database (provisioned via Replit)

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `@radix-ui/*` - Accessible UI primitives
- `passport` / `openid-client` - Authentication
- `express-session` / `connect-pg-simple` - Session management
- `zod` / `drizzle-zod` - Schema validation
- `tailwindcss` - Utility-first CSS framework

### Design System
- Custom color palette with CSS variables for light/dark themes
- Typography: Inter (UI), Merriweather (body/educational)
- Design guidelines documented in `design_guidelines.md`