"use client";

import { useState } from "react";

export default function FooterSubscribe() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      if (res.ok) {
        setStatus("success");
        setFirstName("");
        setLastName("");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("success"); // Optimistic: show thanks even if API fails
    }
  }

  if (status === "success") {
    return (
      <p className="footer-subscribe-thanks">
        Thanks for subscribing. We&apos;ll send insights to your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="footer-subscribe-form">
      <div className="footer-subscribe-row">
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="footer-subscribe-input"
          required
          aria-label="First name"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="footer-subscribe-input"
          required
          aria-label="Last name"
        />
      </div>
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="footer-subscribe-input"
        required
        aria-label="Email"
      />
      <button type="submit" className="footer-subscribe-btn" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
