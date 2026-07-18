export type Profile = {
  sessionId: string;
  habitDescription: string;
  severity: "mild" | "moderate" | "high";
  goal: "reduce" | "quit";
  habitType: string;
  startingPlan: string;
  createdAt: string;
  updatedAt: string;
};

export type Checkin = {
  id: string;
  sessionId: string;
  checkinDate: string;
  urges: number;
  slipups: number;
  mood: number;
  triggers: string[];
  context: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "late-night";
  createdAt: string;
};

export type ProgressStats = {
  streak: number;
  averageUrges: number;
  totalCheckins: number;
  urgeTrend: "improving" | "rising" | "steady" | "not-enough-data";
  topTriggers: Array<{ trigger: string; count: number }>;
  topTimeOfDay: string | null;
};

export type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
};
