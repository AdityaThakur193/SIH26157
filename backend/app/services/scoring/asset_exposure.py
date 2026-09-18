import json
from typing import List, Dict, Any
from collections import defaultdict
from app.services.deduplication.simhash import LogCluster

class AssetExposureEngine:
    def __init__(self):
        pass
        
    def evaluate_exposure(self, clusters: List[LogCluster]) -> Dict[str, Any]:
        """Calculates critical assets exposed to high-severity alerts/traffic."""
        exposed_assets = set()
        critical_assets_exposed = []  # Named critical infra assets
        
        CRITICAL_KEYWORDS = ["DB", "CORE", "SWIFT", "PAY", "AUTH", "BANKING"]
        
        # Track per-asset severity counts for SOC data
        asset_high_sev_counts = defaultdict(int)
        
        for c in clusters:
            if c.severity in ['High', 'Critical']:
                exposed_assets.add(c.dest_ip)
                asset_high_sev_counts[c.dest_ip] += c.count
                
                # Check if this is a named critical infrastructure asset
                if any(kw in c.dest_ip.upper() for kw in CRITICAL_KEYWORDS):
                    if c.dest_ip not in critical_assets_exposed:
                        critical_assets_exposed.append(c.dest_ip)
                
        count = len(exposed_assets)
        critical_count = len(critical_assets_exposed)
        
        # Build the gap description
        if critical_count > 0:
            top_critical = critical_assets_exposed[:3]
            gap_detail = f"{critical_count} critical infrastructure assets under threat: {', '.join(top_critical)}"
        else:
            gap_detail = f"{count} distinct assets receiving high-severity alerts"
        
        if count > 50:
            return {
                "status_label": "HIGH RISK",
                "status_color": "red",
                "evaluation_metric": "Widespread critical asset exposure",
                "fidelity_gap": gap_detail,
                "findings_count": count
            }
        elif count > 5:
            return {
                "status_label": "ELEVATED",
                "status_color": "yellow",
                "evaluation_metric": "Multiple assets under high-severity alert load",
                "fidelity_gap": gap_detail,
                "findings_count": count
            }
        elif count > 0:
            return {
                "status_label": "CONTAINED",
                "status_color": "green",
                "evaluation_metric": "Limited asset exposure",
                "fidelity_gap": gap_detail,
                "findings_count": count
            }
        else:
            return {
                "status_label": "SECURE",
                "status_color": "green",
                "evaluation_metric": "No assets currently under high-severity alerts",
                "fidelity_gap": "Zero targeted assets",
                "findings_count": 0
            }
