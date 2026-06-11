from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

from google.cloud import bigquery, storage
from pydantic import BaseModel

from typing import Optional
import urllib.parse
import os
import io
import logging

# =========================================================
# CONFIG
# =========================================================

PROJECT_ID = os.environ.get("PROJECT_ID", "nucleus-498514")
BQ_DATASET = "wound_ai"
BQ_TABLE = f"`{PROJECT_ID}.{BQ_DATASET}.sessions`"
BQ_INCIDENTS = f"`{PROJECT_ID}.{BQ_DATASET}.incidents`"

# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(title="Wound AI Hospital API", version="2.1.0")

# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# CLIENTS
# =========================================================

bq_client = bigquery.Client(project=PROJECT_ID)
gcs_client = storage.Client(project=PROJECT_ID)

# =========================================================
# HELPERS
# =========================================================

def run_query(sql: str):
    try:
        job = bq_client.query(sql)
        results = job.result()
        return [dict(r) for r in results]
    except Exception as e:
        log.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# FORMAT SESSION
# =========================================================

def format_session(row: dict):
    return {
        "session_id": row.get("session_id"),
        "source_image": row.get("source_image"),
        "pwat_score": row.get("pwat_score"),
        "triage_category": row.get("triage_category"),
        "gemini_analysis": row.get("gemini_analysis"),
        "created_at": str(row.get("created_at", "")),
        "wound_metrics": {
            "depth_severity": row.get("depth_severity"),
            "depth_range": row.get("depth_range"),
            "depth_mean": row.get("depth_mean"),
            "area_pct": row.get("area_pct"),
        },
        "gcs_outputs": {
            "cropped_image": row.get("gcs_cropped"),
            "segmentation_mask": row.get("gcs_seg_mask"),
            "wound_mask_overlay": row.get("gcs_wound_mask"),
            "peri_mask_overlay": row.get("gcs_peri_mask"),
            "segmentation_figure": row.get("gcs_segmented"),
            "depth_figure": row.get("gcs_pwat"),
            "depth_map": row.get("gcs_result"),
            "gemini_report": row.get("gcs_gemini"),
        }
    }

# =========================================================
# MODELS
# =========================================================

class IncidentCreate(BaseModel):
    id: str
    type: str
    responder: str
    device: str
    location: str
    notes: Optional[str] = ""
    status: str = "Active"
    created_by: str

# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {"service": "Hospital API", "status": "running", "version": "2.1.0"}

# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    run_query(f"SELECT COUNT(*) as cnt FROM {BQ_TABLE}")
    return {"status": "healthy"}

# =========================================================
# GET PATIENT
# =========================================================

