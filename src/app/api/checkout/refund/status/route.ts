
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";
const EXPECTED_AMOUNT = 3.99;
const EXPECTED_CURRENCY = "MDL";

type JsonObject = Record<string, unknown>;

function getObject(value: unknown): JsonObject | null {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

async function readJson(
  response: Response
): Promise<JsonObject | null> {
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

function sameAmount(value: unknown, expected: number): boolean {
  const amount = Number(value);

  return (
    Number.isFinite(amount) &&
    Math.round(amount * 100) === Math.round(expected * 100)
  );
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.headers
      .get("authorization")
      ?.match(/^Bearer\s+(.+)$/i)?.[1];

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
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
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
        { error: "Сервер проверки возврата не настроен." },
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
        {
          error:
            "Сессия недействительна. Войди в аккаунт BizAI заново.",
        },
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
      .select(
        "checkout_id, user_id, amount, currency, status, refund_id, refund_status"
      )
      .eq("checkout_id", checkoutId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Refund status: order lookup failed.",
        orderError.code
      );

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
      !["refund_pending", "refunded"].includes(order.status) ||
      !validUuid(order.refund_id) ||
      !sameAmount(order.amount, EXPECTED_AMOUNT) ||
      order.currency !== EXPECTED_CURRENCY
    ) {
      return NextResponse.json(
        {
          error:
            "В заказе нет сохранённого возврата с ожидаемыми суммой и валютой.",
        },
        { status: 409 }
      );
    }

    // Получаем токен MAIB.
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
      console.error(
        "Refund status: MAIB authentication failed.",
        { httpStatus: tokenResponse.status }
      );

      return NextResponse.json(
        { error: "Не удалось авторизоваться в MAIB." },
        { status: 502 }
      );
    }

    const headers = {
      Authorization: `${tokenType} ${token}`,
    };

    // Проверяем, что платёж относится к этому checkout.
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
      console.error(
        "Refund status: checkout verification failed.",
        { httpStatus: checkoutResponse.status }
      );

      return NextResponse.json(
        { error: "Не удалось проверить платёж в MAIB." },
        { status: 502 }
      );
    }

    // Только читаем существующий возврат. Новый возврат не создаём.
    const refundResponse = await fetch(
      `${MAIB_BASE_URL}/v2/payments/refunds/${encodeURIComponent(
        order.refund_id
      )}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const refundData = await readJson(refundResponse);
    const refund = getObject(refundData?.result);

    const refundStatus = refund?.status;
    const refundPaymentId = refund?.paymentId;
    const refundRecordId = refund?.id ?? refund?.refundId;

    const validRefund =
      refundResponse.ok &&
      refundData?.ok === true &&
      !(Array.isArray(refundData?.errors) &&
        refundData.errors.length > 0) &&
      refundRecordId === order.refund_id &&
      refundPaymentId === paymentId &&
      sameAmount(refund?.amount, EXPECTED_AMOUNT) &&
      refund?.currency === EXPECTED_CURRENCY &&
      typeof refundStatus === "string";

    if (!validRefund || typeof refundStatus !== "string") {
      console.error(
        "Refund status: MAIB response could not be validated.",
        { httpStatus: refundResponse.status }
      );

      return NextResponse.json(
        {
          error:
            "MAIB не вернул корректный статус возврата. Данные в базе не обновлены. Повторный возврат не создавался.",
        },
        { status: 502 }
      );
    }

    const checkedAt = new Date().toISOString();

    // В MAIB статус Accepted означает, что возврат завершён.
    const isRefunded =
      refundStatus.trim().toLowerCase() === "accepted";

    const updateValues: Record<string, unknown> = {
      refund_status: refundStatus,
      refund_last_checked_at: checkedAt,
    };

    if (isRefunded) {
      updateValues.status = "refunded";
      updateValues.refunded_at = checkedAt;
    }

    const { data: updatedOrders, error: updateError } = await admin
      .from("payment_orders")
      .update(updateValues)
      .eq("checkout_id", checkoutId)
      .eq("user_id", userData.user.id)
      .in("status", ["refund_pending", "refunded"])
      .select("checkout_id, status");

    if (updateError) {
      console.error(
        "Refund status: failed to save status.",
        updateError.code
      );

      return NextResponse.json(
        {
          error:
            "Статус получен, но сохранить его в базе не удалось. Повторный возврат не создавался.",
          refundStatus,
        },
        { status: 502 }
      );
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      console.error(
        "Refund status: no eligible order row was updated."
      );

      return NextResponse.json(
        {
          error:
            "Статус возврата получен, но заказ не был обновлён. Проверь статус заказа в Supabase.",
          refundStatus,
        },
        { status: 409 }
      );
    }

    const updatedOrderStatus = updatedOrders[0].status;

    return NextResponse.json(
      {
        success: true,
        checkoutId,
        refundId: order.refund_id,
        paymentId,
        refundStatus,
        orderStatus: updatedOrderStatus,
        checkedAt,
        message: isRefunded
          ? "MAIB подтвердил завершение возврата."
          : "Статус MAIB обновлён. Возврат пока не подтверждён как завершённый. Повторный возврат не создавался.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Refund status route error.", {
      reason:
        error instanceof Error &&
        error.name === "TimeoutError"
          ? "timeout"
          : "request_error",
    });

    return NextResponse.json(
      {
        error:
          "Не удалось проверить статус возврата. Повторный возврат не создавался.",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}