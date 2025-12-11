"use client"

import { AnimatePresence, motion } from "motion/react"
import { Volume2Icon, BookOpenIcon, ArrowRightIcon, RefreshCwIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { MathText } from "@/components/math-text"
import { QuizCard } from "@/components/quiz-card"
import { Button } from "@/components/ui/button"
import { Orb } from "@/components/ui/orb"
import { useCurriculum } from "@/lib/curriculum-context"

type AgentState =
	| "disconnected"
	| "connecting"
	| "connected"
	| "disconnecting"
	| null

interface VoiceInterfaceProps {
	agentState: AgentState
	isTransitioning: boolean
	getInputVolume: () => number
	getOutputVolume: () => number
}

export function VoiceInterface({
	agentState,
	isTransitioning,
	getInputVolume,
	getOutputVolume,
}: VoiceInterfaceProps) {
	const {
		viewMode,
		getActiveLesson,
		switchToQuiz,
		activeQuiz,
		answerQuiz,
		completeLevel,
		incrementQuizAttempts,
		startLesson,
		resetQuiz,
	} = useCurriculum()

	const activeLesson = getActiveLesson()

	// Render based on viewMode
	const renderContent = () => {
		switch (viewMode) {
			case 'idle':
				return <IdleState agentState={agentState} getInputVolume={getInputVolume} getOutputVolume={getOutputVolume} />

			case 'lesson':
				if (!activeLesson) return <IdleState agentState={agentState} getInputVolume={getInputVolume} getOutputVolume={getOutputVolume} />
				return (
					<LessonCard
						lesson={activeLesson}
						onSwitchToQuiz={switchToQuiz}
						agentState={agentState}
						getInputVolume={getInputVolume}
						getOutputVolume={getOutputVolume}
					/>
				)

			case 'quiz':
				if (!activeQuiz || !activeLesson) return <IdleState agentState={agentState} getInputVolume={getInputVolume} getOutputVolume={getOutputVolume} />
				return (
					<QuizView
						activeQuiz={activeQuiz}
						lessonId={activeLesson.id}
						onAnswer={answerQuiz}
						onComplete={completeLevel}
						onRetry={() => {
							incrementQuizAttempts(activeLesson.id)
							startLesson(activeLesson.id)
						}}
						onReviewLesson={() => startLesson(activeLesson.id)}
					/>
				)

			default:
				return <IdleState agentState={agentState} getInputVolume={getInputVolume} getOutputVolume={getOutputVolume} />
		}
	}

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

			{/* Main Content Area */}
			<div className="flex-1 overflow-y-auto px-8 py-6">
				<AnimatePresence mode="wait">
					<motion.div
						key={viewMode}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="h-full"
					>
						{renderContent()}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	)
}

// Idle State Component
function IdleState({
	agentState,
	getInputVolume,
	getOutputVolume,
}: {
	agentState: AgentState
	getInputVolume: () => number
	getOutputVolume: () => number
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-8">
			{/* Orb */}
			<div className="relative size-48">
				<div className="relative h-full w-full rounded-full bg-white p-3 shadow-[0_20px_50px_rgba(79,70,229,0.15)] ring-1 ring-black/5">
					<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-transparent blur-[60px] animate-pulse" />
					<div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-black/5">
						<Orb
							className="h-full w-full"
							volumeMode="auto"
							getInputVolume={getInputVolume}
							getOutputVolume={getOutputVolume}
							agentState={agentState === "connected" ? "listening" : undefined}
						/>
					</div>
				</div>
			</div>

			{/* Empty State Message */}
			<div className="text-center max-w-md">
				<div className="flex justify-center mb-4">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
						<BookOpenIcon className="h-7 w-7 text-muted-foreground/50" />
					</div>
				</div>
				<h2 className="text-xl font-semibold text-foreground mb-2">
					Prêt à apprendre
				</h2>
				<p className="text-muted-foreground leading-relaxed">
					Sélectionne le chapitre en cours dans l'onglet <span className="font-medium text-primary">XP</span> pour commencer ton apprentissage.
				</p>
			</div>
		</div>
	)
}

