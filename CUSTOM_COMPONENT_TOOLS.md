### CUSTOM_COMPONENT_TOOLS.md

This guide explains how custom React components are rendered from LLM tool calls, how to pass provider response text into those components, and how to manage the registry so you can add/remove/update components end‑to‑end (for example, adding a new “Shopping List” intent).

---

## Architecture Overview

- **Server (tools):** Defined in `app/api/chat/route.ts` using the AI SDK `tool(...)`. A tool returns an output payload with a `component` id and optional `props` which are sent to the client via the streamed UI message protocol.
- **Client (renderer):** `components/chat-interface.tsx` renders both assistant text and any tool invocations for the same message. It resolves the tool identity from multiple fields and then renders the appropriate React component. It can also pass assistant text into the component as a prop.
- **Registry (intent):** `lib/intent-router.ts` and `app/api/components/registry/route.ts` store the list of intent-triggerable components in the database. The LLM uses this list to choose which component to render when appropriate.

---

## How Components Are Rendered Today

On the server, a tool might return something like:

```ts
// app/api/chat/route.ts
showWorkTimeline: tool({
  description: "Display Mac Anderson's work experience timeline",
  inputSchema: z.object({}),
  async execute() {
    return { displayed: true, component: "work-timeline" }
  },
}),
```

On the client, the chat UI renders both the assistant message text and any tool invocations underneath it. It tolerates several result shapes:

- Resolves tool identity from `toolInvocation.toolName`, or `toolInvocation.type` (strips `tool-` prefix), or `toolInvocation.output.component`.
- Accepts result states: `"result"`, `"output-available"`, `"completed"` (plus the loading `"call"` state).

The current implementation uses explicit conditionals to map known tools to components:

```tsx
// components/chat-interface.tsx (excerpt)
if (isResultState) {
  if (toolName === "showWorkTimeline") return <WorkTimeline />
  if (toolName === "showEducation") return <EducationSelector />
  if (toolName === "showPersonalPassions") return <PersonalPassions />
}
```

You can keep this style, or refactor to a component map for easier scaling (see “Optional: Component Map” below).

---

## Passing LLM Response Text Into Components

There are two complementary ways to get text into your component:

1) **Client pass-through**: Extract the assistant text for that message on the client and pass it as a prop (e.g., `llmText`).
2) **Server-provided props**: Return a `props` object in the tool result which the client spreads into the component.

Example prop shape returned by a tool:

```ts
return { component: "work-timeline", props: { intro: "Here is my work history." } }
```

Client pattern to forward both tool props and assistant text:

```tsx
// inside message.toolInvocations map
const propsFromTool = toolInvocation.output?.props ?? {}
const messageText = extractText(message)
return <WorkTimeline {...propsFromTool} llmText={messageText} />
```

Note: To use this, lightly adapt the `chat-interface.tsx` render branch to pass `propsFromTool` and `messageText` to your component. The current code renders the components without props; it’s a small, localized edit to pass them through.

---

## The Intent Registry (Database)

The intent registry helps the LLM decide which component to render. It is queried by `detectIntent` in `lib/intent-router.ts` and exposed via:

- `GET /api/components/registry` → list active components.
- `POST /api/components/registry` → create a component (admin-only via `requireAdmin`).

A registry record typically includes:

- `name`: unique id used by intent detection (e.g., `ShoppingList`).
- `displayName`: human-readable name.
- `description`: summary.
- `intent`: array of trigger keywords/phrases.
- `componentPath`: source path reference.
- `priority`: ordering integer.
- `isActive`: boolean flag (intent detection filters by active).

Example create request:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ShoppingList",
    "displayName": "Shopping List",
    "description": "Display a shopping list UI.",
    "intent": ["shopping", "groceries", "list"],
    "componentPath": "components/shopping-list.tsx",
    "priority": 10
  }' \
  "/api/components/registry"
```

`detectIntent` reads the active components, passes them to the LLM, and returns the chosen `componentName`. The tool still needs to exist server-side for the assistant to actually render it.

---

## Add a New Component End‑to‑End (Example: Shopping List)

1) Create the React component:

```tsx
// components/shopping-list.tsx
"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Props = {
  items: string[]
  intro?: string
  llmText?: string
}

