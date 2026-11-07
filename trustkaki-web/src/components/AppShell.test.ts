import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AppShell from "./AppShell";

describe("AppShell", () => {
  it("exposes one compact primary navigation with the two demo views", () => {
    const html = renderToStaticMarkup(createElement(AppShell, {
      activeView: "workspace",
      riskLevel: "green",
      onViewChange: () => undefined,
    }));
    const primaryNavigation = html.match(/<nav[^>]*aria-label="Primary"[^>]*>/)?.[0];

    expect(primaryNavigation).toBeDefined();
    expect(primaryNavigation).not.toContain("hidden");
    expect((html.match(/aria-label="Primary"/g) ?? [])).toHaveLength(1);
    expect((html.match(/>Guided care desk</g) ?? [])).toHaveLength(1);
    expect((html.match(/>Live agents</g) ?? [])).toHaveLength(1);
    expect(html).not.toContain("Care setup");
    expect(html).not.toContain("Sign out");
  });

  it("marks the live agent view as current and keeps the skip link", () => {
    const html = renderToStaticMarkup(createElement(
      AppShell,
      { activeView: "demo", riskLevel: "yellow", onViewChange: () => undefined },
      createElement("div", null, "Workspace"),
    ));

    expect(html).toMatch(/aria-current="page"[^>]*>Live agents</);
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content"');
    expect(html).toContain("Needs attention");
  });
});
