import { generateObject } from "ai"
import { z } from "zod"

export const maxDuration = 30

const suggestionCache = new Map<string, { suggestions: string[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const DEFAULT_SUGGESTIONS = [
  "Tell me about your work experience",
  "What's your educational background?",
  "What are your personal interests?",
  "How can I connect with you?",
]

const CONTEXTUAL_FALLBACKS = {
  work: [
    "What about your education?",
    "Tell me about your personal interests",
    "Show me your career highlights",
    "What projects have you worked on?",
  ],
  education: [
    "Tell me about your work experience",
    "What are your research interests?",
    "Show me your career timeline",
    "What skills have you developed?",
  ],
  personal: [
    "What's your professional background?",
    "Tell me about your education",
    "Show me your work timeline",
    "How can I reach out to you?",
  ],
}

function getContextualFallback(history: string[]): string[] {
  if (history.length === 0) return DEFAULT_SUGGESTIONS

  const recentPrompt = history[0].toLowerCase()
  if (recentPrompt.includes("work") || recentPrompt.includes("career") || recentPrompt.includes("job")) {
    return CONTEXTUAL_FALLBACKS.work
  }
  if (recentPrompt.includes("education") || recentPrompt.includes("school") || recentPrompt.includes("university")) {
    return CONTEXTUAL_FALLBACKS.education
  }
  if (recentPrompt.includes("interest") || recentPrompt.includes("hobby") || recentPrompt.includes("social")) {
    return CONTEXTUAL_FALLBACKS.personal
  }

  return DEFAULT_SUGGESTIONS
}

export async function POST(req: Request) {
  let history: string[] = []
  console.log("[v0] Suggestions request received")
  console.log("[v0] History:", history)
  try {
    const body = await req.json()
    history = body.history || []
  } catch (parseError) {
    console.error("[v0] Error parsing request body:", parseError)
    return Response.json({ suggestions: DEFAULT_SUGGESTIONS })
  }

  try {
    const cacheKey = JSON.stringify(history.slice(0, 3))
    const cached = suggestionCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return Response.json({ suggestions: cached.suggestions })
    }

    const result = (await Promise.race([
      generateObject({
        model: "openai/gpt-4o-mini",
        system: `You are an AI assistant helping generate smart prompt suggestions for Mac Anderson's interactive resume website.

The website allows users to explore Mac's:
- Work experience and career timeline
- Educational background (undergraduate and graduate)
- Personal interests and social media connections

Based on the user's recent conversation history, suggest 4 relevant follow-up prompts that:
1. Build naturally on what they've already asked about
2. Encourage deeper exploration of Mac's background
3. Are conversational and engaging (not robotic)
4. Guide them to discover different aspects they haven't explored yet
5. Are concise (max 8-10 words each)

If they've asked about work, suggest education or personal interests.
If they've asked about education, suggest work experience or how to connect.
Mix in specific questions that show curiosity about Mac's journey.`,
        prompt: `Recent conversation history (most recent first):
${history.length > 0 ? history.map((h, i) => `${i + 1}. "${h}"`).join("\n") : "No history yet - this is the user's first visit"}

Generate 4 smart, contextual follow-up prompts that feel natural and encourage exploration.`,
        schema: z.object({
          suggestions: z.array(z.string()).length(4).describe("Four suggested follow-up prompts"),
        }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("AI request timeout")), 10000)),
    ])) as Awaited<ReturnType<typeof generateObject>>

    suggestionCache.set(cacheKey, {
      suggestions: (result.object as { suggestions: string[] }).suggestions,
      timestamp: Date.now(),
    })

    return Response.json({ suggestions: (result.object as { suggestions: string[] }).suggestions })
  } catch (error: any) {
    const fallbackSuggestions = getContextualFallback(history)

    return Response.json({
      suggestions: fallbackSuggestions,
    })
  }
}
