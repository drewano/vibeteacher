"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { BrainIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuizCardProps {
  question: string
  onSubmit: (answer: string) => void
}

export function QuizCard({ question, onSubmit }: QuizCardProps) {
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!answer.trim()) return
    setIsSubmitting(true)
    // Small delay for visual feedback
    setTimeout(() => {
      onSubmit(answer)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <BrainIcon className="h-4 w-4 text-primary" />
            </div>
            Math Challenge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-lg font-medium">{question}</p>
          </div>

          <div className="flex gap-2">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={isSubmitting}
              className="flex-1"
            />
            <Button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              size="icon"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
