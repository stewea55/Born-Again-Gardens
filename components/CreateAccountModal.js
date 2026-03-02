"use client";

import { useState } from "react";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";

export default function CreateAccountModal({ label = "Create Account" }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  const handleGoogleSignIn = async () => {
    setStatus("");
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setStatus("Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Google sign-in.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) {
      setStatus(error.message);
    }
  };

  return (
    <>
      <button type="button" className="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="subheading">Create Account</h2>
            <p className="paragraph">Choose how you want to continue.</p>
            <div className="modal-actions">
              <button type="button" className="button" onClick={handleGoogleSignIn}>
                Sign in with Google
              </button>
              <button type="button" className="menu-button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            {status && <p className="paragraph">{status}</p>}
          </div>
        </div>
      )}
    </>
  );
}
