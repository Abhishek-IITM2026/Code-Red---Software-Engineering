# Admin AI Settings Page - Update Requirements Analysis

**Date**: April 20, 2026  
**Status**: ⚠️ **SIGNIFICANT UPDATES REQUIRED**

---

## 📋 Executive Summary

The AI Settings admin page **DOES REQUIRE UPDATES** to support the new embedding provider configuration system. Currently, the page only handles LLM configuration, but the backend has been extended to support configurable text and image embedding providers.

**Impact Level**: HIGH  
**Complexity**: MEDIUM  
**Estimated Effort**: 4-6 hours

---

## 🔍 Current State vs New Requirements

### What Was Added to Backend

✅ **backend/app/services/ai_settings.py**
- Added 10 new embedding-related fields to DEFAULT_AI_SETTINGS
- Updated `get_ai_settings()` and `update_ai_settings()` to handle embeddings

✅ **backend/app/core/settings.py**
- Added 23 environment variables for embedding configuration

✅ **backend/app/rag/multimodal/embedding_clients.py**
- NEW module with pluggable embedding providers

---

### What's Missing (Frontend)

❌ **backend/app/schemas/administration.py (AISettingsWriteRequest)**
- Missing embedding provider fields

❌ **frontend/src/features/administration/api/adminApi.ts**
- AISettings interface - Missing embedding fields
- AISettingsWritePayload type - Missing embedding fields

❌ **frontend/src/features/administration/pages/AISettings.tsx**
- No UI for text embedding provider selection
- No UI for image embedding provider selection
- No UI for embedding API keys
- No UI for embedding batch size

---

## 📝 Detailed Requirements

### 1. Backend Schema Update Required

**File**: `backend/app/schemas/administration.py`  
**Class**: `AISettingsWriteRequest`

**Add Fields**:
```python
# Text Embedding Configuration
text_embedding_provider: Literal["local", "openai", "huggingface", "ollama"] = Field(
    default="local", alias="textEmbeddingProvider"
)
text_embedding_model: str = Field(default="all-MiniLM-L6-v2", alias="textEmbeddingModel")
text_embedding_api_key: str | None = Field(default=None, alias="textEmbeddingApiKey")
clear_text_embedding_api_key: bool = Field(default=False, alias="clearTextEmbeddingApiKey")

# Image Embedding Configuration
image_embedding_provider: Literal["local", "openai", "huggingface"] = Field(
    default="local", alias="imageEmbeddingProvider"
)
image_embedding_model: str = Field(default="openai/clip-vit-base-patch32", alias="imageEmbeddingModel")
image_embedding_api_key: str | None = Field(default=None, alias="imageEmbeddingApiKey")
clear_image_embedding_api_key: bool = Field(default=False, alias="clearImageEmbeddingApiKey")

# Batch Configuration
embedding_batch_size: int = Field(default=32, alias="embeddingBatchSize")
```

---

### 2. Frontend API Types Update Required

**File**: `frontend/src/features/administration/api/adminApi.ts`

**Update AISettings interface** (read from backend):
```typescript
export interface AISettings {
  // ... existing fields ...
  textEmbeddingProvider: "local" | "openai" | "huggingface" | "ollama";
  textEmbeddingModel: string;
  textEmbeddingDimension?: number;
  textEmbeddingApiKeyPreview?: string | null;
  
  imageEmbeddingProvider: "local" | "openai" | "huggingface";
  imageEmbeddingModel: string;
  imageEmbeddingDimension?: number;
  imageEmbeddingApiKeyPreview?: string | null;
  
  embeddingBatchSize: number;
  hasTextEmbeddingApiKey?: boolean;
  hasImageEmbeddingApiKey?: boolean;
}
```

**Update AISettingsWritePayload type** (write to backend):
```typescript
export type AISettingsWritePayload = {
  // ... existing fields ...
  textEmbeddingProvider?: "local" | "openai" | "huggingface" | "ollama";
  textEmbeddingModel?: string;
  textEmbeddingApiKey?: string | null;
  clearTextEmbeddingApiKey?: boolean;
  
  imageEmbeddingProvider?: "local" | "openai" | "huggingface";
  imageEmbeddingModel?: string;
  imageEmbeddingApiKey?: string | null;
  clearImageEmbeddingApiKey?: boolean;
  
  embeddingBatchSize?: number;
};
```

---

### 3. Frontend UI Component Update Required

**File**: `frontend/src/features/administration/pages/AISettings.tsx`

**Add to defaultForm**:
```typescript
const defaultForm: AISettingsWritePayload = {
  // ... existing fields ...
  
  // Text Embeddings
  textEmbeddingProvider: "local",
  textEmbeddingModel: "all-MiniLM-L6-v2",
  textEmbeddingApiKey: "",
  clearTextEmbeddingApiKey: false,
  
  // Image Embeddings
  imageEmbeddingProvider: "local",
  imageEmbeddingModel: "openai/clip-vit-base-patch32",
  imageEmbeddingApiKey: "",
  clearImageEmbeddingApiKey: false,
  
  // Batch Configuration
  embeddingBatchSize: 32,
};
```

