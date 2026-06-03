"use client"

import { Sidebar } from "@/components/sidebar"
import EmergenciasForm from "@/components/emergencias-form"

export default function EmergenciasPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <EmergenciasForm />
      </main>
    </div>
  )
}
