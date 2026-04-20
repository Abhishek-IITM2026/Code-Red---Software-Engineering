# RAG AI Settings - Admin Operations Guide

**For**: System Administrators and Deployment Teams  
**Last Updated**: April 2026

---

## 📋 Quick Operations

### Operation 1: Switch to Fully Local Setup (First Time)

1. **Install Ollama** (10 minutes)
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama serve &  # Start in background
   ```

2. **Pull Models** (5 minutes)
   ```bash
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

3. **Update .env** (1 minute)
   ```bash
   cd backend
   cat >> .env << 'EOF'
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   RAG_TEXT_EMBEDDING_PROVIDER=local
   RAG_IMAGE_EMBEDDING_PROVIDER=local
   EOF
   ```

4. **Restart Backend** (1 minute)
   ```bash
   pkill -f "python run.py"
   python run.py &
   ```

5. **Verify** (2 minutes)
   - Go to `http://localhost:5000/admin/ai-settings`
   - Confirm all providers show as "local"

---

### Operation 2: Migrate to Hybrid Setup (API + Local)

1. **Get API Keys** (5 minutes)
   - Gemini: https://aistudio.google.com/app/apikey
   - OpenAI: https://platform.openai.com/api-keys

2. **Update .env** (1 minute)
   ```bash
   cat >> .env << 'EOF'
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-1.5-flash
   RAG_TEXT_EMBEDDING_PROVIDER=openai
   OPENAI_EMBEDDING_API_KEY=sk-...
   RAG_TEXT_EMBEDDING_PROVIDER=openai
   RAG_IMAGE_EMBEDDING_PROVIDER=local
   EOF
   ```

3. **Restart Backend** (1 minute)
   ```bash
   pkill -f "python run.py"
   python run.py &
   ```

4. **Admin UI Update** (2 minutes)
   - Go to `http://localhost:5000/admin/ai-settings`
   - Or let environment variables auto-load

---

### Operation 3: Update Embedding Model (Zero Downtime)

1. **Via Admin UI** (immediate)
   - Go to `http://localhost:5000/admin/ai-settings`
   - Change `textEmbeddingModel` to new model
   - Click Save
   - **Changes take effect immediately**

2. **Or Via .env + Restart** (5 minutes)
   ```bash
   # Edit .env
   RAG_TEXT_MODEL=all-mpnet-base-v2
   
   # Restart
   pkill -f "python run.py"
   python run.py &
   ```

---

### Operation 4: Emergency Fallback (API Down)

If OpenAI/Gemini API is down:

1. **Switch to Local** (1 minute)
   ```bash
   # Via admin UI or .env
   RAG_TEXT_EMBEDDING_PROVIDER=local
   RAG_TEXT_EMBEDDING_PROVIDER=local
   ```

2. **Restart** (1 minute)
   ```bash
   pkill -f "python run.py"
   python run.py &
   ```

**Note**: Local models are automatically fallback when API calls fail

---

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

```
LLM Performance:
├── Requests per day
├── Average latency
├── Error rate
└── Cost per question

Embedding Performance:
├── Texts embedded per day
├── Images embedded per day
├── Average latency
└── Cost per embedding

Resource Usage:
├── Memory consumption
├── Disk space (for cached models)
├── Network bandwidth
└── CPU utilization
```

### Health Check Commands

```bash
# Check LLM
curl -X POST http://localhost:5000/api/rag/health/llm \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'

# Check text embeddings
curl -X POST http://localhost:5000/api/rag/health/embeddings \
  -H "Content-Type: application/json" \
  -d '{"texts": ["test"]}'

# Check image embeddings
curl -X POST http://localhost:5000/api/rag/health/embeddings/images \
  -H "Content-Type: application/json" \
  -d '{"image_urls": ["http://example.com/image.jpg"]}'
```

---

## 🔧 Troubleshooting

### Issue: Ollama Connection Error

**Symptom**: "Connection refused on localhost:11434"

**Solutions**:
```bash
# Check if Ollama is running
pgrep ollama

# Start Ollama if not running
ollama serve &

# Check if service is on correct port
netstat -tlnp | grep 11434

# Try with explicit URL
curl http://localhost:11434/api/tags
```

---

### Issue: API Key Invalid

**Symptom**: "Invalid API key" error

**Solutions**:
```bash
# Verify key format
# Gemini: Should start with AIzaSy
# OpenAI: Should start with sk-

# Test API key directly
curl -X POST https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer sk-YOUR-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "test",
    "model": "text-embedding-3-small"
  }'

# Check .env file
cat backend/.env | grep API_KEY

# Verify in MongoDB
db.ai_settings.findOne()
```

---

### Issue: Out of Memory

**Symptom**: "MemoryError" when using local models

**Solutions**:
```bash
# Check available memory
free -h

# Use smaller models
# In .env:
RAG_TEXT_MODEL=all-MiniLM-L6-v2  # (384 dim, 100MB)

# Or switch to API
RAG_TEXT_EMBEDDING_PROVIDER=openai

# Check model cache size
du -sh ~/.cache/huggingface/

# Clear cache if needed
rm -rf ~/.cache/huggingface/
```

---

### Issue: Slow Embeddings

**Symptom**: Embeddings taking >5 seconds per batch

