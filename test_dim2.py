import os, sys, json
sys.path.append(os.path.abspath('backend'))
from app.services.storage.vectorstore import VectorStoreEngine
from app.services.scoring.anomaly_engine import AnomalyEngine

print("Initializing VectorStore and fetching all clusters...")
vectorstore = VectorStoreEngine()
clusters = vectorstore.get_all_clusters()

print(f"Total Clusters fetched: {len(clusters)}")
print("Running AnomalyEngine (Dimension 2)...")

engine = AnomalyEngine()
result = engine.evaluate_temporal_anomalies(clusters)

print("\n--- DIMENSION 2 (ANOMALY METRICS) OUTPUT ---")
print(json.dumps(result, indent=2))
