import Link from "next/link";

export default function Home() {
  return (
    <main className="access-choice-shell">
      <section className="access-choice-card" aria-labelledby="access-choice-title">
        <span className="brand-lockup"><span className="brand-mark">R</span><span>reframe</span></span>
        <p className="eyebrow">Private, personalized habit support</p>
        <h1 id="access-choice-title">How would you like to continue?</h1>
        <p className="access-choice-intro">Choose the path that fits you. Both open the same fully functional Reframe experience with live AI coaching, real evidence search, and private progress tracking.</p>
        <div className="access-options">
          <article>
            <span className="access-option-number">01</span>
            <h2>Regular user</h2>
            <p>Sign in with your ChatGPT account. Your profile and check-ins stay connected to your verified identity across visits.</p>
            <Link className="primary-button" href="/app">Continue with ChatGPT <span aria-hidden="true">→</span></Link>
          </article>
          <article>
            <span className="access-option-number">02</span>
            <h2>Evaluator</h2>
            <p>Use the temporary challenge credentials from the README to test every workflow without a personal account.</p>
            <Link className="secondary-button" href="/judge-access">Use evaluator access <span aria-hidden="true">→</span></Link>
          </article>
        </div>
        <p className="access-choice-note">Reframe is a behavior-change companion, not medical care.</p>
      </section>
    </main>
  );
}
