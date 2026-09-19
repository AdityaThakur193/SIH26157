from fastapi import APIRouter, HTTPException
from app.models.schemas import NationalOverviewResponse, CSESummary, CSEDetailResponse, DimensionMetric
from app.services.storage.vectorstore import VectorStoreEngine
from app.services.scoring.threat_score import ThreatScoringEngine
from app.services.scoring.anomaly_engine import AnomalyEngine
from app.services.scoring.asset_exposure import AssetExposureEngine
from app.services.scoring.peer_variance import PeerVarianceEngine
from app.services.ingestion.hash_verifier import update_entity_score, get_all_entities, get_entity_name, reset_ledger
import os
import json
from datetime import datetime

router = APIRouter(prefix="/api/v1/assessments", tags=["Assessments"])
vectorstore = VectorStoreEngine()
scoring_engine = ThreatScoringEngine()
anomaly_engine = AnomalyEngine()
asset_engine = AssetExposureEngine()
peer_engine = PeerVarianceEngine()

def _compute_fidelity(raw_logs, dedup_logs, clusters):
    """Smart Alert Fidelity scoring that adapts to data type."""
    noise_reduction = 0
    if raw_logs > 0:
        noise_reduction = (1 - (dedup_logs / raw_logs)) * 100
    
    # Check if data is primarily SOC case records (unique per case)
    soc_count = sum(1 for c in clusters if c.event_type == "SOC_CASE_RECORD")
    is_soc_data = soc_count > len(clusters) * 0.5
    
    if is_soc_data:
        # SOC case records are inherently unique — 1:1 ratio is expected and correct
        if noise_reduction < 5:
            return {
                "status_label": "VERIFIED",
                "status_color": "green",
                "evaluation_metric": "Case record integrity check",
                "fidelity_gap": f"{raw_logs} unique case records validated — no duplicate submissions",
                "domain_code": "FID-06",
                "findings_count": 0
            }
        else:
            return {
                "status_label": "DUPLICATES DETECTED",
                "status_color": "yellow",
                "evaluation_metric": "Case record integrity check",
                "fidelity_gap": f"{noise_reduction:.1f}% duplicate case submissions detected",
                "domain_code": "FID-06",
                "findings_count": raw_logs - dedup_logs
            }
    else:
        # Network log data — deduplication ratio matters
        if noise_reduction > 80:
            return {
                "status_label": "OPTIMIZED",
                "status_color": "green",
                "evaluation_metric": "SimHash deduplication ratio",
                "fidelity_gap": f"{noise_reduction:.1f}% noise reduction achieved",
                "domain_code": "FID-06",
                "findings_count": 0
            }
        else:
            return {
                "status_label": "NOISY",
                "status_color": "red",
                "evaluation_metric": "SimHash deduplication ratio",
                "fidelity_gap": f"Only {noise_reduction:.1f}% noise reduction — high alert volume",
                "domain_code": "FID-06",
                "findings_count": raw_logs - dedup_logs
            }

@router.get("/overview", response_model=NationalOverviewResponse)
def get_national_overview():
    metrics = vectorstore.get_dashboard_metrics()
    per_entity = vectorstore.get_per_entity_overview()
    
    # Dynamically fetch entities from ledger
    db_entities = get_all_entities()
    dynamic_entities = []
    
    for row in db_entities:
        case_id = row[0]
        name = row[1]
        sector = row[2] or "General"
        score = row[3] or 0
        
        # Use per-entity metrics if available, otherwise fallback
        entity_data = per_entity.get(name, {})
        entity_alerts = entity_data.get("alerts", 0)
        entity_cases = entity_data.get("cases", 0)
        
        dynamic_entities.append(
            CSESummary(
                id=case_id,
                name=name,
                sector=sector,
                tier="Scheduled",
                period=datetime.now().strftime("%B %Y"),
                alerts_count=entity_alerts,
                cases_count=entity_cases,
                attention_level="CRITICAL" if score > 80 else "NOMINAL",
                key_concern="Awaiting manual review" if score > 80 else "No immediate concerns",
                review_status="Pending"
            )
        )
        
    return NationalOverviewResponse(
        active_entities=len(dynamic_entities),
        alerts_analyzed=metrics["alerts_analyzed"],
        cases_analyzed=metrics["cases_analyzed"],
        supervisory_findings=metrics["supervisory_findings"],
        priority_pool_cases=metrics["priority_pool_cases"],
        entities=dynamic_entities
    )

