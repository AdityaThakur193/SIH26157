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
  supervisory_findings: number; // High-severity findings count (350)
  priority_pool_cases: number;  // Review pool cases (350)
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
  compliance_result?: Record<string, unknown>;
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