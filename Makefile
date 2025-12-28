.PHONY: help install test lint format clean run

help:
	@echo "SÚKL MCP Server - Makefile příkazy"
	@echo ""
	@echo "  make install    - Instalace projektu s dev závislostmi"
	@echo "  make test       - Spuštění testů"
	@echo "  make lint       - Kontrola kódu (ruff, mypy)"
	@echo "  make format     - Formátování kódu (black)"
	@echo "  make clean      - Vyčištění build artifacts"
	@echo "  make run        - Spuštění MCP serveru"
	@echo ""

install:
	@echo "📦 Instalace projektu..."
	cd sukl_mcp && pip install -e ".[dev]"
	@echo "✅ Instalace dokončena"

test:
	@echo "🧪 Spouštění testů..."
	cd sukl_mcp && pytest tests/ -v
	@echo "✅ Testy dokončeny"

test-cov:
	@echo "🧪 Spouštění testů s coverage..."
	cd sukl_mcp && pytest tests/ -v --cov=src/sukl_mcp --cov-report=term-missing
	@echo "✅ Testy s coverage dokončeny"

lint:
	@echo "🔍 Kontrola kódu..."
	@echo "  → ruff check..."
	cd sukl_mcp && ruff check src/
	@echo "  → mypy type checking..."
	cd sukl_mcp && mypy src/sukl_mcp/
	@echo "✅ Kontrola dokončena"

format:
	@echo "✨ Formátování kódu..."
	cd sukl_mcp && black src/ tests/
	@echo "✅ Formátování dokončeno"

clean:
	@echo "🧹 Čištění build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅ Čištění dokončeno"

run:
	@echo "🚀 Spouštění SÚKL MCP serveru..."
	cd sukl_mcp && python -m sukl_mcp.server

dev:
	@echo "🛠️  Vývojový režim - formátování + testy + lint..."
	@make format
	@make test
	@make lint
	@echo "✅ Vše hotovo!"
