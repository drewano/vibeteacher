"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
import { useCurriculum, Level, Quiz } from "@/lib/curriculum-context"

type AgentState =
	| "disconnected"
	| "connecting"
	| "connected"
	| "disconnecting"
	| null

// Build complete learning context for the AI agent
function buildLearningContext(
	curriculum: ReturnType<typeof useCurriculum>["curriculum"],
	viewMode: ReturnType<typeof useCurriculum>["viewMode"],
	activeLesson: Level | null,
	activeQuiz: ReturnType<typeof useCurriculum>["activeQuiz"],
	totalXp: number
) {
	if (!curriculum) return undefined

	// Build all levels with their full info
	const allLevels = curriculum.levels.map(level => ({
		id: level.id,
		name: level.name,
		description: level.description,
		content: level.content,
		concepts: level.concepts,
		status: level.status,
		xp: level.xp,
		maxXp: level.maxXp,
		quiz: level.quiz,
	}))

	// Calculate max total XP
	const maxTotalXp = curriculum.levels.reduce((sum, l) => sum + l.maxXp, 0)

	// Build current quiz info with all details
	let currentQuiz: {
		question: string
		options: string[]
		selectedAnswer: number | null
		isCorrect: boolean | null
		attempts: number
		explanation: string
	} | undefined

	if (activeQuiz) {
		currentQuiz = {
			question: activeQuiz.quiz.question,
			options: activeQuiz.quiz.options,
			selectedAnswer: activeQuiz.selectedAnswer,
			isCorrect: activeQuiz.isCorrect,
			attempts: activeQuiz.attempts,
			explanation: activeQuiz.quiz.explanation,
		}
	}

	return {
		documentName: curriculum.documentName,
		curriculumTitle: curriculum.title,
		totalXp,
		maxTotalXp,
		viewMode,
		pdfContent: curriculum.pdfContent,
		allLevels,
		currentLesson: activeLesson ? {
			id: activeLesson.id,
			name: activeLesson.name,
			description: activeLesson.description,
			content: activeLesson.content,
			concepts: activeLesson.concepts,
		} : undefined,
		currentQuiz,
		completedLevels: curriculum.levels
			.filter(l => l.status === "completed")
			.map(l => `${l.name} (${l.xp} XP)`),
	}
}

