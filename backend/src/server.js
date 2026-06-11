// INNOCEAN Audience Solution — Backend Server
// 솔루션 껍데기 단계 백엔드. 공공 API + 메타 카탈로그 + 어댑터 패턴.

import express from "express";
import cors from "cors";
import { catalogRouter } from "./routes/catalog.js";
import { countriesRouter } from "./routes/countries.js";
import { dimensionsRouter } from "./routes/dimensions.js";
import { insightsRouter } from "./routes/insights.js";
import { trendsRouter } from "./routes/trends.js";
import { compareRouter } from "./routes/compare.js";
import { dimInsightsRouter } from "./routes/dimension-insights.js";
import { mediaRouter } from "./routes/media.js";
import { interviewRouter } from "./routes/interview.js";
import { audienceRouter } from "./routes/audience.js";
import { stratRouter } from "./routes/stratify.js";
import { askRouter } from "./routes/ask.js";
import { libraryRouter } from "./routes/library.js";
import { researchRouter } from "./routes/research.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// 헬스체크
app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    service: "innocean-audience-backend",
    version: "0.1.0",
    ts: new Date().toISOString(),
  });
});

// 메타 카탈로그 (국가·디멘션·미디어 등 정적 메타)
app.use("/api/catalog", catalogRouter);

// 국가 (34국 + 권역 그룹)
app.use("/api/countries", countriesRouter);

// 디멘션 (18 산업 무관)
app.use("/api/dimensions", dimensionsRouter);

// 인사이트 생성 (필터 → 세그먼트 결과)
app.use("/api/insights", insightsRouter);

// 트렌드 (Google Trends 등 외부 API)
app.use("/api/trends", trendsRouter);
app.use("/api/compare", compareRouter);
app.use("/api/audience", audienceRouter);
app.use("/api/dimension-insights", dimInsightsRouter);
app.use("/api/media", mediaRouter);
app.use("/api/interview", interviewRouter);

// 분포 통계 (World Bank · KOSIS 등 공공 데이터)
app.use("/api/stratify", stratRouter);

// AI 질의 (자연어 → 필터 매핑)
app.use("/api/ask", askRouter);

// 타겟 라이브러리 (저장·불러오기·공유)
app.use("/api/library", libraryRouter);
app.use("/api/research", researchRouter);

// 에러 핸들러
app.use((err, _req, res, _next) => {
  console.error("[ERR]", err);
  res.status(500).json({
    ok: false,
    error: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`[innocean-audience-backend] listening on :${PORT}`);
});
