from sentence_transformers import CrossEncoder
from typing import List, Dict

# Cross-encoder for re-ranking (implements SEER concept from paper)
RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"

class Reranker:
    _instance = None

    def __init__(self):
        print(f"🔄 Loading re-ranker: {RERANKER_MODEL}")
        self.model = CrossEncoder(RERANKER_MODEL)
        print("✅ Re-ranker loaded")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def rerank(self, query: str, chunks: List[Dict], top_k: int = 5) -> List[Dict]:
        """
        Re-rank retrieved chunks using cross-encoder.
        This implements the SEER (Self-Aligned Evidence Extraction) concept
        from the paper - aligning retrieved docs with user intent.

        Args:
            query:  user's original question
            chunks: list of dicts from retriever.search()
            top_k:  how many to return after re-ranking

        Returns:
            top_k chunks sorted by re-rank score (highest first)
        """
        if not chunks:
            return []

        # Build (query, passage) pairs for cross-encoder
        pairs = [(query, chunk["text"]) for chunk in chunks]

        # Score each pair
        scores = self.model.predict(pairs)

        # Attach re-rank score to each chunk
        for chunk, score in zip(chunks, scores):
            chunk["rerank_score"] = float(score)

        # Sort by re-rank score descending
        reranked = sorted(chunks, key=lambda x: x["rerank_score"], reverse=True)

        return reranked[:top_k]


def get_reranker() -> Reranker:
    return Reranker.get_instance()