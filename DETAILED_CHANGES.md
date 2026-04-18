# Detailed Change Reference

## Files Modified Summary

| File | Changes | Lines |
|------|---------|-------|
| `backend/app/services/ai_settings.py` | Added 4 prompts to defaults, updated get/update functions | +20 |
| `backend/app/schemas/administration.py` | Added 4 fields to AISettingsWriteRequest schema | +4 |
| `backend/app/rag/assessment/llm.py` | Changed 2 system_prompt assignments to use settings | +10 |
| `backend/app/rag/student_chat.py` | Changed 1 system_prompt assignment to use settings | +5 |
| `frontend/src/features/administration/api/adminApi.ts` | Extended 2 interfaces with prompt fields | +8 |
| `frontend/src/features/administration/pages/AISettings.tsx` | Updated defaultForm, buildFormFromSettings, added UI section | +80 |

## Detailed File Changes

### 1. backend/app/services/ai_settings.py

#### BEFORE (Line 10-23)
```python
DEFAULT_AI_SETTINGS: dict[str, Any] = {
    "provider": "ollama",
    "mode": "local",
    "model": DEFAULT_OLLAMA_MODEL,
    "baseUrl": DEFAULT_OLLAMA_BASE_URL,
    "apiKey": None,
    "temperature": 0.2,
    "maxTokens": 1200,
    "generationRateLimit": "15 per minute",
    "modificationRateLimit": "15 per minute",
    "fallbackToGroundedRag": True,
    "notes": None,
    "updatedAt": None,
}
```

#### AFTER (Line 10-28)
```python
DEFAULT_AI_SETTINGS: dict[str, Any] = {
    "provider": "ollama",
    "mode": "local",
    "model": DEFAULT_OLLAMA_MODEL,
    "baseUrl": DEFAULT_OLLAMA_BASE_URL,
    "apiKey": None,
    "temperature": 0.2,
    "maxTokens": 1200,
    "generationRateLimit": "15 per minute",
    "modificationRateLimit": "15 per minute",
    "fallbackToGroundedRag": True,
    "notes": None,
    # NEW FIELDS:
    "assessmentSystemPrompt": "You are a careful academic assessment generator. Use only the provided context and return machine-readable JSON.",
    "assessmentModifySystemPrompt": "You are a careful academic assessment editor. Use only the provided context and return machine-readable JSON.",
    "studentChatSystemPrompt": "You are a careful academic tutor. Return concise JSON that matches the required schema, and make the answer field polished Markdown.",
    "assessmentUserPromptTemplate": "Generate assessment questions for {subject} at {difficulty} level with {questionCount} questions totaling {totalMarks} marks.",
    "updatedAt": None,
}
```

---

### 2. backend/app/schemas/administration.py

#### BEFORE (Line 25-38)
```python
class AISettingsWriteRequest(StrictModel):
    provider: Literal["grounded-rag", "ollama", "openai-compatible-cloud", "openai-compatible-local", "gemini"] = "ollama"
    mode: Literal["local", "api-key"] = "local"
    model: str = "llama3.2"
    base_url: str | None = Field(default=None, alias="baseUrl")
    api_key: str | None = Field(default=None, alias="apiKey")
    clear_api_key: bool = Field(default=False, alias="clearApiKey")
    temperature: float = 0.2
    max_tokens: int = Field(default=1200, alias="maxTokens")
    generation_rate_limit: str = Field(default="15 per minute", alias="generationRateLimit")
    modification_rate_limit: str = Field(default="15 per minute", alias="modificationRateLimit")
    fallback_to_grounded_rag: bool = Field(default=True, alias="fallbackToGroundedRag")
    notes: str | None = None
```

#### AFTER (Line 25-42)
```python
class AISettingsWriteRequest(StrictModel):
    provider: Literal["grounded-rag", "ollama", "openai-compatible-cloud", "openai-compatible-local", "gemini"] = "ollama"
    mode: Literal["local", "api-key"] = "local"
    model: str = "llama3.2"
    base_url: str | None = Field(default=None, alias="baseUrl")
    api_key: str | None = Field(default=None, alias="apiKey")
    clear_api_key: bool = Field(default=False, alias="clearApiKey")
    temperature: float = 0.2
    max_tokens: int = Field(default=1200, alias="maxTokens")
    generation_rate_limit: str = Field(default="15 per minute", alias="generationRateLimit")
    modification_rate_limit: str = Field(default="15 per minute", alias="modificationRateLimit")
    fallback_to_grounded_rag: bool = Field(default=True, alias="fallbackToGroundedRag")
    notes: str | None = None
    # NEW FIELDS:
    assessment_system_prompt: str | None = Field(default=None, alias="assessmentSystemPrompt")
    assessment_modify_system_prompt: str | None = Field(default=None, alias="assessmentModifySystemPrompt")
    student_chat_system_prompt: str | None = Field(default=None, alias="studentChatSystemPrompt")
    assessment_user_prompt_template: str | None = Field(default=None, alias="assessmentUserPromptTemplate")
```

