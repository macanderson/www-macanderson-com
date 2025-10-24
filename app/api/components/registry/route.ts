import { NextResponse } from "next/server"
import { getAllComponents } from "@/lib/intent-router"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma" // Declare the prisma variable

export async function GET() {
  try {
    const components = await getAllComponents()
    return NextResponse.json({ components })
  } catch (error) {
    console.error("[v0] Component registry error:", error)
    return NextResponse.json({ error: "Failed to fetch components" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()

    const { name, displayName, description, intent, componentPath, priority } = await req.json()

    const component = await prisma?.componentRegistry.create({
      data: {
        name,
        displayName,
        description,
        intent,
        componentPath,
        priority: priority || 0,
      },
    })

    return NextResponse.json({ component })
  } catch (error: any) {
    console.error("[v0] Component creation error:", error)
    return NextResponse.json({ error: error.message || "Failed to create component" }, { status: 500 })
  }
}
