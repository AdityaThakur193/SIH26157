import os, sys, json
sys.path.append(os.path.abspath('backend'))
from app.services.scoring.compliance_engine import ComplianceEngine

print("Reading ISMS Policy...")
with open("data_samples/alpha_bank_isms.txt", "r") as f:
    doc_text = f.read()

print("Evaluating Compliance Posture with Llama 3.1...")
engine = ComplianceEngine()
result = engine.evaluate_policy(doc_text)

print("\n--- DIMENSION 3 (COMPLIANCE POSTURE) OUTPUT ---")
print(json.dumps(result, indent=2))
