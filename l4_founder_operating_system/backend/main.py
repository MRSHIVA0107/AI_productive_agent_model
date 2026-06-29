from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
from sqlalchemy.orm import Session
import database
from agents import OrchestratorAgent, MemoryAgent, ResearchAgent, ActionAgent, MODELS

app = FastAPI(title="L4 Founder OS - Multi-Agent System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class MemoryCreate(BaseModel):
    content: str
    source: str

@app.post("/api/memory")
def add_memory(memory: MemoryCreate, db: Session = Depends(get_db)):
    summary, tokens = MemoryAgent.summarize_memory(memory.content)
    tags = MemoryAgent.extract_tags(memory.content)
    
    db_memory = database.Memory(
        category=tags[0] if tags else "General",
        content=memory.content,
        summary=summary,
        source=memory.source,
        tags=json.dumps(tags)
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    
    audit = database.AuditLog(
        request_type="memory_creation",
        model_used=MODELS["qwen"]["name"],
        routing_reason="Memory summarization via fast model",
        latency_ms=0,
        cost=(tokens / 1000.0) * MODELS["qwen"]["cost_per_1k"],
        tokens_used=tokens
    )
    db.add(audit)
    db.commit()
    
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

@app.post("/api/reflect")
def trigger_reflection(db: Session = Depends(get_db)):
    start_time = time.time()
    memories = db.query(database.Memory).order_by(database.Memory.created_at.desc()).limit(20).all()
    
    insight, tokens = ResearchAgent.analyze_patterns(memories)
    
    db_memory = database.Memory(
        category="Reflection",
        content=insight,
        summary=insight[:100] + "...",
        source="ResearchAgent",
        importance_score=2.0,
        tags=json.dumps(["Reflection", "Strategic Insight"])
    )
    db.add(db_memory)
    
    latency = (time.time() - start_time) * 1000
    audit = database.AuditLog(
        request_type="reflection",
        model_used=MODELS["gpt_oss"]["name"],
        routing_reason="Scheduled pattern reflection",
        latency_ms=latency,
        cost=(tokens / 1000.0) * MODELS["gpt_oss"]["cost_per_1k"],
        tokens_used=tokens
    )
    db.add(audit)
    db.commit()
    
    return {"insight": insight}

@app.post("/api/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    try:
        user_message = request.messages[-1].content if request.messages else ""
        
        task_type, tier, routing_reason = OrchestratorAgent.route_task(user_message)
        model_name = MODELS[tier]["name"]
        
        memories = db.query(database.Memory).all()
        relevant_memories = []
        for m in memories:
            if any(word.lower() in m.content.lower() or word.lower() in m.summary.lower() for word in user_message.split()):
                relevant_memories.append(m)
        relevant_memories = sorted(relevant_memories, key=lambda x: x.importance_score, reverse=True)[:5]
        
        system_prompt = "You are a Founder OS Assistant. You have the following historical context:\n"
        for m in relevant_memories:
            system_prompt += f"- [{m.category}] ({m.created_at.strftime('%Y-%m-%d')}): {m.summary}\n"
            
        if task_type == "strategic_research":
            system_prompt += "\nINSTRUCTION: This is a complex strategic request. Think deeply, analyze patterns, and provide actionable advice to the founder."
        elif task_type == "memory_retrieval":
            system_prompt += "\nINSTRUCTION: Summarize the context accurately to prepare the founder."
        
        user_history = [{"role": m.role, "content": m.content} for m in request.messages]
        response_text, tokens = ActionAgent.generate_response(system_prompt, user_history, model_name)
        
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
        
        summary, mem_tokens = MemoryAgent.summarize_memory(user_message)
        tags = MemoryAgent.extract_tags(user_message)
        implicit_memory = database.Memory(
            category=tags[0] if tags else "General",
            content=user_message,
            summary=summary,
            source="Implicit_Chat",
            tags=json.dumps(tags)
        )
        db.add(implicit_memory)
        
        db.commit()
        
        return {
            "response": response_text,
            "routing": {
                "task_type": task_type,
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
    uvicorn.run(app, host="0.0.0.0", port=8003)
