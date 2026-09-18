# AGENT.MD - SAT-SA Frontend & Integration Guide

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
└── frontend/                 <-- Next.js / React Application
    └── stitch_exports/       <-- HTML/Tailwind design blueprints for Screens 1 to 6
        ├── screen_1.html     <-- Secure Boot & Login
        ├── screen_2.html     <-- Evidence Locker (Upload Modal)
        ├── screen_3.html     <-- Verification Terminal (Loading state)
        ├── screen_4.html     <-- Supervisory Assessment Overview (National Dashboard)
        ├── screen_5.html     <-- CSE Assessment Overview (Alpha Bank Dossier)
        └── screen_6.html     <-- Deep Dive & AI Threat Copilot (3-Column Split View)
```

---

## ⚡ How to Run Backend Locally
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend Swagger Docs available at `http://localhost:8000/docs`.

---

## 🎨 Kaushik's Frontend Integration Guide

### 1. Convert HTML Designs to Next.js / React
- Use `frontend/stitch_exports/screen_1.html` through `screen_6.html` as the visual and layout blueprint.
- Build clean Next.js/React components (`Login.tsx`, `EvidenceLocker.tsx`, `TerminalLoading.tsx`, `NationalOverview.tsx`, `AlphaBankOverview.tsx`, `DeepDiveCopilot.tsx`).
- Use Lucide-React or Material Symbols Outlined icons.

### 2. Screen Navigation State Flow
Manage screen transitions via state/router:
`Login (Screen 1)` $\rightarrow$ `Evidence Upload (Screen 2)` $\rightarrow$ `Terminal Loading (Screen 3)` $\rightarrow$ `National Dashboard (Screen 4)` $\rightarrow$ `Alpha Bank Dossier (Screen 5)` $\rightarrow$ `Deep Dive Copilot (Screen 6)`.

---

## 🔌 API Integration Contracts (`http://localhost:8000/api/v1`)

### A. National Overview Dashboard (Screen 4)
- **HTTP Method:** `GET`
- **Endpoint:** `http://localhost:8000/api/v1/assessments/overview`
- **JSON Response:**
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

### B. Alpha Bank Detailed Dossier (Screen 5)
- **HTTP Method:** `GET`
- **Endpoint:** `http://localhost:8000/api/v1/assessments/CSE-FIN-0091`
- **JSON Response:**
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

### C. Evidence Upload / Ingestion (Screen 2 & 3)
- **HTTP Method:** `POST`
- **Endpoint:** `http://localhost:8000/api/v1/ingest`
- **Body:** `multipart/form-data` (`entity_name`: `"Mumbai Port Trust"`, `file`: Uploaded file)
- **JSON Response:**
```json
{
  "case_id": "CASE-2026-NCIIPC-09",
  "entity_name": "Mumbai Port Trust",
  "file_name": "logs.zip",
  "sha256_hash": "7f4c...91a0",
  "total_raw_logs": 3240512,
  "deduplicated_clusters": 1200,
  "status": "SUCCESS_COMMITTED_TO_LEDGER"
}
```

### D. AI Threat Copilot Chat Sidebar (Screen 6)
- **HTTP Method:** `POST`
- **Endpoint:** `http://localhost:8000/api/v1/copilot/query`
- **Request Body:** `{"query": "Look at Jira Ticket #4402. Did the SOC handle this correctly?"}`
- **JSON Response:**
```json
{
  "query": "Look at Jira Ticket #4402. Did the SOC handle this correctly?",
  "answer": "No. The SOC analyst closed ticket #4402 in 4 minutes without noticing 2.1GB data exfiltration...",
  "findings_flagged": true,
  "evidence_sources": ["Cisco Firewall Log #85410", "Jira Ticket #4402"]
}
```

---

## 🛠️ TypeScript Service Helper Snippet (`src/services/api.ts`)
```typescript
const BASE_URL = "http://localhost:8000/api/v1";

export async function fetchNationalOverview() {
  const res = await fetch(`${BASE_URL}/assessments/overview`);
  return res.json();
}

export async function fetchCSEDetail(cseId: string) {
  const res = await fetch(`${BASE_URL}/assessments/${cseId}`);
  return res.json();
}

export async function askCopilot(queryText: string) {
  const res = await fetch(`${BASE_URL}/copilot/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: queryText })
  });
  return res.json();
}
```
