from pydantic import Field

from .validation import StrictModel


class StudentChatHistoryMessage(StrictModel):
    role: str = Field(min_length=1, max_length=20)
    content: str = Field(min_length=1, max_length=2000)


class StudentSubjectChatRequest(StrictModel):
    question: str = Field(min_length=2, max_length=2000)
    history: list[StudentChatHistoryMessage] = Field(default_factory=list)
