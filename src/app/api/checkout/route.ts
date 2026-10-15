
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";

type JsonObject = Record<string, unknown>;

async function readResponse(response: Response): Promise<{
    data: JsonObject | null;
    raw: string;
}> {
    const raw = await response.text();

    try {
        const parsed: unknown = JSON.parse(raw);

        if (
            parsed !== null &&
            typeof parsed === "object" &&
            !Array.isArray(parsed)
        ) {
            return { data: parsed as JsonObject, raw };
        }

        return { data: null, raw };
    } catch {
        return { data: null, raw };
    }
}

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

export async function POST() {
    try {
        const clientId = process.env.MAIB_CLIENT_ID;
        const clientSecret = process.env.MAIB_CLIENT_SECRET;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                { error: "MAIB credentials are not configured." },
                { status: 500 }
            );
        }

        if (!siteUrl) {
            return NextResponse.json(
                { error: "NEXT_PUBLIC_SITE_URL is not configured." },
                { status: 500 }
            );
        }

        // Цена задаётся на сервере, а не принимается от браузера.
        const amount = 3.99;
        const currency = "MDL";

        // 1. Авторизация в MAIB.
        const tokenResponse = await fetch(
            `${MAIB_BASE_URL}/v2/auth/token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clientId,
                    clientSecret,
                }),
                cache: "no-store",
            }
        );

        const { data: tokenData } = await readResponse(tokenResponse);
        const tokenResult = getObject(tokenData?.result);

        const accessToken = tokenResult?.accessToken;
        const tokenType = tokenResult?.tokenType;

        if (
            !tokenResponse.ok ||
            typeof accessToken !== "string" ||
            typeof tokenType !== "string"
        ) {
            // Не записываем токен, ClientSecret или полный ответ в лог.
            console.error("MAIB authentication failed:", {
                httpStatus: tokenResponse.status,
                responseKeys: tokenData ? Object.keys(tokenData) : [],
                resultKeys: tokenResult ? Object.keys(tokenResult) : [],
                apiOk: tokenData?.ok,
                apiError:
                    typeof tokenData?.message === "string"
                        ? tokenData.message
                        : typeof tokenData?.error === "string"
                            ? tokenData.error
                            : undefined,
            });

            return NextResponse.json(
                { error: "Could not authenticate with MAIB." },
                { status: 502 }
            );
        }

        // 2. Создание платёжной сессии.
        const checkoutResponse = await fetch(
            `${MAIB_BASE_URL}/v2/checkouts`,
            {
                method: "POST",
                headers: {
                    Authorization: `${tokenType} ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount,
                    currency,
                    language: "en",
                    orderInfo: {
                        description: "BizAI Pro - first month",
                    },
                    successUrl: `${siteUrl}/payment/success`,
                    failUrl: `${siteUrl}/payment/fail`,
                }),
                cache: "no-store",
            }
        );

        const { data: checkoutData, raw } =
            await readResponse(checkoutResponse);

        const checkoutResult = getObject(checkoutData?.result);
        const checkoutUrl = checkoutResult?.checkoutUrl;

        if (
            !checkoutResponse.ok ||
            checkoutData?.ok === false ||
            typeof checkoutUrl !== "string" ||
            !/^https:\/\//i.test(checkoutUrl)
        ) {
            // Логируем только структуру ответа и безопасные поля.
            // Полный ответ может содержать чувствительные данные.
            console.error("MAIB checkout creation failed:", {
                httpStatus: checkoutResponse.status,
                responseIsJson: checkoutData !== null,
                responseKeys: checkoutData
                    ? Object.keys(checkoutData)
                    : [],
                errors: checkoutData?.errors,
                resultKeys: checkoutResult
                    ? Object.keys(checkoutResult)
                    : [],
                apiOk: checkoutData?.ok,
                apiError:
                    typeof checkoutData?.message === "string"
                        ? checkoutData.message
                        : typeof checkoutData?.error === "string"
                            ? checkoutData.error
                            : undefined,
                responsePreview: checkoutData
                    ? undefined
                    : raw.slice(0, 300),
            });

            return NextResponse.json(
                { error: "Could not create MAIB checkout. Check server logs." },
                { status: 502 }
            );
        }

        return NextResponse.json({
            checkoutUrl,
        });
    } catch (error) {
        console.error(
            "Checkout route error:",
            error instanceof Error ? error.message : "Unknown error"
        );

        return NextResponse.json(
            { error: "An unexpected payment error occurred." },
            { status: 500 }
        );
    }
}
