import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

print("==================================================")
print("1. INGESTING RAW LOGS (cybersecurity_attacks.csv)")
print("==================================================")
with open("data_samples/cybersecurity_attacks.csv", "rb") as f:
    files = {"file": ("cybersecurity_attacks.csv", f, "text/csv")}
    data = {"entity_name": "FIN-0091"}
    res = requests.post(f"{BASE_URL}/ingest", files=files, data=data)
print("Status:", res.status_code)
print(json.dumps(res.json(), indent=2))

print("\n==================================================")
print("2. INGESTING COMPLIANCE POLICY (alpha_bank_isms.txt)")
print("==================================================")
with open("data_samples/alpha_bank_isms.txt", "rb") as f:
    files = {"file": ("alpha_bank_isms.txt", f, "text/plain")}
    data = {"cse_id": "FIN-0091"}
    res2 = requests.post(f"{BASE_URL}/ingest/compliance", files=files, data=data)
print("Status:", res2.status_code)
print(json.dumps(res2.json(), indent=2))

print("\n==================================================")
print("3. FETCHING NATIONAL OVERVIEW API")
print("==================================================")
res3 = requests.get(f"{BASE_URL}/assessments/overview")
print("Status:", res3.status_code)
print(json.dumps(res3.json(), indent=2))

print("\n==================================================")
print("4. FETCHING CSE DETAILED ASSESSMENT (FIN-0091)")
print("==================================================")
res4 = requests.get(f"{BASE_URL}/assessments/FIN-0091")
print("Status:", res4.status_code)
print(json.dumps(res4.json(), indent=2))