**Solutions**:
```bash
# Switch to API (typically faster)
RAG_TEXT_EMBEDDING_PROVIDER=openai

# Increase batch size (if using API)
RAG_EMBEDDING_BATCH_SIZE=64  # (default: 32)

# Or increase batch size (if using local)
# Check backend/app/rag/multimodal/service.py

# Use GPU acceleration (if available)
# CUDA_VISIBLE_DEVICES=0 python run.py
```

---

## 💰 Cost Tracking

### Monthly Cost Estimation

```python
# API Calls
def estimate_monthly_cost(questions_per_month=100):
    # Gemini LLM: 5 questions per assessment
    llm_tokens = questions_per_month * 5 * 1000  # avg tokens
    gemini_cost = llm_tokens * 0.000075  # $0.075 per M tokens
    
    # OpenAI Text Embeddings
    embeddings = questions_per_month * 100  # 100 embeddings per Q
    openai_cost = embeddings * 0.00002  # $0.02 per M tokens (approx)
    
    total = gemini_cost + openai_cost
    return total

# Examples:
# 100 Q/month: $0.30
# 1000 Q/month: $3.00
# 10000 Q/month: $30.00
```

### Set Up Cost Alerts

```bash
# In your monitoring system:
# Alert if daily cost > $10
# Alert if API usage > 80% of quota
# Alert if embedding latency > 2 seconds
```

---

## 🔐 Security Operations

### API Key Rotation (Recommended: Monthly)

1. **Generate New Key**
   - Gemini: https://aistudio.google.com/app/apikey
   - OpenAI: https://platform.openai.com/api-keys

2. **Update in Code-Red**
   ```bash
   # Via admin UI
   http://localhost:5000/admin/ai-settings
   # Update textEmbeddingApiKey
   # Click Save
   ```

3. **Revoke Old Key**
   - Gemini: Delete old key from dashboard
   - OpenAI: Delete old key from dashboard

### Audit Trail

Monitor logs for API key usage:
```bash
# Check logs
tail -f backend/logs/rag.log | grep -i "api_key"

# Search for failed auth attempts
grep "Invalid API key" backend/logs/rag.log
```

---

## 📈 Scaling Operations

### For Increasing Load

**Current Setup Limits**:
- Local embeddings: ~500 texts/sec
- OpenAI API: ~3000 texts/sec (with rate limiting)

**To Scale**:

1. **Increase batch size** (if using API)
   ```bash
   RAG_EMBEDDING_BATCH_SIZE=128  # (from 32)
   ```

2. **Add caching layer**
   ```python
   # Cache frequently embedded texts
   @cache.cached()
   def embed_material_section(text):
       return get_embedding(text)
   ```

3. **Use multi-threading** (if using API)
   ```python
   from concurrent.futures import ThreadPoolExecutor
   with ThreadPoolExecutor(max_workers=4) as executor:
       # Process multiple embedding batches in parallel
   ```

4. **Switch to API for everything**
   ```bash
   RAG_TEXT_EMBEDDING_PROVIDER=openai
   RAG_IMAGE_EMBEDDING_PROVIDER=openai
   ```

---

## 📋 Maintenance Schedule

### Daily
- [ ] Check logs for errors
- [ ] Monitor API costs
- [ ] Verify health checks pass

### Weekly
- [ ] Review error logs
- [ ] Monitor embedding latency trends
- [ ] Verify all models are responsive

### Monthly
- [ ] Rotate API keys
- [ ] Review cost trends
- [ ] Update documentation if needed
- [ ] Test emergency fallback procedures

### Quarterly
- [ ] Review provider performance
- [ ] Consider switching providers if needed
- [ ] Audit access logs
- [ ] Update security policies

---

## 🚨 Emergency Procedures

### If API Provider Down (OpenAI, Gemini)

**Automatic**: System should fall back to local models

**Manual Verification**:
```bash
# Check logs
grep "API error" backend/logs/rag.log

# Verify fallback is working
curl http://localhost:5000/api/rag/health/embeddings

# Force local mode if needed
# Edit .env
RAG_TEXT_EMBEDDING_PROVIDER=local
pkill -f "python run.py"
python run.py &
```

### If Database Down (MongoDB)

**Fallback**: System uses environment variable defaults

**Recovery**:
```bash
# Restore MongoDB from backup
# Re-initialize ai_settings collection
python << 'EOF'
from app.services.ai_settings import initialize_ai_settings
initialize_ai_settings()
EOF
```

### If Ollama Service Down

**Symptom**: "Connection refused" errors

**Recovery**:
```bash
# Restart Ollama
ollama serve &

# Restart backend to re-connect
pkill -f "python run.py"
python run.py &

# Or switch to API
RAG_TEXT_EMBEDDING_PROVIDER=openai
```

---

## 📞 Support Contacts

| Issue | Contact | Time |
|-------|---------|------|
| API Provider Down | OpenAI/Gemini Status | 1-2 hours |
| Network Issues | IT Team | ASAP |
| Database Issues | DB Team | ASAP |
| Local Model Issues | Support Team | 30 mins |

---

## ✅ Deployment Checklist

Before going to production:

- [ ] All environment variables configured
- [ ] API keys rotated and secure
- [ ] Health checks passing
- [ ] Monitoring and alerts set up
- [ ] Backup procedures documented
- [ ] Disaster recovery plan ready
- [ ] Cost tracking enabled
- [ ] Security audit completed
- [ ] Performance baseline established
- [ ] Team trained on procedures

---

**Last Updated**: April 2026  
**Maintained By**: DevOps Team  
**Next Review**: Quarterly
