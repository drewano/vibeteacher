"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { SparklesIcon, PlayIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuizCard } from "@/components/quiz-card"
import { FeedbackCard } from "@/components/feedback-card"

interface Activity {
  id: string
  type: "quiz" | "feedback"
  question?: string
  isCorrect?: boolean
  correctAnswer?: string
  explanation?: string
  userAnswer?: string
}

const DEMO_QUIZZES = [
  {
    question: "Solve for x: 2x + 5 = 13",
    correctAnswer: "4",
    explanation: "Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4",
  },
  {
    question: "What is the derivative of f(x) = x² + 3x?",
    correctAnswer: "2x + 3",
    explanation: "Using the power rule: d/dx(x²) = 2x, d/dx(3x) = 3",
  },
  {
    question: "Calculate: √144",
    correctAnswer: "12",
    explanation: "12 × 12 = 144, so √144 = 12",
  },
]

export function ActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)

  const handleDemoQuiz = () => {
    const quiz = DEMO_QUIZZES[currentQuizIndex % DEMO_QUIZZES.length]
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: "quiz",
      question: quiz.question,
    }
    setActivities((prev) => [...prev, newActivity])
  }

  const handleQuizSubmit = (activityId: string, answer: string) => {
    const activity = activities.find((a) => a.id === activityId)
    if (!activity) return

    const quiz = DEMO_QUIZZES.find((q) => q.question === activity.question)
    if (!quiz) return

    const isCorrect =
      answer.toLowerCase().trim() === quiz.correctAnswer.toLowerCase().trim()

    // Update the quiz activity with the user's answer
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId ? { ...a, userAnswer: answer } : a
      )
    )

    // Add feedback activity
    const feedbackActivity: Activity = {
      id: `${Date.now()}-feedback`,
      type: "feedback",
      isCorrect,
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation,
      userAnswer: answer,
    }
    setActivities((prev) => [...prev, feedbackActivity])
    setCurrentQuizIndex((prev) => prev + 1)
  }

  const clearActivities = () => {
    setActivities([])
    setCurrentQuizIndex(0)
  }

  return (
    <div className="flex h-full flex-col p-4">
      {/* Activities List */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <SparklesIcon className="mb-2 h-12 w-12 opacity-50" />
            <p className="font-medium">No activities yet</p>
            <p className="text-sm">
              Start a conversation or try the demo below
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  layout
                >
                  {activity.type === "quiz" && !activity.userAnswer && (
                    <QuizCard
                      question={activity.question!}
                      onSubmit={(answer) => handleQuizSubmit(activity.id, answer)}
                    />
                  )}
                  {activity.type === "quiz" && activity.userAnswer && (
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Question:</p>
                      <p className="font-medium">{activity.question}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Your answer: {activity.userAnswer}
                      </p>
                    </div>
                  )}
                  {activity.type === "feedback" && (
                    <FeedbackCard
                      isCorrect={activity.isCorrect!}
                      correctAnswer={activity.correctAnswer}
                      explanation={activity.explanation}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Demo Controls */}
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDemoQuiz}
          className="gap-2"
        >
          <PlayIcon className="h-4 w-4" />
          Demo Quiz
        </Button>
        {activities.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearActivities}
            className="text-muted-foreground"
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  )
}
