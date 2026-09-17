# SAT-SA: System Architecture

The **Supervisory Analytics Tool for SOC Assessment (SAT-SA)** is designed as a completely air-gapped, container-ready intelligence platform for the NCIIPC.

## 🏗️ High-Level Architecture

The system is decoupled into three primary tiers:

1. **Frontend (Presentation & Supervisory UI)**
2. **Backend (API & Orchestration)**
3. **Data & Intelligence (Ingestion, Deduplication, & AI)**

---

### 1. Frontend: React + Vite + Tailwind
*   **Purpose:** Provides a high-density, command-center interface for NCIIPC supervisors to triage incidents, view operational negative-space signals, and interact with the AI Threat Copilot.
*   **Key Components:**
    *   **Triage Dashboard:** Renders data tables and KPI metrics (built from Stitch exports).
    *   **Forensic Split-Screen:** Displays normalized telemetry next to original SOC tickets and the AI chat interface.
    *   **State Management:** React Context / Hooks to manage local state without external dependencies.

### 2. Backend: FastAPI (Python)
*   **Purpose:** The central nervous system. It exposes RESTful endpoints for the frontend and handles asynchronous data ingestion.
*   **Key Endpoints:**
    *   `POST /api/v1/ingest`: Accepts massive zip files (raw logs & PDFs) from the frontend.
    *   `GET /api/v1/assessments/{cse_id}`: Returns the scored evaluation and prioritized alert queue for a specific entity.
    *   `POST /api/v1/copilot/query`: Receives natural language questions and streams back LLM answers.
*   **Security:** 100% offline. No external API calls are made.

### 3. Data & Intelligence Engine
This is the core differentiator of SAT-SA, executing the heavy lifting of the NCIIPC mandate.

*   **A. Log Normalizer (`log_parser.py`)**
    *   Ingests heterogeneous logs (Cisco, Fortinet, Splunk CSVs, Syslog) and maps them to a Unified Schema (timestamp, source_ip, dest_ip, event_type).
*   **B. SimHash Deduplication Engine**
    *   Solves "Alert Fatigue". Applies a 64-bit structural hash to log payloads. Collapses 100,000 repetitive, noisy firewall pings into a single "Incident Cluster" to save memory and human review time.
*   **C. Vector Database (ChromaDB + SQLite FTS5)**
    *   **FTS5:** Handles fast, exact-match keyword searches (e.g., searching for a specific IP or CVE).
    *   **ChromaDB:** Handles semantic dense-vector embeddings for threat hunting (e.g., "Find logs related to lateral movement").
*   **D. Local LLM (Ollama / Llama 3.1)**
    *   Acts as the **Threat Copilot**. Uses Retrieval-Augmented Generation (RAG) to read the normalized logs and SOC tickets, detecting operational weaknesses (e.g., tickets closed too early, ignored exfiltration).

---

## 🌊 Data Flow Diagram

1. **(Ingest)**: NCIIPC Officer uploads `mumbai_port_logs.zip` $\rightarrow$ FastAPI.
2. **(Normalize)**: FastAPI sends raw logs to `log_parser.py` $\rightarrow$ Unified JSON.
3. **(Deduplicate)**: JSON flows through SimHash $\rightarrow$ 99% volume reduction.
4. **(Store & Score)**: Clean logs are stored in ChromaDB/SQLite. AI scripts assign a "Priority Score" (1-99).
5. **(Present)**: React Frontend fetches the Top 10 Critical Incidents and renders the Triage Dashboard.
6. **(Investigate)**: Officer uses the LLM Copilot to interrogate the logs.
