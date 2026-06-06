from groq import Groq
from typing import List, Dict
import os

class Generator:
    _instance = None

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")  # ← upgraded model

        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")

        try:
            self.client = Groq(api_key=self.api_key)
            print(f"✅ Groq client ready — model: {self.model}")
        except Exception as e:
            print(f"❌ Groq initialization failed: {e}")
            raise

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def build_prompt(self, query: str, chunks: List[Dict]) -> str:
        """
        Build the prompt with retrieved context and citation instructions.
        """
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(
                f"[Source {i}] File: {chunk['filename']} | Page: {chunk['page']}\n"
                f"{chunk['text']}\n"
            )

        context = "\n".join(context_parts)

        prompt = f"""You are an academic research assistant for a university library system.
Your task is to answer the user's question using the provided academic sources below.

RULES:
1. Answer clearly and accurately based on the sources provided.
2. Always cite your sources using [Source N] notation inline in your answer.
3. At the end of your answer, list all sources you used:
   References:
   [Source N] filename, Page X
4. Even if the sources only partially cover the question, extract and explain whatever relevant information exists in them.
5. Do NOT say you cannot find information — always attempt to answer using what is available in the sources.
6. Do not add information that is not present in the sources.
7. Maintain academic rigor in your response.

ACADEMIC SOURCES:
{context}

USER QUESTION:
{query}

ANSWER:"""

        return prompt

    def generate(self, query: str, chunks: List[Dict]) -> Dict:
        """
        Generate answer using Groq LLM with retrieved chunks as context.
        Returns dict with 'answer' and 'sources' keys.
        """
        if not chunks:
            return {
                "answer":  "No document chunks were retrieved. Please upload a PDF and try again.",
                "sources": []
            }

        try:
            prompt = self.build_prompt(query, chunks)

            print(f"📤 Sending {len(chunks)} chunks to LLM...")  # debug
            print(f"📄 First chunk preview: {chunks[0]['text'][:200]}")  # debug

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role":    "system",
                        "content": (
                            "You are a helpful academic library assistant. "
                            "You always answer based on the provided sources. "
                            "You never refuse to answer — you always extract whatever "
                            "relevant information exists in the given context."
                        )
                    },
                    {
                        "role":    "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=1024,
            )

            answer = response.choices[0].message.content
            print(f"✅ LLM answered: {answer[:200]}")  # debug

            # Build sources list for frontend
            sources = []
            for i, chunk in enumerate(chunks, 1):
                raw_score = chunk.get("rerank_score", chunk.get("score", 0))
                try:
                    score_val = float(raw_score)
                except Exception:
                    score_val = 0.0

                if score_val > 1:
                    score_val = min(max(score_val / 100.0, 0.0), 1.0)
                else:
                    score_val = min(max(score_val, 0.0), 1.0)

                sources.append({
                    "index":           i,
                    "filename":        chunk["filename"],
                    "page":            chunk["page"],
                    "score":           round(score_val, 2),
                    "rerank_score":    float(chunk.get("rerank_score") or 0.0),
                    "embedding_score": float(chunk.get("score") or 0.0),
                    "excerpt":         chunk["text"][:200] + "..."
                })

            return {
                "answer":  answer,
                "sources": sources
            }

        except Exception as e:
            print(f"❌ Generation failed: {e}")
            raise


def get_generator() -> Generator:
    return Generator.get_instance()