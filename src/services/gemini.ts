import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LearningModule } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askQuestion(
  question: string,
  modules: LearningModule[],
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
): Promise<string> {
  const model = "gemini-2.0-flash";
  
  // Guard: Ensure we only send valid parts
  const validModules = modules.filter(mod => mod.content && mod.content.length > 50);
  const moduleMetadata = validModules.map(mod => `[ID: ${mod.id}, Name: ${mod.name}]`).join(', ');
  
  const moduleParts = validModules.map(mod => ({
    inlineData: {
      mimeType: mod.mimeType,
      data: mod.content
    }
  }));

  const textPart = {
    text: `You are an expert academic study tutor and MBBS companion. You operate as a high-fidelity Knowledge Retrieval System.
    
    ${validModules.length > 0 
      ? `CRITICAL: You have been provided with source modules: ${moduleMetadata}. Treat them as a unified, indexed knowledge base.` 
      : "NOTICE: No specific learning modules have been uploaded yet for this subject."
    }
    
    When answering:
    1. cite specific details and ALWAYS mention the page number if available.
    2. Synthesis: Connect information across modules.
    3. Medical Accuracy: For MBBS students, use professional terminology.
    4. Interpret Handwriting: Carefully analyze any uploaded scans.
    5. Visuals: If hierarchical, generate a Mermaid diagram code block (use \`\`\`mermaid\`).
    
    Style: Formal, structured, and medical-focused.
    
    Question: ${question}`
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...chatHistory,
        { parts: [...moduleParts, textPart] }
      ],
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text ?? "I'm sorry, I couldn't process that request.";
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    if (error?.message?.includes("document has no pages")) {
      return "One of your uploaded PDFs seems to be empty or unreadable by the AI. Please try re-uploading a clear version.";
    }
    throw error;
  }
}

export async function generateStudyArtifact(
  type: 'roadmap' | 'test' | 'schedule' | 'flashcards' | 'summary',
  modules: LearningModule[],
  extraContext?: string,
  chatHistory?: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> {
  const model = "gemini-2.0-flash";
  
  const validModules = modules.filter(mod => mod.content && mod.content.length > 50);
  const moduleMetadata = validModules.map(mod => `[ID: ${mod.id}, Name: ${mod.name}]`).join(', ');
  
  const moduleParts = validModules.map(mod => ({
    inlineData: {
      mimeType: mod.mimeType,
      data: mod.content
    }
  }));

  const chatSnippet = chatHistory 
    ? `Recent Chat History:\n${chatHistory.slice(-10).map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}`
    : '';

  const prompts = {
    roadmap: `As an MBBS Tutor, create a highly detailed medical study roadmap based ONLY on the attached modules (${moduleMetadata}). 
      Break it down into: 
      1. Essential Concepts (High Yield)
      2. Clinical Correlations
      3. Advanced Integration
      4. Detailed Milestones. 
      Do NOT ask for more information; use what is provided. If details are missing, extrapolate based on standard MBBS curricula for these topics.`,
    
    test: `Generate a Comprehensive Practice Exam for an MBBS student based on the attached modules.
      Include:
      - 5 High-Yield MCQs (Multiple Choice)
      - 3 Short Answer Questions requiring clinical reasoning.
      - 1 Case Study.
      
      IMPORTANT: After the questions, provide a section called 'ANSWER KEY & RECALL GUIDE'. 
      For each answer, explain WHY it is correct and provide a 'Recall Tip' (mnemonic or visual cue) to help the student remember this for next time.
      Design it to be challenging but fair.`,
    
    schedule: `Create a rigid 2-week MBBS-style study schedule to master the provided materials. 
      Include daily time blocks, 'Active Recall' sessions, and 'Spaced Repetition' slots for each specific module (${moduleMetadata}).`,
    
    flashcards: "Generate high-yield medical flashcards from these modules. Format as: Q: [Question] | A: [Answer]. Focus on diagnostic criteria, anatomical landmarks, and biochemical regulators.",
    
    summary: `You are summarizing a student's learning session. 
      Context of activities: ${extraContext}
      ${chatSnippet}
      
      Provide a "Daily Wrap-up" that:
      1. Highlights key concepts the student asked about or studied.
      2. Identifies potential knowledge gaps based on the questions asked.
      3. Gives 3 specific "Focus Tasks" for tomorrow.
      4. Encapsulates the overall progress in a motivating way.`
  };

  const textPart = {
    text: `Subject: MBBS Study Assistance
    Task: ${prompts[type]}
    
    Context:
    ${validModules.length > 0 
      ? `Attached are ${validModules.length} source modules. You MUST use their specific content.` 
      : "No modules provided - provide a generic high-level response and prompt for uploads."}
    
    ${type === 'summary' ? `Student Activity: ${extraContext}` : ''}`
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [...moduleParts, textPart] }],
      config: {
        temperature: 0.4,
      }
    });

    return response.text ?? "Failed to generate artifact.";
  } catch (error: any) {
    console.error("Gemini Artifact Error:", error);
    if (error?.message?.includes("no pages")) {
      return "The analysis failed because one of your documents is unreadable. Please check your uploads.";
    }
    return "The AI is currently overwhelmed by the complexity of these documents. Try analyzing fewer modules at once.";
  }
}
