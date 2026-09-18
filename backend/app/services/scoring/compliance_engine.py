import json
import re
import ollama
from typing import Dict, Any

class ComplianceEngine:
    def __init__(self):
        pass
        
    def evaluate_policy(self, document_text: str) -> Dict[str, Any]:
        """Uses local LLM to grade a company's policy document against NCIIPC guidelines."""
        
        if not document_text.strip():
            return {
                "status_label": "AWAITING DOCUMENT",
                "status_color": "gray",
                "evaluation_metric": "Requires ISMS upload",
                "fidelity_gap": "No compliance data ingested",
                "findings_count": 0
            }
            
        prompt = f"""You are a strict NCIIPC cybersecurity compliance auditor evaluating an enterprise ISMS policy document.
Evaluate the document strictly against these 4 mandatory controls:
1. Multi-Factor Authentication (MFA/2FA) enforced
2. Password rotation policy (max 90-120 days)
3. Data encryption at rest and in transit
4. Regular security audits (conducted annually or more frequently, such as quarterly)

Rules:
- If ALL 4 controls are satisfactorily met in the document:
  "status" must be "PASSING", "gap" must be "All mandatory NCIIPC baseline controls satisfied", and "findings" must be 0.
- If ANY controls are missing, weak, or optional:
  "status" must be "FAILING", "gap" must state the single biggest missing control, and "findings" must be the integer count of missing/flawed controls (1 to 4).

Respond ONLY with valid JSON matching this exact structure:
{{
  "status": "PASSING",
  "gap": "Description",
  "findings": 0
}}

Document to audit:
{document_text}
"""
        try:
            response = ollama.chat(model='llama3.1:8b', messages=[
                {'role': 'user', 'content': prompt}
            ])
            content = response['message']['content']
            
            # Find JSON block using regex
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                content = match.group(0)
            
            result = json.loads(content)
            
            status = result.get("status", "WARNING")
            if status == "FAILING":
                color = "red"
            elif status == "PASSING":
                color = "green"
            else:
                color = "yellow"
                
            return {
                "status_label": status,
                "status_color": color,
                "evaluation_metric": "NCIIPC Critical Sector Guidelines",
                "fidelity_gap": result.get("gap", "Unable to parse gap"),
                "findings_count": result.get("findings", 0)
            }
            
        except Exception as e:
            return {
                "status_label": "LLM OFFLINE",
                "status_color": "red",
                "evaluation_metric": "Could not parse or connect",
                "fidelity_gap": str(e),
                "findings_count": 0
            }
