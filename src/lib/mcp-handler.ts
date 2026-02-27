/**
 * MCP JSON-RPC 2.0 Handler
 * Implements Streamable HTTP transport for Model Context Protocol
 */

import {
  searchMedicines,
  getMedicineByCode,
  getReimbursement,
  getDocumentContent,
  checkAvailability,
  findPharmacies,
  getATCInfo,
  getMedicinesByATC,
} from "./sukl-client";

// ============================================================================
// JSON-RPC Types
// ============================================================================

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ============================================================================
// Tool Definitions
// ============================================================================

const TOOLS = [
  {
    name: "search-medicine",
    description:
      "Vyhledávání léčiv v české databázi SÚKL. Podporuje fuzzy vyhledávání podle názvu léku, účinné látky nebo SÚKL kódu.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Vyhledávací dotaz — název léku, účinná látka nebo SÚKL kód (min. 2 znaky)",
        },
        limit: {
          type: "number",
          description: "Maximální počet výsledků (výchozí: 20, rozsah: 1–100)",
          default: 20,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get-medicine-details",
    description:
      "Získání detailních informací o léčivém přípravku podle SÚKL kódu. Vrací registrační údaje, lékovou formu, účinné látky a držitele registrace.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sukl_code: {
          type: "string",
          description: "SÚKL kód léku (např. '0254045')",
        },
      },
      required: ["sukl_code"],
    },
  },
  {
    name: "check-availability",
    description:
      "Kontrola dostupnosti léčivého přípravku na trhu. Vrací informace o aktuální dostupnosti, případných výpadcích a očekávaném datu obnovení.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sukl_code: {
          type: "string",
          description: "SÚKL kód léku ke kontrole",
        },
      },
      required: ["sukl_code"],
    },
  },
  {
    name: "find-pharmacies",
    description:
      "Vyhledání lékáren v České republice. Filtrování podle města, PSČ nebo nepřetržitého provozu.",
    inputSchema: {
      type: "object" as const,
      properties: {
        city: {
          type: "string",
          description: "Název města (např. 'Praha', 'Brno')",
        },
        postal_code: {
          type: "string",
          description: "PSČ nebo jeho prefix (např. '110' pro Prahu 1)",
        },
        is_24h: {
          type: "boolean",
          description: "Filtrovat pouze lékárny s nepřetržitým provozem",
        },
      },
    },
  },
  {
    name: "get-atc-info",
    description:
      "Informace o ATC (Anatomicko-terapeuticko-chemická) klasifikaci léčiv. ATC systém kategorizuje léčiva podle terapeutického využití.",
    inputSchema: {
      type: "object" as const,
      properties: {
        atc_code: {
          type: "string",
          description: "ATC kód (např. 'N02BE01' pro paracetamol, 'C' pro kardiovaskulární)",
        },
        include_medicines: {
          type: "boolean",
          description: "Zahrnout seznam léčiv v dané ATC skupině (výchozí: false)",
          default: false,
        },
        medicines_limit: {
          type: "number",
          description: "Maximální počet léčiv v seznamu (výchozí: 20)",
          default: 20,
        },
      },
      required: ["atc_code"],
    },
  },
  {
    name: "get-reimbursement",
    description:
      "Informace o úhradě a cenách léčivého přípravku. Vrací maximální cenu, výši úhrady, doplatek pacienta a podmínky úhrady.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sukl_code: {
          type: "string",
          description: "SÚKL kód léku",
        },
      },
      required: ["sukl_code"],
    },
  },
  {
    name: "get-pil-content",
    description:
      "Příbalový leták (PIL) léčivého přípravku. Vrací metadata a URL ke stažení PDF dokumentu ze SÚKL. Pro parsování obsahu PDF doporučujeme docling-mcp server.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sukl_code: {
          type: "string",
          description: "SÚKL kód léku",
        },
      },
      required: ["sukl_code"],
    },
  },
  {
    name: "get-spc-content",
    description:
      "Souhrn údajů o přípravku (SPC/SmPC). Vrací metadata a URL ke stažení PDF dokumentu ze SÚKL. Pro parsování obsahu PDF doporučujeme docling-mcp server.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sukl_code: {
          type: "string",
          description: "SÚKL kód léku",
        },
      },
      required: ["sukl_code"],
    },
  },
  {
    name: "batch-check-availability",
    description:
      "Hromadná kontrola dostupnosti více léčivých přípravků najednou. Užitečné pro kontrolu celé medikace pacienta.",
    inputSchema: {
      type: "object" as const,
      properties: {
        sukl_codes: {
          type: "array",
          items: { type: "string" },
          description: "Pole SÚKL kódů ke kontrole (max 50)",
        },
      },
      required: ["sukl_codes"],
    },
  },
];

// ============================================================================
// Server Info
// ============================================================================

const SERVER_INFO = {
  name: "sukl-mcp",
  version: "5.0.0",
  description:
    "MCP server pro českou databázi léčivých přípravků SÚKL (~68k léků)",
};

// ============================================================================
// Tool Execution
// ============================================================================

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function validateString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`Parametr '${name}' musí být neprázdný řetězec.`);
  }
  return value.trim();
}

function validateArray(value: unknown, name: string, maxItems: number): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError(`Parametr '${name}' musí být neprázdné pole řetězců.`);
  }
  if (value.length > maxItems) {
    throw new ValidationError(`Maximální počet položek v '${name}' je ${maxItems}.`);
  }
  return value.map((item, i) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new ValidationError(`Položka ${i + 1} v '${name}' musí být neprázdný řetězec.`);
    }
    return item.trim();
  });
}

function validateNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (value === undefined || value === null) return fallback;
  const n = typeof value === "number" ? value : Number(value);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

type ToolResponse = { content: { type: string; text: string }[] };

