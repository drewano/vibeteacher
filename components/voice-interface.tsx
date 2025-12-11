"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Volume2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { MathText } from "@/components/math-text"

type AgentState =
	| "disconnected"
	| "connecting"
	| "connected"
	| "disconnecting"
	| null

interface TranscriptMessage {
	id: string
	role: "tutor" | "user"
	text: string
	timestamp: Date
}

interface VoiceInterfaceProps {
	transcripts: TranscriptMessage[]
	agentState: AgentState
	isTransitioning: boolean
}

export function VoiceInterface({
	transcripts,
	agentState,
	isTransitioning,
}: VoiceInterfaceProps) {
	const transcriptRef = useRef<HTMLDivElement>(null)

	// Auto-scroll transcripts
	useEffect(() => {
		if (transcriptRef.current) {
			transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
		}
	}, [transcripts])

	return (
		<div className="flex h-full flex-col bg-secondary/30">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border/40 bg-background/50 px-8 py-6 backdrop-blur-xl">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/20">
						<Volume2Icon className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-lg font-bold tracking-tight">Math Tutor AI</h1>
						<p className="text-sm font-medium text-muted-foreground">Professeur de Maths</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 backdrop-blur-sm">
					<div
						className={cn(
							"h-2 w-2 rounded-full transition-all duration-300",
							agentState === "connected" && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
							agentState === "disconnected" && "bg-slate-300",
							isTransitioning && "animate-pulse bg-amber-500"
						)}
					/>
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
						{agentState === "connected" ? "Connecté" : agentState === "connecting" ? "Connexion..." : "Déconnecté"}
					</span>
				</div>
			</div>

			{/* Transcript Area */}
			<div
				ref={transcriptRef}
				className="flex-1 overflow-y-auto px-8 py-6"
			>
				<div className="space-y-6">
					<AnimatePresence mode="popLayout">
						{transcripts.map((message) => (
							<motion.div
								key={message.id}
								initial={{ opacity: 0, y: 10, scale: 0.98 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -10, scale: 0.98 }}
								transition={{ type: "spring", stiffness: 400, damping: 30 }}
								className={cn(
									"flex w-full flex-col",
									message.role === "user" ? "items-end" : "items-start"
								)}
							>
								<div
									className={cn(
										"max-w-[85%] rounded-[1.5rem] px-6 py-4 shadow-sm",
										message.role === "tutor"
											? "bg-white text-foreground border border-border/50 rounded-tl-sm"
											: "bg-primary text-primary-foreground rounded-br-sm shadow-primary/20"
									)}
								>
									<p className="text-[15px] leading-relaxed"><MathText>{message.text}</MathText></p>
								</div>
								<span className="mt-2 px-2 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
									{message.role === "user" ? "Vous" : "Tuteur"} • {message.timestamp.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}
