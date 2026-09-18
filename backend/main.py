from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import assessments, ingest, copilot

app = FastAPI(
    title="SAT-SA Air-Gapped Supervisory Analytics Engine",
    version="4.2.1",
    description="NCIIPC Supervisory Tool for SOC Assessment (SIH26157)"
)

# CORS setup for React / Next.js / Vite frontend on any local port
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(assessments.router)
app.include_router(ingest.router)
app.include_router(copilot.router)

@app.get("/")
def read_root():
    return {
        "status": "ACTIVE",
        "node": "NCIIPC Air-Gapped Node #04",
        "engine_version": "v4.2.1",
        "airgap_mode": True
    }
