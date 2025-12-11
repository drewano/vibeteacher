"use client"

import { motion } from "motion/react"
import { TrophyIcon, LockIcon, CheckCircle2Icon, SparklesIcon, BookOpenIcon, PlayIcon, BookIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useCurriculum } from "@/lib/curriculum-context"

// Default mock levels when no curriculum is loaded
const DEFAULT_LEVELS = [
  { id: 1, name: "Vol. 1", progress: 0, unlocked: true, xp: 0, maxXp: 100, description: "Upload a document to start", completed: false, concepts: [], checkQuestions: [] },
  { id: 2, name: "Vol. 2", progress: 0, unlocked: false, xp: 0, maxXp: 100, description: "Locked", completed: false, concepts: [], checkQuestions: [] },
  { id: 3, name: "Vol. 3", progress: 0, unlocked: false, xp: 0, maxXp: 100, description: "Locked", completed: false, concepts: [], checkQuestions: [] },
  { id: 4, name: "Vol. 4", progress: 0, unlocked: false, xp: 0, maxXp: 100, description: "Locked", completed: false, concepts: [], checkQuestions: [] },
  { id: 5, name: "Vol. 5", progress: 0, unlocked: false, xp: 0, maxXp: 100, description: "Locked", completed: false, concepts: [], checkQuestions: [] },
]

export function LearningProgress() {
  const { 
    curriculum, 
    isGenerating, 
    currentLevelId, 
    totalXp, 
    startLesson, 
    activeLessonId, 
    viewMode 
  } = useCurriculum()

  const levels = curriculum?.levels || DEFAULT_LEVELS
  const hasCurriculum = !!curriculum

  // Find current level
  const currentLevel = levels.find((level) => level.id === currentLevelId) || levels[0]

  if (isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <SparklesIcon className="h-12 w-12 text-primary" />
        </motion.div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Generating Learning Path...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Analyzing your document with AI
          </p>
        </div>
      </div>
    )
  }

  if (!hasCurriculum) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <BookOpenIcon className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No Learning Path Yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
            Upload a PDF document and click "Generate XP" to create your personalized learning journey
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header Summary */}
      <div className="flex items-center justify-between rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/50">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
            <TrophyIcon className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{curriculum?.title || "Learning Path"}</p>
            <p className="text-sm font-medium text-muted-foreground">{totalXp} XP Earned</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight text-primary">{currentLevelId}</p>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Level</p>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-4">
        {/* Continuous Vertical Line */}
        <div className="absolute bottom-0 left-[27px] top-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />

        <div className="space-y-6">
          {levels.map((level, index) => {
            const isCompleted = level.status === "completed"
            const isActive = level.status === "active"
            const isLocked = level.status === "locked"
            const isCurrentlyStudying = activeLessonId === level.id && (viewMode === 'lesson' || viewMode === 'quiz')

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex gap-5",
                  isLocked && "opacity-50"
                )}
              >
                {/* Node */}
                <div
                  className={cn(
                    "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-background transition-all duration-300",
                    isCompleted ? "border-green-500 bg-green-500 text-white shadow-md shadow-green-500/20" :
                      isActive ? "border-primary ring-4 ring-primary/10 scale-110" :
                        "border-border bg-muted"
                  )}
                >
                  {isCompleted && <CheckCircle2Icon className="h-3 w-3" />}
                  {isActive && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                  {isLocked && <LockIcon className="h-3 w-3 text-muted-foreground/50" />}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-medium leading-none",
                      isActive && "text-primary",
                      isCompleted && "text-green-600 dark:text-green-400"
                    )}>
                      {level.name}
                    </h3>
                    <span className="text-xs font-medium text-muted-foreground">Vol. {level.id}</span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{level.description}</p>

                  {/* Concepts Tags */}
                  {level.concepts && level.concepts.length > 0 && !isLocked && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {level.concepts.slice(0, 3).map((concept, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Start Lesson Button for Active Level */}
                  {isActive && (
                    <div className="pt-3">
                      {isCurrentlyStudying ? (
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <BookIcon className="h-4 w-4 animate-pulse" />
                          <span className="font-medium">
                            {viewMode === 'lesson' ? 'En cours d\'étude...' : 'Quiz en cours...'}
                          </span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => startLesson(level.id)}
                          size="sm"
                          className="gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                          <PlayIcon className="h-4 w-4" />
                          Commencer le cours
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Progress Bar for Active Level */}
                  {isActive && (
                    <div className="pt-2">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-muted-foreground">{level.xp} / {level.maxXp} XP</span>
                        <span className="font-medium text-primary">{level.progress}%</span>
                      </div>
                      <Progress value={level.progress} className="h-2" />
                    </div>
                  )}

                  {/* XP Badge and Review Button for Completed Levels */}
                  {isCompleted && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/30">
                        <TrophyIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                          +{level.xp} XP
                        </span>
                      </div>
                      <Button
                        onClick={() => startLesson(level.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <BookOpenIcon className="h-3 w-3 mr-1" />
                        Relire
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
