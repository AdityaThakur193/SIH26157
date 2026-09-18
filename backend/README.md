# SAT-SA Backend 🚀

This is the fully offline, mathematically sound backend for the Smart India Hackathon (SAT-SA).
It uses FastAPI for routing, SQLite for state ledger and exact correlation logic, and ChromaDB + Ollama for AI/RAG.

## Requirements & Setup

Because this solution is designed for **air-gapped** SOC environments, it relies on local models. You MUST have Ollama installed and the correct models downloaded before running the server.

### 1. Install System Dependencies
Make sure you have Python 3.9+ and Ollama installed.

### 2. Download the Required Local AI Models
Open a terminal and run the following commands to pull the models into your local Ollama instance:
```bash
# Used for Copilot RAG Reasoning and NCIIPC Compliance Analysis
ollama pull llama3.1:8b

# Used by ChromaDB for 100% offline semantic vector search
ollama pull all-minilm:latest
```
*Note: If you do not download these, Dimension 3 (Compliance) and the AI Copilot will fail with an "LLM Offline" error.*

### 3. Install Python Packages
```bash
pip install -r requirements.txt
```

### 4. Run the Server
```bash
python -m uvicorn main:app --port 8000
```
