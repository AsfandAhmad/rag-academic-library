from groq import Groq
from typing import List, Dict
import os

class Generator:
    _instance = None

    def __init__(self):
        # Load environment variables at runtime, not at import time
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "llama3-8b-8192")
        
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
        Paper requirement: responses must include proper attribution/citations.
        """
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(
                f"[Source {i}] File: {chunk['filename']} | Page: {chunk['page']}\n"
                f"{chunk['text']}\n"
            )

        context = "\n".join(context_parts)

        prompt = f"""You are an academic research assistant for a university library system.
Your task is to answer the user's question using ONLY the provided academic sources below.

RULES:
1. Answer clearly and accurately based on the sources.
2. Always cite your sources using [Source N] notation inline.
3. At the end, list all sources used in this format:
   References:
   [Source N] filename, Page X
4. If the sources don't contain enough information, say so honestly.
5. Do not hallucinate or add information not in the sources.
6. Maintain academic rigor in your response.

ACADEMIC SOURCES:
{context}

USER QUESTION:
{query}

ANSWER:"""

        return prompt

    def generate(self, query: str, chunks: List[Dict]) -> Dict:
        """
        Generate answer using Groq LLM with retrieved chunks as context.

        Returns:
            dict with 'answer' and 'sources' keys
        """
        try:
            prompt = self.build_prompt(query, chunks)

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful academic library assistant. Always cite sources."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,    # low temp for factual accuracy
                max_tokens=1024,
            )

            answer = response.choices[0].message.content

            # Build sources list for frontend
            sources = []
            for i, chunk in enumerate(chunks, 1):
                sources.append({
                    "index":    i,
                    "filename": chunk["filename"],
                    "page":     chunk["page"],
                    "score":    round(chunk.get("rerank_score", chunk.get("score", 0)), 4),
                    "excerpt":  chunk["text"][:200] + "..."  # first 200 chars
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