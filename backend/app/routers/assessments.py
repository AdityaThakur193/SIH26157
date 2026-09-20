from fastapi import APIRouter, HTTPException
from app.models.schemas import NationalOverviewResponse, CSESummary, CSEDetailResponse, DimensionMetric, AdjudicationRequest
from app.services.storage.vectorstore import VectorStoreEngine
from app.services.scoring.threat_score import ThreatScoringEngine
from app.services.scoring.anomaly_engine import AnomalyEngine
from app.services.scoring.asset_exposure import AssetExposureEngine
from app.services.scoring.peer_variance import PeerVarianceEngine
from app.services.ingestion.hash_verifier import update_entity_score, get_all_entities, get_entity_name, reset_ledger, record_adjudication
import os
import json
from datetime import datetime

router = APIRouter(prefix="/api/v1/assessments", tags=["Assessments"])
vectorstore = VectorStoreEngine()
scoring_engine = ThreatScoringEngine()
anomaly_engine = AnomalyEngine()
asset_engine = AssetExposureEngine()
peer_engine = PeerVarianceEngine()


# --- REFACTORED: _compute_fidelity extracted into smaller functions ---

def _build_fidelity_metric(status, color, metric, gap, count):
    return {
        "status_label": status,
        "status_color": color,
        "evaluation_metric": metric,
        "fidelity_gap": gap,
        "domain_code": "FID-06",
        "findings_count": count
    }

def _compute_soc_fidelity(noise_reduction, raw_logs, dedup_logs):
    if noise_reduction < 5:
        return _build_fidelity_metric(
            "VERIFIED", "green", "Case record integrity check", 
            f"{raw_logs} unique case records validated — no duplicate submissions", 0
        )
    return _build_fidelity_metric(
        "DUPLICATES DETECTED", "yellow", "Case record integrity check",
        f"{noise_reduction:.1f}% duplicate case submissions detected", raw_logs - dedup_logs
    )

def _compute_network_fidelity(noise_reduction, raw_logs, dedup_logs):
    if noise_reduction > 80:
        return _build_fidelity_metric(
            "OPTIMIZED", "green", "SimHash deduplication ratio",
            f"{noise_reduction:.1f}% noise reduction achieved", 0
        )
    return _build_fidelity_metric(
        "NOISY", "red", "SimHash deduplication ratio",
        f"Only {noise_reduction:.1f}% noise reduction — high alert volume", raw_logs - dedup_logs
    )

def _compute_fidelity(raw_logs, dedup_logs, clusters):
    """Smart Alert Fidelity scoring that adapts to data type."""
    noise_reduction = 0
    if raw_logs > 0:
        noise_reduction = (1 - (dedup_logs / raw_logs)) * 100
    
    soc_count = sum(1 for c in clusters if c.event_type == "SOC_CASE_RECORD")
    is_soc_data = soc_count > len(clusters) * 0.5
    
    if is_soc_data:
        return _compute_soc_fidelity(noise_reduction, raw_logs, dedup_logs)
    return _compute_network_fidelity(noise_reduction, raw_logs, dedup_logs)


@router.get("/overview", response_model=NationalOverviewResponse)
def get_national_overview():
    metrics = vectorstore.get_dashboard_metrics()
    per_entity = vectorstore.get_per_entity_overview()
    db_entities = get_all_entities()
    dynamic_entities = []
    
    for row in db_entities:
        case_id, name, sector = row[0], row[1], row[2] or "General"
        score = row[3] or 0
        
        entity_data = per_entity.get(name, {})
        entity_alerts = entity_data.get("alerts", 0)
        entity_cases = entity_data.get("cases", 0)
        
        verdict = row[4] if len(row) > 4 and row[4] else None
        remarks = row[5] if len(row) > 5 and row[5] else None
        
        status_label = verdict if verdict else "Pending"
        concern = remarks if remarks else ("Awaiting manual review" if score > 80 else "No immediate concerns")
        
        dynamic_entities.append(
            CSESummary(
                id=case_id, name=name, sector=sector, tier="Scheduled",
                period=datetime.now().strftime("%B %Y"),
                alerts_count=entity_alerts, cases_count=entity_cases,
                attention_level="CRITICAL" if score > 80 else "NOMINAL",
                key_concern=concern, review_status=status_label
            )
        )
        
    timeline_data = vectorstore.get_timeline_metrics()
        
    return NationalOverviewResponse(
        active_entities=len(dynamic_entities),
        alerts_analyzed=metrics["alerts_analyzed"],
        cases_analyzed=metrics["cases_analyzed"],
        supervisory_findings=metrics["supervisory_findings"],
        priority_pool_cases=metrics["priority_pool_cases"],
        entities=dynamic_entities, timeline=timeline_data
    )


