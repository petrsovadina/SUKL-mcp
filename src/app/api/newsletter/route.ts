import { NextRequest, NextResponse } from "next/server";
import { createNewsletterSubscriber } from "@/lib/notion";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Příliš mnoho požadavků. Zkuste to za minutu." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Neplatný formát požadavku." },
      { status: 400 }
    );
  }

  const { email } = body as { email?: string };

  if (
    typeof email !== "string" ||
    !email.includes("@") ||
    email.length > 200
  ) {
    return NextResponse.json(
      { error: "Zadejte platný email." },
      { status: 400 }
    );
  }

  try {
    await createNewsletterSubscriber(email.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se přihlásit k odběru. Zkuste to znovu." },
      { status: 500 }
    );
  }
}
