
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";

const EXPECTED_AMOUNT_CENTS = 399;
const EXPECTED_CURRENCY = "MDL";

type JsonObject = Record<string, unknown>;

type ParsedResponse = {
  data: JsonObject | null;
};

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

async function readJson(
  response: Response
): Promise<ParsedResponse> {
  try {
    const parsed: unknown = await response.json();
    return { data: getObject(parsed) };
  } catch {
    return { data: null };
  }
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(request: NextRequest) {
  try {
    // 1. Проверяем ID Checkout.
    const checkoutId =
      request.nextUrl.searchParams.get("checkoutId");

    if (!checkoutId || !isValidUuid(checkoutId)) {
      return NextResponse.json(
        { error: "Invalid checkoutId." },
        { status: 400 }
      );
    }

    // 2. Получаем серверные учётные данные.
    const clientId = process.env.MAIB_CLIENT_ID;
    const clientSecret = process.env.MAIB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error(
        "MAIB status check: credentials are not configured."
      );

      return NextResponse.json(
        { error: "Payment configuration is incomplete." },
        { status: 500 }
      );
    }

    // 3. Авторизуемся в MAIB.
    const authResponse = await fetch(
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

    const { data: authData } = await readJson(authResponse);
    const authResult = getObject(authData?.result);

    const accessToken = authResult?.accessToken;
    const tokenType = authResult?.tokenType ?? "Bearer";

    if (
      !authResponse.ok ||
      authData?.ok === false ||
      !authResult ||
      typeof accessToken !== "string" ||
      !accessToken ||
      typeof tokenType !== "string" ||
      !tokenType
    ) {
      console.error("MAIB status check: authentication failed.", {
        httpStatus: authResponse.status,
      });

      return NextResponse.json(
        { error: "Could not authenticate with MAIB." },
        { status: 502 }
      );
    }

    // 4. Запрашиваем актуальный статус Checkout у MAIB.
    const statusResponse = await fetch(
      `${MAIB_BASE_URL}/v2/checkouts/${encodeURIComponent(checkoutId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    const { data: statusData } = await readJson(statusResponse);
    const result = getObject(statusData?.result);

    if (
      !statusResponse.ok ||
      statusData === null ||
      statusData.ok === false ||
      !result ||
      (Array.isArray(statusData.errors) &&
        statusData.errors.length > 0)
    ) {
      console.error("MAIB status check failed.", {
        httpStatus: statusResponse.status,
        supportID: statusData?.supportID,
      });

      return NextResponse.json(
        { error: "Could not verify payment status with MAIB." },
        { status: 502 }
      );
    }

    // 5. Проверяем поля ответа.
    const status = result.status;
    const rawAmount = result.amount;
    const currency = result.currency;

    const amount =
      typeof rawAmount === "number" ||
        (typeof rawAmount === "string" &&
          rawAmount.trim() !== "")
        ? Number(rawAmount)
        : NaN;

    const validAmount =
      Number.isFinite(amount) &&
      amount >= 0 &&
      Math.round(amount * 100) === EXPECTED_AMOUNT_CENTS;

    const validCurrency = currency === EXPECTED_CURRENCY;
    const completed = status === "Completed";

    // verified означает, что проверенные поля совпали.
    // Это ещё не подтверждает принадлежность заказа пользователю.
    const verified =
      completed && validAmount && validCurrency;

    // 6. Возвращаем результат без токенов и секретных данных.
    return NextResponse.json(
      {
        checkoutId,
        status:
          typeof status === "string" ? status : "Unknown",
        amount: Number.isFinite(amount) ? amount : null,
        currency:
          typeof currency === "string" ? currency : null,
        verified,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      error.name === "TimeoutError";

    console.error("MAIB status check request failed.", {
      reason: isTimeout ? "timeout" : "request_error",
    });

    return NextResponse.json(
      {
        error: isTimeout
          ? "MAIB request timed out."
          : "Internal payment verification error.",
      },
      { status: 502 }
    );
  }
}
