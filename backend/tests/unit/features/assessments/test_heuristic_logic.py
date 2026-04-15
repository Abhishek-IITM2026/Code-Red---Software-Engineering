import pytest
from app.services.assessments import _heuristic_modify_questions

class TestHeuristicModification:
    """
    Unit tests for the _heuristic_modify_questions internal function.
    This validates the core logic of modifying questions based on text prompts
    without invoking any LLM.
    """

    def test_force_difficulty_hard(self):
        """Verify that 'hard' keywords increase difficulty and marks."""
        questions = [{
            "id": "1",
            "questionText": "What is 1+1?",
            "questionType": "short",
            "marks": 1,
            "difficulty": "easy"
        }]
        result = _heuristic_modify_questions(questions, "Make it challenging and hard")
        assert result[0]["difficulty"] == "hard"
        assert result[0]["marks"] >= 2

    def test_force_difficulty_easy(self):
        """Verify that 'easy' keywords decrease difficulty."""
        questions = [{
            "id": "1",
            "questionText": "Explain Quantum Physics",
            "questionType": "short",
            "marks": 10,
            "difficulty": "hard"
        }]
        result = _heuristic_modify_questions(questions, "Simplify this for a beginner")
        assert result[0]["difficulty"] == "easy"
        assert result[0]["marks"] == 1

    def test_convert_to_mcq(self):
        """Verify that 'mcq' prompt changes question type and adds options."""
        questions = [{
            "id": "1",
            "questionText": "What is Python?",
            "questionType": "short",
            "marks": 5,
            "difficulty": "medium"
        }]
        result = _heuristic_modify_questions(questions, "convert to multiple choice")
        assert result[0]["questionType"] == "mcq"
        assert isinstance(result[0]["options"], list)
        assert len(result[0]["options"]) == 4

    def test_numerical_prompt_insertion(self):
        """Verify that 'numerical' prompt adds a specific instruction to the text."""
        questions = [{
            "id": "1",
            "questionText": "How does gravity work?",
            "questionType": "short",
            "marks": 5,
            "difficulty": "medium"
        }]
        result = _heuristic_modify_questions(questions, "add a numerical calculation")
        assert "Include a calculation or numerical justification" in result[0]["questionText"]

    def test_true_false_normalization(self):
        """Verify that True/False types are correctly normalized."""
        questions = [{
            "id": "1",
            "questionText": "The earth is flat",
            "questionType": "trueFalse",
            "marks": 1,
            "difficulty": "easy",
            "correctAnswer": "No"
        }]
        # We can force it to stay trueFalse by using a prompt that doesn't change type
        result = _heuristic_modify_questions(questions, "Keep it as a true false question")
        assert result[0]["questionType"] == "trueFalse"
        assert result[0]["options"] == ["True", "False"]
        # Heuristic logic for True/False correctness: "No" -> "False"
        assert result[0]["correctAnswer"] == "False"
