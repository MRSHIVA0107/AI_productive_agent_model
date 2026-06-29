from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import json

SQLALCHEMY_DATABASE_URL = "sqlite:///./runtime.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Memory(Base):
    __tablename__ = "memories"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)
    content = Column(Text)
    summary = Column(Text)
    source = Column(String)
    importance_score = Column(Float, default=1.0)
    tags = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    request_type = Column(String)
    model_used = Column(String)
    routing_reason = Column(String)
    latency_ms = Column(Float)
    cost = Column(Float)
    tokens_used = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)
