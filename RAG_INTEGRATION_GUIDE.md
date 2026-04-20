# RAG AI Settings Integration Guide

**Purpose**: Guide developers on integrating configurable LLM and embedding providers

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Admin UI                                   │
│         (http://localhost:5000/admin/ai-settings)            │
│   - Configure LLM provider/model                             │
│   - Configure embedding providers                            │
│   - Add/update API keys                                      │
└──────────────────────────┬──────────────────────────────────┘
                          │
                ┌─────────▼──────────┐
                │  AI Settings API   │
                │  (ai_settings.py)  │
                │  - get/update      │
                │  - validate        │
                │  - mask secrets    │
                └────────┬──┬────────┘
                         │  │
        ┌────────────────┘  └──────────────────┐
        │                                       │
   ┌────▼──────────────┐            ┌──────────▼────┐
   │  LLM Clients      │            │ Embedding     │
   │  (llm_clients.py) │            │ Clients       │
   │ - Ollama          │            │ (embedding_   │
   │ - Gemini          │            │  clients.py)  │
   │ - OpenAI          │            │ - Local       │
   └────┬──────────────┘            │ - OpenAI      │
        │                           │ - HuggingFace │
   ┌────▼──────────────┐            │ - Ollama      │
   │  RAG Operations   │            └──────┬────────┘
   │ - Assessment      │                   │
   │ - Chat            │  ┌────────────────┘
   │ - Retrieval       │  │
   └───────────────────┘  │
                      ┌───▼──────────┐
                      │ Vector DB    │
                      │ - ChromaDB   │
                      │ - Fallback   │
                      └──────────────┘
```

---

## Configuration Hierarchy

1. **AI Settings DB** (MongoDB `ai_settings` collection)
   - Takes precedence
   - Updated via admin UI

2. **Environment Variables** (.env file)
   - Fallback for AI settings
   - Used for deployment defaults

3. **Code Defaults** (ai_settings.py)
   - Fallback if not configured anywhere
   - Hardcoded defaults

**Priority**: DB > Env > Code Defaults

---

## Using the New API

### Get Current Settings

```python
from app.services.ai_settings import get_ai_settings

# Get settings (without secrets)
settings = get_ai_settings(include_secret=False)

print(settings)
# {
#   "provider": "ollama",
#   "textEmbeddingProvider": "local",
#   "imageEmbeddingProvider": "local",
#   "textEmbeddingModel": "all-MiniLM-L6-v2",
#   ...
# }
```

### Update Settings

```python
from app.services.ai_settings import update_ai_settings

# Update settings
payload = {
    "provider": "gemini",
    "apiKey": "AIzaSy...",
    "textEmbeddingProvider": "openai",
    "textEmbeddingApiKey": "sk-...",
}

result = update_ai_settings(payload)
```

### Get Text Embeddings

```python
from app.rag.multimodal.embedding_clients import get_text_embedding_client
from app.services.ai_settings import get_ai_settings

# Get current settings
settings = get_ai_settings(include_secret=True)

# Create client based on settings
client = get_text_embedding_client(
    provider=settings["textEmbeddingProvider"],
    model=settings["textEmbeddingModel"],
    api_key=settings.get("textEmbeddingApiKey"),
)

# Embed texts
embeddings = client.embed_texts(["Hello world", "Another text"])
```

### Get Image Embeddings

```python
from app.rag.multimodal.embedding_clients import get_image_embedding_client
from app.services.ai_settings import get_ai_settings

settings = get_ai_settings(include_secret=True)

client = get_image_embedding_client(
    provider=settings["imageEmbeddingProvider"],
    model=settings["imageEmbeddingModel"],
    api_key=settings.get("imageEmbeddingApiKey"),
)

# Embed images
embeddings = client.embed_images(["/path/to/image1.jpg", "/path/to/image2.jpg"])
```

---

## Integration Points

### 1. Assessment Question Generation

**File**: `app/rag/assessment/llm.py`

**Current**: Calls `_get_llm_client()` which uses hardcoded provider

**Update needed**:
```python
from app.services.ai_settings import get_ai_settings

# In question generation function
settings = get_ai_settings(include_secret=True)
client = get_llm_client(
    provider=settings["provider"],
    model=settings["model"],
    api_key=settings.get("apiKey"),
    base_url=settings.get("baseUrl"),
)
```

### 2. Student Chat

**File**: `app/rag/student_chat.py`

**Current**: Uses hardcoded Ollama client

**Update needed**:
```python
# Get configurable LLM client
settings = get_ai_settings(include_secret=True)
llm = get_llm_client(settings)
```

### 3. Material Ingestion (PDF to Embeddings)

**File**: `app/rag/multimodal/service.py`

**Current**: Uses hardcoded local embeddings

**Update needed**:
```python
from app.rag.multimodal.embedding_clients import (
    get_text_embedding_client,
    get_image_embedding_client,
)
from app.services.ai_settings import get_ai_settings

settings = get_ai_settings(include_secret=True)

text_client = get_text_embedding_client(
    provider=settings["textEmbeddingProvider"],
    model=settings["textEmbeddingModel"],
    api_key=settings.get("textEmbeddingApiKey"),
)

image_client = get_image_embedding_client(
    provider=settings["imageEmbeddingProvider"],
    model=settings["imageEmbeddingModel"],
    api_key=settings.get("imageEmbeddingApiKey"),
)
```

### 4. Vector Retrieval

**File**: `app/rag/multimodal/service.py` (retrieval function)

**Current**: Retrieves from ChromaDB using existing embeddings

**Status**: No change needed - uses embeddings already stored

---

## Adding a New Embedding Provider

### Step 1: Create Client Class

```python
# In app/rag/multimodal/embedding_clients.py

class NewProviderEmbeddingClient(EmbeddingClient):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
    
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        # Implementation
        pass
    
    def embed_images(self, image_urls: list[str]) -> list[list[float]]:
        # Implementation
        pass
    
    @property
    def embedding_dimension(self) -> int:
        return 384  # Your model's dimension
```

### Step 2: Update Factory Function

```python
# In get_text_embedding_client()
elif provider == "newprovider":
    api_key = api_key or current_app.config.get("NEWPROVIDER_API_KEY")
    return NewProviderEmbeddingClient(api_key=api_key, model=model)
```

### Step 3: Add Environment Variables

```python
# In app/core/settings.py
NEWPROVIDER_API_KEY: str = ""
```

### Step 4: Document in Configuration Guide

Add to `RAG_AI_CONFIGURATION.md` and `RAG_QUICK_SETUP.md`

---

## Error Handling

### Graceful Degradation

All embedding clients should fall back gracefully:

```python
class MyEmbeddingClient(EmbeddingClient):
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        try:
            # Try API call
            embeddings = self._call_api(texts)
            return embeddings
        except Exception as e:
            logger.error(f"API error: {e}, using fallback")
            # Fall back to local or zero vectors
            return [[0.0] * self.embedding_dimension for _ in texts]
```

### Validation

Settings are validated in `update_ai_settings()`:

```python
def update_ai_settings(payload: dict[str, Any]) -> dict[str, Any]:
    # Validate provider choices
    valid_providers = {"local", "openai", "huggingface", "ollama"}
    
    if payload.get("textEmbeddingProvider") not in valid_providers:
        raise ValueError("Invalid text embedding provider")
```

---

## Testing

### Unit Tests

```python
# tests/test_embedding_clients.py

def test_local_text_embedding():
    client = LocalEmbeddingClient()
    embeddings = client.embed_texts(["test"])
    assert len(embeddings) == 1
    assert len(embeddings[0]) > 0

def test_openai_text_embedding():
    client = OpenAIEmbeddingClient(api_key="test-key")
    # Mock the API call
    # Assert correct format
```

### Integration Tests

```python
# tests/test_ai_settings_integration.py

def test_get_configured_embedding_client():
    # Update settings
    update_ai_settings({"textEmbeddingProvider": "openai"})
    
    # Get client
    settings = get_ai_settings(include_secret=True)
    client = get_text_embedding_client(
        provider=settings["textEmbeddingProvider"],
        model=settings["textEmbeddingModel"],
    )
    
    # Verify correct type
    assert isinstance(client, OpenAIEmbeddingClient)
```

---

## Performance Considerations

### Local Embeddings
- **Pros**: Free, fast (200-500 texts/sec), private
- **Cons**: High memory (1-2GB), slow first load
- **Use**: Small deployments, privacy-critical

### API Embeddings  
- **Pros**: Scalable, no local resources needed
- **Cons**: Cost, network latency, API rate limits
- **Use**: Large deployments, performance-critical

### Batching

```python
# Batch large embedding requests
BATCH_SIZE = 32

def embed_large_dataset(texts, client):
    embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i+BATCH_SIZE]
        batch_embeddings = client.embed_texts(batch)
        embeddings.extend(batch_embeddings)
    return embeddings
