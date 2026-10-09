"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

type PlanKey = "free" | "pro" | "business";
type PeriodMonths = 1 | 3 | 6 | 12;
type PeriodOption = { months: PeriodMonths; label: string; discount: number; badge?: string };
type SavedChoice = { plan: Exclude<PlanKey, "free">; months: PeriodMonths; total: number; monthlyEquivalent: number; discount: number; savedAt: string };

const periods: PeriodOption[] = [
  { months: 1, label: "1 месяц", discount: 0 },
  { months: 3, label: "3 месяца", discount: 10, badge: "−10%" },
  { months: 6, label: "6 месяцев", discount: 15, badge: "−15%" },
  { months: 12, label: "12 месяцев", discount: 20, badge: "−20%" },
];

const PRO_MONTHLY = 7.99;
const BUSINESS_MONTHLY = 24.99;

function formatUSD(value: number) {
  return `$${value.toFixed(2)}`;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function totalPrice(monthly: number, period: PeriodOption) {
  return roundMoney(monthly * period.months * (1 - period.discount / 100));
}

function planTitle(plan: PlanKey) {
  return plan === "business" ? "BizAI Business" : plan === "pro" ? "BizAI Pro" : "Free";
}

function actualActivePlan(plan: string | undefined, status: string | undefined, expiresAt: string | null | undefined): PlanKey {
  if (!plan || status !== "active") return "free";
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return "free";
  return plan === "pro" || plan === "business" ? plan : "free";
}

export default function PricingPage() {
  const [selectedMonths, setSelectedMonths] = useState<PeriodMonths>(1);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [currentPlanStatus, setCurrentPlanStatus] = useState("active");
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasBusinessTeam, setHasBusinessTeam] = useState(false);
  const [savedChoice, setSavedChoice] = useState<SavedChoice | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const selectedPeriod = periods.find((item) => item.months === selectedMonths) ?? periods[0];

  const proTotal = useMemo(() => totalPrice(PRO_MONTHLY, selectedPeriod), [selectedPeriod]);
  const businessTotal = useMemo(() => totalPrice(BUSINESS_MONTHLY, selectedPeriod), [selectedPeriod]);
  const proRegularTotal = roundMoney(PRO_MONTHLY * selectedMonths);
  const businessRegularTotal = roundMoney(BUSINESS_MONTHLY * selectedMonths);

  useEffect(() => {
    let cancelled = false;
    const loadAccount = async () => {
      setLoadingAccount(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setUserEmail(user?.email ?? null);
        if (user) {
          const { data: subscription } = await supabase.from("subscriptions").select("plan,status,expires_at").eq("user_id", user.id).maybeSingle();
          if (cancelled) return;
          setCurrentPlanStatus(subscription?.status ?? "active");
          setCurrentExpiresAt(subscription?.expires_at ?? null);
          setCurrentPlan(actualActivePlan(subscription?.plan, subscription?.status, subscription?.expires_at ?? null));
          const { data: membership } = await supabase.from("business_team_members").select("team_id").eq("user_id", user.id).maybeSingle();
          if (!cancelled) setHasBusinessTeam(Boolean(membership?.team_id));

          const { data: savedSelection } = await supabase
            .from("subscription_plan_selections")
            .select("plan,months,total_price,monthly_equivalent,discount_percent,updated_at")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!cancelled && savedSelection && (savedSelection.plan === "pro" || savedSelection.plan === "business") && [1, 3, 6, 12].includes(savedSelection.months)) {
            const restoredChoice: SavedChoice = {
              plan: savedSelection.plan,
              months: savedSelection.months as PeriodMonths,
              total: Number(savedSelection.total_price),
              monthlyEquivalent: Number(savedSelection.monthly_equivalent),
              discount: Number(savedSelection.discount_percent),
              savedAt: savedSelection.updated_at,
            };
            setSavedChoice(restoredChoice);
            setSelectedMonths(restoredChoice.months);
            try { window.localStorage.setItem("bizai-selected-plan", JSON.stringify(restoredChoice)); } catch { /* Optional cache only. */ }
          }
        } else {
          setCurrentPlan("free");
          setCurrentPlanStatus("active");
          setCurrentExpiresAt(null);
          setHasBusinessTeam(false);
        }
      } catch (error) {
        console.error("Pricing account load error:", error);
      } finally {
        if (!cancelled) setLoadingAccount(false);
      }
    };

    void loadAccount();
    try {
      const stored = window.localStorage.getItem("bizai-selected-plan");
      if (stored) {
        const parsed = JSON.parse(stored) as SavedChoice;
        if ((parsed.plan === "pro" || parsed.plan === "business") && [1, 3, 6, 12].includes(parsed.months)) {
          setSavedChoice(parsed);
          setSelectedMonths(parsed.months);
        }
      }
    } catch {
      window.localStorage.removeItem("bizai-selected-plan");
    }

    return () => { cancelled = true; };
  }, []);

  const showNotice = (message: string, isError = false) => {
    setNotice(message);
    setNoticeError(isError);
  };

  const savePlanChoice = async (plan: Exclude<PlanKey, "free">) => {
    if (currentPlan === plan && currentPlanStatus === "active") {
      showNotice(`У тебя уже выбран активный тариф ${planTitle(plan)}. Новая подписка не создавалась.`);
      return;
    }
    const monthly = plan === "pro" ? PRO_MONTHLY : BUSINESS_MONTHLY;
    const choice: SavedChoice = {
      plan,
      months: selectedMonths,
      total: totalPrice(monthly, selectedPeriod),
      monthlyEquivalent: roundMoney(totalPrice(monthly, selectedPeriod) / selectedMonths),
      discount: selectedPeriod.discount,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem("bizai-selected-plan", JSON.stringify(choice));
      setSavedChoice(choice);
    } catch {
      showNotice("Не удалось сохранить выбор в браузере. Проверь настройки хранения сайта.", true);
      return;
    }

    if (userEmail) {
      const { error } = await supabase.rpc("save_subscription_plan_choice", {
        p_plan: plan,
        p_months: selectedMonths,
      });
      if (error) {
        console.error("Subscription choice save error:", error);
        showNotice(`Выбор сохранён в браузере, но не удалось синхронизировать его с аккаунтом: ${error.message}`, true);
        return;
      }
      showNotice(`Выбор ${planTitle(plan)} на ${selectedPeriod.label.toLowerCase()} сохранён в аккаунте. Это ещё не покупка: платёжный провайдер не подключён, деньги не списаны, тариф не активирован.`);
    } else {
      showNotice(`Выбор ${planTitle(plan)} на ${selectedPeriod.label.toLowerCase()} сохранён в этом браузере. Войди в аккаунт, чтобы сохранить выбор в профиле. Оплата не подключена, деньги не списаны, тариф не активирован.`);
    }
  };

  const clearSavedChoice = async () => {
    window.localStorage.removeItem("bizai-selected-plan");
    setSavedChoice(null);
    if (userEmail) {
      const { error } = await supabase.rpc("clear_subscription_plan_choice");
      if (error) {
        console.error("Subscription choice clear error:", error);
        showNotice("Локальный выбор удалён, но не удалось удалить сохранённый выбор из аккаунта.", true);
        return;
      }
    }
    showNotice("Сохранённый выбор тарифа удалён.");
  };

  const currentExpiry = currentExpiresAt ? new Date(currentExpiresAt).toLocaleString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : null;
  const currentPlanLabel = planTitle(currentPlan);

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-zinc-950 dark:bg-[#09090b] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/85 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#0b0b0dcc]">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white">B</span><span className="text-lg">BizAI</span></Link>
          <div className="flex items-center gap-2">
            {hasBusinessTeam && <Link href="/team" className="hidden rounded-xl px-3 py-2 text-sm text-zinc-500 transition hover:text-purple-600 sm:inline-flex dark:text-zinc-400">Команда</Link>}
            <Link href="/referrals" className="hidden rounded-xl px-3 py-2 text-sm text-zinc-500 transition hover:text-purple-600 sm:inline-flex dark:text-zinc-400">Партнёрская программа</Link>
            <Link href="/" className="rounded-xl border border-black/[0.08] px-4 py-2 text-sm font-medium transition hover:bg-black/[0.04] dark:border-white/[0.1] dark:hover:bg-white/[0.05]">← В BizAI</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-600">Тарифы BizAI</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] sm:text-5xl">Выбери свой тариф</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-base">Начни бесплатно или выбери Pro на короткий либо длительный срок. При оплате за несколько месяцев итоговая стоимость будет ниже.</p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-purple-500/20 bg-white p-3 shadow-sm dark:bg-[#101014] sm:p-4">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Срок подписки</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {periods.map((period) => {
              const active = selectedMonths === period.months;
              return <button key={period.months} type="button" onClick={() => { setSelectedMonths(period.months); setNotice(""); }} aria-pressed={active} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${active ? "border-purple-500 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_8px_24px_rgba(124,58,237,.22)]" : "border-black/[0.07] bg-zinc-50 text-zinc-600 hover:border-purple-300 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-zinc-300"}`}><span className="block">{period.label}</span>{period.badge ? <span className={`mt-1 block text-[10px] ${active ? "text-white/80" : "text-emerald-600 dark:text-emerald-400"}`}>{period.badge}</span> : <span className={`mt-1 block text-[10px] ${active ? "text-white/75" : "text-zinc-400"}`}>Стандартная цена</span>}</button>;
            })}
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-zinc-400">Автопродление не включено. Сроки и скидки показаны как тарифная модель; оплата и автоматическая активация пока не подключены.</p>
        </div>

        <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-sm dark:border-white/[0.07] dark:bg-[#101014]">
          {loadingAccount ? <p className="text-zinc-500">Проверяем текущий тариф…</p> : <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p>Текущий тариф: <b>{currentPlanLabel}</b>{userEmail ? <span className="ml-2 text-xs text-zinc-400">· {userEmail}</span> : <span className="ml-2 text-xs text-zinc-400">· ты не вошёл в аккаунт</span>}</p><p className="text-xs text-zinc-500">{currentExpiry && currentPlan !== "free" ? `Действует до ${currentExpiry}` : currentPlan === "free" ? "Бесплатный доступ" : currentPlanStatus}</p></div>}
        </div>

        {notice && <div role="status" className={`mx-auto mt-5 max-w-4xl rounded-2xl border px-4 py-3 text-sm leading-6 ${noticeError ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200" : "border-purple-500/20 bg-purple-500/[0.07] text-zinc-700 dark:text-zinc-200"}`}>{notice}</div>}

        {savedChoice && (
          <section className="mx-auto mt-5 max-w-4xl rounded-2xl border border-purple-500/25 bg-purple-500/[0.05] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-purple-600">Сохранённый выбор</p><h2 className="mt-1 text-lg font-bold">{planTitle(savedChoice.plan)} · {savedChoice.months} мес.</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">К оплате по выбранной модели: {formatUSD(savedChoice.total)} · {formatUSD(savedChoice.monthlyEquivalent)}/мес. · скидка {savedChoice.discount}%</p><p className="mt-2 text-xs text-zinc-400">Сохранено только в этом браузере. Заказ и подписка ещё не созданы.</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => showNotice("Подключение оплаты будет отдельным этапом. Текущий выбор уже сохранён; деньги не списывались.")} className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-xs font-bold text-white">Проверить выбор</button><button type="button" onClick={clearSavedChoice} className="rounded-xl border border-black/[0.1] px-4 py-3 text-xs font-semibold dark:border-white/[0.1]">Удалить</button></div>
            </div>
          </section>
        )}

        <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-3">
          <article className="flex flex-col rounded-[26px] border border-black/[0.07] bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#101014] sm:p-7">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Для знакомства</p><h2 className="mt-1 text-2xl font-bold">Free</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-100 text-xl dark:bg-white/[0.06]">✦</span></div>
            <p className="mt-5 text-4xl font-black">$0</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Бесплатно</p>
            <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-black/[0.1] px-4 py-3 text-sm font-semibold transition hover:bg-black/[0.04] dark:border-white/[0.12] dark:hover:bg-white/[0.05]">{currentPlan === "free" ? "Продолжить бесплатно" : "Вернуться на главную"}</Link>
            <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-300"><Feature>5 бесплатных генераций по текущему лимиту</Feature><Feature>Базовая текстовая генерация</Feature><Feature>Аккаунт и история работ</Feature><Feature muted>Создание изображений</Feature><Feature muted>Инструменты Pro и Brand Kit</Feature></ul>
            <p className="mt-auto pt-6 text-[11px] leading-5 text-zinc-400">Подходит, чтобы попробовать BizAI перед переходом на Pro.</p>
          </article>

          <article className="relative flex flex-col rounded-[26px] border border-purple-400 bg-gradient-to-b from-purple-50 to-white p-6 shadow-[0_12px_40px_rgba(124,58,237,.10)] dark:from-purple-500/[0.13] dark:to-[#101014] dark:border-purple-500/50 sm:p-7">
            <div className="absolute right-5 top-5 rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Популярный</div>
            <div className="flex items-start justify-between gap-3 pr-24"><div><p className="text-sm font-semibold text-purple-600 dark:text-purple-300">Для активной работы</p><h2 className="mt-1 text-2xl font-bold">Pro</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-600/10 text-xl">♛</span></div>
            <div className="mt-5"><p className="text-4xl font-black">{formatUSD(proTotal)}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">за {selectedPeriod.label.toLowerCase()}</p>{selectedPeriod.discount > 0 && <p className="mt-2 text-xs text-zinc-400"><span className="line-through">{formatUSD(proRegularTotal)}</span><span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">Экономия {formatUSD(proRegularTotal - proTotal)} ({selectedPeriod.discount}%)</span></p>}<p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">{formatUSD(proTotal / selectedMonths)} в месяц</p></div>
            <button type="button" onClick={() => savePlanChoice("pro")} disabled={currentPlan === "pro" && currentPlanStatus === "active"} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(124,58,237,.18)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{currentPlan === "pro" && currentPlanStatus === "active" ? "Текущий тариф" : "Выбрать Pro"}</button>
            <ul className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-zinc-200"><Feature>Текстовые генерации без списания бесплатного лимита</Feature><Feature>Генерация рекламных изображений</Feature><Feature>Контент-пакеты, соцсети и контент-планы</Feature><Feature>Рекламные кампании и Brand Kit</Feature><Feature>История текстов и медиа</Feature></ul>
            <p className="mt-auto pt-6 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">Выбор срока уже работает. Для реальной покупки нужно подключить платёжного провайдера.</p>
          </article>

          <article className="flex flex-col rounded-[26px] border border-black/[0.07] bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#101014] sm:p-7">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-300">Для команд и агентств</p><h2 className="mt-1 text-2xl font-bold">Business</h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-fuchsia-500/10 text-xl">♟</span></div>
            <p className="mt-5 text-4xl font-black">{formatUSD(businessTotal)}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">за {selectedPeriod.label.toLowerCase()}</p>{selectedPeriod.discount > 0 && <p className="mt-2 text-xs text-zinc-400"><span className="line-through">{formatUSD(businessRegularTotal)}</span><span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">Экономия {formatUSD(businessRegularTotal - businessTotal)} ({selectedPeriod.discount}%)</span></p>}<p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">{formatUSD(businessTotal / selectedMonths)} в месяц · цена для утверждения перед оплатой</p>
            {(currentPlan === "business" || hasBusinessTeam) ? <Link href="/team" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white">Открыть Business Workspace</Link> : <button type="button" onClick={() => savePlanChoice("business")} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/[0.06] px-4 py-3 text-sm font-bold text-purple-700 transition hover:bg-purple-500/[0.1] dark:text-purple-200">Выбрать Business</button>}
            <ul className="mt-6 space-y-3 text-sm text-zinc-600 dark:text-zinc-300"><Feature>Все возможности Pro</Feature><Feature>Рабочая команда до 5 человек</Feature><Feature>Приглашения по защищённым ссылкам</Feature><Feature>Общий Brand Kit для команды</Feature><Feature>Общая библиотека текстовых результатов и описаний AI-работ</Feature><Feature>Удаление участников и отмена приглашений владельцем</Feature></ul>
            <p className="mt-auto pt-6 text-[11px] leading-5 text-zinc-400">Business Workspace реализован отдельно. Сам тариф активируется только после подтверждённой оплаты или административной активации; выбор на этой странице не предоставляет доступ.</p>
          </article>
        </div>

        <section className="mt-10 rounded-[26px] border border-black/[0.06] bg-white p-6 dark:border-white/[0.07] dark:bg-[#101014] sm:p-8"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">Сравнение</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Что входит в тарифы</h2></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[650px] border-collapse text-left text-sm"><thead><tr className="border-b border-black/[0.07] dark:border-white/[0.08]"><th className="px-3 py-3 font-semibold text-zinc-500">Возможность</th><th className="px-3 py-3 font-semibold">Free</th><th className="px-3 py-3 font-semibold text-purple-600">Pro</th><th className="px-3 py-3 font-semibold text-fuchsia-600">Business</th></tr></thead><tbody><CompareRow label="Текстовая генерация" free="5 стартовых генераций" pro="Без списания лимита" business="Без списания лимита" /><CompareRow label="AI-изображения" free="—" pro="✓" business="✓" /><CompareRow label="Контент-пакеты и Brand Kit" free="—" pro="✓" business="✓" /><CompareRow label="Личная история работ" free="✓" pro="✓" business="✓" /><CompareRow label="Участники команды" free="—" pro="—" business="До 5" /><CompareRow label="Общий Brand Kit" free="—" pro="—" business="✓" /><CompareRow label="Общая библиотека текстовых результатов" free="—" pro="—" business="✓" /><CompareRow label="Управление приглашениями" free="—" pro="—" business="Владелец команды" /></tbody></table></div></section>

        <section className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/[0.07] dark:bg-[#101014]"><h3 className="font-bold">Можно ли оплатить сейчас?</h3><p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Нет. Страница считает цену и сохраняет выбранный вариант, но платёжный провайдер ещё не подключён. Деньги не списываются, тариф автоматически не активируется.</p></div><div className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/[0.07] dark:bg-[#101014]"><h3 className="font-bold">Как работает срок?</h3><p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Выбери 1, 3, 6 или 12 месяцев. Сумма и экономия пересчитываются сразу. Скидки и Business-цена — предлагаемые параметры; их нужно окончательно утвердить перед подключением оплаты.</p></div></section>

        {hasBusinessTeam && <div className="mt-8 text-center"><Link href="/team" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-500/30 px-5 py-3 text-sm font-semibold text-purple-700 dark:text-purple-200">Перейти в рабочее пространство команды →</Link></div>}
        <div className="mt-10 text-center"><Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">Вернуться в BizAI</Link></div>
      </section>
    </main>
  );
}

function Feature({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <li className={`flex items-start gap-2.5 leading-5 ${muted ? "text-zinc-400 dark:text-zinc-500" : ""}`}><span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold ${muted ? "bg-zinc-100 text-zinc-400 dark:bg-white/[0.05]" : "bg-purple-600/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300"}`}>{muted ? "–" : "✓"}</span><span>{children}</span></li>;
}

function CompareRow({ label, free, pro, business }: { label: string; free: string; pro: string; business: string }) {
  return <tr className="border-b border-black/[0.05] last:border-0 dark:border-white/[0.06]"><th scope="row" className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-300">{label}</th><td className="px-3 py-3 text-zinc-500 dark:text-zinc-400">{free}</td><td className="px-3 py-3 font-medium text-purple-700 dark:text-purple-300">{pro}</td><td className="px-3 py-3 text-zinc-500 dark:text-zinc-400">{business}</td></tr>;
}
