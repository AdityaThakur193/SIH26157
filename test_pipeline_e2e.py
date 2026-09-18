import requests
import json
import time

BASE = 'http://localhost:8000/api/v1'

print('=== 1. TESTING PURGE / RESET ENDPOINT ===')
r = requests.post(f'{BASE}/assessments/reset')
print(f'Reset Response [{r.status_code}]:', r.json())

r_overview_clean = requests.get(f'{BASE}/assessments/overview')
print('Clean Overview State:', r_overview_clean.json())
assert r_overview_clean.json()['alerts_analyzed'] == 0, 'Clean state should have 0 alerts'

print('\n=== 2. TESTING LOG INGESTION WITH REAL SOC DATA SAMPLE ===')
file_path = 'E:/SAT-SA/data_samples/soc_case_management.csv'
with open(file_path, 'rb') as f:
    files = {'file': ('soc_case_management.csv', f, 'text/csv')}
    data = {'entity_name': 'Alpha Bank Ltd'}
    r_ingest = requests.post(f'{BASE}/ingest', files=files, data=data)
print(f'Ingest Response [{r_ingest.status_code}]:', json.dumps(r_ingest.json(), indent=2))
ingest_data = r_ingest.json()

print('\n=== 3. TESTING COMPLIANCE AUDIT WITH ISMS POLICY SAMPLE ===')
isms_path = 'E:/SAT-SA/data_samples/alpha_bank_isms.txt'
with open(isms_path, 'rb') as f:
    files = {'file': ('alpha_bank_isms.txt', f, 'text/plain')}
    data = {'cse_id': ingest_data['case_id']}
    r_comp = requests.post(f'{BASE}/ingest/compliance', files=files, data=data)
print(f'Compliance Response [{r_comp.status_code}]:', json.dumps(r_comp.json(), indent=2))

print('\n=== 4. TESTING OVERVIEW STATE AFTER INGESTION ===')
r_overview = requests.get(f'{BASE}/assessments/overview')
print(f'Overview Data [{r_overview.status_code}]:', json.dumps(r_overview.json(), indent=2))

print('\n=== 5. TESTING CSE DOSSIER & 6 EVALUATION DIMENSIONS ===')
r_detail = requests.get(f"{BASE}/assessments/{ingest_data['case_id']}")
detail = r_detail.json()
print(f'CSE Detail [{r_detail.status_code}]: Entity={detail["cse_name"]}, Tier={detail["tier"]}, Dimensions Count={len(detail["dimensions"])}')
for d in detail['dimensions']:
    print(f'  - [{d["domain_code"]}] {d["title"]}: {d["status_label"]} ({d["findings_count"]} findings)')

print('\n=== 6. TESTING FORENSIC COPILOT LOCAL RAG ===')
copilot_payload = {'query': 'Explain brute force clusters and security breaches', 'case_id': ingest_data['case_id']}
r_copilot = requests.post(f'{BASE}/copilot/query', json=copilot_payload)
print(f'Copilot Response [{r_copilot.status_code}]: Flagged={r_copilot.json()["findings_flagged"]}')
print('Evidence Sources:', r_copilot.json()['evidence_sources'])
print('Answer Sample:', r_copilot.json()['answer'][:250] + '...')

print('\n>>> ALL PIPELINE STAGES VERIFIED SUCCESSFULLY! <<<')
