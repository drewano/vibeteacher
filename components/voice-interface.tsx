"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import { useConversation } from "@elevenlabs/react"
import { AnimatePresence, motion } from "motion/react"
import { Loader2Icon, MicIcon, MicOffIcon, Volume2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Orb } from "@/components/ui/orb"
import { ShimmeringText } from "@/components/ui/shimmering-text"

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

export function VoiceInterface() {
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
  const transcriptRef = useRef<HTMLDivElement>(null)

  const conversation = useConversation({
    onConnect: () => console.log("Connected to ElevenLabs"),
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs")
      setAgentState("disconnected")
    },
    onMessage: (message) => {
      console.log("Message:", message)
      // Add message to transcripts
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

  // Auto-scroll transcripts
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcripts])

  const startConversation = useCallback(async () => {
    try {
      setErrorMessage(null)

      // 1. Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // 2. Get conversation token from our API
      const response = await fetch("/api/elevenlabs", { method: "POST" })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get conversation token")
      }

      console.log("Got conversation token, starting session...")

      // 3. Start session with the token
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

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Volume2Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Math Tutor AI</h1>
            <p className="text-sm text-muted-foreground">Professeur de Maths</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-300",
              agentState === "connected" && "bg-green-500 shadow-lg shadow-green-500/50",
              agentState === "disconnected" && "bg-muted-foreground",
              isTransitioning && "animate-pulse bg-amber-500"
            )}
          />
          <span className="text-xs text-muted-foreground capitalize">
            {agentState === "connected" ? "Connecté" : agentState === "connecting" ? "Connexion..." : "Déconnecté"}
          </span>
        </div>
      </div>

      {/* Transcript Area */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {transcripts.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "tutor"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-primary text-primary-foreground"
                )}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <span className="mt-1 block text-xs opacity-60">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Orb and Controls */}
      <div className="flex flex-col items-center gap-6 border-t border-border/50 bg-card/50 px-6 py-8">
        {/* Orb Visualizer */}
        <div className="relative size-32">
          <div className="relative h-full w-full rounded-full bg-muted p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]">
            <div className="h-full w-full overflow-hidden rounded-full bg-background shadow-[inset_0_0_12px_rgba(0,0,0,0.1)]">
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

        {/* Status Text */}
        <div className="flex flex-col items-center gap-2">
          <AnimatePresence mode="wait">
            {errorMessage ? (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center text-sm text-destructive"
              >
                {errorMessage}
              </motion.p>
            ) : agentState === "disconnected" || agentState === null ? (
              <motion.p
                key="disconnected"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center text-sm text-muted-foreground"
              >
                Appuie sur le micro pour parler avec ton tuteur
              </motion.p>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2"
              >
                {isTransitioning ? (
                  <ShimmeringText
                    text="Connexion en cours..."
                    className="text-sm text-muted-foreground"
                  />
                ) : (
                  <span className="text-sm text-green-500">
                    Connecté - Parle maintenant!
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Call Button */}
        <Button
          onClick={handleCall}
          disabled={isTransitioning}
          size="lg"
          variant={isCallActive ? "destructive" : "default"}
          className="h-14 w-14 rounded-full shadow-lg"
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
                <Loader2Icon className="h-6 w-6" />
              </motion.div>
            ) : isCallActive ? (
              <motion.div
                key="end"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <MicOffIcon className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <MicIcon className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  )
}
