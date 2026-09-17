from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import assessments, ingest, copilot

app = FastAPI(
    title="SAT-SA Air-Gapped Supervisory Analytics Engine",
    version="4.2.1",
    description="NCIIPC Supervisory Tool for SOC Assessment (SIH26157)"
)

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