**Add UI Section** (after "System Prompts" section):
```typescript
// New Embeddings Configuration Section
<section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
  <div className="flex items-center gap-3">
    <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
      <FiPackage className="h-5 w-5" />  {/* or appropriate icon */}
    </div>
    <div>
      <p className="text-lg font-semibold text-slate-900">Embedding Configuration</p>
      <p className="text-sm text-slate-500">
        Configure text and image embedding providers for semantic search in RAG materials.
      </p>
    </div>
  </div>

  <div className="mt-6 grid gap-6 lg:grid-cols-2">
    {/* TEXT EMBEDDINGS SUBSECTION */}
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-900">Text Embeddings</h3>
      <p className="mt-1 text-xs text-slate-600">For material search and semantic matching</p>
      
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700">Provider</label>
          <select
            value={activeForm.textEmbeddingProvider || "local"}
            onChange={(e) => mutateForm(current => ({
              ...current,
              textEmbeddingProvider: e.target.value as any,
            }))}
            className={fieldClass}
          >
            <option value="local">Local (Sentence-Transformers)</option>
            <option value="openai">OpenAI API</option>
            <option value="huggingface">HuggingFace API</option>
            <option value="ollama">Ollama</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs font-medium text-slate-700">Model</label>
          <input
            value={activeForm.textEmbeddingModel || ""}
            onChange={(e) => mutateForm(current => ({
              ...current,
              textEmbeddingModel: e.target.value,
            }))}
            className={fieldClass}
            placeholder="Example: all-MiniLM-L6-v2 or text-embedding-3-small"
          />
          <p className="mt-1 text-xs text-slate-500">
            Local: all-MiniLM-L6-v2, OpenAI: text-embedding-3-small
          </p>
        </div>
        
        {activeForm.textEmbeddingProvider !== "local" && (
          <div>
            <label className="text-xs font-medium text-slate-700">API Key</label>
            <input
              type="password"
              value={activeForm.textEmbeddingApiKey || ""}
              onChange={(e) => mutateForm(current => ({
                ...current,
                textEmbeddingApiKey: e.target.value,
                clearTextEmbeddingApiKey: false,
              }))}
              className={fieldClass}
              placeholder="Paste API key for external provider"
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={activeForm.clearTextEmbeddingApiKey || false}
                onChange={(e) => mutateForm(current => ({
                  ...current,
                  clearTextEmbeddingApiKey: e.target.checked,
                  textEmbeddingApiKey: e.target.checked ? "" : current.textEmbeddingApiKey,
                }))}
                className="h-3 w-3"
              />
              Remove stored key on save
            </label>
          </div>
        )}
      </div>
    </div>

    {/* IMAGE EMBEDDINGS SUBSECTION */}
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-900">Image Embeddings</h3>
      <p className="mt-1 text-xs text-slate-600">For visual material recognition</p>
      
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700">Provider</label>
          <select
            value={activeForm.imageEmbeddingProvider || "local"}
            onChange={(e) => mutateForm(current => ({
              ...current,
              imageEmbeddingProvider: e.target.value as any,
            }))}
            className={fieldClass}
          >
            <option value="local">Local (CLIP)</option>
            <option value="openai">OpenAI API</option>
            <option value="huggingface">HuggingFace API</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs font-medium text-slate-700">Model</label>
          <input
            value={activeForm.imageEmbeddingModel || ""}
            onChange={(e) => mutateForm(current => ({
              ...current,
              imageEmbeddingModel: e.target.value,
            }))}
            className={fieldClass}
            placeholder="Example: openai/clip-vit-base-patch32"
          />
          <p className="mt-1 text-xs text-slate-500">
            Local: openai/clip-vit-base-patch32
          </p>
        </div>
        
        {activeForm.imageEmbeddingProvider !== "local" && (
          <div>
            <label className="text-xs font-medium text-slate-700">API Key</label>
            <input
              type="password"
              value={activeForm.imageEmbeddingApiKey || ""}
              onChange={(e) => mutateForm(current => ({
                ...current,
                imageEmbeddingApiKey: e.target.value,
                clearImageEmbeddingApiKey: false,
              }))}
              className={fieldClass}
              placeholder="Paste API key for external provider"
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={activeForm.clearImageEmbeddingApiKey || false}
                onChange={(e) => mutateForm(current => ({
                  ...current,
                  clearImageEmbeddingApiKey: e.target.checked,
                  imageEmbeddingApiKey: e.target.checked ? "" : current.imageEmbeddingApiKey,
                }))}
                className="h-3 w-3"
              />
              Remove stored key on save
            </label>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* BATCH SIZE CONFIGURATION */}
  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <label className="text-xs font-medium text-slate-700">Batch Size for API Calls</label>
    <input
      type="number"
      min="1"
      max="256"
      value={activeForm.embeddingBatchSize || 32}
      onChange={(e) => mutateForm(current => ({
        ...current,
        embeddingBatchSize: Math.max(1, parseInt(e.target.value, 10) || 32),
      }))}
      className={fieldClass}
    />
    <p className="mt-1 text-xs text-slate-500">
      Higher values (64-128) for better throughput on APIs, lower (16-32) if hitting rate limits
    </p>
  </div>

  {/* INFO SECTION */}
  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
    <FiInfo className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700" />
    <div>
      <p className="text-sm font-medium text-blue-900">Provider Support</p>
      <ul className="mt-1 space-y-1 text-xs text-blue-800">
        <li>• <strong>Local (Free):</strong> Runs on your server, no API calls needed</li>
        <li>• <strong>OpenAI:</strong> $0.02-0.13 per million tokens</li>
        <li>• <strong>HuggingFace:</strong> Free with model-dependent rate limits</li>
        <li>• <strong>Ollama:</strong> Self-hosted, requires Ollama service running</li>
      </ul>
    </div>
  </div>
</section>
```

