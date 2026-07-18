import type { Checkin, ProgressStats } from "./types";

function utcDay(value: string): number {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? NaN : Math.floor(date.getTime() / 86_400_000);
}

export function calculateStreak(checkins: Pick<Checkin, "checkinDate">[], today = new Date()): number {
  const days = [...new Set(checkins.map((entry) => utcDay(entry.checkinDate)).filter(Number.isFinite))].sort((a, b) => b - a);
  if (!days.length) return 0;
  const currentDay = Math.floor(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) / 86_400_000);
  if (days[0] < currentDay - 1 || days[0] > currentDay) return 0;

  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1] - days[index] !== 1) break;
    streak += 1;
  }
  return streak;
}

export function calculateProgress(checkins: Checkin[], today = new Date()): ProgressStats {
  const sorted = [...checkins].sort((a, b) => a.checkinDate.localeCompare(b.checkinDate));
  const averageUrges = sorted.length ? Math.round((sorted.reduce((sum, entry) => sum + entry.urges, 0) / sorted.length) * 10) / 10 : 0;
  const triggerCounts = new Map<string, number>();
  const timeCounts = new Map<string, number>();
  sorted.forEach((entry) => {
    entry.triggers.forEach((trigger) => triggerCounts.set(trigger, (triggerCounts.get(trigger) ?? 0) + 1));
    timeCounts.set(entry.timeOfDay, (timeCounts.get(entry.timeOfDay) ?? 0) + 1);
  });

  let urgeTrend: ProgressStats["urgeTrend"] = "not-enough-data";
  if (sorted.length >= 4) {
    const midpoint = Math.floor(sorted.length / 2);
    const mean = (items: Checkin[]) => items.reduce((sum, item) => sum + item.urges, 0) / items.length;
    const delta = mean(sorted.slice(midpoint)) - mean(sorted.slice(0, midpoint));
    urgeTrend = delta <= -0.75 ? "improving" : delta >= 0.75 ? "rising" : "steady";
  }

  return {
    streak: calculateStreak(sorted, today),
    averageUrges,
    totalCheckins: sorted.length,
    urgeTrend,
    topTriggers: [...triggerCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([trigger, count]) => ({ trigger, count })),
    topTimeOfDay: [...timeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  };
}
