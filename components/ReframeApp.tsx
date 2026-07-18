"use client";

import { useEffect, useState } from "react";
import { requestJson } from "../lib/client-http";
import type {
  AuthenticatedUser,
  Checkin,
  Profile,
  ProgressStats,
} from "../lib/types";
import { AccountView } from "./AccountView";
import { AppHeader, type AppView } from "./AppHeader";
import { CoachView } from "./CoachView";
import { Onboarding } from "./Onboarding";
import { ProgressView } from "./ProgressView";
import { TodayView } from "./TodayView";

const EMPTY_STATS: ProgressStats = {
  streak: 0,
  averageUrges: 0,
  totalCheckins: 0,
  urgeTrend: "not-enough-data",
  topTriggers: [],
  topTimeOfDay: null,
};

type ProfileResponse = { profile: Profile | null };
type CheckinsResponse = { checkins: Checkin[]; stats: ProgressStats };

export function ReframeApp({
  user,
  signOutPath,
}: {
  user: AuthenticatedUser;
  signOutPath: string;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [stats, setStats] = useState<ProgressStats>(EMPTY_STATS);
  const [view, setView] = useState<AppView>("today");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const requestOptions: RequestInit = {
      cache: "no-store",
      signal: controller.signal,
    };

    Promise.all([
      requestJson<ProfileResponse>(
        "/api/profile",
        requestOptions,
        "Could not load your profile.",
      ),
      requestJson<CheckinsResponse>(
        "/api/checkins",
        requestOptions,
        "Could not load your check-ins.",
      ),
    ])
      .then(([profileData, checkinData]) => {
        setProfile(profileData.profile);
        setCheckins(checkinData.checkins);
        setStats(checkinData.stats);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setLoadError(
          cause instanceof Error ? cause.message : "Could not load Reframe.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function signOut() {
    try {
      if (user.authMethod === "judge") {
        await requestJson<{ authenticated: boolean }>(
          "/api/judge-auth",
          { method: "DELETE" },
          "Could not sign out.",
        );
        window.location.assign("/");
        return;
      }
      window.location.assign(signOutPath);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Could not sign out.");
    }
  }

  function resetAccountData() {
    setProfile(null);
    setCheckins([]);
    setStats(EMPTY_STATS);
    setView("today");
  }

  if (loading) {
    return (
      <main id="main-content" tabIndex={-1} className="loading-screen" aria-live="polite">
        <span className="brand-mark">R</span>
        <p>Opening your private space…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main id="main-content" tabIndex={-1} className="loading-screen">
        <span className="brand-mark">R</span>
        <p role="alert">{loadError}</p>
        <button type="button" className="secondary-button compact" onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    );
  }

  if (!profile) {
    return (
      <Onboarding
        userDisplayName={user.displayName}
        onComplete={setProfile}
        onSignOut={signOut}
      />
    );
  }

  return (
    <div className="app-shell">
      <AppHeader
        user={user}
        view={view}
        onViewChange={setView}
        onSignOut={signOut}
      />
      <main id="main-content" tabIndex={-1} className="main-content">
        {view === "today" && (
          <TodayView
            profile={profile}
            stats={stats}
            onCheckinSaved={(payload) => {
              setCheckins(payload.checkins);
              setStats(payload.stats);
            }}
          />
        )}
        {view === "coach" && <CoachView />}
        {view === "insights" && (
          <>
            <section className="page-heading">
              <p className="eyebrow">Your data, reflected back</p>
              <h1>Patterns without judgment.</h1>
              <p>Every number below is computed only from check-ins stored in your Reframe database.</p>
            </section>
            <ProgressView checkins={checkins} stats={stats} />
          </>
        )}
        {view === "account" && (
          <AccountView
            user={user}
            checkinCount={checkins.length}
            onDeleted={resetAccountData}
          />
        )}
      </main>
      <footer>
        <span>Reframe is a behavior-change companion, not medical care.</span>
        <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">
          Need human support? Find a helpline ↗<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </footer>
    </div>
  );
}
