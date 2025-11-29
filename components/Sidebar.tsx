'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Library 
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Панель', icon: LayoutDashboard },
  { href: '/topics', label: 'Темы', icon: BookOpen },
  { href: '/levels', label: 'Уровни', icon: Layers },
  { href: '/questions', label: 'Вопросы', icon: HelpCircle },
  { href: '/sources', label: 'Источники', icon: Library },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold-500">☪</span>
          <span className="font-serif text-xl font-semibold text-white">SiraQuest</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-gray-500">Админ-панель v3.0</p>
      </div>
    </aside>
  )
}

