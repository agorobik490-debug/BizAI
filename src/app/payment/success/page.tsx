
"use client";

import { useEffect, useState } from "react";

type PaymentResult = {
    status?: string;
    verified?: boolean;
    amount?: number | null;
    currency?: string | null;
    error?: string;
};

export default function PaymentSuccessPage() {
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState<PaymentResult | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function verifyPayment() {
            const checkoutId = new URLSearchParams(
                window.location.search
            ).get("checkoutId");

            if (!checkoutId) {
                setMessage("В ссылке отсутствует номер платежа.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `/api/checkout/status?checkoutId=${encodeURIComponent(checkoutId)}`,
                    { cache: "no-store" }
                );

                const data: PaymentResult = await response.json();

                if (cancelled) return;

                if (!response.ok) {
                    setMessage(
                        data.error ||
                            "Не удалось проверить оплату. Попробуйте обновить страницу позже."
                    );
                } else {
                    setPayment(data);
                }
            } catch {
                if (!cancelled) {
                    setMessage(
                        "Не удалось связаться с сервером для проверки оплаты."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void verifyPayment();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-white">
            <section className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                <h1 className="text-2xl font-bold">
                    Результат оплаты BizAI Pro
                </h1>

                {loading ? (
                    <p className="mt-5 text-zinc-300">
                        Проверяем платёж через MAIB...
                    </p>
                ) : message ? (
                    <p className="mt-5 text-amber-300">{message}</p>
                ) : payment?.verified ? (
                    <>
                        <p className="mt-5 text-xl font-semibold text-green-400">
                            Оплата подтверждена
                        </p>
                        <p className="mt-3 text-zinc-300">
                            MAIB подтвердил платёж:{" "}
                            {payment.amount?.toFixed(2)} {payment.currency}.
                        </p>
                        <p className="mt-3 text-sm text-zinc-400">
                            Проверка оплаты завершена. Автоматическое
                            подключение Pro ещё не настроено.
                        </p>
                    </>
                ) : (
                    <>
                        <p className="mt-5 text-lg font-semibold">
                            Платёж пока не подтверждён
                        </p>
                        <p className="mt-3 text-zinc-300">
                            Статус MAIB: {payment?.status || "неизвестен"}.
                            Если вы только что оплатили, подождите немного
                            и обновите страницу.
                        </p>
                        {payment?.amount != null && payment.currency && (
                            <p className="mt-2 text-sm text-zinc-400">
                                Сумма: {payment.amount.toFixed(2)}{" "}
                                {payment.currency}
                            </p>
                        )}
                    </>
                )}

                <a
                    href="/"
                    className="mt-8 inline-block rounded-xl bg-white px-5 py-3 font-medium text-black hover:bg-zinc-200"
                >
                    Вернуться в BizAI
                </a>
            </section>
        </main>
    );
}
