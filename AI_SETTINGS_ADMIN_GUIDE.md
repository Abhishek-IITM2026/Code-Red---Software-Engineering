# AI Settings Administration Guide

## Overview

Admin users can now configure AI settings including provider, model, temperature, rate limits, and **custom system prompts** for both assessment generation and student chat features.

## Access

1. Login as **Administration** user
2. Navigate to **Administration Dashboard** → **AI Settings**

## Configuration Sections

### 1. Provider and Runtime

**Provider Options:**
- **Ollama** - Local LLM (default, requires Ollama running locally)
- **Google Gemini** - Cloud-based (requires API key)
- **OpenAI-Compatible Cloud** - Custom cloud endpoint (requires API key)
- **OpenAI-Compatible Local** - Local custom endpoint
- **Grounded RAG** - Default grounded retrieval system

**Runtime Mode:**
- **Local Runtime** - For Ollama and OpenAI-compatible local
- **API Key Runtime** - For Gemini and cloud endpoints

### 2. Model Configuration

- **Model**: Name of the LLM (e.g., `llama3.2`, `gemini-1.5-flash`)
- **Base URL**: API endpoint URL
  - Ollama: `http://localhost:11434`
  - Gemini: `https://generativelanguage.googleapis.com/v1beta`
- **API Key**: Only required for cloud providers
- **Temperature**: Controls response randomness (0.0-2.0)
  - Lower values (0.2) = more deterministic
  - Higher values (0.7-1.0) = more creative
- **Max Tokens**: Maximum response length (256-8192)

### 3. Rate Control

Control request throttling:
- **Generate Questions Limit**: Rate limit for assessment generation (default: 15 per minute)
- **Modify Questions Limit**: Rate limit for question modification (default: 15 per minute)
- **Fallback to Grounded RAG**: When enabled, system falls back to grounded RAG if external provider fails

### 4. System Prompts

#### Assessment Generation System Prompt
**When it's used:** Faculty generates new assessment questions

**Default:**
```
You are a careful academic assessment generator. Use only the provided context and return machine-readable JSON.
```

**Customize to:**
- Change instruction style (more formal/casual)
- Add specific grading criteria
- Emphasize quality standards
- Adjust difficulty expectations

**Example:**
```
You are an expert educational assessment designer. Create high-quality academic questions that:
- Test conceptual understanding, not just memorization
- Include appropriate cognitive levels (Bloom's taxonomy)
- Use only the provided course materials
- Return valid machine-readable JSON format
```

#### Assessment Modification System Prompt
**When it's used:** Faculty modifies already-generated assessment questions

**Default:**
```
You are a careful academic assessment editor. Return only strict JSON matching the requested schema.
```

**Customize to:**
- Enforce stricter validation
- Add stylistic requirements
- Specify modification patterns
- Set consistency rules

#### Student Chat System Prompt
**When it's used:** Students ask questions in subject chat

**Default:**
```
You are a careful academic tutor. Return concise JSON that matches the required schema, and make the answer field polished Markdown.
```

**Customize to:**
- Change tutoring approach (Socratic, directive, exploratory)
- Set tone (encouraging, formal, friendly)
- Add specific pedagogical methods
- Specify expected response format

**Example:**
```
You are a supportive academic tutor who helps students learn through guided discovery. 
Structure your answers with:
- Key Concept: The main idea
- Why It Matters: Real-world application
- Step-by-Step: How it works
- Practice Example: A worked problem
- Check Your Understanding: A self-check question

Format responses as polished Markdown suitable for a modern learning app.
```

#### Assessment User Prompt Template
**When it's used:** Faculty writes custom prompts when generating assessments

**Default:**
```
Generate assessment questions for {subject} at {difficulty} level with {questionCount} questions totaling {totalMarks} marks.
```

**Available Placeholders:**
- `{subject}` - Subject name
- `{difficulty}` - Difficulty level (easy/medium/hard)
- `{questionCount}` - Number of questions
- `{totalMarks}` - Total marks
- `{week}` - Week number (if applicable)
- `{questionTypes}` - Question type breakdown

