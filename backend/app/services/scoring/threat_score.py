import json
from typing import List, Dict, Any
from collections import defaultdict

class ThreatScoringEngine:
    def __init__(self):
        pass

    def evaluate_clusters(self, clusters: List[Any]) -> Dict[str, Any]:
        risk_score = 1
        fired_rules = []
        
        # Aggregate counters for Negative Space analysis
        total_cases = 0
        asset_alert_counts = defaultdict(int)   # asset_ip -> alert count
        analyst_case_counts = defaultdict(int)   # analyst_id -> case count
        analyst_close_times = defaultdict(list)  # analyst_id -> [close_times]
        analyst_notes = defaultdict(list)        # analyst_id -> [resolution_notes]
        severity_counts = defaultdict(int)       # severity -> count
        escalated_count = 0
        critical_no_escalation = 0
        repeat_asset_alerts = defaultdict(set)   # asset_ip -> set(alert_types)
        
        for c in clusters:
            try:
                raw_data = json.loads(c.sample_raw)
            except:
                continue
                
            total_cases += c.count
            
            # ============================================================
            # SOC CASE MANAGEMENT RULES (Execution Gaps + Negative Space)
            # ============================================================
            if c.event_type == "SOC_CASE_RECORD":
                asset = raw_data.get("asset_ip", "")
                analyst = raw_data.get("analyst_id", "UNKNOWN")
                escalated = raw_data.get("escalated", "No")
                resolution = raw_data.get("resolution_notes", "")
                time_to_close = int(raw_data.get("time_to_close_mins", 60))
                alert_type = raw_data.get("alert_type", "")
                
                # Track aggregates
                asset_alert_counts[asset] += c.count
                analyst_case_counts[analyst] += c.count
                analyst_close_times[analyst].append(time_to_close)
                analyst_notes[analyst].append(resolution)
                severity_counts[c.severity] += c.count
                repeat_asset_alerts[asset].add(alert_type)
                
                if escalated == "Yes":
                    escalated_count += c.count
                
                # -----------------------------------------------------------
                # EXEC-GAP-01: High-severity alerts closed unusually quickly
                # Problem Statement Section 3A(ii): "Cases closed unusually quickly"
                # -----------------------------------------------------------
                if c.severity in ["High", "Critical"] and time_to_close < 5 and escalated == "No":
                    risk_score += 20 * c.count
                    fired_rules.append({
                        "rule": f"EXEC-GAP-01: Critical alert closed in <5 mins without escalation by {analyst}",
                        "impact": "Critical",
                        "evidence": f"Alert on {asset}, closed in {time_to_close}min"
                    })
                    
                # -----------------------------------------------------------
                # EXEC-GAP-02: Repetitive/template-driven investigation notes
                # Problem Statement Section 3A(iv): "Repetitive or template-driven investigations"
                # -----------------------------------------------------------
                if resolution in ["False positive, closed.", "No action required.", "Duplicate alert.", "Known issue, no action."]:
                    risk_score += 5 * c.count
                    fired_rules.append({
                        "rule": f"EXEC-GAP-02: Template-driven investigation by {analyst}",
                        "impact": "Medium",
                        "evidence": f"Resolution: '{resolution}'"
                    })
                    
                # -----------------------------------------------------------
                # EXEC-GAP-03: Critical alerts closed without escalation
                # Problem Statement Section 3A(iii): "Critical alerts closed without escalation"
                # -----------------------------------------------------------
                if c.severity == "Critical" and escalated == "No":
                    critical_no_escalation += c.count
                    risk_score += 15 * c.count
                    fired_rules.append({
                        "rule": f"EXEC-GAP-03: Critical alert on {asset} closed without escalation",
                        "impact": "Critical",
                        "evidence": f"Analyst: {analyst}, Time: {time_to_close}min"
                    })
                    
                # -----------------------------------------------------------
                # EXEC-GAP-04: Alerts acknowledged but not meaningfully investigated
                # Problem Statement Section 3A(i): "Alerts acknowledged but not meaningfully investigated"
                # -----------------------------------------------------------
                if c.severity in ["High", "Critical"] and time_to_close < 2 and len(resolution) < 30:
                    risk_score += 10 * c.count
                    fired_rules.append({
                        "rule": f"EXEC-GAP-04: Alert acknowledged but not meaningfully investigated",
                        "impact": "High",
                        "evidence": f"Analyst: {analyst}, Closed in {time_to_close}min, Notes: '{resolution[:50]}'"
                    })
                    
                # -----------------------------------------------------------
                # EXEC-GAP-05: Metric-gaming — closing cases just under SLA threshold
                # Problem Statement Section 3A(vi): "Operational behaviour designed to satisfy metrics"
                # -----------------------------------------------------------
                if 55 <= time_to_close <= 60 and c.severity in ["High", "Critical"]:
                    risk_score += 8 * c.count
                    fired_rules.append({
                        "rule": f"EXEC-GAP-05: SLA-gaming suspected — closed at exactly {time_to_close}min",
                        "impact": "Medium",
                        "evidence": f"Analyst: {analyst}, Asset: {asset}"
                    })
                    
            # ============================================================
            # NETWORK LOG RULES (Legacy — raw telemetry analysis)
            # ============================================================
            elif c.severity == "High":
                if "Blocked" in c.sample_raw:
                    risk_score += 0
                else:
                    risk_score += 15
                    fired_rules.append({
                        "rule": "NET-01: High severity network traffic permitted through",
                        "impact": "High",
                        "evidence": f"Source: {c.source_ips}, Dest: {c.dest_ip}"
                    })

        # ============================================================
        # AGGREGATE NEGATIVE SPACE RULES (post-loop analysis)
        # ============================================================
        
        # -----------------------------------------------------------
        # NEG-SPACE-01: Monitoring blind spot — critical assets with zero/low telemetry
        # Problem Statement Section 3B(i): "Missing telemetry from critical systems"
        # -----------------------------------------------------------
        if total_cases > 100:
            # Check if any known DB/critical assets have suspiciously low alerts
            critical_keywords = ["DB", "CORE", "SWIFT", "PAY", "AUTH"]
            for asset, count in asset_alert_counts.items():
                is_critical = any(kw in asset.upper() for kw in critical_keywords)
                if is_critical and count < 3:
                    risk_score += 30
                    fired_rules.append({
                        "rule": f"NEG-SPACE-01: Monitoring blind spot on critical asset {asset}",
                        "impact": "Critical",
                        "evidence": f"Only {count} alerts in entire audit window"
                    })
                    
        # -----------------------------------------------------------
        # NEG-SPACE-02: Absence of expected alert categories
        # Problem Statement Section 3B(ii): "Absence of expected alert categories"
        # -----------------------------------------------------------
        expected_severities = {"Low", "Medium", "High", "Critical"}
        missing_severities = expected_severities - set(severity_counts.keys())
        if total_cases > 50 and missing_severities:
            risk_score += 20
            fired_rules.append({
                "rule": f"NEG-SPACE-02: Missing alert severity categories: {', '.join(missing_severities)}",
                "impact": "High",
                "evidence": f"Only found: {', '.join(severity_counts.keys())}"
            })
            
        # -----------------------------------------------------------
        # NEG-SPACE-03: Unexpectedly low escalation rate
        # Problem Statement Section 3B(iii): "Missing investigations or escalation records"
        # -----------------------------------------------------------
        if total_cases > 50 and severity_counts.get("Critical", 0) > 0:
            escalation_rate = escalated_count / total_cases if total_cases > 0 else 0
            if escalation_rate < 0.05:
                risk_score += 25
                fired_rules.append({
                    "rule": f"NEG-SPACE-03: Abnormally low escalation rate ({escalation_rate*100:.1f}%)",
                    "impact": "Critical",
                    "evidence": f"{escalated_count}/{total_cases} cases escalated despite {severity_counts.get('Critical',0)} critical alerts"
                })
                
        # -----------------------------------------------------------
        # NEG-SPACE-04: Repeated alerts on same asset without root-cause remediation
        # Problem Statement Illustrative Use Case (ii)
        # -----------------------------------------------------------
        for asset, alert_types in repeat_asset_alerts.items():
            alert_count = asset_alert_counts.get(asset, 0)
            if alert_count > 10 and len(alert_types) <= 2:
                risk_score += 15
                fired_rules.append({
                    "rule": f"NEG-SPACE-04: Repeated alerts on {asset} without root-cause remediation",
                    "impact": "High",
                    "evidence": f"{alert_count} alerts, only {len(alert_types)} unique types: {', '.join(alert_types)}"
                })

        # -----------------------------------------------------------
        # EXEC-GAP-06: Single analyst handling disproportionate workload
        # Problem Statement Illustrative Use Case (ix): "Workloads inconsistent with expected activity"
        # -----------------------------------------------------------
        if len(analyst_case_counts) > 1:
            avg_cases = sum(analyst_case_counts.values()) / len(analyst_case_counts)
            for analyst, count in analyst_case_counts.items():
                if count > avg_cases * 3 and count > 20:
                    risk_score += 10
                    fired_rules.append({
                        "rule": f"EXEC-GAP-06: Analyst {analyst} handling {count} cases (avg: {avg_cases:.0f})",
                        "impact": "Medium",
                        "evidence": f"Possible understaffing or auto-closure bot"
                    })
                    
        return {
            "risk_score": min(risk_score, 99),
            "fired_rules": fired_rules
        }
