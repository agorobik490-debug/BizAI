import Link from "next/link";

export default function TermsPage() {
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
            Условия использования
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
              Настоящие Условия использования регулируют доступ пользователя к
              сервису BizAI и порядок использования его функций.
            </p>

            <p className="mt-3">
              Используя BizAI, пользователь подтверждает, что ознакомился с
              настоящими Условиями и обязуется соблюдать их.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              2. О сервисе BizAI
            </h2>

            <p className="mt-3">
              BizAI — онлайн-сервис с функциями искусственного интеллекта,
              предназначенный для помощи в создании бизнес-контента.
            </p>

            <p className="mt-3">
              В зависимости от доступного тарифа сервис может предоставлять
              функции генерации текстов, изображений, анализа медиа и другие
              инструменты.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              3. Регистрация и аккаунт
            </h2>

            <p className="mt-3">
              Для использования некоторых функций может потребоваться создание
              аккаунта.
            </p>

            <p className="mt-3">
              Пользователь обязан предоставлять достоверную информацию,
              необходимую для регистрации, и самостоятельно обеспечивать
              безопасность данных для входа в аккаунт.
            </p>

            <p className="mt-3">
              Пользователь несёт ответственность за действия, совершённые через
              его аккаунт, если иное не предусмотрено применимым
              законодательством.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              4. Использование искусственного интеллекта
            </h2>

            <p className="mt-3">
              Результаты, созданные с помощью AI, могут содержать неточности,
              ошибки или информацию, требующую дополнительной проверки.
            </p>

            <p className="mt-3">
              Пользователь самостоятельно оценивает результаты генерации перед
              их публикацией, использованием в рекламе, деловой переписке или
              принятии важных решений.
            </p>

            <p className="mt-3">
              BizAI не гарантирует, что любой автоматически созданный материал
              будет полностью соответствовать конкретным требованиям бизнеса,
              законодательства, рекламных площадок или третьих лиц.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              5. Пользовательский контент
            </h2>

            <p className="mt-3">
              Пользователь самостоятельно отвечает за текст, изображения,
              видео, документы и другие материалы, которые он загружает или
              передаёт в BizAI.
            </p>

            <p className="mt-3">
              Пользователь должен иметь необходимые права и разрешения на
              использование загружаемых материалов и не должен передавать
              содержимое, распространение которого запрещено законом или
              нарушает права третьих лиц.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              6. Запрещённое использование
            </h2>

            <p className="mt-3">
              Запрещается использовать BizAI для незаконных действий, нарушения
              прав третьих лиц, распространения вредоносного содержимого,
              обхода технических ограничений сервиса, атак на инфраструктуру и
              автоматизированного злоупотребления ресурсами сервиса.
            </p>

            <p className="mt-3">
              Также запрещается предпринимать попытки получить
              несанкционированный доступ к аккаунтам, данным, API или внутренним
              системам BizAI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              7. Бесплатный доступ и лимиты
            </h2>

            <p className="mt-3">
              BizAI может предоставлять бесплатный доступ с ограниченным
              количеством генераций или другими ограничениями.
            </p>

            <p className="mt-3">
              Лимиты могут изменяться в зависимости от текущих правил сервиса,
              выбранного тарифа и технических условий.
            </p>

            <p className="mt-3">
              Пользователь не должен обходить ограничения с использованием
              дополнительных аккаунтов, автоматизации, подмены технических
              идентификаторов или других способов.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              8. BizAI Pro
            </h2>

            <p className="mt-3">
              Некоторые функции BizAI могут предоставляться только пользователям
              платного тарифа BizAI Pro.
            </p>

            <p className="mt-3">
              Условия оплаты, стоимость, период подписки, порядок продления,
              отмены и возможного возврата средств будут определяться
              соответствующими условиями тарифа, опубликованными на сайте.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              9. Интеллектуальная собственность
            </h2>

            <p className="mt-3">
              Название BizAI, фирменное оформление, программный код, логотипы,
              элементы интерфейса и другие материалы сервиса могут быть
              защищены правами интеллектуальной собственности.
            </p>

            <p className="mt-3">
              Пользователь не получает право копировать, продавать,
              распространять или изменять внутренние компоненты сервиса без
              соответствующего разрешения.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              10. Доступность сервиса
            </h2>

            <p className="mt-3">
              Мы стремимся поддерживать стабильную работу BizAI, однако сервис
              может временно становиться недоступным из-за технического
              обслуживания, сбоев инфраструктуры, сторонних сервисов, сетевых
              проблем или других обстоятельств.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              11. Ограничение ответственности
            </h2>

            <p className="mt-3">
              BizAI предоставляется как технологический инструмент для помощи
              пользователю. Пользователь самостоятельно принимает решения на
              основе полученных результатов и проверяет их перед использованием.
            </p>

            <p className="mt-3">
              Настоящий раздел применяется в пределах, разрешённых применимым
              законодательством, и не ограничивает права пользователя, которые
              не могут быть ограничены законом.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              12. Приостановление доступа
            </h2>

            <p className="mt-3">
              При нарушении настоящих Условий, попытках злоупотребления сервисом
              или угрозе безопасности BizAI может временно ограничить или
              прекратить доступ к определённым функциям или аккаунту в пределах,
              разрешённых законом.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              13. Изменение условий
            </h2>

            <p className="mt-3">
              Условия могут периодически обновляться в связи с развитием
              сервиса, изменением функций, тарифов или применимого
              законодательства.
            </p>

            <p className="mt-3">
              Новая версия условий публикуется на сайте с указанием даты
              последнего обновления.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              14. Применимое законодательство
            </h2>

            <p className="mt-3">
              Использование BizAI регулируется применимым законодательством
              Республики Молдова и иными обязательными нормами, применимыми к
              конкретным отношениям пользователя и сервиса.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              15. Контакты
            </h2>

            <p className="mt-3">
              По вопросам использования сервиса, аккаунта или работы отдельных
              функций пользователь может обратиться в службу поддержки BizAI.
            </p>

            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              Эта версия является рабочим текстом для текущего этапа разработки.
              Перед запуском платных услуг рекомендуется юридическая проверка и
              адаптация условий под фактическую модель BizAI, тарифы,
              механизм оплаты, возвраты и деятельность владельца сервиса.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-semibold transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Конфиденциальность
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
          </div>
        </div>
      </footer>
    </main>
  );
}