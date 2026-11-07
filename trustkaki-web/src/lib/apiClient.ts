// Browser helper for calling the TrustKaki demo API (server/, on Cloud Run).
//
// The API runs separately from this Next.js frontend, so every request is prefixed with
// NEXT_PUBLIC_API_BASE (inlined at build time; locally the Express dev server on 8080).
// The shared rate limiter's answers are handled here, once:
//  - 429 (limit reached) -> RATE_LIMIT_EVENT with queries_used, for the CTA modal
//  - 503 (demo paused)   -> DEMO_PAUSED_EVENT with the message, for the paused notice
// Both throw a HandledApiError, which callers treat as "already shown".

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080").replace(/\/+$/, "");

export const RATE_LIMIT_EVENT = "trustkaki:rate-limit";
export const DEMO_PAUSED_EVENT = "trustkaki:demo-paused";

/** Thrown after a 429 or 503 has already been shown to the visitor. */
export class HandledApiError extends Error {
  constructor(public status: number) {
    super(status === 429 ? "You've reached this demo's limit." : "This demo is paused right now.");
  }
}

export const isHandledApiError = (error: unknown): error is HandledApiError => error instanceof HandledApiError;

export async function postJSON<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("We couldn't reach TrustKaki. Check your internet connection and try again.");
  }
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response (a platform timeout page).
  }
  const obj = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  if (response.status === 429 || response.status === 503) {
    const detail = response.status === 429
      ? { queriesUsed: Number(obj.queries_used) || 0 }
      : { message: typeof obj.message === "string" ? obj.message : "" };
    window.dispatchEvent(new CustomEvent(response.status === 429 ? RATE_LIMIT_EVENT : DEMO_PAUSED_EVENT, { detail }));
    throw new HandledApiError(response.status);
  }
  if (!response.ok) {
    throw new Error(typeof obj.error === "string" ? obj.error : "Something went wrong. Please try again.");
  }
  return data as T;
}
