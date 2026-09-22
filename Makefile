.PHONY: up down logs migrate seed test test-integration lint test-e2e test-e2e-headed ci api-dev web-dev

up:
	docker compose up --build

down:
	docker compose down -v

logs:
	docker compose logs -f api web

migrate:
	cd api && npx prisma migrate deploy

seed:
	cd api && npm run db:seed

lint:
	cd api && npm run lint
	cd web && npm run lint

test:
	cd api && npm test
	cd web && npm test

test-integration:
	cd api && npm run test:integration

test-e2e:
	cd web && npm run test:e2e

test-e2e-headed:
	cd web && npm run test:e2e:headed

ci:
	cd api && npm run lint && npm test && npm run typecheck && npm run build
	cd web && npm run lint && npm test && npm run typecheck && npm run build
	docker compose up -d --build --wait postgres api web
	cd api && npm run test:integration
	cd web && npm run test:e2e
	docker compose down -v

api-dev:
	cd api && npm run dev

web-dev:
	cd web && npm run dev
