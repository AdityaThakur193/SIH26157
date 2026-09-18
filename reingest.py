import os, sys, shutil
sys.path.append(os.path.abspath('backend'))

chroma_path = "data_samples/db/chroma"
sparse_path = "data_samples/db/sparse_index.sqlite"

if os.path.exists(chroma_path):
    shutil.rmtree(chroma_path)
if os.path.exists(sparse_path):
    os.remove(sparse_path)

from app.routers.ingest import process_file_pipeline
print("Re-ingesting Kaggle dataset into Vectorstore...")
process_file_pipeline("data_samples/cybersecurity_attacks.csv")
print("Done!")
