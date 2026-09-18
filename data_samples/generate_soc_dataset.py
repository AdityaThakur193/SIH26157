"""
Generates a realistic SOC Case Management dataset with deliberately planted
Execution Gaps and Negative Space patterns for NCIIPC SAT-SA validation.

This is NOT mock data for the backend — it is a test dataset that simulates
what a real CSE would submit to NCIIPC for supervisory review.
"""
import csv
import random
from datetime import datetime, timedelta

random.seed(42)

OUTPUT_FILE = "data_samples/soc_case_management.csv"

ANALYSTS = ["SOC-A01", "SOC-A02", "SOC-A03", "SOC-A04", "SOC-A05"]
SEVERITIES = ["Low", "Medium", "High", "Critical"]
ALERT_TYPES = [
    "Brute Force Attempt", "Malware Detection", "Data Exfiltration",
    "Privilege Escalation", "Lateral Movement", "Phishing Email",
    "Unauthorized Access", "Policy Violation", "DDoS Indicator",
    "Anomalous Login"
]

# Critical infrastructure assets (some will be blind spots)
ASSETS = [
    "10.0.1.10-WEBSERVER",
    "10.0.1.20-APPSERVER",
    "10.0.2.50-DB-CORE-BANKING",
    "10.0.2.51-DB-CUSTOMER",
    "10.0.3.10-SWIFT-GATEWAY",
    "10.0.3.20-PAYMENT-PROC",
    "10.0.4.10-AUTH-SERVER",
    "10.0.5.10-EMAIL-GW",
    "10.0.5.20-VPN-ENDPOINT",
    "10.0.6.10-WORKSTATION-POOL",
]

LEGITIMATE_NOTES = [
    "Investigated source IP. Confirmed malicious. Blocked at firewall and notified asset owner.",
    "Correlated with threat intel feed. IOC confirmed. Endpoint isolated and reimaged.",
    "Reviewed packet capture. Confirmed false positive due to scheduled backup job.",
    "Escalated to incident response team. Containment actions initiated.",
    "Traced lateral movement path. Three additional hosts identified. Full sweep initiated.",
    "Verified phishing payload in sandbox. User credentials rotated. Awareness alert sent.",
    "Analyzed authentication logs. Confirmed brute force from known botnet. IP range blocked.",
    "Cross-referenced with SIEM correlation rule. Confirmed policy violation. HR notified.",
]

TEMPLATE_NOTES = [
    "False positive, closed.",
    "No action required.",
    "Duplicate alert.",
    "Known issue, no action.",
]

rows = []
start_date = datetime(2026, 7, 1)
case_counter = 1

# ====================================================================
# PHASE 1: Generate 800 NORMAL cases (legitimate SOC operations)
# ====================================================================
for i in range(800):
    ts = start_date + timedelta(
        days=random.randint(0, 89),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )
    severity = random.choices(SEVERITIES, weights=[40, 30, 20, 10])[0]
    asset = random.choice(ASSETS[:2] + ASSETS[5:])  # Avoid critical DB/SWIFT assets
    analyst = random.choice(ANALYSTS[:4])  # Normal analysts
    
    if severity in ["High", "Critical"]:
        time_to_close = random.randint(30, 240)
        escalated = random.choice(["Yes", "Yes", "No"])
    else:
        time_to_close = random.randint(10, 120)
        escalated = "No"
    
    rows.append({
        "case_id": f"CASE-{case_counter:05d}",
        "timestamp": ts.isoformat(),
        "analyst_id": analyst,
        "severity": severity,
        "alert_type": random.choice(ALERT_TYPES),
        "asset_ip": asset,
        "escalated": escalated,
        "time_to_close_mins": time_to_close,
        "resolution_notes": random.choice(LEGITIMATE_NOTES),
    })
    case_counter += 1

# ====================================================================
# PHASE 2: Plant EXECUTION GAP cases
# ====================================================================

# GAP 1: 40 Critical alerts closed in <5 minutes without escalation (SOC-A05 is the bad analyst)
for i in range(40):
    ts = start_date + timedelta(days=random.randint(0, 89), hours=random.randint(0, 23))
    rows.append({
        "case_id": f"CASE-{case_counter:05d}",
        "timestamp": ts.isoformat(),
        "analyst_id": "SOC-A05",
        "severity": random.choice(["High", "Critical"]),
        "alert_type": random.choice(ALERT_TYPES),
        "asset_ip": random.choice(ASSETS),
        "escalated": "No",
        "time_to_close_mins": random.randint(1, 4),
        "resolution_notes": random.choice(TEMPLATE_NOTES),
    })
    case_counter += 1

