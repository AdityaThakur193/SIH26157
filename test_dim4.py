import requests
import sqlite3
import os
import sys

sys.path.append(os.path.abspath('backend'))
from app.services.ingestion.hash_verifier import update_entity_score

print("1. Fetching Alpha Bank (CSE-FIN-0091) - Only entity in database...")
res1 = requests.get("http://127.0.0.1:8000/api/v1/assessments/CSE-FIN-0091").json()
peer1 = next((d for d in res1['dimensions'] if d['title'].startswith('4')), None)
print("Result:", peer1['status_label'], "-", peer1['fidelity_gap'])

print("\n2. Simulating previous ingest & evaluation of Beta Bank (CSE-FIN-0092) with Risk Score 50...")
update_entity_score("CSE-FIN-0092", "Banking & Financial", 50)

print("\n3. Re-evaluating Alpha Bank (CSE-FIN-0091) now that a peer exists...")
res2 = requests.get("http://127.0.0.1:8000/api/v1/assessments/CSE-FIN-0091").json()
peer2 = next((d for d in res2['dimensions'] if d['title'].startswith('4')), None)

print("\n--- DIMENSION 4 (PEER VARIANCE) OUTPUT ---")
import json
print(json.dumps(peer2, indent=2))
