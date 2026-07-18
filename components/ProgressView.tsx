import type { Checkin, ProgressStats } from "../lib/types";

export function ProgressView({ checkins, stats }: { checkins: Checkin[]; stats: ProgressStats }) {
  const ordered = [...checkins].sort((a, b) => a.checkinDate.localeCompare(b.checkinDate)).slice(-14);
  const maxUrges = Math.max(1, ...ordered.map((entry) => entry.urges));
  const chartDescription = ordered
    .map((entry) => `${entry.checkinDate}: ${entry.urges}`)
    .join(", ");

  return (
    <div className="insights-grid">
      <section className="card chart-card">
        <div className="section-heading"><div><p className="eyebrow">Recorded, not estimated</p><h2>Urges over time</h2></div><span className="data-badge">{ordered.length} entries shown</span></div>
        {ordered.length ? (
          <div className="bar-chart" role="img" aria-label={`Urge counts by date. ${chartDescription}`}>
            {ordered.map((entry) => (
              <div className="bar-column" key={entry.id} title={`${entry.checkinDate}: ${entry.urges} urges`}>
                <span className="bar-value">{entry.urges}</span>
                <span className="bar" style={{ height: `${Math.max(5, (entry.urges / maxUrges) * 100)}%` }} />
                <span className="bar-label">{entry.checkinDate.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : <EmptyData />}
      </section>

      <section className="card pattern-card">
        <p className="eyebrow">Patterns from your entries</p><h2>What tends to show up</h2>
        {stats.topTriggers.length ? (
          <ol className="trigger-list">
            {stats.topTriggers.map((item, index) => <li key={item.trigger}><span className="rank">0{index + 1}</span><span>{item.trigger}</span><strong>{item.count}×</strong></li>)}
          </ol>
        ) : <EmptyData compact />}
        {stats.topTimeOfDay && <p className="pattern-note">Most often logged in the <strong>{stats.topTimeOfDay.replace("-", " ")}</strong>.</p>}
      </section>
    </div>
  );
}

function EmptyData({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "empty-data compact-empty" : "empty-data"}><span aria-hidden="true">○</span><p><strong>No pattern yet.</strong><br />Your real check-ins will appear here once logged.</p></div>;
}
