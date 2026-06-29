from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
from groq import Groq
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import database

load_dotenv()

app = FastAPI(title="L3 Runtime Agent - Founder OS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy_key"))

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

MODELS = {
    "qwen": {"name": "llama-3.1-8b-instant", "cost_per_1k": 0.0001, "capabilities": ["simple", "chat"]},
    "gpt_oss": {"name": "llama-3.3-70b-versatile", "cost_per_1k": 0.0005, "capabilities": ["medium", "reasoning"]},
    "premium": {"name": "llama-3.3-70b-versatile", "cost_per_1k": 0.001, "capabilities": ["complex", "strategic"]}
}

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class MemoryCreate(BaseModel):
    category: str
    content: str
    summary: str
    source: str
    importance_score: float = 1.0
    tags: List[str]

def route_model(user_message: str):
    words = len(user_message.split())
    if "strategy" in user_message.lower() or "investor" in user_message.lower() or words > 50:
        return "premium", MODELS["premium"]["name"], "Complex strategic request or long context"
    elif "summarize" in user_message.lower() or words > 20:
        return "gpt_oss", MODELS["gpt_oss"]["name"], "Medium complexity request"
    else:
        return "qwen", MODELS["qwen"]["name"], "Simple request"

@app.post("/api/memory")
def add_memory(memory: MemoryCreate, db: Session = Depends(get_db)):
    db_memory = database.Memory(
        category=memory.category,
        content=memory.content,
        summary=memory.summary,
        source=memory.source,
        importance_score=memory.importance_score,
        tags=json.dumps(memory.tags)
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

@app.get("/api/memory")
def get_memories(db: Session = Depends(get_db)):
    memories = db.query(database.Memory).order_by(database.Memory.created_at.desc()).all()
    result = []
    for m in memories:
        result.append({
            "id": m.id,
            "category": m.category,
            "content": m.content,
            "summary": m.summary,
            "source": m.source,
            "importance_score": m.importance_score,
            "tags": json.loads(m.tags) if m.tags else [],
            "created_at": m.created_at
        })
    return result

@app.post("/api/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    try:
        user_message = request.messages[-1].content if request.messages else ""
        tier, model_name, routing_reason = route_model(user_message)
        
        memories = db.query(database.Memory).all()
        relevant_memories = []
        for m in memories:
            if any(word.lower() in m.content.lower() or word.lower() in m.summary.lower() for word in user_message.split()):
                relevant_memories.append(m)
        relevant_memories = sorted(relevant_memories, key=lambda x: x.created_at, reverse=True)[:5]
        
        system_prompt = "You are a Founder OS Assistant. You have the following memories:\n"
        for m in relevant_memories:
            system_prompt += f"- [{m.category}] ({m.created_at.strftime('%Y-%m-%d')}): {m.summary}\n"
        
        messages_to_send = [{"role": "system", "content": system_prompt}]
        messages_to_send.extend([{"role": m.role, "content": m.content} for m in request.messages])
        
        chat_completion = client.chat.completions.create(
            messages=messages_to_send,
            model=model_name,
            temperature=0.7,
            max_tokens=1024
        )
        
        response_text = chat_completion.choices[0].message.content
        tokens = chat_completion.usage.total_tokens if hasattr(chat_completion, 'usage') and chat_completion.usage else len(response_text.split()) * 2
        latency = (time.time() - start_time) * 1000
        cost = (tokens / 1000.0) * MODELS[tier]["cost_per_1k"]
        
        audit = database.AuditLog(
            request_type="chat",
            model_used=model_name,
            routing_reason=routing_reason,
            latency_ms=latency,
            cost=cost,
            tokens_used=tokens
        )
        db.add(audit)
        db.commit()
        
        return {
            "response": response_text,
            "routing": {
                "model": model_name,
                "reason": routing_reason,
                "latency_ms": latency,
                "cost": cost,
                "tokens": tokens
            },
            "context_used": len(relevant_memories)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/audit")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(database.AuditLog).order_by(database.AuditLog.created_at.desc()).all()
    return logs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
