import hashlib
import sqlite3
import os
from datetime import datetime

LEDGER_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data_samples/ledger.sqlite"))

def init_ledger():
    os.makedirs(os.path.dirname(LEDGER_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(LEDGER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            case_id TEXT,
            entity_name TEXT,
            file_name TEXT,
            sha256_hash TEXT,
            officer_id TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS entity_scores (
            cse_id TEXT PRIMARY KEY,
            sector TEXT,
            risk_score INTEGER
        )
    ''')
    conn.commit()
    conn.close()

def compute_file_hash(file_path: str, chunk_size: int = 8192) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            sha256.update(chunk)
    return sha256.hexdigest()

def log_to_ledger(case_id: str, entity_name: str, file_name: str, file_hash: str, officer_id: str = "SYSTEM"):
    init_ledger()
    conn = sqlite3.connect(LEDGER_DB_PATH)
    cursor = conn.cursor()
    timestamp = datetime.utcnow().isoformat()
    cursor.execute('''
        INSERT INTO audit_ledger (timestamp, case_id, entity_name, file_name, sha256_hash, officer_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (timestamp, case_id, entity_name, file_name, file_hash, officer_id))
    conn.commit()
    conn.close()
    return True

def update_entity_score(cse_id: str, sector: str, risk_score: int):
    init_ledger()
    conn = sqlite3.connect(LEDGER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO entity_scores (cse_id, sector, risk_score)
        VALUES (?, ?, ?)
        ON CONFLICT(cse_id) DO UPDATE SET risk_score=excluded.risk_score
    ''', (cse_id.upper(), sector, risk_score))
    conn.commit()
    conn.close()

def get_all_entities():
    init_ledger()
    conn = sqlite3.connect(LEDGER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT a.case_id, a.entity_name, e.sector, e.risk_score 
        FROM audit_ledger a
        LEFT JOIN entity_scores e ON a.case_id LIKE '%' || e.cse_id || '%'
        GROUP BY a.entity_name
    ''')
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_entity_name(cse_id: str) -> str:
    init_ledger()
    conn = sqlite3.connect(LEDGER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT entity_name FROM audit_ledger WHERE case_id LIKE ?", (f'%{cse_id}%',))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row[0]
    return f"Entity {cse_id}"

def reset_ledger():
    init_ledger()
    conn = sqlite3.connect(LEDGER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM audit_ledger")
    cursor.execute("DELETE FROM entity_scores")
    conn.commit()
    conn.close()
    return True
