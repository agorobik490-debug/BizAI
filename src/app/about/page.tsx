import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7f7fb] text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl dark:border-white/[0.07] dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white">
              B
            </span>
            BizAI
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            ← На главную
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-600">
            О BizAI
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            AI-инструменты для бизнеса
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400 sm:text-lg">
            BizAI — это онлайн-сервис, который помогает бизнесу быстрее
            создавать контент с помощью искусственного интеллекта.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Наша идея</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Мы хотим сделать AI доступным и понятным для предпринимателей,
              маркетологов и небольших компаний — без сложных инструментов и
              долгой подготовки.
            </p>
          </div>

          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Что делает BizAI</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              BizAI помогает создавать рекламные тексты, посты, описания
              товаров, идеи для контента и визуальные материалы.
            </p>
          </div>

          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Для кого</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Для малого бизнеса, предпринимателей, интернет-магазинов,
              маркетологов, создателей контента и всех, кому нужно быстро
              подготовить качественный материал.
            </p>
          </div>

          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <h2 className="text-xl font-semibold">Наш подход</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Мы развиваем BizAI как практичный рабочий инструмент: простой
              интерфейс, быстрый результат и функции, которые действительно
              помогают экономить время.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-7 dark:border-purple-500/20 dark:from-purple-500/10 dark:to-fuchsia-500/5">
          <h2 className="text-2xl font-semibold">Наша цель</h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Создать универсальное AI-пространство для бизнеса, где можно
            создавать контент, управлять своими материалами и развивать бренд
            в одном месте.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
          >
            Попробовать BizAI →
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] py-7 dark:border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 text-xs text-zinc-400 sm:px-8">
          <span>© 2026 BizAI. Все права защищены.</span>
          <span>Создано с помощью искусственного интеллекта.</span>
        </div>
      </footer>
    </main>
  );
}