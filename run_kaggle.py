import os
import sys
sys.path.append(os.path.abspath('backend'))
from app.services.ingestion.log_parser import LogParserEngine
from app.services.deduplication.simhash import SimHashEngine
from app.services.storage.vectorstore import VectorStoreEngine

print('Parsing Kaggle Dataset...')
parser = LogParserEngine()
simhash_engine = SimHashEngine()
raw = 0

for record in parser.parse_file('data_samples/cybersecurity_attacks.csv'):
    raw += 1
    simhash_engine.process_record(record)
    
clusters = simhash_engine.get_clusters()
print(f'Raw Logs Processed: {raw}')
print(f'Deduplicated Clusters: {len(clusters)}')

print('Storing in VectorStore...')
vectorstore = VectorStoreEngine()
vectorstore.store_clusters(clusters)
print('Done!')
