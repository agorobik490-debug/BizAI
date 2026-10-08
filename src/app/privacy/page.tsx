import Link from "next/link";

export default function PrivacyPage() {
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
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-600">
            Правовая информация
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Политика конфиденциальности
          </h1>

          <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
            Последнее обновление: 8 октября 2026 года
          </p>
        </div>

        <div className="mt-12 space-y-10 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              1. Общие положения
            </h2>

            <p className="mt-3">
              Настоящая Политика конфиденциальности описывает, какие
              персональные данные могут обрабатываться при использовании
              сервиса BizAI, для каких целей они используются и какие права
              имеют пользователи.
            </p>

            <p className="mt-3">
              Используя BizAI, пользователь подтверждает, что ознакомился с
              настоящей Политикой и понимает основные принципы обработки данных.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              2. Какие данные мы можем обрабатывать
            </h2>

            <p className="mt-3">
              В зависимости от используемых функций BizAI может обрабатывать:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>адрес электронной почты и данные, связанные с аккаунтом;</li>
              <li>
                данные, необходимые для авторизации и управления учётной
                записью;
              </li>
              <li>
                тексты, запросы, результаты генераций и другую информацию,
                которую пользователь отправляет в сервис;
              </li>
              <li>
                загруженные пользователем изображения, видео и другие медиа,
                когда соответствующая функция используется;
              </li>
              <li>
                техническую информацию, необходимую для работы и безопасности
                сервиса;
              </li>
              <li>
                обезличенную или статистическую информацию об использовании
                сервиса.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              3. Для чего используются данные
            </h2>

            <p className="mt-3">
              Данные могут использоваться для предоставления функций BizAI,
              обработки запросов к AI-моделям, сохранения истории работ,
              управления аккаунтом, обеспечения безопасности, диагностики
              ошибок и улучшения качества сервиса.
            </p>

            <p className="mt-3">
              Аналитические инструменты могут использоваться для понимания
              посещаемости, производительности и использования сайта.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              4. AI и сторонние сервисы
            </h2>

            <p className="mt-3">
              Для работы BizAI используются сторонние технологические сервисы,
              включая Supabase, OpenAI и инфраструктуру Vercel.
            </p>

            <p className="mt-3">
              В зависимости от используемой функции отдельные данные могут
              передаваться соответствующему поставщику для выполнения запроса,
              обеспечения хранения или работы технических функций сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              5. Локальное хранение
            </h2>

            <p className="mt-3">
              Некоторые настройки и данные интерфейса могут храниться локально
              в браузере пользователя, например настройки темы и отдельные
              параметры Brand Kit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              6. Безопасность
            </h2>

            <p className="mt-3">
              Мы принимаем разумные технические и организационные меры для
              защиты информации от несанкционированного доступа, изменения,
              раскрытия или уничтожения.
            </p>

            <p className="mt-3">
              При этом ни один способ передачи или хранения данных через
              интернет не может гарантировать абсолютную безопасность.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              7. Хранение данных
            </h2>

            <p className="mt-3">
              Данные хранятся столько, сколько необходимо для предоставления
              сервиса, выполнения соответствующих целей обработки, соблюдения
              применимых юридических обязанностей и защиты законных интересов.
            </p>

            <p className="mt-3">
              Конкретные сроки хранения отдельных категорий данных могут
              различаться в зависимости от типа информации и используемой
              функции.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              8. Права пользователя
            </h2>

            <p className="mt-3">
              В соответствии с применимым законодательством пользователь может
              иметь право на доступ к своим персональным данным, их исправление,
              удаление, ограничение обработки, возражение против определённых
              видов обработки и другие права, предусмотренные законом.
            </p>

            <p className="mt-3">
              Для реализации своих прав пользователь может обратиться в
              службу поддержки BizAI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              9. Дети
            </h2>

            <p className="mt-3">
              BizAI не предназначен специально для детей. Мы не стремимся
              сознательно собирать персональные данные детей без необходимых
              оснований и разрешений, предусмотренных законодательством.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              10. Изменения политики
            </h2>

            <p className="mt-3">
              Мы можем периодически обновлять настоящую Политику
              конфиденциальности. При существенных изменениях соответствующая
              информация может быть размещена на сайте.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              11. Контакты
            </h2>

            <p className="mt-3">
              По вопросам конфиденциальности и обработки персональных данных
              пользователь может обратиться в службу поддержки BizAI.
            </p>

            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              Эта страница является информационным шаблоном для сервиса BizAI.
              Перед публичным коммерческим запуском рекомендуется провести
              юридическую проверку политики с учётом фактической структуры
              бизнеса, используемых поставщиков и применимого законодательства.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
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
            href="/"
            className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
          >
            Вернуться в BizAI
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] py-7 dark:border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 text-xs text-zinc-400 sm:px-8">
          <span>© 2026 BizAI. Все права защищены.</span>
          <span>
            Политика конфиденциальности · Помощь · О нас
          </span>
        </div>
      </footer>
    </main>
  );
}