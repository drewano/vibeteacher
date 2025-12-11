"use client"

import { useState } from "react"
import { FileTextIcon, TrophyIcon, MicIcon } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentTab } from "@/components/document-tab"
import { LearningProgress } from "@/components/learning-progress"
import { VoiceControls } from "@/components/voice-controls"

interface WorkspaceProps {
	voiceProps?: {
		agentState: "disconnected" | "connecting" | "connected" | "disconnecting" | null
		isCallActive: boolean
		isTransitioning: boolean
		handleCall: () => void
		getInputVolume: () => number
		getOutputVolume: () => number
		errorMessage: string | null
	}
}

export function Workspace({ voiceProps }: WorkspaceProps) {
	const [activeTab, setActiveTab] = useState("agent")

	return (
		<div className="flex h-full flex-col bg-background/50 backdrop-blur-sm">
			{/* Header removed for minimalism - tabs act as header */}

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="flex h-full flex-col"
			>
				<div className="px-8 pt-8 pb-0">
					<TabsList className="h-14 w-full justify-start gap-8 bg-transparent p-0 border-b border-border/60">
						<TabsTrigger
							value="agent"
							className="group relative flex items-center gap-2.5 rounded-none border-b-[3px] border-transparent px-1 pb-4 pt-2 text-base font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
						>
							<MicIcon className="h-4.5 w-4.5" />
							<span>Agent</span>
						</TabsTrigger>
						<TabsTrigger
							value="documents"
							className="group relative flex items-center gap-2.5 rounded-none border-b-[3px] border-transparent px-1 pb-4 pt-2 text-base font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
						>
							<FileTextIcon className="h-4.5 w-4.5" />
							<span>Documents</span>
						</TabsTrigger>
						<TabsTrigger
							value="xp"
							className="group relative flex items-center gap-2.5 rounded-none border-b-[3px] border-transparent px-1 pb-4 pt-2 text-base font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
						>
							<TrophyIcon className="h-4.5 w-4.5" />
							<span>XP</span>
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="flex-1 overflow-hidden">
					<TabsContent value="agent" className="m-0 h-full p-6 outline-none data-[state=inactive]:hidden">
						{voiceProps && (
							<div className="h-full flex items-center justify-center">
								<VoiceControls {...voiceProps} />
							</div>
						)}
					</TabsContent>

					<TabsContent value="documents" className="m-0 h-full overflow-y-auto px-6 py-6 outline-none data-[state=inactive]:hidden">
						<DocumentTab />
					</TabsContent>

					<TabsContent value="xp" className="m-0 h-full overflow-y-auto px-6 py-6 outline-none data-[state=inactive]:hidden">
						<LearningProgress />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	)
}
