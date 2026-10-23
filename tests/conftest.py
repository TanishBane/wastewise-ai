import pytest
from backend.database import init_db
import os

# Ensure the tests use a clean isolated database
os.environ["WASTEWISE_DB_PATH"] = "test.db"

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
