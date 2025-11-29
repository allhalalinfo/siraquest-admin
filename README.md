# SiraQuest Admin Panel

Веб-админка для управления вопросами викторины SiraQuest.

## 🚀 Технологии

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL)
- **Lucide Icons**

## 📦 Установка

```bash
npm install
```

## 🔧 Настройка

Создайте файл `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏃 Запуск

```bash
# Development
npm run dev

# Production build
npm run build
npm run start
```

## 📁 Структура

```
siraquest-admin/
├── app/
│   ├── layout.tsx      # Основной layout
│   ├── page.tsx        # Dashboard
│   ├── questions/      # Страница вопросов
│   ├── topics/         # Страница тем
│   ├── levels/         # Страница уровней
│   └── sources/        # Страница источников
├── components/
│   ├── Sidebar.tsx     # Боковое меню
│   └── QuestionModal.tsx
├── lib/
│   └── supabase.ts     # Supabase client
└── package.json
```

## 🌐 Деплой на Vercel

1. Push код на GitHub
2. Импортируйте репозиторий в Vercel
3. Добавьте переменные окружения в Vercel Dashboard
4. Deploy!

## 🎨 Дизайн

Премиальный тёмный дизайн с:
- Glassmorphism эффектами
- Золотыми акцентами
- Бирюзовыми элементами

