import os, sys, json
sys.path.append(os.path.abspath('backend'))
from app.services.ai.copilot import CopilotEngine

print("Initializing Copilot...")
engine = CopilotEngine()
print("Asking a threat hunting question...")
res = engine.query("Are there any high severity events targeting port 22 or 3389?")
print("\n--- COPILOT ANSWER ---")
print(res['answer'])
print("\nSources:", res['sources'])
