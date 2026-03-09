"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";
import { overwriteProfileWithGuestCart } from "../lib/cart/client-cart";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About Us" },
  { href: "/donate", label: "Donate" },
  { href: "/dedicate", label: "Dedicate a Tree" },
  { href: "/sponsorships", label: "Sponsorships" },
  { href: "/shop", label: "Shop" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/harvest", label: "Harvest" }
];

export default function Header({ logoUrl }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        overwriteProfileWithGuestCart(supabase);
        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
          .then((res) => res.json())
          .then((data) => setIsAdmin(data.isAdmin === true))
          .catch(() => setIsAdmin(false));
      } else {
        setIsAdmin(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        overwriteProfileWithGuestCart(supabase);
        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
          .then((res) => res.json())
          .then((data) => setIsAdmin(data.isAdmin === true))
          .catch(() => setIsAdmin(false));
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const handleSignIn = () => {
    const supabase = getBrowserSupabaseClient();
    if (supabase) supabase.auth.signInWithOAuth({ provider: "google" });
    setMenuOpen(false);
  };

  const handleDedicateTreeClick = (e) => {
    setMenuOpen(false);
    if (user) {
      router.push("/dedicate");
      return;
    }
    e.preventDefault();
    const supabase = getBrowserSupabaseClient();
    if (supabase) {
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/dedicate` }
      });
    }
  };

  const handleSignOut = async () => {
    const supabase = getBrowserSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-group">
          <Link href="/" className="logo-link" aria-label="Born Again Gardens – Home">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Born Again Gardens"
                width={56}
                height={56}
                className="header-logo"
                unoptimized
              />
            ) : (
              <div className="logo-placeholder" aria-hidden="true">
                BAG
              </div>
            )}
          </Link>
          <span className="site-name">Born Again Gardens</span>
        </div>
        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-label="Open menu"
        >
          ☰
        </button>
        {menuOpen && (
          <>
            <div
              className="menu-backdrop"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <nav className="menu-panel" aria-label="Site">
              {navLinks.map((link) =>
                link.href === "/dedicate" ? (
                  <button
                    key={link.href}
                    type="button"
                    className="menu-link-button"
                    onClick={handleDedicateTreeClick}
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </Link>
                )
              )}
              {user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>
                      Admin dashboard
                    </Link>
                  )}
                  <Link href="/account" onClick={() => setMenuOpen(false)}>
                    View my profile
                  </Link>
                  <button type="button" className="menu-link-button" onClick={handleSignOut}>
                    Sign out
                  </button>
                </>
              ) : (
                <button type="button" className="menu-link-button" onClick={handleSignIn}>
                  Sign in
                </button>
              )}
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
