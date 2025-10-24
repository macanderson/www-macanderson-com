"use client"

import type React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useRef, useState } from "react"
import { WorkTimeline } from "@/components/work-timeline"
import { EducationSelector } from "@/components/education-selector"
import { PersonalPassions } from "@/components/personal-passions"
import { usePromptHistory, usePromptSuggestions } from "@/hooks/use-prompt-suggestions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function ChatInterface() {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { history, addPrompt } = usePromptHistory()

  type ChatError = {
    message: string
    code?: string
    stack?: string
    [key: string]: any
  }

  type ChatMessage = {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    createdAt?: Date | string
    [key: string]: any
  }

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (error: any) => {
      console.error("[v0] Chat error:", error)
    },
    onFinish: (message: any) => {
      console.log("[v0] Chat finished:", message)
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  const { suggestions, isLoading: suggestionsLoading } = usePromptSuggestions(history, messages.length > 0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    console.log("[debug] messages updated:", messages)
  }, [messages])

  // Manage local input state; @ai-sdk/react useChat does not manage input
  const [groupTimestamp, setGroupTimestamp] = useState<Date | null>(null)
  const prevStepStartId = useRef<string | null>(null)

  function messageHasStepStart(msg: any): boolean {
    const parts = Array.isArray(msg?.parts) ? msg.parts : []
    const res = parts.some((p: any) => p?.type === "step-start")
    console.log("[debug] messageHasStepStart:", res, msg)
    return res
  }

  useEffect(() => {
    if (!messages || (messages as any[]).length === 0) return
    const last = (messages as any[])[(messages as any[]).length - 1]
    console.log("[debug] last message for groupTimestamp:", last)
    // Only update groupTimestamp if a new step-start arises (not just message/parts change)
    if (messageHasStepStart(last)) {
      // Give each step-start a unique id (e.g., use message.id as identifier)
      const currentStepStartId = typeof last.id === "string" ? last.id : String((messages as any[]).length - 1)
      if (prevStepStartId.current !== currentStepStartId) {
        setGroupTimestamp(new Date())
        prevStepStartId.current = currentStepStartId
        console.log("[debug] groupTimestamp updated:", groupTimestamp)
      }
    }
  }, [messages])

  function extractText(msg: any): string {
    if (!msg) return ""
    if (typeof msg.content === "string") return msg.content
    const parts = Array.isArray(msg.parts) ? msg.parts : []
    const texts = parts
      .filter((p: any) => p?.type === "text" && typeof p.text === "string")
      .map((p: any) => p.text)
      .join("")
    console.log("[debug] extractText:", texts, msg)
    return texts
  }

  function extractReasoning(msg: any): string | null {
    const parts = Array.isArray(msg?.parts) ? msg.parts : []
    const texts = parts
      .filter((p: any) => p?.type === "reasoning")
      .map((p: any) => (typeof p.text === "string" ? p.text : JSON.stringify(p)))
    if (texts.length === 0) return null
    console.log("[debug] extractReasoning:", texts, msg)
    return texts.join("\n\n")
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    console.log("[v0] Submitting message:", inputValue)
    addPrompt(inputValue.trim())

    void sendMessage({ text: inputValue })
    setInputValue("")
    console.log("[debug] onSubmit: inputValue cleared, sendMessage invoked")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("[debug] handleKeyDown:", e.key, {shift: e.shiftKey})
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as any)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return
    console.log("[v0] Suggestion clicked:", suggestion)
    setInputValue(suggestion)
    addPrompt(suggestion)

    // Trigger form submission with the suggestion
    setTimeout(() => {
      const form = document.querySelector("form")
      if (form) {
        const submitEvent = new Event("submit", { bubbles: true, cancelable: true })
        form.dispatchEvent(submitEvent)
        console.log("[debug] Suggestion submit event dispatched")
      }
    }, 0)
  }

  function renderToolComponent(toolInvocation: any, index: number) {
    // Grab tool props and llmText from the invocation if present
    const toolName: string | undefined =
      toolInvocation.toolName ??
      (typeof toolInvocation.type === "string"
        ? String(toolInvocation.type).replace(/^tool-/, "")
        : undefined)
    const toolProps = toolInvocation.props ?? {}
    const llmText = toolInvocation.llmText ?? undefined

    console.log("[debug] renderToolComponent called", { toolInvocation, toolName, toolProps, llmText, index })

    if (toolInvocation.state === "call") {
      console.log("[debug] Tool is in 'call' state:", toolName)
      return (
        <div key={index} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
          </div>
          <span className="text-sm text-muted-foreground">Loading {toolName ?? "tool"}...</span>
        </div>
      )
    }

    const isResultState = [
      "result",
      "output",
      "output-available",
      "completed",
    ].includes(toolInvocation.state)

    if (isResultState) {
      // Pass llmText and props
      console.log("[v0] Tool invocation output:", toolInvocation.output)
      console.log("[v0] Tool name:", toolName)
      console.log("[v0] Tool props:", toolProps)
      console.log("[v0] Tool llmText:", llmText)

      if (toolName === "showEducation") {
        console.log("[v0] Rendering EducationSelector")
        return <EducationSelector key={index} llmText={llmText} {...toolProps} />
      }

      if (toolName === "showPersonalPassions") {
        console.log("[v0] Rendering PersonalPassions")
        return <PersonalPassions key={index} llmText={llmText} {...toolProps} />
      }

      if (toolName === "showWorkTimeline") {
        console.log("[v0] Rendering WorkTimeline")
        return <WorkTimeline key={index} llmText={llmText} {...toolProps} />
      }

      if (toolName === "uploadRawTextToRag") {
        console.log("[v0] Rendering UploadRawTextToRag")
        return <Textarea key={index} llmText={llmText} {...toolProps} />
      }
    }

    console.log("[debug] No matching tool component to render", {toolInvocation, toolName, index})
    return null
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-4xl px-4 py-8 mx-auto">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
          <h2 className="text-4xl font-bold md:text-5xl text-balance">Get to know Mac Anderson</h2>
          <p className="max-w-2xl text-lg text-muted-foreground text-balance">
            Ask me anything you would like to know! This site utilizes a "prompt first" design. Type `nav` or `go back`
            if you get stuck.
          </p>
        </div>
      )}

      <div className="flex flex-col flex-1 gap-6 mb-6">
        {(messages as any[]).map((message: any) => {
          console.log("[debug] Rendering message:", message)
          return (
          <div key={message.id} className="flex flex-col gap-2">
            {/* Render textual content if present */}
            {(() => {
              const text = extractText(message)
              const hasText = typeof text === "string" && text.trim().length > 0
              console.log("[debug] Message text and hasText:", {text, hasText, message})
              if (!hasText) return null

              return (
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <p className="whitespace-pre-wrap text-pretty flex-1">{text}</p>
                    {extractReasoning(message) && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            aria-label="Show reasoning"
                            className="inline-flex items-center justify-center p-1 text-muted-foreground hover:text-foreground"
                          >
                            <Brain className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-sm text-sm whitespace-pre-wrap">
                          {extractReasoning(message)}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Always render tool invocations if present */}
            {message.toolInvocations?.map((toolInvocation: any, index: number) => {
              console.log("[debug] toolInvocation in message:", toolInvocation, index)
              return renderToolComponent(toolInvocation, index)
            })}
          </div>
        )})}

        {groupTimestamp && (
          <div className="mx-auto mb-2 text-xs text-muted-foreground">
            {groupTimestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted text-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
            </div>
            <span className="text-sm text-muted-foreground">Processing your request</span>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive">
            <p className="text-sm">Error: {error.message}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 -mx-4 bg-background/95 backdrop-blur">
        {suggestions.length > 0 && messages.length === 0 && (
          <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
            {suggestions.map((suggestion, index) => {
              console.log("[debug] Rendering suggestion button:", suggestion, index)
              return (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading || suggestionsLoading}
                className="group relative overflow-hidden rounded-xl border border-primary/20 bg-background/40 px-4 py-3 text-left text-sm backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:bg-background/60 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
              >
                <span className="relative z-10 text-foreground/90 group-hover:text-foreground">{suggestion}</span>
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
                </div>
              </button>
            )})}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-2 p-4">
          <Textarea
            name="message"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              console.log("[debug] inputValue changed:", e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about Mac..."
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading} className="self-end w-12 h-12">
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
