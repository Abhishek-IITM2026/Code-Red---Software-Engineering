# AI Settings Admin Implementation - Summary

## ✅ What's Been Implemented

Admin users now have complete control over AI settings including system prompts for assessment generation, assessment modification, and student chat responses.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Interface (Frontend)               │
│                  AISettings.tsx Component                   │
│  - Provider & Model Selection                               │
│  - Temperature & Rate Limits                                │
│  - System Prompts Configuration                             │
│  - User Prompt Templates                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ PUT /administration/ai-settings
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend API Routes                         │
│        (administration_bp.put("/ai-settings"))              │
│                                                              │
│  ↓ AISettingsWriteRequest validation                       │
│  ↓ AISettingsRepository.upsert()                           │
│  ↓ Returns updated settings                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              MongoDB Collection: ai_settings                │
│                                                              │
│  {                                                           │
│    scope: "rag-runtime",                                   │
│    provider: "ollama",                                     │
│    model: "llama3.2",                                      │
│    temperature: 0.2,                                       │
│    assessmentSystemPrompt: "You are...",                   │
│    assessmentModifySystemPrompt: "You are...",             │
│    studentChatSystemPrompt: "You are...",                  │
│    assessmentUserPromptTemplate: "Generate...",            │
│    ... other settings                                       │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
Assessment       Assessment         Student
Generation       Modification       Chat
(llm.py)        (llm.py)           (student_chat.py)

Uses:                Uses:                Uses:
assessmentSystemPrompt    assessmentModifySystemPrompt    studentChatSystemPrompt
temperature               temperature                      temperature
maxTokens                 maxTokens                        maxTokens
```

## Files Modified

### Backend (Python)

**1. `backend/app/services/ai_settings.py`**
- Added 4 new fields to `DEFAULT_AI_SETTINGS` dictionary
- Updated `get_ai_settings()` to include new prompts in response
- Updated `update_ai_settings()` to save new prompts to database

**2. `backend/app/schemas/administration.py`**
- Added 4 new fields to `AISettingsWriteRequest` schema:
  - `assessment_system_prompt`
  - `assessment_modify_system_prompt`
  - `student_chat_system_prompt`
  - `assessment_user_prompt_template`

**3. `backend/app/rag/assessment/llm.py`**
- `try_generate_llm_grounded_questions()`: Uses `assessmentSystemPrompt` from settings
- `try_modify_llm_questions()`: Uses `assessmentModifySystemPrompt` from settings
- Falls back to default prompts if custom ones not set

**4. `backend/app/rag/student_chat.py`**
- `_try_generate_llm_answer()`: Uses `studentChatSystemPrompt` from settings
- Falls back to default prompts if custom ones not set

### Frontend (TypeScript/React)

**1. `frontend/src/features/administration/api/adminApi.ts`**
- Extended `AISettings` interface with 4 new prompt fields
- Extended `AISettingsWritePayload` type with 4 new prompt fields

**2. `frontend/src/features/administration/pages/AISettings.tsx`**
- Updated `defaultForm` to include prompt defaults
- Updated `buildFormFromSettings()` to map settings to form
- Added new "System Prompts" UI section with:
  - Assessment generation system prompt textarea
  - Assessment modification system prompt textarea
  - Student chat system prompt textarea
  - Assessment user prompt template textarea
- Each field includes help text explaining when it's used

## Data Flow

### Setting Prompts (Admin)

```
Admin UI (AISettings.tsx)
    ↓ Fill form with custom prompts
    ↓ Click "Save Settings"
    ↓ PUT /administration/ai-settings
    ↓ Backend validates & saves to MongoDB
    ↓ Response includes updated settings
    ↓ Frontend displays confirmation
```

### Using Prompts (Runtime)

```
Assessment Generation:
Faculty → Generate Questions
    ↓ Backend fetches AI settings
    ↓ resolve_external_runtime(settings)
    ↓ system_prompt = settings.get("assessmentSystemPrompt") or default
    ↓ post_external_chat_completion(system_prompt=...)
    ↓ LLM receives custom prompt
    ↓ Questions generated with custom behavior

Student Chat:
Student → Ask Subject Question
    ↓ Backend fetches AI settings
    ↓ resolve_external_runtime(settings)
    ↓ system_prompt = settings.get("studentChatSystemPrompt") or default
    ↓ post_external_chat_completion(system_prompt=...)
    ↓ LLM receives custom prompt
    ↓ Answer generated with custom behavior
```

## Default Values

```python
{
    "assessmentSystemPrompt": "You are a careful academic assessment generator. Use only the provided context and return machine-readable JSON.",
    
    "assessmentModifySystemPrompt": "You are a careful academic assessment editor. Return only strict JSON matching the requested schema.",
    
    "studentChatSystemPrompt": "You are a careful academic tutor. Return concise JSON that matches the required schema, and make the answer field polished Markdown.",
    
    "assessmentUserPromptTemplate": "Generate assessment questions for {subject} at {difficulty} level with {questionCount} questions totaling {totalMarks} marks.",
}
```

## API Endpoints

### Get Settings (Already existed)
```
GET /administration/ai-settings
Response: AISettings object with all fields including new prompts
```

### Update Settings (Updated)
```
PUT /administration/ai-settings
Body: AISettingsWritePayload {
    provider: "ollama",
    model: "llama3.2",
    temperature: 0.2,
    assessmentSystemPrompt: "Custom system prompt...",
    assessmentModifySystemPrompt: "Custom modify prompt...",
    studentChatSystemPrompt: "Custom chat prompt...",
    assessmentUserPromptTemplate: "Custom template...",
    ... other fields
}
Response: Updated AISettings object
```

## Key Features

1. **Isolation**: Each use case has its own prompt
   - Assessment generation
   - Assessment modification
   - Student chat

2. **Fallback**: Always has defaults if custom prompts aren't set

3. **Runtime**: Changes take effect immediately on next request

4. **Persistence**: Settings stored in MongoDB with scope "rag-runtime"

5. **Admin-Only**: Only "administration" role can modify settings

6. **Validation**: Prompts can be any text, no specific validation

## Usage Examples

### Strict Assessment Generation
```python
assessmentSystemPrompt = """You are a rigorous academic assessment creator. 
Generate only high-quality, research-backed exam questions that:
- Align with Bloom's taxonomy levels
- Include diverse question types
- Test critical thinking, not rote memorization
- Ensure proper difficulty distribution
- Return valid JSON only"""
```

### Socratic Student Tutoring
```python
studentChatSystemPrompt = """You are a Socratic tutor helping students discover 
knowledge through questions and gentle guidance. Rather than directly answering, 
ask probing questions that lead students to understand concepts themselves. 
When students seem stuck, provide hints and partial explanations."""
```

### Consistent Question Modification
```python
assessmentModifySystemPrompt = """You are a strict assessment quality control editor. 
When modifying questions:
- Preserve original intent and difficulty
- Maintain consistent formatting
- Ensure options are plausible but clearly wrong/right
- Validate all JSON schemas strictly
- Return ONLY valid JSON, no commentary"""
```

## Testing Checklist

- [ ] Admin can access AI Settings page
- [ ] Admin can view current system prompts
- [ ] Admin can modify system prompts
- [ ] Admin can save changes
- [ ] Settings persist after page refresh
- [ ] Assessment generation uses new prompt
- [ ] Assessment modification uses new prompt
- [ ] Student chat uses new prompt
- [ ] Frontend shows no TypeScript errors
- [ ] Backend logs successful setting updates
- [ ] Fallback to defaults works if prompts are empty
- [ ] Rate limits still work correctly
- [ ] Provider settings still work correctly

## Documentation

See [AI_SETTINGS_ADMIN_GUIDE.md](../AI_SETTINGS_ADMIN_GUIDE.md) for:
- Detailed configuration instructions
- Use cases and examples
- Troubleshooting guide
- Security considerations
- Advanced tips
