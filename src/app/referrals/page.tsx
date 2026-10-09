"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type Referral = {
  id: number;
  status: "registered" | "paid" | "reversed";
  created_at: string;
  paid_at: string | null;
};

type Reward = {
  id: number;
  milestone: number;
  reward_days: number;
  status: "available" | "claimed" | "cancelled";
  created_at: string;
  claimed_at: string | null;
};

const milestones = [
  { milestone: 1, days: 3, label: "3 дня Pro", icon: "🎁" },
  { milestone: 3, days: 14, label: "14 дней Pro", icon: "🎁" },
  { milestone: 5, days: 30, label: "1 месяц Pro", icon: "⭐" },
  { milestone: 10, days: 90, label: "3 месяца Pro", icon: "⭐" },
  { milestone: 20, days: 180, label: "6 месяцев Pro", icon: "👑" },
];

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [claimingRewardId, setClaimingRewardId] = useState<number | null>(null);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserEmail(null);
      setLoading(false);
      return;
    }

    setUserEmail(user.email ?? null);

    const { data: codeData, error: codeError } = await supabase.rpc(
      "get_or_create_referral_code"
    );

    if (codeError) {
      console.error(codeError);
      setMessage("Не удалось получить реферальный код.");
      setLoading(false);
      return;
    }

    setCode(String(codeData));

    const { data: referralData, error: referralError } = await supabase
      .from("referrals")
      .select("id,status,created_at,paid_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (referralError) {
      console.error(referralError);
      setMessage("Не удалось загрузить статистику рефералов.");
    } else {
      setReferrals((referralData ?? []) as Referral[]);
    }

    const { data: rewardData, error: rewardError } = await supabase
      .from("referral_rewards")
      .select(
        "id,milestone,reward_days,status,created_at,claimed_at"
      )
      .eq("user_id", user.id)
      .order("milestone", { ascending: true });

    if (rewardError) {
      console.error(rewardError);
      setMessage("Не удалось загрузить награды.");
    } else {
      setRewards((rewardData ?? []) as Reward[]);
    }

    setLoading(false);
  };

  const paidCount = useMemo(
    () => referrals.filter((item) => item.status === "paid").length,
    [referrals]
  );

  const registeredCount = referrals.length;

  const nextMilestone =
    milestones.find((item) => item.milestone > paidCount) ?? null;

  const progress = nextMilestone
    ? Math.min(100, (paidCount / nextMilestone.milestone) * 100)
    : 100;

  const referralUrl =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/?ref=${code}`
      : "";

  const copyReferralLink = async () => {
    if (!referralUrl) return;

    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("Не удалось скопировать ссылку.");
    }
  };

  const claimReward = async (reward: Reward) => {
    if (claimingRewardId !== null) return;

    setClaimingRewardId(reward.id);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("claim_referral_reward", {
        p_reward_id: reward.id,
      });

      if (error) {
        console.error("Referral reward claim error:", error);
        setMessage(
          error.message.toLowerCase().includes("claim_referral_reward")
            ? "Функция получения награды ещё не создана в Supabase. Сначала выполни SQL для claim_referral_reward."
            : "Не удалось получить награду. Обнови страницу и попробуй ещё раз."
        );
        return;
      }

      if (data !== true) {
        setMessage("Награда не была получена. Обнови страницу и проверь её статус.");
        return;
      }

      await loadReferralData(false);
      setMessage(`Готово! Начислено ${reward.reward_days} дней BizAI Pro.`);
    } catch (error) {
      console.error("Referral reward claim failed:", error);
      setMessage("Произошла ошибка при получении награды. Попробуй ещё раз.");
    } finally {
      setClaimingRewardId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7fb] text-zinc-900 dark:bg-zinc-950 dark:text-white">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-purple-600" />
          <p className="mt-4 text-sm text-zinc-500">
            Загружаем партнёрский кабинет…
          </p>
        </div>
      </main>
    );
  }

  if (!userEmail) {
    return (
      <main className="min-h-screen bg-[#f7f7fb] text-zinc-900 dark:bg-zinc-950 dark:text-white">
        <header className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl dark:border-white/[0.07] dark:bg-zinc-950/80">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
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

        <section className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-100 text-3xl dark:bg-purple-500/10">
            🤝
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Партнёрская программа
          </h1>

          <p className="mt-5 text-base leading-7 text-zinc-500 dark:text-zinc-400">
            Приглашай новых пользователей в BizAI и получай бесплатный Pro за
            оплаченные рефералы.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950"
          >
            Войти в BizAI
          </Link>
        </section>
      </main>
    );
  }

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
            ← В BizAI
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-600">
            Партнёрская программа
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Приглашай пользователей.
            <br />
            <span className="text-zinc-400 dark:text-zinc-600">
              Получай BizAI Pro.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
            Поделись своей персональной ссылкой. Чем больше приглашённых
            пользователей оформят Pro, тем больше бесплатного времени BizAI Pro
            ты сможешь получить.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 dark:border-purple-500/20 dark:from-purple-500/10 dark:to-fuchsia-500/5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-600">
            Твоя персональная ссылка
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              readOnly
              value={referralUrl}
              className="min-w-0 flex-1 rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm outline-none dark:border-white/[0.07] dark:bg-zinc-950"
            />

            <button
              type="button"
              onClick={copyReferralLink}
              className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-950"
            >
              {copied ? "✓ Скопировано" : "Скопировать"}
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Отправляй эту ссылку друзьям, коллегам и другим потенциальным
            пользователям BizAI.
          </p>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            {message}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Приглашено
            </p>
            <p className="mt-2 text-4xl font-bold">{registeredCount}</p>
          </div>

          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Оплатили Pro
            </p>
            <p className="mt-2 text-4xl font-bold">{paidCount}</p>
          </div>

          <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              До следующей награды
            </p>

            <p className="mt-2 text-4xl font-bold">
              {nextMilestone
                ? `${Math.max(0, nextMilestone.milestone - paidCount)}`
                : "0"}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Прогресс
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                {nextMilestone
                  ? `До ${nextMilestone.label}`
                  : "Все основные награды открыты"}
              </h2>
            </div>

            <p className="text-sm text-zinc-500">
              {nextMilestone
                ? `${paidCount} / ${nextMilestone.milestone}`
                : `${paidCount} оплаченных рефералов`}
            </p>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <section className="mt-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-purple-600">
              Мои награды
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Получай больше Pro
            </h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {milestones.map((item) => {
              const reward = rewards.find(
                (value) => value.milestone === item.milestone
              );

              const unlocked = paidCount >= item.milestone;
              const claimed = reward?.status === "claimed";
              const available = reward?.status === "available";
              const cancelled = reward?.status === "cancelled";

              return (
                <div
                  key={item.milestone}
                  className={`rounded-3xl border p-6 ${unlocked
                      ? "border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:border-purple-500/20 dark:from-purple-500/10 dark:to-fuchsia-500/5"
                      : "border-black/[0.06] bg-white dark:border-white/[0.07] dark:bg-zinc-900"
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-2xl">{item.icon}</span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${claimed
                          ? "bg-emerald-500/10 text-emerald-600"
                          : available
                            ? "bg-purple-500/10 text-purple-600"
                            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                        }`}
                    >
                      {claimed ? "ПОЛУЧЕНО" : available ? "ДОСТУПНО" : cancelled ? "ОТМЕНЕНО" : unlocked ? "ОТКРЫТО" : "ЗАБЛОКИРОВАНО"}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    {item.label}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Нужно {item.milestone} оплаченных{" "}
                    {item.milestone === 1
                      ? "реферал"
                      : item.milestone < 5
                        ? "реферала"
                        : "рефералов"}
                  </p>

                  {claimed ? (
                    <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      ✓ Награда уже получена
                    </div>
                  ) : available && reward ? (
                    <button
                      type="button"
                      onClick={() => claimReward(reward)}
                      disabled={claimingRewardId !== null}
                      className="mt-5 w-full rounded-xl bg-purple-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {claimingRewardId === reward.id
                        ? "Начисляем Pro…"
                        : `Получить ${reward.reward_days} дней Pro`}
                    </button>
                  ) : cancelled ? (
                    <div className="mt-5 rounded-xl bg-zinc-100 px-4 py-3 text-center text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      Награда отменена
                    </div>
                  ) : unlocked ? (
                    <div className="mt-5 rounded-xl bg-zinc-100 px-4 py-3 text-center text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      Награда ожидает синхронизации
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl bg-zinc-100 px-4 py-3 text-center text-sm font-medium text-zinc-400 dark:bg-zinc-800">
                      Ещё {item.milestone - paidCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-zinc-900 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-purple-600">
            Как это работает
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <div>
              <div className="text-2xl">1️⃣</div>
              <h3 className="mt-3 font-semibold">Поделись ссылкой</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Отправь свою персональную ссылку потенциальному пользователю.
              </p>
            </div>

            <div>
              <div className="text-2xl">2️⃣</div>
              <h3 className="mt-3 font-semibold">Пользователь оформляет Pro</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Засчитываются только реальные новые пользователи с активной
                платной подпиской.
              </p>
            </div>

            <div>
              <div className="text-2xl">3️⃣</div>
              <h3 className="mt-3 font-semibold">Получай награды</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Достигаешь нового уровня — открывается соответствующий подарок
                Pro.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-500/10 sm:p-8">
          <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200">
            Важные правила
          </h2>

          <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
            <li>• Один пользователь может быть привязан только к одному партнёру.</li>
            <li>• Саморефералы и повторные регистрации не засчитываются.</li>
            <li>• Реферал становится оплаченной рекомендацией только после подтверждённой оплаты.</li>
            <li>• При возврате платежа реферал может быть отменён.</li>
            <li>• BizAI может отклонить подозрительные или мошеннические регистрации.</li>
          </ul>
        </section>
      </section>

      <footer className="border-t border-black/[0.06] py-7 dark:border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-5 text-xs text-zinc-400 sm:px-8">
          <Link href="/" className="hover:text-purple-600">
            BizAI
          </Link>
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
      </footer>
    </main>
  );
}