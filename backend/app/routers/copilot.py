from fastapi import APIRouter, HTTPException
from app.models.schemas import CopilotRequest, CopilotResponse
from app.services.ai.copilot import CopilotEngine

router = APIRouter(prefix="/api/v1/copilot", tags=["AI Copilot"])
@router.post("/query", response_model=CopilotResponse)
def query_copilot(payload: CopilotRequest):
    try:
        copilot_engine = CopilotEngine()
        result = copilot_engine.query(payload.query)
        
        # Simple heuristic to flag findings if the LLM detects violations
        flagged = "violation" in result["answer"].lower() or "false positive" in result["answer"].lower() or "critical" in result["answer"].lower()
        
        return CopilotResponse(
            query=payload.query,
            answer=result["answer"],
            findings_flagged=flagged,
            evidence_sources=result["sources"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot Engine Error: {str(e)}")
