"use client";

import { useEffect, useState } from "react";
import CreateAccountModal from "./CreateAccountModal";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";

export default function HomeReadyToVisitCard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setAuthChecked(true);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setIsSignedIn(Boolean(session?.user));
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsSignedIn(Boolean(session?.user));
      setAuthChecked(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!authChecked || isSignedIn) {
    return null;
  }

  return (
    <section className="section card">
      <h1 className="title">Ready to Visit?</h1>
      <p className="paragraph">
        Our garden will be open during daylight hours, May-October. Sign up to get notified about
        the happenings of our first garden, to track your donations, and to access your tax forms.
      </p>
      <div className="button-row">
        <CreateAccountModal label="Create Account" />
      </div>
    </section>
  );
}
