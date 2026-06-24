require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { BigQuery } = require("@google-cloud/bigquery");
const { Storage } = require("@google-cloud/storage");

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));

const PROJECT_ID = process.env.PROJECT_ID || "nucleus-498514";
const BQ_DATASET = "wound_ai";

const BQ_TABLE = `${PROJECT_ID}.${BQ_DATASET}.sessions`;
const BQ_INCIDENTS = `${PROJECT_ID}.${BQ_DATASET}.incidents`;

const bigquery = new BigQuery({ projectId: PROJECT_ID });
const storage = new Storage({ projectId: PROJECT_ID });

async function runQuery(query, params = {}) {
  const [rows] = await bigquery.query({ query, params });
  return rows;
}

function formatSession(row) {
  return {
    session_id: row.session_id,
    source_image: row.source_image,
    pwat_score: row.pwat_score,
    triage_category: row.triage_category,
    gemini_analysis: row.gemini_analysis,
    created_at: row.created_at?.value || row.created_at || "",

    wound_metrics: {
      depth_severity: row.depth_severity,
      depth_range: row.depth_range,
      depth_mean: row.depth_mean,
      area_pct: row.area_pct,
    },

    gcs_outputs: {
      cropped_image: row.gcs_cropped,
      segmentation_mask: row.gcs_seg_mask,
      wound_mask_overlay: row.gcs_wound_mask,
      peri_mask_overlay: row.gcs_peri_mask,
      segmentation_figure: row.gcs_segmented,
      depth_figure: row.gcs_pwat,
      depth_map: row.gcs_result,
      gemini_report: row.gcs_gemini,
    },
  };
}

function parseGcsPath(path) {
  if (!path || !path.startsWith("gs://")) {
    throw new Error("Invalid GCS path");
  }

  const clean = path.replace("gs://", "");
  const idx = clean.indexOf("/");

  if (idx === -1) {
    throw new Error("Invalid GCS object path");
  }

  return {
    bucket: clean.substring(0, idx),
    object: clean.substring(idx + 1),
  };
}

function getPagination(req, defaultLimit = 20, maxLimit = 100) {
  const limit = Math.min(
    Math.max(Number(req.query.limit || defaultLimit), 1),
    maxLimit
  );

  const offset = Math.max(Number(req.query.offset || 0), 0);

  return { limit, offset };
}

/* ROOT */

app.get("/", (req, res) => {
  res.json({
    service: "Hospital API",
    status: "running",
    version: "2.1.0",
  });
});

/* HEALTH */

