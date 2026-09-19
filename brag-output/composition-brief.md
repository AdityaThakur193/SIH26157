# Hyperframes Composition Brief: SAT-SA

## Objective
Create a short, cinematic, trailer-scale brag video for SAT-SA (Supervisory Analytics Tool for SOC Assessment) solving Problem Statement 157 (SIH26157 - NCIIPC / NTRO).

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `E:\SAT-SA`
- Primary files read: `AGENT.md`, `ARCHITECTURE.md`, `frontend/stitch_exports/screen_1.html` through `screen_6.html`, `frontend/stitch_exports/screen_4.png`, `screen_6.png`
- Product name: SAT-SA
- Tagline / strongest claim: "Auditing the Negative Space. Defending the Sovereign Grid."
- Key UI or visual moments to recreate:
  1. The NCIIPC Air-Gap Node #04 header with pulsing `AIR-GAPPED / OFFLINE` beacon.
  2. The 3-Column Forensic Investigation Console (`screen_6.html`):
     - Left: Normalized firewall log showing 85k SYN/sec burst and 2.1GB HTTPS outbound exfiltration.
     - Middle: Jira Ticket #4402 resolution: "Probably just the IT guy forgetting his password. Marking as False Positive. Closing ticket." stamped with `SUPERVISORY AUDIT FINDING: GROSS NEGLIGENCE DETECTED`.
     - Right: Offline AI Threat Copilot (Llama-3.1 70B Quantized) delivering the 42ms proof.
  3. The National Supervisory Overview metrics (`screen_4.html`): 18 CSEs, 1,428,950 alerts audited, 99% SimHash volume reduction.
- Copy that must appear verbatim:
  - "NCIIPC AIR-GAP NODE // SEC-DEF LEVEL 5"
  - "1.4 MILLION ALERTS AUDITED. BUT WHO AUDITS THE SOC?"
  - "Probably just the IT guy forgetting his password. Marking as False Positive. Closing ticket."
  - "SUPERVISORY AUDIT FINDING: GROSS NEGLIGENCE DETECTED"
  - "AI Threat Copilot (Offline Llama-3.1 70B Quantized) // Inference: 42ms"

## Creative Direction
- Tone preset: cinematic
- Creative direction: Dramatic trailer-scale air-gapped sovereign intelligence command center
- Interpretation: Epic pacing, authoritative voiceover, deep bass impacts, razor-sharp HUD typography, high-contrast dark military obsidian palette.
- Angle: SOCs in critical infrastructure suffer from alert fatigue, closing active intrusions in 4 minutes without inspecting 2.1GB exfiltration. SAT-SA provides air-gapped supervisory analytics and AI copilot auditing to catch negligence and defend national assets.
- Hook: A glowing radar beacon and flashing emergency telemetry: 1.4M alerts audited... but who audits the SOC?
- Outro / punchline: "SAT-SA: Auditing the negative space. Defending the sovereign grid."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Blurry generic stock motion

## Visual Identity
- Background: `#0b1326` (surface-dim)
- Container Low: `#131b2e`
- Container Surface: `#171f32`
- Container High: `#222a3d`
- Primary Accent: `#adc6ff` (surface-tint) / `#d8e2ff` (primary)
- Critical Alert: `#ffb4ab` (error) / `#93000a` (error-container)
- Tertiary / Beacon: `#4edea3` (tertiary-container)
- Display font: Inter, sans-serif
- Body / Code font: JetBrains Mono, monospace
- Visual references from the project: `frontend/stitch_exports/screen_4.png`, `frontend/stitch_exports/screen_6.png`

## Storyboard
Contract from `brag-output/brag-plan.md`:
1. Scene 1 — The Blindspot (0.0s - 4.5s) — [NCIIPC Air-Gap Command Center + Warning Radar + 1.4M alerts audited]
2. Scene 2 — The Gross Negligence (4.5s - 9.8s) — [Firewall Telemetry vs Ticket #4402 + Gross Negligence Alert Stamp]
3. Scene 3 — Sovereign Intelligence Engine (9.8s - 15.0s) — [64-bit SimHash Log Deduplication (1.4M -> 1,200) + 4 Supervisory Dimensions]
4. Scene 4 — The Verdict & The Shield (15.0s - 20.0s) — [AI Threat Copilot 42ms Forensic Verdict + Official Sovereign SAT-SA Seal]

## Audio
- Audio role: Cinematic trailer support with dramatic military impact thuds, driving bass pulse, and authoritative voiceover.
- Audio arc: Starts tense and suspenseful with low atmospheric hum and beacon pulse; slams into high-alert urgency on Scene 2; builds through the technological power of SimHash; climaxes with heroic conviction on the Copilot verdict and sovereign seal.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- Music treatment: Starts at 0.0s ducked to 0.15 under voiceover; swells between dialogue lines; peaks into final crescendo at 17.5s before fading.
- SFX:
  - `impactSoft_heavy_001.ogg` on Scene transitions and major alert stamps.
  - `impactSoft_medium_001.ogg` on telemetry reveals.
  - `click_003.ogg` on terminal log stream.
- Voiceover:
  - Narrated via Kokoro TTS (`voiceover.wav`) on data-track-index="3", data-volume="1".
  - Script:
    1. (0.0s - 4.5s): "India's critical infrastructure handles millions of cyber alerts every day. But who audits the SOC?"
    2. (4.5s - 9.8s): "Alert fatigue strikes. Critical breaches closed in four minutes... dismissed as 'the IT guy forgetting his password'."
    3. (9.8s - 15.0s): "Enter SAT-SA. Air-gapped supervisory intelligence. Collapsing 1.4 million noisy logs into high-fidelity clusters with 64-bit SimHash."
    4. (15.0s - 20.0s): "Powered by an offline AI Threat Copilot. Exposing the negative space. Defending the sovereign grid."
