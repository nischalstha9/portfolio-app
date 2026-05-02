DOCKER_REGISTRY := nischalstha/portfolio-app
PLATFORM := linux/amd64

SSH_JUMP := ubuntu@120.155.82.115:2222
SSH_TARGET := ubuntu@10.10.10.11
SSH_CMD := ssh -J $(SSH_JUMP) $(SSH_TARGET)

REMOTE_DIR := /opt/app-partition/portfolio-app
REMOTE_FILES := docker-compose.prod.yml .env.prod nginx/nginx.conf.template

.PHONY: build push deploy deploy-files deploy-up dev down logs

## Local development
dev:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

## Build production images (linux/amd64)
build:
	docker buildx build --platform $(PLATFORM) -t $(DOCKER_REGISTRY):backend ./backend
	docker buildx build --platform $(PLATFORM) -t $(DOCKER_REGISTRY):frontend ./frontend

## Build and push to Docker Hub
push:
	docker buildx build --platform $(PLATFORM) --push -t $(DOCKER_REGISTRY):backend ./backend
	docker buildx build --platform $(PLATFORM) --push -t $(DOCKER_REGISTRY):frontend ./frontend

## Copy config files to remote server
deploy-files:
	$(SSH_CMD) "mkdir -p $(REMOTE_DIR)/nginx"
	scp -o ProxyJump=$(SSH_JUMP) docker-compose.prod.yml $(SSH_TARGET):$(REMOTE_DIR)/docker-compose.yml
	scp -o ProxyJump=$(SSH_JUMP) .env.prod $(SSH_TARGET):$(REMOTE_DIR)/.env
	scp -o ProxyJump=$(SSH_JUMP) nginx/nginx.conf.template $(SSH_TARGET):$(REMOTE_DIR)/nginx/nginx.conf.template

## Pull latest images and restart on remote
deploy-up:
	$(SSH_CMD) "cd $(REMOTE_DIR) && docker compose pull && docker compose up -d"

## Full deployment: build, push, copy files, restart
deploy: push deploy-files deploy-up
	@echo "Deployment complete."

## View remote logs
remote-logs:
	$(SSH_CMD) "cd $(REMOTE_DIR) && docker compose logs -f --tail=50"

## Check remote status
remote-status:
	$(SSH_CMD) "cd $(REMOTE_DIR) && docker compose ps"