export default function Home() {
	const [isSheetOpen, setIsSheetOpen] = useState(false)

	// Voice agent state
	const [agentState, setAgentState] = useState<AgentState>("disconnected")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	// Get curriculum context
	const { 
		curriculum, 
		viewMode, 
		getActiveLesson, 
		activeQuiz, 
		totalXp 
	} = useCurriculum()

	// Reference to track previous context for sending updates
	const prevContextRef = useRef<string>("")

	const conversation = useConversation({
		onConnect: () => console.log("Connected to ElevenLabs"),
		onDisconnect: () => {
			console.log("Disconnected from ElevenLabs")
			setAgentState("disconnected")
		},
		onMessage: (message) => {
			console.log("Message:", message)
		},
		onError: (error) => {
			console.error("Error:", error)
			setAgentState("disconnected")
			setErrorMessage("Connection error. Please try again.")
		},
	})

	// Send contextual update to the agent when learning state changes
	useEffect(() => {
		if (agentState !== "connected") return

		const activeLesson = getActiveLesson()
		const learningContext = buildLearningContext(
			curriculum,
			viewMode,
			activeLesson,
			activeQuiz,
			totalXp
		)

		if (!learningContext) return

		// Build context string to compare
		const contextString = JSON.stringify({
			viewMode,
			lessonId: activeLesson?.id,
			quizQuestion: activeQuiz?.quiz.question,
			quizAnswer: activeQuiz?.selectedAnswer,
			isCorrect: activeQuiz?.isCorrect,
		})

		// Only send update if context actually changed
		if (contextString === prevContextRef.current) return
		prevContextRef.current = contextString

		// Build the contextual update message with full details
		let updateMessage = ""

		if (viewMode === "lesson" && activeLesson) {
			updateMessage = `[CONTEXTE MIS À JOUR] 
L'élève étudie maintenant le Chapitre ${activeLesson.id}: "${activeLesson.name}"
Description: ${activeLesson.description}
Concepts: ${activeLesson.concepts.join(", ")}

Contenu de la leçon:
${activeLesson.content.substring(0, 2000)}${activeLesson.content.length > 2000 ? "..." : ""}

Tu peux maintenant répondre à ses questions sur ce chapitre.`

		} else if (viewMode === "quiz" && activeQuiz) {
			if (activeQuiz.selectedAnswer !== null && activeQuiz.showExplanation) {
				const selectedOption = activeQuiz.quiz.options[activeQuiz.selectedAnswer]
				const correctOption = activeQuiz.quiz.options[activeQuiz.quiz.correctAnswer]
				
				if (activeQuiz.isCorrect) {
					updateMessage = `[QUIZ RÉUSSI!] 
L'élève a correctement répondu au quiz!
Question: "${activeQuiz.quiz.question}"
Sa réponse: "${selectedOption}" ✅
Explication: ${activeQuiz.quiz.explanation}

Félicite-le chaleureusement et encourage-le pour la suite!`
				} else {
					updateMessage = `[QUIZ ÉCHOUÉ]
L'élève s'est trompé au quiz.
Question: "${activeQuiz.quiz.question}"
Sa réponse: "${selectedOption}" ❌
Bonne réponse: "${correctOption}"
Explication: ${activeQuiz.quiz.explanation}

Console-le gentiment et aide-le à comprendre son erreur. Encourage-le à réessayer ou revoir le cours.`
				}
			} else {
				updateMessage = `[MODE QUIZ ACTIVÉ]
L'élève passe maintenant le quiz de validation.
Question: "${activeQuiz.quiz.question}"
Options: ${activeQuiz.quiz.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(" | ")}
Tentative: ${activeQuiz.attempts + 1}

⚠️ IMPORTANT: Ne lui donne PAS la réponse! Aide-le à réfléchir par lui-même.`
			}
		} else if (viewMode === "idle") {
			const nextLevel = curriculum?.levels.find(l => l.status === "active")
			if (nextLevel) {
				updateMessage = `[RETOUR AU MENU]
L'élève a terminé ou quitté le chapitre en cours.
Prochain chapitre disponible: "${nextLevel.name}"
Encourage-le à continuer son apprentissage en sélectionnant le chapitre dans l'onglet XP.`
			} else {
				updateMessage = `[PARCOURS TERMINÉ]
Félicitations! L'élève a terminé tous les chapitres du parcours "${curriculum?.title}"!
XP total: ${totalXp}
Célèbre sa réussite!`
			}
		}

		if (updateMessage) {
			console.log("Sending contextual update:", updateMessage.substring(0, 200) + "...")
			// Use sendContextualUpdate if available
			if (typeof (conversation as unknown as { sendContextualUpdate?: (msg: string) => void }).sendContextualUpdate === 'function') {
				(conversation as unknown as { sendContextualUpdate: (msg: string) => void }).sendContextualUpdate(updateMessage)
			}
		}
	}, [agentState, curriculum, viewMode, activeQuiz, totalXp, getActiveLesson, conversation])

	const startConversation = useCallback(async () => {
		try {
			setErrorMessage(null)
			await navigator.mediaDevices.getUserMedia({ audio: true })

			// Build complete learning context for initial agent setup
			const activeLesson = getActiveLesson()
			const learningContext = buildLearningContext(
				curriculum,
				viewMode,
				activeLesson,
				activeQuiz,
				totalXp
			)

			console.log("Starting conversation with learning context:", 
				learningContext ? {
					curriculum: learningContext.curriculumTitle,
					viewMode: learningContext.viewMode,
					lesson: learningContext.currentLesson?.name,
					levelsCount: learningContext.allLevels?.length,
					hasPdfContent: !!learningContext.pdfContent,
				} : "No context"
			)

			const response = await fetch("/api/elevenlabs", { 
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ learningContext }),
			})
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
	}, [conversation, curriculum, viewMode, activeQuiz, totalXp, getActiveLesson])

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
			{/* Left Panel - Learning Board (60% on desktop, full on mobile) */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="relative w-full lg:w-[60%]"
			>
				<VoiceInterface
					agentState={agentState}
					isTransitioning={isTransitioning}
					getInputVolume={getInputVolume}
					getOutputVolume={getOutputVolume}
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
