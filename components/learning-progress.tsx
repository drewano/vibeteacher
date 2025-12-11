"use client"

import { motion } from "motion/react"
import { TrophyIcon, LockIcon, StarIcon, CheckCircle2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface Level {
	id: number
	name: string
	progress: number
	unlocked: boolean
	xp: number
	maxXp: number
	description?: string
}

const LEVELS: Level[] = [
	{ id: 1, name: "Foundations", progress: 100, unlocked: true, xp: 500, maxXp: 500, description: "Basic concepts and terminology" },
	{ id: 2, name: "Algebra I", progress: 100, unlocked: true, xp: 500, maxXp: 500, description: "Linear equations and inequalities" },
	{ id: 3, name: "Geometry", progress: 75, unlocked: true, xp: 375, maxXp: 500, description: "Shapes, sizes, and properties of space" },
	{ id: 4, name: "Trigonometry", progress: 0, unlocked: false, xp: 0, maxXp: 500, description: "Relationships between side lengths and angles" },
	{ id: 5, name: "Calculus", progress: 0, unlocked: false, xp: 0, maxXp: 500, description: "Continuous change" },
]

export function LearningProgress() {
	const totalXp = LEVELS.reduce((acc, level) => acc + level.xp, 0)
	const currentLevel = LEVELS.find((level) => level.progress < 100 && level.unlocked) || LEVELS[LEVELS.length - 1]

	return (
		<div className="flex flex-col gap-8">
			{/* Header Summary */}
			<div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border/50">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 ring-1 ring-orange-100">
						<TrophyIcon className="h-6 w-6 text-orange-500" />
					</div>
					<div>
						<p className="font-semibold text-foreground">Total Progress</p>
						<p className="text-sm font-medium text-muted-foreground">{totalXp} XP Earned</p>
					</div>
				</div>
				<div className="text-right">
					<p className="text-3xl font-bold tracking-tight text-primary">{currentLevel.id}</p>
					<p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">Current Level</p>
				</div>
			</div>

			{/* Vertical Timeline */}
			<div className="relative pl-4">
				{/* Continuous Vertical Line */}
				<div className="absolute bottom-0 left-[27px] top-2 w-px bg-gradient-to-b from-primary/50 via-muted to-transparent" />

				<div className="space-y-8">
					{LEVELS.map((level, index) => {
						const isCompleted = level.progress === 100;
						const isCurrent = level.id === currentLevel.id;
						const isLocked = !level.unlocked;

						return (
							<motion.div
								key={level.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className={cn(
									"relative flex gap-6",
									isLocked && "opacity-60"
								)}
							>
								{/* Node */}
								<div
									className={cn(
										"relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-all duration-300",
										isCompleted ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20" :
											isCurrent ? "border-primary ring-4 ring-primary/10 scale-110" :
												"border-slate-200 bg-slate-50"
									)}
								>
									{isCompleted && <CheckCircle2Icon className="h-3 w-3" />}
									{isCurrent && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
									{isLocked && <LockIcon className="h-3 w-3 text-muted-foreground/50" />}
								</div>

								{/* Content */}
								<div className="flex-1 space-y-2 pt-0.5">
									<div className="flex items-center justify-between">
										<h3 className={cn("font-medium leading-none", isCurrent && "text-primary")}>
											{level.name}
										</h3>
										<span className="text-xs font-medium text-muted-foreground">Level {level.id}</span>
									</div>

									<p className="text-sm text-muted-foreground line-clamp-1">{level.description}</p>

									{/* Progress Bar for Current Level */}
									{isCurrent && (
										<div className="pt-2">
											<div className="mb-1.5 flex justify-between text-xs">
												<span className="text-muted-foreground">{level.xp} / {level.maxXp} XP</span>
												<span className="font-medium text-primary">{level.progress}%</span>
											</div>
											<Progress value={level.progress} className="h-2" />
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