@router.get("/{cse_id}", response_model=CSEDetailResponse)
def get_cse_detail(cse_id: str, sector: str = "General"):
    # Resolve the entity_name from the cse_id
    entity_name = get_entity_name(cse_id)
    
    # Get PER-ENTITY metrics and clusters instead of global
    entity_metrics = vectorstore.get_entity_metrics(entity_name)
    entity_clusters = vectorstore.get_entity_clusters(entity_name)
    
    # 1. Threat Analytics — scoped to this entity's clusters
    score_result = scoring_engine.evaluate_clusters(entity_clusters)
    rules_fired_str = ", ".join([r['rule'] for r in score_result['fired_rules'][:2]]) if score_result['fired_rules'] else "No severe rules triggered"
    
    # Write the score to ledger to enable Peer Variance engine
    try:
        update_entity_score(cse_id, sector, score_result["risk_score"])
    except:
        pass
        
    # 4. Peer Variance
    peer_res = peer_engine.evaluate_variance(cse_id, score_result["risk_score"], sector)
    
    # 2. Anomaly Metrics — scoped to this entity's clusters
    anomaly_res = anomaly_engine.evaluate_temporal_anomalies(entity_clusters)
    
    # 5. Asset Exposure — scoped to this entity's clusters
    asset_res = asset_engine.evaluate_exposure(entity_clusters)
    
    # Use per-entity metrics
    raw_logs = entity_metrics["alerts_analyzed"]
    dedup_logs = entity_metrics["cases_analyzed"]
    noise_reduction = 0
    if raw_logs > 0:
        noise_reduction = (1 - (dedup_logs / raw_logs)) * 100
        
    # 3. Compliance Posture
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    comp_file = os.path.join(project_root, "data_samples", "db", f"{cse_id.upper()}_compliance.json")
    if os.path.exists(comp_file):
        with open(comp_file, "r") as f:
            comp_res = json.load(f)
    else:
        comp_res = {
            "status_label": "AWAITING DOCUMENT",
            "status_color": "gray",
            "evaluation_metric": "Requires ISMS upload",
            "fidelity_gap": "No compliance data ingested",
            "findings_count": 0
        }
    
    # Per-entity high severity count
    high_sev = entity_metrics.get("supervisory_findings", 0)
        
    return CSEDetailResponse(
        cse_id=cse_id.upper(),
        cse_name=entity_name,
        tier="Scheduled",
        audit_window=datetime.now().strftime("%B %Y"),
        examiner="Automated SAT-SA Engine",
        attention_level="CRITICAL" if score_result["risk_score"] > 80 else "HIGH ATTENTION",
        alerts_ingested=raw_logs,
        cases_correlated=dedup_logs,
        formal_investigations=len(score_result["fired_rules"]),
        escalations_logged=high_sev,
        active_anomalies=len(score_result["fired_rules"]),
        peer_variance_index=f"Risk Score: {score_result['risk_score']}/99",
        manual_review_queue_count=len(score_result["fired_rules"]),
        dimensions=[
            DimensionMetric(
                title="1. Threat Analytics",
                status_label=f"SCORE: {score_result['risk_score']}/99",
                status_color="red" if score_result["risk_score"] > 80 else "green",
                evaluation_metric=f"Rules triggered: {rules_fired_str}",
                fidelity_gap=f"{len(score_result['fired_rules'])} severe correlation breaches",
                domain_code="DET-01",
                findings_count=len(score_result["fired_rules"])
            ),
            DimensionMetric(
                title="2. Anomaly Metrics",
                status_label=anomaly_res["status_label"],
                status_color=anomaly_res["status_color"],
                evaluation_metric=anomaly_res["evaluation_metric"],
                fidelity_gap=anomaly_res["fidelity_gap"],
                domain_code="ANM-02",
                findings_count=anomaly_res["findings_count"]
            ),
            DimensionMetric(
                title="3. Compliance Posture",
                status_label=comp_res["status_label"],
                status_color=comp_res["status_color"],
                evaluation_metric=comp_res["evaluation_metric"],
                fidelity_gap=comp_res["fidelity_gap"],
                domain_code="CMP-03",
                findings_count=comp_res["findings_count"]
            ),
            DimensionMetric(
                title="4. Peer Variance",
                status_label=peer_res["status_label"],
                status_color=peer_res["status_color"],
                evaluation_metric=peer_res["evaluation_metric"],
                fidelity_gap=peer_res["fidelity_gap"],
                domain_code="PRV-04",
                findings_count=peer_res["findings_count"]
            ),
            DimensionMetric(
                title="5. Asset Exposure",
                status_label=asset_res["status_label"],
                status_color=asset_res["status_color"],
                evaluation_metric=asset_res["evaluation_metric"],
                fidelity_gap=asset_res["fidelity_gap"],
                domain_code="AST-05",
                findings_count=asset_res["findings_count"]
            ),
            DimensionMetric(
                title="6. Alert Fidelity",
                **_compute_fidelity(raw_logs, dedup_logs, entity_clusters)
            )
        ]
    )

@router.post("/reset")
def reset_all_data():
    """Permanently purges all SQLite telemetry clusters, ChromaDB embeddings, compliance records, and audit ledgers."""
    try:
        vectorstore.reset_store()
        reset_ledger()
        return {
            "status": "SUCCESS",
            "message": "All databases, audit ledgers, vectorstores, and entity assessments have been permanently purged."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database purge failed: {str(e)}")
