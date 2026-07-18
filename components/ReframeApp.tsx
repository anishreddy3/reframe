"use client";

import { useEffect, useState } from "react";
import type { Checkin, Profile, ProgressStats } from "../lib/types";
import { AccountView } from "./AccountView";
import { CheckinForm } from "./CheckinForm";
import { CoachView } from "./CoachView";
import { Onboarding } from "./Onboarding";
import { ProgressView } from "./ProgressView";

const EMPTY_STATS: ProgressStats = { streak: 0, averageUrges: 0, totalCheckins: 0, urgeTrend: "not-enough-data", topTriggers: [], topTimeOfDay: null };
type View = "today" | "coach" | "insights" | "account";
type User = { displayName: string; email: string; authMethod: "chatgpt" | "judge" | "development" };

export function ReframeApp({ user, signOutPath }: { user: User; signOutPath: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [stats, setStats] = useState<ProgressStats>(EMPTY_STATS);
  const [view, setView] = useState<View>("today");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/profile", { cache: "no-store" }).then(async (response) => ({ response, data: await response.json() as { error?: string; profile: Profile | null } })),
      fetch("/api/checkins", { cache: "no-store" }).then(async (response) => ({ response, data: await response.json() as { error?: string; checkins: Checkin[]; stats: ProgressStats } })),
    ])
      .then(([profileResult, checkinResult]) => {
        if (!profileResult.response.ok || profileResult.data.error) throw new Error(profileResult.data.error || "Could not load your profile.");
        if (!checkinResult.response.ok || checkinResult.data.error) throw new Error(checkinResult.data.error || "Could not load your check-ins.");
        setProfile(profileResult.data.profile);
        setCheckins(checkinResult.data.checkins);
        setStats(checkinResult.data.stats);
      })
      .catch((cause) => setLoadError(cause instanceof Error ? cause.message : "Could not load Reframe."))
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    if (user.authMethod === "judge") {
      await fetch("/api/judge-auth", { method: "DELETE" });
      window.location.assign("/judge-access");
      return;
    }
    window.location.assign(signOutPath);
  }

  if (loading) return <main className="loading-screen"><span className="brand-mark">R</span><p>Opening your private space…</p></main>;
  if (loadError) return <main className="loading-screen"><span className="brand-mark">R</span><p role="alert">{loadError}</p><button className="secondary-button compact" onClick={() => window.location.reload()}>Try again</button></main>;
  if (!profile) return <Onboarding userDisplayName={user.displayName} onComplete={setProfile} onSignOut={signOut} />;

  const initial = user.displayName.slice(0, 1).toUpperCase();
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#main"><span className="brand-mark">R</span><span>reframe</span></a>
        <nav aria-label="Primary navigation">
          {(["today", "coach", "insights"] as const).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "today" ? "Today" : item === "coach" ? "Coach" : "My patterns"}</button>)}
        </nav>
        <details className="account-menu">
          <summary aria-label={`Open account menu for ${user.displayName}`}><span className="profile-chip" aria-hidden="true">{initial}</span></summary>
          <div className="account-popover">
            <strong>{user.displayName}</strong><span>{user.email}</span>
            <button onClick={(event) => { setView("account"); event.currentTarget.closest("details")?.removeAttribute("open"); }}>Account & privacy</button>
            <button onClick={signOut}>Sign out</button>
          </div>
        </details>
      </header>

      <main id="main" className="main-content">
        {view === "today" && (
          <>
            <section className="welcome-row">
              <div><p className="eyebrow">One honest day at a time</p><h1>Good to see you.</h1><p>Your goal is to <strong>{profile.goal}</strong> a pattern your plan identified as <strong>{profile.habitType.toLowerCase()}</strong>.</p></div>
              <div className="streak-block"><span>{stats.streak}</span><p>day check-in<br />streak</p></div>
            </section>
            <section className="metrics-grid" aria-label="Progress summary">
              <article><span>01</span><p>Check-ins</p><strong>{stats.totalCheckins}</strong><small>stored entries</small></article>
              <article><span>02</span><p>Average urges</p><strong>{stats.averageUrges}</strong><small>per logged day</small></article>
              <article><span>03</span><p>Urge trend</p><strong className="word-metric">{stats.urgeTrend.replaceAll("-", " ")}</strong><small>from actual entries</small></article>
            </section>
            <section className="plan-card">
              <div className="plan-label"><span aria-hidden="true">✦</span><div><p className="eyebrow">Your live AI starting plan</p><h2>A gentler way into change</h2></div></div>
              <p className="plan-text">{profile.startingPlan}</p>
              <span className="evidence-label">Generated from your onboarding details</span>
            </section>
            <CheckinForm onSaved={(payload) => { setCheckins(payload.checkins); setStats(payload.stats as ProgressStats); }} />
          </>
        )}
        {view === "coach" && <CoachView />}
        {view === "insights" && <><section className="page-heading"><p className="eyebrow">Your data, reflected back</p><h1>Patterns without judgment.</h1><p>Every number below is computed only from check-ins stored in your Reframe database.</p></section><ProgressView checkins={checkins} stats={stats} /></>}
        {view === "account" && <AccountView user={user} checkinCount={checkins.length} onDeleted={() => { setProfile(null); setCheckins([]); setStats(EMPTY_STATS); setView("today"); }} />}
      </main>
      <footer><span>Reframe is a behavior-change companion, not medical care.</span><a href="https://findahelpline.com/" target="_blank" rel="noreferrer">Need human support? Find a helpline ↗</a></footer>
    </div>
  );
}
