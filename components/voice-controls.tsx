"use client"

import { AnimatePresence, motion } from "motion/react"
import { Loader2Icon, MicIcon, MicOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"

interface VoiceControlsProps {
	agentState: "disconnected" | "connecting" | "connected" | "disconnecting" | null
	isCallActive: boolean
	isTransitioning: boolean
	handleCall: () => void
	getInputVolume: () => number
	getOutputVolume: () => number
	errorMessage: string | null
}

export function VoiceControls({
	agentState,
	isCallActive,
	isTransitioning,
	handleCall,
	getInputVolume,
	getOutputVolume,
	errorMessage,
}: VoiceControlsProps) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-12">
			{/* Orb Visualizer - Larger for full tab */}
			<div className="relative size-64">
				<div className="relative h-full w-full rounded-full bg-white p-4 shadow-[0_20px_50px_rgba(79,70,229,0.15)] ring-1 ring-black/5">
					<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-transparent blur-[80px] animate-pulse" />
					<div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-black/5">
						<Orb
							className="h-full w-full"
							volumeMode="manual"
							getInputVolume={getInputVolume}
							getOutputVolume={getOutputVolume}
							agentState={isCallActive ? "listening" : undefined}
						/>
					</div>
				</div>
			</div>

			{/* Control Area */}
			<div className="flex flex-col items-center gap-6">
				{/* Status Text - Minimalist */}
				<div className="h-8 flex items-center justify-center">
					<AnimatePresence mode="wait">
						{errorMessage ? (
							<motion.p
								key="error"
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -5 }}
								className="text-center text-sm font-medium text-destructive"
							>
								{errorMessage}
							</motion.p>
						) : agentState === "disconnected" || agentState === null ? (
							<motion.p
								key="disconnected"
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -5 }}
								className="text-center text-sm font-medium text-muted-foreground/60"
							>
								Ready to help
							</motion.p>
						) : (
							<motion.div
								key="status"
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -5 }}
								className="flex items-center gap-2"
							>
								{isTransitioning ? (
									<ShimmeringText
										text="Connecting..."
										className="text-sm font-medium text-muted-foreground"
									/>
								) : (
									<span className="text-sm font-medium text-primary">
										Listening
									</span>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Listen Button */}
				<Button
					onClick={handleCall}
					disabled={isTransitioning}
					variant={isCallActive ? "destructive" : "default"}
					className="h-20 w-20 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
				>
					<AnimatePresence mode="wait">
						{isTransitioning ? (
							<motion.div
								key="loading"
								initial={{ opacity: 0, rotate: 0 }}
								animate={{ opacity: 1, rotate: 360 }}
								exit={{ opacity: 0 }}
								transition={{
									rotate: { duration: 1, repeat: Infinity, ease: "linear" },
								}}
							>
								<Loader2Icon className="h-8 w-8" />
							</motion.div>
						) : isCallActive ? (
							<motion.div
								key="end"
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.5 }}
							>
								<MicOffIcon className="h-8 w-8" />
							</motion.div>
						) : (
							<motion.div
								key="start"
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.5 }}
							>
								<MicIcon className="h-8 w-8" />
							</motion.div>
						)}
					</AnimatePresence>
				</Button>
			</div>
		</div>
	)
}
