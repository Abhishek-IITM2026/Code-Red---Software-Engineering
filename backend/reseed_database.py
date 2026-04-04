import os
from pathlib import Path

os.environ["SEED_ON_STARTUP"] = "false"
os.environ["AUTO_CREATE_TABLES"] = "false"

from app import create_app
from app.extensions import db
from app.seed import seed_database


DB_PATH = Path(__file__).resolve().parent / "instance" / "app.db"


app = create_app()


if __name__ == "__main__":
    if DB_PATH.exists():
        DB_PATH.unlink()
    with app.app_context():
        db.create_all()
        seed_database(force=True)
        print("Database recreated and reseeded successfully.")
