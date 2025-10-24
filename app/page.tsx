import { ChatInterface } from "@/components/chat-interface"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Header />
      <ChatInterface />
    </main>
  )
}
