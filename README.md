<div align="center">

# 🛡️ SAT-SA: Supervisory Analytics Tool for SOC Assessment
### **Air-Gapped Telemetry Verification & Intelligence Platform**
*Problem Statement ID: **SIH26157** • Sponsoring Agency: **NTRO / NCIIPC***

[![Air-Gapped Compliance](https://img.shields.io/badge/Air--Gapped-100%25%20Offline-emerald?style=flat-square&logo=shield)](https://github.com/AdityaThakur193/SIH26157)
[![Python Version](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0%2B-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Local LLM](https://img.shields.io/badge/Ollama-Llama--3.1--8B-purple?style=flat-square&logo=ollama)](https://ollama.com)

</div>

---

## 📌 Project Overview
**SAT-SA** is a 100% offline, air-gapped supervisory intelligence platform built to evaluate the cybersecurity readiness of Critical Sector Entities (CSEs) such as Banks, Telecoms, and Power Grids. 

Instead of relying on subjective manual audits, SAT-SA ingests raw enterprise SOC telemetry, compresses noisy logs using **64-bit SimHash clustering** (>95% noise reduction), and mathematically benchmarks entity performance across **six statutory dimensions** (Threat Analytics, Anomaly Spikes, Compliance Posture, Peer Variance, Asset Exposure, and Alert Fidelity). It features an immutable **SHA-256 evidence ledger** and a local, on-premise **LLaMA 3.1 Threat Copilot** for natural language investigation with zero cloud data leakage.

---

## ⚙️ Tech Stack
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, GSAP (Animations), Recharts
* **Backend:** Python, FastAPI, Uvicorn, Pydantic
* **Database & Storage:** SQLite3 (Relational Ledger & FTS5), ChromaDB (Semantic Vector Store)
* **AI & Cryptography:** Ollama (LLaMA 3.1 8B), SimHash (Deduplication), SHA-256 (Chain of Custody)

---

## 🚀 Setup & Installation Instructions

Because this solution is designed for **air-gapped** SOC environments, it relies on local models. **You MUST have Ollama installed** and the correct models downloaded before running the server.

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.9+)
3. **[Ollama](https://ollama.com/)** installed and running on your machine.

### Step 1: Initialize the Local AI Models
Open a terminal and pull the required models into your local Ollama instance:
```bash
# Used for Copilot RAG Reasoning and NCIIPC Compliance Analysis
ollama pull llama3.1:8b

# Used by ChromaDB for 100% offline semantic vector search
ollama pull all-minilm:latest
```

### Step 2: Start the Backend (FastAPI)
Open a new terminal window:
```bash
cd backend
python -m venv venv
# Activate virtual environment (Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate)

pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```
*The backend API will now be running at `http://localhost:8000`. You can view the Swagger Docs at `http://localhost:8000/docs`.*

### Step 3: Start the Frontend (React)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The supervisory dashboard will now be running at `http://localhost:5173`.*

---

## 📖 Quick Demo Guide
1. Navigate to `http://localhost:5173` and click **Authenticate Enclave** (Auditor Persona).
2. Go to **Data Ingestion** (Evidence Locker) in the sidebar.
3. Click **Browse Folders** and select the provided `NCIIPC_DEMO_DATA` directory.
4. Watch the pipeline compute SHA-256 hashes and SimHash clusters in real-time.
5. Navigate to **Assessments**, open the newly evaluated CSE Dossier, and click **Forensic Audit** to unmask the raw JSON telemetry.
6. Open the **AI Threat Copilot** and ask: *"Explain the anomalies affecting the core database."*

---
*Developed by Team RAGForge (GITAM129) for SIH 2026*