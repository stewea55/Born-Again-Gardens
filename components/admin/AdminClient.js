"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "../../lib/supabase/browser";
import AdminTableEditor from "./AdminTableEditor";
import SponsorsSectionLayoutEditorV2 from "./SponsorsSectionLayoutEditorV2";

const ADMIN_TABS = [
  {
    id: "plant_catalog",
    label: "Plant Catalog",
    description: "Edit plants shown on Harvest, including image, market price, and category.",
    columns: [
      { key: "id", label: "ID", type: "number" },
      { key: "name", label: "Name", type: "text" },
      { key: "scientific_name", label: "Scientific Name", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "market_price", label: "Market Price", type: "number" },
      { key: "unit", label: "Unit", type: "text" },
      { key: "image_url", label: "Image URL", type: "text" },
      { key: "description", label: "Description", type: "text" },
      { key: "in_stock", label: "In Stock", type: "boolean" }
    ],
    defaultNewRow: { in_stock: true }
  },
  {
    id: "guests",
    label: "Guests",
    description: "View and update guest checkout records.",
    columns: [
      { key: "full_name", label: "Full Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "payment_amount", label: "Payment Amount", type: "number" },
      { key: "donation_amount", label: "Donation Amount", type: "number" },
      { key: "payment_confirmation", label: "Payment Confirmation", type: "text" }
    ],
    defaultNewRow: {}
  },
  {
    id: "profiles",
    label: "Users (Profiles)",
    description: "Manage user profile data and role assignments.",
    columns: [
      { key: "email", label: "Email", type: "text" },
      { key: "full_name", label: "Full Name", type: "text" },
      { key: "role", label: "Role", type: "text" },
      { key: "avatar_url", label: "Avatar URL", type: "text" }
    ],
    defaultNewRow: { role: "user" }
  },
  {
    id: "user_preference",
    label: "Users (Preferences)",
    description: "Manage preferences linked to users.",
    columns: [
      { key: "user_id", label: "User ID", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "full_name", label: "Full Name", type: "text" },
      { key: "email_newsletter", label: "Email Newsletter (JSON)", type: "json" },
      { key: "volunteer_updates", label: "Volunteer Updates", type: "text" }
    ],
    defaultNewRow: { email_newsletter: { enabled: false } }
  },
  {
    id: "transaction",
    label: "Transactions",
    description: "Review and edit payment transactions.",
    columns: [
      { key: "user_id", label: "User ID", type: "text" },
      { key: "guest_id", label: "Guest ID", type: "text" },
      { key: "user_name", label: "User Name", type: "text" },
      { key: "guest_name", label: "Guest Name", type: "text" },
      { key: "payment", label: "Payment", type: "number" },
      { key: "donation_amount", label: "Donation Amount", type: "number" },
      { key: "status", label: "Status", type: "text" },
      { key: "stripe_id", label: "Stripe ID", type: "text" }
    ],
    defaultNewRow: {}
  },
  {
    id: "resources",
    label: "Resources",
    description: "Edit shared image and resource rows used around the site.",
    columns: [
      { key: "resource_name", label: "Resource Name", type: "text" },
      { key: "page", label: "Page", type: "text" },
      { key: "resource_type", label: "Resource Type", type: "text" },
      { key: "image_url", label: "Image URL", type: "text" }
    ],
    defaultNewRow: {}
  },
  {
    id: "shop_catalog",
    label: "Shop Catalog",
    description: "Edit product rows for the shop table.",
    columns: [
      { key: "image_url", label: "Image URL", type: "text" },
      { key: "price", label: "Price", type: "number" },
      { key: "quantity total", label: "Quantity Total", type: "number" },
      { key: "quantity_purchased", label: "Quantity Purchased (JSON)", type: "json" },
      { key: "quantity_remaining", label: "Quantity Remaining (JSON)", type: "json" }
    ],
    defaultNewRow: {}
  },
  {
    id: "upcoming_events",
    label: "Upcoming Events",
    description: "Create and publish volunteer upcoming events. Toggle visibility to show or hide on the volunteer page.",
    columns: [
      { key: "event_name", label: "Event Name", type: "text" },
      { key: "event_start_date", label: "Start Date", type: "date" },
      { key: "event_end_date", label: "End Date", type: "date" },
      { key: "event_start_time", label: "Start Time", type: "time" },
      { key: "event_end_time", label: "End Time", type: "time" },
      { key: "image_url", label: "Image URL", type: "text" },
      { key: "additional_textbox", label: "Additional Text", type: "text" },
      { key: "visibility", label: "Visible to users", type: "boolean" }
    ],
    defaultNewRow: { visibility: true }
  },
  {
    id: "sponsors_public",
    label: "Sponsors Card",
    description: "Manage sponsor rows (catalog data). Use layout editor below to place sponsors on home page.",
    columns: [
      { key: "id", label: "ID (UUID)", type: "text" },
      { key: "company_name", label: "Company Name", type: "text" },
      { key: "tier", label: "Tier", type: "text" },
      { key: "company_url", label: "Company URL", type: "text" },
      { key: "logo", label: "Logo URL", type: "text" }
    ],
    defaultNewRow: {}
  },
  {
    id: "volunteers",
    label: "Volunteer Signups",
    description: "View and adjust volunteer signup rows.",
    columns: [
      { key: "email", label: "Email", type: "text" },
      { key: "email_signup", label: "Email Signup", type: "boolean" }
    ],
    defaultNewRow: { email_signup: true }
  }
];

export default function AdminClient() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(ADMIN_TABS[0].id);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      setError("Supabase is not configured.");
      return;
    }

    let active = true;
    supabase.auth.getSession().then(async ({ data: { session: nextSession } }) => {
      if (!active) return;
      if (!nextSession?.access_token) {
        router.replace("/");
        return;
      }

      const meResponse = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${nextSession.access_token}` }
      });
      const meData = await meResponse.json().catch(() => ({ isAdmin: false }));
      if (!meData.isAdmin) {
        router.replace("/");
        return;
      }

      setSession(nextSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession?.access_token) {
        router.replace("/");
        return;
      }
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const activeTab = useMemo(
    () => ADMIN_TABS.find((item) => item.id === tab) || ADMIN_TABS[0],
    [tab]
  );

  if (loading) {
    return (
      <section className="section card">
        <p className="paragraph">Loading admin...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section card">
        <h1 className="title">Admin</h1>
        <p className="paragraph">{error}</p>
      </section>
    );
  }

  return (
    <>
      <section className="section card admin-card">
        <h1 className="title">Admin Dashboard</h1>
        <p className="paragraph">
          This admin page lets you edit live data, preview updates, and save changes when ready.
        </p>
        <div className="admin-tab-row">
          {ADMIN_TABS.map((item) => {
            const active = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                className={active ? "button" : "menu-button"}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <AdminTableEditor
        resource={activeTab.id}
        title={activeTab.label}
        description={activeTab.description}
        columns={activeTab.columns}
        defaultNewRow={activeTab.defaultNewRow}
        session={session}
      />
      {activeTab.id === "sponsors_public" ? <SponsorsSectionLayoutEditorV2 session={session} /> : null}
    </>
  );
}
