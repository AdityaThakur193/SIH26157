# AGENT.MD - SAT-SA Frontend Development Context

## 📌 Project Overview
- **Project Name:** SAT-SA (Supervisory Analytics Tool for SOC Assessment)
- **Problem Statement ID:** SIH26157 (Sponsoring Agency: NTRO / NCIIPC)
- **Target User:** NCIIPC Lead Supervisors auditing Critical Sector Entities (CSEs) like Banks, Telecom, and Power Grids.
- **UI Theme:** Military-grade, air-gapped cybersecurity command center. Dark mode (`bg-[#0b1326]`), primary text (`text-[#adc6ff]`), warning (`text-[#d97706]`), critical (`text-[#ffb4ab]`), tertiary/success (`text-[#4edea3]`).

---

## 🏗️ Repository & Directory Structure
```text
E:\SAT-SA\
├── backend/                  <-- Python FastAPI API (Running at http://localhost:8000)
│   ├── main.py
│   └── app/
│       ├── models/schemas.py  <-- Pydantic JSON contracts
│       └── routers/
│           ├── assessments.py <-- GET /api/v1/assessments/overview, GET /api/v1/assessments/{cse_id}
│           ├── ingest.py      <-- POST /api/v1/ingest
│           └── copilot.py     <-- POST /api/v1/copilot/query
└── frontend/                 <-- React + Vite + Tailwind CSS Project
    └── stitch_exports/       <-- HTML/Tailwind exports for Screens 1 to 6
        ├── screen_1.html     <-- Secure Boot & Login
        ├── screen_2.html     <-- Evidence Locker (Upload Modal)
        ├── screen_3.html     <-- Verification Terminal (Loading state)
        ├── screen_4.html     <-- Supervisory Assessment Overview (National Dashboard)
        ├── screen_5.html     <-- CSE Assessment Overview (Alpha Bank Dossier)
        └── screen_6.html     <-- Deep Dive & AI Threat Copilot (3-Column Split View)
```

---

## 🎨 Kaushik's Frontend Objectives
1. **Convert HTML Exports to React Components:**
   - Transform `screen_1.html` through `screen_6.html` into clean, modular React components (`Login.tsx`, `EvidenceLocker.tsx`, `TerminalLoading.tsx`, `NationalOverview.tsx`, `AlphaBankOverview.tsx`, `DeepDiveCopilot.tsx`).
   - Use Lucide-React or Material Symbols Outlined icons.

2. **Connect to Backend API Endpoints:**
   - **National Overview:** Fetch from `GET http://localhost:8000/api/v1/assessments/overview`
   - **Alpha Bank Dossier:** Fetch from `GET http://localhost:8000/api/v1/assessments/CSE-FIN-0091`
   - **Evidence Ingest Upload:** Send file via `POST http://localhost:8000/api/v1/ingest`
   - **AI Threat Copilot Chat:** Send query payload via `POST http://localhost:8000/api/v1/copilot/query`

3. **Screen Navigation Flow:**
   - Implement state/tabs (`currentScreen` state: `login` $\rightarrow$ `locker` $\rightarrow$ `loading` $\rightarrow$ `overview` $\rightarrow$ `detail` $\rightarrow$ `copilot`) to demonstrate the live supervisor user journey seamlessly.

---

## 🔌 API Data Contracts (JSON Types)

### 1. National Overview (`GET /api/v1/assessments/overview`)
```json
{
  "active_entities": 18,
  "alerts_analyzed": 1428950,
  "cases_analyzed": 284120,
  "supervisory_findings": 64,
  "priority_pool_cases": 342,
  "entities": [
    {
      "id": "CSE-FIN-0091",
      "name": "Alpha Bank",
      "sector": "Banking & Financial",
      "tier": "Tier 1 Scheduled",
      "period": "Q2 2026",
      "alerts_count": 124832,
      "cases_count": 32481,
      "attention_level": "High attention",
      "key_concern": "Potential escalation weakness & rapid critical alert closure (38.8% < 5m)",
      "review_status": "In Progress (4/12)"
    }
  ]
}
```

### 2. Alpha Bank Dossier (`GET /api/v1/assessments/CSE-FIN-0091`)
```json
{
  "cse_id": "CSE-FIN-0091",
  "cse_name": "Alpha Bank",
  "tier": "TIER-1 CORE BANKING SYSTEM",
  "audit_window": "April 01, 2026 - June 30, 2026",
  "examiner": "R. Varma (Lead Supervisor, NCIIPC)",
  "attention_level": "HIGH ATTENTION",
  "alerts_ingested": 124832,
  "cases_correlated": 32481,
  "formal_investigations": 28923,
  "escalations_logged": 4192,
  "active_anomalies": 21,
  "peer_variance_index": "+27.4%",
  "manual_review_queue_count": 43,
  "dimensions": [
    {
      "title": "1. Detection",
      "status_label": "ELEVATED SIGNALS (4)",
      "status_color": "red",
      "evaluation_metric": "124.8k alerts evaluated against dynamic enterprise asset mapping registry.",
      "fidelity_gap": "46%",
      "domain_code": "DET-01",
      "findings_count": 4
    }
  ]
}
```

### 3. Copilot Chat (`POST /api/v1/copilot/query`)
- **Request:** `{"query": "Look at Jira Ticket #4402. Did the SOC handle this correctly?"}`
- **Response:**
```json
{
  "query": "Look at Jira Ticket #4402. Did the SOC handle this correctly?",
  "answer": "No. The SOC analyst closed Jira Ticket #4402 in 4 minutes citing 'False Positive', without noticing the subsequent 2.1GB outbound data transfer to hostile IP 185.15.22.1 that occurred 15 minutes post-compromise.",
  "findings_flagged": true,
  "evidence_sources": ["Cisco Firewall Log #85410", "Jira Ticket #4402", "SimHash Alert Cluster #12"]
}
```
