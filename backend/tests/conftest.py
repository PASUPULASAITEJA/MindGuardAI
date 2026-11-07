import os
os.environ["TESTING"] = "true"
import pytest
from unittest.mock import MagicMock
from app.ml.inference import ml_service

@pytest.fixture(autouse=True)
def mock_ml_models_loading(monkeypatch):
    """Bypasses heavy PyTorch model weights disk reading during automated tests."""
    monkeypatch.setattr(ml_service, "load_models", MagicMock())
    ml_service.models_loaded = True
