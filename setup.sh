#!/bin/bash
set -e

echo "==================================="
echo "  AkkiMate - Ollama Setup Script"
echo "==================================="
echo ""

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "[OK] Ollama is already installed: $(ollama --version)"
else
    echo "[*] Installing Ollama..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ollama
        else
            echo "[*] Downloading Ollama for macOS..."
            curl -fsSL https://ollama.com/install.sh | sh
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "[*] Downloading Ollama for Linux..."
        curl -fsSL https://ollama.com/install.sh | sh
    else
        echo "[ERROR] Unsupported OS: $OSTYPE"
        echo "Please install Ollama manually from https://ollama.com/download"
        exit 1
    fi

    echo "[OK] Ollama installed successfully."
fi

echo ""
echo "[*] Starting Ollama server in the background..."
ollama serve &> /dev/null &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "[*] Waiting for Ollama server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        echo "[OK] Ollama server is running."
        break
    fi
    if [ $i -eq 30 ]; then
        echo "[ERROR] Ollama server failed to start within 30 seconds."
        exit 1
    fi
    sleep 1
done

echo ""
echo "[*] Pulling Qwen 3.5:9b model (this may take a while on first run)..."
ollama pull qwen3.5:9b

echo ""
echo "[*] Verifying model..."
if ollama list | grep -q "qwen3.5:9b"; then
    echo "[OK] Qwen 3.5:9b model is ready."
else
    echo "[ERROR] Model pull may have failed. Check 'ollama list' for available models."
    exit 1
fi

# Stop the background Ollama server
kill $OLLAMA_PID 2>/dev/null || true

echo ""
echo "[*] Installing npm dependencies..."
npm install

echo ""
echo "==================================="
echo "  Setup Complete!"
echo "==================================="
echo ""
echo "To start the app:"
echo "  1. Run: ./start.sh"
echo "  2. Open: http://localhost:3000"
echo ""
echo "For Gemini support, add your API key to .env:"
echo "  VITE_GEMINI_API_KEY=\"your-key-here\""
echo ""
