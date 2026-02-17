/**
 * SÚKL Client - Data access layer for Czech medicines database
 * Uses bundled JSON data for Vercel serverless compatibility
 */

import Fuse, { type IFuseOptions } from "fuse.js";
import { readFileSync } from "fs";
import { join } from "path";
import type {
  MedicineBasic,
  MedicineDetail,
  ReimbursementInfo,
  AvailabilityInfo,
  Pharmacy,
  ATCInfo,
  DocumentContent,
} from "./types";

// ============================================================================
// Lazy-load bundled data (server-only, not imported at module level)
// ============================================================================

let _bundledData: BundledData | null = null;
function getBundledData(): BundledData {
  if (!_bundledData) {
    const dataPath = join(process.cwd(), "data/bundled-data.json");
    try {
      _bundledData = JSON.parse(
        readFileSync(dataPath, "utf-8")
      ) as BundledData;
    } catch (error) {
      console.error(`Failed to load bundled data from ${dataPath}:`, error);
      throw new Error("SÚKL data file is missing or corrupted. Ensure data/bundled-data.json exists.");
    }
  }
  return _bundledData;
}

// ============================================================================
// Types for bundled data
// ============================================================================

interface BundledMedicine {
  c: string;  // code
  n: string;  // name
  s: string;  // strength
  f: string;  // form
  p: string;  // package (balení)
  a: string;  // atc
  u: string;  // substance
  h: string;  // holder
  r: string;  // registration
  d: string;  // dispensing
}

interface BundledATC {
  c: string;  // code
  n: string;  // name
  l: number;  // level
  p: string;  // parent
}

interface BundledPharmacy {
  n: string;   // name (NAZEV)
  k: string;   // workplace code (KOD_PRACOVISTE)
  a: string;   // address (ULICE)
  c: string;   // city (MESTO)
  z: string;   // postal code (PSC)
  t: string;   // phone (TELEFON)
  e: string;   // email (EMAIL)
  w: string;   // web (WWW)
  r: boolean;  // has eRecept (ERP)
  h: boolean;  // is 24h emergency (POHOTOVOST)
}

interface BundledReimbursement {
  c: string;        // sukl_code
  g: string | null;  // reimbursement_group
  m: number | null;  // max_price
  a: number | null;  // reimbursement_amount
  s: number | null;  // patient_surcharge
}

interface BundledData {
  m: BundledMedicine[];
  a: BundledATC[];
  p?: BundledPharmacy[];
  r?: BundledReimbursement[];
  _: {
    t: string;
    c: { m: number; a: number; p?: number; r?: number };
  };
}

// ============================================================================
// Data Storage (in-memory cache)
// ============================================================================

interface DataStore {
  medicines: MedicineDetail[];
  reimbursements: Map<string, ReimbursementInfo>;
  atcCodes: Map<string, ATCInfo>;
  pharmacies: Pharmacy[];
  lastLoaded: Date | null;
  fuseIndex: Fuse<MedicineDetail> | null;
}

const store: DataStore = {
  medicines: [],
  reimbursements: new Map(),
  atcCodes: new Map(),
  pharmacies: [],
  lastLoaded: null,
  fuseIndex: null,
};

// ============================================================================
// Configuration
// ============================================================================

const FUSE_OPTIONS: IFuseOptions<MedicineDetail> = {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "substance", weight: 0.3 },
    { name: "sukl_code", weight: 0.2 },
    { name: "holder", weight: 0.1 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
};

// ============================================================================
// Data Loading from bundled JSON
// ============================================================================

function normalizeCode(code: string): string {
  return code.replace(/^0+/, "") || "0";
}

function transformBundledMedicine(m: BundledMedicine): MedicineDetail {
  return {
    sukl_code: normalizeCode(m.c),
    name: m.n,
    strength: m.s || null,
    form: m.f || null,
    package: m.p || null,
    atc_code: m.a || null,
    substance: m.u || null,
    holder: m.h || null,
    registration_status: m.r || null,
    registration_number: null,
    registration_valid_until: null,
    dispensing: m.d || null,
    legal_status: null,
    route_of_administration: null,
    indication_group: null,
    mrp_number: null,
    parallel_import: false,
  };
}

function transformBundledPharmacy(p: BundledPharmacy): Pharmacy {
  return {
    id: p.k,
    name: p.n,
    address: p.a,
    city: p.c,
    postal_code: p.z,
    phone: p.t || null,
    email: p.e || null,
    opening_hours: null,
    latitude: null,
    longitude: null,
    distance_km: null,
    is_24h: p.h,
    has_erecept: p.r,
  };
}

function transformBundledReimbursement(r: BundledReimbursement): ReimbursementInfo {
  return {
    sukl_code: r.c,
    reimbursement_group: r.g,
    max_price: r.m,
    reimbursement_amount: r.a,
    patient_surcharge: r.s,
    reimbursement_conditions: null,
    valid_from: null,
    valid_until: null,
  };
}

function transformBundledATC(a: BundledATC): ATCInfo {
  return {
    code: a.c,
    name_cs: a.n,
    name_en: null,
    level: a.l,
    parent_code: a.p || null,
    description: null,
  };
}

