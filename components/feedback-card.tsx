"use client"

import { motion } from "motion/react"
import { CheckCircleIcon, XCircleIcon, LightbulbIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface FeedbackCardProps {
  isCorrect: boolean
  correctAnswer?: string
  explanation?: string
}

export function FeedbackCard({
  isCorrect,
  correctAnswer,
  explanation,
}: FeedbackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card
        className={cn(
          "border-2",
          isCorrect
            ? "border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent"
            : "border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent"
        )}
      >
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
            >
              {isCorrect ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                </div>
              )}
            </motion.div>

            <div className="flex-1 space-y-2">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className={cn(
                  "text-lg font-semibold",
                  isCorrect ? "text-green-500" : "text-red-500"
                )}
              >
                {isCorrect ? "Correct!" : "Not quite right"}
              </motion.p>

              {!isCorrect && correctAnswer && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm"
                >
                  The correct answer is:{" "}
                  <span className="font-semibold text-foreground">
                    {correctAnswer}
                  </span>
                </motion.p>
              )}

              {explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3"
                >
                  <LightbulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-sm text-muted-foreground">{explanation}</p>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
