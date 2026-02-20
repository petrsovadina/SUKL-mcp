import { describe, it, expect } from "vitest";
import { parseQuery } from "@/lib/demo-handler";

describe("parseQuery", () => {
  describe("search intent", () => {
    it("returns search for plain text", () => {
      const result = parseQuery("Ibuprofen");
      expect(result.intent).toBe("search");
      expect(result.params.query).toBe("Ibuprofen");
    });

    it("returns search for multi-word query", () => {
      const result = parseQuery("paralen 500mg");
      expect(result.intent).toBe("search");
    });

    it("handles empty input", () => {
      const result = parseQuery("");
      expect(result.intent).toBe("search");
    });

    it("trims whitespace", () => {
      const result = parseQuery("  Ibuprofen  ");
      expect(result.intent).toBe("search");
      expect(result.params.query).toBe("Ibuprofen");
    });
  });

  describe("detail intent", () => {
    it("detects 7-digit SÚKL code", () => {
      const result = parseQuery("0254045");
      expect(result.intent).toBe("detail");
      expect(result.params.sukl_code).toBe("0254045");
    });

    it("detects 4-digit code", () => {
      const result = parseQuery("1234");
      expect(result.intent).toBe("detail");
    });

    it("does not match 3-digit number as code", () => {
      const result = parseQuery("123");
      expect(result.intent).toBe("search");
    });
  });

  describe("atc intent", () => {
    it("detects ATC prefix", () => {
      const result = parseQuery("ATC N02");
      expect(result.intent).toBe("atc");
      expect(result.params.atc_code).toBe("N02");
    });

    it("detects ATC code pattern", () => {
      const result = parseQuery("N02BE01");
      expect(result.intent).toBe("atc");
      expect(result.params.atc_code).toBe("N02BE01");
    });

    it("is case insensitive for ATC prefix", () => {
      const result = parseQuery("atc n02");
      expect(result.intent).toBe("atc");
    });
  });

  describe("pharmacy intent", () => {
    it("detects lékárna keyword", () => {
      const result = parseQuery("lékárna v Praze");
      expect(result.intent).toBe("pharmacy");
    });

    it("detects without diacritics", () => {
      const result = parseQuery("lekarna Brno");
      expect(result.intent).toBe("pharmacy");
    });

    it("extracts city name", () => {
      const result = parseQuery("lékárny v Brně");
      expect(result.intent).toBe("pharmacy");
      expect(result.params.city).toBeDefined();
    });
  });
});
