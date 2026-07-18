"use client";

import { useState } from "react";

type Props = {
  user: { displayName: string; email: string; authMethod: "chatgpt" | "judge" | "development" };
  checkinCount: number;
  onDeleted: () => void;
};

export function AccountView({ user, checkinCount, onDeleted }: Props) {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteData() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete your data.");
      onDeleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete your data.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Account & privacy</p>
        <h1>Your data stays yours.</h1>
        <p>Reframe ties profiles and check-ins to the identity verified on the server. Browser-supplied IDs cannot select another person’s records.</p>
      </section>
      <div className="account-grid">
        <section className="card account-card" aria-labelledby="identity-title">
          <p className="eyebrow">Authenticated identity</p>
          <h2 id="identity-title">{user.displayName}</h2>
          <p>{user.email}</p>
          <dl>
            <div><dt>Sign-in method</dt><dd>{user.authMethod === "chatgpt" ? "Sign in with ChatGPT" : user.authMethod === "judge" ? "Temporary evaluator access" : "Local development identity"}</dd></div>
            <div><dt>Stored check-ins</dt><dd>{checkinCount}</dd></div>
          </dl>
          <a className="secondary-button account-download" href="/api/account?download=1">Download my data <span aria-hidden="true">↓</span></a>
        </section>
        <section className="card account-card danger-zone" aria-labelledby="delete-title">
          <p className="eyebrow">Delete stored data</p>
          <h2 id="delete-title">Start over permanently</h2>
          <p>This removes your profile, generated plan, and every check-in from Reframe. It does not delete your ChatGPT account.</p>
          <label htmlFor="delete-confirmation">Type <strong>DELETE</strong> to confirm</label>
          <input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="danger-button" onClick={deleteData} disabled={confirmation !== "DELETE" || deleting}>{deleting ? "Deleting…" : "Delete all Reframe data"}</button>
        </section>
      </div>
    </>
  );
}
