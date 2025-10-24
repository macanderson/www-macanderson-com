import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { processFile, isValidFileType } from "@/lib/file-processor"
import { addDocumentToVectorStore } from "@/lib/vector-store"

export async function POST(req: Request) {
  try {
    const session = await requireAdmin()

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!isValidFileType(file.name)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const content = await processFile(file)

    const document = await prisma.document.create({
      data: {
        title: file.name,
        content,
        fileType: file.name.split(".").pop()?.toLowerCase() || "unknown",
        fileName: file.name,
        fileSize: file.size,
        uploadedBy: session.userId,
      },
    })

    await addDocumentToVectorStore(document.id, content, {
      title: document.title,
      fileType: document.fileType,
    })

    return NextResponse.json({ success: true, document })
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
