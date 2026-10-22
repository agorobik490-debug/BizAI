
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";

type JsonObject = Record<string, unknown>;

async function readResponse(
    response: Response
): Promise<{ data: JsonObject | null; raw: string }> {
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
            console.error("MAIB credentials are not configured.");

            return NextResponse.json(
                { error: "MAIB credentials are not configured." },
                { status: 500 }
            );
        }

        if (!siteUrl) {
            console.error("NEXT_PUBLIC_SITE_URL is not configured.");

            return NextResponse.json(
                { error: "NEXT_PUBLIC_SITE_URL is not configured." },
                { status: 500 }
            );
        }

        // Проверяем адрес сайта, чтобы сформировать корректные redirect URL.
        let parsedSiteUrl: URL;

        try {
            parsedSiteUrl = new URL(siteUrl);
        } catch {
            return NextResponse.json(
                { error: "NEXT_PUBLIC_SITE_URL is not a valid URL." },
                { status: 500 }
            );
        }

        if (
            parsedSiteUrl.protocol !== "https:" &&
            parsedSiteUrl.hostname !== "localhost"
        ) {
            return NextResponse.json(
                { error: "The site URL must use HTTPS." },
                { status: 500 }
            );
        }

        // Тестовая цена задаётся только на сервере.
        const amount = 3.99;
        const currency = "MDL";

        // 1. Получаем токен MAIB.
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
            !accessToken ||
            typeof tokenType !== "string" ||
            !tokenType
        ) {
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

        // 2. Создаём платёжную сессию.
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

        const apiErrors = checkoutData?.errors;
        const hasApiErrors =
            Array.isArray(apiErrors) && apiErrors.length > 0;

        const validCheckoutUrl =
            typeof checkoutUrl === "string" &&
            checkoutUrl.length > 0 &&
            /^https:\/\//i.test(checkoutUrl);

        if (
            !checkoutResponse.ok ||
            checkoutData === null ||
            checkoutData.ok === false ||
            hasApiErrors ||
            !validCheckoutUrl
        ) {
            // Не выводим токены, секреты или полный ответ в логи.
            console.error("MAIB checkout creation failed:", {
                httpStatus: checkoutResponse.status,
                responseIsJson: checkoutData !== null,
                responseKeys: checkoutData
                    ? Object.keys(checkoutData)
                    : [],
                errors: hasApiErrors ? apiErrors : undefined,
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
                {
                    error:
                        "Could not create MAIB checkout. Check server logs.",
                },
                { status: 502 }
            );
        }

        // Возвращаем клиенту только URL платёжной страницы.
        return NextResponse.json({
            checkoutUrl,
        });
    } catch (error) {
        console.error("Checkout route error:", {
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });

        return NextResponse.json(
            { error: "An unexpected payment error occurred." },
            { status: 500 }
        );
    }
}
