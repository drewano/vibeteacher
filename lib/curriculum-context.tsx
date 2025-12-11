"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

// Quiz structure for validation
export interface Quiz {
  question: string
  options: string[]
  correctAnswer: number // Index of correct option
  explanation: string
}

export interface Level {
  id: number
  name: string
  description: string
  content: string // Detailed lesson content for this notion
  concepts: string[]
  quiz: Quiz
  status: "completed" | "active" | "locked"
  progress: number
  xp: number
  maxXp: number
  quizAttempts: number // Track quiz attempts (max 3)
}

export interface LearningCurriculum {
  documentId: string
  documentName: string
  title: string
  levels: Level[]
  currentLevelId: number
  totalXp: number
  pdfContent?: string // Full text extracted from the PDF
}

export interface UploadedDocument {
  id: string
  name: string
  size: number
  type: string
  file: File
}

// Quiz state for active quiz
export interface ActiveQuiz {
  levelId: number
  quiz: Quiz
  selectedAnswer: number | null
  isCorrect: boolean | null
  attempts: number
  showExplanation: boolean
}

// View mode for the left panel (lesson flow)
export type ViewMode = 'idle' | 'lesson' | 'quiz'

interface CurriculumContextType {
  // Curriculum state
  curriculum: LearningCurriculum | null
  isGenerating: boolean
  currentLevelId: number
  totalXp: number
  setCurriculum: (curriculum: LearningCurriculum) => void
  setIsGenerating: (value: boolean) => void
  completeLevel: (levelId: number) => void
  resetCurriculum: () => void
  getCurrentLevel: () => Level | null

  // Lesson flow state (verrouillage/déverrouillage)
  activeLessonId: number | null
  viewMode: ViewMode
  startLesson: (levelId: number) => void
  switchToQuiz: () => void
  getActiveLesson: () => Level | null

  // Quiz state
  activeQuiz: ActiveQuiz | null
  startQuiz: (levelId: number) => void
  answerQuiz: (answerIndex: number) => boolean
  resetQuiz: () => void
  incrementQuizAttempts: (levelId: number) => void

  // Document state (persisted across tab switches)
  documents: UploadedDocument[]
  selectedDocument: UploadedDocument | null
  addDocument: (doc: UploadedDocument) => void
  setSelectedDocument: (doc: UploadedDocument | null) => void
  removeDocument: (id: string) => void
}

const CurriculumContext = createContext<CurriculumContextType | null>(null)

