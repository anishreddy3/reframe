"use client";

import { FormEvent, useState } from "react";
import type { ResearchSource } from "../lib/types";
import { EscalationCard } from "./EscalationCard";

type Message = { id: string; role: "user" | "coach"; content: string; model?: string };
type Escalation = Parameters<typeof EscalationCard>[0]["escalation"];

export function CoachView({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [escalation, setEscalation] = useState<Escalation | null>(null);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [lastQuery, setLastQuery] = useState("");

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form).get("message")?.toString().trim() || "";
    if (!input) return;
    setChatError("");
    setEscalation(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: input }]);
    setChatLoading(true);
    form.reset();
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: input }),
      });
      const data = (await response.json()) as { error?: string; escalation?: Escalation; reply?: string; model?: string };
      if (!response.ok || data.error) throw new Error(data.error || "Coach request failed.");
      if (data.escalation) setEscalation(data.escalation);
      else if (data.reply) setMessages((current) => [...current, { id: crypto.randomUUID(), role: "coach", content: data.reply!, model: data.model }]);
      else throw new Error("Coach returned no response.");
    } catch (cause) {
      setChatError(cause instanceof Error ? cause.message : "Coach request failed.");
    } finally {
      setChatLoading(false);
    }
  }

  async function searchResearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = new FormData(event.currentTarget).get("question")?.toString().trim() || "";
    setResearchError("");
    setResearchLoading(true);
    setSources([]);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question }),
      });
      const data = (await response.json()) as { error?: string; results?: ResearchSource[] };
      if (!response.ok || data.error) throw new Error(data.error || "Evidence search failed.");
      setSources(data.results ?? []);
      setLastQuery(question);
    } catch (cause) {
      setResearchError(cause instanceof Error ? cause.message : "Evidence search failed.");
    } finally {
      setResearchLoading(false);
    }
  }

  return (
    <div className="coach-layout">
      <section className="card chat-card" aria-labelledby="coach-title">
        <div className="section-heading"><div><p className="eyebrow">Adaptive coaching</p><h2 id="coach-title">Talk through what’s happening</h2></div><span className="live-indicator"><i /> Live AI</span></div>
        <p className="section-intro">Your coach receives up to 10 recent check-ins from the database, so any pattern it mentions has to come from what you logged.</p>
        <div className="message-list" aria-live="polite">
          {!messages.length && <div className="chat-empty"><span aria-hidden="true">“</span><p>Start with the moment you are in. A craving, a setback, or a small win are all useful places to begin.</p></div>}
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <small>{message.role === "user" ? "You" : "Reframe coach"}</small>
              <p>{message.content}</p>
              {message.model && <span className="model-tag">Generated live · {message.model}</span>}
            </article>
          ))}
          {chatLoading && <div className="message coach loading-message" role="status"><small>Reframe coach</small><p>Reading your recent pattern and composing a response…</p></div>}
        </div>
        {escalation && <EscalationCard escalation={escalation} />}
        {chatError && <p className="form-error" role="alert">{chatError}</p>}
        <form className="chat-form" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="coach-message">Message your coach</label>
          <textarea id="coach-message" name="message" maxLength={1000} required placeholder="What are you noticing right now?" />
          <button className="send-button" aria-label="Send message" disabled={chatLoading}>→</button>
        </form>
      </section>

      <section className="card research-card" aria-labelledby="research-title">
        <p className="eyebrow">Evidence, not filler</p>
        <h2 id="research-title">Workshop a strategy</h2>
        <p>Search real psychology and health sources for a question specific to your habit.</p>
        <form onSubmit={searchResearch}>
          <label htmlFor="research-question">What would you like to understand?</label>
          <textarea id="research-question" name="question" minLength={8} maxLength={500} required placeholder="How can I make late-night phone checking less automatic?" />
          <button className="secondary-button" disabled={researchLoading}>{researchLoading ? "Searching Exa…" : "Find credible sources"}<span aria-hidden="true">↗</span></button>
        </form>
        {researchError && <p className="form-error" role="alert">{researchError}</p>}
        {lastQuery && !researchLoading && <p className="query-note">Live Exa results for “{lastQuery}”</p>}
        <div className="source-list">
          {sources.map((source) => (
            <article key={source.url} className="source-item">
              <div><span className="source-domain">{new URL(source.url).hostname.replace(/^www\./, "")}</span>{source.publishedDate && <time>{source.publishedDate.slice(0, 10)}</time>}</div>
              <h3><a href={source.url} target="_blank" rel="noreferrer">{source.title} <span aria-hidden="true">↗</span></a></h3>
              {source.snippet ? <p>{source.snippet}</p> : <p className="muted">Exa found this source but did not return a usable highlight.</p>}
            </article>
          ))}
          {lastQuery && !sources.length && !researchLoading && <p className="empty-inline">Exa returned no usable sources for this query. Nothing has been substituted or invented.</p>}
        </div>
      </section>
    </div>
  );
}
