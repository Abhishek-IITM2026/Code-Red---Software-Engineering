"""
Embedding API clients for text and image embeddings.

Supports both local and remote embedding services:
- Local: sentence-transformers for text, CLIP for images
- OpenAI: text-embedding-3-small, text-embedding-3-large
- Hugging Face: Inference API
- Ollama: Local text embeddings
"""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import Any

import requests
from flask import current_app

logger = logging.getLogger(__name__)


class EmbeddingClient(ABC):
    """Base class for embedding clients."""
    
    @abstractmethod
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a list of text strings.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors (one per text)
        """
        pass
    
    @abstractmethod
    def embed_images(self, image_urls: list[str]) -> list[list[float]]:
        """
        Embed a list of image URLs or paths.
        
        Args:
            image_urls: List of image URLs or file paths
            
        Returns:
            List of embedding vectors (one per image)
        """
        pass
    
    @property
    @abstractmethod
    def embedding_dimension(self) -> int:
        """Return the dimension of embeddings produced by this client."""
        pass


class LocalEmbeddingClient(EmbeddingClient):
    """Use sentence-transformers for text and CLIP for images (local)."""
    
    def __init__(self, text_model: str = "all-MiniLM-L6-v2", clip_model: str = "openai/clip-vit-base-patch32"):
        self.text_model_name = text_model
        self.clip_model_name = clip_model
        self._text_model = None
        self._clip_model = None
        self._clip_processor = None
        self._text_dimension = 384
        self._image_dimension = 512
    
    def _load_text_model(self):
        """Load sentence-transformers model (lazy loading)."""
        if self._text_model is not None:
            return self._text_model
        
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading text embedding model: {self.text_model_name}")
            self._text_model = SentenceTransformer(self.text_model_name, local_files_only=False)
            # Infer dimension from a test embedding
            test_embed = self._text_model.encode(["test"])
            self._text_dimension = len(test_embed[0])
            return self._text_model
        except Exception as e:
            logger.error(f"Failed to load text embedding model: {e}")
            return None
    
    def _load_clip_model(self):
        """Load CLIP model (lazy loading)."""
        if self._clip_model is not None:
            return self._clip_model, self._clip_processor
        
        try:
            from transformers import CLIPModel, CLIPProcessor
            logger.info(f"Loading image embedding model: {self.clip_model_name}")
            self._clip_processor = CLIPProcessor.from_pretrained(self.clip_model_name, local_files_only=False)
            self._clip_model = CLIPModel.from_pretrained(self.clip_model_name, local_files_only=False)
            self._clip_model.eval()
            # Infer dimension from a test embedding
            import torch
            with torch.no_grad():
                test_embed = self._clip_model.get_text_features(**self._clip_processor(["test"], return_tensors="pt"))
            self._image_dimension = test_embed.shape[-1]
            return self._clip_model, self._clip_processor
        except Exception as e:
            logger.error(f"Failed to load image embedding model: {e}")
            return None, None
    
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Embed texts using sentence-transformers."""
        model = self._load_text_model()
        if model is None:
            logger.warning("Text embedding model not available, using zero vectors")
            return [[0.0] * self._text_dimension for _ in texts]
        
        embeddings = model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    
    def embed_images(self, image_paths: list[str]) -> list[list[float]]:
        """Embed images using CLIP."""
        model, processor = self._load_clip_model()
        if model is None or processor is None:
            logger.warning("Image embedding model not available, using zero vectors")
            return [[0.0] * self._image_dimension for _ in image_paths]
        
        try:
            from PIL import Image
            import torch
            
            embeddings = []
            for img_path in image_paths:
                try:
                    image = Image.open(img_path).convert("RGB")
                    inputs = processor(images=image, return_tensors="pt")
                    with torch.no_grad():
                        image_features = model.get_image_features(**inputs)
                    embeddings.append(image_features.squeeze().cpu().numpy().tolist())
                except Exception as e:
                    logger.warning(f"Failed to embed image {img_path}: {e}")
                    embeddings.append([0.0] * self._image_dimension)
            return embeddings
        except Exception as e:
            logger.error(f"Failed to load image embedding model: {e}")
            return [[0.0] * self._image_dimension for _ in image_paths]
    
    @property
    def embedding_dimension(self) -> int:
        """Return the dimension of text embeddings."""
        return self._text_dimension


