"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "motion/react"
import {
	UploadCloudIcon,
	FileTextIcon,
	TrashIcon,
	FileIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UploadedFile {
	id: string
	name: string
	size: number
	type: string
	file: File
}

export function DocumentTab() {
	const [files, setFiles] = useState<UploadedFile[]>([])

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			name: file.name,
			size: file.size,
			type: file.type,
			file,
		}))
		setFiles((prev) => [...prev, ...newFiles])
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"application/pdf": [".pdf"],
		},
	})

	const removeFile = (id: string) => {
		setFiles((prev) => prev.filter((file) => file.id !== id))
	}

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	return (
		<div className="flex h-full flex-col p-4">
			{/* Upload Area */}
			<div
				{...getRootProps()}
				className={cn(
					"mb-8 cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center transition-all duration-200",
					isDragActive
						? "border-primary bg-primary/5 scale-[1.01]"
						: "hover:border-primary/50 hover:bg-slate-50"
				)}
			>
				<input {...getInputProps()} />
				<motion.div
					animate={{ scale: isDragActive ? 1.05 : 1 }}
					className="flex flex-col items-center gap-4"
				>
					<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-colors group-hover:ring-primary/20">
						<UploadCloudIcon className="h-8 w-8 text-primary/80 transition-colors group-hover:text-primary" />
					</div>
					<div>
						<p className="text-lg font-semibold tracking-tight text-foreground">
							{isDragActive ? "Drop your PDF here" : "Upload Documents"}
						</p>
						<p className="text-sm text-slate-500 font-medium">
							PDF files up to 10MB
						</p>
					</div>
				</motion.div>
			</div>
			{/* File List */}
			<div className="flex-1 overflow-y-auto pr-2">
				{files.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground/60">
						<FileTextIcon className="mb-3 h-14 w-14 opacity-20" />
						<p className="font-semibold text-lg text-foreground/80">No documents yet</p>
						<p className="text-sm">Upload PDFs to get started</p>
					</div>
				) : (
					<div className="space-y-3">
						<AnimatePresence mode="popLayout">
							{files.map((file) => (
								<motion.div
									key={file.id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									layout
									className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
								>
									{/* PDF Thumbnail Placeholder */}
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 ring-1 ring-red-100">
										<FileIcon className="h-6 w-6 text-red-500" />
									</div>

									{/* File Info */}
									<div className="flex-1 overflow-hidden">
										<p className="truncate font-medium">{file.name}</p>
										<p className="text-xs text-muted-foreground">
											{formatFileSize(file.size)} • PDF
										</p>
									</div>

									{/* Delete Button */}
									<Button
										variant="ghost"
										size="icon"
										className="opacity-0 transition-opacity group-hover:opacity-100"
										onClick={() => removeFile(file.id)}
									>
										<TrashIcon className="h-4 w-4 text-destructive" />
									</Button>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				)}
			</div>

			{/* File Count */}
			{files.length > 0 && (
				<div className="mt-4 text-center text-sm text-muted-foreground">
					{files.length} document{files.length !== 1 && "s"} uploaded
				</div>
			)}
		</div>
	)
}
