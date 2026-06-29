# Founder Operating System Agent (Hackathon Submission)

This repository contains the progression of an AI Agent designed as a memory-enhanced executive assistant for startup founders. 
The API keys are already pre-configured (`.env` files included) so you can run the demos immediately out of the box!

---

## 🐳 Running with Docker (Recommended)
This repository contains a unified `docker-compose.yml` utilizing **Profiles** to seamlessly run any level without manually opening multiple terminals.

### Quick Start
1. Ensure Docker Desktop is running.
2. Spin up the final production agent (Level 4):
   ```powershell
   docker compose --profile l4 up --build -d
   ```
3. Open your browser to `http://localhost:3003`.

### Port Mappings
When using Docker, the frontends are dynamically mapped to avoid conflicts:
- **Level 1 Frontend:** `http://localhost:3000`
- **Level 2 Frontend:** `http://localhost:3001`
- **Level 3 Frontend:** `http://localhost:3002`
- **Level 4 Frontend:** `http://localhost:3003`

To run all levels simultaneously (Requires significant RAM):
```powershell
docker compose --profile all up --build -d
```
To stop everything:
```powershell
docker compose --profile all down
```

---

## 🛠 Manual Setup (Local Execution)
If you prefer not to use Docker, follow the manual execution steps below.

## 🟢 Level 1: Basic Agent (`l1_basic_agent`)
**Goal**: A working AI Chat Agent with a clean React interface and Groq integration.

### Setup & Run
Open two terminal windows:

**Terminal 1 (Backend):**
```powershell
cd l1_basic_agent/backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd l1_basic_agent/frontend
npm run dev
```

### Demonstration
1. Open the provided localhost URL (e.g., `http://localhost:5173`).
2. Ask: "What are the core metrics for a SaaS startup?"
3. The basic agent will respond immediately without any memory or routing logic.

---

## 🟡 Level 2: Memory Agent (`l2_memory_agent`)
**Goal**: Demonstrate the **Hindsight Memory** pattern.

### Setup & Run
Open two terminal windows:

**Terminal 1 (Backend):**
```powershell
cd l2_memory_agent/backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

**Terminal 2 (Frontend):**
```powershell
cd l2_memory_agent/frontend
npm run dev
```

### Demonstration
1. Open the app in your browser.
2. Using Postman, Curl, or Swagger (`http://localhost:8001/docs`), inject a memory:
   ```json
   POST /api/memory
   {
     "category": "Customer",
     "content": "Customer A requested a mobile application.",
     "summary": "Customer A requested mobile app.",
     "source": "Call Notes",
     "tags": ["Customer"]
   }
   ```
3. Ask the Chat UI: "What did Customer A request?"
4. The agent will retrieve the injected memory and accurately inform you about the mobile application.

---

## 🟠 Level 3: Runtime Agent (`l3_runtime_agent`)
**Goal**: Demonstrate **CascadeFlow Runtime Intelligence** (Model Routing & Budget tracking).

### Setup & Run
Open two terminal windows:

**Terminal 1 (Backend):**
```powershell
cd l3_runtime_agent/backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002
```

**Terminal 2 (Frontend):**
*(Note: L3 uses L2 frontend as a base. You can test routing logic directly via the terminal or swagger)*
```powershell
cd l3_runtime_agent/frontend
npm run dev
```

### Demonstration
1. Ask the Chat UI a simple question: "Hello!" 
   *(Backend routes to `llama-3.1-8b-instant` because it's cheap).*
2. Ask a complex question: "Provide a deep strategy for raising Series A funding from tier-1 investors."
   *(Backend detects complexity and routes to `mixtral-8x7b-32768` for premium reasoning).*
3. Check the audit logs (`http://localhost:8002/api/audit`) to see the cost, latency, and routing reasons for both requests.

---

## 🔴 Level 4: Founder OS (`l4_founder_operating_system`)
**Goal**: The Final Hackathon Submission. Full Multi-Agent Orchestration with an advanced Dashboard.

### Setup & Run
Open two terminal windows:

**Terminal 1 (Backend):**
```powershell
cd l4_founder_operating_system/backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8003
```

**Terminal 2 (Frontend):**
```powershell
cd l4_founder_operating_system/frontend
npm run dev
```

### Demonstration
1. Open the App. Notice the modern SaaS dashboard with sidebar navigation.
2. Go to the **Memory System** tab.
3. Use the UI to add:
   - "Customer A wants better reporting."
   - "Customer B complained about dashboard speed."
4. Go to the **Chat Agent** tab.
5. Ask: "Prepare me for my meetings tomorrow and summarize my context."
   *(The Orchestrator agent routes this to the Memory agent to synthesize context).*
6. Ask: "Give me a deep strategic analysis of our investor goals and customer issues."
   *(The Orchestrator agent escalates to the premium model).*
7. Go to the **Founder Insights** tab and click **Generate Strategic Reflection**.
   *(The Research agent analyzes all past memories to surface higher-level patterns).*
8. Go to the **Audit & CascadeFlow** tab.
   *(Observe precise cost savings, latency metrics, and why the Orchestrator chose specific models).*
