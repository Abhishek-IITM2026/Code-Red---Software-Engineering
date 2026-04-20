# RAG AI Settings Configuration Guide

**Updated**: April 2026  
**Purpose**: Configure LLM and embedding models for RAG operations (local or API-based)

---

## 🎯 Overview

Code-Red supports **flexible AI model configuration** for two key components:

1. **LLM (Large Language Model)** - For generating assessment questions and student chat responses
2. **Embeddings** - For converting text and images into vectors for semantic search
   - Text embeddings (material search)
   - Image embeddings (visual material search)

Each component can be configured as:
- **Local**: Run on your own hardware (privacy-focused, free but requires resources)
- **API-based**: Use cloud services (no local hardware needed, requires API keys)

---

## 📋 Quick Setup Paths

Choose your setup based on your needs:

### Path 1: Fully Local (Recommended for Privacy)
- ✅ LLM: Ollama (local)
- ✅ Text Embeddings: Local (sentence-transformers)
- ✅ Image Embeddings: Local (CLIP)
- **Requirements**: 8GB+ RAM, 10GB storage
- **Cost**: Free
- **Setup Time**: 30 minutes

### Path 2: Hybrid (Recommended for Production)
- ✅ LLM: Gemini API (fast, accurate)
- ✅ Text Embeddings: OpenAI API (excellent quality)
- ✅ Image Embeddings: Local CLIP (faster, free)
- **Requirements**: API keys only
- **Cost**: ~$0.001 per question, ~$0.00002 per embedding
- **Setup Time**: 10 minutes

### Path 3: Fully Cloud (Recommended for Simplicity)
- ✅ LLM: Gemini API
- ✅ Text Embeddings: OpenAI API
- ✅ Image Embeddings: OpenAI API
- **Requirements**: API keys only
- **Cost**: ~$0.001 per question, ~$0.0001 per embedding
- **Setup Time**: 10 minutes

### Path 4: Mixed Local & Cloud (Custom)
- Mix any combination of local and API-based services
- **Requirements**: Some hardware + API keys
- **Cost**: Varies
- **Setup Time**: 20-30 minutes

---

## 🛠️ Detailed Setup Instructions

### Setup Path 1: Fully Local (Ollama + Local Embeddings)

#### Step 1: Install Ollama
```bash
# On Linux
curl -fsSL https://ollama.ai/install.sh | sh

# On macOS
# Download from https://ollama.ai

# On Windows
# Download from https://ollama.ai
```

#### Step 2: Start Ollama Service
```bash
# Start the Ollama service (runs on http://localhost:11434)
ollama serve
```

#### Step 3: Pull LLM Model
```bash
# In another terminal, pull the model
ollama pull llama3.2
# Or for faster/smaller: ollama pull mistral
# Or for better quality: ollama pull llama2
```

#### Step 4: Pull Embedding Model
```bash
# Pull embedding model
ollama pull nomic-embed-text
```

#### Step 5: Configure Code-Red
Create or update `.env` file in `backend/`:
```env
# LLM Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Text Embedding - Local
RAG_TEXT_EMBEDDING_PROVIDER=local
RAG_TEXT_MODEL=all-MiniLM-L6-v2

# Image Embedding - Local
RAG_IMAGE_EMBEDDING_PROVIDER=local
RAG_CLIP_MODEL=openai/clip-vit-base-patch32
```

#### Step 6: Start Backend & Test
```bash
cd backend
source .benv/bin/activate
python run.py
```

Open admin panel: `http://localhost:5000/admin/ai-settings`
- **LLM Provider**: Ollama
- **Text Embedding Provider**: local
- **Image Embedding Provider**: local

---

### Setup Path 2: Hybrid (Gemini LLM + OpenAI Embeddings + Local Images)

#### Step 1: Get API Keys

**For Gemini (LLM):**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Create new API key
4. Copy the key

**For OpenAI (Text Embeddings):**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key
4. (You can use the same key for LLM too if using OpenAI GPT)

#### Step 2: Configure Code-Red
Create or update `.env` file:
```env
# LLM Configuration - Gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash

# Text Embedding - OpenAI API
RAG_TEXT_EMBEDDING_PROVIDER=openai
RAG_TEXT_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_API_KEY=your-openai-api-key-here

# Image Embedding - Local CLIP
RAG_IMAGE_EMBEDDING_PROVIDER=local
RAG_CLIP_MODEL=openai/clip-vit-base-patch32
```

#### Step 3: Start Backend & Configure
```bash
cd backend
source .benv/bin/activate
python run.py
```

Open admin panel: `http://localhost:5000/admin/ai-settings`
- **LLM Provider**: gemini
- **LLM Model**: gemini-1.5-flash
- **Text Embedding Provider**: openai
- **Text Embedding Model**: text-embedding-3-small
- **Image Embedding Provider**: local
- **Image Embedding Model**: openai/clip-vit-base-patch32

---

### Setup Path 3: Fully Cloud (Gemini + OpenAI)

