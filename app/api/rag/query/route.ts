import { NextResponse } from "next/server"
import { retrieveContext } from "@/lib/rag"

export async function POST(req: Request) {
  try {
    const { query, limit = 5 } = await req.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }
    console.log("[v0] Retrieving context for query:", query)

    const contexts = await retrieveContext(query, limit)
    console.log("[v0] Retrieved contexts:", contexts)
    return NextResponse.json({ contexts })
  } catch (error) {
    console.error("[v0] RAG query error:", error)
    return NextResponse.json({ error: "Failed to retrieve context" }, { status: 500 })
  }
}
