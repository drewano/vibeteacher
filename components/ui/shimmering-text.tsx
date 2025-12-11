"use client"

import * as React from "react"
import { motion, useInView } from "motion/react"

import { cn } from "@/lib/utils"

interface ShimmeringTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string
  duration?: number
  spread?: number
  color?: string
  shimmerColor?: string
  repeat?: boolean
  repeatDelay?: number
  startOnView?: boolean
  once?: boolean
}

const ShimmeringText = React.forwardRef<HTMLSpanElement, ShimmeringTextProps>(
  (
    {
      className,
      text,
      duration = 2,
      spread = 2,
      color = "currentColor",
      shimmerColor = "#fff",
      repeat = false,
      repeatDelay = 0,
      startOnView = false,
      once = false,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLSpanElement>(null)
    const isInView = useInView(containerRef, { once })
    const [key, setKey] = React.useState(0)

    React.useEffect(() => {
      if (repeat && !startOnView) {
        const interval = setInterval(() => {
          setKey((prev) => prev + 1)
        }, (duration + repeatDelay) * 1000)
        return () => clearInterval(interval)
      }
    }, [repeat, duration, repeatDelay, startOnView])

    const shouldAnimate = startOnView ? isInView : true

    return (
      <span
        ref={containerRef}
        className={cn("relative inline-block", className)}
        {...props}
      >
        <span style={{ color }}>{text}</span>
        {shouldAnimate && (
          <motion.span
            key={key}
            className="pointer-events-none absolute inset-0"
            initial={{ backgroundPosition: "-200% 0" }}
            animate={{ backgroundPosition: "200% 0" }}
            transition={{
              duration,
              ease: "linear",
              repeat: repeat ? Infinity : 0,
              repeatDelay,
            }}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
              backgroundSize: `${spread * 100}% 100%`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              mixBlendMode: "overlay",
            }}
          >
            {text}
          </motion.span>
        )}
      </span>
    )
  }
)

ShimmeringText.displayName = "ShimmeringText"

export { ShimmeringText }
