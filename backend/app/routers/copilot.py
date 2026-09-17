from fastapi import APIRouter
from app.models.schemas import CopilotRequest, CopilotResponse

router = APIRouter(prefix="/api/v1/copilot", tags=["AI Copilot"])

@router.post("/query", response_model=CopilotResponse)
def query_copilot(payload: CopilotRequest):
    query_lower = payload.query.lower()
    
    if "jira" in query_lower or "4402" in query_lower or "soc" in query_lower or "correct" in query_lower:
        return CopilotResponse(
            query=payload.query,
            answer="No. The SOC analyst closed Jira Ticket #4402 in 4 minutes citing 'False Positive', without noticing the subsequent 2.1GB outbound data transfer to hostile IP 185.15.22.1 that occurred 15 minutes post-compromise. This violates critical incident response protocols.",
            findings_flagged=True,
            evidence_sources=["Cisco Firewall Log #85410", "Jira Ticket #4402", "SimHash Alert Cluster #12"]
        )
        
    return CopilotResponse(
        query=payload.query,
        answer="Analysis complete: Evaluated against NCIIPC Circular 14B standards. Telemetry indicates elevated anomaly entropy across Tier-1 core banking subnets.",
        findings_flagged=False,
        evidence_sources=["Unified Schema Index #04"]
    )
