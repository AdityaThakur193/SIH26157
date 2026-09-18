import chromadb
import sqlite3
import os
from typing import List, Dict, Any
from app.services.deduplication.simhash import LogCluster

# Anchor to project root: SAT-SA
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
DB_DIR = os.path.join(PROJECT_ROOT, "data_samples", "db")
SQLITE_PATH = os.path.join(DB_DIR, "sparse_index.sqlite")
CHROMA_PATH = os.path.join(DB_DIR, "chroma")

class VectorStoreEngine:
    def __init__(self):
        os.makedirs(DB_DIR, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
        
        self.collection = self.chroma_client.get_or_create_collection(
            name="sat_sa_incidents",
            metadata={"hnsw:space": "cosine"}
        )
        self.conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
        self._init_sqlite()

    def _init_sqlite(self):
        cursor = self.conn.cursor()
        cursor.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS incidents_fts USING fts5(
                fingerprint,
                event_type,
                source_ips,
                dest_ip,
                severity,
                sample_raw,
                count UNINDEXED,
                first_seen UNINDEXED,
                last_seen UNINDEXED
            )
        ''')
        self.conn.commit()

    def store_clusters(self, clusters: List[LogCluster]):
        if not clusters:
            return
            
        cursor = self.conn.cursor()
        ids = []
        documents = []
        metadatas = []
        
        for c in clusters:
            fp_str = str(c.fingerprint)
            import json
            source_ips_json = json.dumps(c.source_ips)
            cursor.execute('''
                INSERT INTO incidents_fts (fingerprint, event_type, source_ips, dest_ip, severity, sample_raw, count, first_seen, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (fp_str, c.event_type, source_ips_json, c.dest_ip, c.severity, c.sample_raw, c.count, c.first_seen, c.last_seen))
            
            ids.append(fp_str)
            doc = f"Event: {c.event_type}. Sources: {source_ips_json}. Target: {c.dest_ip}. Payload: {c.sample_raw}"
            documents.append(doc)
            metadatas.append({"count": c.count, "severity": c.severity})
            
        self.conn.commit()
        
        if documents:
            BATCH_SIZE = 5000
            for i in range(0, len(documents), BATCH_SIZE):
                self.collection.add(
                    documents=documents[i:i+BATCH_SIZE], 
                    metadatas=metadatas[i:i+BATCH_SIZE], 
                    ids=ids[i:i+BATCH_SIZE]
                )

    def hybrid_search(self, query_text: str, k: int = 5) -> List[dict]:
        results = self.collection.query(query_texts=[query_text], n_results=k)
        retrieved = []
        if results and results['documents']:
            docs = results['documents'][0]
            ids = results['ids'][0]
            metas = results['metadatas'][0]
            for i in range(len(docs)):
                retrieved.append({
                    "id": ids[i],
                    "content": docs[i],
                    "count": metas[i].get("count", 1)
                })
        return retrieved

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Calculates real metrics from the database."""
        cursor = self.conn.cursor()
        
        # Total deduplicated clusters
        cursor.execute("SELECT COUNT(*) FROM incidents_fts")
        dedup_count = cursor.fetchone()[0] or 0
        
        # Total raw logs represented
        cursor.execute("SELECT SUM(count) FROM incidents_fts")
        total_raw = cursor.fetchone()[0] or 0
        
        # High priority findings (e.g. severity = High or Critical)
        cursor.execute("SELECT COUNT(*) FROM incidents_fts WHERE UPPER(severity) IN ('HIGH', 'CRITICAL')")
        high_severity_clusters = cursor.fetchone()[0] or 0
        
        # Entity count from ledger (if exists)
        try:
            cursor.execute("ATTACH DATABASE 'data_samples/ledger.sqlite' AS ledger")
            cursor.execute("SELECT COUNT(DISTINCT entity_name) FROM ledger.audit_ledger")
            active_entities = cursor.fetchone()[0] or 0
            cursor.execute("DETACH DATABASE ledger")
        except:
            active_entities = 1 # Fallback if ledger not initialized
            
        return {
            "active_entities": active_entities,
            "alerts_analyzed": total_raw,
            "cases_analyzed": dedup_count,
            "supervisory_findings": high_severity_clusters,
            "priority_pool_cases": high_severity_clusters
        }

    def get_all_clusters(self) -> List[LogCluster]:
        cursor = self.conn.cursor()
        cursor.execute('SELECT fingerprint, event_type, source_ips, dest_ip, severity, sample_raw, count, first_seen, last_seen FROM incidents_fts')
        rows = cursor.fetchall()
        
        clusters = []
        import json
        for r in rows:
            from app.models.schemas import UnifiedLogRecord
            # Reconstruct LogCluster from stored DB row
            rec = UnifiedLogRecord(
                timestamp=r[7] if len(r)>7 else "N/A",
                source_ip="N/A",
                dest_ip=r[3],
                event_type=r[1],
                severity=r[4],
                raw=r[5]
            )
            c = LogCluster(int(r[0]), rec)
            c.count = r[6]
            c.source_ips = json.loads(r[2])
            c.first_seen = r[7] if len(r)>7 else "N/A"
            c.last_seen = r[8] if len(r)>8 else "N/A"
            clusters.append(c)
        return clusters
