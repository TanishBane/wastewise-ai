"""
WasteWise AI - Database Configuration & Connection Management
Provides SQLite durable persistence using SQLAlchemy with WAL mode,
thread-safety, and connection management.
"""

import os
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_DB_PATH = DATA_DIR / "wastewise.db"
DB_PATH = Path(os.environ.get("WASTEWISE_DB_PATH", str(DEFAULT_DB_PATH)))

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Enable SQLite WAL mode and foreign key enforcement on connect
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager that closes sessions and rolls back failed writes."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Create all database tables and seed default menu items if not present."""
    from backend import models
    from src.config import MENU_ITEMS

    Base.metadata.create_all(bind=engine)

    # Safe additive schema migration for actual_outcomes and upload_history
    try:
        with engine.connect() as conn:
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(actual_outcomes)")
            cols = [row[1] for row in cursor.fetchall()]
            if cols and "waste_cause" not in cols:
                cursor.execute("ALTER TABLE actual_outcomes ADD COLUMN waste_cause TEXT DEFAULT 'Over-preparation'")
            cursor.execute("PRAGMA table_info(upload_history)")
            u_cols = [row[1] for row in cursor.fetchall()]
            if u_cols and "is_active" not in u_cols:
                cursor.execute("ALTER TABLE upload_history ADD COLUMN is_active BOOLEAN DEFAULT 1")
            conn.connection.commit()
            cursor.close()
    except Exception:
        pass

    with get_db_context() as db:
        existing_items = db.query(models.MenuItemModel).count()
        if existing_items == 0:
            for key, item in MENU_ITEMS.items():
                db_item = models.MenuItemModel(
                    name=item.name,
                    category=item.category,
                    cost_price=item.cost_per_portion,
                    selling_price=item.selling_price,
                    prep_time_min=30,
                    prep_batch_size=item.prep_batch_size,
                    shelf_life_hours=item.shelf_life_hours,
                    base_demand=item.base_demand,
                    active=True,
                )
                db.add(db_item)
            db.commit()


def reset_demo_catalog():
    """Legacy no-op retained for callers from older releases.

    Resetting the active demo dataset must not delete a user's uploaded menu
    catalog or audit history. ``init_db`` ensures built-in dishes exist.
    """
    init_db()

