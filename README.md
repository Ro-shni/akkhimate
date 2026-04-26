<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AkkiMate - MBBS Study Companion

**AkkiMate** is an AI-powered study companion for MBBS students. It helps you master medical concepts through interactive tutoring, study roadmaps, flashcards, practice exams, and more.

### Key Features
- 🤖 **AI Tutor**: Ask questions about your study materials and get expert explanations
- 📚 **Study Roadmaps**: Generate comprehensive study plans
- 📝 **Practice Exams**: Create high-yield question sets with answer keys
- 🎯 **Flashcards**: Generate medical flashcards from your notes
- 📅 **Study Schedules**: Create 2-week structured study plans
- 📊 **Daily Wrap-ups**: AI-generated summaries of your learning sessions

---

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Ollama** - For running the local Qwen model - [Download](https://ollama.ai)

---

## Installation & Setup

### Step 1: Clone & Install Dependencies

```bash
# Clone or download this repository
cd AkkiMate

# Install Node.js dependencies
npm install
```

### Step 2: Install & Run Qwen Model Locally

#### **Option A: Using Ollama (Recommended - Easy Setup)**

1. **Install Ollama** (if not already installed):
   - macOS: `brew install ollama` or download from https://ollama.ai
   - Linux: Download from https://ollama.ai
   - Windows: Download from https://ollama.ai

2. **Start the Ollama service:**
   ```bash
   # macOS/Linux
   ollama serve
   
   # Windows - Ollama runs as a background service, just start it from Applications
   ```

3. **Pull and run the Qwen 3.5:9b model in another terminal:**
   ```bash
   # This downloads (~6GB) and starts the model
   ollama run qwen3.5:9b
   ```

   The model will now be available at: `http://localhost:11434/api/generate`

#### **Option B: Using Docker (For Linux)**

```bash
# If you prefer Docker
docker run -d -p 11434:11434 --name ollama ollama/ollama

# Pull the Qwen model
docker exec -it ollama ollama run qwen3.5:9b
```

### Step 3: Verify Qwen is Running

```bash
# Test the API endpoint
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3.5:9b","prompt":"Hello","stream":false}'

# You should see a JSON response with the model's output
```

### Step 4: Configure Environment Variables

The `.env` file is pre-configured to use the local Qwen API:

```env
VITE_QWEN_API_URL="http://localhost:11434/api/generate"
```

If you're running Ollama on a different machine or port, update this value accordingly.

### Step 5: Start the Development Server

```bash
npm start
# or
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Available Commands

```bash
npm start      # Start development server
npm run dev    # Same as npm start
npm run build  # Build for production
npm run lint   # Check TypeScript types
npm run deploy # Build and deploy to Vercel
```

---

## Troubleshooting

### ❌ Error: "Qwen model is not running"

**Solution:**
```bash
# Make sure Ollama is running
ollama serve    # Start Ollama

# In another terminal, verify Qwen is pulled
ollama run qwen3.5:9b
```

### ❌ Error: "Connection refused at localhost:11434"

**Solution:**
1. Verify Ollama is running: `curl http://localhost:11434`
2. Check your `.env` file has the correct `VITE_QWEN_API_URL`
3. On macOS, ensure Ollama is running from Applications

### ❌ Slow Responses

**Solution:**
- Qwen 3.5:9b requires ~6-9GB of VRAM
- For better performance, use a GPU (NVIDIA/Metal acceleration)
- Reduce the number of modules loaded at once

### ❌ Model Not Found

**Solution:**
```bash
# List installed models
ollama list

# If qwen3.5:9b is missing, pull it
ollama pull qwen3.5:9b
```

---

## Performance Tips

- ✅ **GPU Acceleration**: Ollama automatically uses GPU if available (NVIDIA CUDA, Apple Metal)
- ✅ **Model Size**: Qwen 3.5:9b is optimized for fast inference (~3-5 seconds per response)
- ✅ **Memory**: Ensure you have at least 12GB free RAM
- ✅ **Local Processing**: All inference happens locally - no data sent to external servers

---

## Project Structure

```
src/
├── components/          # React UI components
├── services/
│   └── gemini.ts       # Qwen API service (local inference)
├── types.ts            # TypeScript interfaces
└── index.css           # Styling

.env                    # Local environment config (git ignored)
.env.example            # Template for environment variables
vite.config.ts         # Vite build configuration
```

---

## Deployment

### GitHub Pages

The app is configured for GitHub Pages deployment via GitHub Actions:

```bash
git push  # Automatically deploys to https://ro-shni.github.io
```

**Note:** GitHub Pages hosts only the static files. To use Qwen inference from GitHub Pages, you'll need to either:
- Run Qwen locally and access the app via localhost
- Deploy Qwen on your own server and point the `VITE_QWEN_API_URL` to it

### Vercel Deployment

```bash
npm run deploy
```

---

## How Qwen Works

**Qwen 3.5:9b** is a lightweight, open-source LLM by Alibaba:
- **Size**: ~9 billion parameters
- **Speed**: Fast inference (3-5 seconds per response on modern hardware)
- **Quality**: Excellent reasoning and medical knowledge
- **Local**: Runs entirely on your machine - no internet required after initial setup

---

## License

This project is provided as-is for educational purposes.

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Verify Qwen is running: `curl http://localhost:11434`
3. Check `.env` configuration
4. View browser console for detailed error messages
