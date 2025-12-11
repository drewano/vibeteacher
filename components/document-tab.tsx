"use client"

import dynamic from "next/dynamic"
import { useState, useCallback, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "motion/react"
import {
  UploadCloudIcon,
  FileTextIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCurriculum, UploadedDocument } from "@/lib/curriculum-context"

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
)
const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
)

export function DocumentTab() {
  // Use context for persistent state
  const {
    documents,
    selectedDocument,
    addDocument,
    setSelectedDocument,
    setCurriculum,
    setIsGenerating,
  } = useCurriculum()

  // Local UI state (doesn't need to persist)
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isGeneratingCurriculum, setIsGeneratingCurriculum] = useState(false)
  const [pdfReady, setPdfReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(400)

  // Set up PDF.js worker on client side only
  useEffect(() => {
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`
      setPdfReady(true)
    })
  }, [])

  // Measure container width for PDF sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 32)
      }
    }
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [selectedDocument])

  // Reset page when document changes
  useEffect(() => {
    if (selectedDocument) {
      setCurrentPage(1)
      setIsLoading(true)
      setPdfError(null)
    }
  }, [selectedDocument?.id])

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const { pdfjs } = await import("react-pdf")
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
    let fullText = ""

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: unknown) => (item as { str: string }).str)
        .join(" ")
      fullText += pageText + "\n\n"
    }

    return fullText
  }

  const generateCurriculum = async (doc: UploadedDocument) => {
    setIsGeneratingCurriculum(true)
    setIsGenerating(true)

    try {
      const pdfText = await extractTextFromPdf(doc.file)

      const response = await fetch("/api/generate-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfText,
          documentName: doc.name,
          documentId: doc.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to generate curriculum")
      }

      const curriculum = await response.json()
      setCurriculum(curriculum)
    } catch (error) {
      console.error("Error generating curriculum:", error)
      setPdfError(
        error instanceof Error ? error.message : "Failed to generate curriculum"
      )
    } finally {
      setIsGeneratingCurriculum(false)
      setIsGenerating(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const newDoc: UploadedDocument = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }
      addDocument(newDoc)
    })
  }, [addDocument])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  })

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    setPdfError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error)
    setIsLoading(false)
    setPdfError("Failed to load PDF. Please try another file.")
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages))
  }

  const closePdfViewer = () => {
    setSelectedDocument(null)
    setNumPages(0)
    setCurrentPage(1)
    setPdfError(null)
  }

  // If a PDF is selected, show the viewer
  if (selectedDocument) {
    return (
      <div ref={containerRef} className="flex h-full flex-col">
        {/* PDF Viewer Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={closePdfViewer}>
              <XIcon className="h-4 w-4" />
            </Button>
            <div className="overflow-hidden">
              <p className="truncate font-medium text-sm">{selectedDocument.name}</p>
              {numPages > 0 && (
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {numPages}
                </p>
              )}
            </div>
          </div>

          {/* Generate Curriculum Button */}
          <Button
            onClick={() => generateCurriculum(selectedDocument)}
            disabled={isGeneratingCurriculum || isLoading}
            size="sm"
            className="gap-2"
          >
            {isGeneratingCurriculum ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                Generate XP
              </>
            )}
          </Button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          {pdfError ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-destructive">{pdfError}</p>
                <Button variant="outline" className="mt-4" onClick={closePdfViewer}>
                  Go Back
                </Button>
              </div>
            </div>
          ) : !pdfReady ? (
            <div className="flex items-center justify-center py-20">
              <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex justify-center">
              {isLoading && (
                <div className="flex items-center gap-2 py-20">
                  <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-muted-foreground">Loading PDF...</span>
                </div>
              )}
              <Document
                file={selectedDocument.file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                className="flex flex-col items-center gap-4"
              >
                <Page
                  pageNumber={currentPage}
                  width={Math.min(containerWidth, 600)}
                  className="shadow-lg rounded-lg overflow-hidden"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          )}
        </div>

        {/* Page Navigation */}
        {numPages > 1 && !pdfError && (
          <div className="flex items-center justify-center gap-4 border-t border-border/50 px-4 py-3">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              Page {currentPage} / {numPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Default: Upload area
  return (
    <div className="flex h-full flex-col p-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "flex-1 cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-all duration-200 flex flex-col items-center justify-center",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
            {isDragActive ? (
              <FileTextIcon className="h-10 w-10 text-primary" />
            ) : (
              <UploadCloudIcon className="h-10 w-10 text-primary/80" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {isDragActive ? "Drop your PDF here" : "Upload a Document"}
            </p>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Drop a PDF to view and generate a learning path
            </p>
          </div>
        </motion.div>
      </div>

      {/* Recent Files */}
      {documents.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Recent Documents
          </p>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {documents.slice(-3).map((doc) => (
                <motion.button
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setSelectedDocument(doc)}
                  className="w-full flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-red-100 dark:bg-red-900/30">
                    <FileTextIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
