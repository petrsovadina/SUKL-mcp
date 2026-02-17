/**
 * Build script: Download and process SÚKL reimbursement (SCAU) data
 *
 * Source: sukl.gov.cz SCAU TXT (WIN-1250, pipe delimiter, no header)
 * Output: Updates data/bundled-data.json with reimbursement data under key "r"
 *
 * Usage: npx tsx scripts/build-reimbursements.ts
 *        npx tsx scripts/build-reimbursements.ts --inspect  (show first 3 rows)
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Latest SCAU file URL (v21, effective 2026-01-01)
const SCAU_URL =
  "https://sukl.gov.cz/wp-content/uploads/2025/12/SCAU251204v21.txt";

interface BundledReimbursement {
  c: string; // sukl_code
  g: string | null; // reimbursement_group
  m: number | null; // max_price
  a: number | null; // reimbursement_amount
  s: number | null; // patient_surcharge
}

// SCAU v21 column indices (0-based, pipe-delimited, 122 columns per row)
// Verified by --inspect analysis of actual SCAU251204v21.txt
const COL = {
  SUKL_CODE: 0,           // Kód SÚKL (7-digit, e.g. "0094156")
  REIMBURSEMENT_GROUP: 23, // Preskripční omezení/skupina (e.g. "ATB", "DIA,END,INT")
  MAX_PRICE: 18,           // Maximální cena konečná/lékárenská (s obchodní přirážkou)
  REIMBURSEMENT_AMOUNT: 19, // Výše úhrady za balení (pojišťovna)
} as const;

function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;
  // Czech numbers may use comma as decimal separator
  const normalized = value.trim().replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

async function downloadAndDecode(url: string): Promise<string> {
  console.log(`Downloading SCAU data from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download SCAU file: ${response.status} ${response.statusText}`
    );
  }
  const buffer = await response.arrayBuffer();
  // SCAU files are WIN-1250 encoded
  const decoder = new TextDecoder("windows-1250");
  return decoder.decode(buffer);
}

function inspectData(lines: string[]) {
  console.log("\n=== INSPECT MODE ===");
  console.log(`Total lines: ${lines.length}\n`);

  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const fields = lines[i].split("|");
    console.log(`--- Row ${i} (${fields.length} columns) ---`);
    fields.forEach((field, idx) => {
      if (field.trim()) {
        console.log(`  [${idx}] = "${field.trim()}"`);
      }
    });
  }

  // Show column count distribution
  const counts = new Map<number, number>();
  for (const line of lines) {
    const n = line.split("|").length;
    counts.set(n, (counts.get(n) || 0) + 1);
  }
  console.log("\nColumn count distribution:");
  for (const [n, c] of Array.from(counts.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n} columns: ${c} rows`);
  }
}

async function main() {
  const inspect = process.argv.includes("--inspect");

  const text = await downloadAndDecode(SCAU_URL);
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error("SCAU file is empty");
  }

  console.log(`Downloaded ${lines.length} lines`);

  if (inspect) {
    inspectData(lines);
    return;
  }

  // Detect column count from first row
  const firstRowCols = lines[0].split("|").length;
  console.log(`Detected ${firstRowCols} columns per row`);

  // Validate that our column indices are within range
  const maxCol = Math.max(...Object.values(COL));
  if (maxCol >= firstRowCols) {
    console.warn(
      `Warning: Expected column index ${maxCol} but only ${firstRowCols} columns found.`
    );
    console.log("Running in inspect mode to help identify correct columns...");
    inspectData(lines);
    console.log(
      "\nPlease update COL indices in the script based on the inspection output."
    );
    process.exit(1);
  }

  const reimbursements: BundledReimbursement[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const line of lines) {
    const fields = line.split("|");
    if (fields.length < maxCol + 1) {
      skipped++;
      continue;
    }

    const code = fields[COL.SUKL_CODE]?.trim();
    if (!code || seen.has(code)) {
      if (code) skipped++;
      continue;
    }
    seen.add(code);

    const maxPrice = parseNumber(fields[COL.MAX_PRICE]);
    const reimbAmount = parseNumber(fields[COL.REIMBURSEMENT_AMOUNT]);
    // Patient surcharge = max retail price - reimbursement (calculated, not a separate column)
    let surcharge: number | null = null;
    if (maxPrice !== null && reimbAmount !== null) {
      surcharge = Math.round((maxPrice - reimbAmount) * 100) / 100;
      if (surcharge < 0) surcharge = 0;
    }

    reimbursements.push({
      c: code,
      g: fields[COL.REIMBURSEMENT_GROUP]?.trim() || null,
      m: maxPrice,
      a: reimbAmount,
      s: surcharge,
    });
  }

  console.log(
    `Parsed ${reimbursements.length} reimbursement records (${skipped} skipped/duplicates)`
  );

  // Show sample
  if (reimbursements.length > 0) {
    const sample = reimbursements[0];
    console.log(
      `Sample: code=${sample.c}, group=${sample.g}, max_price=${sample.m}, reimb=${sample.a}, surcharge=${sample.s}`
    );
  }

  // Load existing bundled data
  const dataPath = join(process.cwd(), "data/bundled-data.json");
  console.log(`Loading existing data from ${dataPath}...`);

  const existingData = JSON.parse(readFileSync(dataPath, "utf-8"));

  // Add reimbursements
  existingData.r = reimbursements;
  existingData._.c.r = reimbursements.length;

  // Write back
  writeFileSync(dataPath, JSON.stringify(existingData));
  const fileSizeMB = (
    Buffer.byteLength(JSON.stringify(existingData)) /
    1024 /
    1024
  ).toFixed(1);
  console.log(
    `Updated ${dataPath} — ${reimbursements.length} reimbursements added (total file size: ${fileSizeMB} MB)`
  );
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
