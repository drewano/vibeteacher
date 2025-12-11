"use client"

import * as React from "react"
import { motion, useAnimationFrame } from "motion/react"

import { cn } from "@/lib/utils"

interface OrbProps extends React.HTMLAttributes<HTMLDivElement> {
  volumeMode?: "auto" | "manual"
  getInputVolume?: () => number
  getOutputVolume?: () => number
  manualInput?: number
  manualOutput?: number
  agentState?: "thinking" | "listening" | "talking" | null
}

const Orb = React.forwardRef<HTMLDivElement, OrbProps>(
  (
    {
      className,
      volumeMode = "auto",
      getInputVolume,
      getOutputVolume,
      manualInput = 0,
      manualOutput = 0,
      agentState,
      ...props
    },
    ref
  ) => {
    const [inputVolume, setInputVolume] = React.useState(0)
    const [outputVolume, setOutputVolume] = React.useState(0)

    useAnimationFrame(() => {
      if (volumeMode === "manual") {
        setInputVolume(manualInput)
        setOutputVolume(manualOutput)
      } else {
        setInputVolume(getInputVolume?.() ?? 0)
        setOutputVolume(getOutputVolume?.() ?? 0)
      }
    })

    const combinedVolume = Math.max(inputVolume, outputVolume)
    const scale = 1 + combinedVolume * 0.3
    const glowIntensity = combinedVolume * 40

    const getStateColor = () => {
      switch (agentState) {
        case "thinking":
          return "from-amber-400 via-orange-500 to-amber-600"
        case "listening":
          return "from-blue-400 via-cyan-500 to-blue-600"
        case "talking":
          return "from-emerald-400 via-green-500 to-emerald-600"
        default:
          return "from-violet-400 via-purple-500 to-violet-600"
      }
    }

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-xl",
            getStateColor()
          )}
          animate={{
            scale: scale * 1.2,
            opacity: 0.3 + combinedVolume * 0.4,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <motion.div
          className={cn(
            "relative h-full w-full rounded-full bg-gradient-to-br shadow-lg",
            getStateColor()
          )}
          animate={{
            scale,
            boxShadow: `0 0 ${glowIntensity}px ${glowIntensity / 2}px rgba(139, 92, 246, 0.5)`,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/30"
            animate={{ opacity: 0.5 + combinedVolume * 0.5 }}
          />
        </motion.div>
      </div>
    )
  }
)

Orb.displayName = "Orb"

export { Orb }
