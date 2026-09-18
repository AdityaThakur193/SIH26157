from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class UnifiedLogRecord(BaseModel):
    timestamp: str
    source_ip: Optional[str] = "N/A"
    dest_ip: str
    event_type: str
    severity: str = "INFO"
    raw: str

class CSESummary(BaseModel):
    id: str
    name: str
    sector: str
    tier: str
    period: str
    alerts_count: int
    cases_count: int
    attention_level: str
    key_concern: str
    review_status: str

class NationalOverviewResponse(BaseModel):
    active_entities: int
    alerts_analyzed: int
    cases_analyzed: int
    supervisory_findings: int
    priority_pool_cases: int
    entities: List[CSESummary]

class DimensionMetric(BaseModel):
    title: str
    status_label: str
    status_color: str
    evaluation_metric: str
    fidelity_gap: str
    domain_code: str
    findings_count: int

class CSEDetailResponse(BaseModel):
    cse_id: str
    cse_name: str
    tier: str
    audit_window: str
    examiner: str
    attention_level: str
    alerts_ingested: int
    cases_correlated: int
    formal_investigations: int
    escalations_logged: int
    active_anomalies: int
    peer_variance_index: str
    manual_review_queue_count: int
    dimensions: List[DimensionMetric]

class IngestResponse(BaseModel):
    case_id: str
    entity_name: str
    file_name: str
    sha256_hash: str
    total_raw_logs: int
    deduplicated_clusters: int
    status: str

class ComplianceIngestResponse(BaseModel):
    cse_id: str
    status_label: str
    status_color: str
    evaluation_metric: str
    fidelity_gap: str
    findings_count: int
    compliance_result: Optional[Dict[str, Any]] = None

class CopilotRequest(BaseModel):
    query: str
    case_id: Optional[str] = None
    ticket_id: Optional[str] = None

class CopilotResponse(BaseModel):
    query: str
    answer: str
    findings_flagged: bool = False
    evidence_sources: List[str] = []
