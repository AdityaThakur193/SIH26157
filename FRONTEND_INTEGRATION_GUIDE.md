# SAT-SA Frontend Integration & Troubleshooting Guide

> **Authoritative Integration Spec for Kaushik**  
> Target: FastAPI Backend running on `http://localhost:8000` (or `http://172.19.98.25:8000` over LAN)  
> API Base: `http://localhost:8000/api/v1`

---

## ⚡ First Steps Before Writing Any Code

Follow these 4 steps in order before writing or modifying any React code:
1. **Pull the latest backend code:**
   ```bash
   git pull origin main
   ```
2. **Run the backend locally:**
   ```bash
   cd backend
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
3. **Open Swagger UI in your browser:** [http://localhost:8000/docs](http://localhost:8000/docs)
4. **Manually execute EVERY endpoint at least once:**
   Click "Try it out" $\rightarrow$ "Execute" on each route. Inspect the real JSON responses with your own eyes so you know the exact field names and types before wiring up components.
5. **Only after confirming Swagger returns 200 OK**, start connecting your React components.

---

## 📖 How To Use This Document

* **The Backend is the Single Source of Truth:**  
  The backend only returns pure JSON. Your job on the frontend is **strictly to display that data**. 
* **Never Write Scoring, Parsing, or AI Logic on the Frontend:**  
  Do not write custom deduplication logic, risk scoring algorithms, policy grading, or mock anomaly math in React. The backend engines handle all of this. Your components should just render `response.dimensions[]`, `response.entities[]`, and top-level numbers.
* **If Data Looks Wrong, Check Swagger First:**  
  If numbers look weird, charts don't render, or a screen shows an unexpected value, **do NOT assume your frontend code is broken**. Open [http://localhost:8000/docs](http://localhost:8000/docs), execute the exact same endpoint, and look at the raw backend response:
  - If Swagger returns the same weird number $\rightarrow$ It is a backend data/scoring issue, not your frontend. Flag it to Aditya.
  - If Swagger returns clean data but your UI breaks $\rightarrow$ It is a frontend binding/mapping bug.

---

## 📊 Verification Status Table

Here is the exact, confirmed status of every backend component as of right now. Do not assume unverified components are final:

| Endpoint / Dimension | Status | Notes for Kaushik |
| :--- | :--- | :--- |
| `GET /` | ✅ **Verified** | Returns node health, version, airgap status. |
| `GET /api/v1/assessments/overview` | ✅ **Verified** | Tested with real SQLite database; returns entity count, alerts, 350 findings, entities list. |
| `GET /api/v1/assessments/{cse_id}`<br>↳ **Dimension 1: Threat Analytics** | ✅ **Verified** | Stress-tested against 10 deliberate Execution Gap & Negative Space rules. |
| `GET /api/v1/assessments/{cse_id}`<br>↳ **Dimension 3: Compliance Posture** | ✅ **Verified** | Stress-tested with live Ollama positive & negative policy inputs. |
| `POST /api/v1/ingest` | ✅ **Verified** | Tested; hashes files with SHA-256, commits to SQLite ledger, deduplicates with SimHash. |
| `POST /api/v1/ingest/compliance` | ✅ **Verified** | Tested; evaluates ISMS policies offline via `llama3.1:8b`. |
| `POST /api/v1/copilot/query` | ✅ **Verified** *(with caveat)* | Verified with ChromaDB + Ollama. **Caveat:** Requires Ollama running locally. If Ollama is not started, it returns an error string (`"Error: Local LLM engine unreachable"`). **This is expected system behavior, not a frontend bug.** Render the error text cleanly in the chat. |
| `GET /api/v1/assessments/{cse_id}`<br>↳ **Dimension 2: Anomaly Metrics** | ⚠️ **Exists, Not Yet Stress-Tested** | Code exists and returns data, but temporal thresholds have not been stress-tested. Numbers may be unreliable. Build the UI to display the fields, but flag oddities instead of assuming frontend failure. |
| `GET /api/v1/assessments/{cse_id}`<br>↳ **Dimension 4: Peer Variance** | ⚠️ **Exists, Not Yet Stress-Tested** | Code exists and returns data; currently shows "Awaiting More Entities" because ledger has only 1 entity. Build UI for this state. |
| `GET /api/v1/assessments/{cse_id}`<br>↳ **Dimension 5: Asset Exposure** | ⚠️ **Exists, Not Yet Stress-Tested** | Code exists and returns data; keyword asset extraction has not been stress-tested. Display the fields as returned. |
| `GET /api/v1/assessments/{cse_id}`<br>↳ **Dimension 6: Alert Fidelity** | ⚠️ **Exists, Not Yet Stress-Tested** | Code exists and returns data; dual-dataset noise testing is pending. Display `status_label` and `fidelity_gap` as returned. |

---

## 🗺️ Screen-to-Endpoint Map (Stitch Screens 1 to 6)

Here is the authoritative mapping from the 6 Stitch UI screens (detailed in `AGENT.md`) to the backend API:

| Stitch Screen | Screen Name / Purpose | Backend API Endpoint Called | Notes for Frontend |
| :--- | :--- | :--- | :--- |
| **Screen 1** | **Secure Boot & Login** (`screen_1.html`) | **None** (Purely client-side) | No backend auth endpoint exists. Selecting a persona (Auditor/Admin/Director) simply stores the role/examiner in React state and navigates to Screen 4. |
| **Screen 2** | **Evidence Locker** (`screen_2.html`) | `POST /api/v1/ingest` | Upload modal. Submits `FormData` with `entity_name` and `file`. |
| **Screen 3** | **Verification Terminal** (`screen_3.html`) | **None** (Indeterminate UI State) | Active while awaiting `POST /api/v1/ingest`. Displays terminal steps (`Uploading` $\rightarrow$ `Hashing` $\rightarrow$ `Parsing` $\rightarrow$ `Deduplicating` $\rightarrow$ `Committing`). Once the request resolves `200 OK`, transitions to Verification Card showing the real hash. |
| **Screen 4** | **Supervisory Overview** (`screen_4.html`) | `GET /api/v1/assessments/overview` | National dashboard. Populates the 5 KPI cards, derived volume bars, and the Critical Sector Entities table. |
| **Screen 5** | **CSE Assessment Dossier** (`screen_5.html`) | `GET /api/v1/assessments/{cse_id}`<br>and `POST /api/v1/ingest/compliance` | Primary assessment view. Renders the top metrics and dynamically maps all 6 cards from `dimensions[]`. Policy upload triggers `POST /api/v1/ingest/compliance`. |
| **Screen 6** | **Deep Dive & Copilot** (`screen_6.html`) | `POST /api/v1/copilot/query` | 3-column split view. Chat prompt sends `{ "query": "..." }` and renders the answer plus source citations from `evidence_sources[]`. |

---

## 🔒 Why Login (Screen 1) and the Verification Terminal (Screen 3) Are Frontend-Only

It is important to state plainly that keeping Login and the Verification Terminal on the client side is a deliberate scoping decision for this hackathon demo, not a general claim about where authentication or telemetry belong. In a real-world enterprise production deployment, authentication, credential validation, and role-based access control must always live on the backend. That architectural instinct is fundamentally sound. However, that instinct does not apply to this specific project, because Problem Statement SIH26157 explicitly asks for a **supervisory analytics tool for SOC assessment**, not an Identity and Access Management (IAM) platform. Spending our limited hackathon development bandwidth building backend user authentication would solve a problem nobody asked us to solve, while adding zero points to our judging score.

Here is the exact technical reality for each of these two screens:

### 1. The Secure Boot & Login Screen (Screen 1)
* **No Real Security Is Being Bypassed:** In a prototype without a production Active Directory or LDAP server, a "real" backend authentication endpoint would just be a hardcoded `if (username == "SHARMA-994" && password == "...")` check in Python. Relocating that identical mock check from a React component to a FastAPI route does not make the application more secure or more authentic; it simply relocates the exact same static check to another file.
* **Avoidable Presentation Risk:** Introducing backend-driven token auth (such as JWTs, HTTP-only session cookies, or refresh tokens) introduces severe failure points during a live 5-minute hackathon evaluation. A token expiring mid-demo, a server restart clearing session state, or a subtle browser cookie/CORS rejection would crash the presentation over a feature that the judges never asked for.
* **How It Actually Works:** Selecting a preset persona (such as `SHARMA-994` for Auditor Lead or `ROOT-SEC-01` for Administrator) simply sets client-side session state in React and populates the active examiner name and clearance badge displayed across the rest of the application. No backend API call is required or expected.

### 2. The Verification Terminal Screen (Screen 3)
* **The Ingestion Pipeline Is Synchronous:** The ingestion endpoint (`POST /api/v1/ingest`) is a single, tested, synchronous HTTP request. When a file is uploaded, the backend completes the cryptographic SHA-256 hashing, log parsing, 64-bit SimHash deduplication, SQLite ledger commit, and ChromaDB vector indexing server-side in approximately 2 to 4 seconds, returning one unified JSON payload at the end.
* **No Streaming Infrastructure Exists:** There is no WebSocket server or Server-Sent Events (SSE) pipe implemented in the backend (and none was mandated by the problem statement). Consequently, the backend has no transport mechanism to stream line-by-line progress updates to the browser while processing is underway.
* **An Indeterminate Loading Animation Grounded in Real Data:** The terminal's visual sequence (`Uploading` $\rightarrow$ `Hashing` $\rightarrow$ `Parsing` $\rightarrow$ `Deduplicating` $\rightarrow$ `Committing`) is an indeterminate loading state designed to keep the user informed while the single real HTTP request is in flight. Once the backend completes its execution and responds with `200 OK`, the terminal must populate its final report with the **real returned values** (`response.sha256_hash`, `response.total_raw_logs`, `response.deduplicated_clusters`), rather than fabricated mock numbers. This ensures the user's final view is strictly grounded in genuine backend verification data even though the intermediate progress animation is a frontend simulation.

If a future production phase of this project requires multi-tenant user authentication or true real-time streaming of ingestion progress, both are legitimate backend capabilities to implement down the road — they are being deliberately deferred here to prioritize core supervisory analytics, not dismissed as wrong in principle.

---

## 1. Quick Verification: Is the Backend Reachable?

Before debugging your frontend, verify the backend is alive in your terminal or browser:

```bash
# 1. Test root health check
curl http://localhost:8000/
# Expected: {"status":"ACTIVE","node":"NCIIPC Air-Gapped Node #04","engine_version":"v4.2.1","airgap_mode":true}

