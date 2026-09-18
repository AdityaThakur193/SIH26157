from app.services.storage.vectorstore import VectorStoreEngine
import ollama

class CopilotEngine:
    def __init__(self):
        self.vectorstore = VectorStoreEngine()

    def query(self, question: str) -> dict:
        # 1. Retrieve context
        context_docs = self.vectorstore.hybrid_search(question, k=5)
        
        context_text = "\n".join([
            f"- [Cluster {d['id']}] (x{d['count']} times): {d['content']}"
            for d in context_docs
        ])
        
        if not context_text.strip():
            context_text = "No relevant logs found in the evidence repository."
            
        prompt = f"""You are an elite NCIIPC Tier-3 SOC Analyst and Forensic Examiner. Answer the threat hunting question using ONLY the provided evidence clusters.

Evidence:
{context_text}

Question: {question}

Instructions for your response:
1. Speak in a highly professional, authoritative cybersecurity tone (use MITRE ATT&CK terminology if applicable).
2. Use bullet points or bold text to structure your findings clearly.
3. If the answer is not in the context, reply EXACTLY with: "[UNVERIFIED: Evidence not found]. Do not hallucinate."
4. If you find relevant logs, explicitly cite their Cluster IDs.

Analysis:"""

        try:
            # Requires Ollama running locally with llama3.1
            response = ollama.chat(model='llama3.1:8b', messages=[
                {
                    'role': 'user',
                    'content': prompt,
                },
            ])
            answer = response['message']['content']
        except Exception as e:
            answer = f"Error: Local LLM engine unreachable. Ensure Ollama is running. Details: {str(e)}"

        return {
            "answer": answer,
            "sources": [d["id"] for d in context_docs]
        }
