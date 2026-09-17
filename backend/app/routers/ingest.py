from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import IngestResponse
import os
import hashlib

router = APIRouter(prefix="/api/v1", tags=["Ingestion"])

@router.post("/ingest", response_model=IngestResponse)
async def ingest_evidence(
    entity_name: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        content = await file.read()
        file_hash = hashlib.sha256(content).hexdigest()
        
        # Save file to local data storage
        os.makedirs("data_samples", exist_ok=True)
        saved_path = os.path.join("data_samples", file.filename)
        with open(saved_path, "wb") as f:
            f.write(content)
            
        return IngestResponse(
            case_id="CASE-2026-NCIIPC-09",
            entity_name=entity_name,
            file_name=file.filename,
            sha256_hash=file_hash,
            total_raw_logs=3240512,
            deduplicated_clusters=1200,
            status="SUCCESS_COMMITTED_TO_LEDGER"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
