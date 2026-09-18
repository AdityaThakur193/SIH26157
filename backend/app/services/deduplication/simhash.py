import hashlib
import re
from typing import Dict, List, Any
from app.models.schemas import UnifiedLogRecord

class LogCluster:
    def __init__(self, fingerprint: int, base_record: UnifiedLogRecord):
        self.fingerprint = fingerprint
        self.count = 1
        self.first_seen = base_record.timestamp
        self.last_seen = base_record.timestamp
        self.event_type = base_record.event_type
        self.source_ips = {base_record.source_ip: 1} # dict of IP -> count
        self.dest_ip = base_record.dest_ip
        self.sample_raw = base_record.raw
        self.severity = base_record.severity

    def to_dict(self):
        import json
        return {
            "fingerprint": str(self.fingerprint),
            "count": self.count,
            "event_type": self.event_type,
            "source_ips": json.dumps(self.source_ips),
            "dest_ip": self.dest_ip,
            "severity": self.severity,
            "sample": self.sample_raw
        }

class SimHashEngine:
    def __init__(self, hash_size: int = 64, distance_threshold: int = 3):
        self.hash_size = hash_size
        self.threshold = distance_threshold
        self.clusters: Dict[int, LogCluster] = {}

    def _tokenize(self, text: str) -> List[str]:
        # Split by words, preserving numbers for things like ports
        return re.findall(r"\w+", text.lower())

    def compute_simhash(self, text: str) -> int:
        tokens = self._tokenize(text)
        v = [0] * self.hash_size
        for token in set(tokens):
            h = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16)
            weight = tokens.count(token)
            for i in range(self.hash_size):
                bitmask = 1 << i
                if h & bitmask:
                    v[i] += weight
                else:
                    v[i] -= weight
        
        fingerprint = 0
        for i in range(self.hash_size):
            if v[i] > 0:
                fingerprint |= (1 << i)
        return fingerprint

    def hamming_distance(self, hash1: int, hash2: int) -> int:
        x = (hash1 ^ hash2) & ((1 << self.hash_size) - 1)
        tot = 0
        while x:
            tot += 1
            x &= x - 1
        return tot

    def process_record(self, record: UnifiedLogRecord):
        import csv
        import json as json_mod
        
        # SOC Case Management records — fingerprint by case identity
        if record.event_type == "SOC_CASE_RECORD":
            try:
                raw_data = json_mod.loads(record.raw)
                semantic_string = (
                    f"SOC|{raw_data.get('case_id','')}|"
                    f"{raw_data.get('analyst_id','')}|"
                    f"{raw_data.get('severity','')}|"
                    f"{raw_data.get('alert_type','')}|"
                    f"{raw_data.get('asset_ip','')}|"
                    f"{raw_data.get('time_to_close_mins','')}"
                )
            except:
                semantic_string = f"SOC|{record.raw[:100]}"
        else:
            # Network log records — extract structural fields from CSV
            protocol = "N/A"
            packet_type = "N/A"
            traffic_type = "N/A"
            attack_type = "N/A"
            action = "N/A"
            
            if "," in record.raw:
                try:
                    parts = next(csv.reader([record.raw]))
                    if len(parts) > 15:
                        protocol = parts[5].strip()
                        packet_type = parts[7].strip()
                        traffic_type = parts[8].strip()
                        attack_type = parts[13].strip()
                        action = parts[15].strip()
                except:
                    pass
                    
            semantic_string = f"Event:{record.event_type}|Sev:{record.severity}|Proto:{protocol}|Pkt:{packet_type}|Traffic:{traffic_type}|Attack:{attack_type}|Action:{action}"
        
        # Use exact string hashing since fuzzy bit-flipping on small structured categorical arrays 
        # (5 tokens) causes catastrophic merging/separation failures.
        fingerprint = int(hashlib.md5(semantic_string.encode('utf-8')).hexdigest()[:15], 16)
        
        # O(1) Exact matching
        if fingerprint in self.clusters:
            self.clusters[fingerprint].count += 1
            self.clusters[fingerprint].last_seen = record.timestamp
            ip = record.source_ip
            self.clusters[fingerprint].source_ips[ip] = self.clusters[fingerprint].source_ips.get(ip, 0) + 1
        else:
            self.clusters[fingerprint] = LogCluster(fingerprint, record)

    def get_clusters(self) -> List[LogCluster]:
        return list(self.clusters.values())
