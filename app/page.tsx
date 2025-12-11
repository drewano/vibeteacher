"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { PanelRightOpenIcon } from "lucide-react"
import { useConversation } from "@elevenlabs/react"

import { Button } from "@/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { VoiceInterface } from "@/components/voice-interface"
import { Workspace } from "@/components/workspace"

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

export default function Home() {
	const [isSheetOpen, setIsSheetOpen] = useState(false)

	// State lifted from VoiceInterface
	const [agentState, setAgentState] = useState<AgentState>("disconnected")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([
		{
			id: "1",
			role: "tutor",
			text: "Bonjour! Je suis ton professeur de mathématiques IA. Clique sur le micro pour commencer!",
			timestamp: new Date(),
		},
	])

	const conversation = useConversation({
		onConnect: () => console.log("Connected to ElevenLabs"),
		onDisconnect: () => {
			console.log("Disconnected from ElevenLabs")
			setAgentState("disconnected")
		},
		onMessage: (message) => {
			console.log("Message:", message)
			if (message.message) {
				const newMessage: TranscriptMessage = {
					id: Date.now().toString(),
					role: message.source === "ai" ? "tutor" : "user",
					text: message.message,
					timestamp: new Date(),
				}
				setTranscripts((prev) => [...prev, newMessage])
			}
		},
		onError: (error) => {
			console.error("Error:", error)
			setAgentState("disconnected")
			setErrorMessage("Connection error. Please try again.")
		},
	})

	const startConversation = useCallback(async () => {
		try {
			setErrorMessage(null)
			await navigator.mediaDevices.getUserMedia({ audio: true })
			const response = await fetch("/api/elevenlabs", { method: "POST" })
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.message || "Failed to get conversation token")
			}

			console.log("Got conversation token, starting session...")
			await conversation.startSession({
				conversationToken: data.conversationToken,
				connectionType: "webrtc",
				onStatusChange: (status) => setAgentState(status.status),
			})
		} catch (error) {
			console.error("Error starting conversation:", error)
			setAgentState("disconnected")
			if (error instanceof DOMException && error.name === "NotAllowedError") {
				setErrorMessage("Veuillez activer les permissions du microphone.")
			} else if (error instanceof Error) {
				setErrorMessage(error.message)
			} else {
				setErrorMessage("Erreur de connexion. Vérifiez votre clé API.")
			}
		}
	}, [conversation])

	const handleCall = useCallback(() => {
		if (agentState === "disconnected" || agentState === null) {
			setAgentState("connecting")
			startConversation()
		} else if (agentState === "connected") {
			conversation.endSession()
			setAgentState("disconnected")
		}
	}, [agentState, conversation, startConversation])

	const isCallActive = agentState === "connected"
	const isTransitioning =
		agentState === "connecting" || agentState === "disconnecting"

	const getInputVolume = useCallback(() => {
		const rawValue = conversation.getInputVolume?.() ?? 0
		return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5)
	}, [conversation])

	const getOutputVolume = useCallback(() => {
		const rawValue = conversation.getOutputVolume?.() ?? 0
		return Math.min(1.0, Math.pow(rawValue, 0.5) * 2.5)
	}, [conversation])

	const voiceProps = {
		agentState,
		isCallActive,
		isTransitioning,
		errorMessage,
		handleCall,
		getInputVolume,
		getOutputVolume,
	}

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			{/* Left Panel - Voice Interface (60% on desktop, full on mobile) */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="relative w-full lg:w-[60%]"
			>
				<VoiceInterface
					transcripts={transcripts}
					agentState={agentState}
					isTransitioning={isTransitioning}
				/>

				{/* Mobile Toggle Button */}
				<div className="absolute right-4 top-4 lg:hidden">
					<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
						<SheetTrigger asChild>
							<Button variant="outline" size="icon" className="h-10 w-10">
								<PanelRightOpenIcon className="h-5 w-5" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-full p-0 sm:max-w-md">
							<SheetHeader className="sr-only">
								<SheetTitle>Workspace</SheetTitle>
							</SheetHeader>
							<Workspace voiceProps={voiceProps} />
						</SheetContent>
					</Sheet>
				</div>
			</motion.div>

			{/* Right Panel - Workspace (40% on desktop, hidden on mobile) */}
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
				className="hidden w-[40%] border-l border-border/50 lg:block"
			>
				<Workspace voiceProps={voiceProps} />
			</motion.div>
		</div>
	)
}