#### Step 1: Get API Keys
Same as Path 2 (Gemini + OpenAI)

#### Step 2: Configure Code-Red
```env
# LLM Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash

# Text Embedding - OpenAI
RAG_TEXT_EMBEDDING_PROVIDER=openai
RAG_TEXT_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_API_KEY=your-openai-api-key-here

# Image Embedding - OpenAI
RAG_IMAGE_EMBEDDING_PROVIDER=openai
# (Uses same OpenAI API key from above)
```

#### Step 3: Start & Configure
Same as Path 2

---

### Setup Path 4: Custom Mix

Use any combination:

```env
# Example: Ollama LLM + OpenAI Embeddings + Ollama Images
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

RAG_TEXT_EMBEDDING_PROVIDER=openai
OPENAI_EMBEDDING_API_KEY=your-key

RAG_IMAGE_EMBEDDING_PROVIDER=ollama
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

---

## 📊 Configuration Reference

### Environment Variables

#### LLM Configuration
```env
# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Gemini (API)
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-1.5-flash

# OpenAI (API)
OPENAI_API_KEY=your-api-key
```

#### Text Embedding Configuration
```env
# Provider: local, openai, huggingface, ollama
RAG_TEXT_EMBEDDING_PROVIDER=local

# Model name (for API providers, use full path)
RAG_TEXT_MODEL=all-MiniLM-L6-v2

# API Keys (only needed for respective providers)
OPENAI_EMBEDDING_API_KEY=your-key
HUGGINGFACE_EMBEDDING_API_KEY=your-key
```

#### Image Embedding Configuration
```env
# Provider: local, openai, huggingface
RAG_IMAGE_EMBEDDING_PROVIDER=local

# Model (for local CLIP)
RAG_CLIP_MODEL=openai/clip-vit-base-patch32

# API Keys
OPENAI_EMBEDDING_API_KEY=your-key
HUGGINGFACE_EMBEDDING_API_KEY=your-key
```

---

## 💻 LLM Model Options

### Local (Ollama)
| Model | Size | Speed | Quality | RAM Needed | Best For |
|-------|------|-------|---------|------------|----------|
| `mistral` | 7B | ⚡⚡⚡ | ⭐⭐ | 4GB | Speed-focused |
| `llama3.2` | 8B | ⚡⚡ | ⭐⭐⭐ | 8GB | Balanced |
| `neural-chat` | 7B | ⚡⚡⚡ | ⭐⭐⭐ | 4GB | Chat & QA |
| `llama2` | 13B | ⚡ | ⭐⭐⭐⭐ | 16GB | High quality |
| `mixtral` | 7x8B | ⚡ | ⭐⭐⭐⭐ | 32GB | Expert-level |

Download: `ollama pull <model-name>`

### Cloud (API-based)
| Provider | Model | Speed | Cost | Best For |
|----------|-------|-------|------|----------|
| Gemini | gemini-1.5-flash | ⚡⚡⚡ | $0.075/M in, $0.3/M out | Fast questions |
| Gemini | gemini-1.5-pro | ⚡⚡ | $1.50/M in, $6/M out | High quality |
| OpenAI | gpt-4o-mini | ⚡⚡ | $0.15/M in, $0.6/M out | Good quality |
| OpenAI | gpt-4o | ⚡ | $5/M in, $15/M out | Best quality |

---

## 🔤 Text Embedding Model Options

### Local (Sentence Transformers)
| Model | Dimension | Speed | Quality | RAM | Best For |
|-------|-----------|-------|---------|-----|----------|
| `all-MiniLM-L6-v2` | 384 | ⚡⚡⚡ | ⭐⭐⭐ | 100MB | General (DEFAULT) |
| `paraphrase-multilingual-MiniLM-L12-v2` | 384 | ⚡⚡⚡ | ⭐⭐⭐ | 100MB | Multilingual |
| `all-mpnet-base-v2` | 768 | ⚡⚡ | ⭐⭐⭐⭐ | 200MB | Highest quality |
| `distiluse-base-multilingual-cased-v2` | 512 | ⚡⚡⚡ | ⭐⭐⭐ | 150MB | Multilingual quality |

List more: https://www.sbert.net/docs/pretrained_models.html

### Cloud (API-based)
| Provider | Model | Dimension | Cost | Best For |
|----------|-------|-----------|------|----------|
| OpenAI | text-embedding-3-small | 1536 | $0.02/M tokens | Fast, cheap |
| OpenAI | text-embedding-3-large | 3072 | $0.13/M tokens | Highest quality |
| HuggingFace | sentence-transformers/* | Varies | $0/query (free) | Cost-conscious |

---

## 🖼️ Image Embedding Model Options

### Local (CLIP)
| Model | Dimension | Quality | RAM | Best For |
|-------|-----------|---------|-----|----------|
| `openai/clip-vit-base-patch32` | 512 | ⭐⭐⭐ | 500MB | Balanced (DEFAULT) |
| `openai/clip-vit-large-patch14` | 768 | ⭐⭐⭐⭐ | 1GB | Higher quality |
| `sentence-transformers/clip-ViT-B-32` | 512 | ⭐⭐⭐ | 500MB | Alternative CLIP |

### Cloud (API-based)
| Provider | Approach | Cost | Best For |
|----------|----------|------|----------|
| OpenAI | Use image URL with text embedding | Minimal | Cost-conscious |
| HuggingFace | CLIP API | Minimal | Cost-conscious |

---

## 🔑 API Key Setup

### Getting OpenAI API Key
1. Go to https://platform.openai.com/account/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key immediately (won't be shown again)
5. Add to `.env`:
```env
OPENAI_API_KEY=sk-...
```

### Getting Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Click "Get API Key"
3. Create new API key
4. Copy the key
5. Add to `.env`:
```env
GEMINI_API_KEY=AIzaSy...
```

### Getting Hugging Face API Key
1. Go to https://huggingface.co/settings/tokens
2. Create new token (read access)
3. Copy the token
4. Add to `.env`:
```env
HUGGINGFACE_EMBEDDING_API_KEY=hf_...
```

---

## 💰 Cost Estimation

### Fully Local Setup
- **One-time cost**: Hardware (8GB+ RAM, 10GB storage)
- **Per-question cost**: $0
- **Annual cost**: $0 (if hardware already available)

### Hybrid Setup (Gemini + OpenAI Text + Local Images)
- **Per assessment**: ~$0.001 (for 5 questions)
- **Per embedding**: ~$0.00002 (text), $0 (images)
- **Estimated monthly**: $0-5 (depending on usage)

### Fully Cloud Setup
- **Per assessment**: ~$0.001-0.01
- **Per embedding**: ~$0.0002 (API calls)
- **Estimated monthly**: $5-20 (light use), $50-200 (heavy use)

---

## 🚀 Switching Between Providers

### At Runtime (Via Admin Panel)

1. Go to `http://localhost:5000/admin/ai-settings`
2. Update LLM provider/model
3. Update text embedding provider/model
4. Update image embedding provider/model
5. Add API keys if needed
6. Click Save

