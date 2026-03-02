"use client";

import { getBrowserSupabaseClient } from "../lib/supabase/browser";

export default function CheckoutGateModal({ open, onClose, onContinueGuest, onGoogleSuccess }) {
  if (!open) return null;

  const handleGoogleSignIn = async () => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      onGoogleSuccess(data.session.user);
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/payment`
      }
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h2 className="subheading">Continue to payment</h2>
        <p className="paragraph">
          Choose one option to continue. Closing this popup keeps you on this page.
        </p>
        <div className="modal-actions">
          <button type="button" className="button" onClick={handleGoogleSignIn}>
            Sign in with Google
          </button>
          <button type="button" className="button secondary" onClick={onContinueGuest}>
            Continue as guest
          </button>
          <button type="button" className="menu-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
