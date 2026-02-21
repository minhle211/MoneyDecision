# FinBud – common tasks (use from project root)
# Windows: use Git Bash or WSL to run make, or run the commands manually.

.PHONY: backend frontend test docker-up docker-down install

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest tests/ -v

docker-up:
	docker compose up --build

docker-down:
	docker compose down
