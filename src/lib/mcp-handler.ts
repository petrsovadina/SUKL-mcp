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
  getDataStats,
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
      "Příbalový leták (PIL) léčivého přípravku. Obsahuje informace pro pacienty o užívání, dávkování, nežádoucích účincích a kontraindikacích.",
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
      "Souhrn údajů o přípravku (SPC/SmPC). Odborný dokument pro zdravotnické pracovníky s farmakologickými vlastnostmi a klinickými údaji.",
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

function validateString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Parametr '${name}' musí být neprázdný řetězec.`);
  }
  return value.trim();
}

function validateNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (value === undefined || value === null) return fallback;
  const n = typeof value === "number" ? value : Number(value);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: string; text: string }[] }> {
  try {
    let result: unknown;

    switch (name) {
      case "search-medicine": {
        const query = validateString(args.query, "query");
        const limit = validateNumber(args.limit, 20, 1, 100);
        result = await searchMedicines(query, limit);
        break;
      }
      case "get-medicine-details": {
        const code = args.sukl_code as string;
        result = await getMedicineByCode(code);
        if (!result) {
          return {
            content: [
              {
                type: "text",
                text: `Lék s SÚKL kódem '${code}' nebyl nalezen.`,
              },
            ],
          };
        }
        break;
      }
      case "check-availability": {
        const code = args.sukl_code as string;
        result = await checkAvailability(code);
        if (!result) {
          return {
            content: [
              {
                type: "text",
                text: `Lék s SÚKL kódem '${code}' nebyl nalezen.`,
              },
            ],
          };
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
        const atcCode = args.atc_code as string;
        const includeMedicines = (args.include_medicines as boolean) || false;
        const medicinesLimit = (args.medicines_limit as number) || 20;

        const atcInfo = await getATCInfo(atcCode);
        if (!atcInfo) {
          return {
            content: [
              {
                type: "text",
                text: `ATC kód '${atcCode}' nebyl nalezen.`,
              },
            ],
          };
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
        const code = args.sukl_code as string;
        result = await getReimbursement(code);
        if (!result) {
          return {
            content: [
              {
                type: "text",
                text: `Informace o úhradě pro SÚKL kód '${code}' nejsou k dispozici.`,
              },
            ],
          };
        }
        break;
      }
      case "get-pil-content": {
        const code = args.sukl_code as string;
        result = await getDocumentContent(code, "PIL");
        if (!result) {
          return {
            content: [
              {
                type: "text",
                text: `Příbalový leták pro SÚKL kód '${code}' nebyl nalezen.`,
              },
            ],
          };
        }
        break;
      }
      case "get-spc-content": {
        const code = args.sukl_code as string;
        result = await getDocumentContent(code, "SPC");
        if (!result) {
          return {
            content: [
              {
                type: "text",
                text: `SPC pro SÚKL kód '${code}' nebylo nalezeno.`,
              },
            ],
          };
        }
        break;
      }
      case "batch-check-availability": {
        const codes = args.sukl_codes as string[];
        const limited = codes.slice(0, 50);
        const results = await Promise.all(
          limited.map((code) => checkAvailability(code))
        );
        const validResults = results.filter(Boolean);
        result = {
          results: validResults,
          total_checked: limited.length,
          available_count: validResults.filter(
            (r) => r?.status === "available"
          ).length,
          unavailable_count: validResults.filter(
            (r) => r?.status === "unavailable"
          ).length,
          checked_at: new Date().toISOString(),
        };
        break;
      }
      default:
        return {
          content: [
            { type: "text", text: `Neznámý nástroj: '${name}'` },
          ],
        };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    // Log full error server-side, return safe message to client
    console.error(`MCP tool error [${name}]:`, error);
    const isValidation = error instanceof Error && error.message.startsWith("Parametr");
    return {
      content: [
        {
          type: "text",
          text: isValidation
            ? (error as Error).message
            : "Chyba při zpracování požadavku. Zkuste to znovu.",
        },
      ],
    };
  }
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
