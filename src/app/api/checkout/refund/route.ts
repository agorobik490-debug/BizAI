
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";
const EXPECTED_AMOUNT = 3.99;
const EXPECTED_CURRENCY = "MDL";

type JsonObject = Record<string, unknown>;

function getObject(value: unknown): JsonObject | null {
    if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        return value as JsonObject;
    }

    return null;
}

async function readJson(response: Response): Promise<JsonObject | null> {
    try {
        return getObject(await response.json());
    } catch {
        return null;
    }
}

function validUuid(value: unknown): value is string {
    return (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            value
        )
    );
}

function sameAmount(a: unknown, b: number): boolean {
    const amount = Number(a);

    return (
        Number.isFinite(amount) &&
        Math.round(amount * 100) === Math.round(b * 100)
    );
}

export async function POST(request: NextRequest) {
    try {
        const authorization = request.headers.get("authorization");
        const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

        if (!accessToken) {
            return NextResponse.json(
                { error: "Войди в аккаунт BizAI." },
                { status: 401 }
            );
        }

        let body: JsonObject | null;

        try {
            body = getObject(await request.json());
        } catch {
            return NextResponse.json(
                { error: "Некорректный JSON-запрос." },
                { status: 400 }
            );
        }

        const checkoutId = body?.checkoutId;

        if (!validUuid(checkoutId)) {
            return NextResponse.json(
                { error: "Некорректный checkoutId." },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const clientId = process.env.MAIB_CLIENT_ID;
        const clientSecret = process.env.MAIB_CLIENT_SECRET;

        if (
            !supabaseUrl ||
            !supabaseKey ||
            !serviceRoleKey ||
            !clientId ||
            !clientSecret
        ) {
            return NextResponse.json(
                { error: "Сервер возврата не настроен." },
                { status: 500 }
            );
        }

        const authClient = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        const { data: userData, error: userError } =
            await authClient.auth.getUser(accessToken);

        if (userError || !userData.user) {
            return NextResponse.json(
                { error: "Сессия недействительна. Войди заново." },
                { status: 401 }
            );
        }

        const admin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        const { data: order, error: orderError } = await admin
            .from("payment_orders")
            .select("checkout_id, user_id, amount, currency, status")
            .eq("checkout_id", checkoutId)
            .maybeSingle();

        if (orderError) {
            console.error("Refund: order lookup failed.", orderError.code);

            return NextResponse.json(
                { error: "Не удалось проверить заказ." },
                { status: 500 }
            );
        }

        if (!order || order.user_id !== userData.user.id) {
            return NextResponse.json(
                { error: "Заказ не найден." },
                { status: 404 }
            );
        }

        if (
            order.status !== "paid" ||
            !sameAmount(order.amount, EXPECTED_AMOUNT) ||
            order.currency !== EXPECTED_CURRENCY
        ) {
            return NextResponse.json(
                { error: "Заказ не соответствует условиям тестового возврата." },
                { status: 409 }
            );
        }

        // Получаем токен MAIB.
        const tokenResponse = await fetch(
            `${MAIB_BASE_URL}/v2/auth/token`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientId, clientSecret }),
                cache: "no-store",
                signal: AbortSignal.timeout(15000),
            }
        );

        const tokenData = await readJson(tokenResponse);
        const tokenResult = getObject(tokenData?.result);
        const token = tokenResult?.accessToken;
        const tokenType = tokenResult?.tokenType ?? "Bearer";

        if (
            !tokenResponse.ok ||
            tokenData?.ok === false ||
            (Array.isArray(tokenData?.errors) &&
                tokenData.errors.length > 0) ||
            typeof token !== "string" ||
            !token ||
            typeof tokenType !== "string"
        ) {
            console.error("Refund: MAIB authentication failed.", {
                httpStatus: tokenResponse.status,
            });

            return NextResponse.json(
                { error: "Не удалось авторизоваться в MAIB." },
                { status: 502 }
            );
        }

        const headers = {
            Authorization: `${tokenType} ${token}`,
        };

        // Получаем checkout и связанный с ним paymentId.
        // Не добавляем Content-Type к GET: у нас уже была проблема с WAF.
        const checkoutResponse = await fetch(
            `${MAIB_BASE_URL}/v2/checkouts/${encodeURIComponent(checkoutId)}`,
            {
                method: "GET",
                headers,
                cache: "no-store",
                signal: AbortSignal.timeout(15000),
            }
        );

        const checkoutData = await readJson(checkoutResponse);
        const checkoutResult = getObject(checkoutData?.result);
        const payment = getObject(checkoutResult?.payment);

        const paymentId =
            payment?.paymentId ??
            payment?.PaymentId ??
            checkoutResult?.paymentId;

        if (
            !checkoutResponse.ok ||
            checkoutData?.ok === false ||
            (Array.isArray(checkoutData?.errors) &&
                checkoutData.errors.length > 0) ||
            !validUuid(paymentId)
        ) {
            console.error("Refund: could not obtain payment ID.", {
                httpStatus: checkoutResponse.status,
            });

            return NextResponse.json(
                {
                    error:
                        "Не удалось получить paymentId. Возврат не выполнялся.",
                },
                { status: 502 }
            );
        }

        // Проверяем исходный платёж и доступную для возврата сумму.
        const paymentResponse = await fetch(
            `${MAIB_BASE_URL}/v2/payments/${encodeURIComponent(paymentId)}`,
            {
                method: "GET",
                headers,
                cache: "no-store",
                signal: AbortSignal.timeout(15000),
            }
        );

        const paymentData = await readJson(paymentResponse);
        const paymentResult = getObject(paymentData?.result);

        if (
            !paymentResponse.ok ||
            paymentData?.ok === false ||
            (Array.isArray(paymentData?.errors) &&
                paymentData.errors.length > 0) ||
            !paymentResult
        ) {
            console.error("Refund: payment verification failed.", {
                httpStatus: paymentResponse.status,
            });

            return NextResponse.json(
                { error: "Не удалось проверить платёж. Возврат не выполнялся." },
                { status: 502 }
            );
        }

        const amount = paymentResult.amount;
        const currency = paymentResult.currency;
        const status = paymentResult.status;
        const refundableAmount = paymentResult.refundableAmount;
        const refundedAmount = Number(paymentResult.refundedAmount ?? 0);
        const requestedRefundAmount = Number(
            paymentResult.requestedRefundAmount ?? 0
        );

        if (
            status !== "Executed" ||
            !sameAmount(amount, EXPECTED_AMOUNT) ||
            currency !== EXPECTED_CURRENCY ||
            paymentResult.isRefundable !== true ||
            !sameAmount(refundableAmount, EXPECTED_AMOUNT) ||
            refundedAmount !== 0 ||
            requestedRefundAmount !== 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Платёж не прошёл проверку для полного возврата. Новый запрос не отправлен.",
                    paymentStatus:
                        typeof status === "string" ? status : "Unknown",
                },
                { status: 409 }
            );
        }

        // По умолчанию только проверяем платёж.
        // Возврат выполняется исключительно при явном подтверждении.
        if (body?.confirmRefund !== true) {
            return NextResponse.json(
                {
                    success: true,
                    dryRun: true,
                    message: "Платёж проверен. Возврат НЕ выполнялся.",
                    checkoutId,
                    paymentId,
                    paymentStatus: status,
                    amount: EXPECTED_AMOUNT,
                    currency: EXPECTED_CURRENCY,
                    refundableAmount: Number(refundableAmount),
                },
                { headers: { "Cache-Control": "no-store" } }
            );
        }


        // Атомарно резервируем заказ для возврата.
        // Только один запрос сможет изменить paid на refund_pending.
        const { data: claimedOrder, error: claimError } = await admin
            .from("payment_orders")
            .update({ status: "refund_pending" })
            .eq("checkout_id", checkoutId)
            .eq("user_id", userData.user.id)
            .eq("status", "paid")
            .select("checkout_id")
            .maybeSingle();

        if (claimError || !claimedOrder) {
            return NextResponse.json(
                {
                    error:
                        "Заказ уже обрабатывается или не готов к возврату. Проверь статус перед повторной попыткой.",
                },
                { status: 409 }
            );
        }


        // Запускаем полный возврат только после проверок выше.
        const refundResponse = await fetch(
            `${MAIB_BASE_URL}/v2/payments/${encodeURIComponent(paymentId)}/refund`,
            {
                method: "POST",
                headers: {
                    ...headers,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: EXPECTED_AMOUNT,
                    reason: "BizAI sandbox refund test",
                }),
                cache: "no-store",
                signal: AbortSignal.timeout(20000),
            }
        );

        const refundData = await readJson(refundResponse);
        const refundResult = getObject(refundData?.result);

        const maibRejected =
            refundResponse.status >= 400 ||
            refundData?.ok === false ||
            (Array.isArray(refundData?.errors) &&
                refundData.errors.length > 0);

        if (
            !refundResponse.ok ||
            refundData?.ok !== true ||
            (Array.isArray(refundData?.errors) &&
                refundData.errors.length > 0)
        ) {
            console.error("Refund: MAIB did not confirm the request.", {
                httpStatus: refundResponse.status,
            });

            // Не считаем возврат отклонённым только по ошибке ответа.
            // Сначала повторно проверяем фактическое состояние платежа.
            if (maibRejected) {
                try {
                    const verifyResponse = await fetch(
                        `${MAIB_BASE_URL}/v2/payments/${encodeURIComponent(paymentId)}`,
                        {
                            method: "GET",
                            headers,
                            cache: "no-store",
                            signal: AbortSignal.timeout(15000),
                        }
                    );

                    const verifyData = await readJson(verifyResponse);
                    const verifiedPayment = getObject(verifyData?.result);

                    const refundDefinitelyNotCreated =
                        verifyResponse.ok &&
                        verifyData?.ok !== false &&
                        verifiedPayment?.status === "Executed" &&
                        verifiedPayment?.isRefundable === true &&
                        sameAmount(
                            verifiedPayment?.refundableAmount,
                            EXPECTED_AMOUNT
                        ) &&
                        Number(verifiedPayment?.refundedAmount ?? 0) === 0 &&
                        Number(
                            verifiedPayment?.requestedRefundAmount ?? 0
                        ) === 0;

                    if (refundDefinitelyNotCreated) {
                        const { error: restoreError } = await admin
                            .from("payment_orders")
                            .update({ status: "paid" })
                            .eq("checkout_id", checkoutId)
                            .eq("user_id", userData.user.id)
                            .eq("status", "refund_pending");

                        if (restoreError) {
                            console.error(
                                "Refund: could not restore order status.",
                                restoreError.code
                            );
                        }
                    }
                } catch {
                    // При ошибке проверки сохраняем refund_pending.
                    // Перед повторным запросом нужно проверить MAIB вручную.
                }
            }

            return NextResponse.json(
                {
                    error:
                        "MAIB не подтвердил создание возврата. Проверь фактический статус платежа перед повторной попыткой.",
                    refundStatus:
                        typeof refundResult?.status === "string"
                            ? refundResult.status
                            : "Unknown",
                },
                { status: 502 }
            );
        }


        const refundId = refundResult?.refundId;
        const refundStatus = refundResult?.status;

        return NextResponse.json(
            {
                success: true,
                message:
                    "Запрос на возврат принят MAIB. Проверь итоговый статус отдельно.",
                checkoutId,
                paymentId,
                refundId:
                    typeof refundId === "string" ? refundId : null,
                refundStatus:
                    typeof refundStatus === "string" ? refundStatus : "Unknown",
                amount: EXPECTED_AMOUNT,
                currency: EXPECTED_CURRENCY,
            },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (error) {
        console.error("Refund route error.", {
            reason:
                error instanceof Error && error.name === "TimeoutError"
                    ? "timeout"
                    : "request_error",
        });

        return NextResponse.json(
            {
                error:
                    "Не удалось завершить запрос. Перед повторной попыткой проверь статус платежа в MAIB.",
            },
            { status: 502 }
        );
    }
}
