import { LearningModule, ModelProvider } from "../types";

const QWEN_API_URL = (import.meta as any).env?.VITE_QWEN_API_URL || "http://localhost:11434/api/generate";
const QWEN_MODEL = (import.meta as any).env?.VITE_QWEN_MODEL || "qwen3.5:9b";
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";

interface QwenRequest {
  model: string;
  prompt: string;
  stream: boolean;
  temperature?: number;
  top_p?: number;
}

interface QwenResponse {
  response: string;
  done: boolean;
}

async function queryQwen(prompt: string, temperature: number = 0.7): Promise<string> {
  const response = await fetch(QWEN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      prompt,
      stream: false,
      temperature,
      top_p: 0.95,
    } as QwenRequest),
  });

  if (!response.ok) {
    throw new Error(`Qwen API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as QwenResponse;
  return data.response || "I'm sorry, I couldn't process that request.";
}

async function queryGemini(prompt: string, temperature: number = 0.7): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error: ${response.status} ${(errorData as any)?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini API.");
  }
  return text;
}

async function queryModel(prompt: string, model: ModelProvider, temperature: number = 0.7): Promise<string> {
  if (model === "gemini") {
    return queryGemini(prompt, temperature);
  }
  return queryQwen(prompt, temperature);
}

export async function askQuestion(
  question: string,
  modules: LearningModule[],
  chatHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [],
  model: ModelProvider = "qwen"
): Promise<string> {
  const validModules = modules.filter((mod) => mod.content && mod.content.length > 50);
  const moduleMetadata = validModules.map((mod) => `[ID: ${mod.id}, Name: ${mod.name}]`).join(", ");

  const chatContext =
    chatHistory.length > 0
      ? `\nRecent Chat History:\n${chatHistory
          .slice(-5)
          .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.parts[0]?.text || ""}`)
          .join("\n")}\n`
      : "";

  const moduleContext =
    validModules.length > 0
      ? `\nModule Context (${moduleMetadata}):\n${validModules
          .map((mod) => `${mod.name}: ${mod.content.substring(0, 1000)}...`)
          .join("\n\n")}\n`
      : "\nNote: No specific learning modules have been uploaded yet for this subject.\n";

  const systemPrompt = `You are an expert academic study tutor and MBBS companion. You operate as a high-fidelity Knowledge Retrieval System.

When answering:
1. Cite specific details and mention the source module if available.
2. Synthesize information across multiple modules.
3. Use professional medical terminology appropriate for MBBS students.
4. If hierarchical information is provided, consider generating Mermaid diagram code (wrap in \`\`\`mermaid\`).
5. Be formal, structured, and medical-focused.`;

  const prompt = `${systemPrompt}${moduleContext}${chatContext}\nStudent Question: ${question}\n\nTutor Response:`;

  return await queryModel(prompt, model, 0.7);
}

export async function generateStudyArtifact(
  type: "roadmap" | "test" | "schedule" | "flashcards" | "summary",
  modules: LearningModule[],
  extraContext?: string,
  chatHistory?: { role: "user" | "model"; parts: { text: string }[] }[],
  model: ModelProvider = "qwen"
): Promise<string> {
  const validModules = modules.filter((mod) => mod.content && mod.content.length > 50);
  const moduleMetadata = validModules.map((mod) => `[ID: ${mod.id}, Name: ${mod.name}]`).join(", ");

  const moduleContext =
    validModules.length > 0
      ? `\nModule Context (${moduleMetadata}):\n${validModules
          .map((mod) => `${mod.name}: ${mod.content.substring(0, 800)}...`)
          .join("\n\n")}\n`
      : "No modules provided - provide a generic high-level response.\n";

  const chatSnippet =
    chatHistory && chatHistory.length > 0
      ? `\nRecent Chat History:\n${chatHistory
          .slice(-5)
          .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.parts[0]?.text || ""}`)
          .join("\n")}\n`
      : "";

  const prompts = {
    roadmap: `Create a highly detailed medical study roadmap based on the provided modules. Break it down into:
1. Essential Concepts (High Yield)
2. Clinical Correlations
3. Advanced Integration
4. Detailed Milestones with timelines

Be specific and reference the module content provided.`,

    test: `Generate a Comprehensive Practice Exam for an MBBS student based on the provided modules. Include:
- 5 High-Yield MCQs (Multiple Choice)
- 3 Short Answer Questions requiring clinical reasoning
- 1 Case Study

After the questions, provide an 'ANSWER KEY & RECALL GUIDE' section. For each answer, explain WHY it is correct and provide a recall tip (mnemonic or visual cue).`,

    schedule: `Create a rigid 2-week MBBS-style study schedule to master the provided materials. Include:
- Daily time blocks
- Active Recall sessions
- Spaced Repetition slots for each module
- Specific topics from the modules provided`,

    flashcards: `Generate high-yield medical flashcards from the provided modules. Format each as:
Q: [Question] | A: [Answer]

Focus on diagnostic criteria, anatomical landmarks, biochemical regulators, and clinical pearls from the modules.`,

    summary: `Create a "Daily Wrap-up" summary based on the student's learning session:
1. Highlight key concepts the student studied or asked about
2. Identify potential knowledge gaps from the questions asked
3. Give 3 specific "Focus Tasks" for tomorrow
4. Provide motivational feedback on overall progress`,
  };

  const prompt = `You are an MBBS Study Tutor.

Task: ${prompts[type]}
${moduleContext}${chatSnippet}${
    type === "summary" && extraContext ? `\nStudent's Study Context: ${extraContext}` : ""
  }

Please provide a comprehensive and detailed response:`;

  return await queryModel(prompt, model, type === "summary" ? 0.4 : 0.7);
}
