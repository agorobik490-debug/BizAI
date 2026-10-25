
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";
const AMOUNT = 3.99;
const CURRENCY = "MDL";

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

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const clientId = process.env.MAIB_CLIENT_ID;
    const clientSecret = process.env.MAIB_CLIENT_SECRET;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !serviceRoleKey ||
      !clientId ||
      !clientSecret ||
      !siteUrl
    ) {
      console.error("Checkout configuration is incomplete.");
      return NextResponse.json(
        { error: "Сервер оплаты не настроен полностью." },
        { status: 500 }
      );
    }

    let parsedSiteUrl: URL;
    try {
      parsedSiteUrl = new URL(siteUrl);
    } catch {
      return NextResponse.json(
        { error: "Некорректный адрес сайта." },
        { status: 500 }
      );
    }

    if (
      parsedSiteUrl.protocol !== "https:" &&
      parsedSiteUrl.hostname !== "localhost"
    ) {
      return NextResponse.json(
        { error: "Адрес сайта должен использовать HTTPS." },
        { status: 500 }
      );
    }

    // Получаем токен авторизованного пользователя из заголовка.
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!accessToken) {
      return NextResponse.json(
        { error: "Войди в аккаунт BizAI перед оплатой." },
        { status: 401 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await authClient.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Сессия недействительна. Войди в аккаунт заново." },
        { status: 401 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Сумма задаётся только сервером, не браузером.
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
    const maibToken = tokenResult?.accessToken;
    const tokenType = tokenResult?.tokenType ?? "Bearer";

    if (
      !tokenResponse.ok ||
      tokenData?.ok === false ||
      typeof maibToken !== "string" ||
      !maibToken ||
      typeof tokenType !== "string"
    ) {
      console.error("MAIB authentication failed.", {
        httpStatus: tokenResponse.status,
      });
      return NextResponse.json(
        { error: "Не удалось авторизоваться в MAIB." },
        { status: 502 }
      );
    }

    const checkoutResponse = await fetch(
      `${MAIB_BASE_URL}/v2/checkouts`,
      {
        method: "POST",
        headers: {
          Authorization: `${tokenType} ${maibToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: AMOUNT,
          currency: CURRENCY,
          language: "ru",
          orderInfo: {
            description: "BizAI Pro - 1 month",
          },
          successUrl: `${siteUrl}/payment/success`,
          failUrl: `${siteUrl}/payment/fail`,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const checkoutData = await readJson(checkoutResponse);
    const checkoutResult = getObject(checkoutData?.result);
    const checkoutId = checkoutResult?.checkoutId;
    const checkoutUrl = checkoutResult?.checkoutUrl;
    const errors = checkoutData?.errors;

    if (
      !checkoutResponse.ok ||
      checkoutData?.ok === false ||
      (Array.isArray(errors) && errors.length > 0) ||
      typeof checkoutId !== "string" ||
      typeof checkoutUrl !== "string" ||
      !/^https:\/\//i.test(checkoutUrl)
    ) {
      console.error("MAIB checkout creation failed.", {
        httpStatus: checkoutResponse.status,
        apiOk: checkoutData?.ok,
      });
      return NextResponse.json(
        { error: "Не удалось создать платёж MAIB." },
        { status: 502 }
      );
    }

    // Привязываем Checkout к подтверждённому аккаунту.
    const { error: insertError } = await adminClient
      .from("payment_orders")
      .insert({
        checkout_id: checkoutId,
        user_id: authData.user.id,
        plan: "pro",
        months: 1,
        amount: AMOUNT,
        currency: CURRENCY,
        status: "pending",
      });

    if (insertError) {
      console.error("Could not save payment order.", {
        code: insertError.code,
      });
      return NextResponse.json(
        { error: "Платёж создан, но не удалось сохранить заказ. Обратись в поддержку." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { checkoutUrl },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Checkout route error.", {
      reason:
        error instanceof Error && error.name === "TimeoutError"
          ? "timeout"
          : "request_error",
    });

    return NextResponse.json(
      { error: "Не удалось создать платёж. Попробуй позже." },
      { status: 502 }
    );
  }
}
