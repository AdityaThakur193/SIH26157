import {
  SystemHealth,
  NationalOverviewResponse,
  CSEDetailResponse,
  IngestResponse,
  ComplianceIngestResponse,
  CopilotRequest,
  CopilotResponse
} from '../types/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_PREFIX = `${BASE_URL}/api/v1`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorBody}`);
  }
  return res.json() as Promise<T>;
}

// 1. System Health (GET /)
export async function getSystemHealth(): Promise<SystemHealth> {
  return request<SystemHealth>(`${BASE_URL}/`);
}

// 2. National Overview Dashboard (GET /api/v1/assessments/overview)
export async function getOverview(): Promise<NationalOverviewResponse> {
  return request<NationalOverviewResponse>(`${API_PREFIX}/assessments/overview`);
}

// 3. Individual CSE Assessment (GET /api/v1/assessments/{cse_id})
export async function getAssessment(cseId: string, sector: string = 'General'): Promise<CSEDetailResponse> {
  const encodedId = encodeURIComponent(cseId);
  const encodedSector = encodeURIComponent(sector);
  return request<CSEDetailResponse>(`${API_PREFIX}/assessments/${encodedId}?sector=${encodedSector}`);
}

// 4. Ingest Log Evidence (POST /api/v1/ingest)
export async function ingestEvidence(entityName: string, file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append('entity_name', entityName);
  formData.append('file', file);

  // NOTE: Do NOT set 'Content-Type' header manually!
  // The browser will automatically set 'multipart/form-data' with the boundary parameter.
  return request<IngestResponse>(`${API_PREFIX}/ingest`, {
    method: 'POST',
    body: formData,
  });
}

// 5. Ingest Compliance ISMS Policy (POST /api/v1/ingest/compliance)
export async function ingestCompliance(cseId: string, file: File): Promise<ComplianceIngestResponse> {
  const formData = new FormData();
  formData.append('cse_id', cseId);
  formData.append('file', file);

  return request<ComplianceIngestResponse>(`${API_PREFIX}/ingest/compliance`, {
    method: 'POST',
    body: formData,
  });
}

// 6. Forensic Copilot Chat (POST /api/v1/copilot/query)
export async function askCopilot(payload: CopilotRequest): Promise<CopilotResponse> {
  return request<CopilotResponse>(`${API_PREFIX}/copilot/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// 7. Reset / Purge Enclave Store (POST /api/v1/assessments/reset)
export async function resetDatabase(): Promise<{ status: string; message: string }> {
  return request<{ status: string; message: string }>(`${API_PREFIX}/assessments/reset`, {
    method: 'POST',
  });
}