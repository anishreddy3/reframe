"use client";

import { FormEvent, useState } from "react";
import type { Checkin } from "../lib/types";

type Props = { onSaved: (payload: { checkins: Checkin[]; stats: unknown }) => void };

export function CheckinForm({ onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkinDate: data.get("date"),
          urges: Number(data.get("urges")),
          slipups: Number(data.get("slipups")),
          mood: Number(data.get("mood")),
          triggers: String(data.get("triggers") || "").split(","),
          context: data.get("context"),
          timeOfDay: data.get("timeOfDay"),
        }),
      });
      const payload = (await response.json()) as { error?: string; checkins?: Checkin[]; stats?: unknown };
      if (!response.ok || payload.error) throw new Error(payload.error || "Could not save check-in.");
      if (!payload.checkins || !payload.stats) throw new Error("The saved check-in could not be reloaded.");
      onSaved({ checkins: payload.checkins, stats: payload.stats });
      setNotice("Check-in saved. This entry now shapes your trends and coaching context.");
      setOpen(false);
      event.currentTarget.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save check-in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="checkin-panel" aria-labelledby="checkin-title">
      <div>
        <p className="eyebrow">A 60-second reflection</p>
        <h2 id="checkin-title">How did today meet you?</h2>
        <p>There is no perfect day here. Logging what happened gives your coach something real to learn from.</p>
      </div>
      {!open && <button className="primary-button compact" onClick={() => setOpen(true)}>Log today’s check-in <span aria-hidden="true">＋</span></button>}
      {notice && <p className="success-note" role="status">{notice}</p>}
      {open && (
        <form className="checkin-form" onSubmit={submit}>
          <div className="field-row">
            <label>Date<input name="date" type="date" defaultValue={today} max={today} required /></label>
            <label>Time of day<select name="timeOfDay" defaultValue="evening"><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option><option value="late-night">Late night</option></select></label>
          </div>
          <div className="field-row three-fields">
            <label>Urges noticed<input name="urges" type="number" min="0" max="100" defaultValue="0" required /></label>
            <label>Slip-ups<input name="slipups" type="number" min="0" max="100" defaultValue="0" required /></label>
            <label>Mood (1–5)<input name="mood" type="number" min="1" max="5" defaultValue="3" required /></label>
          </div>
          <label>Triggers, separated by commas<input name="triggers" maxLength={300} placeholder="stress, boredom, bedtime" /></label>
          <label>What was happening?<textarea name="context" maxLength={500} placeholder="A brief note helps your coach connect patterns later." /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions"><button type="button" className="text-button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-button compact" disabled={saving}>{saving ? "Saving…" : "Save check-in"}</button></div>
        </form>
      )}
    </section>
  );
}
