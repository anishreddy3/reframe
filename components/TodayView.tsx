import type { Checkin, Profile, ProgressStats } from "../lib/types";
import { CheckinForm } from "./CheckinForm";

type Props = {
  profile: Profile;
  stats: ProgressStats;
  onCheckinSaved: (payload: { checkins: Checkin[]; stats: ProgressStats }) => void;
};

export function TodayView({ profile, stats, onCheckinSaved }: Props) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">One honest day at a time</p>
          <h1>Good to see you.</h1>
          <p>
            Your goal is to <strong>{profile.goal}</strong> a pattern your plan
            identified as <strong>{profile.habitType.toLowerCase()}</strong>.
          </p>
        </div>
        <div className="streak-block" aria-label={`${stats.streak} day check-in streak`}>
          <span aria-hidden="true">{stats.streak}</span>
          <p aria-hidden="true">day check-in<br />streak</p>
        </div>
      </section>
      <section className="metrics-grid" aria-label="Progress summary">
        <article><span>01</span><p>Check-ins</p><strong>{stats.totalCheckins}</strong><small>stored entries</small></article>
        <article><span>02</span><p>Average urges</p><strong>{stats.averageUrges}</strong><small>per logged day</small></article>
        <article><span>03</span><p>Urge trend</p><strong className="word-metric">{stats.urgeTrend.replaceAll("-", " ")}</strong><small>from actual entries</small></article>
      </section>
      <section className="plan-card" aria-labelledby="plan-title">
        <div className="plan-label">
          <span aria-hidden="true">✦</span>
          <div>
            <p className="eyebrow">Your live AI starting plan</p>
            <h2 id="plan-title">A gentler way into change</h2>
          </div>
        </div>
        <p className="plan-text">{profile.startingPlan}</p>
        <span className="evidence-label">Generated from your onboarding details</span>
      </section>
      <CheckinForm onSaved={onCheckinSaved} />
    </>
  );
}
