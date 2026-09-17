from fastapi import APIRouter, HTTPException
from app.models.schemas import NationalOverviewResponse, CSESummary, CSEDetailResponse, DimensionMetric

router = APIRouter(prefix="/api/v1/assessments", tags=["Assessments"])

@router.get("/overview", response_model=NationalOverviewResponse)
def get_national_overview():
    return NationalOverviewResponse(
        active_entities=18,
        alerts_analyzed=1428950,
        cases_analyzed=284120,
        supervisory_findings=64,
        priority_pool_cases=342,
        entities=[
            CSESummary(
                id="CSE-FIN-0091",
                name="Alpha Bank",
                sector="Banking & Financial",
                tier="Tier 1 Scheduled",
                period="Q2 2026",
                alerts_count=124832,
                cases_count=32481,
                attention_level="High attention",
                key_concern="Potential escalation weakness & rapid critical alert closure (38.8% < 5m)",
                review_status="In Progress (4/12)"
            ),
            CSESummary(
                id="CSE-TEL-0044",
                name="Beta Telecom",
                sector="Telecommunications",
                tier="Tier 1 Backbone",
                period="Q2 2026",
                alerts_count=382190,
                cases_count=68140,
                attention_level="Moderate attention",
                key_concern="Potential monitoring coverage gap (184 critical routers dormant)",
                review_status="Under Review"
            ),
            CSESummary(
                id="CSE-PWR-0102",
                name="Gamma Energy Grid",
                sector="Power & Energy",
                tier="Transmission Grid",
                period="Q1 2026",
                alerts_count=94120,
                cases_count=14200,
                attention_level="Low attention",
                key_concern="Normal operational dispersion; no major outlier signals",
                review_status="Completed (Signed Off)"
            ),
            CSESummary(
                id="CSE-FIN-0182",
                name="Delta FinCorp",
                sector="NBFC & Payments",
                tier="Tier 2 Settlement",
                period="Q2 2026",
                alerts_count=88400,
                cases_count=19310,
                attention_level="High attention",
                key_concern="Repetitive investigation narratives across 840+ incident cases",
                review_status="Pending Examiner Review"
            )
        ]
    )

@router.get("/{cse_id}", response_model=CSEDetailResponse)
def get_cse_detail(cse_id: str):
    if cse_id.lower() in ["cse-fin-0091", "alpha-bank", "alphabank"]:
        return CSEDetailResponse(
            cse_id="CSE-FIN-0091",
            cse_name="Alpha Bank",
            tier="TIER-1 CORE BANKING SYSTEM",
            audit_window="April 01, 2026 - June 30, 2026",
            examiner="R. Varma (Lead Supervisor, NCIIPC)",
            attention_level="HIGH ATTENTION",
            alerts_ingested=124832,
            cases_correlated=32481,
            formal_investigations=28923,
            escalations_logged=4192,
            active_anomalies=21,
            peer_variance_index="+27.4%",
            manual_review_queue_count=43,
            dimensions=[
                DimensionMetric(
                    title="1. Detection",
                    status_label="ELEVATED SIGNALS (4)",
                    status_color="red",
                    evaluation_metric="124.8k alerts evaluated against dynamic enterprise asset mapping registry.",
                    fidelity_gap="46%",
                    domain_code="DET-01",
                    findings_count=4
                ),
                DimensionMetric(
                    title="2. Investigation",
                    status_label="ELEVATED SIGNALS (7)",
                    status_color="red",
                    evaluation_metric="NLP Text Entropy: 1,328 repetitive highly boilerplate text patterns detected.",
                    fidelity_gap="59%",
                    domain_code="INV-02",
                    findings_count=7
                ),
                DimensionMetric(
                    title="3. Escalation",
                    status_label="SIGNIFICANT DEVIATION (3)",
                    status_color="red",
                    evaluation_metric="143 critical cases closed with zero escalation records (+21.4% peer dev).",
                    fidelity_gap="31.4%",
                    domain_code="ESC-03",
                    findings_count=3
                ),
                DimensionMetric(
                    title="4. Operational Discipline",
                    status_label="MODERATE ATTENTION (3)",
                    status_color="amber",
                    evaluation_metric="38.8% of high/critical alerts closed in under 5 minutes without notes.",
                    fidelity_gap="38.8%",
                    domain_code="OPD-04",
                    findings_count=3
                ),
                DimensionMetric(
                    title="5. Monitoring Coverage",
                    status_label="COVERAGE GAP (3)",
                    status_color="red",
                    evaluation_metric="313 dark assets (production core banking assets with zero security event logs).",
                    fidelity_gap="3.7%",
                    domain_code="COV-05",
                    findings_count=3
                ),
                DimensionMetric(
                    title="6. Cyber Resilience",
                    status_label="MODERATE SIGNALS (1)",
                    status_color="amber",
                    evaluation_metric="17 uncleared assets subject to recurrent uncleared alerts exceeding 45 days.",
                    fidelity_gap="32%",
                    domain_code="RES-06",
                    findings_count=1
                )
            ]
        )
    raise HTTPException(status_code=404, detail="CSE Entity Not Found")
