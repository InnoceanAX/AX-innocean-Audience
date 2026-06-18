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

// 웅로드 가드: 로컬 DB에 실제 데이터가 없으면 GCS에 덮어쓰지 않음
// (Cloud Run 재배포 직후 빈 DB로 GCS 릴레이스 사이클 차단)
// CEO 2026-06-18 20:11: WAL 모드 시 메인 file이 4KB일 수 있으므로
// file size 가드 제거 → localDbHasPersonas() 결과만 신뢰.
function shouldSkipUpload() {
  try {
    if (!fs.existsSync(DB_PATH)) return true;
    // 수정: file size 가드 제거. WAL 모드 시 메인 file은 작고 데이터는 -wal에 있음.
    // 실제 페르소나 고수는 _performUpload의 localDbHasPersonas()에서 체크함.
    return false;
  } catch (e) {
    console.warn(`[persona-gcs] shouldSkipUpload check failed: ${e.message}`);
    return false;
  }
}

// 로컬 DB의 페르소나 건수 조회 (빈 DB 가드 강화)
// db 객체를 외부에서 주입받아 윤환 import 회피
let _getDbForCheck = null;
export function _setDbAccessor(fn) { _getDbForCheck = fn; }

function localDbHasPersonas() {
  if (!_getDbForCheck) return null; // unknown — skip check
  try {
    const db = _getDbForCheck();
    if (!db) return null;
    const row = db.prepare("SELECT COUNT(*) as n FROM campaign_personas").get();
    return row?.n > 0;
  } catch (e) {
    // 테이블 없으면 fresh start — upload 안하는 게 안전
    return false;
  }
}

// 실제 upload 수행 (내부 공용). debounce/force 모두 이 함수 호출.
async function _performUpload() {
  const label = `gs://${BUCKET}/${OBJECT}`;

  // 가드 1: 파일 존재 체크
  if (shouldSkipUpload()) return false;

  // 가드 2: 실제 페르소나 존재 체크
  const hasPersonas = localDbHasPersonas();
  if (hasPersonas === false) {
    console.warn(`[persona-gcs] local DB has 0 personas — upload skipped to protect prior backup`);
    return false;
  }
  if (hasPersonas === null) {
    console.warn(`[persona-gcs] DB accessor not registered — upload anyway (file size based fallback)`);
  }

  // CEO 2026-06-18 20:11: WAL checkpoint 강제— -wal/-shm의 데이터를 메인 file에 fsync.
  try {
    if (_getDbForCheck) {
      const db = _getDbForCheck();
      if (db) {
        db.pragma("wal_checkpoint(TRUNCATE)");
      }
    }
  } catch (e) {
    console.warn(`[persona-gcs] WAL checkpoint failed: ${e.message}`);
  }

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
    return true;
  } catch (e) {
    console.warn(`[persona-gcs] upload failed (non-fatal): ${e.message}`);
    return false;
  }
}

export function scheduleDbUpload() {
  if (!isGcsEnabled()) return;

  if (_uploadTimer) {
    clearTimeout(_uploadTimer);
  }

  _uploadTimer = setTimeout(async () => {
    _uploadTimer = null;
    await _performUpload();
  }, DEBOUNCE_MS);
}

// CEO 2026-06-18 20:11 지시: 풀 완료 또는 SIGTERM 시 즉시 upload
// debounce 우회 — batch 완료 직후 또는 컴테이너 종료 전 호출.
export async function forceDbUpload(reason = "manual") {
  if (!isGcsEnabled()) return false;
  if (_uploadTimer) {
    clearTimeout(_uploadTimer);
    _uploadTimer = null;
  }
  console.log(`[persona-gcs] force upload triggered (reason=${reason})`);
  return await _performUpload();
}

// CEO 2026-06-18 20:11 지시: Cloud Run shutdown hook
// SIGTERM 수신 시 10s grace 안에 force upload 시도
let _shutdownHookInstalled = false;
export function installShutdownHook() {
  if (_shutdownHookInstalled) return;
  _shutdownHookInstalled = true;
  if (!isGcsEnabled()) return;

  const handler = async (signal) => {
    console.log(`[persona-gcs] received ${signal}, attempting force upload before shutdown`);
    try {
      await Promise.race([
        forceDbUpload(`shutdown-${signal}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error("shutdown upload timeout")), 8000)),
      ]);
      console.log(`[persona-gcs] shutdown upload completed`);
    } catch (e) {
      console.warn(`[persona-gcs] shutdown upload failed: ${e.message}`);
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => handler("SIGTERM"));
  process.on("SIGINT", () => handler("SIGINT"));
  console.log("[persona-gcs] shutdown hook installed (SIGTERM/SIGINT)");
}