const XP_PER_LEVEL = 100

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [curriculum, setCurriculumState] = useState<LearningCurriculum | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null)

  // Lesson flow state
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('idle')

  // Document state - persisted at context level
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [selectedDocument, setSelectedDocumentState] = useState<UploadedDocument | null>(null)

  const currentLevelId = curriculum?.levels.find(
    (level) => level.status === "active"
  )?.id ?? 1

  const totalXp = curriculum?.levels.reduce((sum, level) => sum + level.xp, 0) ?? 0

  const setCurriculum = useCallback((newCurriculum: LearningCurriculum) => {
    // Initialize levels with proper status
    const initializedCurriculum: LearningCurriculum = {
      ...newCurriculum,
      currentLevelId: 1,
      totalXp: 0,
      levels: newCurriculum.levels.map((level, index) => ({
        ...level,
        status: index === 0 ? "active" : "locked" as const,
        progress: 0,
        xp: 0,
        maxXp: XP_PER_LEVEL,
        quizAttempts: 0,
      })),
    }
    setCurriculumState(initializedCurriculum)
    // Reset lesson flow state when new curriculum is set
    setActiveLessonId(null)
    setViewMode('idle')
  }, [])

  const completeLevel = useCallback((levelId: number) => {
    setCurriculumState((prev) => {
      if (!prev) return prev

      const updatedLevels = prev.levels.map((level, index, arr) => {
        if (level.id === levelId) {
          return {
            ...level,
            status: "completed" as const,
            progress: 100,
            xp: level.maxXp,
          }
        }
        // Activate next level
        if (arr[index - 1]?.id === levelId && level.status === "locked") {
          return { ...level, status: "active" as const }
        }
        return level
      })

      const newCurrentLevelId = updatedLevels.find(l => l.status === "active")?.id ?? levelId

      return {
        ...prev,
        levels: updatedLevels,
        currentLevelId: newCurrentLevelId,
        totalXp: updatedLevels.reduce((sum, l) => sum + l.xp, 0)
      }
    })

    // Clear quiz and reset view mode after completion
    setActiveQuiz(null)
    setActiveLessonId(null)
    setViewMode('idle')
  }, [])

  const resetCurriculum = useCallback(() => {
    setCurriculumState(null)
    setActiveQuiz(null)
    setActiveLessonId(null)
    setViewMode('idle')
  }, [])

  const getCurrentLevel = useCallback(() => {
    if (!curriculum) return null
    return curriculum.levels.find((level) => level.id === currentLevelId) ?? null
  }, [curriculum, currentLevelId])

  // Lesson flow management
  const startLesson = useCallback((levelId: number) => {
    if (!curriculum) return
    const level = curriculum.levels.find(l => l.id === levelId)
    if (!level || level.status === "locked") return

    setActiveLessonId(levelId)
    setViewMode('lesson')
    setActiveQuiz(null) // Clear any previous quiz state
  }, [curriculum])

  const switchToQuiz = useCallback(() => {
    if (activeLessonId === null || !curriculum) return
    
    const level = curriculum.levels.find(l => l.id === activeLessonId)
    if (!level || !level.quiz) return

    // Set up the quiz for the active lesson
    setActiveQuiz({
      levelId: activeLessonId,
      quiz: level.quiz,
      selectedAnswer: null,
      isCorrect: null,
      attempts: level.quizAttempts,
      showExplanation: false,
    })
    setViewMode('quiz')
  }, [activeLessonId, curriculum])

  const getActiveLesson = useCallback(() => {
    if (!curriculum || activeLessonId === null) return null
    return curriculum.levels.find((level) => level.id === activeLessonId) ?? null
  }, [curriculum, activeLessonId])

  // Quiz management
  const startQuiz = useCallback((levelId: number) => {
    if (!curriculum) return
    const level = curriculum.levels.find(l => l.id === levelId)
    if (!level || !level.quiz) return

    setActiveQuiz({
      levelId,
      quiz: level.quiz,
      selectedAnswer: null,
      isCorrect: null,
      attempts: level.quizAttempts,
      showExplanation: false,
    })
  }, [curriculum])

  const answerQuiz = useCallback((answerIndex: number): boolean => {
    if (!activeQuiz) return false

    const isCorrect = answerIndex === activeQuiz.quiz.correctAnswer

    setActiveQuiz(prev => prev ? {
      ...prev,
      selectedAnswer: answerIndex,
      isCorrect,
      attempts: prev.attempts + 1,
      showExplanation: true,
    } : null)

    return isCorrect
  }, [activeQuiz])

  const resetQuiz = useCallback(() => {
    setActiveQuiz(null)
  }, [])

  const incrementQuizAttempts = useCallback((levelId: number) => {
    setCurriculumState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        levels: prev.levels.map(level =>
          level.id === levelId
            ? { ...level, quizAttempts: level.quizAttempts + 1 }
            : level
        )
      }
    })
  }, [])

  // Document management functions
  const addDocument = useCallback((doc: UploadedDocument) => {
    setDocuments((prev) => [...prev, doc])
    setSelectedDocumentState(doc)
  }, [])

  const setSelectedDocument = useCallback((doc: UploadedDocument | null) => {
    setSelectedDocumentState(doc)
  }, [])

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    setSelectedDocumentState((prev) => (prev?.id === id ? null : prev))
  }, [])

  return (
    <CurriculumContext.Provider
      value={{
        curriculum,
        isGenerating,
        currentLevelId,
        totalXp,
        setCurriculum,
        setIsGenerating,
        completeLevel,
        resetCurriculum,
        getCurrentLevel,
        // Lesson flow state
        activeLessonId,
        viewMode,
        startLesson,
        switchToQuiz,
        getActiveLesson,
        // Quiz state
        activeQuiz,
        startQuiz,
        answerQuiz,
        resetQuiz,
        incrementQuizAttempts,
        // Document state
        documents,
        selectedDocument,
        addDocument,
        setSelectedDocument,
        removeDocument,
      }}
    >
      {children}
    </CurriculumContext.Provider>
  )
}

export function useCurriculum() {
  const context = useContext(CurriculumContext)
  if (!context) {
    throw new Error("useCurriculum must be used within a CurriculumProvider")
  }
  return context
}
