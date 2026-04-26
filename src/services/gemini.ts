import { LearningModule } from "../types";

const QWEN_API_URL = process.env.VITE_QWEN_API_URL || "http://localhost:11434/api/generate";
const QWEN_MODEL = "qwen3.5:9b";

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
  try {
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
  } catch (error: any) {
    console.error("Qwen API error:", error);
    if (error.message.includes("fetch")) {
      return "Error: Qwen model is not running. Please start Qwen locally using: ollama run qwen3.5:9b";
    }
    throw error;
  }
}

export async function askQuestion(
  question: string,
  modules: LearningModule[],
  chatHistory: { role: "user" | "model"; parts: { text: string }[] }[] = []
): Promise<string> {
  // Guard: Ensure we only use valid modules
  const validModules = modules.filter((mod) => mod.content && mod.content.length > 50);
  const moduleMetadata = validModules.map((mod) => `[ID: ${mod.id}, Name: ${mod.name}]`).join(", ");

  // Format chat history
  const chatContext =
    chatHistory.length > 0
      ? `\nRecent Chat History:\n${chatHistory
          .slice(-5)
          .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.parts[0]?.text || ""}`)
          .join("\n")}\n`
      : "";

  // Format module content (truncate to avoid token limits)
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

  return await queryQwen(prompt, 0.7);
}

export async function generateStudyArtifact(
  type: "roadmap" | "test" | "schedule" | "flashcards" | "summary",
  modules: LearningModule[],
  extraContext?: string,
  chatHistory?: { role: "user" | "model"; parts: { text: string }[] }[]
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

  return await queryQwen(prompt, type === "summary" ? 0.4 : 0.7);
}
