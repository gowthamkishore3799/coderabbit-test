from typing import TypedDict, NotRequired


class ThumbnailInfo(TypedDict):
    version: int
    title: str
    url: NotRequired[str]


def create_thumbnail(version: int, title: str, url: str | None = None) -> ThumbnailInfo:
    info: ThumbnailInfo = {"version": version, "title": title}
    if url:
        info["url"] = url
    return info


def get_thumbnail_display(info: ThumbnailInfo) -> str:
    return f"[v{info['version']}] {info['title']}"


if __name__ == "__main__":
    thumb = create_thumbnail(version=1, title="hello")
    print(get_thumbnail_display(thumb))
