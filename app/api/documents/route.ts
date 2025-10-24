import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireAdmin()

    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileType: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ documents })
  } catch (error: any) {
    console.error("[v0] Documents fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch documents" }, { status: 500 })
  }
}
