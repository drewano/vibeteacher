import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const CURRICULUM_PROMPT = `Tu es un expert en pédagogie mathématique. Analyse ce document éducatif et crée un parcours d'apprentissage gamifié en exactement 5 niveaux progressifs.

Document à analyser:
---
{DOCUMENT_TEXT}
---

Retourne UNIQUEMENT un JSON valide (sans markdown, sans backticks) avec cette structure exacte:
{
  "title": "Titre du curriculum basé sur le contenu",
  "levels": [
    {
      "id": 1,
      "name": "Nom court du niveau (ex: Les Bases)",
      "description": "Objectif d'apprentissage en 1 phrase",
      "content": "Explication pédagogique complète de la notion (3-5 paragraphes). Inclure des exemples concrets. Utiliser la notation LaTeX pour les formules: $formule$ pour inline, $$formule$$ pour block. Exemple: La formule quadratique est $x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}$",
      "concepts": ["concept1", "concept2", "concept3"],
      "quiz": {
        "question": "Question de validation claire et précise. Peut inclure du LaTeX.",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Explication de pourquoi cette réponse est correcte. Peut inclure du LaTeX."
      }
    }
  ]
}

Règles IMPORTANTES:
- Exactement 5 niveaux, du plus simple au plus avancé
- Chaque niveau doit avoir un "content" DÉTAILLÉ (min 200 mots) expliquant la notion
- Le content doit utiliser la notation LaTeX pour TOUTES les formules mathématiques
- Chaque niveau doit avoir 2-4 concepts clés
- Chaque niveau doit avoir UN quiz à choix multiple avec exactement 4 options
- "correctAnswer" est l'INDEX (0-3) de la bonne réponse
- Les options doivent être plausibles mais une seule correcte
- L'explication doit aider l'élève à comprendre son erreur si échec
- Tout doit être en français
- Les niveaux doivent former une progression logique pédagogique`

export async function POST(request: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error: "GEMINI_API_KEY not configured",
        message: "Please add your Gemini API key to .env.local",
      },
      { status: 500 }
    )
  }

  try {
    const { pdfText, documentName, documentId } = await request.json()

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: "No text content provided" },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            levels: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  name: { type: "string" },
                  description: { type: "string" },
                  content: { type: "string" },
                  concepts: {
                    type: "array",
                    items: { type: "string" }
                  },
                  quiz: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: {
                        type: "array",
                        items: { type: "string" }
                      },
                      correctAnswer: { type: "integer" },
                      explanation: { type: "string" }
                    },
                    required: ["question", "options", "correctAnswer", "explanation"]
                  }
                },
                required: ["id", "name", "description", "content", "concepts", "quiz"]
              }
            }
          },
          required: ["title", "levels"]
        }
      }
    })

    const prompt = CURRICULUM_PROMPT.replace("{DOCUMENT_TEXT}", pdfText.slice(0, 30000))

    const result = await model.generateContent(prompt)
    const curriculum = JSON.parse(result.response.text())

    // Add document metadata
    curriculum.documentId = documentId
    curriculum.documentName = documentName
    // Store PDF content for AI agent context (limit to reasonable size)
    curriculum.pdfContent = pdfText.slice(0, 50000)

    return NextResponse.json(curriculum)
  } catch (error) {
    console.error("Gemini API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate curriculum",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
