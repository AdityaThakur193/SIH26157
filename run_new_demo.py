import requests
import json
import os, shutil

# Wipe DB
chroma_path = "data_samples/db/chroma"
sparse_path = "data_samples/db/sparse_index.sqlite"
ledger_path = "data_samples/ledger.sqlite"
for path in [chroma_path, sparse_path, ledger_path]:
    if os.path.exists(path):
        if os.path.isdir(path): shutil.rmtree(path)
        else: os.remove(path)

BASE_URL = "http://127.0.0.1:8000/api/v1"

print("==================================================")
print("1. INGESTING SOC CASE MANAGEMENT LOGS")
print("==================================================")
with open("data_samples/soc_cases_mock.csv", "rb") as f:
    files = {"file": ("soc_cases_mock.csv", f, "text/csv")}
    data = {"entity_name": "CSE-FIN-0091"}
    res = requests.post(f"{BASE_URL}/ingest", files=files, data=data)
print("Status:", res.status_code)
print(json.dumps(res.json(), indent=2))

print("\n==================================================")
print("2. FETCHING CSE DETAILED ASSESSMENT")
print("==================================================")
res4 = requests.get(f"{BASE_URL}/assessments/CSE-FIN-0091")
print("Status:", res4.status_code)
print(json.dumps(res4.json(), indent=2))
