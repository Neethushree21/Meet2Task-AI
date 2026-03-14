import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ExtractedTask {
  title: string;
  description: string;
  assigned_to: string | null;
  priority: "high" | "medium" | "low";
  type: "task" | "bug" | "decision";
  deadline: string | null;
}

export interface MeetingAnalysis {
  summary: string;
  tasks: ExtractedTask[];
  decisions: string[];
  key_points: string[];
}

function chunkTranscript(transcript: string, chunkSize = 3000): string[] {
  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [transcript];
}

async function analyzeChunk(
  model: ReturnType<typeof genAI.getGenerativeModel>,
  chunk: string,
  teamMembers: string[]
): Promise<Partial<MeetingAnalysis>> {
  const membersCtx =
    teamMembers.length > 0
      ? `Team members: ${teamMembers.join(", ")}.`
      : "";

  const prompt = `You are an AI assistant that analyzes engineering meeting transcripts.
${membersCtx}

Analyze the following meeting transcript chunk and extract:
1. A brief summary
2. Tasks/action items (with assignee if mentioned by name)
3. Bugs identified
4. Decisions made
5. Key discussion points

For task assignment: if a person's name is mentioned in relation to a task, assign it to them.
Match names to team members when possible.

Return ONLY valid JSON in this exact format:
{
  "summary": "brief summary",
  "tasks": [
    {
      "title": "task title",
      "description": "detailed description",
      "assigned_to": "github_username or null",
      "priority": "high|medium|low",
      "type": "task|bug|decision",
      "deadline": "YYYY-MM-DD or null"
    }
  ],
  "decisions": ["decision 1", "decision 2"],
  "key_points": ["point 1", "point 2"]
}

Transcript chunk:
${chunk}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Gemini API Error in analyzeChunk:", e);
    return {};
  }
}

export async function analyzeTranscript(
  transcript: string,
  teamMembers: string[] = []
): Promise<MeetingAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const chunks = chunkTranscript(transcript);

  const results = await Promise.all(
    chunks.map((chunk) => analyzeChunk(model, chunk, teamMembers))
  );

  const merged: MeetingAnalysis = {
    summary: "",
    tasks: [],
    decisions: [],
    key_points: [],
  };

  const summaries: string[] = [];

  for (const result of results) {
    if (result.summary) summaries.push(result.summary);
    if (result.tasks) merged.tasks.push(...result.tasks);
    if (result.decisions) merged.decisions.push(...result.decisions);
    if (result.key_points) merged.key_points.push(...result.key_points);
  }

  if (summaries.length > 1) {
    const summaryPrompt = `Combine these meeting summaries into one coherent paragraph: ${summaries.join(" | ")}`;
    try {
      const summaryResult = await model.generateContent(summaryPrompt);
      merged.summary = summaryResult.response.text();
    } catch (e) {
      console.error("Gemini API Error in summarize:", e);
      merged.summary = summaries.join(" ");
    }
  } else {
    merged.summary = summaries[0] || "No summary available.";
  }

  return merged;
}
