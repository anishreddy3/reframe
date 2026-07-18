type Escalation = {
  message: string;
  resources: Array<{ label: string; url: string }>;
};

export function EscalationCard({ escalation }: { escalation: Escalation }) {
  return (
    <aside className="escalation" role="alert" aria-live="assertive">
      <p className="eyebrow">Human support, right now</p>
      <h2>Your safety matters more than a coaching reply.</h2>
      <p>{escalation.message}</p>
      <div className="resource-links">
        {escalation.resources.map((resource) => (
          <a key={resource.url} href={resource.url} target="_blank" rel="noopener noreferrer">
            {resource.label} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
          </a>
        ))}
      </div>
      <p className="fine-print">If there is immediate danger, contact your local emergency services now.</p>
    </aside>
  );
}
