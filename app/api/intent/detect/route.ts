import { NextResponse } from "next/server"
import { detectIntent } from "@/lib/intent-router"

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    console.log("[v0] Intent detection request received")
    console.log("[v0] Message:", message)
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }
    console.log("[v0] Detecting intent for message:", message)
    const intent = await detectIntent(message)
    console.log("[v0] Intent detection result:", intent)
    return NextResponse.json({ intent })
  } catch (error) {
    console.error("[v0] Intent detection error:", error)
    return NextResponse.json({ error: "Failed to detect intent" }, { status: 500 })
  }
}
