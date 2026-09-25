import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, DateTime, Text, Enum as SQLEnum
from app.db.session import Base
import enum

class AcademicEventType(str, enum.Enum):
    SEMESTER_START = "SEMESTER_START"
    ASSIGNMENT_DEADLINE = "ASSIGNMENT_DEADLINE"
    MIDTERMS = "MIDTERMS"
    FINAL_EXAMS = "FINAL_EXAMS"
    PROJECT_SUBMISSION = "PROJECT_SUBMISSION"
    PLACEMENT_SEASON = "PLACEMENT_SEASON"
    RESULTS_DECLARATION = "RESULTS_DECLARATION"
    VACATION = "VACATION"

class AcademicEvent(Base):
    __tablename__ = "academic_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    event_type = Column(SQLEnum(AcademicEventType), nullable=False)
    
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    
    academic_year = Column(String(50), default="2026-2027")
    semester = Column(String(50), nullable=True) # e.g. "Fall 2026", "Spring 2027"
    department = Column(String(100), nullable=True) # None = all departments
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