---

## 📊 Update Checklist

### Backend
- [ ] Update `AISettingsWriteRequest` in `backend/app/schemas/administration.py`
  - Add 8 embedding fields + 2 clear flags
  - Add validators for provider choices if needed
  - Add batch size validation (1-256 range)

### Frontend API
- [ ] Update `AISettings` interface in `adminApi.ts`
- [ ] Update `AISettingsWritePayload` type in `adminApi.ts`

### Frontend UI
- [ ] Import new icons (`FiPackage`, `FiInfo`) in AISettings.tsx
- [ ] Update `defaultForm` object
- [ ] Update `buildFormFromSettings()` function
- [ ] Add new embedding configuration section to the form
- [ ] Update CSS classes and styling to match existing design

### Testing
- [ ] Test switching between embedding providers (local → API → local)
- [ ] Test API key input and masking
- [ ] Test batch size validation (min 1, max 256)
- [ ] Test form persistence across page navigation
- [ ] Test "Clear API Key" checkbox functionality
- [ ] Verify settings save correctly to MongoDB
- [ ] Test reading settings back from backend

---

## 🎨 UI/UX Considerations

### Layout Strategy
The page is already quite full. Recommend:
1. **Option A**: Add new section below "System Prompts" (current approach)
2. **Option B**: Use tabs (LLM, Embeddings, Prompts, Rate Limits)
3. **Option C**: Collapsible sections for advanced configuration

**Recommendation**: Option A (minimal changes) since it follows existing pattern

### Mobile Responsiveness
- Embeddings section should stack on mobile
- Input fields should be full width on mobile (currently at `w-full`)
- Consider if 2-column layout for text/image embeddings works on small screens

### Information Architecture
Group related fields:
- **Text Embeddings**: provider + model + API key (+ clear checkbox)
- **Image Embeddings**: provider + model + API key (+ clear checkbox)
- **Configuration**: batch size only

---

## 🚀 Implementation Order

1. **Backend Schema** (15 mins)
   - Update `AISettingsWriteRequest` with new fields
   - Add simple validators

2. **Frontend API** (10 mins)
   - Update TypeScript interfaces
   - Test compilation

3. **Frontend UI - Core** (45 mins)
   - Add form fields to defaultForm
   - Update buildFormFromSettings()
   - Add basic input controls (selects, inputs, checkboxes)

4. **Frontend UI - Styling** (30 mins)
   - Add container sections
   - Apply Tailwind classes
   - Make responsive

5. **Testing** (60 mins)
   - End-to-end testing
   - Error handling
   - Edge cases (clearing keys, switching providers)

**Total**: ~2.5-3 hours

---

## 💾 Data Persistence

The backend already handles this through:
- `ai_settings.py::update_ai_settings()` - saves to MongoDB
- `ai_settings.py::get_ai_settings()` - retrieves from MongoDB

Frontend just needs to:
1. Send new fields in payload
2. Receive new fields in response
3. Store in React state

---

## 🔒 Security Notes

✅ API keys are already masked in the UI (`placeholder={data?.apiKeyPreview}`)
✅ Use `type="password"` for all API key inputs (already shown in code above)
✅ The `clearTextEmbeddingApiKey` and `clearImageEmbeddingApiKey` flags prevent accidental key leaks
✅ Never log full API keys

---

## 📚 Reference Documentation

See the documentation created earlier:
- [RAG_AI_CONFIGURATION.md](RAG_AI_CONFIGURATION.md) - Complete setup guide
- [RAG_QUICK_SETUP.md](RAG_QUICK_SETUP.md) - Quick reference
- [RAG_INTEGRATION_GUIDE.md](RAG_INTEGRATION_GUIDE.md) - For developers

---

## ⚠️ Breaking Changes

✅ **No breaking changes** - New fields are optional with defaults
- Existing code continues to work
- New features gracefully degrade if not configured
- Backward compatible with existing deployments

---

## ❓ Questions Before Implementation?

1. Should we reorganize the form into tabs for clarity?
2. Should we add preset configurations (Local Only, Hybrid, Cloud)?
3. Should we add a "test connection" button for each provider?
4. Should embedding configs be collapsed by default (accordion style)?

---

**Summary**: Admin UI update is **required** but **straightforward**. The backend is ready, frontend needs TypeScript types and UI components. Estimated 2.5-3 hours to complete.
