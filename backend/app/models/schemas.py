from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# 1. Unified Log Schema
class UnifiedLogRecord(BaseModel):
    timestamp: str
    source_ip: Optional[str] = "N/A"
    dest_ip: Optional[str] = "N/A"
    event_type: str
    severity: str = "INFO"
    raw: str

# 2. National Overview Dashboard Schemas
class CSESummary(BaseModel):
    id: str
    name: str
    sector: str
    tier: str
    period: str
    alerts_count: int
    cases_count: int
    attention_level: str  # High attention, Moderate attention, Low attention
    key_concern: str
    review_status: str

class NationalOverviewResponse(BaseModel):
    active_entities: int = 18
    alerts_analyzed: int = 1428950
    cases_analyzed: int = 284120
    supervisory_findings: int = 64
    priority_pool_cases: int = 342
    entities: List[CSESummary]

# 3. CSE Detailed Assessment (Alpha Bank Dossier) Schemas
class DimensionMetric(BaseModel):
    title: str
    status_label: str
    status_color: str  # red, amber, green
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

# 4. Ingestion & Blockchain Ledger Schemas
class IngestResponse(BaseModel):
    case_id: str
    entity_name: str
    file_name: str
    sha256_hash: str
    total_raw_logs: int
    deduplicated_clusters: int
    status: str

# 5. AI Threat Copilot Schemas
class CopilotRequest(BaseModel):
    query: str
    case_id: Optional[str] = None
    ticket_id: Optional[str] = None

class CopilotResponse(BaseModel):
    query: str
    answer: str
    findings_flagged: bool = False
    evidence_sources: List[str] = []