// Lesson Card Component
function LessonCard({
	lesson,
	onSwitchToQuiz,
	agentState,
	getInputVolume,
	getOutputVolume,
}: {
	lesson: {
		id: number
		name: string
		description: string
		content: string
		concepts: string[]
	}
	onSwitchToQuiz: () => void
	agentState: AgentState
	getInputVolume: () => number
	getOutputVolume: () => number
}) {
	return (
		<div className="flex flex-col h-full">
			{/* Floating Orb */}
			<div className="flex justify-center mb-6">
				<div className="relative size-20">
					<div className="relative h-full w-full rounded-full bg-white p-2 shadow-lg ring-1 ring-black/5">
						<div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-black/5">
							<Orb
								className="h-full w-full"
								volumeMode="auto"
								getInputVolume={getInputVolume}
								getOutputVolume={getOutputVolume}
								agentState={agentState === "connected" ? "talking" : undefined}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Lesson Content Card */}
			<div className="flex-1 overflow-y-auto">
				<div className="rounded-2xl border border-border bg-background shadow-lg overflow-hidden">
					{/* Header */}
					<div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-5 border-b border-border/50">
						<div className="flex items-center gap-3 mb-2">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
								<BookOpenIcon className="h-5 w-5 text-primary" />
							</div>
							<span className="text-sm font-medium text-muted-foreground">
								Chapitre {lesson.id}
							</span>
						</div>
						<h2 className="text-2xl font-bold text-foreground">
							{lesson.name}
						</h2>
						<p className="text-sm text-muted-foreground mt-1">
							{lesson.description}
						</p>
					</div>

					{/* Concepts Tags */}
					{lesson.concepts && lesson.concepts.length > 0 && (
						<div className="px-6 py-3 border-b border-border/50 bg-muted/30">
							<div className="flex flex-wrap gap-2">
								{lesson.concepts.map((concept, i) => (
									<span
										key={i}
										className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium"
									>
										{concept}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Content */}
					<div className="px-6 py-6">
						<div className="prose prose-sm max-w-none dark:prose-invert">
							<div className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
								<MathText>{lesson.content}</MathText>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Footer with Quiz Button */}
			<div className="pt-6 pb-2">
				<Button
					onClick={onSwitchToQuiz}
					size="lg"
					className="w-full gap-2 h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
				>
					Je suis prêt pour le Quiz
					<ArrowRightIcon className="h-5 w-5" />
				</Button>
			</div>
		</div>
	)
}

// Quiz View Component
function QuizView({
	activeQuiz,
	lessonId,
	onAnswer,
	onComplete,
	onRetry,
	onReviewLesson,
}: {
	activeQuiz: {
		levelId: number
		quiz: {
			question: string
			options: string[]
			correctAnswer: number
			explanation: string
		}
		selectedAnswer: number | null
		isCorrect: boolean | null
		attempts: number
		showExplanation: boolean
	}
	lessonId: number
	onAnswer: (index: number) => boolean
	onComplete: (levelId: number) => void
	onRetry: () => void
	onReviewLesson: () => void
}) {
	const maxAttempts = 3
	const canRetry = !activeQuiz.isCorrect && activeQuiz.attempts < maxAttempts

	const handleContinue = () => {
		if (activeQuiz.isCorrect) {
			onComplete(lessonId)
		} else {
			// If failed and no more retries, go back to lesson
			onReviewLesson()
		}
	}

	const handleRetry = () => {
		onRetry()
	}

	return (
		<div className="flex flex-col h-full items-center justify-center">
			<QuizCard
				quiz={activeQuiz.quiz}
				selectedAnswer={activeQuiz.selectedAnswer}
				isCorrect={activeQuiz.isCorrect}
				attempts={activeQuiz.attempts}
				maxAttempts={maxAttempts}
				showExplanation={activeQuiz.showExplanation}
				onSelectAnswer={onAnswer}
				onContinue={handleContinue}
				onRetry={canRetry ? handleRetry : undefined}
			/>
		</div>
	)
}