**Customize Example:**
```
Create {questionCount} assessment questions for {subject} ({week}):
- Difficulty: {difficulty}
- Total marks: {totalMarks}
- Mix of {questionTypes}
- Focus on conceptual understanding and application
- Include real-world scenarios
```

### 5. Operator Notes

Add environment-specific notes (optional):
- VPN requirements
- Model limitations
- Maintenance windows
- Troubleshooting info

## Use Cases

### Case 1: Strict Quality Assessment Generation

Set a stricter system prompt:
```
You are a rigorous academic assessment creator. Generate only high-quality, 
research-backed exam questions that:
- Align with Bloom's taxonomy levels
- Include diverse question types
- Test critical thinking, not rote memorization
- Ensure proper difficulty distribution
- Return valid JSON only
```

### Case 2: Socratic Method Student Chat

Configure for guided discovery:
```
You are a Socratic tutor helping students discover knowledge through questions 
and gentle guidance. Rather than directly answering, ask probing questions that 
lead students to understand concepts themselves. When students seem stuck, provide 
hints and partial explanations. Structure responses as polished Markdown JSON.
```

### Case 3: Formal Assessment Modification

Ensure consistency in modifications:
```
You are a strict assessment quality control editor. When modifying questions:
- Preserve original intent and difficulty
- Maintain consistent formatting
- Ensure options are plausible but clearly wrong/right
- Validate all JSON schemas strictly
- Return ONLY valid JSON, no commentary
```

### Case 4: Subject-Specific Questions

Template for domain expertise:
```
Create {questionCount} {subject} assessment questions for {week} at {difficulty} level:
- Include {questionTypes} question types
- Total marks: {totalMarks}
- Focus on {subject}-specific terminology and concepts
- Use real-world {subject} examples where applicable
- Ensure questions can be graded objectively
```

## Recommended Settings by Provider

### Ollama (Local)
```
Provider: ollama
Mode: local
Model: llama3.2 (or mistral, neural-chat)
Base URL: http://localhost:11434
Temperature: 0.2-0.4
Max Tokens: 1500
```

### Google Gemini
```
Provider: gemini
Mode: api-key
Model: gemini-1.5-flash
Base URL: https://generativelanguage.googleapis.com/v1beta
Temperature: 0.3-0.5
Max Tokens: 2000
```

### OpenAI-Compatible
```
Provider: openai-compatible-cloud
Mode: api-key
Model: gpt-4 (or similar)
Base URL: Your custom endpoint
Temperature: 0.2-0.5
Max Tokens: 2000
```

## Testing Changes

After updating settings:

1. **Test Assessment Generation**
   - Faculty: Create Assessment → Configure → Generate Questions
   - Check if prompts are applied

2. **Test Student Chat**
   - Student: Subject Chat → Ask a question
   - Verify response format and tone

3. **Monitor Logs**
   - Check backend logs for any prompt-related errors
   - Verify rate limits are working

## Troubleshooting

### Issue: Empty responses from LLM
- Check system prompt syntax
- Verify LLM can handle the instruction complexity
- Reduce max tokens if response is truncated

### Issue: Invalid JSON responses
- Review the system prompt for clarity
- Ensure prompt includes "return valid JSON only" instruction
- Test with simpler prompts first

### Issue: Rate limiting too aggressive
- Increase rate limit values
- Format: "N per minute/hour/day" (e.g., "30 per minute")

### Issue: Changes not taking effect
- Save changes explicitly
- Restart assessment/chat services if deployed
- Clear frontend cache

## Advanced Tips

1. **A/B Testing Prompts**: Save different versions in Operator Notes
2. **Prompt Versioning**: Include date/version in notes
3. **Monitoring Quality**: Track student/faculty feedback on question quality
4. **Performance Optimization**: Lower temperature for faster, cheaper responses
5. **Cost Control**: Adjust max tokens to reduce API costs for cloud providers

## Security Notes

- API keys are encrypted in database
- Only admin users can modify settings
- All changes are logged with timestamp
- Test settings before deploying to production

## Support

For issues or questions:
1. Check backend logs: `/backend/logs/`
2. Review system prompts for syntax errors
3. Test with default prompts first
4. Verify LLM provider is functioning correctly
