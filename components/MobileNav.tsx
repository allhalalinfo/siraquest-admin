'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isQuestions = pathname.startsWith('/questions')

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-items">
        <Link
          href="/"
          className={`mobile-nav-item ${isHome ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon">◇</span>
          <span>Панель</span>
        </Link>
        <Link
          href="/questions"
          className={`mobile-nav-item ${isQuestions ? 'active' : ''}`}
        >
          <span className="mobile-nav-icon">☰</span>
          <span>Вопросы</span>
        </Link>
      </div>
    </nav>
  )
}

