# Reframe

Reframe is a GenAI-powered habit-change companion. It creates a personalized starting plan, stores real daily check-ins in Cloudflare D1, adapts live coaching to recent history, and retrieves evidence sources through Exa neural search.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Add `OPENAI_API_KEY` and `EXA_API_KEY`.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`.

There is no login. A random device session ID is stored locally and used only to retrieve that device’s database-backed profile and check-ins. No test credentials are required.

## What is live

- Onboarding classification and the starting plan come from an OpenAI Chat Completions call.
- Each coaching reply comes from OpenAI and receives at most 10 recent D1 check-ins.
- Evidence searches use the official `exa-js` SDK with `type: "neural"` and return Exa highlights and source URLs verbatim.
- Self-harm input is routed away from coaching using both deterministic phrase checks and OpenAI’s moderation endpoint.
- Dashboard metrics and charts are computed only from stored check-ins. Empty accounts show empty states.

Missing keys, rate limits, and upstream failures are shown as errors. The application never substitutes canned coaching, invented research, or demo progress.

## Quality checks

- `npm test` tests streak/trend calculation and check-in storage round-tripping.
- `npm run build` performs the production build.
- `npm run db:generate` regenerates the D1 migration after schema changes.

Reframe is not medical care. Crisis routing links to [Find A Helpline](https://findahelpline.com/) globally and the [988 Lifeline](https://988lifeline.org/) in the United States.
