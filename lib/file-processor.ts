export async function processFile(file: File): Promise<string> {
  const fileType = file.name.split(".").pop()?.toLowerCase()

  if (fileType === "md" || fileType === "txt") {
    return await file.text()
  }

  if (fileType === "pdf") {
    // Dynamic import with interop for pdf-parse (CJS/ESM compatibility)
    const pdfParseModule = await import("pdf-parse")
    const pdfParse =
      (pdfParseModule as any).default ?? (pdfParseModule as any)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const data = await (pdfParse as (buffer: Buffer) => Promise<{ text: string }>)(buffer)
    return data.text
  }

  if (fileType === "doc" || fileType === "docx") {
    // Dynamic import with interop for mammoth (CJS/ESM compatibility)
    const mammothModule = await import("mammoth")
    const mammoth = (mammothModule as any).default ?? (mammothModule as any)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await (mammoth as any).extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}

export function isValidFileType(fileName: string): boolean {
  const validExtensions = ["md", "txt", "pdf", "doc", "docx"]
  const extension = fileName.split(".").pop()?.toLowerCase()
  return extension ? validExtensions.includes(extension) : false
}
