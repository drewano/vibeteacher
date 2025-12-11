"use client"

import { useState } from "react"
import { FileTextIcon, ActivityIcon } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentTab } from "@/components/document-tab"
import { ActivitiesTab } from "@/components/activities-tab"
import { LearningProgress } from "@/components/learning-progress"

export function Workspace() {
  const [activeTab, setActiveTab] = useState("documents")

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-4">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">
          Manage your documents and activities
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full flex-col"
        >
          <div className="border-b border-border/50 px-4">
            <TabsList className="h-12 w-full justify-start gap-2 bg-transparent p-0">
              <TabsTrigger
                value="documents"
                className="flex items-center gap-2 data-[state=active]:bg-muted"
              >
                <FileTextIcon className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="flex items-center gap-2 data-[state=active]:bg-muted"
              >
                <ActivityIcon className="h-4 w-4" />
                Activities
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="documents" className="m-0 h-full">
              <DocumentTab />
            </TabsContent>
            <TabsContent value="activities" className="m-0 h-full">
              <ActivitiesTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Learning Progress */}
      <LearningProgress />
    </div>
  )
}
