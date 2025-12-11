"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { PanelRightOpenIcon, PanelRightCloseIcon } from "lucide-react"

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

export default function Home() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Panel - Voice Interface (60% on desktop, full on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full lg:w-[60%]"
      >
        <VoiceInterface />

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
              <Workspace />
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
        <Workspace />
      </motion.div>
    </div>
  )
}
