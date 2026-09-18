import requests
import json
import time
import os

BASE_URL = "http://localhost:8000/api/v1"
COPILOT_URL = "http://localhost:8000/api/v1/copilot"

def print_step(msg):
    print(f"\n[{'*'*10}] {msg} [{'*'*10}]\n")

def test_pipeline():
    # 1. Reset Database
    print_step("1. Resetting Database")
    try:
        res = requests.post(f"{BASE_URL}/assessments/reset")
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        return

    # 2. Ingest Data
    print_step("2. Ingesting Data")
    csv_path = r"E:\SAT-SA\data_samples\soc_case_management.csv"
    if not os.path.exists(csv_path):
        print(f"CSV file not found at {csv_path}")
        return
        
    with open(csv_path, 'rb') as f:
        files = {'file': ('soc_case_management.csv', f, 'text/csv')}
        data = {'entity_name': 'TEST_ENTITY'}
        res = requests.post(f"{BASE_URL}/ingest", files=files, data=data)
        print(f"Status: {res.status_code}")
        try:
            print(f"Response: {res.json()}")
        except:
            print(f"Response text: {res.text}")

    # 3. Get Overview
    print_step("3. Getting Overview")
    res = requests.get(f"{BASE_URL}/assessments/overview")
    print(f"Status: {res.status_code}")
    try:
        overview_data = res.json()
        print(f"Active Entities: {overview_data.get('active_entities')}")
        print(f"Alerts Analyzed: {overview_data.get('alerts_analyzed')}")
        if overview_data.get('entities'):
            first_entity = overview_data['entities'][0]
            print(f"Sample Entity: {first_entity.get('id')} - {first_entity.get('name')}")
            entity_id = first_entity.get('id')
        else:
            print("No entities returned.")
            return
    except Exception as e:
        print(f"Error parsing overview: {e}")
        return

    # 4. Get Dossier
    print_step(f"4. Getting Dossier for {entity_id}")
    res = requests.get(f"{BASE_URL}/assessments/{entity_id}")
    print(f"Status: {res.status_code}")
    try:
        dossier = res.json()
        print(f"Entity: {dossier.get('cse_id')}")
        print(f"Attention Level: {dossier.get('attention_level')}")
        dimensions = dossier.get('dimensions', [])
        print(f"Dimensions Count: {len(dimensions)}")
    except Exception as e:
        print(f"Error parsing dossier: {e}")

    # 5. Copilot Query
    print_step("5. Querying Copilot")
    payload = {
        "query": f"What are the main risks for {entity_id}?",
        "context_filters": {"entity_id": entity_id}
    }
    try:
        res = requests.post(f"{COPILOT_URL}/query", json=payload)
        print(f"Status: {res.status_code}")
        try:
            print(f"Response: {res.json()}")
        except:
            print(f"Response text: {res.text}")
    except Exception as e:
        print(f"Error querying copilot: {e}")

if __name__ == '__main__':
    test_pipeline()
