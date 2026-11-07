"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell, { type AppView } from "./AppShell";
import Dashboard from "./Dashboard";
import LiveAgentDemo from "./LiveAgentDemo";
import { CareActivity } from "./dashboard/CareActivity";
import { DemoGuide, type DemoGuideCommands } from "./dashboard/DemoGuide";
import { demoGuideComposition, type DemoPhase } from "./dashboard/demoGuideState";
import type { DashboardData } from "@/lib/types";
import {
  applyPublicDemoCommand,
  createInitialPublicDemo,
  PUBLIC_DEMO_STORAGE_KEY,
  serializePublicDemo,
  type PublicDemoCommand,
  type PublicDemoDocument,
} from "@/lib/publicDemoState";

function persist(document: PublicDemoDocument): void {
  try { window.sessionStorage.setItem(PUBLIC_DEMO_STORAGE_KEY, serializePublicDemo(document)); } catch { /* storage is optional */ }
}

/**
 * The whole public demo: the student's guided care desk (fictional senior, browser-only
 * state, no AI) and the live agent chat (LiveAgentDemo, real model calls through the API).
 */
export default function PublicDemoWorkspace({
  initialDocument,
}: {
  initialDocument?: PublicDemoDocument;
}) {
  const [document, setDocument] = useState<PublicDemoDocument>(initialDocument ?? createInitialPublicDemo());
  const documentRef = useRef(document);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [timelineRequest, setTimelineRequest] = useState(0);
  const [liveAgents, setLiveAgents] = useState(false);
  // "Exit guided demo" leaves the guide and shows the care desk as it is; Reset demo starts over.
  const [guideOn, setGuideOn] = useState(true);

  useEffect(() => { documentRef.current = document; }, [document]);

  const update = useCallback((next: PublicDemoDocument) => {
    documentRef.current = next;
    setDocument(next);
    persist(next);
  }, []);

  const run = useCallback(async (command: PublicDemoCommand) => {
    const next = applyPublicDemoCommand(documentRef.current, command);
    update(next);
    return { data: next.data, queueItemId: next.data.followUpQueue[0]?.id ?? (command === "resolve" ? "public-demo-case" : null), seniorId: next.data.selectedSeniorId ?? "public-demo-senior" };
  }, [update]);

  const commands = useMemo<DemoGuideCommands>(() => ({
    prepare: () => run("prepare"),
    refresh: () => run("refresh"),
    recordResponse: () => run("recordResponse"),
    resolve: () => run("resolve"),
  }), [run]);

  const reset = useCallback(() => {
    setDemoError(null);
    setGuideOn(true);
    update(createInitialPublicDemo());
  }, [update]);

  const phase = document.phase;
  const composition = demoGuideComposition({ activeView: document.activeView, enabled: guideOn, phase });
  const changePhase = useCallback((nextPhase: DemoPhase) => {
    if (nextPhase === "exited") return;
    const current = documentRef.current;
    update({ ...current, phase: nextPhase, activeView: nextPhase === "complete" ? "activity" : current.activeView });
  }, [update]);
  const changeView = useCallback((view: AppView) => {
    setLiveAgents(view === "demo");
    if (view !== "demo") update({ ...documentRef.current, activeView: view });
  }, [update]);
  const data: DashboardData = document.data;

  return (
    <AppShell
      activeView={liveAgents ? "demo" : document.activeView}
      riskLevel={data.senior.riskLevel}
      onViewChange={changeView}
    >
      {liveAgents ? <LiveAgentDemo /> : <>
      <div className="flex h-full overflow-hidden">
        <div className="relative min-w-0 flex-1">
          <DemoGuide
            enabled={guideOn}
            variant="public"
            phase={phase}
            error={demoError}
            data={data}
            authToken=""
            commands={commands}
            onPhaseChange={changePhase}
            onErrorChange={setDemoError}
            onDataChange={(nextData) => update({ ...documentRef.current, data: nextData })}
            onRefresh={async () => data}
            onOpenTimeline={() => { update({ ...documentRef.current, activeView: "workspace" }); setTimelineRequest((value) => value + 1); }}
            onUnauthorized={reset}
            onExit={() => setGuideOn(false)}
          >
            <div className={composition.showWorkspace ? "h-full" : "hidden"}>
              <Dashboard
                data={data}
                traces={[]}
                briefing={null}
                onRefresh={async () => data}
                authToken=""
                isDemoAdmin={false}
                guideLocked={composition.lockWorkspaceMutations || true}
                openTimelineRequest={timelineRequest}
                onUnauthorized={reset}
                onSelectSenior={() => undefined}
                seniorContext={null}
                seniorContextLoading={false}
                seniorContextError={null}
                onViewActivity={() => changeView("activity")}
              />
            </div>
            {composition.showActivity && (
              <CareActivity
                activity={data.activity ?? []}
                queue={data.followUpQueue}
                seniorName={data.senior.name}
                onReturnToWorkspace={() => changeView("workspace")}
              />
            )}
          </DemoGuide>
        </div>
      </div>
      <div className="sr-only">Demo data. Reset demo restores the original fictional case.</div>
      <button type="button" onClick={reset} className="fixed bottom-4 right-4 z-20 min-h-10 border border-[var(--care-evergreen)] bg-white px-3 py-2 text-xs font-semibold text-[var(--care-evergreen)]">Reset demo</button>
      </>}
    </AppShell>
  );
}
