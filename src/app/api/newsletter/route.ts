import { NextRequest, NextResponse } from "next/server";
import { createNewsletterSubscriber, checkNewsletterDuplicate } from "@/lib/notion";
import { sendNewsletterConfirmation } from "@/lib/resend";

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

  const { email, gdprConsentAt } = body as {
    email?: string;
    gdprConsentAt?: string;
  };

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

  if (typeof gdprConsentAt !== "string" || !gdprConsentAt) {
    return NextResponse.json(
      { error: "Souhlas se zpracováním údajů je povinný." },
      { status: 400 }
    );
  }

  const trimmedEmail = email.trim();

  // Duplicate check — if it fails, proceed anyway (don't lose subscriber)
  const isDuplicate = await checkNewsletterDuplicate(trimmedEmail);
  if (isDuplicate) {
    return NextResponse.json({
      success: true,
      message: "Tento email je již přihlášen k odběru.",
    });
  }

  try {
    await createNewsletterSubscriber(trimmedEmail, gdprConsentAt);

    // Send confirmation email (non-blocking)
    try {
      await sendNewsletterConfirmation(trimmedEmail);
    } catch (emailError) {
      console.error("Resend email error:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se přihlásit k odběru. Zkuste to znovu." },
      { status: 500 }
    );
  }
}
