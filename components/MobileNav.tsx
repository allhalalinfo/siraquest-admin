'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isQuestions = pathname.startsWith('/questions')

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-pill">
        <Link
          href="/"
          className={`mobile-nav-tab ${isHome ? 'active' : ''}`}
        >
          Панель
        </Link>
        <Link
          href="/questions"
          className={`mobile-nav-tab ${isQuestions ? 'active' : ''}`}
        >
          Вопросы
        </Link>
      </div>
    </nav>
  )
}

