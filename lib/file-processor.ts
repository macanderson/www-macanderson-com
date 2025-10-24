export async function processFile(file: File): Promise<string> {
  const fileType = file.name.split(".").pop()?.toLowerCase()

  if (fileType === "md" || fileType === "txt") {
    return await file.text()
  }

  if (fileType === "pdf") {
    // Dynamic import for pdf-parse to handle CommonJS module
    const pdfParse = (await import("pdf-parse")).default
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const data = await pdfParse(buffer)
    return data.text
  }

  if (fileType === "doc" || fileType === "docx") {
    // Dynamic import for mammoth to handle CommonJS module
    const mammoth = (await import("mammoth")).default
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}

export function isValidFileType(fileName: string): boolean {
  const validExtensions = ["md", "txt", "pdf", "doc", "docx"]
  const extension = fileName.split(".").pop()?.toLowerCase()
  return extension ? validExtensions.includes(extension) : false
}
