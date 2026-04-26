#!/bin/bash
set -e

echo "==================================="
echo "  AkkiMate - Start Script"
echo "==================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "[ERROR] Ollama is not installed. Run ./setup.sh first."
    exit 1
fi

# Check if Ollama server is already running
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "[OK] Ollama server is already running."
else
    echo "[*] Starting Ollama server..."
    ollama serve &> /dev/null &

    # Wait for server to start
    for i in {1..15}; do
        if curl -s http://localhost:11434/api/tags &> /dev/null; then
            echo "[OK] Ollama server is running."
            break
        fi
        if [ $i -eq 15 ]; then
            echo "[ERROR] Ollama server failed to start."
            exit 1
        fi
        sleep 1
    done
fi

# Verify model is available
if ollama list | grep -q "qwen3.5:9b"; then
    echo "[OK] Qwen 3.5:9b model is available."
else
    echo "[WARN] Qwen 3.5:9b model not found. Pulling now..."
    ollama pull qwen3.5:9b
fi

echo ""
echo "[*] Starting the dev server..."
echo "    App will be available at http://localhost:3000"
echo ""

npm run dev
