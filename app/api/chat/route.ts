import { consumeStream, convertToModelMessages, streamText, tool } from "ai"
import { z } from "zod"
import { detectIntent } from "@/lib/intent-router"
import { retrieveContext, formatContextForPrompt } from "@/lib/rag"
import { prisma } from "@/lib/prisma"
import { addDocumentToVectorStore } from "@/lib/vector-store"

// Proper UIMessage types
type UIMessageRole = "user" | "assistant" | "system"
type MessageType = "text" | "reasoning" | "rag-upload" | "dynamic-component" | "other-tool" | "web-search" | "tool-result"
export interface UIMessage {
  id?: string
  role: UIMessageRole
  content: string
  createdAt?: Date | string
  toolInvocations?: any[]
  [key: string]: any
}

export const maxDuration = 30

async function addRawTextToRag(text: string) {
  const now = new Date()
  const title = `Pasted text ${now.toISOString()}`
  const fileName = `pasted-${now.getTime()}.txt`
  const fileSize = Buffer.byteLength(text, "utf8")

  const document = await prisma.document.create({
    data: {
      title,
      content: text,
      fileType: "txt",
      fileName,
      fileSize,
      uploadedBy: "anonymous",
    },
  })

  await addDocumentToVectorStore(document.id, text, {
    title: document.title,
    fileType: document.fileType,
    source: "chat",
  })

  return { uploaded: true, documentId: document.id }
}

export async function POST(req: Request) {
  console.log("[v0] Request received")
  const { messages }: { messages: UIMessage[] } = await req.json()
  console.log("[v0] Messages:", messages)
  const lastMessage = messages[messages.length - 1]
  // Use UIMessage type correctly
  console.log("[v0] Last message:", lastMessage)
  console.log("[v0] Last message type:", typeof lastMessage)
  console.log("[v0] Last message content:", lastMessage?.content)
  console.log("[v0] Last message role:", lastMessage?.role)
  console.log("[v0] Last message toolInvocations:", lastMessage?.toolInvocations)
  console.log("[v0] Last message id:", lastMessage?.id)
  console.log("[v0] Last message createdAt:", lastMessage?.createdAt)
  console.log("[v0] Last message parts:", lastMessage?.parts)
  console.log("[v0] Last message type:", typeof lastMessage)
  const userQuery =
    lastMessage && typeof lastMessage.content === "string" ? lastMessage.content : ""

  const intent = await detectIntent(userQuery)
  console.log("[v0] Intent detection:", intent)

  const ragContexts = await retrieveContext(userQuery, 5)
  const contextText = formatContextForPrompt(ragContexts)
  console.log("[v0] Retrieved RAG contexts:", ragContexts.length)

  // Convert UIMessage[] (from the client) to ModelMessage[] expected by streamText
  const uiMessagesForConversion = (messages as any[]).map((m) =>
    Array.isArray((m as any).parts)
      ? m
      : { role: (m as any).role, parts: [{ type: "text", text: (m as any).content ?? "" }] }
  )
  const modelMessages = convertToModelMessages(uiMessagesForConversion as any)

  const systemPrompt = `You are Mac Anderson's AI assistant for his interactive resume.

Your role is to help visitors learn about Mac through natural conversation. You have access to tools that display different components AND a knowledge base with detailed information about Mac.

IMPORTANT! If a user asks inappropiate questions, politely decline and suggest a more appropriate question. If a user asks a question unrelated to Mac's experience or background, politely decline and suggest a more appropriate question.

IMPORTANT! Be friendly! Talk openly about the nature of the chat first experience this app offers where users navigate with prompts not clicks and how AI likely will end UI as we know it.

Make sure to keep answers very tech forward. Mac is a Machine Learning Researcher Scientist and a technologist, people who want to know more about him will likely be the same.

KNOWLEDGE BASE CONTEXT:
${contextText}

AVAILABLE TOOLS:
- showWorkTimeline: Shows Mac's career history with an interactive timeline
- showEducation: Displays education details with undergraduate/graduate tabs
- showPersonalPassions: Shows social media links and personal interests
- uploadRawTextToRag: Uploads pasted raw text into the knowledge base for future reference (when users paste a large block of text in the prompt without specific instructions)

DECISION MAKING:
${
  intent.shouldRenderComponent
    ? `INTENT DETECTED: The user's question suggests showing the "${intent.componentName}" component (confidence: ${intent.confidence}%).
Reasoning: ${intent.reasoning}

You should call the appropriate tool AND provide a brief introduction to what they're about to see.`
    : `INTENT DETECTED: This question is best answered with detailed information from the knowledge base (confidence: ${intent.confidence}%).
Reasoning: ${intent.reasoning}

If a user has pasted a large section of raw text in the prompt without additional instructions, use the uploadRawTextToRag tool to upload it to the knowledge base. Otherwise, provide a comprehensive, conversational answer using the context above. Do NOT call any tools unless the user explicitly asks to see a timeline, education details, social links, or you detect a large pasted text that needs uploading.`
}

RESPONSE GUIDELINES:
1. Use the knowledge base context to provide accurate, detailed answers
2. Be conversational and engaging, as if Mac is speaking directly
3. If calling a tool, explain what the visitor is about to see
4. If the context doesn't have the answer, be honest and suggest what you can help with
5. Keep responses concise but informative

Special rule: If a user pastes a large amount of raw text (e.g., more than 1000 characters or several paragraphs) into the prompt with no clear instruction, automatically call the 'uploadRawTextToRag' tool with the provided text to store it in the RAG knowledge base.

Remember: You're representing Mac Anderson professionally yet approachably.`
  console.log("[v0] System prompt:", systemPrompt)

  console.log("[v0] Model messages:", modelMessages)

  const result = streamText({
    model: "openai/gpt-5-mini",
    system: systemPrompt,
    messages: modelMessages as any,
    abortSignal: req.signal,
    tools: {
      showWorkTimeline: tool({
        description: "Display Mac Anderson's work experience timeline with interactive career history",
        inputSchema: z.object({}),
        execute: async () => {
          console.log("[v0] Showing work timeline")
          return { displayed: true, component: "work-timeline" }
        },
      }),
      showEducation: tool({
        description: "Display Mac Anderson's educational background with undergraduate and graduate details",
        inputSchema: z.object({}),
        execute: async () => {
          console.log("[v0] Showing education")
          return { displayed: true, component: "education-selector" }
        },
      }),
      showPersonalPassions: tool({
        description: "Display Mac Anderson's personal interests and social media connections",
        inputSchema: z.object({}),
        execute: async () => {
          console.log("[v0] Showing personal passions")
          return { displayed: true, component: "social-links" }
        },
      }),
      uploadRawTextToRag: tool({
        description: "Uploads pasted raw text (such as long documents or data) to the knowledge base for retrieval-augmented generation. Use when a user pastes a long block of text into the prompt without instructions.",
        inputSchema: z.object({
          text: z.string().min(1000, "Text must be at least 1000 characters for upload.")
        }),
        execute: async ({ text }: { text: string }) => {
          console.log("[v0] Uploading raw text to RAG:", text.slice(0, 500), text.length > 500 ? "...[truncated]" : "")
          await addRawTextToRag(text)
          return { uploaded: true }
        }
      }),
    },
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      console.log("[v0] Chat finished")
      console.log("[v0] Chat is aborted:", isAborted)
      if (isAborted) {
        console.log("[v0] Chat aborted")
      } else {
        console.log("[v0] Chat completed successfully")
      }
      console.log("[v0] Chat finished response")
    },
    consumeSseStream: consumeStream,
  })
}
