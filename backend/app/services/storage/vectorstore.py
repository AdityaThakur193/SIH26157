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
        # Mapping table to track which entity each cluster row belongs to
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cluster_entity_map (
                rowid_ref INTEGER,
                entity_name TEXT
            )
        ''')
        # Index for fast per-entity lookups
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_cluster_entity ON cluster_entity_map(entity_name)
        ''')
        self.conn.commit()

    def store_clusters(self, clusters: List[LogCluster], entity_name: str = ""):
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
            
            # Track entity ownership
            fts_rowid = cursor.lastrowid
            if entity_name:
                cursor.execute(
                    'INSERT INTO cluster_entity_map (rowid_ref, entity_name) VALUES (?, ?)',
                    (fts_rowid, entity_name)
                )
            
            ids.append(fp_str)
            doc = f"Event: {c.event_type}. Sources: {source_ips_json}. Target: {c.dest_ip}. Payload: {c.sample_raw}"
            documents.append(doc)
            metadatas.append({"count": c.count, "severity": c.severity, "entity_name": entity_name})
            
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

    def get_entity_metrics(self, entity_name: str) -> Dict[str, Any]:
        """Calculates metrics for a SINGLE entity using the cluster_entity_map."""
        cursor = self.conn.cursor()
        
        # Check if this entity has ANY mapped clusters
        cursor.execute(
            "SELECT COUNT(*) FROM cluster_entity_map WHERE entity_name = ?",
            (entity_name,)
        )
        mapped_count = cursor.fetchone()[0]
        
        if mapped_count == 0:
            # Entity exists in ledger but has no parseable SOC clusters
            return {
                "alerts_analyzed": 0,
                "cases_analyzed": 0,
                "supervisory_findings": 0,
                "priority_pool_cases": 0
            }
        
        # Get all rowids belonging to this entity
        cursor.execute("""
            SELECT f.count, f.severity
            FROM incidents_fts f
            INNER JOIN cluster_entity_map m ON f.rowid = m.rowid_ref
            WHERE m.entity_name = ?
        """, (entity_name,))
        rows = cursor.fetchall()
        
        total_raw = sum(r[0] for r in rows)
        dedup_count = len(rows)
        high_severity = sum(1 for r in rows if r[1] and r[1].upper() in ('HIGH', 'CRITICAL'))
        
        return {
            "alerts_analyzed": total_raw,
            "cases_analyzed": dedup_count,
            "supervisory_findings": high_severity,
            "priority_pool_cases": high_severity
        }

    def get_entity_clusters(self, entity_name: str) -> List[LogCluster]:
        """Get clusters for a specific entity only."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT f.fingerprint, f.event_type, f.source_ips, f.dest_ip, f.severity, f.sample_raw, f.count, f.first_seen, f.last_seen
            FROM incidents_fts f
            INNER JOIN cluster_entity_map m ON f.rowid = m.rowid_ref
            WHERE m.entity_name = ?
        """, (entity_name,))
        rows = cursor.fetchall()
        
        if not rows:
            # Entity has no parseable clusters — return empty
            return []
        
        clusters = []
        import json
        for r in rows:
            from app.models.schemas import UnifiedLogRecord
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

    def get_per_entity_overview(self) -> Dict[str, Dict[str, int]]:
        """Returns per-entity alert and case counts for the overview chart."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT m.entity_name, SUM(f.count) as total_raw, COUNT(*) as cluster_count
            FROM incidents_fts f
            INNER JOIN cluster_entity_map m ON f.rowid = m.rowid_ref
            GROUP BY m.entity_name
        """)
        rows = cursor.fetchall()
        result = {}
        for r in rows:
            result[r[0]] = {"alerts": r[1], "cases": r[2]}
        return result

    def reset_store(self):
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM incidents_fts")
        cursor.execute("DELETE FROM cluster_entity_map")
        self.conn.commit()
        try:
            self.chroma_client.delete_collection("sat_sa_incidents")
        except Exception:
            pass
        self.collection = self.chroma_client.get_or_create_collection(
            name="sat_sa_incidents",
            metadata={"hnsw:space": "cosine"}
        )
        # Also clean up any cached compliance JSON files in DB_DIR
        if os.path.exists(DB_DIR):
            for fname in os.listdir(DB_DIR):
                if fname.endswith("_compliance.json"):
                    try:
                        os.remove(os.path.join(DB_DIR, fname))
                    except Exception:
                        pass
        return True