function textResponse(text: string): ToolResponse {
  return { content: [{ type: "text", text }] };
}

async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResponse> {
  const startTime = performance.now();
  try {
    let result: unknown;

    switch (name) {
      case "search-medicine": {
        const query = validateString(args.query, "query");
        if (query.length > 200) {
          throw new ValidationError("Vyhledávací dotaz nesmí překročit 200 znaků.");
        }
        const limit = validateNumber(args.limit, 20, 1, 100);
        result = await searchMedicines(query, limit);
        break;
      }
      case "get-medicine-details": {
        const code = validateString(args.sukl_code, "sukl_code");
        result = await getMedicineByCode(code);
        if (!result) {
          return logAndReturn(name, args, startTime, "ok",
            textResponse(`Lék s SÚKL kódem '${code}' nebyl nalezen.`));
        }
        break;
      }
      case "check-availability": {
        const code = validateString(args.sukl_code, "sukl_code");
        result = await checkAvailability(code);
        if (!result) {
          return logAndReturn(name, args, startTime, "ok",
            textResponse(`Lék s SÚKL kódem '${code}' nebyl nalezen.`));
        }
        break;
      }
      case "find-pharmacies": {
        result = await findPharmacies(
          args.city as string | undefined,
          args.postal_code as string | undefined,
          args.is_24h as boolean | undefined
        );
        break;
      }
      case "get-atc-info": {
        const atcCode = validateString(args.atc_code, "atc_code");
        const includeMedicines = (args.include_medicines as boolean) || false;
        const medicinesLimit = (args.medicines_limit as number) || 20;

        const atcInfo = await getATCInfo(atcCode);
        if (!atcInfo) {
          return logAndReturn(name, args, startTime, "ok",
            textResponse(`ATC kód '${atcCode}' nebyl nalezen.`));
        }

        if (includeMedicines) {
          const medicines = await getMedicinesByATC(atcCode);
          result = {
            ...atcInfo,
            medicines: medicines.slice(0, medicinesLimit),
            medicines_total: medicines.length,
          };
        } else {
          result = atcInfo;
        }
        break;
      }
      case "get-reimbursement": {
        const code = validateString(args.sukl_code, "sukl_code");
        result = await getReimbursement(code);
        if (!result) {
          return logAndReturn(name, args, startTime, "ok",
            textResponse(`Informace o úhradě pro SÚKL kód '${code}' nejsou k dispozici.`));
        }
        break;
      }
      case "get-pil-content": {
        const code = validateString(args.sukl_code, "sukl_code");
        result = await getDocumentContent(code, "PIL");
        if (!result) {
          return logAndReturn(name, args, startTime, "ok",
            textResponse(`Příbalový leták pro SÚKL kód '${code}' nebyl nalezen.`));
        }
        break;
      }
      case "get-spc-content": {
        const code = validateString(args.sukl_code, "sukl_code");
        result = await getDocumentContent(code, "SPC");
        if (!result) {
          return logAndReturn(name, args, startTime, "ok",
            textResponse(`SPC pro SÚKL kód '${code}' nebylo nalezeno.`));
        }
        break;
      }
      case "batch-check-availability": {
        const codes = validateArray(args.sukl_codes, "sukl_codes", 50);
        const results = await Promise.all(
          codes.map((code) => checkAvailability(code))
        );
        const validResults = results.filter(Boolean);
        let availableCount = 0;
        let unavailableCount = 0;
        for (const r of validResults) {
          if (r?.status === "available") availableCount++;
          else if (r?.status === "unavailable") unavailableCount++;
        }
        result = {
          results: validResults,
          total_checked: codes.length,
          available_count: availableCount,
          unavailable_count: unavailableCount,
          checked_at: new Date().toISOString(),
        };
        break;
      }
      default:
        return logAndReturn(name, args, startTime, "ok",
          textResponse(`Neznámý nástroj: '${name}'`));
    }

    return logAndReturn(name, args, startTime, "ok",
      textResponse(JSON.stringify(result, null, 2)));
  } catch (error) {
    const duration_ms = Math.round(performance.now() - startTime);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({
      event: "mcp_tool_call",
      tool: name,
      params: args,
      duration_ms,
      status: "error",
      error: errorMessage,
    }));
    return textResponse(
      error instanceof ValidationError
        ? errorMessage
        : "Chyba při zpracování požadavku. Zkuste to znovu.",
    );
  }
}

function logAndReturn(
  tool: string,
  params: Record<string, unknown>,
  startTime: number,
  status: "ok" | "error",
  response: ToolResponse,
): ToolResponse {
  const duration_ms = Math.round(performance.now() - startTime);
  console.log(JSON.stringify({
    event: "mcp_tool_call",
    tool,
    params,
    duration_ms,
    status,
  }));
  return response;
}

// ============================================================================
// JSON-RPC Handler
// ============================================================================

export async function handleJsonRpc(
  request: JsonRpcRequest
): Promise<JsonRpcResponse | null> {
  const { method, params, id } = request;

  // Notifications (no id) — return null to signal 202 response
  if (id === undefined || id === null) {
    return null;
  }

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: SERVER_INFO,
        },
      };

    case "ping":
      return {
        jsonrpc: "2.0",
        id,
        result: {},
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS },
      };

    case "tools/call": {
      const toolName = (params as Record<string, unknown>)?.name as string;
      const toolArgs =
        ((params as Record<string, unknown>)?.arguments as Record<
          string,
          unknown
        >) || {};

      if (!toolName) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32602,
            message: "Invalid params: missing tool name",
          },
        };
      }

      const toolResult = await executeTool(toolName, toolArgs);
      return {
        jsonrpc: "2.0",
        id,
        result: toolResult,
      };
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

export { SERVER_INFO, TOOLS };
