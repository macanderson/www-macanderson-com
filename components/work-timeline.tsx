"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const workHistory = [
  {
    year: "2023 - Present",
    title: "Senior Software Engineer",
    company: "Tech Innovations Inc.",
    description: "Leading development of AI-powered applications and mentoring junior developers.",
    skills: ["React", "Next.js", "TypeScript", "AI/ML"],
  },
  {
    year: "2021 - 2023",
    title: "Full Stack Developer",
    company: "Digital Solutions Co.",
    description: "Built scalable web applications and implemented CI/CD pipelines.",
    skills: ["Node.js", "React", "PostgreSQL", "AWS"],
  },
  {
    year: "2019 - 2021",
    title: "Frontend Developer",
    company: "Creative Agency",
    description: "Developed responsive websites and interactive user experiences.",
    skills: ["JavaScript", "CSS", "React", "Design Systems"],
  },
  {
    year: "2018 - 2019",
    title: "Junior Developer",
    company: "StartUp Labs",
    description: "Contributed to various projects and learned modern web development practices.",
    skills: ["HTML", "CSS", "JavaScript", "Git"],
  },
]

export function WorkTimeline() {
  return (
    <Card className="p-6">
      <h3 className="mb-6 text-2xl font-bold">Work Experience</h3>
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-border md:before:ml-[8.75rem]">
        {workHistory.map((job, index) => (
          <div key={index} className="relative flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="flex items-center gap-4 md:w-32 md:flex-col md:items-end md:text-right">
              <div className="relative z-10 flex items-center justify-center w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
              <span className="text-sm font-semibold text-muted-foreground">{job.year}</span>
            </div>
            <div className="flex-1 pb-8 ml-8 md:ml-0">
              <h4 className="text-lg font-semibold">{job.title}</h4>
              <p className="mb-2 text-sm text-primary">{job.company}</p>
              <p className="mb-3 text-sm text-muted-foreground text-pretty">{job.description}</p>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
