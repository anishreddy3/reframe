import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="access-choice-shell">
      <section className="access-choice-card" aria-labelledby="access-choice-title">
        <span className="brand-lockup"><span className="brand-mark">R</span><span>reframe</span></span>
        <p className="eyebrow">Private, personalized habit support</p>
        <h1 id="access-choice-title">Change the pattern without the shame.</h1>
        <p className="access-choice-intro">Reframe combines private progress tracking, adaptive AI coaching, and real evidence to help you take the next useful step.</p>
        <div className="access-cta">
          <p>Sign in with ChatGPT to keep your profile and check-ins connected to your verified identity across visits.</p>
          <Link className="primary-button" href="/app">Continue with ChatGPT <span aria-hidden="true">→</span></Link>
        </div>
        <p className="access-choice-note">Reframe is a behavior-change companion, not medical care.</p>
      </section>
    </main>
  );
}
