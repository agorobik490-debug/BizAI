"use client";

import Link from "next/link";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };
type SupportChatProps = {
  theme?: "light" | "dark";
  subscriptionPlan?: string;
};

const SUPPORT_EMAIL = "support.bizai@gmail.com";
const WELCOME_MESSAGE =
  "Привет! Я ИИ-помощник BizAI. Помогу с генерацией текста и изображений, тарифами, аккаунтом и Business Workspace. Не отправляй сюда пароли, API-ключи или данные банковской карты.";
const QUICK_QUESTIONS = [
  "Не работает генерация текста",
  "Не создаётся изображение",
  "Вопрос по тарифу или оплате",
  "Business Workspace и команда",
];

const SUPPORT_PATHS = new Set([
  "/contact",
  "/help",
  "/pricing",
  "/team",
  "/about",
  "/terms",
  "/privacy",
  "/referrals",
]);

// Safely render the small subset of Markdown commonly used in support replies.
// React nodes are used instead of dangerouslySetInnerHTML so reply text stays escaped.
function renderInlineSupportText(text: string, prefix = "support-text"): ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|support\.bizai@gmail\.com|\/(?:contact|help|pricing|team|about|terms|privacy|referrals))/g;
  const output: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      output.push(
        <Fragment key={`${prefix}-text-${tokenIndex++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }

    const token = match[0];
    let rendered: ReactNode;

    if (token.startsWith("**") && token.endsWith("**")) {
      const inner = token.slice(2, -2);
      let innerContent: ReactNode = inner;
      if (inner === SUPPORT_EMAIL) {
        innerContent = (
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline decoration-current/50 underline-offset-2 hover:decoration-current">
            {inner}
          </a>
        );
      } else if (SUPPORT_PATHS.has(inner)) {
        innerContent = (
          <Link href={inner} className="underline decoration-current/50 underline-offset-2 hover:decoration-current">
            {inner}
          </Link>
        );
      }
      rendered = <strong className="font-semibold">{innerContent}</strong>;
    } else if (token === SUPPORT_EMAIL) {
      rendered = (
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline decoration-current/50 underline-offset-2 hover:decoration-current">
          {token}
        </a>
      );
    } else {
      rendered = (
        <Link href={token} className="underline decoration-current/50 underline-offset-2 hover:decoration-current">
          {token}
        </Link>
      );
    }

    output.push(<Fragment key={`${prefix}-token-${tokenIndex++}`}>{rendered}</Fragment>);
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    output.push(<Fragment key={`${prefix}-text-${tokenIndex}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return output;
}

export default function SupportChat({
  theme = "dark",
  subscriptionPlan = "unknown",
}: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages, isSending]);

  const sendMessage = async (preset?: string) => {
    const content = (preset ?? input).trim();
    if (!content || isSending) return;
    if (content.length > 1200) {
      setMessages((current): ChatMessage[] => [
        ...current,
        { role: "assistant", content: "Сообщение слишком длинное. Сократи его до 1200 символов и отправь ещё раз." },
      ]);
      return;
    }

    const userMessage: ChatMessage = { role: "user", content };
    const nextMessages: ChatMessage[] = [...messages, userMessage].slice(-12);
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, plan: subscriptionPlan }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Сейчас не удалось получить ответ.");
      }
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("Помощник не вернул ответ. Попробуй ещё раз или напиши в поддержку.");
      }
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((current) => [...current, assistantMessage].slice(-14));
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          error instanceof Error && error.message
            ? `${error.message}\n\nМожно обратиться напрямую: ${SUPPORT_EMAIL}`
            : `Не удалось связаться с ИИ-поддержкой. Напиши нам: ${SUPPORT_EMAIL}`,
      };
      setMessages((current) => [...current, errorMessage].slice(-14));
    } finally {
      setIsSending(false);
    }
  };

  const panel = isDark
    ? "border-white/10 bg-[#101014] text-white shadow-[0_24px_80px_rgba(0,0,0,.55)]"
    : "border-black/10 bg-white text-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,.20)]";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const field = isDark
    ? "border-white/10 bg-white/[0.04] text-white placeholder:text-zinc-500 focus:border-purple-400"
    : "border-black/10 bg-zinc-50 text-zinc-950 placeholder:text-zinc-400 focus:border-purple-500";

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          aria-label="ИИ-поддержка BizAI"
          className={`flex h-[min(690px,calc(100dvh-112px))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[26px] border backdrop-blur-2xl ${panel}`}
        >
          <header className="flex items-center gap-3 border-b border-white/[0.08] bg-gradient-to-r from-purple-600/15 to-fuchsia-500/10 p-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20">
              <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold tracking-tight">Поддержка BizAI</h2>
              <p className={`mt-0.5 text-xs ${muted}`}>ИИ-помощник · отвечает онлайн</p>
            </div>
            <button type="button" aria-label="Закрыть чат" onClick={() => setIsOpen(false)} className={`grid h-9 w-9 place-items-center rounded-xl transition ${isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.05]"}`}>
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
            </button>
          </header>

          <div className={`border-b p-3 ${isDark ? "border-white/[0.07]" : "border-black/[0.06]"}`}>
            <div className="flex flex-wrap gap-2">
              <Link href="/help" onClick={() => setIsOpen(false)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${isDark ? "border-white/10 hover:border-purple-400/40 hover:bg-purple-500/10" : "border-black/10 hover:border-purple-300 hover:bg-purple-50"}`}>Частые вопросы</Link>
              <Link href="/contact" onClick={() => setIsOpen(false)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${isDark ? "border-white/10 hover:border-purple-400/40 hover:bg-purple-500/10" : "border-black/10 hover:border-purple-300 hover:bg-purple-50"}`}>Контакты</Link>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${isDark ? "border-white/10 hover:border-purple-400/40 hover:bg-purple-500/10" : "border-black/10 hover:border-purple-300 hover:bg-purple-50"}`}>Написать человеку</a>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 sm:p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-[13px] leading-5 ${message.role === "user" ? "rounded-br-md bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white" : isDark ? "rounded-bl-md border border-white/[0.07] bg-white/[0.045] text-zinc-100" : "rounded-bl-md border border-black/[0.06] bg-zinc-50 text-zinc-800"}`}>
                  {message.role === "assistant"
                    ? renderInlineSupportText(message.content, `message-${index}`)
                    : message.content}
                </div>
              </div>
            ))}
            {messages.length === 1 && !isSending && (
              <div className="pt-1">
                <p className={`mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${muted}`}>Популярные вопросы</p>
                <div className="flex flex-col items-start gap-2">
                  {QUICK_QUESTIONS.map((question) => (
                    <button key={question} type="button" onClick={() => void sendMessage(question)} className={`max-w-full rounded-xl border px-3 py-2 text-left text-xs transition ${isDark ? "border-purple-400/20 bg-purple-500/[0.07] text-purple-100 hover:border-purple-400/50 hover:bg-purple-500/[0.13]" : "border-purple-200 bg-purple-50 text-purple-900 hover:border-purple-300 hover:bg-purple-100"}`}>
                      {question} <span className="ml-1 opacity-60">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isSending && (
              <div className="flex justify-start"><div className={`rounded-2xl rounded-bl-md px-3.5 py-3 text-xs ${isDark ? "bg-white/[0.05] text-zinc-400" : "bg-zinc-50 text-zinc-500"}`}>Думаю над ответом…</div></div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className={`border-t p-3 ${isDark ? "border-white/[0.08]" : "border-black/[0.07]"}`}>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={2}
                maxLength={1200}
                placeholder="Напиши свой вопрос…"
                aria-label="Сообщение в поддержку"
                className={`max-h-28 min-h-[50px] flex-1 resize-y rounded-xl border px-3 py-2.5 text-sm outline-none transition ${field}`}
              />
              <button type="submit" disabled={!input.trim() || isSending} aria-label="Отправить сообщение" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z"/><path d="M10.3 13.7 21 3"/></svg>
              </button>
            </div>
            <p className={`mt-2 px-1 text-[10px] ${muted}`}>Не отправляй пароли, API-ключи или данные карты.</p>
          </form>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen((value) => !value)} aria-label={isOpen ? "Закрыть поддержку" : "Открыть ИИ-поддержку"} aria-expanded={isOpen} className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3.5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(124,58,237,.38)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(124,58,237,.45)] sm:px-5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">
          {isOpen ? <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg> : <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.6-3.2A7.5 7.5 0 1 1 20 11.5Z"/><path d="M9 11h.01M12.5 11h.01M16 11h.01"/></svg>}
        </span>
        <span>{isOpen ? "Закрыть чат" : "ИИ-поддержка"}</span>
        {!isOpen && <span className="ml-0.5 rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold">AI</span>}
      </button>
    </div>
  );
}
