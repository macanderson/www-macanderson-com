import { prisma } from "./prisma"
import { randomUUID } from "crypto"

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error("[v0] Error generating embedding:", error)
    throw error
  }
}

function toPgVectorLiteral(values: number[]): string {
  // pgvector accepts a string literal like '[v1, v2, ...]'
  return `[${values.join(",")}]`
}

export async function chunkText(text: string, chunkSize = 1000, overlap = 200): Promise<string[]> {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start = end - overlap
  }

  return chunks
}

export async function addDocumentToVectorStore(documentId: string, content: string, metadata?: Record<string, any>) {
  const chunks = await chunkText(content)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = await generateEmbedding(chunk)

    const vectorLiteral = toPgVectorLiteral(embedding)
    const jsonMeta = JSON.stringify({ ...metadata, chunkIndex: i, totalChunks: chunks.length })

    const id = randomUUID()

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (id, "documentId", content, embedding, metadata)
      VALUES (
        ${id},
        ${documentId},
        ${chunk},
        ${vectorLiteral}::vector,
        ${jsonMeta}::jsonb
      )
    `
  }
}

export async function searchSimilarChunks(query: string, limit = 5) {
  try {
    if (!query || !query.trim()) {
      return []
    }

    const queryEmbedding = await generateEmbedding(query)
    const queryVector = toPgVectorLiteral(queryEmbedding)

    const results = await prisma.$queryRaw<
      Array<{
        id: string
        content: string
        documentId: string
        metadata: any
        similarity: number
      }>
    >`
      SELECT
        dc.id,
        dc.content,
        dc."documentId",
        dc.metadata,
        1 - (dc.embedding <=> ${queryVector}::vector) as similarity
      FROM "DocumentChunk" dc
      ORDER BY dc.embedding <=> ${queryVector}::vector
      LIMIT ${limit}
    `

    return Array.isArray(results) ? results : []
  } catch (error) {
    console.error("[v0] Error searching similar chunks:", error)
    return []
  }
}
