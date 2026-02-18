import { describe, it, expect } from "vitest";
import { handleJsonRpc, TOOLS } from "@/lib/mcp-handler";

describe("TOOLS definitions", () => {
  it("has 9 tools defined", () => {
    expect(TOOLS).toHaveLength(9);
  });

  it("all tools have name, description, inputSchema", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("tool names are unique", () => {
    const names = TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("handleJsonRpc", () => {
  it("returns server info on initialize", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0" },
      },
    });
    expect(result).not.toBeNull();
    expect(result!.result).toHaveProperty("serverInfo");
    expect(result!.result).toHaveProperty("protocolVersion", "2025-03-26");
  });

  it("returns tools list with 9 tools", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
    expect(result).not.toBeNull();
    const tools = (result!.result as { tools: unknown[] }).tools;
    expect(tools).toHaveLength(9);
  });

  it("returns null for notifications (no id)", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      method: "ping",
    });
    expect(result).toBeNull();
  });

  it("returns error for unknown method", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 3,
      method: "unknown/method",
      params: {},
    });
    expect(result!.error).toBeDefined();
    expect(result!.error!.code).toBe(-32601);
  });

  it("returns error for missing tool name", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {},
    });
    expect(result!.error).toBeDefined();
    expect(result!.error!.code).toBe(-32602);
  });

  it("returns pong for ping", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 5,
      method: "ping",
      params: {},
    });
    expect(result).not.toBeNull();
    expect(result!.result).toEqual({});
  });

  it("rejects empty query in search-medicine", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "search-medicine",
        arguments: { query: "" },
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    expect(content[0].text).toContain("Parametr");
  });

  it("rejects query over 200 chars", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "search-medicine",
        arguments: { query: "a".repeat(201) },
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    expect(content[0].text).toContain("200");
  });

  it("returns unknown tool message for nonexistent tool", async () => {
    const result = await handleJsonRpc({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "nonexistent-tool",
        arguments: {},
      },
    });
    const content = (result!.result as { content: { text: string }[] }).content;
    expect(content[0].text).toContain("Neznámý nástroj");
  });
});
