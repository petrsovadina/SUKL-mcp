import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/notion";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

const VALID_USE_CASES = [
  "Chatbot",
  "Lékárna",
  "Klinický systém",
  "Výzkum",
  "Jiné",
];

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

  const { email, company, useCase } = body as {
    email?: string;
    company?: string;
    useCase?: string;
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

  if (
    typeof company !== "string" ||
    company.trim().length < 2 ||
    company.length > 200
  ) {
    return NextResponse.json(
      { error: "Zadejte název firmy nebo projektu." },
      { status: 400 }
    );
  }

  const selectedUseCase = VALID_USE_CASES.includes(useCase as string)
    ? (useCase as string)
    : "Jiné";

  try {
    await createLead({
      email: email.trim(),
      company: company.trim(),
      useCase: selectedUseCase,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se odeslat registraci. Zkuste to znovu." },
      { status: 500 }
    );
  }
}
