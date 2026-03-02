"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "../../lib/supabase/browser";

const TEXT_FIELDS = [
  { key: "email", label: "Email", type: "email" },
  { key: "full_name", label: "Full name", type: "text" }
];

const CHECKBOX_FIELDS = [
  { key: "email_newsletter", label: "Email newsletter", getValue: (checked) => (checked ? { enabled: true } : { enabled: false }) },
  { key: "volunteer_updates", label: "Volunteer updates", getValue: (checked) => (checked ? "yes" : null) }
];

function DeleteProfileModal({ open, onClose, onConfirm, deleting }) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-profile-title"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="delete-profile-title" className="subheading">
          Are you sure?
        </h2>
        <p className="paragraph">
          This will delete your profile and preferences. You can sign in again later to create a new account.
        </p>
        <div className="modal-actions">
          <button type="button" className="button" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Confirm"}
          </button>
          <button type="button" className="menu-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [textFieldsDirty, setTextFieldsDirty] = useState(new Set());
  const [checkboxSavedAt, setCheckboxSavedAt] = useState({});
  const checkboxSavedTimeoutsRef = useRef({});

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.replace("/");
        return;
      }
      setUser(session.user);
      supabase
        .from("user_preference")
        .select("id, email, email_newsletter, full_name, volunteer_updates")
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            setSaveStatus("Could not load preferences.");
            setLoading(false);
            return;
          }
          setPrefs(data || {});
          setLoading(false);
        });
    });
  }, [router]);

  useEffect(() => {
    const timeouts = checkboxSavedTimeoutsRef.current;
    Object.keys(checkboxSavedAt).forEach((key) => {
      if (timeouts[key] != null) return;
      timeouts[key] = setTimeout(() => {
        setCheckboxSavedAt((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        delete timeouts[key];
      }, 3000);
    });
  }, [checkboxSavedAt]);

  useEffect(() => {
    return () => {
      Object.values(checkboxSavedTimeoutsRef.current).forEach(clearTimeout);
      Object.keys(checkboxSavedTimeoutsRef.current).forEach((k) => delete checkboxSavedTimeoutsRef.current[k]);
    };
  }, []);

  const supabase = getBrowserSupabaseClient();

  const updatePref = async (field, value, options = {}) => {
    const { skipSuccessStatus } = options;
    if (!supabase || !user) return { error: "Not ready" };
    setSaveStatus("");
    if (prefs?.id) {
      const { error } = await supabase.from("user_preference").update({ [field]: value, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      if (error) {
        setSaveStatus(error.message);
        return { error: error.message };
      }
      setPrefs((p) => ({ ...p, [field]: value }));
    } else {
      const newRow = {
        user_id: user.id,
        email: (prefs?.email ?? user.email ?? "").trim() || (user.email ?? ""),
        email_newsletter: prefs?.email_newsletter ?? { enabled: false },
        full_name: prefs?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null,
        volunteer_updates: prefs?.volunteer_updates ?? null,
        [field]: value
      };
      const { error } = await supabase.from("user_preference").insert(newRow);
      if (error) {
        setSaveStatus(error.message);
        return { error: error.message };
      }
      const { data } = await supabase.from("user_preference").select("id, email, email_newsletter, full_name, volunteer_updates").eq("user_id", user.id).single();
      setPrefs(data || { ...newRow, id: "" });
    }
    if (!skipSuccessStatus) setSaveStatus("Saved.");
    return {};
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/");
  };

  const handleDeleteProfile = async () => {
    if (!supabase || !user) return;
    setDeleting(true);
    await supabase.from("user_preference").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    setDeleteModalOpen(false);
    setDeleting(false);
    router.replace("/");
  };

  if (loading || !user) {
    return (
      <section className="section card">
        <p className="paragraph">Loading…</p>
      </section>
    );
  }

  const emailNewsletterEnabled = prefs?.email_newsletter && (typeof prefs.email_newsletter === "object" ? prefs.email_newsletter?.enabled === true : true);
  const volunteerUpdatesOn = !!prefs?.volunteer_updates;

  const handleTextChange = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setTextFieldsDirty((prev) => new Set(prev).add(key));
  };

  const handleSubmitTextChanges = async () => {
    let hadError = false;
    for (const { key } of TEXT_FIELDS) {
      const value = key === "email" ? (prefs?.email ?? user.email ?? "") : (prefs?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "");
      const result = await updatePref(key, value);
      if (result?.error) hadError = true;
    }
    if (!hadError) setTextFieldsDirty(new Set());
  };

  const handleCheckboxChange = async (field, checked) => {
    const config = CHECKBOX_FIELDS.find((c) => c.key === field);
    const value = config ? config.getValue(checked) : (checked ? "yes" : null);
    await updatePref(field, value, { skipSuccessStatus: true });
    setCheckboxSavedAt((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <>
      <section className="section card">
        <h1 className="title">My Profile</h1>
        <p className="paragraph">Manage your preferences below.</p>

        <div className="preferences-form" style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "480px", marginTop: "16px" }}>
          {TEXT_FIELDS.map(({ key, label, type }) => (
            <label key={key} className="paragraph" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <strong>{label}</strong>
              <input
                type={type}
                value={key === "email" ? (prefs?.email ?? user.email ?? "") : (prefs?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "")}
                onChange={(e) => handleTextChange(key, e.target.value)}
                className="input"
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(47,47,44,0.2)" }}
              />
            </label>
          ))}

          {CHECKBOX_FIELDS.map(({ key, label, getValue }) => {
            const checked = key === "email_newsletter" ? emailNewsletterEnabled : volunteerUpdatesOn;
            return (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label className="paragraph" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => handleCheckboxChange(key, e.target.checked)}
                  />
                  <strong>{label}</strong>
                </label>
                {checkboxSavedAt[key] && <p className="paragraph" style={{ margin: 0, fontSize: "inherit" }}>Saved.</p>}
              </div>
            );
          })}

          {textFieldsDirty.size > 0 && (
            <button type="button" className="button" onClick={handleSubmitTextChanges}>
              Submit changes
            </button>
          )}

          {saveStatus && <p className="paragraph">{saveStatus}</p>}

          <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(47,47,44,0.1)" }}>
            <button type="button" className="menu-button" onClick={handleSignOut}>
              Sign out
            </button>
            <button type="button" className="menu-button" onClick={() => setDeleteModalOpen(true)}>
              Delete profile
            </button>
          </div>
        </div>
      </section>

      <DeleteProfileModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => handleDeleteProfile()}
        deleting={deleting}
      />
    </>
  );
}
