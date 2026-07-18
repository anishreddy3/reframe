"use client";

import { useEffect, useState } from "react";
import type { Checkin, Profile, ProgressStats } from "../lib/types";
import { CheckinForm } from "./CheckinForm";
import { CoachView } from "./CoachView";
import { Onboarding } from "./Onboarding";
import { ProgressView } from "./ProgressView";

const EMPTY_STATS: ProgressStats = { streak: 0, averageUrges: 0, totalCheckins: 0, urgeTrend: "not-enough-data", topTriggers: [], topTimeOfDay: null };

export function ReframeApp() {
  const [sessionId, setSessionId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [stats, setStats] = useState<ProgressStats>(EMPTY_STATS);
  const [view, setView] = useState<"today" | "coach" | "insights">("today");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("reframe-session-id");
    const id = stored && /^[a-zA-Z0-9_-]{12,80}$/.test(stored) ? stored : crypto.randomUUID();
    localStorage.setItem("reframe-session-id", id);
    setSessionId(id);
    Promise.all([
      fetch(`/api/profile?sessionId=${encodeURIComponent(id)}`).then((response) => response.json() as Promise<{ error?: string; profile: Profile | null }>),
      fetch(`/api/checkins?sessionId=${encodeURIComponent(id)}`).then((response) => response.json() as Promise<{ error?: string; checkins: Checkin[]; stats: ProgressStats }>),
    ])
      .then(([profileData, checkinData]) => {
        if (profileData.error) throw new Error(profileData.error);
        setProfile(profileData.profile);
        if (!checkinData.error) {
          setCheckins(checkinData.checkins);
          setStats(checkinData.stats);
        }
      })
      .catch((cause) => setLoadError(cause instanceof Error ? cause.message : "Could not load Reframe."))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !sessionId) return <main className="loading-screen"><span className="brand-mark">R</span><p>Opening your private space…</p></main>;
  if (!profile) return <><Onboarding sessionId={sessionId} onComplete={setProfile} />{loadError && <p className="global-error">{loadError}</p>}</>;

  const firstName = profile.habitType.split(/[\s/-]/)[0];
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#main"><span className="brand-mark">R</span><span>reframe</span></a>
        <nav aria-label="Primary navigation">
          {(["today", "coach", "insights"] as const).map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "today" ? "Today" : item === "coach" ? "Coach" : "My patterns"}</button>)}
        </nav>
        <span className="profile-chip" title={`Working on ${profile.habitType}`}>{firstName.slice(0, 1).toUpperCase()}</span>
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
            <CheckinForm sessionId={sessionId} onSaved={(payload) => { setCheckins(payload.checkins); setStats(payload.stats as ProgressStats); }} />
          </>
        )}
        {view === "coach" && <CoachView sessionId={sessionId} />}
        {view === "insights" && <><section className="page-heading"><p className="eyebrow">Your data, reflected back</p><h1>Patterns without judgment.</h1><p>Every number below is computed only from check-ins stored in your Reframe database.</p></section><ProgressView checkins={checkins} stats={stats} /></>}
      </main>
      <footer><span>Reframe is a behavior-change companion, not medical care.</span><a href="https://findahelpline.com/" target="_blank" rel="noreferrer">Need human support? Find a helpline ↗</a></footer>
    </div>
  );
}
