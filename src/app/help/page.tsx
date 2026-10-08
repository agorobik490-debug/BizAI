import Link from "next/link";

const faqSections = [
  {
    title: "Общие вопросы",
    items: [
      {
        question: "Что такое BizAI?",
        answer:
          "BizAI — это AI-сервис для бизнеса, который помогает создавать тексты, рекламные материалы, изображения и другие виды контента с помощью искусственного интеллекта.",
      },
      {
        question: "Для кого подходит BizAI?",
        answer:
          "BizAI подходит предпринимателям, малому и среднему бизнесу, интернет-магазинам, маркетологам, SMM-специалистам и создателям контента.",
      },
      {
        question: "Нужно ли устанавливать программу?",
        answer:
          "Нет. BizAI работает онлайн в браузере. Достаточно открыть сайт и войти в свой аккаунт.",
      },
    ],
  },
  {
    title: "Генерация контента",
    items: [
      {
        question: "Что можно создавать в BizAI?",
        answer:
          "Сервис помогает создавать посты, рекламные тексты, описания товаров, идеи для контента и визуальные материалы.",
      },
      {
        question: "Можно ли менять стиль текста?",
        answer:
          "Да. Перед генерацией можно выбрать подходящий тон, например профессиональный, дружелюбный, продающий или краткий.",
      },
      {
        question: "Какие языки поддерживаются?",
        answer:
          "На текущем этапе интерфейс и генерация поддерживают русский, румынский и английский языки.",
      },
      {
        question: "Можно ли редактировать результат?",
        answer:
          "Да. Сгенерированный результат можно отредактировать перед сохранением или использованием.",
      },
    ],
  },
  {
    title: "Аккаунт",
    items: [
      {
        question: "Зачем нужен аккаунт?",
        answer:
          "Аккаунт позволяет сохранять историю работ, избранные материалы и данные пользователя между сессиями.",
      },
      {
        question: "Как зарегистрироваться?",
        answer:
          "Откройте меню аккаунта, выберите регистрацию, укажите email и пароль, затем подтвердите email, если это потребуется.",
      },
      {
        question: "Я забыл пароль. Что делать?",
        answer:
          "Воспользуйтесь восстановлением доступа через форму входа. Если возникнут проблемы, обратитесь в службу поддержки.",
      },
    ],
  },
  {
    title: "Лимиты и BizAI Pro",
    items: [
      {
        question: "Есть ли бесплатные генерации?",
        answer:
          "Да. Бесплатный тариф предоставляет ограниченное количество генераций. Точный лимит отображается непосредственно в интерфейсе BizAI.",
      },
      {
        question: "Что даёт BizAI Pro?",
        answer:
          "BizAI Pro рассчитан на пользователей, которым требуется больше генераций и расширенные возможности сервиса.",
      },
      {
        question: "Что делать, если бесплатные генерации закончились?",
        answer:
          "Вы можете дождаться доступного обновления лимита, если оно предусмотрено тарифом, либо перейти на BizAI Pro.",
      },
    ],
  },
  {
    title: "Изображения и файлы",
    items: [
      {
        question: "Можно ли создавать изображения?",
        answer:
          "Да. BizAI поддерживает AI-генерацию изображений для рекламных и бизнес-задач.",
      },
      {
        question: "Можно ли загружать свои изображения?",
        answer:
          "Да. В соответствующих инструментах можно использовать собственные изображения для работы с контентом.",
      },
      {
        question: "Почему загрузка файла может не работать?",
        answer:
          "Проверьте формат и размер файла. Также проблема может быть связана с временной ошибкой сети или сервера. Если ошибка повторяется, обратитесь в поддержку.",
      },
    ],
  },
  {
    title: "Ошибки и проблемы",
    items: [
      {
        question: "Генерация не запускается. Что делать?",
        answer:
          "Проверьте подключение к интернету, обновите страницу и убедитесь, что у вас есть доступные генерации. Если проблема сохраняется, обратитесь в поддержку.",
      },
      {
        question: "Результат генерации пропал. Можно ли его найти?",
        answer:
          "Если генерация была сохранена, проверьте раздел «Мои работы» или историю аккаунта.",
      },
      {
        question: "Я обнаружил ошибку в BizAI. Куда сообщить?",
        answer:
          "Сообщите о проблеме в службу поддержки. Желательно указать, что именно произошло, и приложить скриншот ошибки.",
      },
    ],
  },
];

export default function HelpPage() {
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
            Центр помощи
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Часто задаваемые вопросы
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
            Ответы на основные вопросы о BizAI, генерации контента,
            аккаунте, лимитах и работе сервиса.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {faqSections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-xl font-semibold">
                {section.title}
              </h2>

              <div className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
                {section.items.map((item, index) => (
                  <details
                    key={item.question}
                    className={`group ${
                      index !== section.items.length - 1
                        ? "border-b border-black/[0.06] dark:border-white/[0.07]"
                        : ""
                    }`}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-medium marker:hidden">
                      <span>{item.question}</span>

                      <span className="shrink-0 text-xl text-zinc-400 transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>

                    <div className="px-6 pb-5 pr-12 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-7 dark:border-purple-500/20 dark:from-purple-500/10 dark:to-fuchsia-500/5">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Не нашли ответ?
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Мы поможем разобраться
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            В дальнейшем здесь будет доступен AI-помощник BizAI, который
            сможет отвечать на вопросы пользователей и при необходимости
            передавать сложные обращения в службу поддержки.
          </p>

          <button
            type="button"
            className="mt-6 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
          >
            💬 Написать в поддержку
          </button>
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

            <span>Конфиденциальность</span>
            <span>Условия использования</span>
          </div>
        </div>
      </footer>
    </main>
  );
}