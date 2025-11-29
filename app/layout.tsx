import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'SiraQuest Admin',
  description: 'Админ-панель для управления вопросами викторины',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="font-sans text-gray-200 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-56 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

