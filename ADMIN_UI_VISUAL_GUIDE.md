# Admin UI Update - Visual Reference Guide

**Purpose**: Show exactly what needs to be added to the admin page

---

## 📐 Current Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                       AI SETTINGS PAGE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐  Active Provider: Ollama                │
│  │ Administration       │  Generation Rate Limit: 15/min           │
│  │ AI Settings          │  Stored API Key: sk-****...****         │
│  └──────────────────────┘                                         │
│                                                                     │
│  ┌──────────────────────────────┐  ┌─────────────────────────────┐│
│  │ PROVIDER AND RUNTIME         │  │ RATE CONTROL               ││
│  │                              │  │                             ││
│  │ Runtime Mode: Local/API-Key  │  │ ⚙ Generation Limit         ││
│  │ Provider: Ollama/Gemini/etc  │  │   [15 per minute]          ││
│  │ Model: llama3.2              │  │                             ││
│  │ Base URL: ...                │  │ ⚙ Modification Limit       ││
│  │ API Key: [password field]    │  │   [15 per minute]          ││
│  │ Temperature: 0.2             │  │                             ││
│  │ Max Tokens: 1200             │  │ ☐ Fallback to Grounded RAG││
│  │                              │  │                             ││
│  └──────────────────────────────┘  └─────────────────────────────┘│
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ SYSTEM PROMPTS                                              │ │
│  │                                                              │ │
│  │ Assessment Generation System Prompt:                        │ │
│  │ [Large textarea...]                                         │ │
│  │                                                              │ │
│  │ Assessment Modification System Prompt:                      │ │
│  │ [Large textarea...]                                         │ │
│  │                                                              │ │
│  │ Student Chat System Prompt:                                 │ │
│  │ [Large textarea...]                                         │ │
│  │                                                              │ │
│  │ Assessment User Prompt Template:                            │ │
│  │ [Large textarea...]                                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ OPERATOR NOTES                                              │ │
│  │                                                              │ │
│  │ Notes:                                                       │ │
│  │ [Large textarea...]                                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [Save Settings Button]                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Required New Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                       AI SETTINGS PAGE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Admin Header with Save Button] (existing)                        │
│                                                                     │
│  ┌──────────────────────────────┐  ┌─────────────────────────────┐│
│  │ PROVIDER AND RUNTIME         │  │ RATE CONTROL               ││
│  │ (existing section)           │  │ (existing section)         ││
│  └──────────────────────────────┘  └─────────────────────────────┘│
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ SYSTEM PROMPTS                                              │ │
│  │ (existing section)                                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │  ← NEW
│  │ EMBEDDING CONFIGURATION                                     │ │  ← NEW
│  │                                                              │ │  ← NEW
│  │ ┌──────────────────────────┐  ┌─────────────────────────┐  │ │  ← NEW
│  │ │ TEXT EMBEDDINGS          │  │ IMAGE EMBEDDINGS       │  │ │  ← NEW
│  │ │                          │  │                         │  │ │  ← NEW
│  │ │ Provider:                │  │ Provider:               │  │ │  ← NEW
│  │ │ [dropdown v]             │  │ [dropdown v]            │  │ │  ← NEW
│  │ │ Local                    │  │ Local (CLIP)            │  │ │  ← NEW
│  │ │ OpenAI API               │  │ OpenAI API              │  │ │  ← NEW
│  │ │ HuggingFace API          │  │ HuggingFace API         │  │ │  ← NEW
│  │ │ Ollama                   │  │                         │  │ │  ← NEW
│  │ │                          │  │ Model:                  │  │ │  ← NEW
│  │ │ Model:                   │  │ [text input]            │  │ │  ← NEW
│  │ │ [text input]             │  │ openai/clip-vit-...     │  │ │  ← NEW
│  │ │ all-MiniLM-L6-v2         │  │                         │  │ │  ← NEW
│  │ │                          │  │ API Key:                │  │ │  ← NEW
│  │ │ API Key:                 │  │ [password input]        │  │ │  ← NEW
│  │ │ [password input]         │  │ ☐ Remove key on save    │  │ │  ← NEW
│  │ │ ☐ Remove key on save     │  │                         │  │ │  ← NEW
│  │ │                          │  │                         │  │ │  ← NEW
│  │ └──────────────────────────┘  └─────────────────────────┘  │ │  ← NEW
│  │                                                              │ │  ← NEW
│  │ Batch Size for API Calls:                                  │ │  ← NEW
│  │ [32________________] ← Higher for throughput, lower for     │ │  ← NEW
│  │                     rate limiting                           │ │  ← NEW
│  │                                                              │ │  ← NEW
│  │ ℹ️ Provider Support                                          │ │  ← NEW
│  │ • Local (Free): Runs on server, no API needed              │ │  ← NEW
│  │ • OpenAI: $0.02-0.13 per million tokens                    │ │  ← NEW
│  │ • HuggingFace: Free with rate limits                        │ │  ← NEW
│  │ • Ollama: Self-hosted, requires service running            │ │  ← NEW
│  │                                                              │ │  ← NEW
│  └──────────────────────────────────────────────────────────────┘ │  ← NEW
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ OPERATOR NOTES                                              │ │
│  │ (existing section)                                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [Save Settings Button]                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 New Section Detailed View

