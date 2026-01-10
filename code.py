from typing import TypedDict

class ThumbnailInfo(TypedDict, total=False):
    width: int
    height: int

class ThumbnailInfoRequired(ThumbnailInfo):
    version: int
    title: str
    url: str

# Creating a thumbnail
thumbnail = ThumbnailInfoRequired(
    version=1,
    title="Profile Picture",
    url="https://example.com/thumb.jpg"
)