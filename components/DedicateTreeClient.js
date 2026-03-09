"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";
import { saveCheckoutContext } from "../lib/checkout/client-checkout-context";

const FIXED_PRICE = 350;

export default function DedicateTreeClient({ initialCampaign }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [campaign, setCampaign] = useState(initialCampaign || null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    dedication_text: "",
    dedication_image: ""
  });

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setLoadingAuth(false);
      setStatus("Supabase is not configured.");
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data?.session || null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      full_name: prev.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
      email: prev.email || user.email || ""
    }));
  }, [session]);

  useEffect(() => {
    let active = true;
    async function loadCampaign() {
      setLoadingCampaign(true);
      try {
        const response = await fetch("/api/dedicate/campaign", { cache: "no-store" });
        const payload = await response.json();
        if (!active) return;
        setCampaign(payload?.data || null);
      } catch {
        if (active) setStatus("Could not load dedicate campaign right now.");
      } finally {
        if (active) setLoadingCampaign(false);
      }
    }
    loadCampaign();
    return () => {
      active = false;
    };
  }, []);

  const soldOut = useMemo(() => {
    if (!campaign) return false;
    return !campaign.active || Number(campaign.quantity_remaining || 0) <= 0;
  }, [campaign]);

  const handleGoogleSignIn = async () => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      setSession(data.session);
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dedicate`
      }
    });
  };

  const uploadImage = async (file) => {
    if (!file) return;
    setStatus("");
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setStatus("Supabase is not configured.");
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setStatus("Please sign in with Google before uploading.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/dedicate/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Could not upload image.");
      }
      const publicUrl = payload?.data?.publicUrl || "";
      setForm((prev) => ({ ...prev, dedication_image: publicUrl }));
      setStatus("Image uploaded.");
    } catch (error) {
      setStatus(error.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      setStatus("Please sign in with Google first.");
      return;
    }
    if (soldOut) {
      setStatus("This campaign is sold out.");
      return;
    }

    const fullName = form.full_name.trim();
    const email = form.email.trim();
    const dedicationText = form.dedication_text.trim();

    if (!fullName || !email || !dedicationText) {
      setStatus("Please complete name, email, and dedication text.");
      return;
    }
    if (dedicationText.length > 200) {
      setStatus("Dedication text must be 200 characters or fewer.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    saveCheckoutContext({
      flow_type: "dedicate_tree",
      entry_mode: "google",
      payment_amount: FIXED_PRICE,
      donation_amount: 0,
      checkout_context: {
        full_name: fullName,
        email,
        dedication_text: dedicationText,
        ...(form.dedication_image ? { dedication_image: form.dedication_image } : {})
      },
      guest: null,
      google_user: {
        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
        email: session.user.email || ""
      }
    });
    router.push("/payment");
  };

  const imageUrl = campaign?.image_url || null;

  return (
    <section className="section card">
      <h2 className="subheading">Dedicate a Tree</h2>
      {(loadingAuth || loadingCampaign) && <p className="paragraph">Loading...</p>}

      {!session?.user ? (
        <>
          <p className="paragraph">
            Sign in with Google to dedicate a tree. Guest checkout is not available for this campaign.
          </p>
          <div className="button-row" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="button" onClick={handleGoogleSignIn}>
              Sign in with Google
            </button>
          </div>
        </>
      ) : soldOut ? (
        <p className="paragraph">This campaign is sold out.</p>
      ) : (
        <>
          {imageUrl ? (
            <div className="image-placeholder image-placeholder--natural">
              <img src={imageUrl} alt="Dedicate a tree campaign" />
            </div>
          ) : null}
          <p className="subtitle" style={{ textAlign: "center" }}>A Living Legacy</p>
          <p className="paragraph">
            Dedicate a tree in honor of someone you love, in memory of someone you miss, or perhaps to
            celebrate a family or group you&apos;re proud of.
            <br />
            <br />
            Secure your tree and custom 6&quot;x4&quot; dedication sign in stainless steel or brass.
            In addition to custom wording, signs can include photos/icons/logos.
            <br />
            <br />
            You will also be invited to our tree planting and dedication day on Arbor Day.
            <br />
            <br />
            After your purchase, we will contact you with a design for you to confirm.
          </p>
          <p className="paragraph">
            <strong>Price: ${FIXED_PRICE.toFixed(2)}</strong>
            <br />
            <strong>{Number(campaign?.quantity_remaining || 0)} trees remaining</strong>
          </p>

          <label className="paragraph">
            Full name
            <input
              type="text"
              value={form.full_name}
              onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
            />
          </label>
          <label className="paragraph">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label className="paragraph">
            Dedication text (max 200 characters)
            <textarea
              value={form.dedication_text}
              onChange={(event) => setForm((prev) => ({ ...prev, dedication_text: event.target.value }))}
              maxLength={200}
              rows={4}
            />
          </label>
          <p className="paragraph">{form.dedication_text.length}/200</p>

          <label className="paragraph">
            Optional dedication image (JPG, PNG, WEBP, GIF up to 5MB)
            <input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} />
          </label>
          {form.dedication_image ? (
            <p className="paragraph">
              Uploaded image:
              <br />
              <a className="link" href={form.dedication_image} target="_blank" rel="noreferrer">
                {form.dedication_image}
              </a>
            </p>
          ) : null}

          <div className="button-row" style={{ justifyContent: "flex-start" }}>
            <button
              type="button"
              className="button"
              onClick={handleSubmit}
              disabled={submitting || uploading}
            >
              {submitting ? "Preparing..." : "Dedicate a tree"}
            </button>
          </div>
        </>
      )}
      {status ? <p className="paragraph">{status}</p> : null}
    </section>
  );
}
