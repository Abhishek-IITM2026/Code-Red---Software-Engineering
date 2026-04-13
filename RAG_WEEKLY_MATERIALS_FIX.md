# RAG Weekly Materials Fix - Complete Solution

## Problem
Student subject chat using weekly materials was not retrieving any relevant content from the RAG system (multimodal retrieval), even when materials were explicitly selected for a specific week.

## Root Cause Analysis

### Week Format Normalization Mismatch

The issue was caused by inconsistent week format normalization between:

1. **Document Ingestion** (`backend/app/rag/multimodal/discovery.py`):
   - Uses `normalize_week_label()` to convert week values
   - Standardizes: "Week 1", "week 1", "1" → "Week 1"
   - Ingested documents stored with normalized week metadata

2. **Material Scope Derivation** (`backend/app/rag/multimodal/service.py`):
   - Used `normalize_text()` which only removes whitespace
   - Did NOT normalize week formats
   - Week values from materials remained as-is from database (could be "Week 1", "week 1", or "1")

3. **Filtering in Retrieval** (`backend/app/rag/multimodal/service.py`):
   - `_filter_and_hydrate_text_matches()` checked: `if allowed_weeks and str(metadata.get("week")) not in allowed_weeks`
   - Ingested doc week: "Week 1" (normalized)
   - Allowed weeks: ["week 1"] or ["1"] (not normalized)
   - **Result: Mismatch → No results returned**

## Solution

Fixed week normalization inconsistency in three files:

### 1. **backend/app/rag/multimodal/service.py**

```python
# Added import
from .runtime import normalize_week_label

# Fixed derive_material_scope() function
def derive_material_scope(materials: list[dict[str, Any]] | None) -> dict[str, set[str]]:
    weeks: set[str] = set()
    for material in materials or []:
        # CHANGED FROM: week = normalize_text(material.get("week"))
        # CHANGED TO:
        week = normalize_week_label(material.get("week"))
        if week:
            weeks.add(week)
```

### 2. **backend/app/rag/student_chat.py**

```python
# Added import
from .multimodal.runtime import normalize_week_label

# Fixed answer_subject_question() function
def answer_subject_question(...):
    # ...
    material_scope = derive_material_scope(materials)
    scoped_weeks = set(material_scope.get("weeks") or set())
    
    # Normalize the week parameter from request
    normalized_week = normalize_week_label(week) if week else None
    if normalized_week:
        scoped_weeks.add(normalized_week)
    
    # Use normalized week for RAG retrieval
    retrieval = retrieve_context(
        query=question,
        subject=subject_name,
        week=normalized_week,  # Use normalized week here
        allowed_source_files=material_scope.get("sourceFiles") or None,
        allowed_weeks=scoped_weeks or None,
    )
```

### 3. **backend/app/services/assessments.py**

```python
# Added import
from ..rag.multimodal.runtime import normalize_week_label

# Fixed generate_assessment_questions() function
def generate_assessment_questions(...):
    # ...
    requested_week = str(payload.get("week") or "").strip() or None
    normalized_week = normalize_week_label(requested_week) if requested_week else None
    
    # Use normalized week for RAG retrieval
    retrieval = retrieve_context(
        query=...,
        subject=subject.name,
        week=normalized_week,  # Use normalized week here
        allowed_source_files=material_scope["sourceFiles"] or None,
        allowed_weeks=material_scope["weeks"] or None,
        top_k_text=...
    )
```

## How It Works Now

### Flow After Fix

1. **Student selects materials from Week 1** → sends `materialIds` and `week: "Week 1"` to backend
2. **Backend retrieves materials** → filters by `materialIds`
3. **`derive_material_scope(materials)` now properly normalizes weeks** → converts to "Week 1" format
4. **Backend normalizes the week parameter** → ensures consistent format
5. **`retrieve_context()` receives properly normalized weeks**
6. **Filtering in `_filter_and_hydrate_text_matches`** → `allowed_weeks: ["Week 1"]`
7. **Ingested doc week metadata** → `"Week 1"`
8. **Match! ✓ Relevant content retrieved**

## Testing

### Manual Test Steps
1. Upload materials with varied week labels:
   - "Week 1", "week 2", "3", "Week 4"
2. Navigate to student subject page
3. Select materials from a specific week (e.g., "Week 2")
4. Ask a question about that topic
5. **Expected Result**: RAG retrieves relevant content from selected week materials with citations

### Files Modified
- ✅ `backend/app/rag/multimodal/service.py`
- ✅ `backend/app/rag/student_chat.py`
- ✅ `backend/app/services/assessments.py`

## Benefits

- ✅ Student subject chat now retrieves relevant weekly materials
- ✅ Assessment generation uses properly scoped materials by week
- ✅ Consistent week normalization across RAG pipeline
- ✅ Works with varied week input formats ("Week 1", "week 1", "1", etc.)
- ✅ Fixes both chat and assessment question generation features

## Related Features Fixed

This fix improves two key features:
1. **Student Subject Chat** - Now retrieves relevant content by week
2. **Assessment Question Generation** - Now generates questions using properly scoped weekly materials
