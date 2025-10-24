"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Linkedin, Twitter, Mail, Globe } from "lucide-react"

const socialLinks = [
  {
    name: "GitHub",
    icon: Github,
    url: "https://github.com/macanderson",
    cta: "View my code",
    description: "Check out my open source projects and contributions",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    url: "https://linkedin.com/in/macanderson",
    cta: "Connect professionally",
    description: "Let's connect and grow our professional network",
  },
  {
    name: "Twitter",
    icon: Twitter,
    url: "https://twitter.com/macanderson",
    cta: "Follow my journey",
    description: "Thoughts on tech, AI, and software development",
  },
  {
    name: "Portfolio",
    icon: Globe,
    url: "https://macanderson.dev",
    cta: "Explore my work",
    description: "See my projects and case studies",
  },
  {
    name: "Email",
    icon: Mail,
    url: "mailto:mac@example.com",
    cta: "Get in touch",
    description: "Let's discuss opportunities and collaborations",
  },
]

export function PersonalPassions() {
  return (
    <Card className="p-6">
      <h3 className="mb-2 text-2xl font-bold">Personal Passions & Connect</h3>
      <p className="mb-6 text-muted-foreground text-pretty">
        Beyond coding, I'm passionate about open source, mentoring, and building communities. Let's connect and
        collaborate!
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {socialLinks.map((link) => {
          const Icon = link.icon
          return (
            <Card key={link.name} className="p-4 transition-colors hover:bg-accent">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold">{link.name}</h4>
                  <p className="mb-3 text-xs text-muted-foreground text-pretty">{link.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    {link.cta}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </Card>
  )
}
