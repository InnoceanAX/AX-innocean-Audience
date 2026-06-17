// persona-gcs.js
// GCS backup/restore for the SQLite persona DB on Cloud Run.
//
// Environment variables:
//   PERSONA_GCS_BUCKET   — bucket name (e.g. innocean-audience-personas)
//                          When unset, all functions are no-ops (GCS disabled).
//   PERSONA_GCS_OBJECT   — GCS object path (default: audience-personas.db)
//   PERSONA_DB_PATH      — local DB file path (default: ./data/audience-personas.db)
//
// Boot flow  : server starts → persona-store imported → downloadDbFromGcs() called
//              → GCS file downloaded to local path (5 s timeout)
//              → Database.open() runs on the restored file
//
// Write flow : batched write completes → scheduleDbUpload() called
//              → 30 s debounce timer resets; no upload until idle for 30 s
//              → upload runs as fire-and-forget, failures are warn-only

import fs from "node:fs";
import path from "node:path";
import { Storage } from "@google-cloud/storage";

const BUCKET = process.env.PERSONA_GCS_BUCKET || "";
const OBJECT = process.env.PERSONA_GCS_OBJECT || "audience-personas.db";
const DB_PATH = process.env.PERSONA_DB_PATH ?? "./data/audience-personas.db";

// How long to wait for GCS operations at boot (ms).
const BOOT_TIMEOUT_MS = 5_000;

// Debounce window for upload after batched writes (ms).
const DEBOUNCE_MS = 30_000;

// ── Singleton Storage client ─────────────────────────────────────────────────
let _storage = null;
function getStorage() {
  if (!_storage) _storage = new Storage(); // uses default credentials chain
  return _storage;
}

// ── Public: is GCS configured? ───────────────────────────────────────────────
export function isGcsEnabled() {
  return Boolean(BUCKET);
}

// ── Public: downloadDbFromGcs() ──────────────────────────────────────────────
// Called once at boot, BEFORE Database.open().
// - Object not found      → silent skip (start with empty DB)
// - Network/auth failure  → warn log only, no throw
// - Exceeds BOOT_TIMEOUT_MS → warn log only, no throw
export async function downloadDbFromGcs() {
  if (!isGcsEnabled()) {
    console.log("[persona-gcs] GCS disabled (PERSONA_GCS_BUCKET not set) — skipping restore");
    return;
  }

  const label = `gs://${BUCKET}/${OBJECT}`;
  try {
    const storage = getStorage();
    const file = storage.bucket(BUCKET).file(OBJECT);

    // Race existence check against timeout
    const [exists] = await Promise.race([
      file.exists(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GCS exists() timed out")), BOOT_TIMEOUT_MS)
      ),
    ]);

    if (!exists) {
      console.log(`[persona-gcs] ${label} not found — starting with empty DB`);
      return;
    }

    // Ensure local directory exists
    const dir = path.dirname(DB_PATH);
    if (dir && dir !== "." && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Race download against timeout
    await Promise.race([
      file.download({ destination: DB_PATH }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GCS download timed out")), BOOT_TIMEOUT_MS)
      ),
    ]);

    const stat = fs.statSync(DB_PATH);
    console.log(`[persona-gcs] restored DB from ${label} → ${DB_PATH} (${stat.size} bytes)`);
  } catch (e) {
    console.warn(`[persona-gcs] download failed (non-fatal, starting with empty DB): ${e.message}`);
  }
}

// ── Public: scheduleDbUpload() ───────────────────────────────────────────────
// Debounced upload — call after any batched write.  Fire-and-forget.
// Coalesces rapid consecutive writes into one GCS upload per DEBOUNCE_MS window.
//
// Debounce logic:
//   Each call clears any pending timer and schedules a new one for DEBOUNCE_MS ms.
//   Only after DEBOUNCE_MS ms of write-idle time does the actual upload run.
//   e.g. 50 persona rows written in 3 s → only 1 GCS upload fired 30 s after last write.
let _uploadTimer = null;

export function scheduleDbUpload() {
  if (!isGcsEnabled()) return;

  if (_uploadTimer) {
    clearTimeout(_uploadTimer);
  }

  _uploadTimer = setTimeout(async () => {
    _uploadTimer = null;
    const label = `gs://${BUCKET}/${OBJECT}`;
    try {
      const storage = getStorage();
      await storage.bucket(BUCKET).upload(DB_PATH, {
        destination: OBJECT,
        metadata: {
          cacheControl: "no-store",
          metadata: {
            uploadedAt: new Date().toISOString(),
            source: "innocean-audience-backend",
          },
        },
      });
      console.log(`[persona-gcs] backed up DB → ${label}`);
    } catch (e) {
      console.warn(`[persona-gcs] upload failed (non-fatal): ${e.message}`);
    }
  }, DEBOUNCE_MS);
}
