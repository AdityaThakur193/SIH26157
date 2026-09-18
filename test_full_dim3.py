import requests
import json

print("1. Submitting Compliance Policy to Ingest API...")
with open("data_samples/alpha_bank_isms.txt", "rb") as f:
    files = {"file": ("alpha_bank_isms.txt", f, "text/plain")}
    data = {"cse_id": "CSE-FIN-0091"}
    res = requests.post("http://127.0.0.1:8000/api/v1/ingest/compliance", files=files, data=data)
print("Response:", res.status_code)
print(res.json())

print("\n2. Fetching SAT-SA Assessment for CSE-FIN-0091...")
res2 = requests.get("http://127.0.0.1:8000/api/v1/assessments/CSE-FIN-0091")
data = res2.json()

print("\n--- FULL DASHBOARD DIMENSIONS ---")
for d in data.get("dimensions", []):
    print(f"{d['title']}: {d['status_label']} ({d['fidelity_gap']})")
