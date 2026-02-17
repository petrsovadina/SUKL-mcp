import { NextRequest, NextResponse } from "next/server";
import { handleJsonRpc, SERVER_INFO } from "@/lib/mcp-handler";

// ============================================================================
// Rate Limiting (in-memory, resets on cold start)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Cleanup stale entries
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32000,
          message: "Překročen limit požadavků. Zkuste to znovu za minutu.",
        },
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: invalid JSON" },
      },
      { status: 400 }
    );
  }

  // Batch request
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((req) => handleJsonRpc(req))
    );
    const nonNull = responses.filter(Boolean);
    if (nonNull.length === 0) {
      return new NextResponse(null, { status: 202 });
    }
    return NextResponse.json(nonNull);
  }

  // Single request
  const result = await handleJsonRpc(body as Parameters<typeof handleJsonRpc>[0]);

  // Notification — no response body
  if (result === null) {
    return new NextResponse(null, { status: 202 });
  }

  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    description: SERVER_INFO.description,
    protocol: "MCP Streamable HTTP",
    protocolVersion: "2025-03-26",
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Accept, Mcp-Session-Id",
    },
  });
}
