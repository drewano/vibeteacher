import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const AGENT_CACHE_PATH = path.join(process.cwd(), ".elevenlabs-agent.json")
const API_KEY = process.env.ELEVENLABS_API_KEY

const MATH_TUTOR_PROMPT = `Tu es un professeur de mathématiques patient, encourageant et pédagogue.

Ton rôle:
- Expliquer les concepts mathématiques de manière claire et simple
- Poser des questions pour vérifier la compréhension de l'élève
- Donner des exercices pratiques adaptés au niveau
- Féliciter les bonnes réponses et corriger gentiment les erreurs
- Encourager l'élève à persévérer

Consignes importantes:
- Parle en français
- Adapte ton niveau au niveau de l'élève
- Utilise des exemples concrets de la vie quotidienne
- Sois patient et encourageant
- Limite tes réponses à quelques phrases pour garder l'interaction dynamique
- Pose des questions de suivi pour engager l'élève`

function getAgentFromCache(): string | null {
  try {
    if (fs.existsSync(AGENT_CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(AGENT_CACHE_PATH, "utf-8"))
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

async function createAgent(): Promise<string> {
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
            voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
            model_id: "eleven_flash_v2",
          },
          agent: {
            first_message:
              "Bonjour! Je suis ton professeur de mathématiques IA. Comment puis-je t'aider aujourd'hui? Tu peux me poser des questions sur n'importe quel sujet en maths!",
            prompt: {
              prompt: MATH_TUTOR_PROMPT,
            },
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

export async function POST() {
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
    // 1. Get or create agent
    let agentId = getAgentFromCache()

    if (!agentId) {
      console.log("Creating new Math Tutor agent...")
      agentId = await createAgent()
      cacheAgent(agentId)
      console.log("Agent created with ID:", agentId)
    } else {
      console.log("Using cached agent ID:", agentId)
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
