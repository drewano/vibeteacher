import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const AGENT_CACHE_PATH = path.join(process.cwd(), ".elevenlabs-agent.json")
const API_KEY = process.env.ELEVENLABS_API_KEY

// Learning context types
interface QuizInfo {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface LevelInfo {
  id: number
  name: string
  description: string
  content: string
  concepts: string[]
  status: "completed" | "active" | "locked"
  xp: number
  maxXp: number
  quiz: QuizInfo
}

interface LearningContext {
  documentName: string
  curriculumTitle: string
  totalXp: number
  maxTotalXp: number
  viewMode: 'idle' | 'lesson' | 'quiz'
  pdfContent?: string
  allLevels: LevelInfo[]
  currentLesson?: {
    id: number
    name: string
    description: string
    content: string
    concepts: string[]
  }
  currentQuiz?: {
    question: string
    options: string[]
    selectedAnswer: number | null
    isCorrect: boolean | null
    attempts: number
    explanation: string
  }
  completedLevels?: string[]
}

// Build the complete system prompt with all context
const getSystemPrompt = (learningContext?: LearningContext) => {
  let basePrompt = `Tu es un professeur de mathématiques patient, encourageant et pédagogue. Tu accompagnes un élève dans son parcours d'apprentissage.

=== TON RÔLE ===
- Expliquer les concepts mathématiques de manière claire et simple
- Répondre aux questions de l'élève sur le contenu qu'il étudie
- Poser des questions pour vérifier sa compréhension
- Féliciter les bonnes réponses et corriger gentiment les erreurs
- Encourager l'élève à persévérer

=== CONSIGNES IMPORTANTES ===
- Parle TOUJOURS en français
- Adapte ton niveau au contenu étudié
- Utilise des exemples concrets
- Sois patient et encourageant
- Garde des réponses courtes et dynamiques (2-4 phrases max)
- Pose des questions de suivi pour engager l'élève`

  // Add learning context if available
  if (learningContext) {
    basePrompt += `

╔══════════════════════════════════════════════════════════════╗
║              CONTEXTE D'APPRENTISSAGE ACTUEL                 ║
╚══════════════════════════════════════════════════════════════╝

📄 Document source: "${learningContext.documentName}"
📚 Parcours: "${learningContext.curriculumTitle}"
🏆 Progression: ${learningContext.totalXp} / ${learningContext.maxTotalXp} XP

`

    // Add learning curve (all levels with status)
    if (learningContext.allLevels && learningContext.allLevels.length > 0) {
      basePrompt += `
═══ COURBE D'APPRENTISSAGE (Tous les chapitres) ═══
`
      learningContext.allLevels.forEach((level, index) => {
        const statusEmoji = level.status === "completed" ? "✅" : level.status === "active" ? "📖" : "🔒"
        const xpInfo = level.status === "completed" ? `(${level.xp}/${level.maxXp} XP gagné)` : `(${level.maxXp} XP possible)`
        
        basePrompt += `
${statusEmoji} Chapitre ${level.id}: ${level.name} ${xpInfo}
   └─ ${level.description}
   └─ Concepts: ${level.concepts.join(", ")}
`
        // Include quiz info for completed or active levels
        if (level.status !== "locked" && level.quiz) {
          basePrompt += `   └─ Quiz: "${level.quiz.question.substring(0, 80)}${level.quiz.question.length > 80 ? '...' : ''}"\n`
        }
      })
    }

    // Add current lesson details
    if (learningContext.currentLesson) {
      basePrompt += `

═══ LEÇON EN COURS D'ÉTUDE ═══
📖 Chapitre ${learningContext.currentLesson.id}: ${learningContext.currentLesson.name}
📝 Description: ${learningContext.currentLesson.description}
🎯 Concepts clés: ${learningContext.currentLesson.concepts.join(", ")}

CONTENU COMPLET DE LA LEÇON:
---
${learningContext.currentLesson.content}
---
`
    }

    // Add current quiz with ALL details
    if (learningContext.viewMode === 'quiz' && learningContext.currentQuiz) {
      basePrompt += `

═══ QUIZ EN COURS ═══
❓ Question: ${learningContext.currentQuiz.question}

Options proposées:
`
      learningContext.currentQuiz.options.forEach((option, index) => {
        const letter = String.fromCharCode(65 + index)
        basePrompt += `   ${letter}) ${option}\n`
      })

      basePrompt += `
📊 Tentatives: ${learningContext.currentQuiz.attempts}
`

      if (learningContext.currentQuiz.selectedAnswer !== null) {
        const selectedLetter = String.fromCharCode(65 + learningContext.currentQuiz.selectedAnswer)
        basePrompt += `
L'élève a répondu: ${selectedLetter}) ${learningContext.currentQuiz.options[learningContext.currentQuiz.selectedAnswer]}
Résultat: ${learningContext.currentQuiz.isCorrect ? "✅ CORRECT!" : "❌ INCORRECT"}
Explication de la bonne réponse: ${learningContext.currentQuiz.explanation}
`
      }
    }

    // Add PDF content (truncated for context window)
    if (learningContext.pdfContent) {
      const truncatedPdf = learningContext.pdfContent.substring(0, 15000)
      basePrompt += `

═══ CONTENU DU DOCUMENT PDF SOURCE ═══
(Utilise ce contenu pour répondre aux questions de l'élève sur le cours)
---
${truncatedPdf}${learningContext.pdfContent.length > 15000 ? '\n[... document tronqué pour la limite de contexte ...]' : ''}
---
`
    }

    // Add mode-specific instructions
    if (learningContext.viewMode === 'lesson') {
      basePrompt += `

═══ INSTRUCTIONS SPÉCIALES (Mode Leçon) ═══
L'élève est en train de LIRE LA LEÇON. Tu dois:
✓ L'aider à comprendre le contenu affiché
✓ Répondre à ses questions sur la leçon
✓ Proposer des clarifications ou exemples supplémentaires
✓ L'encourager à passer au quiz quand il se sent prêt
`
    } else if (learningContext.viewMode === 'quiz') {
      basePrompt += `

═══ INSTRUCTIONS SPÉCIALES (Mode Quiz) ═══
L'élève passe le QUIZ de validation. Tu dois:
`
      if (learningContext.currentQuiz?.selectedAnswer === null) {
        basePrompt += `⚠️ NE PAS donner la réponse directement!
✓ L'aider à réfléchir par lui-même
✓ Poser des questions guidantes si besoin
✓ L'encourager dans sa réflexion
`
      } else if (learningContext.currentQuiz?.isCorrect) {
        basePrompt += `🎉 L'élève a RÉUSSI! Tu dois:
✓ Le féliciter chaleureusement
✓ Rappeler pourquoi cette réponse est correcte
✓ L'encourager pour la suite du parcours
`
      } else {
        basePrompt += `💪 L'élève s'est trompé. Tu dois:
✓ Le consoler gentiment
✓ Expliquer pourquoi sa réponse était incorrecte
✓ L'aider à comprendre la bonne réponse
✓ L'encourager à retenter ou revoir le cours
`
      }
    } else {
      basePrompt += `

═══ INSTRUCTIONS SPÉCIALES (Mode Attente) ═══
L'élève n'a pas encore démarré de leçon. Tu dois:
✓ L'encourager à sélectionner le prochain chapitre dans l'onglet XP
✓ Lui présenter brièvement ce qu'il va apprendre
✓ Le motiver pour son parcours d'apprentissage
`
    }
  }

  return basePrompt
}

interface AgentCache {
  agentId: string
  createdAt: string
}

function getAgentFromCache(): string | null {
  try {
    if (fs.existsSync(AGENT_CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(AGENT_CACHE_PATH, "utf-8")) as AgentCache
      return data.agentId || null
    }
  } catch (error) {
    console.error("Error reading agent cache:", error)
  }
  return null
}

function cacheAgent(agentId: string): void {
  try {
    fs.writeFileSync(
      AGENT_CACHE_PATH,
      JSON.stringify({ agentId, createdAt: new Date().toISOString() }, null, 2)
    )
  } catch (error) {
    console.error("Error caching agent:", error)
  }
}

function clearAgentCache(): void {
  try {
    if (fs.existsSync(AGENT_CACHE_PATH)) {
      fs.unlinkSync(AGENT_CACHE_PATH)
    }
  } catch (error) {
    console.error("Error clearing agent cache:", error)
  }
}

async function createAgent(learningContext?: LearningContext): Promise<string> {
  const systemPrompt = getSystemPrompt(learningContext)

  // Build first message based on context
  let firstMessage = "Bonjour! Je suis ton professeur de mathématiques IA. Comment puis-je t'aider aujourd'hui?"
  
  if (learningContext?.currentLesson) {
    firstMessage = `Bonjour! Je vois que tu étudies "${learningContext.currentLesson.name}". C'est un super chapitre! As-tu des questions sur le contenu?`
  } else if (learningContext?.curriculumTitle) {
    firstMessage = `Bonjour! Tu travailles sur "${learningContext.curriculumTitle}". Prêt à commencer l'apprentissage? Sélectionne un chapitre dans l'onglet XP!`
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/agents/create",
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Math Tutor AI",
        conversation_config: {
          tts: {
            voice_id: "cgSgspJ2msm6clMCkdW9", // Jessica - French multilingual voice
            model_id: "eleven_multilingual_v2",
          },
          agent: {
            first_message: firstMessage,
            prompt: {
              prompt: systemPrompt,
              llm: "gemini-2.5-flash",
            },
            language: "fr",
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to create agent:", errorText)
    throw new Error(`Failed to create agent: ${response.status}`)
  }

  const data = await response.json()
  return data.agent_id
}

async function updateAgent(agentId: string, learningContext: LearningContext): Promise<void> {
  const systemPrompt = getSystemPrompt(learningContext)

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
    {
      method: "PATCH",
      headers: {
        "xi-api-key": API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
              llm: "gemini-2.5-flash",
            },
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to update agent:", errorText)
    // Don't throw - just log the error, the agent will work with the old context
  }
}

async function getConversationToken(agentId: string): Promise<string> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
    {
      headers: {
        "xi-api-key": API_KEY!,
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to get conversation token:", errorText)
    throw new Error(`Failed to get conversation token: ${response.status}`)
  }

  const data = await response.json()
  return data.token
}

export async function POST(request: Request) {
  // Check if API key is configured
  if (!API_KEY) {
    return NextResponse.json(
      {
        error: "ELEVENLABS_API_KEY not configured",
        message: "Please add your ElevenLabs API key to .env.local",
      },
      { status: 500 }
    )
  }

  try {
    // Parse learning context from request body
    let learningContext: LearningContext | undefined
    try {
      const body = await request.json()
      if (body.learningContext) {
        learningContext = body.learningContext
      }
    } catch {
      // No body or invalid JSON - that's ok, we'll create agent without context
    }

    // 1. Get or create agent
    let agentId = getAgentFromCache()

    if (!agentId) {
      console.log("Creating new Math Tutor agent...")
      agentId = await createAgent(learningContext)
      cacheAgent(agentId)
      console.log("Agent created with ID:", agentId)
    } else {
      console.log("Using cached agent ID:", agentId)
      // Update agent with new learning context if provided
      if (learningContext) {
        console.log("Updating agent with learning context...")
        await updateAgent(agentId, learningContext)
      }
    }

    // 2. Get conversation token
    const conversationToken = await getConversationToken(agentId)

    return NextResponse.json({
      agentId,
      conversationToken,
    })
  } catch (error) {
    console.error("ElevenLabs API error:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize conversation",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check status
export async function GET() {
  const agentId = getAgentFromCache()
  return NextResponse.json({
    configured: !!API_KEY,
    agentId: agentId || null,
    hasAgent: !!agentId,
  })
}

// DELETE endpoint to clear agent cache (useful for resetting)
export async function DELETE() {
  clearAgentCache()
  return NextResponse.json({
    message: "Agent cache cleared",
  })
}
