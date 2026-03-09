"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";

const VISIT_KEY = "bag_dedicate_tree_popup_seen";

export default function DedicateTreePopup({ quantityRemaining, imageUrl }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!Number.isFinite(Number(quantityRemaining)) || Number(quantityRemaining) <= 0) return;
    const seen = window.sessionStorage.getItem(VISIT_KEY);
    if (seen) return;
    window.sessionStorage.setItem(VISIT_KEY, "1");
    setOpen(true);
  }, [quantityRemaining]);

  const handleDedicateClick = () => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    setOpen(false);
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/dedicate`
      }
    });
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
      <div className="modal dedicate-popup-modal" onClick={(event) => event.stopPropagation()}>
        <h2 className="subheading">Dedicate a Tree</h2>
        {imageUrl ? (
          <div className="image-placeholder image-placeholder--natural dedicate-popup-image">
            <img src={imageUrl} alt="Dedicate a tree campaign" />
          </div>
        ) : null}
        <p className="subtitle" style={{ textAlign: "center" }}>
          A Living Legacy
        </p>
        <p className="paragraph">
          Dedicate a tree in honor of someone you love, in memory of someone you miss, or perhaps to
          celebrate a family or group you&apos;re proud of.
          <br />
          <br />
          Secure your tree and custom 6&quot;x4&quot; dedication sign in stainless steel or brass.
        </p>
        <p className="paragraph">
          <strong>{Number(quantityRemaining)} trees remaining</strong>
        </p>
        <div className="modal-actions">
          <button type="button" className="button" onClick={handleDedicateClick}>
            Dedicate a tree
          </button>
          <button type="button" className="menu-button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
