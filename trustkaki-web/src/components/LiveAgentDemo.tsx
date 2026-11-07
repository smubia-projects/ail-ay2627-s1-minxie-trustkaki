"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import OfficialSourceText from "./OfficialSourceText";
import AgentTracePanel from "./AgentTracePanel";
import { judgeRunSchema, type JudgeRun } from "./judgeRunViewModel";
import { LIVE_DEMO_SENIORS } from "@/data/liveDemoSeniors";
import { isHandledApiError, postJSON } from "@/lib/apiClient";

interface Turn {
  id: string;
  sender: "senior" | "trustkaki";
  text: string;
}

const HISTORY_TURNS = 10;

/**
 * Live agent demo: send a message as one of the fictional seniors and the API runs the
 * student's agent team (triage, digital safety, context memory, community activities,
 * policy). The conversation lives only in this component; each request carries the last
 * few turns, and nothing is saved.
 */
export default function LiveAgentDemo() {
  const [seniorId, setSeniorId] = useState(LIVE_DEMO_SENIORS[0].id);
  const senior = LIVE_DEMO_SENIORS.find((item) => item.id === seniorId) ?? LIVE_DEMO_SENIORS[0];
  const [conversation, setConversation] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<JudgeRun | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(true);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  function chooseSenior(id: string) {
    requestRef.current?.abort();
    setSeniorId(id);
    setConversation([]);
    setDraft("");
    setError(null);
    setRun(null);
    setBusy(false);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (busy || !text) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const inbound: Turn = { id: crypto.randomUUID(), sender: "senior", text };
    const history = conversation.slice(-HISTORY_TURNS).map(({ sender, text: turnText }) => ({ sender, text: turnText }));
    setConversation((current) => [...current, inbound]);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const raw = await postJSON<unknown>("/api/agents/orchestrate", { seniorId, message: text, history }, controller.signal);
      const result = judgeRunSchema.parse(raw);
      if (controller.signal.aborted) return;
      setConversation((current) => [
        ...current,
        ...result.messages.map((message, index) => ({ id: `${inbound.id}:reply:${index}`, sender: "trustkaki" as const, text: message.text })),
      ]);
      setRun(result);
    } catch (failure) {
      if (controller.signal.aborted) return;
      // The message stays on screen but wasn't answered; take it out so the next request's history is accurate.
      setConversation((current) => current.filter((turn) => turn.id !== inbound.id));
      setDraft(text);
      setError(isHandledApiError(failure)
        ? "This message wasn't sent to the agents."
        : failure instanceof Error ? failure.message : "The agent team couldn't answer just now. Please try again.");
    } finally {
      if (requestRef.current === controller) setBusy(false);
    }
  }

  return (
    <section aria-label="Live agent demo" className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--care-line)] px-5 py-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">See how TrustKaki decides</h1>
          <p className="mt-1 text-sm text-gray-600">Fictional seniors · live AI agents · nothing is saved</p>
        </div>
        <label className="text-sm font-semibold">Fictional senior
          <select value={seniorId} disabled={busy} onChange={(event) => chooseSenior(event.target.value)} className="ml-3 min-h-11 max-w-full border border-[var(--care-line)] bg-white px-3 text-sm font-normal">
            {LIVE_DEMO_SENIORS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
        <div className="flex min-h-[480px] min-w-0 flex-col border-b border-[var(--care-line)] lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-[var(--care-line)] px-5 py-4">
            <h2 className="text-base font-semibold">Chat as {senior.name}</h2>
            <p className="mt-1 text-sm text-gray-600">{senior.age} · {senior.livingSituation}. Caregiver: {senior.caregiver}.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--care-surface-muted)] px-4 py-5 sm:px-5" role="log" aria-label="Demo messages" aria-live="polite" aria-busy={busy}>
            {conversation.length === 0 && <p className="py-6 text-base leading-7 text-gray-600">Write a check-in reply as this senior: a health worry, a suspicious message, or an invitation they want to turn down. Then compare the agents that ran with the final reply.</p>}
            {conversation.map((turn) => <article key={turn.id} className={`mb-5 flex ${turn.sender === "senior" ? "justify-end" : "justify-start"}`}>
              <div className={`min-w-0 max-w-[90%] rounded-2xl border border-[var(--care-line)] px-4 py-3 sm:max-w-[85%] ${turn.sender === "senior" ? "rounded-br-md bg-[var(--care-sage)]" : "rounded-bl-md bg-white"}`}>
                <h3 className="text-sm font-semibold text-[var(--care-brand)]">{turn.sender === "senior" ? senior.name : "TrustKaki"}</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-base leading-7">{turn.sender === "trustkaki" ? <OfficialSourceText text={turn.text} /> : turn.text}</p>
              </div>
            </article>)}
            {busy && <p role="status" className="py-4 text-sm text-gray-600">The agents are reviewing the message and known context…</p>}
            {error && <p role="alert" className="my-4 border-l-2 border-[var(--care-coral)] pl-3 text-sm leading-6">{error}</p>}
          </div>
          <form onSubmit={send} className="shrink-0 border-t border-[var(--care-line)] p-5">
            <label htmlFor="live-demo-message" className="text-sm font-semibold">Senior’s message</label>
            <textarea id="live-demo-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} rows={3} disabled={busy} className="mt-2 w-full resize-y border border-[var(--care-line)] p-3 text-base disabled:opacity-50" placeholder="Type a fictional message…" />
            <div className="mt-3 flex flex-wrap gap-2">
              {senior.examples.map((example) => (
                <button key={example} type="button" disabled={busy} onClick={() => setDraft(example)} className="min-h-9 border border-[var(--care-line)] bg-white px-3 py-1 text-left text-xs text-[var(--care-brand)] hover:bg-[var(--care-mist)]">
                  {example}
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={busy || !draft.trim()} className="care-primary-button text-sm">{busy ? "Running…" : "Send to the agents"}</button>
            </div>
          </form>
        </div>
        <div className="min-h-[380px] min-w-0 lg:min-h-0">
          <AgentTracePanel traces={run?.traces ?? []} run={run} visible={detailsVisible} onToggle={() => setDetailsVisible((value) => !value)} />
        </div>
      </div>
    </section>
  );
}
