import pytest
from app.repositories.rag import RAGChunkRepository

def test_rag_chunk_repository_upsert_and_find(app):
    """Unit test for RAGChunkRepository basic operations."""
    repo = RAGChunkRepository()
    chunk_key = "test-chunk-1"
    payload = {
        "text": "This is a test chunk",
        "materialId": "mat-1",
        "sourceKey": "src-1"
    }

    # Upsert
    mongo_id = repo.upsert_chunk(chunk_key, payload)
    assert mongo_id is not None

    # Find
    found = repo.find_one(mongo_id)
    assert found is not None
    assert found["text"] == "This is a test chunk"
    assert found["chunkKey"] == chunk_key

def test_rag_chunk_repository_delete_by_filters(app):
    """Unit test for deleting chunks by filter."""
    repo = RAGChunkRepository()
    source_key = "src-delete-test"

    repo.upsert_chunk("c1", {"sourceKey": source_key, "text": "t1"})
    repo.upsert_chunk("c2", {"sourceKey": source_key, "text": "t2"})

    # Verify they exist
    assert len(repo.find_many({"sourceKey": source_key})) == 2

    # Delete
    repo.delete_by_filters({"sourceKey": source_key})

    # Verify they are gone
    assert len(repo.find_many({"sourceKey": source_key})) == 0