# 2. Test national overview endpoint
curl http://localhost:8000/api/v1/assessments/overview
# Expected: 200 OK with {"active_entities":1,"alerts_analyzed":918,...}

# 3. Interactive Swagger UI:
# Open in browser: http://localhost:8000/docs
```

> ⚠️ **Multi-Laptop / Wi-Fi Note:**  
> If you are running the frontend on your laptop and Aditya is running the backend on his laptop, `localhost` will **not** connect. Change `localhost` to Aditya's Wi-Fi IP address:  
> `const API_BASE_URL = 'http://172.19.98.25:8000/api/v1';`

---

## 2. Fixing the "Automatic / Infinite Fetching" Issue

If your components are repeatedly fetching data automatically, spamming the backend, or freezing the UI, this is caused by one of three common React lifecycle traps. Here is the exact diagnosis and fix:

### Cause A: Missing or Incorrect `useEffect` Dependency Array
```typescript
// ❌ BROKEN: Missing dependency array — re-runs on EVERY single render/keystroke!
useEffect(() => {
  fetchOverview();
});

// ❌ BROKEN: Including the fetched state in the dependency array — creates an INFINITE LOOP!
const [data, setData] = useState(null);
useEffect(() => {
  fetchOverview().then(setData);
}, [data]); // Changing 'data' triggers the effect, which fetches, which changes 'data'...

