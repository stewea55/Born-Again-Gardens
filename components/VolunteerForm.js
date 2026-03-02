"use client";

import { useState } from "react";

export default function VolunteerForm({ label = "Email", buttonLabel = "Get notified" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const response = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit email.");
      }

      setEmail("");
      setStatus("Thanks! You're on the list.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-row">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={label}
        aria-label={label}
      />
      <button type="submit" className="button" disabled={loading}>
        {loading ? "Sending..." : buttonLabel}
      </button>
      {status && <span className="paragraph">{status}</span>}
    </form>
  );
}
