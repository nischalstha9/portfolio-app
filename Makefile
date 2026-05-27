DOCKER_REGISTRY ?= nischalstha/portfolio-app
PLATFORM        ?= linux/amd64

SSH_JUMP_HOST   ?= ubuntu@120.155.82.115:2222
SSH_TARGET_HOST ?= ubuntu@10.10.10.11
SSH_OPTS        ?= -o StrictHostKeyChecking=no
SSH_CMD          = ssh $(SSH_OPTS) -J $(SSH_JUMP_HOST) $(SSH_TARGET_HOST)
SCP_CMD          = scp $(SSH_OPTS) -o ProxyJump=$(SSH_JUMP_HOST)

REMOTE_DIR      ?= /opt/app-partition/portfolio-app

NEXT_PUBLIC_API_URL     ?= /api
NEXT_PUBLIC_MAIN_DOMAIN ?= portfolio.local

.PHONY: dev down logs build push deploy-files deploy-env deploy-up deploy remote-logs remote-status

## ── Local development ──────────────────────────

dev:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

## ── Build & Push ───────────────────────────────

build:
	docker buildx build --platform $(PLATFORM) -t $(DOCKER_REGISTRY):backend ./backend
	docker buildx build --platform $(PLATFORM) \
		--build-arg NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) \
		--build-arg NEXT_PUBLIC_MAIN_DOMAIN=$(NEXT_PUBLIC_MAIN_DOMAIN) \
		-t $(DOCKER_REGISTRY):frontend ./frontend

push:
	docker buildx build --platform $(PLATFORM) --push -t $(DOCKER_REGISTRY):backend ./backend
	docker buildx build --platform $(PLATFORM) --push \
		--build-arg NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) \
		--build-arg NEXT_PUBLIC_MAIN_DOMAIN=$(NEXT_PUBLIC_MAIN_DOMAIN) \
		-t $(DOCKER_REGISTRY):frontend ./frontend

## ── Deploy ─────────────────────────────────────

deploy-files:
	$(SSH_CMD) "mkdir -p $(REMOTE_DIR)/nginx"
	$(SCP_CMD) docker-compose.prod.yml $(SSH_TARGET_HOST):$(REMOTE_DIR)/docker-compose.yml
	$(SCP_CMD) nginx/nginx.conf.template $(SSH_TARGET_HOST):$(REMOTE_DIR)/nginx/nginx.conf.template

deploy-env:
	@test -n "$(ENV_CONTENT)" || (echo "ERROR: ENV_CONTENT is required" && exit 1)
	$(SSH_CMD) 'cat > $(REMOTE_DIR)/.env << '"'"'ENVEOF'"'"'$(subst ','"'"'"'"'"'"'"'"',$(ENV_CONTENT))ENVEOF'

deploy-up:
	$(SSH_CMD) "cd $(REMOTE_DIR) && docker compose pull && docker compose up -d"

deploy-status:
	$(SSH_CMD) "cd $(REMOTE_DIR) && docker compose ps"

deploy: push deploy-files deploy-up
	@echo "Deployment complete."

## ── Remote helpers ─────────────────────────────

remote-logs:
	$(SSH_CMD) "cd $(REMOTE_DIR) && docker compose logs -f --tail=50"

remote-status:
	$(SSH_CMD) "cd $(REMOTE_DIR) && docker compose ps"
