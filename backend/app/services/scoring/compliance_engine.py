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
            
        prompt = f'''You are an NCIIPC compliance auditor. Analyze the provided ISMS policy document.
Check for mandatory requirements like 2FA/MFA, password rotation, data encryption at rest, and regular audits.
Output ONLY a JSON object with EXACTLY these keys (no markdown, no extra text):
{{
  "status": "FAILING",
  "gap": "A brief 1-sentence description of the biggest missing control.",
  "findings": 3
}}

Document:
{document_text}
'''
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
