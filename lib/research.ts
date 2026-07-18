import Exa from "exa-js";
import type { ResearchSource } from "./types";
import { cleanText, safeExternalUrl } from "./validation";

const cache = new Map<string, { expiresAt: number; results: ResearchSource[] }>();
const THIRTY_MINUTES = 30 * 60 * 1000;

function normalizeQuery(value: string) {
  return cleanText(value, 240).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, " ");
}

export async function searchEvidence(sessionId: string, habitType: string, question: string): Promise<ResearchSource[]> {
  if (!process.env.EXA_API_KEY) throw new Error("EXA_API_KEY is not configured on the server.");
  const query = cleanText(`${habitType}: ${question} evidence-based behavior change psychology research reputable health source`, 300);
  const cacheKey = `${sessionId}:${normalizeQuery(query)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  const exa = new Exa(process.env.EXA_API_KEY);
  const response = await exa.search(query, {
    type: "neural",
    numResults: 5,
    contents: {
      highlights: { query: question, maxCharacters: 650 },
      maxAgeHours: 72,
    },
  });
  const results = response.results.flatMap((result) => {
    const url = safeExternalUrl(result.url);
    if (!url) return [];
    const snippet = (result.highlights ?? []).join(" ").replace(/\s+/g, " ").trim().slice(0, 700);
    return [{ title: result.title?.trim() || new URL(url).hostname, url, snippet, publishedDate: result.publishedDate }];
  });
  cache.set(cacheKey, { expiresAt: Date.now() + THIRTY_MINUTES, results });
  return results;
}