// ✅ FIXED: Empty dependency array [] — runs ONCE on component mount only!
useEffect(() => {
  let isMounted = true;
  
  async function load() {
    try {
      const res = await getOverview();
      if (isMounted) setData(res);
    } catch (err) {
      if (isMounted) setError(err);
    }
  }

  load();
  return () => { isMounted = false; }; // Cleanup prevents state update on unmounted component
}, []);
```

### Cause B: React Query / SWR Auto-Refetch Defaults
If you are using `@tanstack/react-query` or `swr`, the default settings aggressively refetch automatically:
- On window focus (`refetchOnWindowFocus: true`)
- On network reconnect (`refetchOnReconnect: true`)
- Every time a component remounts with stale data (`staleTime: 0`)

**The Fix:** Disable automatic refetching and control it explicitly:
```typescript
// ✅ Disable automatic background refetching in React Query
const { data, isLoading, refetch } = useQuery({
  queryKey: ['overview'],
  queryFn: getOverview,
  refetchOnWindowFocus: false, // Prevents refetching every time you click back to the tab
  refetchOnReconnect: false,
  staleTime: Infinity,          // Never automatically mark data as stale
});
```

### Cause C: Manual Control Pattern (Recommended for Hackathon Demo)
If you want **total manual control** where data is ONLY fetched when a user enters the page or clicks a "Refresh / Run Evaluation" button:

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { getOverview } from '../services/api';
import { NationalOverviewResponse } from '../types/api';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<NationalOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Controlled fetch function
  const handleFetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOverview();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run ONCE on initial load only
  useEffect(() => {
    handleFetchData();
  }, [handleFetchData]);

  return (
    <div>
      {/* Manual Refresh Button */}
      <button 
        onClick={handleFetchData} 
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Evaluating...' : 'Run Evaluation / Refresh'}
      </button>

      {/* Render UI only when data exists */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mt-4">
          <MetricCard title="ACTIVE CSES" value={data.active_entities} />
          <MetricCard title="ALERTS ANALYSED" value={data.alerts_analyzed.toLocaleString()} />
          <MetricCard title="INCIDENT CLUSTERS" value={data.cases_analyzed.toLocaleString()} />
          <MetricCard title="SUPERVISORY FINDINGS" value={data.supervisory_findings} />
        </div>
      )}
    </div>
  );
};
```

