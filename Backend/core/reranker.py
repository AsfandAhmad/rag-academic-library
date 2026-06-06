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

        # Store raw scores first (for debugging/display)
        raw_scores = [float(s) for s in scores]
        
        # Normalize scores to 0-1 range for consistent downstream display
        try:
            s_min = float(min(scores))
            s_max = float(max(scores))
        except Exception:
            s_min = 0.0
            s_max = 1.0

        normalized = []
        if s_max == s_min:
            # If all scores are identical, use a gradient based on position
            # Most relevant gets 1.0, least relevant gets 0.5
            num_chunks = len(chunks)
            if num_chunks > 1:
                normalized = [1.0 - (i * 0.5 / (num_chunks - 1)) for i in range(num_chunks)]
            else:
                normalized = [1.0]
        else:
            for sc in scores:
                val = (float(sc) - s_min) / (s_max - s_min)
                # clamp
                if val < 0:
                    val = 0.0
                elif val > 1:
                    val = 1.0
                normalized.append(val)

        # Attach scores (rounded to 2 decimals) to each chunk
        for chunk, raw_score, norm_score in zip(chunks, raw_scores, normalized):
            chunk["rerank_score"] = round(float(norm_score), 2)
            chunk["raw_rerank_score"] = round(raw_score, 2)

        # Sort by re-rank score descending
        reranked = sorted(chunks, key=lambda x: x["rerank_score"], reverse=True)

        # Log for debugging
        print(f"🔍 Re-ranked {len(chunks)} chunks:")
        for i, chunk in enumerate(reranked[:top_k], 1):
            print(f"  [{i}] {chunk['filename']} - Page {chunk['page']} - Score: {chunk['rerank_score']}")

        return reranked[:top_k]


def get_reranker() -> Reranker:
    return Reranker.get_instance()