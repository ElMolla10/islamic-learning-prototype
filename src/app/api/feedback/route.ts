import { NextResponse } from "next/server";
import { FEEDBACK_LIMITS, validateFeedback } from "@/lib/feedback";

export const FORMSPREE_TIMEOUT_MS = 8_000;

type FormspreePayload = {
  category: string;
  message: string;
  page: string;
  language: "ar" | "en";
  email?: string;
};

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function formspreeEndpoint() {
  const formId = process.env.FORMSPREE_FORM_ID;
  if (!formId || !/^[A-Za-z0-9_-]{6,64}$/.test(formId)) return null;
  return `https://formspree.io/f/${formId}`;
}

function expectedBrowserOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",", 1)[0].trim();
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https" ? `${forwardedProtocol}:` : url.protocol;
  return `${protocol}//${host}`;
}

async function deliver(payload: FormspreePayload, endpoint: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FORMSPREE_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false as const, code: "delivery_failed", status: 502 };

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      return { ok: false as const, code: "delivery_failed", status: 502 };
    }
    if (result === null || typeof result !== "object" || Array.isArray(result) || (result as { ok?: unknown }).ok !== true) {
      return { ok: false as const, code: "delivery_failed", status: 502 };
    }
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, code: "delivery_failed", status: error instanceof DOMException && error.name === "AbortError" ? 504 : 502 };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return json({ ok: false, code: "invalid_request" }, 415);

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") return json({ ok: false, code: "invalid_request" }, 403);
  const origin = request.headers.get("origin");
  if (origin !== expectedBrowserOrigin(request)) return json({ ok: false, code: "invalid_request" }, 403);

  let text: string;
  try {
    text = await request.text();
  } catch {
    return json({ ok: false, code: "invalid_request" }, 400);
  }
  if (text.length > FEEDBACK_LIMITS.maximumRequestCharacters) return json({ ok: false, code: "request_too_large" }, 413);

  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return json({ ok: false, code: "invalid_request" }, 400);
  }
  const validation = validateFeedback(input);
  if (!validation.ok) return json({ ok: false, code: "validation_error", errors: validation.errors }, 400);

  const endpoint = formspreeEndpoint();
  if (!endpoint) return json({ ok: false, code: "delivery_unavailable" }, 503);

  const delivery = await deliver({
    category: validation.data.category,
    message: validation.data.message,
    page: validation.data.pageContext,
    language: validation.data.language,
    ...(validation.data.contact && validation.data.contactConsent ? { email: validation.data.contact } : {}),
  }, endpoint);
  return delivery.ok ? json({ ok: true }, 200) : json({ ok: false, code: delivery.code }, delivery.status);
}
