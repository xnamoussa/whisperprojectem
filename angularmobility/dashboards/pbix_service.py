import json
import zipfile
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from django.conf import settings


MINISTRY_KEYWORDS = {
    "transport": ["transport"],
    "interieur": ["interieur", "securite"],
    "amenagement": ["amenagement"],
    "environnement": ["transition ecologique", "environnement", "ecologie"],
}


def _normalize(value: str) -> str:
    return (
        value.lower()
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
        .replace("'", " ")
        .strip()
    )


@lru_cache(maxsize=1)
def get_pbix_pages() -> list[dict]:
    pbix_path = Path(settings.BASE_DIR) / "projetmobilitebi1.pbix"
    if not pbix_path.exists():
        return []

    with zipfile.ZipFile(pbix_path) as archive:
        raw_layout = archive.read("Report/Layout")
        layout = json.loads(raw_layout.decode("utf-16-le"))
        sections = layout.get("sections", [])

    return [
        {
            "name": section.get("displayName", "Untitled"),
            "id": section.get("name", ""),
        }
        for section in sections
    ]


def get_pages_for_ministry(ministry: str) -> list[dict]:
    pages = get_pbix_pages()
    keywords = MINISTRY_KEYWORDS.get(ministry, [])
    filtered = []
    for page in pages:
        normalized_name = _normalize(page["name"])
        if any(keyword in normalized_name for keyword in keywords):
            filtered.append(page)
    return filtered


def build_power_bi_page_link(base_share_url: str, page_id: str) -> str:
    parsed = urlparse(base_share_url)
    params = dict(parse_qsl(parsed.query, keep_blank_values=True))
    params["pageName"] = page_id
    return urlunparse(parsed._replace(query=urlencode(params)))
