import Exa from "exa-js";
import type { ResearchSource } from "./types.ts";
import { cleanText, safeExternalUrl } from "./validation.ts";

const cache = new Map<string, { expiresAt: number; results: ResearchSource[] }>();
const THIRTY_MINUTES = 30 * 60 * 1000;

function normalizeQuery(value: string) {
  return cleanText(value, 240).toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, " ");
}

export type ResearchResultCandidate = {
  title?: string | null;
  url: string;
  highlights?: string[] | null;
  publishedDate?: string | null;
};

/** Converts Exa SDK results into the small, safe shape returned to browsers. */
export function parseResearchResults(
  candidates: readonly ResearchResultCandidate[],
): ResearchSource[] {
  return candidates.flatMap((candidate) => {
    const url = safeExternalUrl(candidate.url);
    if (!url) return [];

    const title = cleanText(candidate.title, 220) || new URL(url).hostname;
    const snippet = (candidate.highlights ?? [])
      .filter((highlight): highlight is string => typeof highlight === "string")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 700);

    return [{
      title,
      url,
      snippet,
      publishedDate: typeof candidate.publishedDate === "string"
        ? candidate.publishedDate
        : undefined,
    }];
  });
}

export async function searchEvidence(ownerId: string, habitType: string, question: string): Promise<ResearchSource[]> {
  if (!process.env.EXA_API_KEY) throw new Error("EXA_API_KEY is not configured on the server.");
  const query = cleanText(`${habitType}: ${question} evidence-based behavior change psychology research reputable health source`, 300);
  const cacheKey = `${ownerId}:${normalizeQuery(query)}`;
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
  const results = parseResearchResults(response.results);
  cache.set(cacheKey, { expiresAt: Date.now() + THIRTY_MINUTES, results });
  return results;
}