# --- REFACTORED: get_cse_evidence extracted into filtering and serializing ---

def _filter_clusters_by_domain(clusters, domain_code):
    if domain_code == "DET-01":
        return [c for c in clusters if c.severity.upper() in ["HIGH", "CRITICAL"]]
    if domain_code == "ANM-02":
        return sorted(clusters, key=lambda x: x.count, reverse=True)[:25]
    if domain_code == "CMP-03":
        return []
    if domain_code == "PRV-04":
        return clusters[::3][:30]
    if domain_code == "AST-05":
        keywords = ["DB", "CORE", "SWIFT", "PAY", "AUTH", "BANKING"]
        filtered = [c for c in clusters if any(kw in (c.dest_ip or "").upper() for kw in keywords)]
        return filtered if filtered else [c for c in clusters if c.severity.upper() in ["HIGH", "CRITICAL"]][:20]
    if domain_code == "FID-06":
        return sorted(clusters, key=lambda x: x.count, reverse=True)[:50]
    return clusters

def _serialize_clusters(clusters):
    results = []
    for c in clusters:
        d = c.to_dict()
        if isinstance(d.get("source_ips"), str):
            try:
                d["source_ips"] = json.loads(d["source_ips"])
            except:
                pass
        results.append(d)
    return results

@router.get("/{cse_id}/evidence")
def get_cse_evidence(cse_id: str, domain_code: str = None):
    entity_name = get_entity_name(cse_id)
    clusters = vectorstore.get_entity_clusters(entity_name)
    filtered_clusters = _filter_clusters_by_domain(clusters, domain_code)
    return {"clusters": _serialize_clusters(filtered_clusters)}


# --- REFACTORED: get_cse_detail extracted into smaller domain evaluators ---

def _get_compliance_posture(cse_id):
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    comp_file = os.path.join(project_root, "data_samples", "db", f"{cse_id.upper()}_compliance.json")
    if os.path.exists(comp_file):
        with open(comp_file, "r") as f:
            return json.load(f)
    return _build_fidelity_metric("AWAITING DOCUMENT", "gray", "Requires ISMS upload", "No compliance data ingested", 0)

