from pinecone import Pinecone, ServerlessSpec
from core.embedder import get_embedder
from typing import List, Dict
import os

PINECONE_API_KEY  = os.getenv("PINECONE_API_KEY")
INDEX_NAME        = os.getenv("PINECONE_INDEX_NAME", "rag-library")
PINECONE_REGION   = os.getenv("PINECONE_REGION", "us-east-1")
DIMENSION         = 768   # SciBERT dimension


class Retriever:
    _instance = None

    def __init__(self):
        print("🔄 Connecting to Pinecone...")
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self._ensure_index()
        self.index = self.pc.Index(INDEX_NAME)
        self.embedder = get_embedder()
        print("✅ Pinecone connected")

    def _ensure_index(self):
        """Create index if it doesn't exist."""
        existing = [i.name for i in self.pc.list_indexes()]
        if INDEX_NAME not in existing:
            print(f"📦 Creating Pinecone index: {INDEX_NAME}")
            self.pc.create_index(
                name=INDEX_NAME,
                dimension=DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region=PINECONE_REGION)
            )

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def upsert_chunks(self, chunks: List[Dict]) -> List[str]:
        """
        Store embedded chunks in Pinecone.
        chunks = [{"id": str, "text": str, "metadata": dict}]
        Returns list of vector IDs stored.
        """
        texts = [c["text"] for c in chunks]
        embeddings = self.embedder.embed_batch(texts)

        vectors = []
        ids = []
        for chunk, embedding in zip(chunks, embeddings):
            vectors.append({
                "id":       chunk["id"],
                "values":   embedding,
                "metadata": {
                    **chunk["metadata"],
                    "text": chunk["text"]   # store raw text in metadata
                }
            })
            ids.append(chunk["id"])

        # Upsert in batches of 100 (Pinecone limit)
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            self.index.upsert(vectors=vectors[i:i+batch_size])

        print(f"✅ Upserted {len(vectors)} chunks to Pinecone")
        return ids

    def search(self, query: str, top_k: int = 10) -> List[Dict]:
        """
        Search Pinecone for similar chunks.
        Returns top_k results with text + metadata.
        """
        query_embedding = self.embedder.embed_text(query)

        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )

        matches = []
        for match in results["matches"]:
            matches.append({
                "id":       match["id"],
                "score":    match["score"],
                "text":     match["metadata"].get("text", ""),
                "filename": match["metadata"].get("filename", ""),
                "page":     match["metadata"].get("page", 0),
                "chunk":    match["metadata"].get("chunk", 0),
            })

        return matches

    def delete_by_ids(self, ids: List[str]):
        """Delete vectors by their IDs (when user deletes a doc)."""
        self.index.delete(ids=ids)
        print(f"🗑️ Deleted {len(ids)} vectors from Pinecone")


def get_retriever() -> Retriever:
    return Retriever.get_instance()