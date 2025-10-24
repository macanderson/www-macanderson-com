import { prisma } from "./prisma"
import { generateObject } from "ai"
import { z } from "zod"

export interface IntentResult {
  shouldRenderComponent: boolean
  componentName?: string
  componentPath?: string
  confidence: number
  reasoning?: string
}

export async function detectIntent(userMessage: string): Promise<IntentResult> {
  try {
    const components = await prisma.componentRegistry.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    })

    if (components.length === 0) {
      return {
        shouldRenderComponent: false,
        confidence: 0,
      }
    }

    const componentDescriptions = components
      .map(
        (c) => `
Component: ${c.name}
Display Name: ${c.displayName}
Description: ${c.description}
Triggers: ${c.intent.join(", ")}
`,
      )
      .join("\n")

    const result = await generateObject({
      model: "openai/gpt-5-mini",
      system: `You are an intent detection system for Mac Anderson's interactive resume.

Your job is to determine if the user's message should trigger a custom interactive component or if it should be answered with a text response using RAG.

Available components:
${componentDescriptions}

Analyze the user's message and determine:
1. Should a component be rendered? (true/false)
2. If yes, which component is most appropriate?
3. How confident are you? (0-100)
4. Brief reasoning for your decision

Guidelines:
- Render components for direct questions about work, education, or social connections
- Use RAG for specific questions, follow-ups, or detailed inquiries
- Be conservative - when in doubt, use RAG for more personalized responses
- Consider context: "tell me about your work" → component, "what did you do at Google?" → RAG`,
      prompt: `User message: "${userMessage}"

Should this trigger a component or use RAG?`,
      schema: z.object({
        shouldRenderComponent: z.boolean(),
        componentName: z.string().optional(),
        confidence: z.number().min(0).max(100),
        reasoning: z.string(),
      }),
    })

    const component = components.find((c) => c.name === result.object.componentName)

    return {
      shouldRenderComponent: result.object.shouldRenderComponent,
      componentName: component?.name,
      componentPath: component?.componentPath,
      confidence: result.object.confidence,
      reasoning: result.object.reasoning,
    }
  } catch (error) {
    console.error("[v0] Intent detection error:", error)
    return {
      shouldRenderComponent: false,
      confidence: 0,
    }
  }
}

export async function getComponentByName(name: string) {
  return prisma.componentRegistry.findUnique({
    where: { name, isActive: true },
  })
}

export async function getAllComponents() {
  return prisma.componentRegistry.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
  })
}
