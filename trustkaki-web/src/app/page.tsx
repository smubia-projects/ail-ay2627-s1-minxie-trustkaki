"use client";

import { useEffect, useState } from "react";
import OperationalState from "@/components/OperationalState";
import PublicDemoWorkspace from "@/components/PublicDemoWorkspace";
import { PUBLIC_DEMO_STORAGE_KEY, restorePublicDemo, type PublicDemoDocument } from "@/lib/publicDemoState";

/**
 * AI Lodge showcase: the public demo only. There are no accounts; the guided care desk's
 * state stays in this tab (sessionStorage) and the live agent chat calls the API.
 */
export default function Home() {
  const [document, setDocument] = useState<PublicDemoDocument | null | undefined>(undefined);

  useEffect(() => {
    let restored: PublicDemoDocument | null = null;
    try {
      restored = restorePublicDemo(window.sessionStorage.getItem(PUBLIC_DEMO_STORAGE_KEY));
    } catch {
      // Storage unavailable: start the demo clean.
    }
    // Read browser storage once on mount; the server render has no access to it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDocument(restored);
  }, []);

  if (document === undefined) {
    return (
      <div className="min-h-screen">
        <OperationalState kind="loading" message="Loading TrustKaki..." />
      </div>
    );
  }
  return <PublicDemoWorkspace initialDocument={document ?? undefined} />;
}
