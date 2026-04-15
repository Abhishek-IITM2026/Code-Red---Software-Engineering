import pytest
from app.models import User
from app.repositories.material_sources import MaterialSourceRepository
from app.services.assessments import modify_assessment_questions

def test_modify_assessment_questions_heuristic_logic():
    """Test the heuristic fallback logic in isolation without needing a database or AI."""
    questions = [
        {
            "id": "q1",
            "questionText": "What is 2+2?",
            "questionType": "short",
            "marks": 2,
            "difficulty": "easy"
        }
    ]

    # Test 'hard' modification
    result_hard = modify_assessment_questions(
        questions=questions,
        modification_prompt="Make it very hard and challenging",
        subject_id=None,
        subject_name=None,
        week=None,
        materials=None
    )
    assert result_hard[0]["difficulty"] == "hard"
    assert result_hard[0]["marks"] >= 2

    # Test 'mcq' modification
    result_mcq = modify_assessment_questions(
        questions=questions,
        modification_prompt="Convert to MCQ",
        subject_id=None,
        subject_name=None,
        week=None,
        materials=None
    )
    assert result_mcq[0]["questionType"] == "mcq"
    assert len(result_mcq[0]["options"]) == 4

def test_modify_assessment_questions_empty_input():
    """Test handling of empty question list."""
    result = modify_assessment_questions(
        questions=[],
        modification_prompt="Change anything",
        subject_id=None,
        subject_name=None,
        week=None,
        materials=None
    )
    assert result == []