@app.get("/patient/{session_id:path}")
def get_patient(session_id: str):
    try:
        decoded_session = urllib.parse.unquote(session_id)
        sql = f"SELECT * FROM {BQ_TABLE} WHERE session_id = @session_id LIMIT 1"
        config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("session_id", "STRING", decoded_session)]
        )
        job = bq_client.query(sql, job_config=config)
        rows = [dict(r) for r in job.result()]
        if not rows:
            raise HTTPException(status_code=404, detail=f"Session not found: {decoded_session}")
        return format_session(rows[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# GET PATIENTS
# =========================================================

@app.get("/patients")
def get_patients(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
):
    sql = f"SELECT * FROM {BQ_TABLE} ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}"
    rows = run_query(sql)
    return {"total_returned": len(rows), "sessions": [format_session(r) for r in rows]}

# =========================================================
# SUMMARY
# =========================================================

@app.get("/patients/summary")
def summary():
    sql = f"""
    SELECT
        COUNT(*) as total_cases,
        ROUND(AVG(pwat_score), 4) as avg_pwat,
        ROUND(MIN(pwat_score), 4) as min_pwat,
        ROUND(MAX(pwat_score), 4) as max_pwat,
        COUNTIF(pwat_score >= 12) as red_count,
        COUNTIF(pwat_score >= 8 AND pwat_score < 12) as orange_count,
        COUNTIF(pwat_score >= 4 AND pwat_score < 8) as yellow_count,
        COUNTIF(pwat_score < 4) as green_count
    FROM {BQ_TABLE}
    """
    rows = run_query(sql)
    r = rows[0]
    total = r.get("total_cases", 0) or 0
    def pct(v):
        if total == 0: return 0
        return round((v / total) * 100, 1)
    return {
        "total_cases": total,
        "avg_pwat": r.get("avg_pwat", 0),
        "pwat_stats": {
            "average": r.get("avg_pwat", 0),
            "minimum": r.get("min_pwat", 0),
            "maximum": r.get("max_pwat", 0),
        },
        "triage_distribution": {
            "Red":    {"count": r.get("red_count", 0),    "pct": pct(r.get("red_count", 0))},
            "Orange": {"count": r.get("orange_count", 0), "pct": pct(r.get("orange_count", 0))},
            "Yellow": {"count": r.get("yellow_count", 0), "pct": pct(r.get("yellow_count", 0))},
            "Green":  {"count": r.get("green_count", 0),  "pct": pct(r.get("green_count", 0))},
        }
    }

# =========================================================
# INCIDENTS — GET
# =========================================================

@app.get("/incidents")
def get_incidents(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0)
):
    try:
        sql = f"""
        SELECT id, type, responder, device, location, notes,
               CAST(created_at AS STRING) as created_at, status, created_by
        FROM {BQ_INCIDENTS}
        ORDER BY created_at DESC
        LIMIT {limit} OFFSET {offset}
        """
        rows = run_query(sql)
        return {"incidents": rows}
    except Exception as e:
        # Table may not exist yet — return empty list gracefully
        log.warning(f"Incidents table not ready: {e}")
        return {"incidents": []}

# =========================================================
# INCIDENTS — POST
# =========================================================

@app.post("/incidents")
def create_incident(incident: IncidentCreate):
    try:
        sql = f"""
        INSERT INTO {BQ_INCIDENTS}
        (id, type, responder, device, location, notes, created_at, status, created_by)
        VALUES (
            @id, @type, @responder, @device,
            @location, @notes, CURRENT_TIMESTAMP(), @status, @created_by
        )
        """
        config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("id",          "STRING", incident.id),
                bigquery.ScalarQueryParameter("type",        "STRING", incident.type),
                bigquery.ScalarQueryParameter("responder",   "STRING", incident.responder),
                bigquery.ScalarQueryParameter("device",      "STRING", incident.device),
                bigquery.ScalarQueryParameter("location",    "STRING", incident.location),
                bigquery.ScalarQueryParameter("notes",       "STRING", incident.notes or ""),
                bigquery.ScalarQueryParameter("status",      "STRING", incident.status),
                bigquery.ScalarQueryParameter("created_by",  "STRING", incident.created_by),
            ]
        )
        job = bq_client.query(sql, job_config=config)
        job.result()
        return {"success": True, "id": incident.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# INCIDENTS — RESOLVE
# =========================================================

@app.patch("/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str):
    try:
        sql = f"""
        UPDATE {BQ_INCIDENTS}
        SET status = 'Resolved'
        WHERE id = @id
        """
        config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter("id", "STRING", incident_id)]
        )
        job = bq_client.query(sql, job_config=config)
        job.result()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# GCS HELPERS
# =========================================================

def parse_gcs_path(path: str):
    if not path.startswith("gs://"):
        raise HTTPException(status_code=400, detail="Invalid GCS path")
    clean = path.replace("gs://", "")
    bucket, obj = clean.split("/", 1)
    return bucket, obj

@app.get("/gcs/image")
def gcs_image(path: str):
    try:
        bucket_name, object_name = parse_gcs_path(path)
        bucket = gcs_client.bucket(bucket_name)
        blob = bucket.blob(object_name)
        data = blob.download_as_bytes()
        ext = object_name.lower()
        media = "image/png" if ext.endswith(".png") else "image/jpeg" if ext.endswith((".jpg",".jpeg")) else "application/octet-stream"
        return StreamingResponse(io.BytesIO(data), media_type=media, headers={"Cache-Control": "public, max-age=3600"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/gcs/text")
def gcs_text(path: str):
    try:
        bucket_name, object_name = parse_gcs_path(path)
        bucket = gcs_client.bucket(bucket_name)
        blob = bucket.blob(object_name)
        text = blob.download_as_text()
        return StreamingResponse(io.StringIO(text), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
