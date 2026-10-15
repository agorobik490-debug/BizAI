
export default function PaymentFailPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
            <section className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                <h1 className="text-2xl font-bold">
                    Оплата не завершена
                </h1>
                <p className="mt-4 text-zinc-300">
                    Платёж не был завершён или не удалось подтвердить его
                    результат. Если деньги были списаны, проверьте статус
                    операции у банка перед повторной оплатой.
                </p>
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
