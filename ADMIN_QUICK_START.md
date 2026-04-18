# AI Settings Admin - Quick Start Guide

## 🎯 What You Can Now Do

As an admin, you have complete control over how the AI generates assessments and answers student questions.

## 📍 Where to Access

1. **Login** as Administration user
2. Go to **Administration Dashboard**
3. Click **AI Settings**

## 🔧 What You Can Configure

### 1. **AI Provider & Model** (Existing)
- Ollama (local), Gemini (cloud), OpenAI, or others
- Which specific LLM model to use

### 2. **Temperature & Performance** (Existing)
- Temperature: Controls creativity (0.2 = precise, 0.7+ = creative)
- Max Tokens: How long responses can be

### 3. **🆕 System Prompts** (NEW!)
Control how the AI behaves in each situation:

#### System Prompt 1: Assessment Generation
**When:** Faculty creates new assessment questions

**Default:** "You are a careful academic assessment generator..."

**Why change it:** 
- Enforce specific quality standards
- Emphasize certain teaching methods
- Add domain expertise requirements

**Example customization:**
```
You are a rigorous assessment designer. Create high-quality questions that:
- Test understanding, not memorization
- Follow Bloom's taxonomy
- Include diverse question types
- Return valid JSON only
```

#### System Prompt 2: Assessment Modification
**When:** Faculty edits already-generated questions

**Default:** "You are a careful academic assessment editor..."

**Why change it:**
- Ensure modifications maintain quality
- Prevent breaking changes
- Enforce consistency

#### System Prompt 3: Student Chat
**When:** Students ask questions in subject chat

**Default:** "You are a careful academic tutor..."

**Why change it:**
- Make tutoring more encouraging/formal
- Add specific pedagogical approach (Socratic, etc.)
- Specify format requirements

**Example customization:**
```
You are a supportive tutor using the Socratic method. Help students 
discover answers through guided questions rather than direct answers. 
Format responses as polished Markdown.
```

#### System Prompt 4: User Prompt Template
**When:** Faculty writes custom instructions before generating questions

**Default:** "Generate assessment questions for {subject}..."

**Placeholders available:**
- `{subject}` - The subject name
- `{difficulty}` - easy/medium/hard
- `{questionCount}` - Number of questions
- `{totalMarks}` - Total marks for assessment
- `{week}` - Week number if applicable

## ⚡ Quick Tasks

### Task 1: Improve Assessment Quality
**Problem:** Questions are too easy/generic

**Solution:**
1. Edit "Assessment Generation System Prompt"
2. Add: "Focus on conceptual understanding and application over memorization"
3. Add: "Include real-world scenarios and case studies"
4. Save
5. Faculty generates new questions → they'll be better!

### Task 2: Change Tutoring Style
**Problem:** Student chat is too formal

**Solution:**
1. Edit "Student Chat System Prompt"
2. Change tone: "You are a friendly, encouraging tutor..."
3. Add: "Use emojis and casual language to make learning fun"
4. Save
5. Students chat → more engaging!

### Task 3: Use Different AI Model
**Problem:** Ollama is slow, want to try faster model

**Solution:**
1. Change "Provider" to OpenAI-compatible or Gemini
2. Enter API key
3. Select new model (e.g., gpt-4, gemini-1.5)
4. Save
5. All features immediately use new model!

### Task 4: Set Organization Standard
**Problem:** Need consistent question format across all teachers

**Solution:**
1. Edit "Assessment User Prompt Template"
2. Define your org's standard: quality, format, types, etc.
3. Save
4. When faculty generate questions, they see your template!

## 📋 Examples You Can Copy-Paste

### Strict Academic Standard
```
Assessment Generation Prompt:
You are a rigorous assessment designer following academic standards. 
Create only high-quality questions that:
- Test conceptual understanding and application
- Include multiple cognitive levels (Bloom's taxonomy)
- Have clear correct answers
- Use only provided materials
- Return valid JSON only
```

### Encouraging Student Tutor
```
Student Chat Prompt:
You are a warm, encouraging tutor helping students learn. 
- Use positive language and celebrate understanding
- Break complex topics into simple steps
- Use examples from students' daily lives
- Ask questions to check understanding
- Format as polished Markdown
```

### Consistent Modification Rules
```
Assessment Modification Prompt:
You are a quality assurance editor. When modifying questions:
- Keep same difficulty level and subject focus
- Ensure all options are plausible
- Preserve original intent
- Maintain consistent formatting
- Return ONLY JSON, no extra text
```

### Professional Exam Questions
```
Assessment User Template:
Create {questionCount} professional-level {subject} assessment for {week}:
- Difficulty: {difficulty}
- Total marks: {totalMarks}
- Types: {questionTypes}
- Focus: Real-world applications and case studies
- Quality: Publication-ready questions
```

## ⚠️ Important Notes

1. **Changes take effect immediately** - New requests use updated prompts
2. **No code changes needed** - Just configure and go
3. **Only admin can change** - Teachers/students cannot modify
4. **Fallback to defaults** - If you clear a prompt, it uses default
5. **Different providers, same prompts** - Prompts work with any AI provider

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Changes don't show up | Refresh page, check "Save Settings" button clicked |
| Questions still bad | Prompt might not be clear enough - try simpler language |
| Student chat responses are cut off | Increase "Max Tokens" value |
| JSON parse errors | Check your prompt includes "return valid JSON only" |
| Too slow | Lower temperature, reduce max tokens, try faster model |

## 🎓 Best Practices

1. **Test changes** - Have a teacher try feature before rolling out
2. **Document your prompts** - Save versions in "Operator Notes"
3. **Start simple** - Add complexity gradually
4. **Monitor feedback** - Track teacher/student reactions
5. **Version control** - Note dates and changes in notes section

## 📞 Need Help?

See detailed guide: [AI_SETTINGS_ADMIN_GUIDE.md](../AI_SETTINGS_ADMIN_GUIDE.md)

Common issues:
- Empty responses → check prompt clarity
- Rate limiting → increase rate limit values
- Provider errors → verify API key and base URL