def _build_dimensions(score_result, anomaly_res, comp_res, peer_res, asset_res, raw_logs, dedup_logs, clusters):
    rules_fired_str = ", ".join([r['rule'] for r in score_result['fired_rules'][:2]]) if score_result['fired_rules'] else "No severe rules triggered"
    return [
        DimensionMetric(
            title="1. Threat Analytics",
            status_label=f"SCORE: {score_result['risk_score']}/99",
            status_color="red" if score_result["risk_score"] > 80 else "green",
            evaluation_metric=f"Rules triggered: {rules_fired_str}",
            fidelity_gap=f"{len(score_result['fired_rules'])} severe correlation breaches",
            domain_code="DET-01", findings_count=len(score_result["fired_rules"])
        ),
        DimensionMetric(
            title="2. Anomaly Metrics",
            status_label=anomaly_res["status_label"], status_color=anomaly_res["status_color"],
            evaluation_metric=anomaly_res["evaluation_metric"], fidelity_gap=anomaly_res["fidelity_gap"],
            domain_code="ANM-02", findings_count=anomaly_res["findings_count"]
        ),
        DimensionMetric(
            title="3. Compliance Posture",
            status_label=comp_res.get("status_label", ""), status_color=comp_res.get("status_color", ""),
            evaluation_metric=comp_res.get("evaluation_metric", ""), fidelity_gap=comp_res.get("fidelity_gap", ""),
            domain_code="CMP-03", findings_count=comp_res.get("findings_count", 0)
        ),
        DimensionMetric(
            title="4. Peer Variance",
            status_label=peer_res["status_label"], status_color=peer_res["status_color"],
            evaluation_metric=peer_res["evaluation_metric"], fidelity_gap=peer_res["fidelity_gap"],
            domain_code="PRV-04", findings_count=peer_res["findings_count"]
        ),
        DimensionMetric(
            title="5. Asset Exposure",
            status_label=asset_res["status_label"], status_color=asset_res["status_color"],
            evaluation_metric=asset_res["evaluation_metric"], fidelity_gap=asset_res["fidelity_gap"],
            domain_code="AST-05", findings_count=asset_res["findings_count"]
        ),
        DimensionMetric(
            title="6. Alert Fidelity",
            **_compute_fidelity(raw_logs, dedup_logs, clusters)
        )
    ]

@router.get("/{cse_id}", response_model=CSEDetailResponse)
def get_cse_detail(cse_id: str, sector: str = "General"):
    entity_name = get_entity_name(cse_id)
    entity_metrics = vectorstore.get_entity_metrics(entity_name)
    entity_clusters = vectorstore.get_entity_clusters(entity_name)
    
    score_result = scoring_engine.evaluate_clusters(entity_clusters)
    try:
        update_entity_score(cse_id, sector, score_result["risk_score"])
    except:
        pass
        
    peer_res = peer_engine.evaluate_variance(cse_id, score_result["risk_score"], sector)
    anomaly_res = anomaly_engine.evaluate_temporal_anomalies(entity_clusters)
    asset_res = asset_engine.evaluate_exposure(entity_clusters)
    comp_res = _get_compliance_posture(cse_id)
    
    raw_logs = entity_metrics["alerts_analyzed"]
    dedup_logs = entity_metrics["cases_analyzed"]
    high_sev = entity_metrics.get("supervisory_findings", 0)
        
    dimensions = _build_dimensions(score_result, anomaly_res, comp_res, peer_res, asset_res, raw_logs, dedup_logs, entity_clusters)
    
    return CSEDetailResponse(
        cse_id=cse_id.upper(), cse_name=entity_name, tier="Scheduled",
        audit_window=datetime.now().strftime("%B %Y"),
        examiner="Automated SAT-SA Engine",
        attention_level="CRITICAL" if score_result["risk_score"] > 80 else "HIGH ATTENTION",
        alerts_ingested=raw_logs, cases_correlated=dedup_logs,
        formal_investigations=len(score_result["fired_rules"]),
        escalations_logged=high_sev, active_anomalies=len(score_result["fired_rules"]),
        peer_variance_index=f"Risk Score: {score_result['risk_score']}/99",
        manual_review_queue_count=len(score_result["fired_rules"]),
        dimensions=dimensions
    )


@router.post("/{cse_id}/adjudicate")
def adjudicate_entity(cse_id: str, request: AdjudicationRequest):
    try:
        record_adjudication(
            cse_id=cse_id, verdict=request.verdict,
            remarks=request.remarks or "", officer_id=request.officer_id or "EXAMINER"
        )
        return {
            "status": "SUCCESS", "cse_id": cse_id, "verdict": request.verdict,
            "remarks": request.remarks, "message": f"Case {cse_id} successfully adjudicated"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Adjudication failed: {str(e)}")

@router.post("/reset")
def reset_all_data():
    try:
        vectorstore.reset_store()
        reset_ledger()
        return {
            "status": "SUCCESS",
            "message": "All databases, audit ledgers, vectorstores, and entity assessments have been permanently purged."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database purge failed: {str(e)}")