```

### Caching

Consider caching embeddings:

```python
@lru_cache(maxsize=1000)
def get_or_embed_text(text: str) -> list[float]:
    client = get_text_embedding_client()
    return client.embed_texts([text])[0]
```

---

## Monitoring & Logging

### Log Levels

```python
logger.debug(f"Embedding 100 texts using {client.__class__.__name__}")
logger.warning(f"Embedding provider {provider} not configured, using local")
logger.error(f"Failed to embed texts: {error}")
```

### Metrics to Track

- Embeddings generated per day
- Average embedding latency
- Failed embedding requests
- Provider usage distribution
- Cost per operation (for API providers)

---

## Security Considerations

### API Key Management

1. **Never log API keys**
   ```python
   logger.info(f"Using key: {mask_api_key(key)}")  # Shows only first/last 4 chars
   ```

2. **Store encrypted**
   - Keys stored in MongoDB `ai_settings` collection
   - Should be encrypted at rest in production

3. **Use environment variables**
   - For deployment defaults
   - Don't commit keys to git

4. **Rotate regularly**
   - Set reminders to rotate API keys
   - Update through admin UI

### Rate Limiting

Implement rate limiting for API calls:

```python
def embed_texts_with_limit(texts):
    # Check rate limit before making API call
    if exceeded_rate_limit():
        wait_until_reset()
    
    # Make API call
    return client.embed_texts(texts)
```

---

## Migration Guide (From Old to New System)

### For Existing Installations

1. **Backup current database** (MongoDB)

2. **Update code** (git pull latest)

3. **Update environment variables** (.env file)
   ```env
   RAG_TEXT_EMBEDDING_PROVIDER=local
   RAG_IMAGE_EMBEDDING_PROVIDER=local
   ```

4. **Migrate AI settings** (if customized previously)
   ```python
   # Script to migrate old settings to new format
   old_settings = {
       "provider": "ollama",
       "model": "llama3.2",
   }
   
   new_settings = {
       **old_settings,
       "textEmbeddingProvider": "local",
       "imageEmbeddingProvider": "local",
       "embeddingBatchSize": 32,
   }
   ```

5. **Restart backend**
   ```bash
   python run.py
   ```

6. **Verify via admin UI**
   - Check all settings are loaded correctly
   - Test embeddings/LLM generation

---

**Questions?** Check the logs for detailed error messages and refer to specific client implementations for details.
