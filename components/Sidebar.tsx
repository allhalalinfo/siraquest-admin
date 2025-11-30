'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Панель', section: 'dashboard' },
  { href: '/questions', label: 'Вопросы', section: 'questions' },
  { href: '/trash', label: 'Корзина', section: 'trash' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-icon">☪</span>
        <span className="logo-text">SiraQuest</span>
      </div>

      <nav className="nav">
        {navItems.map((item) => {
          const isActive = item.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              data-section={item.section}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <span>Админ-панель v2.4</span>
      </div>
    </aside>
  )
}
