# RAG AI Settings - Quick Setup Reference

**Latest Update**: April 2026

---

## 🚀 5-Minute Setup Guide

### Option A: Fully Local (Recommended for Privacy)

**Environment (.env file):**
```env
# LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Embeddings
RAG_TEXT_EMBEDDING_PROVIDER=local
RAG_IMAGE_EMBEDDING_PROVIDER=local
```

**Installation:**
```bash
# 1. Install Ollama from https://ollama.ai
# 2. Start Ollama
ollama serve

# 3. In another terminal, pull models
ollama pull llama3.2
ollama pull nomic-embed-text

# 4. Start Code-Red backend
cd backend && source .benv/bin/activate && python run.py
```

---

### Option B: Hybrid (Recommended for Production)

**Environment (.env file):**
```env
# LLM (Fast cloud)
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-flash

# Text Embeddings (High quality)
RAG_TEXT_EMBEDDING_PROVIDER=openai
RAG_TEXT_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_API_KEY=sk-...

# Image Embeddings (Free local)
RAG_IMAGE_EMBEDDING_PROVIDER=local
```

**Setup:**
```bash
# 1. Get API keys from:
#    - Gemini: https://aistudio.google.com/app/apikey
#    - OpenAI: https://platform.openai.com/api-keys
#
# 2. Add keys to .env
#
# 3. Start backend
cd backend && source .benv/bin/activate && python run.py
```

---

### Option C: Cloud Only (Simple)

**Environment (.env file):**
```env
# All APIs
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...

# Config
RAG_TEXT_EMBEDDING_PROVIDER=openai
RAG_TEXT_MODEL=text-embedding-3-small
RAG_IMAGE_EMBEDDING_PROVIDER=openai
```

---

## 📋 Provider Support Matrix

| Component | Local | OpenAI | HuggingFace | Ollama |
|-----------|:-----:|:------:|:-----------:|:------:|
| LLM | ✅ | ✅ | - | ✅ |
| Text Embedding | ✅ | ✅ | ✅ | ✅ |
| Image Embedding | ✅ | ✅ | ✅ | ❌ |

---

## 🔑 API Key Quick Links

| Service | Link | Cost |
|---------|------|------|
| Gemini (LLM) | https://aistudio.google.com/app/apikey | Free tier available |
| OpenAI (Text Embedding) | https://platform.openai.com/api-keys | $0.02-0.13 per M tokens |
| OpenAI (Image Embedding) | Same as above | Same pricing |
| HuggingFace (Text/Image) | https://huggingface.co/settings/tokens | Free |

---

## 💻 System Requirements

| Setup | RAM | Storage | CPU | Network |
|-------|-----|---------|-----|---------|
| **Local Only** | 8GB+ | 10GB | Medium | Optional |
| **Hybrid** | 4GB | 2GB | Low | Required |
| **Cloud Only** | 2GB | 1GB | Low | Required |

---

## 🎯 Model Recommendations

### Best Overall (Balanced Cost/Quality)
```env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-flash

RAG_TEXT_EMBEDDING_PROVIDER=openai
RAG_TEXT_MODEL=text-embedding-3-small

RAG_IMAGE_EMBEDDING_PROVIDER=local
```

### Best Budget (Free)
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

RAG_TEXT_EMBEDDING_PROVIDER=local
RAG_IMAGE_EMBEDDING_PROVIDER=local
```

### Best Quality (Higher Cost)
```env
OPENAI_API_KEY=sk-...
# (This would use OpenAI LLM)

RAG_TEXT_EMBEDDING_PROVIDER=openai
RAG_TEXT_MODEL=text-embedding-3-large

RAG_IMAGE_EMBEDDING_PROVIDER=openai
```

---

## ✅ Configuration Checklist

- [ ] Choose setup option (A, B, or C)
- [ ] Get required API keys
- [ ] Create/update `.env` file
- [ ] For Option A: Install Ollama and pull models
- [ ] Start Code-Red backend
- [ ] Visit `http://localhost:5000/admin/ai-settings`
- [ ] Verify all providers are configured correctly
- [ ] Test with a sample question or material upload

---

## 🔄 Switching Providers (Live)

1. Go to `http://localhost:5000/admin/ai-settings`
2. Change provider/model/API key
3. Click "Save"
4. Changes take effect immediately - no restart needed

---

## 📊 Cost Estimation

### Monthly Costs (Sample: 100 questions/month)

**Option A (Local):**
- $0 (one-time hardware cost)

**Option B (Hybrid):**
- Gemini: ~$0.10
- OpenAI Embeddings: ~$0.20
- **Total: ~$0.30/month**

**Option C (Cloud):**
- Gemini: ~$0.10
- OpenAI All: ~$0.40
- **Total: ~$0.50/month**

---

## 📞 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Ollama connection error | Check `ollama serve` is running |
| API key error | Verify key format and permissions |
| Model not found | Run `ollama pull model-name` |
| Out of memory | Use smaller models or API-based |
| Embeddings timeout | Increase batch size or use API |

---

**Full documentation:** See [RAG_AI_CONFIGURATION.md](RAG_AI_CONFIGURATION.md)
