from typing import Dict, Any
import sqlite3
import os

class PeerVarianceEngine:
    def __init__(self):
        self.ledger_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../data_samples/ledger.sqlite"))
        
    def evaluate_variance(self, cse_id: str, current_score: int, sector: str = "Banking & Financial") -> Dict[str, Any]:
        """Calculates how this entity's risk score compares to the sector average."""
        if not os.path.exists(self.ledger_db_path):
            return {
                "status_label": "AWAITING MORE ENTITIES",
                "status_color": "gray",
                "evaluation_metric": "Sector average calculation pending",
                "fidelity_gap": "Need >1 entity to calculate variance",
                "findings_count": 0
            }
            
        try:
            conn = sqlite3.connect(self.ledger_db_path)
            cursor = conn.cursor()
            
            # Get average score of all OTHER entities in the same sector
            cursor.execute('''
                SELECT AVG(risk_score), COUNT(cse_id) 
                FROM entity_scores 
                WHERE sector = ? AND cse_id != ?
            ''', (sector, cse_id.upper()))
            
            result = cursor.fetchone()
            conn.close()
            
            avg_score = result[0]
            peer_count = result[1]
            
            if not peer_count or peer_count == 0:
                return {
                    "status_label": "AWAITING MORE ENTITIES",
                    "status_color": "gray",
                    "evaluation_metric": f"Comparing to {sector} peers",
                    "fidelity_gap": "No peer data available in ledger",
                    "findings_count": 0
                }
                
            variance = current_score - avg_score
            
            if variance > 20:
                return {
                    "status_label": "CRITICAL DEVIATION",
                    "status_color": "red",
                    "evaluation_metric": f"Compared to {peer_count} {sector} peers",
                    "fidelity_gap": f"Risk score is {variance:.1f} points worse than sector average",
                    "findings_count": int(variance)
                }
            elif variance > 0:
                return {
                    "status_label": "BELOW AVERAGE",
                    "status_color": "yellow",
                    "evaluation_metric": f"Compared to {peer_count} {sector} peers",
                    "fidelity_gap": f"Risk score is {variance:.1f} points worse than sector average",
                    "findings_count": int(variance)
                }
            else:
                return {
                    "status_label": "OUTPERFORMING",
                    "status_color": "green",
                    "evaluation_metric": f"Compared to {peer_count} {sector} peers",
                    "fidelity_gap": f"Risk score is {abs(variance):.1f} points better than sector average",
                    "findings_count": 0
                }
                
        except Exception as e:
            return {
                "status_label": "ERROR",
                "status_color": "red",
                "evaluation_metric": "Database error",
                "fidelity_gap": str(e),
                "findings_count": 0
            }