export async function initializeData(): Promise<void> {
  if (store.lastLoaded && Date.now() - store.lastLoaded.getTime() < 3600000) {
    return;
  }

  console.log("Loading SÚKL data from bundle...");

  const data = getBundledData();

  // Transform medicines
  store.medicines = data.m.map(transformBundledMedicine);

  // Build Fuse index
  store.fuseIndex = new Fuse(store.medicines, FUSE_OPTIONS);

  // Transform ATC codes
  store.atcCodes.clear();
  for (const a of data.a) {
    const info = transformBundledATC(a);
    store.atcCodes.set(info.code, info);
  }

  // Transform pharmacies (if available)
  if (data.p) {
    store.pharmacies = data.p.map(transformBundledPharmacy);
  }

  // Transform reimbursements (if available)
  if (data.r) {
    store.reimbursements.clear();
    for (const r of data.r) {
      const info = transformBundledReimbursement(r);
      store.reimbursements.set(info.sukl_code, info);
    }
  }

  store.lastLoaded = new Date();
  console.log(
    `Loaded ${store.medicines.length} medicines, ${store.atcCodes.size} ATC codes, ${store.pharmacies.length} pharmacies, ${store.reimbursements.size} reimbursements from bundle`
  );
}

// ============================================================================
// Public API
// ============================================================================

export async function searchMedicines(
  query: string,
  limit: number = 20
): Promise<{
  medicines: MedicineBasic[];
  total_count: number;
  search_time_ms: number;
}> {
  await initializeData();

  const startTime = performance.now();

  if (!store.fuseIndex || store.medicines.length === 0) {
    return { medicines: [], total_count: 0, search_time_ms: 0 };
  }

  const results = store.fuseIndex.search(query, { limit });
  const medicines: MedicineBasic[] = results.map((r) => ({
    sukl_code: r.item.sukl_code,
    name: r.item.name,
    strength: r.item.strength,
    form: r.item.form,
    package: r.item.package,
    atc_code: r.item.atc_code,
    substance: r.item.substance,
    holder: r.item.holder,
    registration_status: r.item.registration_status,
  }));

  return {
    medicines,
    total_count: results.length,
    search_time_ms: Math.round(performance.now() - startTime),
  };
}

export async function getMedicineByCode(
  suklCode: string
): Promise<MedicineDetail | null> {
  await initializeData();
  const normalized = normalizeCode(suklCode);
  return store.medicines.find((m) => m.sukl_code === normalized) || null;
}

export async function getReimbursement(
  suklCode: string
): Promise<ReimbursementInfo | null> {
  await initializeData();
  return store.reimbursements.get(suklCode) || null;
}

export async function getATCInfo(
  atcCode: string
): Promise<ATCInfo | null> {
  await initializeData();
  return store.atcCodes.get(atcCode) || null;
}

export async function getMedicinesByATC(
  atcCode: string
): Promise<MedicineBasic[]> {
  await initializeData();

  return store.medicines
    .filter((m) => m.atc_code?.startsWith(atcCode))
    .map((m) => ({
      sukl_code: m.sukl_code,
      name: m.name,
      strength: m.strength,
      form: m.form,
      package: m.package,
      atc_code: m.atc_code,
      substance: m.substance,
      holder: m.holder,
      registration_status: m.registration_status,
    }));
}

export async function checkAvailability(
  suklCode: string
): Promise<AvailabilityInfo | null> {
  await initializeData();

  const medicine = await getMedicineByCode(suklCode);
  if (!medicine) return null;

  return {
    sukl_code: suklCode,
    name: medicine.name,
    status: medicine.registration_status === "R" ? "available" : "unknown",
    last_checked: new Date().toISOString(),
    distribution_status: null,
    expected_availability: null,
    notes:
      "Data based on registration status. Real-time availability not yet implemented.",
  };
}

export async function getDocumentContent(
  suklCode: string,
  documentType: "PIL" | "SPC"
): Promise<DocumentContent | null> {
  const medicine = await getMedicineByCode(suklCode);
  if (!medicine) return null;

  return {
    sukl_code: suklCode,
    document_type: documentType,
    title: `${documentType} - ${medicine.name}`,
    content: `Document content for ${medicine.name} is not yet available. Implementation pending.`,
    sections: [],
    last_updated: null,
    language: "cs",
  };
}

export async function findPharmacies(
  city?: string,
  postalCode?: string,
  is24h?: boolean
): Promise<Pharmacy[]> {
  await initializeData();

  let results = store.pharmacies;

  if (city) {
    results = results.filter((p) =>
      p.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  if (postalCode) {
    results = results.filter((p) => p.postal_code.startsWith(postalCode));
  }

  if (is24h !== undefined) {
    results = results.filter((p) => p.is_24h === is24h);
  }

  return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getDataStats(): {
  medicines_count: number;
  reimbursements_count: number;
  atc_codes_count: number;
  pharmacies_count: number;
  last_loaded: string | null;
} {
  return {
    medicines_count: store.medicines.length,
    reimbursements_count: store.reimbursements.size,
    atc_codes_count: store.atcCodes.size,
    pharmacies_count: store.pharmacies.length,
    last_loaded: store.lastLoaded?.toISOString() || null,
  };
}
