# TrustKaki — developer guide (AI Lodge showcase)

AI-assisted care coordination for AAC staff, by Ng Min Xie. Start with the [project overview](../README.md) (including what the [AI Lodge deployment](../README.md#ai-lodge-showcase-deployment) keeps and leaves out), the [demo guide](docs/DEMO_GUIDE.md) and the [architecture explanation](docs/ARCHITECTURE.md). The student's original guide, with Supabase, Neon memory, Telegram and WhatsApp, is in this repository's history before the AI Lodge commits.

## Runtime stack

| Layer | Implementation |
| --- | --- |
| Web application | Next.js 16, React, TypeScript, on Vercel (`NEXT_PUBLIC_API_BASE` = the API URL) |
| API | Express 5 in `server/`, bundled with esbuild into one file, on Cloud Run |
| Conversational agents | OpenAI-compatible chat adapter (`src/lib/agents/provider.ts`): `API_BASE_URL`, `API_KEY`, `MODEL_NAME` (default `deepseek-v4-flash`, JSON output) |
| Senior context | Fictional profiles, routines and confirmed preferences in `src/data/liveDemoSeniors.ts` |
| Rate limit | Shared AI Lodge engine (`server/rateLimitEngine.js`, Upstash Redis), bucket `chat` |
| Outdoor information | data.gov.sg/NEA weather and regional air-quality APIs |

## Local setup

```bash
npm ci
cp .env.example .env      # set API_KEY; leave UPSTASH_* empty for no limit
npm run dev:server        # API on http://localhost:8080
npm run dev               # frontend on http://localhost:3000
```

## Code navigation

- `src/components/PublicDemoWorkspace.tsx`: the demo shell (guided care desk + Live agents).
- `src/components/LiveAgentDemo.tsx`: the live chat and decision trail; `src/lib/apiClient.ts` handles 429 (CTA) and 503 (paused).
- `server/server.ts`: `/api/health` and `POST /api/agents/orchestrate`; `server/rateLimit.ts`: the limiter adapter.
- `src/lib/agents/`: prompts, typed contracts, schemas, runners, Jev routing (off) and final policy.
- `src/lib/patterns/`, `src/lib/publicDemoState.ts`: multi-day signal rules and the browser-only guided demo.

## Verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run build:server
```

## Limitations

Fictional data only: do not type real personal information. Model output remains fallible and the application is not clinically validated. Each message runs several model calls within a 45-second budget; if a call fails, that agent uses the student's safe fallback and the decision trail says so.
