import json
import csv
import re
from typing import List, Dict, Any
import hashlib

def parse_syslog(line: str) -> Dict[str, Any]:
    # Basic syslog regex parsing
    # <PRIVAL>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
    # For simplicity, we'll extract common fields
    syslog_regex = r'^(?:<(\d+)>)?(?:(\w+\s+\d+\s+\d+:\d+:\d+)|([\w\-\:\+]+))\s+(\S+)\s+(\S+)\s*(.*)$'
    match = re.match(syslog_regex, line)
    if match:
        prival, timestamp1, timestamp2, host, app, msg = match.groups()
        return {
            "timestamp": timestamp1 or timestamp2,
            "host": host,
            "app": app,
            "message": msg,
            "raw": line,
            "type": "syslog"
        }
    return {"raw": line, "type": "unknown"}

def parse_json_log(line: str) -> Dict[str, Any]:
    try:
        data = json.loads(line)
        return {
            "timestamp": data.get("timestamp", data.get("time", data.get("@timestamp"))),
            "source_ip": data.get("src_ip", data.get("source_ip", data.get("client_ip"))),
            "dest_ip": data.get("dest_ip", data.get("destination_ip")),
            "event_type": data.get("event_type", data.get("action")),
            "severity": data.get("severity", data.get("level", "info")),
            "raw": line,
            "type": "json"
        }
    except json.JSONDecodeError:
        return {"raw": line, "type": "unknown"}

def normalize_logs(file_path: str, log_format: str = "auto") -> List[Dict[str, Any]]:
    normalized_logs = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        if log_format == "csv" or file_path.endswith(".csv"):
            reader = csv.DictReader(f)
            for row in reader:
                row["raw"] = json.dumps(row)
                row["type"] = "csv"
                normalized_logs.append(row)
        else:
            for line in f:
                line = line.strip()
                if not line: continue
                
                if line.startswith("{"):
                    normalized_logs.append(parse_json_log(line))
                else:
                    normalized_logs.append(parse_syslog(line))
                    
    return normalized_logs

def calculate_simhash(log_data: Dict[str, Any]) -> str:
    # A simple pseudo-SimHash for demonstration: hashing core features to group similar alerts
    # In a real scenario, this would use a 64-bit SimHash algorithm on the text tokens
    core_features = f"{log_data.get('source_ip', '')}_{log_data.get('dest_ip', '')}_{log_data.get('event_type', '')}"
    return hashlib.md5(core_features.encode()).hexdigest()

def process_and_deduplicate(file_path: str) -> Dict[str, Any]:
    logs = normalize_logs(file_path)
    clusters = {}
    
    for log in logs:
        # We group logs by their structural similarity hash (SimHash equivalent)
        sim_hash = calculate_simhash(log)
        if sim_hash not in clusters:
            clusters[sim_hash] = {
                "count": 1,
                "sample": log,
                "first_seen": log.get("timestamp"),
                "last_seen": log.get("timestamp")
            }
        else:
            clusters[sim_hash]["count"] += 1
            clusters[sim_hash]["last_seen"] = log.get("timestamp")
            
    return {
        "total_raw_logs": len(logs),
        "unique_clusters": len(clusters),
        "clusters": list(clusters.values())
    }