---

## 3. Complete TypeScript Type Definitions (`src/types/api.ts`)

Create or update `src/types/api.ts` with these authoritative interfaces:

```typescript
// 1. Root System Health
export interface SystemHealth {
  status: string;         // "ACTIVE"
  node: string;           // "NCIIPC Air-Gapped Node #04"
  engine_version: string; // "v4.2.1"
  airgap_mode: boolean;   // true
}

// 2. National Overview Types
export interface CSESummary {
  id: string;             // e.g. "CASE-2026-ALP-09"
  name: string;           // e.g. "Alpha Bank Ltd"
  sector: string;         // e.g. "Banking & Financial"
  tier: string;           // e.g. "Scheduled"
  period: string;         // e.g. "September 2026"
  alerts_count: number;   // Raw alert count
  cases_count: number;    // Clustered cases
  attention_level: string;// "CRITICAL" | "HIGH ATTENTION" | "NOMINAL"
  key_concern: string;    // Summary of main concern
  review_status: string;  // "Pending" | "In Progress" | "Completed"
}

export interface NationalOverviewResponse {
  active_entities: number;      // Total registered entities
  alerts_analyzed: number;      // Total raw logs ingested
  cases_analyzed: number;       // Clustered incident cases
  supervisory_findings: number; // High-severity findings count
  priority_pool_cases: number;  // Review pool cases
  entities: CSESummary[];       // Array of entities for table
}

// 3. Individual CSE Assessment Types
export interface DimensionMetric {
  title: string;             // "1. Threat Analytics", "2. Anomaly Metrics", etc.
  status_label: string;      // e.g. "SCORE: 99/99", "CRITICAL SPIKE", "FAILING", "VERIFIED"
  status_color: 'red' | 'yellow' | 'green' | 'gray'; // Badge color
  evaluation_metric: string; // Evaluation description
  fidelity_gap: string;      // Detailed supervisory finding text
  domain_code: string;       // "DET-01", "ANM-02", "CMP-03", "PRV-04", "AST-05", "FID-06"
  findings_count: number;    // Numeric count of findings
}

export interface CSEDetailResponse {
  cse_id: string;
  cse_name: string;
  tier: string;
  audit_window: string;
  examiner: string;
  attention_level: string;
  alerts_ingested: number;
  cases_correlated: number;
  formal_investigations: number;
  escalations_logged: number;
  active_anomalies: number;
  peer_variance_index: string;
  manual_review_queue_count: number;
  dimensions: DimensionMetric[]; // Exactly 6 dimensions returned
}

// 4. Ingestion Responses
export interface IngestResponse {
  case_id: string;
  entity_name: string;
  file_name: string;
  sha256_hash: string;
  total_raw_logs: number;
  deduplicated_clusters: number;
  status: string; // "SUCCESS_COMMITTED_TO_LEDGER"
}

export interface ComplianceIngestResponse {
  cse_id: string;
  status_label: string;
  status_color: string;
  evaluation_metric: string;
  fidelity_gap: string;
  findings_count: number;
}

// 5. Threat Copilot Types
export interface CopilotRequest {
  query: string;
  case_id?: string;
}

export interface CopilotResponse {
  query: string;
  answer: string;
  findings_flagged: boolean;
  evidence_sources: string[];
}
```

