"""FastAPI main application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api.rag_routes import router as rag_router
from api.dashboard_routes import router as dashboard_router
from api.company_routes import router as company_router
from api.peer_comparison_routes import router as peer_comparison_router

app = FastAPI(
    title="Investment Decision System",
    description="Principles-based investment decision MVP",
    version="0.1.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(rag_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(company_router, prefix="/api")
app.include_router(peer_comparison_router, prefix="/api/peer-comparison")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Investment Decision System API"}

