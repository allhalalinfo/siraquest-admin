import './globals.css'
import type { Metadata, Viewport } from 'next'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export const metadata: Metadata = {
  title: 'SiraQuest — Админ-панель',
  description: 'Управление вопросами викторины SiraQuest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <div className="app">
          <Sidebar />
          <main className="main">
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  )
}
