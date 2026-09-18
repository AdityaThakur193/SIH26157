import csv
import random
from datetime import datetime, timedelta

# NCIIPC Problem Statement Examples:
# - High-severity alerts closed unusually quickly.
# - Critical alerts closed without appropriate escalation.
# - Repetitive investigation patterns suggesting superficial review.

assets = ["10.0.1.5 (Web)", "10.0.1.12 (DB)", "10.0.2.50 (UserVLAN)", "10.0.3.10 (Mail)"]
analysts = ["Analyst_A", "Analyst_B", "Analyst_C"]
resolutions_lazy = ["Closed as false positive.", "No action needed.", "Routine traffic."]
resolutions_good = ["Investigated payload, blocked IP.", "Escalated to Tier 2.", "Isolated host and scanned."]

def generate_cases(num_cases=500):
    cases = []
    base_time = datetime(2026, 9, 1)
    
    for i in range(num_cases):
        asset = random.choice(assets)
        # Negative space: Make the DB asset have almost zero alerts to trigger blind spot detection
        if "DB" in asset and random.random() > 0.05:
            asset = "10.0.1.5 (Web)"
            
        severity = random.choices(["Low", "Medium", "High", "Critical"], weights=[0.5, 0.3, 0.15, 0.05])[0]
        analyst = random.choice(analysts)
        
        # Execution Gap 1: Analyst B closes Critical/High alerts instantly
        if analyst == "Analyst_B" and severity in ["High", "Critical"]:
            time_to_close = random.randint(1, 4) # unusually quick
            escalated = "No"
            resolution = random.choice(resolutions_lazy)
        # Execution Gap 2: Analyst C uses repetitive templates
        elif analyst == "Analyst_C":
            time_to_close = random.randint(10, 60)
            escalated = "No"
            resolution = "False positive, closed." # Repetitive pattern
        else:
            time_to_close = random.randint(15, 120)
            escalated = "Yes" if severity in ["High", "Critical"] else "No"
            resolution = random.choice(resolutions_good)
            
        timestamp = base_time + timedelta(hours=i*2)
        
        cases.append({
            "timestamp": timestamp.isoformat(),
            "case_id": f"SOC-CASE-{1000+i}",
            "asset_ip": asset,
            "severity": severity,
            "analyst_id": analyst,
            "time_to_close_mins": time_to_close,
            "escalated": escalated,
            "resolution_notes": resolution
        })
        
    with open("data_samples/soc_cases_mock.csv", "w", newline='') as f:
        writer = csv.DictWriter(f, fieldnames=cases[0].keys())
        writer.writeheader()
        writer.writerows(cases)

generate_cases()
print("Generated soc_cases_mock.csv")
