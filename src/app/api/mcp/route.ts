import { NextRequest, NextResponse } from "next/server";
import { handleJsonRpc, SERVER_INFO } from "@/lib/mcp-handler";

export async function POST(request: NextRequest) {
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
