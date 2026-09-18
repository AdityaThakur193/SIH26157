from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from app.models.schemas import IngestResponse, ComplianceIngestResponse
from app.services.ingestion.hash_verifier import compute_file_hash, log_to_ledger
from app.services.ingestion.log_parser import LogParserEngine
from app.services.deduplication.simhash import SimHashEngine
from app.services.storage.vectorstore import VectorStoreEngine
from app.services.scoring.compliance_engine import ComplianceEngine
import os
import json

router = APIRouter(prefix="/api/v1", tags=["Ingestion"])

# Standardize path to root data_samples
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATA_SAMPLES_DIR = os.path.join(PROJECT_ROOT, "data_samples")

def process_file_pipeline(file_path: str):
    parser = LogParserEngine()
    simhash_engine = SimHashEngine()
    raw_count = 0
    for record in parser.parse_file(file_path):
        raw_count += 1
        simhash_engine.process_record(record)
    clusters = simhash_engine.get_clusters()
    dedup_count = len(clusters)
    vectorstore = VectorStoreEngine()
    vectorstore.store_clusters(clusters)
    return raw_count, dedup_count

@router.post("/ingest", response_model=IngestResponse)
async def ingest_evidence(
    entity_name: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        os.makedirs(DATA_SAMPLES_DIR, exist_ok=True)
        saved_path = os.path.join(DATA_SAMPLES_DIR, file.filename)
        with open(saved_path, "wb") as f:
            while chunk := await file.read(8192):
                f.write(chunk)
                
        file_hash = compute_file_hash(saved_path)
        case_id = f"CASE-2026-{entity_name.upper()[:3]}-09"
        log_to_ledger(case_id, entity_name, file.filename, file_hash)
        
        raw_count, dedup_count = process_file_pipeline(saved_path)
            
        return IngestResponse(
            case_id=case_id,
            entity_name=entity_name,
            file_name=file.filename,
            sha256_hash=file_hash,
            total_raw_logs=raw_count,
            deduplicated_clusters=dedup_count,
            status="SUCCESS_COMMITTED_TO_LEDGER"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest/compliance", response_model=ComplianceIngestResponse)
async def ingest_compliance(
    cse_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        content = await file.read()
        doc_text = content.decode('utf-8', errors='ignore')
        
        engine = ComplianceEngine()
        result = engine.evaluate_policy(doc_text)
        
        db_dir = os.path.join(DATA_SAMPLES_DIR, "db")
        os.makedirs(db_dir, exist_ok=True)
        comp_file = os.path.join(db_dir, f"{cse_id.upper()}_compliance.json")
        with open(comp_file, "w") as f:
            json.dump(result, f)
            
        return ComplianceIngestResponse(
            cse_id=cse_id,
            status_label=result.get("status_label", "EVALUATED"),
            status_color=result.get("status_color", "green"),
            evaluation_metric=result.get("evaluation_metric", "NCIIPC Guidelines"),
            fidelity_gap=result.get("fidelity_gap", "No critical gaps"),
            findings_count=result.get("findings_count", 0),
            compliance_result=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