```
┌────────────────────────────────────────────────────────────────────┐
│ 🎁 EMBEDDING CONFIGURATION                                         │
│ Configure text and image embedding providers for semantic search   │
│ in RAG materials.                                                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌──────────────────────────────┐  ┌───────────────────────────┐  │
│ │ TEXT EMBEDDINGS              │  │ IMAGE EMBEDDINGS          │  │
│ │ For material search & match   │  │ For visual recognition    │  │
│ │                              │  │                           │  │
│ │ Provider *                   │  │ Provider *                │  │
│ │ ┌──────────────────────────┐ │  │ ┌───────────────────────┐ │  │
│ │ │ Local (Sentence-Trans)▼  │ │  │ │ Local (CLIP)        ▼ │ │  │
│ │ │ OpenAI API               │ │  │ │ OpenAI API            │ │  │
│ │ │ HuggingFace API          │ │  │ │ HuggingFace API       │ │  │
│ │ │ Ollama                   │ │  │ │                       │ │  │
│ │ └──────────────────────────┘ │  │ └───────────────────────┘ │  │
│ │                              │  │                           │  │
│ │ Model *                      │  │ Model *                   │  │
│ │ ┌──────────────────────────┐ │  │ ┌───────────────────────┐ │  │
│ │ │ all-MiniLM-L6-v2         │ │  │ │ openai/clip-vit-b-32  │ │  │
│ │ └──────────────────────────┘ │  │ └───────────────────────┘ │  │
│ │ Local: all-MiniLM-L6-v2,    │  │ Local: openai/clip-vit... │  │
│ │ OpenAI: text-embedding-3-.. │  │                           │  │
│ │                              │  │                           │  │
│ │ ⚠️ Only shown if provider    │  │ ⚠️ Only shown if provider │  │
│ │ is not "local":              │  │ is not "local":           │  │
│ │                              │  │                           │  │
│ │ API Key                      │  │ API Key                   │  │
│ │ ┌──────────────────────────┐ │  │ ┌───────────────────────┐ │  │
│ │ │ •••••••••••••••••••••    │ │  │ │ •••••••••••••••••••••  │ │  │
│ │ └──────────────────────────┘ │  │ └───────────────────────┘ │  │
│ │ Paste a new provider key     │  │ Paste a new provider key  │  │
│ │                              │  │                           │  │
│ │ ☐ Remove the stored API key  │  │ ☐ Remove stored API key   │  │
│ │   on save                    │  │   on save                 │  │
│ │                              │  │                           │  │
│ └──────────────────────────────┘  └───────────────────────────┘  │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ Batch Size for API Calls                                       │ │
│ │ ┌────────────────────────────────────────────────────────────┐ │ │
│ │ │ 32                                                         │ │ │
│ │ └────────────────────────────────────────────────────────────┘ │ │
│ │ Higher values (64-128) for better throughput on APIs,        │ │
│ │ lower (16-32) if hitting rate limits                         │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ ℹ️ Provider Support                                             │ │
│ │                                                                 │ │
│ │ • Local (Free): Runs on your server, no API calls needed      │ │
│ │ • OpenAI: $0.02-0.13 per million tokens                       │ │
│ │ • HuggingFace: Free with model-dependent rate limits          │ │
│ │ • Ollama: Self-hosted, requires Ollama service running        │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Form State Management

### defaultForm Addition
```javascript
const defaultForm: AISettingsWritePayload = {
  // ... existing LLM fields ...
  
  // NEW: Text Embedding Fields
  textEmbeddingProvider: "local",
  textEmbeddingModel: "all-MiniLM-L6-v2",
  textEmbeddingApiKey: "",
  clearTextEmbeddingApiKey: false,
  
  // NEW: Image Embedding Fields
  imageEmbeddingProvider: "local",
  imageEmbeddingModel: "openai/clip-vit-base-patch32",
  imageEmbeddingApiKey: "",
  clearImageEmbeddingApiKey: false,
  
  // NEW: Batch Size
  embeddingBatchSize: 32,
};
```

### buildFormFromSettings Update
```javascript
const buildFormFromSettings = (settings?: AIRuntimeSettings) => {
  if (!settings) return defaultForm;
  return {
    // ... existing LLM fields ...
    
    // NEW: Handle embedding fields
    textEmbeddingProvider: settings.textEmbeddingProvider || "local",
    textEmbeddingModel: settings.textEmbeddingModel || "all-MiniLM-L6-v2",
    textEmbeddingApiKey: "", // Always empty for security
    clearTextEmbeddingApiKey: false,
    
    imageEmbeddingProvider: settings.imageEmbeddingProvider || "local",
    imageEmbeddingModel: settings.imageEmbeddingModel || "openai/clip-vit-base-patch32",
    imageEmbeddingApiKey: "", // Always empty for security
    clearImageEmbeddingApiKey: false,
    
    embeddingBatchSize: settings.embeddingBatchSize || 32,
  };
};
```

---

## 🎯 Provider Selection Logic

### Show API Key Input Only If Needed
```javascript
{activeForm.textEmbeddingProvider !== "local" && (
  <div>
    <label>API Key</label>
    <input type="password" ... />
    <label>☐ Remove key on save</label>
  </div>
)}
```

### Model Placeholder by Provider
```javascript
const modelPlaceholder = {
  local: "all-MiniLM-L6-v2",
  openai: "text-embedding-3-small",
  huggingface: "sentence-transformers/all-MiniLM-L6-v2",
  ollama: "nomic-embed-text",
}[activeForm.textEmbeddingProvider] || ""
```

---

## 🔐 Security Considerations

| Field | Type | Handling | Security |
|-------|------|----------|----------|
| textEmbeddingApiKey | password | Masked in UI | ✅ Hidden input |
| imageEmbeddingApiKey | password | Masked in UI | ✅ Hidden input |
| clearTextEmbedding... | checkbox | Triggers deletion | ✅ Explicit flag |
| clearImageEmbedding... | checkbox | Triggers deletion | ✅ Explicit flag |

**Always use `type="password"` for API keys** ✅

---

## 🧪 Test Scenarios

### Test Case 1: Switch to OpenAI
1. Select textEmbeddingProvider = "openai"
2. Model field appears
3. API Key field appears
4. Enter API key
5. Click Save
6. Verify in browser DevTools → Network
7. Confirm response shows updated settings

### Test Case 2: Clear API Key
1. Existing API key is set
2. Check "Remove stored API key on save"
3. Leave API key field empty
4. Click Save
5. Verify key is cleared

### Test Case 3: Batch Size Validation
1. Enter embeddingBatchSize = 0 (invalid)
2. Should not allow save or show error
3. Enter embeddingBatchSize = 256 (valid)
4. Save succeeds

### Test Case 4: Switch Providers
1. Start with local provider
2. Change to openai
3. Save
4. Change back to local
5. Verify smooth transition

---

## 📦 Component Props & Functions

### New Hooks Needed
```typescript
// Already have these, just use them:
const [form, setForm] = useState<AISettingsWritePayload>(defaultForm);
const [isFormDirty, setIsFormDirty] = useState(false);

// Update helper (already exists)
const mutateForm = (updater: (current: AISettingsWritePayload) => AISettingsWritePayload) => {
  setForm((current) => updater(isFormDirty ? current : syncedForm));
  setIsFormDirty(true);
};
```

### New Selects to Add
```typescript
<select
  value={activeForm.textEmbeddingProvider}
  onChange={(e) => mutateForm(current => ({
    ...current,
    textEmbeddingProvider: e.target.value as any,
  }))}
>
  <option value="local">Local (Sentence-Transformers)</option>
  <option value="openai">OpenAI API</option>
  <option value="huggingface">HuggingFace API</option>
  <option value="ollama">Ollama</option>
</select>
```

---

## 🎨 Tailwind Classes to Use

```typescript
// Consistent with existing design
fieldClass = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"

// For section containers
"rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"

// For subsections
"rounded-2xl border border-slate-200 bg-slate-50 p-4"

// For info box
"rounded-2xl border border-blue-200 bg-blue-50 p-4 flex gap-3"
```

---

**Total additions**: ~200 lines of JSX + ~50 lines of TypeScript = ~250 lines total
