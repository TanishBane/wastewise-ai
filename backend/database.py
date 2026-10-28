"""
WasteWise AI - Database Configuration & Connection Management
Supports Supabase PostgreSQL durable persistence via SQLAlchemy with connection pooling,
while maintaining seamless SQLite fallback for local developer machines.
"""

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import NullPool
import logging

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent.parent
IS_SERVERLESS = bool(
    os.environ.get("VERCEL")
    or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    or os.environ.get("LAMBDA_TASK_ROOT")
)

if IS_SERVERLESS:
    DATA_DIR = Path("/tmp/data")
else:
    DATA_DIR = ROOT_DIR / "data"

try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    DATA_DIR = Path("/tmp/data")
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass

# Supabase PostgreSQL or SQLite configuration
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

if DATABASE_URL:
    # Normalize postgres:// to postgresql:// for SQLAlchemy 2.0
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Supabase / PostgreSQL engine: NullPool for serverless, connection pooling for containers
    if IS_SERVERLESS:
        engine = create_engine(
            DATABASE_URL,
            poolclass=NullPool,
            echo=False,
        )
    else:
        engine = create_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_recycle=300,
            pool_pre_ping=True,
            echo=False,
        )
    is_sqlite = False
else:
    if IS_SERVERLESS:
        DEFAULT_DB_PATH = Path("/tmp/wastewise.db")
    else:
        DEFAULT_DB_PATH = DATA_DIR / "wastewise.db"

    DB_PATH = Path(os.environ.get("WASTEWISE_DB_PATH", str(DEFAULT_DB_PATH)))
    try:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        DB_PATH = Path("/tmp/wastewise.db")

    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
    is_sqlite = True

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


def set_session_user(db: Session, user_id: str, role: str = "authenticated"):
    """
    Sets request-scoped session configuration for PostgreSQL RLS.
    In PostgreSQL, this sets 'request.jwt.claim.sub' and 'request.jwt.claim.role'
    scoped strictly to the current transaction (is_local=true).
    """
    if not is_sqlite and user_id:
        from sqlalchemy import text
        try:
            db.execute(
                text(
                    "SELECT set_config('request.jwt.claim.sub', :sub, true), "
                    "set_config('request.jwt.claim.role', :role, true)"
                ),
                {"sub": str(user_id), "role": role},
            )
        except Exception:
            pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
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
    """Create all database tables and seed default organization & menu catalog."""
    from backend import models
    from src.config import MENU_ITEMS

    Base.metadata.create_all(bind=engine)

    # Additive SQLite migration for existing local databases
    if is_sqlite:
        try:
            with engine.connect() as conn:
                cursor = conn.connection.cursor()
                
                # Check for legacy INTEGER primary keys and migrate table schema
                legacy_tables = ["menu_items", "actual_outcomes", "preparation_plans", "forecast_runs", "upload_history"]
                for tbl in legacy_tables:
                    cursor.execute(f"PRAGMA table_info({tbl})")
                    cols = cursor.fetchall()
                    id_col = next((c for c in cols if c[1] == "id"), None)
                    if id_col and "INT" in str(id_col[2]).upper():
                        # Migrate old integer PK table to UUID PK
                        cursor.execute(f"ALTER TABLE {tbl} RENAME TO {tbl}_legacy_int")
                        Base.metadata.tables[tbl].create(bind=conn)
                        common_cols = [c[1] for c in cols if c[1] != "id"]
                        if common_cols:
                            cols_str = ", ".join(common_cols)
                            cursor.execute(
                                f"INSERT INTO {tbl} (id, {cols_str}) "
                                f"SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-a' || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), "
                                f"{cols_str} FROM {tbl}_legacy_int"
                            )
                        cursor.execute(f"DROP TABLE {tbl}_legacy_int")

                # Helper to check and add column if missing
                def ensure_col(table: str, col: str, col_type: str, default: str = None):
                    cursor.execute(f"PRAGMA table_info({table})")
                    cols = [row[1] for row in cursor.fetchall()]
                    if cols and col not in cols:
                        def_clause = f" DEFAULT {default}" if default is not None else ""
                        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}{def_clause}")

                ensure_col("actual_outcomes", "organization_id", "TEXT", f"'{models.DEFAULT_ORG_ID}'")
                ensure_col("actual_outcomes", "user_id", "TEXT")
                ensure_col("actual_outcomes", "waste_cause", "TEXT", "'Over-preparation'")

                ensure_col("menu_items", "organization_id", "TEXT", f"'{models.DEFAULT_ORG_ID}'")

                ensure_col("upload_history", "organization_id", "TEXT", f"'{models.DEFAULT_ORG_ID}'")
                ensure_col("upload_history", "user_id", "TEXT")
                ensure_col("upload_history", "is_active", "BOOLEAN", "1")

                ensure_col("forecast_runs", "organization_id", "TEXT", f"'{models.DEFAULT_ORG_ID}'")
                ensure_col("forecast_runs", "user_id", "TEXT")

                ensure_col("preparation_plans", "organization_id", "TEXT", f"'{models.DEFAULT_ORG_ID}'")
                ensure_col("preparation_plans", "user_id", "TEXT")

                conn.connection.commit()
                cursor.close()
        except Exception as exc:
            logger.warning("Database schema auto-migration notice: %s", exc)

    with get_db_context() as db:
        # Seed default demonstration organization
        demo_org = (
            db.query(models.OrganizationModel)
            .filter(models.OrganizationModel.id == models.DEFAULT_ORG_ID)
            .first()
        )
        if not demo_org:
            demo_org = models.OrganizationModel(
                id=models.DEFAULT_ORG_ID,
                name="ADAPPT Canteen Central",
                slug="adappt-canteen-central",
            )
            db.add(demo_org)
            db.commit()

        # Seed default menu items for the demo organization
        existing_items = (
            db.query(models.MenuItemModel)
            .filter(models.MenuItemModel.organization_id == models.DEFAULT_ORG_ID)
            .count()
        )
        if existing_items == 0:
            for key, item in MENU_ITEMS.items():
                db_item = models.MenuItemModel(
                    organization_id=models.DEFAULT_ORG_ID,
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
    """Ensure default organization and dishes exist."""
    init_db()
