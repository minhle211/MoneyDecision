"""Run the FinBud API locally. Usage: python run.py (from backend dir) or python backend/run.py (from root)."""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
