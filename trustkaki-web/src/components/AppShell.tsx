"use client";

import type { ReactNode } from "react";
import type { RiskLevel } from "@/lib/types";
import NavBar from "./NavBar";

/** workspace = the guided care desk, activity = its case history, demo = the live agent chat. */
export type AppView = "workspace" | "activity" | "demo";

interface AppShellProps {
  activeView: AppView;
  riskLevel: RiskLevel;
  onViewChange: (view: AppView) => void;
  children?: ReactNode;
}

export default function AppShell({ activeView, riskLevel, onViewChange, children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-[var(--care-mist)] text-[var(--care-ink)]">
      <a
        href="#main-content"
        className="sr-only z-50 bg-[var(--care-paper)] px-4 py-3 font-semibold text-[var(--care-evergreen)] focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <NavBar activeView={activeView} riskLevel={riskLevel} onViewChange={onViewChange} />
      <div id="main-content" tabIndex={-1} className="min-h-0 flex-1">
        {children}
      </div>
    </div>
  );
}
