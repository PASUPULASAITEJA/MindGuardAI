import os
import re
import sys
import asyncio
import uuid
import random
import numpy as np
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from sqlalchemy import text

# Add project root to path to ensure app imports resolve
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

# Load and resolve environment variable templates from .env before importing settings
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path)

db_url = os.environ.get("DATABASE_URL", "")

def resolve_env_vars(url: str) -> str:
    """
    Replaces ${VAR} placeholders with values from os.environ.
    """
    pattern = re.compile(r'\$\{(\w+)\}')
    while True:
        match = pattern.search(url)
        if not match:
            break
        var_name = match.group(1)
        val = os.environ.get(var_name, "")
        url = url[:match.start()] + val + url[match.end():]
    return url

# Resolve placeholders like ${POSTGRES_USER} and set environment variable
resolved_url = resolve_env_vars(db_url)

# Replace 'db' container hostname with 'localhost' if running locally outside container
if os.environ.get("ENVIRONMENT") == "development" and "@db:" in resolved_url and not os.path.exists('/.dockerenv'):
    resolved_url = resolved_url.replace("@db:", "@localhost:")

os.environ["DATABASE_URL"] = resolved_url

from app.db.session import AsyncSessionLocal, async_engine, Base
from app.core.security import get_password_hash
from app.models.users import User, UserRole
from app.models.mood_logs import MoodLog, InputType
from app.models.emotion_analyses import EmotionAnalysis
from app.models.assessments import Assessment, RiskLevel
from app.models.alerts import Alert, AlertStatus

async def seed_database():
    print("==============================================")
    print("        Database Seeding for MindGuard        ")
    print("==============================================")
    print(f"Connecting to database: {resolved_url.split('@')[-1]}")

    # Ensure tables are created
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("Cleaning up existing tables to ensure clean, empty state...")
            if "sqlite" in resolved_url:
                await session.execute(text("DELETE FROM safety_events"))
                await session.execute(text("DELETE FROM chat_messages"))
                await session.execute(text("DELETE FROM conversations"))
                await session.execute(text("DELETE FROM alerts"))
                await session.execute(text("DELETE FROM emotion_analyses"))
                await session.execute(text("DELETE FROM assessments"))
                await session.execute(text("DELETE FROM mood_logs"))
                await session.execute(text("DELETE FROM users"))
            else:
                await session.execute(text("TRUNCATE TABLE safety_events, chat_messages, conversations, alerts, emotion_analyses, assessments, mood_logs, users CASCADE"))

            print("SUCCESS: Database initialized cleanly with zero default accounts. Users can now register custom credentials via /register.")

if __name__ == "__main__":
    asyncio.run(seed_database())