class OpenAIEmbeddingClient(EmbeddingClient):
    """Use OpenAI's embedding API."""
    
    def __init__(
        self,
        api_key: str,
        text_model: str = "text-embedding-3-small",
        image_model: str = "text-embedding-3-small",
    ):
        self.api_key = api_key
        self.text_model = text_model
        self.image_model = image_model
        self.base_url = "https://api.openai.com/v1"
    
    def _call_api(self, model: str, input_data: list[str]) -> list[list[float]]:
        """Call OpenAI embedding API."""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "input": input_data,
                "model": model,
            }
            response = requests.post(
                f"{self.base_url}/embeddings",
                headers=headers,
                json=payload,
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            # Extract embeddings, sorted by index to maintain order
            embeddings = sorted(data["data"], key=lambda x: x["index"])
            return [e["embedding"] for e in embeddings]
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Embed texts using OpenAI API."""
        logger.info(f"Embedding {len(texts)} texts using OpenAI {self.text_model}")
        return self._call_api(self.text_model, texts)
    
    def embed_images(self, image_urls: list[str]) -> list[list[float]]:
        """
        Note: OpenAI doesn't have a separate image embedding model.
        For now, we'll use text descriptions of images.
        """
        logger.warning("OpenAI doesn't support direct image embeddings. Using image URLs as text.")
        return self._call_api(self.image_model, image_urls)
    
    @property
    def embedding_dimension(self) -> int:
        """OpenAI text-embedding-3-small has 1536 dimensions."""
        return 1536  # text-embedding-3-small


class HuggingFaceEmbeddingClient(EmbeddingClient):
    """Use Hugging Face Inference API for embeddings."""
    
    def __init__(
        self,
        api_key: str,
        text_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        image_model: str = "sentence-transformers/clip-ViT-B-32",
    ):
        self.api_key = api_key
        self.text_model = text_model
        self.image_model = image_model
        self.base_url = "https://api-inference.huggingface.co/models"
    
    def _call_api(self, model: str, inputs: Any) -> list[list[float]]:
        """Call Hugging Face Inference API."""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {"inputs": inputs}
            response = requests.post(
                f"{self.base_url}/{model}",
                headers=headers,
                json=payload,
                timeout=60,
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Hugging Face API error: {e}")
            raise
    
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Embed texts using Hugging Face."""
        logger.info(f"Embedding {len(texts)} texts using Hugging Face {self.text_model}")
        return self._call_api(self.text_model, texts)
    
    def embed_images(self, image_urls: list[str]) -> list[list[float]]:
        """Embed images using Hugging Face CLIP model."""
        logger.info(f"Embedding {len(image_urls)} images using Hugging Face {self.image_model}")
        return self._call_api(self.image_model, image_urls)
    
    @property
    def embedding_dimension(self) -> int:
        """all-MiniLM-L6-v2 has 384 dimensions."""
        return 384


class OllamaEmbeddingClient(EmbeddingClient):
    """Use Ollama for local embeddings."""
    
    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "nomic-embed-text",
    ):
        self.base_url = base_url
        self.model = model
    
    def _call_ollama(self, prompt: str) -> list[float]:
        """Call Ollama embedding endpoint."""
        try:
            url = f"{self.base_url}/api/embed"
            payload = {
                "model": self.model,
                "prompt": prompt,
            }
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [])
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            raise
    
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Embed texts using Ollama."""
        logger.info(f"Embedding {len(texts)} texts using Ollama {self.model}")
        embeddings = []
        for text in texts:
            emb = self._call_ollama(text)
            embeddings.append(emb)
        return embeddings
    
    def embed_images(self, image_paths: list[str]) -> list[list[float]]:
        """Ollama doesn't support image embeddings directly."""
        logger.warning("Ollama doesn't support image embeddings. Using image paths as text.")
        return self.embed_texts(image_paths)
    
    @property
    def embedding_dimension(self) -> int:
        """nomic-embed-text has 768 dimensions."""
        return 768  # Default for nomic-embed-text


def get_text_embedding_client(
    provider: str = "local",
    model: str = "all-MiniLM-L6-v2",
    api_key: str | None = None,
) -> EmbeddingClient:
    """
    Get a text embedding client based on the provider.
    
    Args:
        provider: "local", "openai", "huggingface", "ollama"
        model: Model name or identifier
        api_key: API key if needed
        
    Returns:
        EmbeddingClient instance
    """
    provider = provider.lower().strip()
    
    if provider == "openai":
        if not api_key:
            api_key = current_app.config.get("OPENAI_EMBEDDING_API_KEY") or current_app.config.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OpenAI API key not configured, falling back to local")
            return LocalEmbeddingClient()
        return OpenAIEmbeddingClient(api_key=api_key, text_model=model)
    
    elif provider == "huggingface":
        if not api_key:
            api_key = current_app.config.get("HUGGINGFACE_EMBEDDING_API_KEY")
        if not api_key:
            logger.warning("Hugging Face API key not configured, falling back to local")
            return LocalEmbeddingClient()
        return HuggingFaceEmbeddingClient(api_key=api_key, text_model=model)
    
    elif provider == "ollama":
        base_url = current_app.config.get("OLLAMA_EMBEDDING_BASE_URL") or "http://localhost:11434"
        return OllamaEmbeddingClient(base_url=base_url, model=model)
    
    else:  # local or default
        return LocalEmbeddingClient(text_model=model)


def get_image_embedding_client(
    provider: str = "local",
    model: str = "openai/clip-vit-base-patch32",
    api_key: str | None = None,
) -> EmbeddingClient:
    """
    Get an image embedding client based on the provider.
    
    Args:
        provider: "local", "openai", "huggingface"
        model: Model name or identifier
        api_key: API key if needed
        
    Returns:
        EmbeddingClient instance
    """
    provider = provider.lower().strip()
    
    if provider == "openai":
        if not api_key:
            api_key = current_app.config.get("OPENAI_EMBEDDING_API_KEY") or current_app.config.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OpenAI API key not configured, falling back to local")
            return LocalEmbeddingClient(clip_model=model)
        return OpenAIEmbeddingClient(api_key=api_key, image_model=model)
    
    elif provider == "huggingface":
        if not api_key:
            api_key = current_app.config.get("HUGGINGFACE_EMBEDDING_API_KEY")
        if not api_key:
            logger.warning("Hugging Face API key not configured, falling back to local")
            return LocalEmbeddingClient(clip_model=model)
        return HuggingFaceEmbeddingClient(api_key=api_key, image_model=model)
    
    else:  # local or default
        return LocalEmbeddingClient(clip_model=model)
