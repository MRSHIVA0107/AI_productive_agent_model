from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from groq import Groq
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import database

load_dotenv()

app = FastAPI(title="L2 Memory Agent - Founder OS")

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
    try:
        user_message = request.messages[-1].content if request.messages else ""
        
        # Retrieve context from memory based on simple keyword match (mocking vector search for L2)
        memories = db.query(database.Memory).all()
        relevant_memories = []
        for m in memories:
            # Naive match
            if any(word.lower() in m.content.lower() or word.lower() in m.summary.lower() for word in user_message.split()):
                relevant_memories.append(m)
        
        # Limit context to top 5 recent relevant
        relevant_memories = sorted(relevant_memories, key=lambda x: x.created_at, reverse=True)[:5]
        
        system_prompt = "You are a Founder OS Assistant. You have the following memories of the founder's business:\n"
        for m in relevant_memories:
            system_prompt += f"- [{m.category}] ({m.created_at.strftime('%Y-%m-%d')}): {m.summary}\n"
        
        messages_to_send = [{"role": "system", "content": system_prompt}]
        messages_to_send.extend([{"role": m.role, "content": m.content} for m in request.messages])
        
        chat_completion = client.chat.completions.create(
            messages=messages_to_send,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024
        )
        
        response_text = chat_completion.choices[0].message.content
        
        return {
            "response": response_text,
            "context_used": [m.id for m in relevant_memories]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
