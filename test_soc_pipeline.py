"""
Full end-to-end pipeline test for SAT-SA using the SOC Case Management dataset.
This simulates what happens when a CSE submits their SOC data for NCIIPC review.
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

print("=" * 70)
print("SAT-SA FULL PIPELINE TEST — SOC CASE MANAGEMENT DATA")
print("=" * 70)

# Step 1: Ingest the SOC Case Management CSV
print("\n[STEP 1] Ingesting SOC Case Management data...")
with open("data_samples/soc_case_management.csv", "rb") as f:
    files = {"file": ("soc_case_management.csv", f, "text/csv")}
    data = {"entity_name": "Alpha Bank Ltd"}
    res = requests.post(f"{BASE_URL}/ingest", files=files, data=data)
ingest = res.json()
print(f"  Status: {res.status_code}")
print(f"  Case ID: {ingest['case_id']}")
print(f"  Raw Logs Ingested: {ingest['total_raw_logs']}")
print(f"  Deduplicated Clusters: {ingest['deduplicated_clusters']}")
print(f"  SHA256: {ingest['sha256_hash'][:32]}...")
print(f"  Ledger Status: {ingest['status']}")

# Step 2: Ingest a compliance policy document
print("\n[STEP 2] Ingesting ISMS Compliance Policy...")
with open("data_samples/alpha_bank_isms.txt", "rb") as f:
    files = {"file": ("alpha_bank_isms.txt", f, "text/plain")}
    data = {"cse_id": "CASE-2026-ALP-09"}
    res2 = requests.post(f"{BASE_URL}/ingest/compliance", files=files, data=data)
comp = res2.json()
print(f"  Status: {res2.status_code}")
print(f"  Compliance Verdict: {comp['compliance_result']['status_label']}")
print(f"  Biggest Gap: {comp['compliance_result']['fidelity_gap']}")

# Step 3: Fetch the full assessment
print("\n[STEP 3] Fetching CSE Detailed Assessment...")
res3 = requests.get(f"{BASE_URL}/assessments/CASE-2026-ALP-09")
assessment = res3.json()

print(f"\n{'=' * 70}")
print(f"CSE: {assessment['cse_name']}")
print(f"Audit Window: {assessment['audit_window']}")
print(f"Attention Level: {assessment['attention_level']}")
print(f"Alerts Ingested: {assessment['alerts_ingested']}")
print(f"Cases Correlated: {assessment['cases_correlated']}")
print(f"Formal Investigations: {assessment['formal_investigations']}")
print(f"Peer Variance: {assessment['peer_variance_index']}")
print(f"{'=' * 70}")

print("\n--- ALL 6 SUPERVISORY DIMENSIONS ---\n")
for d in assessment['dimensions']:
    color_emoji = {"red": "[RED]", "yellow": "[YEL]", "green": "[GRN]", "gray": "[---]"}.get(d['status_color'], "[---]")
    print(f"  {color_emoji} {d['title']}")
    print(f"     Status: {d['status_label']}")
    print(f"     Metric: {d['evaluation_metric']}")
    print(f"     Gap:    {d['fidelity_gap']}")
    print(f"     Findings: {d['findings_count']}")
    print()

# Step 4: Print the full JSON for Kaushik
print(f"{'=' * 70}")
print("FULL JSON PAYLOAD (for frontend integration):")
print(f"{'=' * 70}")
print(json.dumps(assessment, indent=2))
