import os, sys, shutil

# Wipe existing DBs to ensure a clean demo
chroma_path = "data_samples/db/chroma"
sparse_path = "data_samples/db/sparse_index.sqlite"
ledger_path = "data_samples/ledger.sqlite"
comp_file = "data_samples/db/CSE-FIN-0091_compliance.json"

for path in [chroma_path, sparse_path, ledger_path, comp_file]:
    if os.path.exists(path):
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)
print("Database wiped clean.")
