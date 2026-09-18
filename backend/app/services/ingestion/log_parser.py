import csv
import json
from app.models.schemas import UnifiedLogRecord

class LogParserEngine:
    def __init__(self):
        pass

    def parse_file(self, file_path: str):
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Handle old network logs
                if "Source IP Address" in row:
                    yield UnifiedLogRecord(
                        timestamp=row.get("Timestamp", "1970-01-01T00:00:00Z"),
                        source_ip=row.get("Source IP Address", "N/A"),
                        dest_ip=row.get("Destination IP Address", "N/A"),
                        event_type=row.get("Attack Type", "General"),
                        severity=row.get("Severity Level", "INFO"),
                        raw=json.dumps(row)
                    )
                # Handle new SOC Case logs (Execution Gaps)
                elif "case_id" in row:
                    yield UnifiedLogRecord(
                        timestamp=row.get("timestamp", "1970-01-01T00:00:00Z"),
                        source_ip=row.get("analyst_id", "N/A"),
                        dest_ip=row.get("asset_ip", "N/A"),
                        event_type="SOC_CASE_RECORD",
                        severity=row.get("severity", "INFO"),
                        raw=json.dumps(row)
                    )
