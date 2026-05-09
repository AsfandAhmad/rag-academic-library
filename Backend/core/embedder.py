from sentence_transformers import SentenceTransformer
from typing import List
import torch

# SciBERT - domain specific for academic/scientific text (as mentioned in paper)
MODEL_NAME = "allenai/scibert_scivocab_uncased"

class Embedder:
    _instance = None  # singleton

    def __init__(self):
        print(f"🔄 Loading SciBERT model: {MODEL_NAME}")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = SentenceTransformer(MODEL_NAME, device=device)
        self.dimension = 768  # SciBERT output dimension
        print(f"✅ SciBERT loaded on {device}")

    @classmethod
    def get_instance(cls):
        """Singleton - load model only once."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def embed_text(self, text: str) -> List[float]:
        """Embed a single string."""
        embedding = self.model.encode(text, convert_to_tensor=False)
        return embedding.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of strings (faster than one by one)."""
        embeddings = self.model.encode(
            texts,
            batch_size=32,
            show_progress_bar=True,
            convert_to_tensor=False
        )
        return [e.tolist() for e in embeddings]


def get_embedder() -> Embedder:
    return Embedder.get_instance()