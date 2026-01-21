# CodeRabbit Test Repository

A test repository for demonstrating code review capabilities with various code patterns and technologies.

## Project Structure

```
├── fools/                  # Sample folder with test files
├── javas/                  # Java examples
├── TestCSharpProject/      # C# project examples
├── openai_pydantic.py      # OpenAI chat with Pydantic models
├── openai_structured.py    # Structured data extraction
├── thumbnail.py            # Thumbnail info models
├── user_manager.py         # User management system
└── zod*.ts                 # Zod validation examples
```

## Pydantic Models

This project uses Pydantic for data validation and serialization.

### ThumbnailInfo Usage

The `ThumbnailInfo` model is used for managing thumbnail metadata:

```python
from pydantic import BaseModel, Field
from typing import Optional

class ThumbnailInfo(BaseModel):
    version: int = Field(..., ge=1, description="Thumbnail version number")
    title: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., description="URL to the thumbnail image")
    width: Optional[int] = Field(default=None, ge=1)
    height: Optional[int] = Field(default=None, ge=1)

# Creating a thumbnail
thumbnail = ThumbnailInfo(
    version=1,
    title="Profile Picture",
    url="https://example.com/thumb.jpg"
)

# Accessing properties
print(f"[v{thumbnail.version}] {thumbnail.title}")
```

### Integration with OpenAI Structured Output

```python
from openai_structured import ExtractedInfo, create_profile_thumbnail
from thumbnail import ThumbnailInfo

# Extract info and create thumbnail
info = ExtractedInfo(
    name="John Doe",
    age=28,
    occupation="Engineer",
    sentiment="positive"
)

thumbnail: ThumbnailInfo = create_profile_thumbnail(info, version=1)
```

## Installation

```bash
pip install pydantic openai
npm install  # For TypeScript/Zod examples
```

## Usage

### Running Examples

```bash
python thumbnail.py
python openai_pydantic.py
python openai_structured.py
```

## License

MIT
