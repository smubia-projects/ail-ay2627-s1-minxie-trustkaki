import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PublicDemoWorkspace from "./PublicDemoWorkspace";

describe("public demo", () => {
  it("opens on the guided care desk with fictional data and no account controls", () => {
    const html = renderToStaticMarkup(createElement(PublicDemoWorkspace, {}));

    expect(html).toContain("Fictional demo data");
    expect(html).toContain("Reset demo");
    expect(html).toContain("Start guided demo");
    expect(html).toContain("Live agents");
    expect(html).not.toContain("Care setup");
    expect(html).not.toContain("Sign out");
    expect(html).not.toContain("Sign in");
  });
});
