"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentReturnClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session. Please complete checkout from the payment page.");
      return;
    }
    fetch(`/api/checkout/session-status?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error.message || "Could not load payment status.");
          return;
        }
        setStatus(json.data.status);
        setCustomerEmail(json.data.customer_email || "");
      })
      .catch(() => setError("Could not load payment status."));
  }, [sessionId]);

  useEffect(() => {
    if (status === "complete" && typeof window !== "undefined") {
      window.localStorage.removeItem("bag_guest_shop_cart_v1");
      window.localStorage.removeItem("bag_guest_harvest_cart_v1");
    }
  }, [status]);

  if (error) {
    return (
      <section className="section card">
        <h2 className="subheading">Payment</h2>
        <p className="paragraph">{error}</p>
        <p className="paragraph">
          <Link className="link" href="/donate">
            Return to donate
          </Link>
          {" or "}
          <Link className="link" href="/payment">
            payment page
          </Link>
          .
        </p>
      </section>
    );
  }

  if (status === null) {
    return (
      <section className="section card">
        <h2 className="subheading">Payment</h2>
        <p className="paragraph">Loading payment status…</p>
      </section>
    );
  }

  if (status === "complete") {
    return (
      <section className="section card">
        <h2 className="subheading">Thank you</h2>
        <p className="paragraph">
          Your payment was successful. We appreciate your support.
        </p>
        {customerEmail && (
          <p className="paragraph">
            A confirmation email will be sent to {customerEmail}.
          </p>
        )}
        <p className="paragraph">
          <Link className="link" href="/">
            Return to home
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="section card">
      <h2 className="subheading">Payment not completed</h2>
      <p className="paragraph">
        Payment was canceled or could not be completed. You have not been charged.
      </p>
      <p className="paragraph">
        <Link className="link" href="/donate">
          Try again from donate
        </Link>
        {" or "}
        <Link className="link" href="/payment">
          payment page
        </Link>
        .
      </p>
    </section>
  );
}
