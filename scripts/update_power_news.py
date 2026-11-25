"""Validate the published power news feed or merge a reviewed JSON batch by ID."""
import argparse
from datetime import date, datetime
import json
from pathlib import Path
from urllib.parse import urlsplit

FEED = Path(__file__).resolve().parents[1] / "data/power/news.json"
CATEGORIES = {"demand", "hydro", "fuel", "policy", "projects", "companies",
              "operations", "finance"}
COLLECTIONS = ("articles", "events", "topics")


def index(items, field):
    result = {}
    for item in items:
        key = item[field]
        if not key or key in result:
            raise ValueError(f"Missing or duplicate {field}: {key}")
        result[key] = item
    return result


def validate(feed):
    if feed["schema_version"] != 1:
        raise ValueError("Unsupported feed schema")
    date.fromisoformat(feed["updated_at"])
    articles, events, topics = (index(feed[name], "id") for name in COLLECTIONS)
    index(articles.values(), "url")
    for article in articles.values():
        url = urlsplit(article["url"])
        if url.scheme != "https" or not url.hostname or not article["source_name"]:
            raise ValueError(f"Invalid article source: {article['id']}")
        if article["published_at"]:
            datetime.fromisoformat(article["published_at"])
    for topic in topics.values():
        if not all(topic[key] for key in ("title", "background", "next_check")):
            raise ValueError(f"Incomplete topic: {topic['id']}")
        if topic.get("related_data") and not topic["related_data"][1].startswith("?section="):
            raise ValueError(f"Invalid dashboard reference: {topic['id']}")
    for event in events.values():
        if not all(event[key] for key in ("title", "summary", "new_information")):
            raise ValueError(f"Incomplete event: {event['id']}")
        if event["category"] not in CATEGORIES or event["importance"] not in range(1, 5):
            raise ValueError(f"Invalid category or importance: {event['id']}")
        if event["event_date"]:
            date.fromisoformat(event["event_date"])
        for field, lookup in (("article_ids", articles), ("topic_ids", topics)):
            ids = event[field]
            if not ids or len(set(ids)) != len(ids) or not set(ids) <= lookup.keys():
                raise ValueError(f"Missing, duplicate or unknown {field}: {event['id']}")
        if not articles[event["article_ids"][0]]["published_at"]:
            raise ValueError(f"Primary article needs a publication date: {event['id']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--merge", type=Path, help="Reviewed batch with stable IDs and updated_at")
    args = parser.parse_args()
    feed = json.loads(FEED.read_text(encoding="utf-8"))
    if args.merge:
        batch = json.loads(args.merge.read_text(encoding="utf-8"))
        if date.fromisoformat(batch["updated_at"]) < date.fromisoformat(feed["updated_at"]):
            raise ValueError("Batch predates the published feed")
        for name in COLLECTIONS:
            items = index(feed[name], "id")
            items.update(index(batch.get(name, []), "id"))
            feed[name] = list(items.values())
        feed["updated_at"] = batch["updated_at"]
    validate(feed)
    if args.merge:
        pending = FEED.with_suffix(".tmp")
        pending.write_text(json.dumps(feed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        pending.replace(FEED)
    print(f"Power news: {len(feed['articles'])} articles, {len(feed['events'])} events, "
          f"{len(feed['topics'])} topics")


if __name__ == "__main__":
    main()
