# Investment Decision System MVP

A clean, minimal, stateless MVP skeleton for a principles-based investment decision system.

## Brief

This is a scaffolding-only implementation that demonstrates the architecture and data flow for an investment decision system. The system processes user preferences through an orchestrator, which coordinates agents and a principles engine to generate investment decisions.

**Key Features:**
- Stateless architecture (no database, no authentication, no persistence)
- Structured JSON input/output
- In-memory vector store for session-only RAG (cleared on session end)
- Minimal, readable code with one responsibility per file

## Architecture

### Frontend
- **Framework**: React with Vite (chosen for simplicity and fast development setup)
- **Components**:
  - `GuidedChat`: Collects user preferences (hardcoded for MVP)
  - `Dashboard`: Displays decision overview
  - `DecisionTable`: Shows detailed decision in table format

### Backend
- **Framework**: Python + FastAPI
- **Modules**:
  - `api/`: API routes
  - `agents.py`: Combined macro/sector/Bursa agents + in-memory vector store
  - `principles/`: Principles engine (stub implementation)
  - `schemas/`: Pydantic models for data validation

## Data Contracts

### Preferences Input
```json
{
  "time_horizon": "long",
  "risk_level": "balanced",
  "sectors": ["technology", "finance"]
}
```

### Macro Signal Output
```json
{
  "macro_stance": "risk_on",
  "confidence": 0.72,
  "summary": "Inflation easing with stable growth."
}
```

### Decision Output
```json
{
  "decision": "hold",
  "confidence": 0.68,
  "reasoning": [
    "Macro environment supports moderate risk",
    "Principles favor capital preservation"
  ]
}
```

## Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start Backend Server

From the `backend` directory:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

### Start Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Using the Application

1. Open `http://localhost:5173` in your browser
2. Click "Submit Preferences" in the GuidedChat component
3. The system will send hardcoded preferences to the backend
4. The backend processes the preferences through the orchestrator
5. The decision is displayed in both Dashboard and DecisionTable components

## MVP Flow

1. Frontend sends hardcoded preferences
2. Backend receives preferences via `/api/decision` endpoint
3. API routes call macro agent
4. Macro agent returns mocked signal data
5. Principles engine converts signal to decision
6. Backend returns decision JSON
7. Frontend renders decision in Dashboard and DecisionTable
8. Session ends → all vectors and temporary data cleared

## Project Structure

```
ambank/
├── backend/
│   ├── main.py
│   ├── api/
│   │   └── routes.py
│   ├── agents.py
│   ├── principles/
│   │   └── principles_engine.py
│   ├── schemas/
│   │   ├── preferences.py
│   │   ├── signals.py
│   │   └── decision.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GuidedChat.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── DecisionTable.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Notes

- This is a **scaffolding-only** implementation. All logic is stubbed with hardcoded values.
- No database, authentication, or persistence is implemented.
- The vector store is in-memory only and cleared on session end.
- All components follow a single responsibility principle.
- The system is designed to be stateless and minimal.