---

### 3. backend/app/rag/assessment/llm.py - Assessment Generation

#### BEFORE (Line 73-84)
```python
    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=(
                "You are a careful academic assessment generator. "
                "Use only the provided context and return machine-readable JSON."
            ),
            temperature=float(settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(settings.get("maxTokens", 1200) or 1200),
        )
```

#### AFTER (Line 73-87)
```python
    system_prompt = str(settings.get("assessmentSystemPrompt") or "").strip() or (
        "You are a careful academic assessment generator. "
        "Use only the provided context and return machine-readable JSON."
    )
    
    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=float(settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(settings.get("maxTokens", 1200) or 1200),
        )
```

---

### 4. backend/app/rag/assessment/llm.py - Assessment Modification

#### BEFORE (Line 215-225)
```python
    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=(
                "You are a careful academic assessment editor. "
                "Return only strict JSON matching the requested schema."
            ),
            temperature=float(settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(settings.get("maxTokens", 1200) or 1200),
        )
```

#### AFTER (Line 215-229)
```python
    system_prompt = str(settings.get("assessmentModifySystemPrompt") or "").strip() or (
        "You are a careful academic assessment editor. "
        "Return only strict JSON matching the requested schema."
    )
    
    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=float(settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(settings.get("maxTokens", 1200) or 1200),
        )
```

---

### 5. backend/app/rag/student_chat.py

#### BEFORE (Line 341-351)
```python
    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=(
                "You are a careful academic tutor. Return concise JSON that matches the required schema, and make the answer field polished Markdown."
            ),
            temperature=float(ai_settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(ai_settings.get("maxTokens", 900) or 900),
        )
```

#### AFTER (Line 341-355)
```python
    system_prompt = str(ai_settings.get("studentChatSystemPrompt") or "").strip() or (
        "You are a careful academic tutor. Return concise JSON that matches the required schema, and make the answer field polished Markdown."
    )
    
    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=float(ai_settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(ai_settings.get("maxTokens", 900) or 900),
        )
```

---

### 6. frontend/src/features/administration/api/adminApi.ts

#### BEFORE (Line 108-138)
```typescript
export interface AISettings {
  provider: 'grounded-rag' | 'ollama' | 'openai-compatible-cloud' | 'openai-compatible-local' | 'gemini';
  mode: 'local' | 'api-key';
  model: string;
  baseUrl?: string | null;
  temperature: number;
  maxTokens: number;
  generationRateLimit: string;
  modificationRateLimit: string;
  fallbackToGroundedRag: boolean;
  notes?: string | null;
  hasApiKey: boolean;
  apiKeyPreview?: string | null;
  updatedAt?: string | null;
}

export type AISettingsWritePayload = {
  provider: AISettings['provider'];
  mode: AISettings['mode'];
  model: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  clearApiKey?: boolean;
  temperature: number;
  maxTokens: number;
  generationRateLimit: string;
  modificationRateLimit: string;
  fallbackToGroundedRag: boolean;
  notes?: string | null;
};
```

#### AFTER (Line 108-147)
```typescript
export interface AISettings {
  provider: 'grounded-rag' | 'ollama' | 'openai-compatible-cloud' | 'openai-compatible-local' | 'gemini';
  mode: 'local' | 'api-key';
  model: string;
  baseUrl?: string | null;
  temperature: number;
  maxTokens: number;
  generationRateLimit: string;
  modificationRateLimit: string;
  fallbackToGroundedRag: boolean;
  notes?: string | null;
  assessmentSystemPrompt?: string;
  assessmentModifySystemPrompt?: string;
  studentChatSystemPrompt?: string;
  assessmentUserPromptTemplate?: string;
  hasApiKey: boolean;
  apiKeyPreview?: string | null;
  updatedAt?: string | null;
}

export type AISettingsWritePayload = {
  provider: AISettings['provider'];
  mode: AISettings['mode'];
  model: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  clearApiKey?: boolean;
  temperature: number;
  maxTokens: number;
  generationRateLimit: string;
  modificationRateLimit: string;
  fallbackToGroundedRag: boolean;
  notes?: string | null;
  assessmentSystemPrompt?: string;
  assessmentModifySystemPrompt?: string;
  studentChatSystemPrompt?: string;
  assessmentUserPromptTemplate?: string;
};
```

