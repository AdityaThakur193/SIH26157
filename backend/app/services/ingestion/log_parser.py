import csv
import json
from app.models.schemas import UnifiedLogRecord

class LogParserEngine:
    def __init__(self):
        pass

    def _parse_row(self, row: dict):
        if "Source IP Address" in row:
            return UnifiedLogRecord(
                timestamp=row.get("Timestamp", "1970-01-01T00:00:00Z"),
                source_ip=str(row.get("Source IP Address", "N/A")),
                dest_ip=str(row.get("Destination IP Address", "N/A")),
                event_type=str(row.get("Attack Type", "General")),
                severity=str(row.get("Severity Level", "INFO")),
                raw=json.dumps(row)
            )
        elif "case_id" in row:
            return UnifiedLogRecord(
                timestamp=row.get("timestamp", "1970-01-01T00:00:00Z"),
                source_ip=str(row.get("analyst_id", "N/A")),
                dest_ip=str(row.get("asset_ip", "N/A")),
                event_type="SOC_CASE_RECORD",
                severity=str(row.get("severity", "INFO")),
                raw=json.dumps(row)
            )
        else:
            return UnifiedLogRecord(
                timestamp=str(row.get("Timestamp", row.get("timestamp", row.get("date", "1970-01-01T00:00:00Z")))),
                source_ip="UNKNOWN_SRC",
                dest_ip="UNKNOWN_DST",
                event_type="UNSTRUCTURED_TELEMETRY",
                severity="INFO",
                raw=json.dumps(row)
            )

    def parse_file(self, file_path: str):
        if file_path.lower().endswith('.json'):
            with open(file_path, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    if isinstance(data, list):
                        for row in data:
                            if isinstance(row, dict):
                                yield self._parse_row(row)
                    elif isinstance(data, dict):
                        yield self._parse_row(data)
                except:
                    pass
        else:
            # Fallback to CSV parsing
            with open(file_path, "r", encoding="utf-8") as f:
                try:
                    reader = csv.DictReader(f)
                    for row in reader:
                        if row: # Skip empty rows
                            yield self._parse_row(row)
                except:
                    pass
