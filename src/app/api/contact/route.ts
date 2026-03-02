import { NextRequest, NextResponse } from "next/server";
import { createEnterpriseContact } from "@/lib/notion";
import { sendEnterpriseNotification } from "@/lib/resend";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

const VALID_SIZES = ["1–10", "11–50", "51–200", "200+"];

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

  const { email, company, phone, companySize, message, name, gdprConsentAt } = body as {
    email?: string;
    company?: string;
    phone?: string;
    companySize?: string;
    message?: string;
    name?: string;
    gdprConsentAt?: string;
  };

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.length > 200
  ) {
    return NextResponse.json(
      { error: "Zadejte své jméno." },
      { status: 400 }
    );
  }

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
      { error: "Zadejte název firmy." },
      { status: 400 }
    );
  }

  if (
    typeof message !== "string" ||
    message.trim().length < 10 ||
    message.length > 2000
  ) {
    return NextResponse.json(
      { error: "Zpráva musí mít alespoň 10 znaků." },
      { status: 400 }
    );
  }

  if (typeof gdprConsentAt !== "string" || !gdprConsentAt) {
    return NextResponse.json(
      { error: "Souhlas se zpracováním údajů je povinný." },
      { status: 400 }
    );
  }

  const selectedSize = VALID_SIZES.includes(companySize as string)
    ? (companySize as string)
    : "1–10";

  try {
    await createEnterpriseContact({
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      companySize: selectedSize,
      message: message.trim(),
      gdprConsentAt,
    });

    // Send notification email (non-blocking)
    try {
      await sendEnterpriseNotification({
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        companySize: selectedSize,
        message: message.trim(),
      });
    } catch (emailError) {
      console.error("Resend email error:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se odeslat poptávku. Zkuste to znovu." },
      { status: 500 }
    );
  }
}