---

### 7. frontend/src/features/administration/pages/AISettings.tsx

#### Change 1: defaultForm (Line 13-25)
```typescript
const defaultForm: AISettingsWritePayload = {
  provider: "ollama",
  mode: "local",
  model: "llama3.2",
  baseUrl: "http://localhost:11434",
  apiKey: "",
  clearApiKey: false,
  temperature: 0.2,
  maxTokens: 1200,
  generationRateLimit: "15 per minute",
  modificationRateLimit: "15 per minute",
  fallbackToGroundedRag: true,
  notes: "",
  // ADDED:
  assessmentSystemPrompt: "You are a careful academic assessment generator. Use only the provided context and return machine-readable JSON.",
  assessmentModifySystemPrompt: "You are a careful academic assessment editor. Return only strict JSON matching the requested schema.",
  studentChatSystemPrompt: "You are a careful academic tutor. Return concise JSON that matches the required schema, and make the answer field polished Markdown.",
  assessmentUserPromptTemplate: "Generate assessment questions for {subject} at {difficulty} level with {questionCount} questions totaling {totalMarks} marks.",
};
```

#### Change 2: buildFormFromSettings (Line 35-49)
```typescript
const buildFormFromSettings = (settings?: AIRuntimeSettings): AISettingsWritePayload => {
  if (!settings) return defaultForm;
  return {
    provider: settings.provider,
    mode: settings.mode,
    model: settings.model,
    baseUrl: settings.baseUrl || "",
    apiKey: "",
    clearApiKey: false,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    generationRateLimit: settings.generationRateLimit,
    modificationRateLimit: settings.modificationRateLimit,
    fallbackToGroundedRag: settings.fallbackToGroundedRag,
    notes: settings.notes || "",
    // ADDED:
    assessmentSystemPrompt: settings.assessmentSystemPrompt || defaultForm.assessmentSystemPrompt,
    assessmentModifySystemPrompt: settings.assessmentModifySystemPrompt || defaultForm.assessmentModifySystemPrompt,
    studentChatSystemPrompt: settings.studentChatSystemPrompt || defaultForm.studentChatSystemPrompt,
    assessmentUserPromptTemplate: settings.assessmentUserPromptTemplate || defaultForm.assessmentUserPromptTemplate,
  };
};
```

#### Change 3: UI Section (NEW, ~80 lines)
Added between Rate Control and Operator Notes sections:
```tsx
<div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
  <div className="flex items-center gap-3">
    <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
      <FiSliders className="h-5 w-5" />
    </div>
    <div>
      <p className="text-lg font-semibold text-slate-900">System Prompts</p>
      <p className="text-sm text-slate-500">
        Configure LLM behavior for assessment generation and student chat responses.
      </p>
    </div>
  </div>

  <div className="mt-6 space-y-4">
    {/* 4 textarea fields with labels and help text */}
    {/* Assessment Generation Prompt */}
    {/* Assessment Modification Prompt */}
    {/* Student Chat Prompt */}
    {/* User Prompt Template */}
  </div>
</div>
```

---

## Key Implementation Details

### Fallback Mechanism
All prompt usage follows this pattern:
```python
prompt = str(settings.get("fieldName") or "").strip() or DEFAULT_VALUE
```

This ensures:
1. If field exists and has value → use it
2. If field is empty string → fallback to default
3. If field is None → fallback to default
4. Always has a working prompt

### Type Safety (TypeScript)
All new fields are optional (`?`) so:
- Existing code continues to work
- Gradual adoption possible
- No breaking changes

### Database Flexibility
MongoDB allows:
- New fields without migration
- Null/missing fields
- Field updates without schema changes

---

## Summary of Additions

| Item | Count |
|------|-------|
| Backend files modified | 4 |
| Frontend files modified | 2 |
| New database fields | 4 |
| New TypeScript types | 0 (extended existing) |
| New Python classes | 0 (extended existing) |
| New API endpoints | 0 (extended existing) |
| UI sections added | 1 |
| UI textarea fields added | 4 |
| Documentation files | 3 |
| Lines of code added | ~125 |
| Breaking changes | 0 |

✅ All changes are backward compatible!
