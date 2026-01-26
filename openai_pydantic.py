from pydantic import BaseModel, Field
from openai import OpenAI
from typing import Optional


class ChatMessage(BaseModel):
    role: str = Field(..., description="The role of the message sender")
    content: str = Field(..., description="The content of the message")


class ChatRequest(BaseModel):
    model: str = Field(default="gpt-4", description="The model to use")
    messages: list[ChatMessage] = Field(..., description="List of messages")
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=None, ge=1)


class ChatResponse(BaseModel):
    content: str
    model: str
    usage_tokens: int


def call_openai(request: ChatRequest) -> ChatResponse:
    client = OpenAI()

    response = client.chat.completions.create(
        model=request.model,
        messages=[msg.model_dump() for msg in request.messages],
        temperature=request.temperature,
        max_tokens=request.max_tokens,
    )

    return ChatResponse(
        content=response.choices[0].message.content,
        model=response.model,
        usage_tokens=response.usage.total_tokens,
    )


if __name__ == "__main__":
    request = ChatRequest(
        messages=[
            ChatMessage(role="user", content="Say hello in 3 words")
        ]
    )
    result = call_openai(request)
    print(f"Response: {result.content}")
    print(f"Tokens used: {result.usage_tokens}")
