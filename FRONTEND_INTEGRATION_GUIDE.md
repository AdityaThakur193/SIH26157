# SAT-SA Frontend Integration & Troubleshooting Guide

> **Authoritative Integration Spec for Kaushik**  
> Target: FastAPI Backend running on `http://localhost:8000` (or `http://172.19.98.25:8000` over LAN)  
> API Base: `http://localhost:8000/api/v1`

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
