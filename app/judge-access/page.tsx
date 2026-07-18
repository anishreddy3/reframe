"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function JudgeAccess() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/judge-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.get("username"),
          password: data.get("password"),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Evaluator sign-in failed.");
      window.location.assign("/app");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Evaluator sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <main className="judge-access-shell">
      <section className="judge-access-card" aria-labelledby="judge-access-title">
        <Link className="brand-lockup" href="/"><span className="brand-mark">R</span><span>reframe</span></Link>
        <p className="eyebrow">Temporary evaluation access</p>
        <h1 id="judge-access-title">Explore every workflow.</h1>
        <p>Use the credentials supplied in the project README. This login is reserved for judges and stores only evaluation data.</p>
        <form onSubmit={submit}>
          <label htmlFor="judge-username">Evaluator username</label>
          <input id="judge-username" name="username" autoComplete="username" required />
          <label htmlFor="judge-password">Evaluator password</label>
          <input id="judge-password" name="password" type="password" autoComplete="current-password" required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={loading}>{loading ? "Signing in…" : "Open Reframe"}<span aria-hidden="true">→</span></button>
        </form>
        <p className="judge-access-note">Regular users can visit the main URL and choose Sign in with ChatGPT.</p>
      </section>
    </main>
  );
}
