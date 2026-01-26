from pydantic import BaseModel, Field
from openai import OpenAI
from typing import Literal

from thumbnail import ThumbnailInfo, create_thumbnail, get_thumbnail_display


class ExtractedInfo(BaseModel):
    name: str = Field(..., description="Person's name")
    age: int = Field(..., ge=0, le=150)
    occupation: str = Field(..., description="Person's job or profession")
    sentiment: Literal["positive", "neutral", "negative"]


class ExtractionRequest(BaseModel):
    text: str = Field(..., description="Text to extract information from")
    model: str = Field(default="gpt-4")


def extract_structured_data(request: ExtractionRequest) -> ExtractedInfo:
    client = OpenAI()

    response = client.beta.chat.completions.parse(
        model=request.model,
        messages=[
            {
                "role": "system",
                "content": "Extract person information from the given text."
            },
            {"role": "user", "content": request.text}
        ],
        response_format=ExtractedInfo,
    )

    return response.choices[0].message.parsed


def create_profile_thumbnail(info: ExtractedInfo, version: int = 1) -> ThumbnailInfo:
    """Create a thumbnail from extracted profile info."""
    title = f"{info.name} - {info.occupation}"
    return create_thumbnail(version=version, title=title)


if __name__ == "__main__":
    request = ExtractionRequest(
        text="John is a 28-year-old software engineer who loves his job!"
    )
    result = extract_structured_data(request)
    print(f"Name: {result.name}")
    print(f"Age: {result.age}")
    print(f"Occupation: {result.occupation}")
    print(f"Sentiment: {result.sentiment}")

    thumbnail = create_profile_thumbnail(result)
    print(f"\nThumbnail: {get_thumbnail_display(thumbnail)}")