Changes take effect immediately.

### Via Environment Variables

Update `.env` and restart backend:
```bash
cd backend
source .benv/bin/activate
# Edit .env
python run.py
```

---

## ✅ Health Check & Testing

### Check Configuration
```python
from app.services import ai_settings

# Get current settings
settings = ai_settings.get_ai_settings()
print(f"LLM Provider: {settings['provider']}")
print(f"Text Embedding: {settings['textEmbeddingProvider']}")
print(f"Image Embedding: {settings['imageEmbeddingProvider']}")
```

### Test LLM
```bash
curl -X POST http://localhost:5000/api/rag/health/llm \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is 2+2?"}'
```

### Test Embeddings
```bash
curl -X POST http://localhost:5000/api/rag/health/embeddings \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test embedding"]}'
```

---

## 🔍 Troubleshooting

### "Connection refused" for Ollama
- Make sure Ollama service is running: `ollama serve`
- Check Ollama is on correct URL (default: `http://localhost:11434`)

### "Invalid API Key" error
- Verify API key is correct and not expired
- Check API key has proper permissions
- For OpenAI: Key should start with `sk-`
- For Gemini: Key should start with `AIzaSy`

### "Model not found" error
- For Ollama: Run `ollama pull <model-name>`
- For cloud APIs: Model name might be case-sensitive
- Verify model is available in your region

### Embeddings are slow
- Consider using faster/smaller models
- Use API-based services for better performance
- Increase batch size in settings

### Out of memory errors
- Reduce model size (use smaller embedding/LLM models)
- Use API-based services instead of local
- Increase system RAM or use cloud solutions

---

## 📚 Additional Resources

- **Ollama Models**: https://ollama.ai/library
- **Sentence Transformers**: https://www.sbert.net/
- **OpenAI Pricing**: https://openai.com/pricing
- **Gemini Pricing**: https://ai.google.dev/pricing
- **HuggingFace Models**: https://huggingface.co/models

---

## ⚙️ Advanced Configuration

### Custom Model Caching
Local models are cached in:
- Linux/Mac: `~/.cache/huggingface/`
- Windows: `%USERPROFILE%\.cache\huggingface\`

To pre-cache models:
```bash
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Batch Processing
Embeddings are processed in batches for efficiency:
```env
# Batch size for embedding API calls (default: 32)
# Increase for faster processing on powerful servers
# Decrease if hitting rate limits
```

### Custom Base URLs
For self-hosted LLMs or proxy services:
```env
# Ollama compatible endpoint
OLLAMA_BASE_URL=http://your-ollama-server:11434

# OpenAI compatible endpoint
OPENAI_API_KEY=your-key
# (will use https://api.openai.com/v1 by default)
```

---

**Questions?** Check the logs at `backend/logs/` for detailed error messages.

**Need help?** See [RAG_IMPLEMENTATION.md](RAG_IMPLEMENTATION.md) for architecture details.
