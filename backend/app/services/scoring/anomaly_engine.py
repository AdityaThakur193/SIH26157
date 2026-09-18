from typing import List, Dict, Any
from collections import defaultdict
from datetime import datetime
from app.services.deduplication.simhash import LogCluster

class AnomalyEngine:
    def __init__(self):
        pass
        
    def evaluate_temporal_anomalies(self, clusters: List[LogCluster]) -> Dict[str, Any]:
        """Scans the cluster timestamps for volumetric spikes (Anomaly Metrics)."""
        date_counts = defaultdict(int)
        
        for c in clusters:
            if c.first_seen and c.first_seen != 'N/A':
                try:
                    dt = datetime.fromisoformat(c.first_seen.replace(' ', 'T'))
                    date_str = dt.strftime('%Y-%m-%d')
                    date_counts[date_str] += c.count
                except Exception:
                    pass
                    
        if not date_counts:
            return {
                "status_label": "UNKNOWN",
                "status_color": "gray",
                "evaluation_metric": "Insufficient temporal data",
                "fidelity_gap": "No baseline established",
                "findings_count": 0
            }
            
        avg_volume = sum(date_counts.values()) / len(date_counts)
        max_date = max(date_counts, key=date_counts.get)
        max_volume = date_counts[max_date]
        
        spike_percentage = (max_volume / avg_volume) * 100 if avg_volume > 0 else 0
        
        if spike_percentage > 300:
            return {
                "status_label": "CRITICAL SPIKE",
                "status_color": "red",
                "evaluation_metric": f"Volumetric spike detected on {max_date}",
                "fidelity_gap": f"{spike_percentage:.0f}% variance vs baseline",
                "findings_count": max_volume
            }
        elif spike_percentage > 150:
            return {
                "status_label": "MODERATE",
                "status_color": "yellow",
                "evaluation_metric": f"Elevated volume on {max_date}",
                "fidelity_gap": f"{spike_percentage:.0f}% variance vs baseline",
                "findings_count": max_volume
            }
        else:
            return {
                "status_label": "NOMINAL",
                "status_color": "green",
                "evaluation_metric": "Traffic aligns with baseline",
                "fidelity_gap": f"Max variance {spike_percentage:.0f}%",
                "findings_count": 0
            }
