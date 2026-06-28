BACKEND_DIR = Cvquery-backend-endpoints
FRONTEND_DIR = cvquery-frontend

.PHONY: dev backend frontend stop restart install install-backend install-frontend

dev: install
	@trap 'kill 0' SIGINT; \
	cd $(BACKEND_DIR) && npm run dev & \
	cd $(FRONTEND_DIR) && npm run dev & \
	wait

backend: install-backend
	cd $(BACKEND_DIR) && npm run dev

frontend: install-frontend
	cd $(FRONTEND_DIR) && npm run dev

stop:
	@pkill -f "nodemon src/server.js" 2>/dev/null && echo "Backend stopped" || echo "Backend was not running"
	@pkill -f "next dev" 2>/dev/null && echo "Frontend stopped" || echo "Frontend was not running"

restart: stop
	@sleep 1
	@$(MAKE) dev

install: install-backend install-frontend

install-backend:
	@if [ ! -d "$(BACKEND_DIR)/node_modules" ]; then cd $(BACKEND_DIR) && npm install; fi

install-frontend:
	@if [ ! -d "$(FRONTEND_DIR)/node_modules" ]; then cd $(FRONTEND_DIR) && npm install; fi