app.get("/health", async (req, res) => {
  try {
    await runQuery(`SELECT COUNT(*) cnt FROM \`${BQ_TABLE}\``);

    res.json({
      status: "healthy",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* PATIENTS SUMMARY */

app.get("/patients/summary", async (req, res) => {
  try {
    const query = `
      SELECT
        COUNT(*) total_cases,
        ROUND(AVG(pwat_score), 4) avg_pwat,
        ROUND(MIN(pwat_score), 4) min_pwat,
        ROUND(MAX(pwat_score), 4) max_pwat,
        COUNTIF(pwat_score >= 12) red_count,
        COUNTIF(pwat_score >= 8 AND pwat_score < 12) orange_count,
        COUNTIF(pwat_score >= 4 AND pwat_score < 8) yellow_count,
        COUNTIF(pwat_score < 4) green_count
      FROM \`${BQ_TABLE}\`
    `;

    const rows = await runQuery(query);
    const r = rows[0] || {};

    const total = r.total_cases || 0;

    const pct = (v) =>
      total === 0 ? 0 : Number(((v / total) * 100).toFixed(1));

    res.json({
      total_cases: total,
      avg_pwat: r.avg_pwat || 0,

      pwat_stats: {
        average: r.avg_pwat || 0,
        minimum: r.min_pwat || 0,
        maximum: r.max_pwat || 0,
      },

      triage_distribution: {
        Red: {
          count: r.red_count || 0,
          pct: pct(r.red_count || 0),
        },
        Orange: {
          count: r.orange_count || 0,
          pct: pct(r.orange_count || 0),
        },
        Yellow: {
          count: r.yellow_count || 0,
          pct: pct(r.yellow_count || 0),
        },
        Green: {
          count: r.green_count || 0,
          pct: pct(r.green_count || 0),
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* GET ALL PATIENTS */

app.get("/patients", async (req, res) => {
  try {
    const { limit, offset } = getPagination(req, 20, 100);

    const query = `
      SELECT *
      FROM \`${BQ_TABLE}\`
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const rows = await runQuery(query);

    res.json({
      total_returned: rows.length,
      sessions: rows.map(formatSession),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* GET SINGLE PATIENT */

app.get("/patient/:sessionId", async (req, res) => {
  try {
    const sessionId = decodeURIComponent(req.params.sessionId);

    const query = `
      SELECT *
      FROM \`${BQ_TABLE}\`
      WHERE session_id = @sessionId
      LIMIT 1
    `;

    const rows = await runQuery(query, { sessionId });

    if (!rows.length) {
      return res.status(404).json({
        error: `Session not found: ${sessionId}`,
      });
    }

    res.json(formatSession(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* GET INCIDENTS */

app.get("/incidents", async (req, res) => {
  try {
    const { limit, offset } = getPagination(req, 50, 200);

    const query = `
      SELECT
        id,
        type,
        responder,
        device,
        location,
        notes,
        CAST(created_at AS STRING) created_at,
        status,
        created_by
      FROM \`${BQ_INCIDENTS}\`
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const rows = await runQuery(query);

    res.json({
      incidents: rows,
    });
  } catch (err) {
    console.error("Incidents table may not exist yet:", err.message);

    res.json({
      incidents: [],
    });
  }
});

/* CREATE INCIDENT */

app.post("/incidents", async (req, res) => {
  try {
    const {
      id,
      type,
      responder,
      device,
      location,
      notes = "",
      status = "Active",
      created_by,
    } = req.body;

    if (!id || !type || !responder || !device || !location || !created_by) {
      return res.status(400).json({
        error:
          "Missing required fields: id, type, responder, device, location, created_by",
      });
    }

    const query = `
      INSERT INTO \`${BQ_INCIDENTS}\`
      (
        id,
        type,
        responder,
        device,
        location,
        notes,
        created_at,
        status,
        created_by
      )
      VALUES
      (
        @id,
        @type,
        @responder,
        @device,
        @location,
        @notes,
        CURRENT_TIMESTAMP(),
        @status,
        @created_by
      )
    `;

    await runQuery(query, {
      id,
      type,
      responder,
      device,
      location,
      notes,
      status,
      created_by,
    });

    res.json({
      success: true,
      id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* RESOLVE INCIDENT */

app.patch("/incidents/:incidentId/resolve", async (req, res) => {
  try {
    const incidentId = req.params.incidentId;

    const query = `
      UPDATE \`${BQ_INCIDENTS}\`
      SET status = 'Resolved'
      WHERE id = @incidentId
    `;

    await runQuery(query, { incidentId });

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* GCS IMAGE */

app.get("/gcs/image", async (req, res) => {
  try {
    const { bucket, object } = parseGcsPath(req.query.path);

    const file = storage.bucket(bucket).file(object);
    const [data] = await file.download();

    const lower = object.toLowerCase();

    if (lower.endsWith(".png")) {
      res.contentType("image/png");
    } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      res.contentType("image/jpeg");
    } else if (lower.endsWith(".webp")) {
      res.contentType("image/webp");
    } else {
      res.contentType("application/octet-stream");
    }

    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* GCS TEXT */

app.get("/gcs/text", async (req, res) => {
  try {
    const { bucket, object } = parseGcsPath(req.query.path);

    const file = storage.bucket(bucket).file(object);
    const [data] = await file.download();

    res.type("text/plain");
    res.send(data.toString());
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

/* GLOBAL ERROR LOGGING */

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

/* START SERVER */

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});