---

## 4. Complete API Client Code (`src/services/api.ts`)

Replace `src/services/api.ts` with this typed client:

```typescript
import {
  SystemHealth,
  NationalOverviewResponse,
  CSEDetailResponse,
  IngestResponse,
  ComplianceIngestResponse,
  CopilotRequest,
  CopilotResponse
} from '../types/api';

// Configurable base URL
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_PREFIX = `${BASE_URL}/api/v1`;

// Generic fetch wrapper with error handling
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error [${res.status} ${res.statusText}]: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

// 1. System Health
export async function getSystemHealth(): Promise<SystemHealth> {
  return request<SystemHealth>(`${BASE_URL}/`);
}

// 2. National Overview Dashboard
export async function getOverview(): Promise<NationalOverviewResponse> {
  return request<NationalOverviewResponse>(`${API_PREFIX}/assessments/overview`);
}

// 3. Detailed CSE Assessment
export async function getAssessment(cseId: string, sector: string = 'General'): Promise<CSEDetailResponse> {
  const encodedId = encodeURIComponent(cseId);
  const encodedSector = encodeURIComponent(sector);
  return request<CSEDetailResponse>(`${API_PREFIX}/assessments/${encodedId}?sector=${encodedSector}`);
}

// 4. Ingest Evidence (CSV Log Upload)
export async function ingestEvidence(entityName: string, file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('entity_name', entityName);
  formData.append('file', file);

  // NOTE: Do NOT set 'Content-Type': 'multipart/form-data'. 
  // Let the browser set it automatically with the boundary parameter!
  return request<IngestResponse>(`${API_PREFIX}/ingest`, {
    method: 'POST',
    body: formData,
  });
}

// 5. Ingest Compliance Policy (ISMS Document)
export async function ingestCompliance(cseId: string, file: File): Promise<ComplianceIngestResponse> {
  const formData = new FormData();
  formData.append('cse_id', cseId);
  formData.append('file', file);

  return request<ComplianceIngestResponse>(`${API_PREFIX}/ingest/compliance`, {
    method: 'POST',
    body: formData,
  });
}

// 6. Threat Copilot Query
export async function askCopilot(payload: CopilotRequest): Promise<CopilotResponse> {
  return request<CopilotResponse>(`${API_PREFIX}/copilot/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
```

---

## 5. Critical Frontend Safety Rules (To Avoid Crashes)

### 1. Always Use Optional Chaining on Arrays
Never do:
```typescript
// ❌ Will crash if entities is undefined or loading:
data.entities.map(e => <Row key={e.id} entity={e} />)

// ✅ Always provide a fallback empty array:
(data?.entities ?? []).map(e => <Row key={e.id} entity={e} />)
```

### 2. File Upload Header Trap
When sending `FormData` via `fetch` or `axios`, **NEVER** manually set:
```typescript
headers: { 'Content-Type': 'multipart/form-data' } // ❌ BREAKS UPLOAD: Missing boundary!
```
Leave headers empty for `FormData`. The browser will automatically set `multipart/form-data; boundary=----WebKitFormBoundary...`.

### 3. Safe Derived Math Ratios
On the Overview page, Kaushik's spec defines safe derived metrics. Prevent division-by-zero errors:
```typescript
const totalAlerts = data?.alerts_analyzed || 1;
const totalCases = data?.cases_analyzed || 1;