# GAP 2: 30 Cases with copy-paste template notes from SOC-A05
for i in range(30):
    ts = start_date + timedelta(days=random.randint(0, 89), hours=random.randint(0, 23))
    rows.append({
        "case_id": f"CASE-{case_counter:05d}",
        "timestamp": ts.isoformat(),
        "analyst_id": "SOC-A05",
        "severity": random.choice(["Medium", "High"]),
        "alert_type": random.choice(ALERT_TYPES),
        "asset_ip": random.choice(ASSETS),
        "escalated": "No",
        "time_to_close_mins": random.randint(1, 10),
        "resolution_notes": random.choice(TEMPLATE_NOTES),
    })
    case_counter += 1

# GAP 3: 20 Cases where closure time is suspiciously close to 60-min SLA
for i in range(20):
    ts = start_date + timedelta(days=random.randint(0, 89), hours=random.randint(0, 23))
    rows.append({
        "case_id": f"CASE-{case_counter:05d}",
        "timestamp": ts.isoformat(),
        "analyst_id": random.choice(ANALYSTS[:3]),
        "severity": random.choice(["High", "Critical"]),
        "alert_type": random.choice(ALERT_TYPES),
        "asset_ip": random.choice(ASSETS),
        "escalated": "No",
        "time_to_close_mins": random.choice([55, 56, 57, 58, 59, 60]),
        "resolution_notes": "Investigated within SLA. Closed.",
    })
    case_counter += 1

# GAP 4: 25 Repeated alerts on same asset without remediation (Brute Force on AUTH-SERVER)
for i in range(25):
    ts = start_date + timedelta(days=random.randint(0, 89), hours=random.randint(0, 23))
    rows.append({
        "case_id": f"CASE-{case_counter:05d}",
        "timestamp": ts.isoformat(),
        "analyst_id": random.choice(ANALYSTS[:3]),
        "severity": "High",
        "alert_type": "Brute Force Attempt",
        "asset_ip": "10.0.4.10-AUTH-SERVER",
        "escalated": "No",
        "time_to_close_mins": random.randint(15, 45),
        "resolution_notes": "Blocked source IP. Alert closed.",
    })
    case_counter += 1

# ====================================================================
# PHASE 3: NEGATIVE SPACE — Critical assets with ZERO or near-zero alerts
# ====================================================================
# Note: We deliberately do NOT generate alerts for:
#   - 10.0.2.50-DB-CORE-BANKING (only 1 alert)
#   - 10.0.2.51-DB-CUSTOMER (0 alerts)
#   - 10.0.3.10-SWIFT-GATEWAY (only 2 alerts)
#   - 10.0.3.20-PAYMENT-PROC (0 alerts)
# This creates the "negative space" — these critical assets should be generating
# alerts but aren't, indicating a monitoring blind spot.

# Add just 1 token alert for DB-CORE-BANKING so it appears in the data
rows.append({
    "case_id": f"CASE-{case_counter:05d}",
    "timestamp": (start_date + timedelta(days=45)).isoformat(),
    "analyst_id": "SOC-A01",
    "severity": "Low",
    "alert_type": "Policy Violation",
    "asset_ip": "10.0.2.50-DB-CORE-BANKING",
    "escalated": "No",
    "time_to_close_mins": 30,
    "resolution_notes": "Routine policy check. No issues found.",
})
case_counter += 1

# Add 2 token alerts for SWIFT-GATEWAY
for i in range(2):
    rows.append({
        "case_id": f"CASE-{case_counter:05d}",
        "timestamp": (start_date + timedelta(days=20+i*30)).isoformat(),
        "analyst_id": "SOC-A02",
        "severity": "Low",
        "alert_type": "Anomalous Login",
        "asset_ip": "10.0.3.10-SWIFT-GATEWAY",
        "escalated": "No",
        "time_to_close_mins": 25,
        "resolution_notes": "Checked login records. Authorized user.",
    })
    case_counter += 1

# ====================================================================
# Shuffle and write
# ====================================================================
random.shuffle(rows)

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "case_id", "timestamp", "analyst_id", "severity", "alert_type",
        "asset_ip", "escalated", "time_to_close_mins", "resolution_notes"
    ])
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} SOC case records to {OUTPUT_FILE}")
print(f"  Normal cases: 800")
print(f"  Execution Gap cases: 115")
print(f"  Negative Space tokens: 3")
print(f"  Total: {len(rows)}")
