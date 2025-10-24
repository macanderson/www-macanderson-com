import { searchSimilarChunks } from "./vector-store"
import { prisma } from "./prisma"

export interface RAGContext {
  content: string
  source: string
  similarity: number
  metadata?: any
}

export async function retrieveContext(query: string, limit = 5): Promise<RAGContext[]> {
  try {
    console.log("[v0] Retrieving context for query:", query)
    const chunks = await searchSimilarChunks(query, limit)

    const documentIds = [...new Set(chunks.map((c) => c.documentId))]
    console.log("[v0] Document IDs:", documentIds)
    const documents = await prisma.document.findMany({
      where: {
        id: {
          in: documentIds,
        },
      },
      select: {
        id: true,
        title: true,
        fileType: true,
      },
    })

    const documentMap = new Map(documents.map((d) => [d.id, d]))
    console.log("[v0] Document Map:", documentMap)
    return chunks.map((chunk) => {
      const doc = documentMap.get(chunk.documentId)
      console.log("[v0] Document:", doc)
      return {
        content: chunk.content,
        source: doc?.title || "Unknown",
        similarity: chunk.similarity,
        metadata: {
          ...chunk.metadata,
          fileType: doc?.fileType,
        },
      }
    })
  } catch (error) {
    console.error("[v0] RAG retrieval error:", error)
    return []
  }
}

export function formatContextForPrompt(contexts: RAGContext[]): string {
  if (contexts.length === 0) {
    return "No additional context available."
  }

  const formattedContexts = contexts
    .map(
      (ctx, idx) => `
[Source ${idx + 1}: ${ctx.source} (Relevance: ${(ctx.similarity * 100).toFixed(1)}%)]
${ctx.content}
`,
    )
    .join("\n---\n")
  console.log("[v0] Formatted contexts:", formattedContexts)
  return formattedContexts
}

export async function generateRAGResponse(query: string, contexts: RAGContext[]): Promise<string> {
  const contextText = formatContextForPrompt(contexts)

  const systemPrompt = `You are an AI assistant helping users learn about Mac Anderson, a technologist, software engineer, and machine learning researcher.

You have access to the following context from Mac's knowledge base:

${contextText}

Use this context to answer the user's question accurately and conversationally. If the context doesn't contain relevant information, you can provide a general response based on what you know about Mac's background, but be honest about the limitations.

Keep responses concise, engaging, and informative. Use a friendly, professional tone.`

  console.log("[v0] System prompt:", systemPrompt)
  return systemPrompt
}
