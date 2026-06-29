# Founder OS Hackathon - Dummy Implementations & Upgrade Path

This document tracks the "dummy" or mock implementations used to rapidly build the hackathon prototype, along with their respective production-grade upgrade paths.

## 1. Routing Logic (CascadeFlow)
* **Dummy Implementation:** The `route_model` function uses simple string-matching heuristics (e.g., `if "strategy" in user_message or len(words) > 50`) to decide if a prompt requires a premium model or a cheaper base model.
* **Production Upgrade:** Implement a lightweight Semantic Classifier (e.g., a quantized BERT model) or a specialized low-latency LLM router that dynamically assesses intent, token complexity, and required reasoning depth before routing.

## 2. Authentication & Multi-Tenancy
* **Dummy Implementation:** The system lacks authentication (no login screen, no JWTs). The SQLite database stores all memories globally, effectively operating as a single-tenant application for one founder.
* **Production Upgrade:** Integrate an auth provider (Clerk, Auth0, or Supabase Auth). Add a `user_id` column to all database tables (`Memory`, `AuditLog`, `Insight`) and apply row-level security (RLS) to ensure data privacy across multiple users.

## 3. Database Architecture & Memory Retrieval
* **Dummy Implementation:** Uses a local `test.db` (SQLite) with basic SQL `LIKE` queries for keyword matching to retrieve memories.
* **Production Upgrade:** 
    1. **Relational:** Migrate to a managed PostgreSQL instance (e.g., Neon, AWS RDS).
    2. **Vector/Semantic:** Introduce a Vector Database (Pinecone, Qdrant, or pgvector) to store text embeddings of memories, enabling true semantic search ("concept" matching rather than just "keyword" matching).

## 4. Background Tasks & Agent Scheduling
* **Dummy Implementation:** The "Founder Insights" generation (Research Agent) is triggered synchronously via a manual button click in the UI.
* **Production Upgrade:** Deploy a task queue and worker architecture (Celery + Redis, or Temporal) to run these high-latency reflective tasks asynchronously. Schedule them via a cron job (e.g., running every Sunday night to prepare for the founder's week ahead).

## 5. Model Pricing & Cost Analytics
* **Dummy Implementation:** The `AuditLog` calculates costs using a hardcoded dictionary of fixed model prices (e.g., `"cost_per_1k": 0.0001`).
* **Production Upgrade:** API providers frequently adjust pricing. Integrate with an LLM observability platform (like Helicone or Portkey) to fetch dynamic, accurate billing metrics, or maintain a centralized, frequently updated configuration service.

## 6. API Key Management
* **Dummy Implementation:** Backend code falls back to a hardcoded `"dummy_key"` if the `.env` variable is missing. 
* **Production Upgrade:** Enforce strict secrets management using AWS Secrets Manager or HashiCorp Vault. The application should fail fast on boot if critical secrets are missing, rather than defaulting to a dummy key.
