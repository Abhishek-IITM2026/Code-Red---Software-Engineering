from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from pymongo import MongoClient
from pymongo.errors import PyMongoError


BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.settings import get_settings


def _serialize(value: Any):
    if isinstance(value, dict):
        return {key: _serialize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_serialize(item) for item in value]
    if isinstance(value, tuple):
        return [_serialize(item) for item in value]
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if value.__class__.__name__ == "ObjectId":
        return str(value)
    return value


def inspect_mongo(collection_name: str | None, limit: int) -> int:
    settings = get_settings()
    client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=3000)

    try:
        client.admin.command("ping")
    except PyMongoError as exc:
        print("MongoDB connection failed.")
        print(f"URI: {settings.MONGO_URI}")
        print(f"Database: {settings.MONGO_DB_NAME}")
        print(f"Reason: {exc}")
        print("Start MongoDB first, then run this script again.")
        return 1

    database = client[settings.MONGO_DB_NAME]

    if collection_name:
        collection = database[collection_name]
        documents = list(collection.find().limit(limit))
        print(
            json.dumps(
                {
                    "dbName": database.name,
                    "collection": collection_name,
                    "count": collection.count_documents({}),
                    "documents": _serialize(documents),
                },
                indent=2,
                ensure_ascii=False,
            )
        )
        return 0

    collections = sorted(database.list_collection_names())
    payload = {
        "dbName": database.name,
        "collections": [
            {
                "name": name,
                "count": database[name].count_documents({}),
            }
            for name in collections
        ],
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect MongoDB data used by the backend.")
    parser.add_argument("--collection", help="Collection name to show sample documents from.")
    parser.add_argument("--limit", type=int, default=5, help="Maximum documents to print. Default: 5")
    args = parser.parse_args()
    return inspect_mongo(args.collection, args.limit)


if __name__ == "__main__":
    raise SystemExit(main())
