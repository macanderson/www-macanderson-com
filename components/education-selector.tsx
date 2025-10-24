"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GraduationCap } from "lucide-react"

const education = {
  undergraduate: {
    degree: "Bachelor of Science in Computer Science",
    school: "State University",
    year: "2014 - 2018",
    gpa: "3.8/4.0",
    highlights: [
      "Dean's List all semesters",
      "President of Computer Science Club",
      "Developed award-winning mobile app for campus navigation",
      "Research assistant in AI lab",
      "Graduated Summa Cum Laude",
    ],
    courses: ["Data Structures", "Algorithms", "Machine Learning", "Web Development", "Database Systems"],
  },
  graduate: {
    degree: "Master of Science in Artificial Intelligence",
    school: "Tech Institute",
    year: "2018 - 2020",
    gpa: "3.9/4.0",
    highlights: [
      "Published 2 papers on neural networks",
      "Teaching assistant for ML courses",
      "Thesis on natural language processing",
      "Recipient of Graduate Excellence Award",
      "Collaborated with industry partners on research projects",
    ],
    courses: ["Deep Learning", "NLP", "Computer Vision", "Reinforcement Learning", "Advanced Algorithms"],
  },
}

export function EducationSelector() {
  const [selected, setSelected] = useState<"undergraduate" | "graduate">("undergraduate")

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <GraduationCap className="w-6 h-6 text-primary" />
        <h3 className="text-2xl font-bold">Education</h3>
      </div>

      <Tabs value={selected} onValueChange={(v) => setSelected(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="undergraduate">Undergraduate</TabsTrigger>
          <TabsTrigger value="graduate">Graduate</TabsTrigger>
        </TabsList>

        <TabsContent value="undergraduate" className="mt-6 space-y-4">
          <div>
            <h4 className="text-xl font-semibold">{education.undergraduate.degree}</h4>
            <p className="text-primary">{education.undergraduate.school}</p>
            <p className="text-sm text-muted-foreground">{education.undergraduate.year}</p>
            <p className="mt-1 text-sm font-semibold">GPA: {education.undergraduate.gpa}</p>
          </div>

          <div>
            <h5 className="mb-2 font-semibold">Highlights</h5>
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              {education.undergraduate.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-2 font-semibold">Key Courses</h5>
            <div className="flex flex-wrap gap-2">
              {education.undergraduate.courses.map((course) => (
                <Badge key={course} variant="outline">
                  {course}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="graduate" className="mt-6 space-y-4">
          <div>
            <h4 className="text-xl font-semibold">{education.graduate.degree}</h4>
            <p className="text-primary">{education.graduate.school}</p>
            <p className="text-sm text-muted-foreground">{education.graduate.year}</p>
            <p className="mt-1 text-sm font-semibold">GPA: {education.graduate.gpa}</p>
          </div>

          <div>
            <h5 className="mb-2 font-semibold">Highlights</h5>
            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
              {education.graduate.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-2 font-semibold">Key Courses</h5>
            <div className="flex flex-wrap gap-2">
              {education.graduate.courses.map((course) => (
                <Badge key={course} variant="outline">
                  {course}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
