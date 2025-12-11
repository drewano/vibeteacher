"use client"

import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2Icon, XCircleIcon, HelpCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MathText } from "@/components/math-text"
import { Quiz } from "@/lib/curriculum-context"

interface QuizCardProps {
  quiz: Quiz
  selectedAnswer: number | null
  isCorrect: boolean | null
  attempts: number
  maxAttempts: number
  showExplanation: boolean
  onSelectAnswer: (index: number) => void
  onContinue: () => void
  onRetry?: () => void
}

export function QuizCard({
  quiz,
  selectedAnswer,
  isCorrect,
  attempts,
  maxAttempts,
  showExplanation,
  onSelectAnswer,
  onContinue,
  onRetry,
}: QuizCardProps) {
  const hasAnswered = selectedAnswer !== null
  const canRetry = !isCorrect && attempts < maxAttempts

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="rounded-2xl border border-border bg-background shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircleIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Quiz de Validation</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Essai {attempts + 1}/{maxAttempts}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="px-5 py-4">
          <p className="text-base font-medium leading-relaxed">
            <MathText>{quiz.question}</MathText>
          </p>
        </div>

        {/* Options */}
        <div className="px-5 pb-4 space-y-2">
          {quiz.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrectOption = index === quiz.correctAnswer
            const showResult = hasAnswered && showExplanation

            return (
              <motion.button
                key={index}
                onClick={() => !hasAnswered && onSelectAnswer(index)}
                disabled={hasAnswered}
                whileHover={!hasAnswered ? { scale: 1.01 } : undefined}
                whileTap={!hasAnswered ? { scale: 0.99 } : undefined}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200",
                  "flex items-center gap-3",
                  !hasAnswered && "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
                  hasAnswered && "cursor-default",
                  // Default state
                  !showResult && !isSelected && "border-border bg-muted/30",
                  // Selected but not yet showing result
                  !showResult && isSelected && "border-primary bg-primary/10",
                  // Showing result - correct answer
                  showResult && isCorrectOption && "border-green-500 bg-green-50 dark:bg-green-950/30",
                  // Showing result - wrong selected answer
                  showResult && isSelected && !isCorrectOption && "border-red-500 bg-red-50 dark:bg-red-950/30"
                )}
              >
                {/* Option letter */}
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
                    !showResult && "bg-muted text-muted-foreground",
                    showResult && isCorrectOption && "bg-green-500 text-white",
                    showResult && isSelected && !isCorrectOption && "bg-red-500 text-white"
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>

                {/* Option text */}
                <span className="flex-1 text-sm">
                  <MathText>{option}</MathText>
                </span>

                {/* Result icon */}
                <AnimatePresence>
                  {showResult && isCorrectOption && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                  {showResult && isSelected && !isCorrectOption && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>

        {/* Explanation & Actions */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border/50"
            >
              {/* Result banner */}
              <div
                className={cn(
                  "px-5 py-3",
                  isCorrect
                    ? "bg-green-50 dark:bg-green-950/30"
                    : "bg-red-50 dark:bg-red-950/30"
                )}
              >
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        Bravo ! Bonne réponse !
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-700 dark:text-red-400">
                        {canRetry ? "Pas tout à fait..." : "Réponse incorrecte"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Explanation text */}
              <div className="px-5 py-4 bg-muted/30">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <MathText>{quiz.explanation}</MathText>
                </p>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 flex justify-end gap-2">
                {canRetry && onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    Réessayer
                  </Button>
                )}
                {(isCorrect || !canRetry) && (
                  <Button size="sm" onClick={onContinue}>
                    {isCorrect ? "Continuer" : "Revoir le cours"}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
