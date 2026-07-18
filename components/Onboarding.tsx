"use client";

import { FormEvent, useState } from "react";
import { EscalationCard } from "./EscalationCard";
import { requestJson } from "../lib/client-http";
import type { Profile } from "../lib/types";

type Props = { userDisplayName: string; onComplete: (profile: Profile) => void; onSignOut: () => void };

export function Onboarding({ userDisplayName, onComplete, onSignOut }: Props) {
  const [habitDescription, setHabitDescription] = useState("");
  const [severity, setSeverity] = useState<Profile["severity"]>("moderate");
  const [goal, setGoal] = useState<Profile["goal"]>("reduce");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [escalation, setEscalation] = useState<null | Parameters<typeof EscalationCard>[0]["escalation"]>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setEscalation(null);
    try {
      const data = await requestJson<{
        error?: string;
        escalation?: Parameters<typeof EscalationCard>[0]["escalation"];
        profile?: Profile;
      }>("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitDescription, severity, goal }),
      }, "Onboarding failed.");
      if (data.escalation) {
        setEscalation(data.escalation);
        return;
      }
      if (!data.profile) throw new Error("Onboarding returned no profile.");
      onComplete(data.profile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Onboarding failed.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="onboarding-shell">
      <header className="onboarding-header"><span className="brand-lockup"><span className="brand-mark">R</span><span>reframe</span></span><span className="onboarding-account"><span className="signed-in-note">Signed in as {userDisplayName}</span><button type="button" onClick={onSignOut}>Sign out</button></span></header>
      <div className="onboarding-grid">
        <section className="onboarding-copy">
          <p className="eyebrow">Change the pattern, not who you are</p>
          <h1>Make a little more room between <em>urge</em> and action.</h1>
          <p className="lede">A private, adaptive companion for changing habits with evidence-aligned strategies and real reflection—not shame.</p>
          <div className="trust-note"><span aria-hidden="true">✦</span><p><strong>Your plan is generated for you.</strong><br />Reframe reads what you share and creates a fresh starting plan through a live AI call.</p></div>
        </section>

        <section className="onboarding-card" aria-labelledby="start-title">
          <div className="step-count">01 <span>/ 01</span></div>
          <p className="eyebrow">Begin with what is true today</p>
          <h2 id="start-title">What pattern would you like to shift?</h2>
          <form onSubmit={submit} aria-busy={status === "loading"}>
            <label htmlFor="habit">Describe it in your own words</label>
            <textarea id="habit" value={habitDescription} onChange={(event) => setHabitDescription(event.target.value)} maxLength={700} minLength={12} required placeholder="For example: I reach for my phone whenever work feels difficult, then lose an hour scrolling." />

            <fieldset>
              <legend>How often is it getting in your way?</legend>
              <div className="segmented three">
                {(["mild", "moderate", "high"] as const).map((value) => (
                  <label key={value} className={severity === value ? "selected" : ""}>
                    <input type="radio" name="severity" value={value} checked={severity === value} onChange={() => setSeverity(value)} />
                    <span>{value === "mild" ? "Sometimes" : value === "moderate" ? "Most days" : "Many times a day"}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>What feels like the right goal?</legend>
              <div className="segmented">
                <label className={goal === "reduce" ? "selected" : ""}><input type="radio" name="goal" checked={goal === "reduce"} onChange={() => setGoal("reduce")} /><span>Reduce gradually</span></label>
                <label className={goal === "quit" ? "selected" : ""}><input type="radio" name="goal" checked={goal === "quit"} onChange={() => setGoal("quit")} /><span>Stop entirely</span></label>
              </div>
            </fieldset>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={status === "loading"}>{status === "loading" ? "Creating your plan…" : "Create my starting plan"}<span aria-hidden="true">→</span></button>
            <p className="privacy-note">Reframe is not medical care. Sensitive inputs are never used as demo data.</p>
          </form>
          {escalation && <EscalationCard escalation={escalation} />}
        </section>
      </div>
    </main>
  );
}
