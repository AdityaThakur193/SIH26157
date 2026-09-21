<div align="center">

# 🛡️ SAT-SA: Supervisory Analytics Tool for SOC Assessment
### **Air-Gapped Telemetry Verification & Supervisory Intelligence Platform**
*Problem Statement ID: **SIH26157** • Sponsoring Agency: **NTRO / NCIIPC***

[![Air-Gapped Compliance](https://img.shields.io/badge/Air--Gapped-100%25%20Offline-emerald?style=flat-square&logo=shield)](https://github.com/AdityaThakur193/SIH26157)
[![Python Version](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0%2B-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Local LLM](https://img.shields.io/badge/Ollama-Llama--3.1--8B-purple?style=flat-square&logo=ollama)](https://ollama.com)

**Source Code Repository:** [https://github.com/AdityaThakur193/SIH26157](https://github.com/AdityaThakur193/SIH26157)

</div>

---

## 📌 Project Overview
**SAT-SA** is a 100% offline, air-gapped supervisory intelligence platform designed for the National Critical Information Infrastructure Protection Centre (NCIIPC) to rigorously evaluate the cybersecurity readiness of Critical Sector Entities (CSEs) such as Banks, Telecoms, and Power Grids.

Instead of subjective, questionnaire-based audits, SAT-SA:
1. Ingests raw, heterogeneous enterprise SOC telemetry (Syslog, CSV, JSON firewall/IDS logs).
2. Compresses millions of noisy logs into distinct incident patterns using an **$\mathcal{O}(N)$ 64-bit SimHash clustering algorithm** (>95% alert fatigue reduction).
3. Mathematically scores entities across **six statutory dimensions**: *Threat Analytics, Anomaly Spikes, Compliance Posture, Peer Variance, Asset Exposure,* and *Alert Fidelity*.
4. Maintains an immutable **SHA-256 cryptographic chain of custody** in a local SQLite ledger for court-admissible forensic evidence.
5. Provides an on-premise **LLaMA 3.1 Threat Copilot** for natural language investigation with **zero cloud data leakage**.

---

## ⚙️ System Architecture & Tech Stack

| Layer | Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts | Supervisory command dashboard, 6-dimension radar graphs, dual-pane forensic unmasking |
| **Backend & API** | Python 3.9+, FastAPI, Uvicorn, Pydantic | RESTful orchestration (`/api/v1/ingest`, `/api/v1/assessments`, `/api/v1/copilot`) |
| **Deduplication & Cryptography** | 64-bit SimHash, SHA-256 Digest Engine | Real-time log clustering, deduplication, tamper-evident evidence hashing |
| **Storage & Retrieval** | SQLite3 (FTS5 full-text search), ChromaDB | Local hybrid relational ledger and semantic vector store |
| **Air-Gapped AI** | Ollama, Meta LLaMA 3.1 (8B) | Offline RAG-based threat queries, ISMS compliance evaluation against NCIIPC controls |

---

## 🚀 Setup & Installation Instructions

Because SAT-SA is designed for **air-gapped** environments, it operates completely offline without external APIs.

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.9+)
3. **[Ollama](https://ollama.com/)** installed on your workstation.

---

### Step 1: Initialize Local AI Models
Open a terminal and pull the local LLM model:
```bash
ollama pull llama3.1:8b
```
*(Optional: If using semantic embedding fallback, run `ollama pull all-minilm:latest`)*

---

### Step 2: One-Click Launch (Recommended for Windows)
Simply double-click or run:
```cmd
run_sat_sa.bat
```
*This concurrently starts the Ollama daemon, the FastAPI backend (port 8000), and the Vite frontend (port 5173) in separate windows.*

---

### Alternative: Manual Step-by-Step Launch

#### 1. Start Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Windows activate:
venv\Scripts\activate
# Linux/macOS activate:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```
*Backend runs at `http://localhost:8000` (Interactive API docs at `http://localhost:8000/docs`).*

#### 2. Start Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
*Frontend dashboard runs at `http://localhost:5173`.*

---

## 🔐 Demo Credentials (Enclave Personas)

The platform includes role-based access control with pre-configured auditor credentials:

| Officer ID | Passcode | Role | Access Level |
| :--- | :--- | :--- | :--- |
| **`SHARMA-994`** | `Alpha-Secure-901` | Auditor - Supervisory Lead | Full Assessment & Ingestion Access |
| **`ROOT-SEC-01`** | `Node-Admin-004` | System Administrator | Platform Configuration & Enclave Management |
| **`DIR-GEN-07`** | `NCIIPC-Exec-77` | NCIIPC Director / General Counsel | Executive Overview & Legal Sign-off |

*(Tip: On the login screen, clicking any of the Quick-Fill persona cards will populate the credentials automatically).*

---

## 📖 Quick Evaluation & Demo Walkthrough

1. **Authenticate Enclave:** Navigate to `http://localhost:5173` and click the **Auditor Persona** (`SHARMA-994`).
2. **Ingest Evidence:**
   * Go to **Data Ingestion** in the sidebar.
   * Click **Browse Folders** or drag & drop the included `NCIIPC_DEMO_DATA` directory.
   * Enter Entity Name: `State Bank of India (SBI)` and Sector: `Banking, Financial Services & Insurance (BFSI)`.
   * Click **Execute Ingestion Pipeline**. Watch the system compute SHA-256 hashes and SimHash clusters in real time.
3. **Inspect Entity Dossier:**
   * Open the **Assessments** view and select the evaluated entity.
   * Review the **6-Dimension Spider Chart** and the mathematical breakdown of Anomaly Spikes and Threat Severity.
4. **Dual-Pane Forensic Audit:**
   * Click **Forensic Audit** on any clustered finding.
   * Inspect the aggregated incident pattern on the left, and toggle the raw, unmasked JSON telemetry on the right to verify zero evidence loss.
5. **Ask AI Threat Copilot:**
   * Open the **AI Threat Copilot** tab.
   * Ask: *"Analyze the anomalous database access and explain the potential breach vector."*
   * Observe LLaMA 3.1 generate a grounded, hallucination-free response citing specific cluster fingerprints.

---

## 📂 Repository Structure

```
SAT-SA/
├── ARCHITECTURE.md          # 2-Page System Architecture & Design Specification
├── README.md                # Submission Overview & Setup Guide
├── run_sat_sa.bat           # 1-Click Multi-Process Launcher
├── NCIIPC_DEMO_DATA/        # Synthetic 15,000+ line SOC evaluation telemetry
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic schemas for logs, scores, and dossiers
│   │   ├── routers/         # /ingest, /assessments, /copilot endpoints
│   │   └── services/        # SimHash, SHA-256 verifier, LLaMA Copilot, 6 scoring engines
│   ├── main.py              # FastAPI server entry point & CORS configuration
│   └── requirements.txt     # Python backend dependencies
└── frontend/
    ├── src/
    │   ├── components/      # UI widgets, layout navigation, metrics badges
    │   ├── pages/           # Overview, Evidence Locker, Dossier, Copilot, Findings
    │   └── App.tsx          # Session auth & routing orchestration
    ├── package.json
    └── vite.config.ts
```

---
*Developed by Team RAGForge (GITAM129) for Smart India Hackathon (SIH 2026)*