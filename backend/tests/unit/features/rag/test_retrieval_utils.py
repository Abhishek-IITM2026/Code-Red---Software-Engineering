import pytest
from app.rag.assessment.retrieval import (
    tokenize,
    summarize_text,
    extract_keywords,
    distribute_marks,
    build_question_type_plan
)

class TestRetrievalUtils:
    """
    Unit tests for the utility functions used in the RAG retrieval pipeline.
    These tests validate the input-output transformations without requiring
    any external dependencies or database connections.
    """

    def test_tokenize_removes_stopwords(self):
        """Test that tokenize removes common English stopwords and short words."""
        text = "The quick brown fox jumps over the lazy dog and it is a sunny day"
        tokens = tokenize(text)
        # 'the', 'and', 'it', 'is', 'a' are stopwords or too short
        assert "quick" in tokens
        assert "brown" in tokens
        assert "fox" in tokens
        assert "the" not in tokens
        assert "a" not in tokens

    def test_summarize_text_truncation(self):
        """Test that summarize_text correctly truncates long text to max_words."""
        text = "Word " * 100
        summary = summarize_text(text, max_words=10)
        words = summary.split()
        # Should be 10 words plus the trailing '...'
        assert len(words) == 10
        assert summary.endswith("...")

    def test_summarize_text_short_text(self):
        """Test that summarize_text does not truncate text shorter than max_words."""
        text = "Hello world"
        summary = summarize_text(text, max_words=10)
        assert summary == "Hello world"

    def test_extract_keywords_frequency(self):
        """Test that extract_keywords identifies the most frequent words."""
        text = "Apple banana apple orange apple banana grape"
        keywords = extract_keywords(text, limit=2)
        # 'apple' appears 3 times, 'banana' 2 times
        assert keywords[0] == "apple"
        assert keywords[1] == "banana"

    def test_distribute_marks_even_split(self):
        """Test that distribute_marks splits total marks evenly when possible."""
        # 20 marks / 4 questions = 5 each
        marks = distribute_marks(total_marks=20, count=4)
        assert marks == [5, 5, 5, 5]

    def test_distribute_marks_with_remainder(self):
        """Test that distribute_marks handles remainders correctly."""
        # 22 marks / 4 questions = 5, 5, 5, 5 with 2 remainder
        marks = distribute_marks(total_marks=22, count=4)
        assert sum(marks) == 22
        assert marks[0] == 6  # Remainder distributed to first indices
        assert marks[1] == 6
        assert marks[2] == 5
        assert marks[3] == 5

    def test_build_question_type_plan_custom(self):
        """Test that build_question_type_plan respects the requested counts."""
        question_types = {"mcq": 2, "short": 1}
        # Requesting 3 questions total
        plan = build_question_type_plan(question_types, 3)
        assert plan == ["mcq", "mcq", "short"]

    def test_build_question_type_plan_cycling(self):
        """Test that build_question_type_plan cycles types if count exceeds requested."""
        question_types = {"mcq": 1}
        # Requesting 3 questions but only 1 mcq specified
        plan = build_question_type_plan(question_types, 3)
        # Should cycle: mcq, mcq, mcq
        assert plan == ["mcq", "mcq", "mcq"]

    def test_build_question_type_plan_empty_fallback(self):
        """Test that build_question_type_plan uses a default sequence if no types are provided."""
        plan = build_question_type_plan({}, 4)
        # Default is ["mcq", "short", "long", "trueFalse"]
        assert plan == ["mcq", "short", "long", "trueFalse"]
