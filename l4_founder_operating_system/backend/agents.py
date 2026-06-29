import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY", "dummy_key"))

MODELS = {
    "qwen": {"name": "llama-3.1-8b-instant", "cost_per_1k": 0.0001},
    "gpt_oss": {"name": "llama-3.3-70b-versatile", "cost_per_1k": 0.0005},
    "premium": {"name": "llama-3.3-70b-versatile", "cost_per_1k": 0.001, "capabilities": ["complex", "strategic"]}
}

class OrchestratorAgent:
    @staticmethod
    def route_task(user_message: str):
        words = len(user_message.split())
        if "strategy" in user_message.lower() or "investor" in user_message.lower() or words > 40:
            return "strategic_research", "premium", "Complex query requiring deep reasoning and premium model."
        elif "summarize" in user_message.lower() or "prepare" in user_message.lower():
            return "memory_retrieval", "gpt_oss", "Context heavy query requiring memory synthesis."
        else:
            return "simple_action", "qwen", "Direct instruction requiring simple action."

class MemoryAgent:
    @staticmethod
    def summarize_memory(content: str):
        try:
            messages = [
                {"role": "system", "content": "Summarize the following business interaction into a single concise sentence."},
                {"role": "user", "content": content}
            ]
            completion = client.chat.completions.create(
                messages=messages, model=MODELS["qwen"]["name"], temperature=0.3, max_tokens=150
            )
            return completion.choices[0].message.content, completion.usage.total_tokens
        except Exception:
            return content[:100] + "...", 0

    @staticmethod
    def extract_tags(content: str):
        tags = []
        lower_content = content.lower()
        if "customer" in lower_content: tags.append("Customer")
        if "investor" in lower_content or "fund" in lower_content: tags.append("Investor")
        if "product" in lower_content or "feature" in lower_content: tags.append("Product")
        if "meeting" in lower_content: tags.append("Meeting")
        if not tags: tags.append("General")
        return tags

class ResearchAgent:
    @staticmethod
    def analyze_patterns(memories):
        text_context = "\n".join([m.summary for m in memories])
        try:
            messages = [
                {"role": "system", "content": "You are a Research Agent. Analyze these memories and identify 1-2 recurring patterns or strategic insights."},
                {"role": "user", "content": text_context}
            ]
            completion = client.chat.completions.create(
                messages=messages, model=MODELS["gpt_oss"]["name"], temperature=0.5, max_tokens=300
            )
            return completion.choices[0].message.content, completion.usage.total_tokens
        except Exception:
            return "No clear pattern found.", 0

class ActionAgent:
    @staticmethod
    def generate_response(system_prompt: str, user_history: list, model_name: str):
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(user_history)
        completion = client.chat.completions.create(
            messages=messages, model=model_name, temperature=0.7, max_tokens=1024
        )
        return completion.choices[0].message.content, completion.usage.total_tokens
