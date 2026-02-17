/**
 * Build script: Download and process SÚKL pharmacy data
 *
 * Source: opendata.sukl.cz CSV (UTF-8, comma delimiter)
 * Output: Updates data/bundled-data.json with pharmacy data under key "p"
 *
 * Usage: npx tsx scripts/build-pharmacies.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CSV_URL =
  "https://opendata.sukl.cz/soubory/NKOD/LEKARNY/nkod_lekarny_seznam.csv";

interface BundledPharmacy {
  n: string; // name
  k: string; // workplace code (unique ID)
  a: string; // address
  c: string; // city
  z: string; // postal code
  t: string; // phone
  e: string; // email
  w: string; // web
  r: boolean; // has eRecept
  h: boolean; // is 24h
}

// CSV column indices (0-based, from SÚKL data interface)
const COL = {
  NAZEV: 0,
  KOD_PRACOVISTE: 1,
  // KOD_LEKARNY: 2,
  // ICZ: 3,
  // ICO: 4,
  MESTO: 5,
  ULICE: 6,
  PSC: 7,
  // LEKARNIK_PRIJMENI: 8,
  // LEKARNIK_JMENO: 9,
  // LEKARNIK_TITUL: 10,
  WWW: 11,
  EMAIL: 12,
  TELEFON: 13,
  // FAX: 14,
  ERP: 15,
  // TYP_LEKARNY: 16,
  // ZASILKOVY_PRODEJ: 17,
  POHOTOVOST: 18,
} as const;

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function isTruthy(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "ano" || v === "yes";
}

async function main() {
  console.log("Downloading pharmacy data from SÚKL...");
  console.log(`URL: ${CSV_URL}`);

  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download pharmacy CSV: ${response.status} ${response.statusText}`
    );
  }

  const csvText = await response.text();
  const lines = csvText.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error(
      `Unexpected CSV format: only ${lines.length} lines (expected header + data)`
    );
  }

  // Skip header row
  const header = parseCSVLine(lines[0]);
  console.log(`CSV header (${header.length} columns): ${header.slice(0, 5).join(", ")}...`);

  // Validate expected columns
  if (header.length < 19) {
    throw new Error(
      `Unexpected CSV format: ${header.length} columns (expected at least 19). First columns: ${header.slice(0, 5).join(", ")}`
    );
  }

  const pharmacies: BundledPharmacy[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 19) continue;

    const kod = fields[COL.KOD_PRACOVISTE]?.trim();
    if (!kod || seen.has(kod)) continue;
    seen.add(kod);

    pharmacies.push({
      n: fields[COL.NAZEV]?.trim() || "",
      k: kod,
      a: fields[COL.ULICE]?.trim() || "",
      c: fields[COL.MESTO]?.trim() || "",
      z: fields[COL.PSC]?.trim() || "",
      t: fields[COL.TELEFON]?.trim() || "",
      e: fields[COL.EMAIL]?.trim() || "",
      w: fields[COL.WWW]?.trim() || "",
      r: isTruthy(fields[COL.ERP] || ""),
      h: isTruthy(fields[COL.POHOTOVOST] || ""),
    });
  }

  console.log(`Parsed ${pharmacies.length} pharmacies (${seen.size} unique)`);

  // Load existing bundled data
  const dataPath = join(process.cwd(), "data/bundled-data.json");
  console.log(`Loading existing data from ${dataPath}...`);

  const existingData = JSON.parse(readFileSync(dataPath, "utf-8"));

  // Add pharmacies
  existingData.p = pharmacies;
  existingData._.c.p = pharmacies.length;

  // Write back
  writeFileSync(dataPath, JSON.stringify(existingData));
  const fileSizeMB = (Buffer.byteLength(JSON.stringify(existingData)) / 1024 / 1024).toFixed(1);
  console.log(
    `Updated ${dataPath} — ${pharmacies.length} pharmacies added (total file size: ${fileSizeMB} MB)`
  );
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
