import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FORMSPREE_TIMEOUT_MS, POST } from "./route";

const originalFormId = process.env.FORMSPREE_FORM_ID;

function request(body: unknown, options: { origin?: string | null; headers?: Record<string, string> } = {}) {
  const headers = new Headers({ "Content-Type": "application/json", ...options.headers });
  if (options.origin !== null) headers.set("Origin", options.origin ?? "https://alpha.example");
  return new Request("https://alpha.example/api/feedback", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const valid = {
  category: "technical",
  message: "The next button did not respond on this page.",
  pageContext: "/sahabah/abu-bakr/lesson-1",
  language: "en",
  contact: "",
  contactConsent: false,
  website: "",
  startedAt: Date.now() - 5000,
};

function accepted() {
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("feedback route", () => {
  beforeEach(() => {
    process.env.FORMSPREE_FORM_ID = "mockform";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalFormId === undefined) delete process.env.FORMSPREE_FORM_ID;
    else process.env.FORMSPREE_FORM_ID = originalFormId;
  });

  it("server-validates fields and returns no submitted text", async () => {
    const transport = vi.fn();
    vi.stubGlobal("fetch", transport);
    const response = await POST(request({ ...valid, category: "fatwa", message: "short" }));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, code: "validation_error", errors: { category: "invalid_category", message: "message_too_short" } });
    expect(JSON.stringify(body)).not.toContain('"message":"short"');
    expect(transport).not.toHaveBeenCalled();
  });

  it("sends the exact allowlisted JSON fields and no learner headers or internal controls", async () => {
    const transport = vi.fn().mockResolvedValue(accepted());
    vi.stubGlobal("fetch", transport);
    const response = await POST(request({
      ...valid,
      message: "  Line one\r\nLine two\u0000  ",
      pageContext: "/sahabah/abu-bakr/lesson-1?private=value#card-2",
      contact: "tester@example.com",
      contactConsent: true,
      internalStatus: "private",
    }, { headers: { Cookie: "learner=private", "User-Agent": "learner-browser", Referer: "https://alpha.example/private?token=secret", "X-Forwarded-For": "192.0.2.1" } }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(transport).toHaveBeenCalledOnce();
    const [url, init] = transport.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://formspree.io/f/mockform");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Accept: "application/json", "Content-Type": "application/json" });
    expect(init.cache).toBe("no-store");
    expect(init.redirect).toBe("error");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init.body))).toEqual({
      category: "technical",
      message: "Line one\nLine two",
      page: "/sahabah/abu-bakr/lesson-1",
      language: "en",
      email: "tester@example.com",
    });
    expect(JSON.stringify(init)).not.toMatch(/startedAt|website|contactConsent|learner-browser|192\.0\.2\.1|token=secret|internalStatus|cookie|referer|forwarded/i);
  });

  it("omits email without consent and rejects an address that lacks consent", async () => {
    const transport = vi.fn().mockResolvedValue(accepted());
    vi.stubGlobal("fetch", transport);
    const acceptedWithoutContact = await POST(request(valid));
    expect(acceptedWithoutContact.status).toBe(200);
    expect(JSON.parse(String((transport.mock.calls[0][1] as RequestInit).body))).not.toHaveProperty("email");

    transport.mockClear();
    const rejected = await POST(request({ ...valid, contact: "tester@example.com", contactConsent: false }));
    expect(rejected.status).toBe(400);
    expect(transport).not.toHaveBeenCalled();
  });

  it("returns success after Formspree completes with an HTTP success status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(accepted()));
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("accepts HTTP 200 with an empty body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("accepts HTTP 204", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("accepts HTTP 200 without requiring an ok property or documented response body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("accepted upstream", { status: 200 })));
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("turns provider HTTP rejection into an honest failure without echoing its body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "rejected", message: valid.message }), { status: 422 })));
    const response = await POST(request(valid));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, code: "delivery_failed" });
  });

  it("handles timeout and network failure without throwing", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    })));
    const pending = POST(request(valid));
    await vi.advanceTimersByTimeAsync(FORMSPREE_TIMEOUT_MS + 1);
    const timeout = await pending;
    expect(timeout.status).toBe(504);
    expect(await timeout.json()).toEqual({ ok: false, code: "delivery_failed" });

    vi.useRealTimers();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    const network = await POST(request(valid));
    expect(network.status).toBe(502);
    expect(await network.json()).toEqual({ ok: false, code: "delivery_failed" });
  });

  it("honestly reports unavailable delivery for missing or invalid server-only configuration", async () => {
    const transport = vi.fn();
    vi.stubGlobal("fetch", transport);
    delete process.env.FORMSPREE_FORM_ID;
    let response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, code: "delivery_unavailable" });

    process.env.FORMSPREE_FORM_ID = "unsafe/form?id";
    response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(transport).not.toHaveBeenCalled();
  });

  it("requires the exact same-origin Origin and rejects absent or mismatched origins", async () => {
    const transport = vi.fn().mockResolvedValue(accepted());
    vi.stubGlobal("fetch", transport);
    expect((await POST(request(valid, { origin: null }))).status).toBe(403);
    expect((await POST(request(valid, { origin: "https://attacker.example" }))).status).toBe(403);
    expect((await POST(request(valid, { origin: "https://alpha.example" }))).status).toBe(200);
    expect(transport).toHaveBeenCalledOnce();
  });

  it("never reads, echoes, or logs a successful provider body, request text, contact details, or configuration", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const providerResponse = new Response(JSON.stringify({ provider: "private upstream detail", ok: false }), { status: 200 });
    const readJson = vi.spyOn(providerResponse, "json");
    const readText = vi.spyOn(providerResponse, "text");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(providerResponse));
    const response = await POST(request({ ...valid, message: "Synthetic private text for log isolation.", contact: "tester@example.com", contactConsent: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(readJson).not.toHaveBeenCalled();
    expect(readText).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