// Ratios safely protected against division by zero:
const clusterIngestRatio = ((data?.cases_analyzed ?? 0) / totalAlerts) * 100;
const highSeverityPoolRatio = ((data?.priority_pool_cases ?? 0) / totalCases) * 100;
const findingRate = ((data?.supervisory_findings ?? 0) / totalCases) * 100;
```

### 4. Status Color Badge Mapping
The backend returns `status_color` as `"red" | "yellow" | "green" | "gray"`. Map them directly to Tailwind classes:
```typescript
export function getStatusBadgeClasses(color: string): string {
  switch (color) {
    case 'red':
      return 'bg-red-950/60 text-red-400 border border-red-800/60';
    case 'yellow':
      return 'bg-amber-950/60 text-amber-400 border border-amber-800/60';
    case 'green':
      return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60';
    default:
      return 'bg-slate-800/60 text-slate-400 border border-slate-700/60';
  }
}
```

---

## 6. Verification Checklist for Kaushik

| Check | Expected Result | Action if Failed |
| :--- | :--- | :--- |
| Open `http://localhost:8000/` | `{"status":"ACTIVE",...}` | Run `uvicorn main:app --host 0.0.0.0 --port 8000` in `backend/` |
| Click "Run Evaluation" | Fetches once, stops loading spinner | Check `useEffect` dependency array is `[]` |
| Top KPI: Supervisory Findings | Shows `350` (or real count) | Verify calling `/api/v1/assessments/overview` |
| Table: Entity click | Routes to `/assessments/CASE-2026-ALP-09` | Check `useNavigate()` passes `entity.id` |
| Six Dimension Cards | Renders all 6 cards dynamically from `dimensions[]` | Ensure using `dimensions.map(...)` |
| Evidence Upload | Returns `SUCCESS_COMMITTED_TO_LEDGER` | Ensure `FormData` has keys `entity_name` and `file` |
| Copilot Chat | Answers with citations and source tags | Ensure sending `{ query: "..." }` to `/api/v1/copilot/query` |

---

## 7. Verified Live Backend Responses (Raw Server Outputs)

These are verified, unedited raw outputs from the live backend with `llama3.1:8b` and ChromaDB running:

### A. Live Copilot Response (`POST /api/v1/copilot/query`)
**Request:**
```json
{
  "query": "Are there any template-driven investigations by SOC analysts?"
}
```
**Live Server Response (Direct from Ollama llama3.1:8b + ChromaDB):**
```json
{
  "query": "Are there any template-driven investigations by SOC analysts?",
  "answer": "**Template-driven investigations by SOC analysts have been observed, indicating a potential pattern of suspicious activity.**\n\nThe following findings suggest that SOC analysts may be following a template or procedure for certain types of alerts:\n\n* **Policy Violation (CASE-00881 and CASE-00154)**:\n\t+ Both cases involve Policy Violations at the same target IP address (10.0.3.20-PAYMENT-PROC).\n\t+ The payload includes similar fields, such as case_id, timestamp, analyst_id, severity, alert_type, asset_ip, escalated, time_to_close_mins, and resolution_notes.\n* **Malware Detection (CASE-00889)**:\n\t+ This case also involves a Malware Detection at the same target IP address (10.0.2.51-DB-CUSTOMER) as CASE-00873 and CASE-943206019218052207.\n\t+ The payload includes similar fields, such as case_id, timestamp, analyst_id, severity, alert_type, asset_ip, escalated, time_to_close_mins, and resolution_notes.\n\nThe presence of these similarities across multiple cases suggests that SOC analysts may be using a template or procedure for investigating certain types of alerts. This pattern warrants further investigation to determine the root cause and potential impact on the organization's security posture.\n\nCluster IDs cited:\n\n* Cluster 268889690327152453 (CASE-00881)\n* Cluster 1073940887036445979 (CASE-00154)\n* Cluster 943206019218052207 (CASE-00889)",
  "findings_flagged": true,
  "evidence_sources": [
    "268889690327152453",
    "989573010569596859",
    "633402211502903776",
    "1073940887036445979",
    "943206019218052207"
  ]
}
```

### B. Live National Overview Response (`GET /api/v1/assessments/overview`)
```json
{
  "active_entities": 1,
  "alerts_analyzed": 918,
  "cases_analyzed": 918,
  "supervisory_findings": 350,
  "priority_pool_cases": 350,
  "entities": [
    {
      "id": "CASE-2026-ALP-09",
      "name": "Alpha Bank Ltd",
      "sector": "Banking & Financial",
      "tier": "Scheduled",
      "period": "September 2026",
      "alerts_count": 918,
      "cases_count": 918,
      "attention_level": "CRITICAL",
      "key_concern": "Awaiting manual review",
      "review_status": "Pending"
    }
  ]
}
```
