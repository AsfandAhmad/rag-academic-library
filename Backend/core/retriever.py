from pinecone import Pinecone, ServerlessSpec
from core.embedder import get_embedder
from typing import List, Dict, Optional
import os
import time

DIMENSION = 768


class Retriever:
    _instance = None

    def __init__(self):
        self.api_key    = os.getenv("PINECONE_API_KEY")
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "rag-library")
        self.region     = os.getenv("PINECONE_REGION", "us-east-1")

        if not self.api_key:
            raise ValueError("PINECONE_API_KEY not found in environment variables")

        print("🔄 Connecting to Pinecone...")
        try:
            self.pc = Pinecone(api_key=self.api_key)
            self._ensure_index()
            self.index    = self.pc.Index(self.index_name)
            self.embedder = get_embedder()
            print("✅ Pinecone connected")
        except Exception as e:
            print(f"❌ Pinecone connection failed: {e}")
            raise

    def _ensure_index(self):
        try:
            existing = [i.name for i in self.pc.list_indexes()]
            if self.index_name not in existing:
                print(f"📦 Creating Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=DIMENSION,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region=self.region)
                )
                time.sleep(5)
        except Exception as e:
            print(f"❌ Index creation failed: {e}")
            raise

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def upsert_chunks(self, chunks: List[Dict]) -> List[str]:
        try:
            texts      = [c["text"] for c in chunks]
            embeddings = self.embedder.embed_batch(texts)

            vectors = []
            ids     = []
            for chunk, embedding in zip(chunks, embeddings):
                vectors.append({
                    "id":       chunk["id"],
                    "values":   embedding,
                    "metadata": {
                        **chunk["metadata"],
                        "text":    chunk["text"],
                        "user_id": int(chunk["metadata"]["user_id"])  # ← always integer
                    }
                })
                ids.append(chunk["id"])

            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                self.index.upsert(vectors=vectors[i:i+batch_size])

            print(f"✅ Upserted {len(vectors)} chunks to Pinecone")
            return ids
        except Exception as e:
            print(f"❌ Upsert failed: {e}")
            raise

    def search(
        self,
        query:    str,
        top_k:    int = 10,
        user_id:  Optional[int] = None,
        filename: Optional[str] = None
    ) -> List[Dict]:
        try:
            query_embedding = self.embedder.embed_text(query)

            # Build filter dynamically
            filter_dict = {}
            if user_id is not None:
                filter_dict["user_id"] = {"$eq": int(user_id)}  # always int
            if filename is not None:
                filter_dict["filename"] = {"$eq": filename}

            print(f"🔍 Searching with filter: {filter_dict}")  # debug log

            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict if filter_dict else None
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

            print(f"✅ Found {len(matches)} chunks for user_id={user_id}")  # debug log
            return matches
        except Exception as e:
            print(f"❌ Search failed: {e}")
            raise

    def delete_by_ids(self, ids: List[str]):
        try:
            self.index.delete(ids=ids)
            print(f"🗑️ Deleted {len(ids)} vectors from Pinecone")
        except Exception as e:
            print(f"❌ Delete failed: {e}")
            raise


def get_retriever() -> Retriever:
    return Retriever.get_instance()