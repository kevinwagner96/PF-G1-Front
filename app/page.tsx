'use client'

import Sidebar from '@/components/sidebar'
import CirugiasTable from '@/components/cirugias-table'

export default function Home() {

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            <CirugiasTable />
          </div>
        </main>
      </div>
    </div>
  )
}