export function ShoppingList({ items, intro, llmText }: Props) {
  return (
    <Card className="p-6">
      <h3 className="mb-3 text-2xl font-bold">Shopping List</h3>
      {intro && <p className="mb-3 text-sm text-muted-foreground">{intro}</p>}
      {llmText && <p className="mb-4 text-sm text-muted-foreground">{llmText}</p>}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary">{item}</Badge>
        ))}
      </div>
    </Card>
  )
}
```

2) Add a server tool:

```ts
// app/api/chat/route.ts (tools section)
showShoppingList: tool({
  description: "Display a shopping list UI.",
  inputSchema: z.object({
    items: z.array(z.string()).default([]),
    intro: z.string().optional(),
  }),
  async execute({ items, intro }) {
    return { displayed: true, component: "shopping-list", props: { items, intro } }
  },
}),
```

3) Teach the model the tool exists (system prompt AVAILABLE TOOLS block in `app/api/chat/route.ts`):

```
- showShoppingList: Displays a shopping list UI
```

4) Make the client render it. With the current explicit-if mapping, add a branch:

```tsx
// components/chat-interface.tsx (result branch)
if (toolName === "showShoppingList") {
  const propsFromTool = toolInvocation.output?.props ?? {}
  const messageText = extractText(message)
  return <ShoppingList key={index} {...propsFromTool} llmText={messageText} />
}
```

5) Register the intent (optional but recommended for detection):

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "name": "ShoppingList",
  "displayName": "Shopping List",
  "description": "Display a shopping list UI.",
  "intent": ["shopping", "groceries", "list"],
  "componentPath": "components/shopping-list.tsx",
  "priority": 10
}' "/api/components/registry"
```

6) Test with a prompt like: “Create a shopping list for tacos.” The assistant can call `showShoppingList({ items: [...] })`, and the UI will render the component under the assistant text.

---

## Optional: Component Map (Cleaner Scaling)

Instead of `if/else`, create a map so multiple name shapes resolve to one component:

```tsx
// components/chat-interface.tsx (top-level)
import { ShoppingList } from "@/components/shopping-list"

const TOOL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  showWorkTimeline: WorkTimeline,
  "work-timeline": WorkTimeline,
  showEducation: EducationSelector,
  "education-selector": EducationSelector,
  showPersonalPassions: PersonalPassions,
  "social-links": PersonalPassions,
  showShoppingList: ShoppingList,
  "shopping-list": ShoppingList,
}

// Inside tool invocation render
const resolvedName =
  toolInvocation.toolName ??
  (typeof toolInvocation.type === "string"
    ? toolInvocation.type.replace(/^tool-/, "")
    : undefined) ??
  toolInvocation.output?.component

const Component = resolvedName ? TOOL_COMPONENTS[resolvedName] : undefined
if (Component) {
  const propsFromTool = toolInvocation.output?.props ?? {}
  const messageText = extractText(message)
  return <Component key={index} {...propsFromTool} llmText={messageText} />
}
```

---

## Troubleshooting Checklist

- Component doesn’t render, but the tool logs say it ran:
  - Confirm the UI resolves a known name: `toolInvocation.toolName`, `toolInvocation.type` (without `tool-`), or `output.component`.
  - Ensure the state is one of: `result`, `output-available`, `completed`.
  - Verify the component is referenced in your mapping or explicit conditionals.

- Props don’t show:
  - Ensure the tool returns a `props` object.
  - In the client, pass `toolInvocation.output?.props` into the component.

- Want the assistant text inside the component:
  - Pass `llmText={extractText(message)}` in addition to any server props.

---

## Quick Reference (Add/Update/Remove)

- **Add** a component:
  1) Create React component in `components/`.
  2) Add server tool in `app/api/chat/route.ts` (return `component` and optional `props`).
  3) Add a client mapping branch (or update the component map).
  4) Update AVAILABLE TOOLS in the system prompt.
  5) (Optional) Register via `POST /api/components/registry`.

- **Update** a component:
  - Adjust the React component and (optionally) tool props/output contract.
  - Keep mapping names consistent; support aliases as needed.

- **Remove** a component:
  - Remove or disable the server tool and its mention in AVAILABLE TOOLS.
  - Remove the client mapping branch.
  - Deactivate the registry entry (`isActive: false`).

---

By following the above steps, you can reliably render custom UI components driven by tool calls, pass in LLM narrative text, and manage intents through the registry. This keeps the UX consistent: brief assistant guidance text followed by an interactive component that users can explore.
