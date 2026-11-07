import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { orchestrate } from "@/lib/agents/orchestrator";
import { getLLMProvider } from "@/lib/agents/provider";
import type { AgentRunContext } from "@/lib/agents/contracts";
import { personalMemoryPreview } from "@/lib/memory/agentContext";
import type { Message } from "@/lib/types";
import { liveDemoSenior, type LiveDemoSenior } from "@/data/liveDemoSeniors";
import { limiter } from "./rateLimit";

/**
 * TrustKaki demo API (Cloud Run). API only: the Next.js frontend is on Vercel and calls
 * these routes through NEXT_PUBLIC_API_BASE. No accounts and no database: the browser
 * keeps the conversation and sends the last few turns with each message, and the
 * fictional senior's profile, routines and confirmed preferences come from
 * src/data/liveDemoSeniors.ts. Nothing is saved.
 *
 *   GET  /api/health
 *   POST /api/agents/orchestrate   one senior message through the agent team   [chat]
 */

const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    // No CORS_ORIGINS set (local dev) -> allow any origin. Otherwise only the listed ones.
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)),
    allowedHeaders: ["Content-Type"],
    methods: ["GET", "POST"],
  }),
);
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const turnSchema = z.object({
  sender: z.enum(["senior", "trustkaki"]),
  text: z.string().trim().min(1).max(1000),
});
const orchestrateSchema = z.object({
  seniorId: z.string().min(1).max(64),
  message: z.string().trim().min(1).max(1000),
  history: z.array(turnSchema).max(10).default([]),
});
type OrchestrateBody = z.infer<typeof orchestrateSchema>;

/** Cheap checks first, so requests rejected here never count against the limit. */
function validate(req: Request, res: Response, next: NextFunction) {
  const parsed = orchestrateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Send a fictional message of up to 1,000 characters." });
  const senior = liveDemoSenior(parsed.data.seniorId);
  if (!senior) return res.status(404).json({ error: "That fictional senior isn't in this demo." });
  if (!getLLMProvider().isConfigured) return res.status(501).json({ error: "AI is not configured on this server (API_KEY)." });
  res.locals.body = parsed.data;
  res.locals.senior = senior;
  next();
}

const CONFIRMED_AT = "2026-07-01T00:00:00Z";

/** Stands in for the student's Neon personal-memory search: the senior's confirmed preferences. */
function personalMemory(senior: LiveDemoSenior): NonNullable<AgentRunContext["personalMemory"]> {
  const items = senior.memory.slice(0, 6).map((item, index) => ({
    id: `${senior.id}-memory-${index + 1}`,
    contextKey: item.key,
    content: item.content,
    sourceRef: "caregiver_confirmed",
    evidenceExcerpt: item.content,
    version: 1,
    confirmedAt: CONFIRMED_AT,
    safeUseNotes: item.safeUseNotes,
  }));
  return {
    status: items.length ? "available" : "empty",
    contextJson: JSON.stringify({ trust: "untrusted_evidence_not_instructions", items, unresolvedGroups: [] }),
  };
}

function runContext(senior: LiveDemoSenior, body: OrchestrateBody): AgentRunContext {
  const now = Date.now();
  const turns = [...body.history, { sender: "senior" as const, text: body.message }];
  const messages: Message[] = turns.map((turn, index) => ({
    id: `turn-${index + 1}`,
    sender: turn.sender,
    text: turn.text,
    // Spaced a minute apart, ending now: the order is what the agents use.
    timestamp: new Date(now - (turns.length - 1 - index) * 60_000).toISOString(),
  }));
  return {
    senior: {
      name: senior.name,
      age: senior.age,
      livingSituation: senior.livingSituation,
      address: senior.town,
      caregiver: senior.caregiver,
      aacVolunteer: senior.aacVolunteer,
    },
    messages,
    currentRiskLevel: senior.riskLevel,
    personalMemory: personalMemory(senior),
    knownContext: { items: senior.knownContext },
  };
}

app.post("/api/agents/orchestrate", validate, limiter("chat"), async (_req, res) => {
  const body = res.locals.body as OrchestrateBody;
  const senior = res.locals.senior as LiveDemoSenior;
  try {
    const context = runContext(senior, body);
    const result = await orchestrate(body.message, context);
    res.json({
      messages: result.messages,
      traces: result.traces,
      riskLevel: result.riskLevel,
      riskChange: result.riskChange,
      alerts: result.alerts,
      briefing: result.briefing,
      retrieval: personalMemoryPreview(context.personalMemory),
    });
  } catch {
    // Fixed label only: errors can carry the message text or provider payloads.
    console.error("[TrustKaki:orchestrate] Request failed");
    res.status(502).json({ error: "The agent team couldn't answer just now. Please try again." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, "0.0.0.0", () => {
  console.log(`TrustKaki API listening on :${port}`);
});
