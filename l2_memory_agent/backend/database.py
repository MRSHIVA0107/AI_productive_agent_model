from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import json

SQLALCHEMY_DATABASE_URL = "sqlite:///./memory.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True) # Meeting, Customer, Investor, Product, Decision, Action Item, Preference
    content = Column(Text)
    summary = Column(Text)
    source = Column(String)
    importance_score = Column(Float, default=1.0)
    tags = Column(String) # JSON string of list
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)
