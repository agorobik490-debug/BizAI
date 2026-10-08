import Link from "next/link";

export default function ContactPage() {
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

      <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-600">
            Контакты
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Мы на связи
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
            Есть вопрос по BizAI, проблема с генерацией или предложение по
            развитию сервиса? Мы постараемся помочь.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-xl dark:bg-purple-500/10">
              💬
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Техническая поддержка
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Помощь с аккаунтом, генерацией текста и изображений, историей,
              лимитами и другими функциями BizAI.
            </p>

            <Link
              href="/help"
              className="mt-5 inline-flex rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
            >
              Перейти в центр помощи →
            </Link>
          </div>

          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-100 text-xl dark:bg-purple-500/10">
              💡
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Предложения и идеи
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Мы развиваем BizAI и учитываем обратную связь пользователей при
              добавлении новых возможностей.
            </p>

            <Link
              href="/help"
              className="mt-5 inline-flex rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              Получить помощь →
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-7 dark:border-purple-500/20 dark:from-purple-500/10 dark:to-fuchsia-500/5 sm:p-8">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            Скоро в BizAI
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            AI-помощник поддержки
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Мы добавим встроенный AI-чат, который сможет отвечать на вопросы о
            функциях BizAI, помогать с возникшими проблемами и направлять
            сложные обращения в техническую поддержку.
          </p>

          <Link
            href="/help"
            className="mt-6 inline-flex rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
          >
            Открыть помощь →
          </Link>
        </div>

        <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
          <h2 className="text-xl font-semibold">
            Вопросы по конфиденциальности
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Информация об обработке персональных данных и правах пользователей
            размещена в нашей Политике конфиденциальности.
          </p>

          <Link
            href="/privacy"
            className="mt-5 inline-flex rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Политика конфиденциальности →
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/about"
            className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            О нас
          </Link>

          <Link
            href="/help"
            className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Помощь
          </Link>

          <Link
            href="/terms"
            className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Условия использования
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] py-7 dark:border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 text-xs text-zinc-400 sm:px-8">
          <span>© 2026 BizAI. Все права защищены.</span>

          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-purple-600">
              О нас
            </Link>

            <Link href="/help" className="hover:text-purple-600">
              Помощь
            </Link>

            <Link href="/privacy" className="hover:text-purple-600">
              Конфиденциальность
            </Link>

            <Link href="/terms" className="hover:text-purple-600">
              Условия использования
            </Link>

            <Link href="/contact" className="hover:text-purple-600">
              Контакты
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}