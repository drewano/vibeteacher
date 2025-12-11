"use client"

import { motion } from "motion/react"
import { TrophyIcon, LockIcon, StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface Level {
  id: number
  name: string
  progress: number
  unlocked: boolean
  xp: number
  maxXp: number
}

const LEVELS: Level[] = [
  { id: 1, name: "Vol 1", progress: 100, unlocked: true, xp: 500, maxXp: 500 },
  { id: 2, name: "Vol 2", progress: 100, unlocked: true, xp: 500, maxXp: 500 },
  { id: 3, name: "Vol 3", progress: 75, unlocked: true, xp: 375, maxXp: 500 },
  { id: 4, name: "Vol 4", progress: 0, unlocked: false, xp: 0, maxXp: 500 },
  { id: 5, name: "Vol 5", progress: 0, unlocked: false, xp: 0, maxXp: 500 },
]

export function LearningProgress() {
  const totalXp = LEVELS.reduce((acc, level) => acc + level.xp, 0)
  const currentLevel = LEVELS.find((level) => level.progress < 100 && level.unlocked) || LEVELS[LEVELS.length - 1]

  return (
    <div className="border-t border-border/50 bg-muted/30 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
            <TrophyIcon className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Learning Progress</p>
            <p className="text-xs text-muted-foreground">{totalXp} XP Total</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-primary">Level {currentLevel.id}</p>
          <p className="text-xs text-muted-foreground">{currentLevel.name}</p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative">
        {/* Background Track */}
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />

        {/* Level Nodes */}
        <div className="relative flex items-center justify-between">
          {LEVELS.map((level, index) => (
            <motion.div
              key={level.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 400 }}
              className="flex flex-col items-center"
            >
              {/* Node */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  level.progress === 100
                    ? "border-green-500 bg-green-500/20"
                    : level.unlocked
                      ? "border-primary bg-primary/20"
                      : "border-muted-foreground/30 bg-muted"
                )}
              >
                {level.progress === 100 ? (
                  <StarIcon className="h-5 w-5 text-green-500" />
                ) : level.unlocked ? (
                  <span className="text-sm font-bold text-primary">
                    {level.progress}%
                  </span>
                ) : (
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                )}

                {/* Current Level Indicator */}
                {level.id === currentLevel.id && level.unlocked && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  level.unlocked ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {level.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Connecting Lines */}
        <div className="absolute left-5 right-5 top-1/2 -translate-y-1/2">
          <div className="flex gap-0">
            {LEVELS.slice(0, -1).map((level, index) => {
              const nextLevel = LEVELS[index + 1]
              const fillPercent = level.progress === 100 ? 100 : 0
              return (
                <div key={level.id} className="relative flex-1">
                  <div className="h-1 rounded-full bg-muted" />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercent}%` }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Current Progress Bar */}
      {currentLevel.unlocked && currentLevel.progress < 100 && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Progress</span>
            <span className="font-medium">
              {currentLevel.xp} / {currentLevel.maxXp} XP
            </span>
          </div>
          <Progress value={currentLevel.progress} className="h-2" />
        </div>
      )}
    </div>
  )
}
