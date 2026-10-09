"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

const SUPPORT_EMAIL = "support.bizai@gmail.com";

const topics = [
  "Техническая проблема",
  "Вход или аккаунт",
  "Генерация текста или изображения",
  "Тарифы и оплата",
  "Business Workspace и команда",
  "Партнёрская программа",
  "Другое",
];

export default function ContactPage() {
  const [topic, setTopic] = useState(topics[0]);
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const mailSubject = subject.trim() || `Обращение BizAI: ${topic}`;
    const body = [
      `Тема: ${topic}`,
      `Email для ответа: ${senderEmail.trim()}`,
      "",
      message.trim(),
      "",
      "Отправлено через форму контактов BizAI.",
    ].join("\n");

    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-zinc-950 dark:bg-[#09090b] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/85 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#0b0b0dcc]">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white">
              B
            </span>
            <span className="text-lg">BizAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/help" className="hidden rounded-xl px-3 py-2 text-sm text-zinc-500 transition hover:text-purple-600 sm:inline-flex dark:text-zinc-400">
              Частые вопросы
            </Link>
            <Link href="/pricing" className="hidden rounded-xl px-3 py-2 text-sm text-zinc-500 transition hover:text-purple-600 sm:inline-flex dark:text-zinc-400">
              Тарифы
            </Link>
            <Link href="/" className="rounded-xl border border-black/[0.08] px-4 py-2 text-sm font-medium transition hover:bg-black/[0.04] dark:border-white/[0.1] dark:hover:bg-white/[0.05]">
              ← В BizAI
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-600 dark:text-purple-300">
            Поддержка BizAI
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
            Чем мы можем помочь?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-base">
            Напиши нам о проблеме или вопросе по BizAI. Выбери тему и опиши ситуацию — так нам будет проще разобраться.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-5xl gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="space-y-4">
            <div className="rounded-[26px] border border-purple-500/20 bg-gradient-to-br from-purple-600/[0.09] to-fuchsia-500/[0.04] p-6 sm:p-7">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-xl text-white shadow-lg shadow-purple-500/20">
                ✉
              </div>
              <h2 className="mt-5 text-xl font-bold">Напиши в поддержку</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Для вопросов об аккаунте, генерациях, тарифах, Business Workspace и партнёрской программе.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-5 inline-flex max-w-full items-center gap-2 break-all rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                {SUPPORT_EMAIL}
                <span aria-hidden="true">↗</span>
              </a>
              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Нажатие откроет почтовое приложение для создания письма.
              </p>
            </div>

            <div className="rounded-[26px] border border-black/[0.06] bg-white p-6 dark:border-white/[0.07] dark:bg-[#101014]">
              <h2 className="font-bold">Быстрые ссылки</h2>
              <div className="mt-4 space-y-2">
                <Link href="/help" className="flex items-center justify-between rounded-xl border border-black/[0.06] px-4 py-3 text-sm transition hover:border-purple-500/30 hover:bg-purple-500/[0.04] dark:border-white/[0.07]">
                  <span>Частые вопросы</span><span className="text-purple-600">→</span>
                </Link>
                <Link href="/pricing" className="flex items-center justify-between rounded-xl border border-black/[0.06] px-4 py-3 text-sm transition hover:border-purple-500/30 hover:bg-purple-500/[0.04] dark:border-white/[0.07]">
                  <span>Тарифы BizAI</span><span className="text-purple-600">→</span>
                </Link>
                <Link href="/referrals" className="flex items-center justify-between rounded-xl border border-black/[0.06] px-4 py-3 text-sm transition hover:border-purple-500/30 hover:bg-purple-500/[0.04] dark:border-white/[0.07]">
                  <span>Партнёрская программа</span><span className="text-purple-600">→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] px-5 py-4 dark:border-white/[0.07]">
              <p className="text-sm font-semibold">Совет для технических проблем</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Укажи, что именно нажимал, что ожидал увидеть и какой текст ошибки появился. Не отправляй пароль или API-ключи.
              </p>
            </div>
          </aside>

          <section className="rounded-[26px] border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-[#101014] sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-600 dark:text-purple-300">Форма обращения</p>
              <h2 className="mt-2 text-2xl font-bold">Расскажи, что случилось</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Заполни поля — BizAI подготовит письмо с деталями обращения.
              </p>
            </div>

            <form onSubmit={submitRequest} className="mt-7 space-y-5">
              <div>
                <label htmlFor="contact-topic" className="text-sm font-semibold">Тема обращения</label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-black/[0.09] bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500 dark:border-white/[0.1] dark:bg-[#0b0b0e]"
                >
                  {topics.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="contact-email" className="text-sm font-semibold">Твой email для ответа</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={senderEmail}
                  onChange={(event) => setSenderEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-black/[0.09] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-purple-500 dark:border-white/[0.1] dark:bg-[#0b0b0e]"
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="text-sm font-semibold">Короткий заголовок <span className="font-normal text-zinc-400">(необязательно)</span></label>
                <input
                  id="contact-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={120}
                  placeholder="Например: Не создаётся изображение"
                  className="mt-2 w-full rounded-xl border border-black/[0.09] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-purple-500 dark:border-white/[0.1] dark:bg-[#0b0b0e]"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="text-sm font-semibold">Описание</label>
                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Опиши проблему или задай вопрос..."
                  className="mt-2 w-full resize-y rounded-xl border border-black/[0.09] bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-zinc-400 focus:border-purple-500 dark:border-white/[0.1] dark:bg-[#0b0b0e]"
                />
                <p className="mt-2 text-right text-xs text-zinc-400">{message.length}/5000</p>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/15 transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Подготовить письмо <span aria-hidden="true">↗</span>
              </button>
              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Форма не отправляет данные в BizAI автоматически: она откроет почтовое приложение с готовым письмом. Проверь его и нажми «Отправить».
              </p>
            </form>
          </section>
        </div>

        <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-black/[0.06] px-5 py-4 text-center dark:border-white/[0.07]">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Отправляя обращение, не добавляй пароли, API-ключи, платёжные данные или другую секретную информацию. Подробнее — в <Link href="/privacy" className="font-semibold text-purple-600 hover:underline">политике конфиденциальности</Link>.
          </p>
        </div>
      </section>

      <footer className="border-t border-black/[0.06] dark:border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-5 py-7 text-xs text-zinc-400 sm:px-8">
          <Link href="/" className="hover:text-purple-600">BizAI</Link>
          <Link href="/about" className="hover:text-purple-600">О нас</Link>
          <Link href="/help" className="hover:text-purple-600">Помощь</Link>
          <Link href="/privacy" className="hover:text-purple-600">Конфиденциальность</Link>
          <Link href="/terms" className="hover:text-purple-600">Условия использования</Link>
        </div>
      </footer>
    </main>
  );
}
