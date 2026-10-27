import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";
const EXPECTED_AMOUNT = 3.99;
const EXPECTED_CURRENCY = "MDL";
type JsonObject = Record<string, unknown>;

function getObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

async function readJson(response: Response): Promise<JsonObject | null> {
  try {
    return getObject(await response.json());
  } catch {
    return null;
  }
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function sameAmount(value: unknown, expected: number): boolean {
  const amount = Number(value);
  return Number.isFinite(amount) && Math.round(amount * 100) === Math.round(expected * 100);
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) {
      return NextResponse.json({ error: "Đ’ĐľĐąĐ´Đ¸ Đ˛ Đ°ĐşĐşĐ°ŃĐ˝Ń‚ BizAI." }, { status: 401 });
    }

    let body: JsonObject | null;
    try {
      body = getObject(await request.json());
    } catch {
      return NextResponse.json({ error: "ĐťĐµĐşĐľŃ€Ń€ĐµĐşŃ‚Đ˝Ń‹Đą JSON-Đ·Đ°ĐżŃ€ĐľŃ." }, { status: 400 });
    }

    const checkoutId = body?.checkoutId;
    if (!validUuid(checkoutId)) {
      return NextResponse.json({ error: "ĐťĐµĐşĐľŃ€Ń€ĐµĐşŃ‚Đ˝Ń‹Đą checkoutId." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const clientId = process.env.MAIB_CLIENT_ID;
    const clientSecret = process.env.MAIB_CLIENT_SECRET;
    if (!supabaseUrl || !supabaseKey || !serviceRoleKey || !clientId || !clientSecret) {
      return NextResponse.json({ error: "ĐˇĐµŃ€Đ˛ĐµŃ€ ĐżŃ€ĐľĐ˛ĐµŃ€ĐşĐ¸ Đ˛ĐľĐ·Đ˛Ń€Đ°Ń‚Đ° Đ˝Đµ Đ˝Đ°ŃŃ‚Ń€ĐľĐµĐ˝." }, { status: 500 });
    }

    const authClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "ĐˇĐµŃŃĐ¸ŃŹ Đ˝ĐµĐ´ĐµĐąŃŃ‚Đ˛Đ¸Ń‚ĐµĐ»ŃŚĐ˝Đ°. Đ’ĐľĐąĐ´Đ¸ Đ·Đ°Đ˝ĐľĐ˛Đľ." }, { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: order, error: orderError } = await admin
      .from("payment_orders")
      .select("checkout_id, user_id, amount, currency, status, refund_id, refund_status")
      .eq("checkout_id", checkoutId)
      .maybeSingle();

    if (orderError) {
      console.error("Refund status: order lookup failed.", orderError.code);
      return NextResponse.json({ error: "ĐťĐµ ŃĐ´Đ°Đ»ĐľŃŃŚ ĐżŃ€ĐľĐ˛ĐµŃ€Đ¸Ń‚ŃŚ Đ·Đ°ĐşĐ°Đ·." }, { status: 500 });
    }
    if (!order || order.user_id !== userData.user.id) {
      return NextResponse.json({ error: "Đ—Đ°ĐşĐ°Đ· Đ˝Đµ Đ˝Đ°ĐąĐ´ĐµĐ˝." }, { status: 404 });
    }
    if (
      !["refund_pending", "refunded"].includes(order.status) ||
      !validUuid(order.refund_id) ||
      !sameAmount(order.amount, EXPECTED_AMOUNT) ||
      order.currency !== EXPECTED_CURRENCY
    ) {
      return NextResponse.json({ error: "ĐŁ Đ·Đ°ĐşĐ°Đ·Đ° Đ˝ĐµŃ‚ ŃĐľŃ…Ń€Đ°Đ˝Ń‘Đ˝Đ˝ĐľĐłĐľ Đ˛ĐľĐ·Đ˛Ń€Đ°Ń‚Đ° Đ´Đ»ŃŹ ĐżŃ€ĐľĐ˛ĐµŃ€ĐşĐ¸." }, { status: 409 });
    }

    const tokenResponse = await fetch(`${MAIB_BASE_URL}/v2/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const tokenData = await readJson(tokenResponse);
    const tokenResult = getObject(tokenData?.result);
    const token = tokenResult?.accessToken;
    const tokenType = tokenResult?.tokenType ?? "Bearer";
    if (!tokenResponse.ok || tokenData?.ok === false || (Array.isArray(tokenData?.errors) && tokenData.errors.length > 0) || typeof token !== "string" || !token || typeof tokenType !== "string") {
      console.error("Refund status: MAIB authentication failed.", { httpStatus: tokenResponse.status });
      return NextResponse.json({ error: "ĐťĐµ ŃĐ´Đ°Đ»ĐľŃŃŚ Đ°Đ˛Ń‚ĐľŃ€Đ¸Đ·ĐľĐ˛Đ°Ń‚ŃŚŃŃŹ Đ˛ MAIB." }, { status: 502 });
    }
    const headers = { Authorization: `${tokenType} ${token}` };

    // Confirm the saved refund belongs to the payment linked to this checkout.
    const checkoutResponse = await fetch(`${MAIB_BASE_URL}/v2/checkouts/${encodeURIComponent(checkoutId)}`, {
      method: "GET", headers, cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const checkoutData = await readJson(checkoutResponse);
    const checkoutResult = getObject(checkoutData?.result);
    const payment = getObject(checkoutResult?.payment);
    const paymentId = payment?.paymentId ?? payment?.PaymentId ?? checkoutResult?.paymentId;
    if (!checkoutResponse.ok || checkoutData?.ok === false || (Array.isArray(checkoutData?.errors) && checkoutData.errors.length > 0) || !validUuid(paymentId)) {
      console.error("Refund status: checkout verification failed.", { httpStatus: checkoutResponse.status });
      return NextResponse.json({ error: "ĐťĐµ ŃĐ´Đ°Đ»ĐľŃŃŚ ĐżŃ€ĐľĐ˛ĐµŃ€Đ¸Ń‚ŃŚ ĐżĐ»Đ°Ń‚Ń‘Đ¶ Đ˛ MAIB." }, { status: 502 });
    }

    const refundResponse = await fetch(`${MAIB_BASE_URL}/v2/payments/refunds/${encodeURIComponent(order.refund_id)}`, {
      method: "GET", headers, cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const refundData = await readJson(refundResponse);
    const refund = getObject(refundData?.result);
    const refundStatus = refund?.status;
    const refundPaymentId = refund?.paymentId;
    const refundRecordId = refund?.id ?? refund?.refundId;
    const validRefund = refundResponse.ok &&
      refundData?.ok === true &&
      !(Array.isArray(refundData?.errors) && refundData.errors.length > 0) &&
      refundRecordId === order.refund_id &&
      refundPaymentId === paymentId &&
      sameAmount(refund?.amount, EXPECTED_AMOUNT) &&
      refund?.currency === EXPECTED_CURRENCY &&
      typeof refundStatus === "string";

    if (!validRefund || typeof refundStatus !== "string") {
      console.error("Refund status: MAIB response could not be validated.", { httpStatus: refundResponse.status });
      return NextResponse.json({ error: "MAIB Đ˝Đµ Đ˛ĐµŃ€Đ˝ŃĐ» ĐżŃ€ĐľĐ˛ĐµŃ€ŃŹĐµĐĽŃ‹Đą ŃŃ‚Đ°Ń‚ŃŃ Đ˛ĐľĐ·Đ˛Ń€Đ°Ń‚Đ°. Đ”Đ°Đ˝Đ˝Ń‹Đµ Đ˛ Đ±Đ°Đ·Đµ Đ˝Đµ Đ¸Đ·ĐĽĐµĐ˝ĐµĐ˝Ń‹; ĐżĐľĐ˛Ń‚ĐľŃ€Đ˝Đľ Đ˛ĐľĐ·Đ˛Ń€Đ°Ń‚ Đ˝Đµ ĐľŃ‚ĐżŃ€Đ°Đ˛Đ»ŃŹĐą." }, { status: 502 });
    }

    const checkedAt = new Date().toISOString();
    // Only the explicit terminal status Refunded marks the order as refunded.
    // Other statuses are recorded verbatim without guessing their meaning.
    const isRefunded = refundStatus === "Refunded";
    const { error: updateError } = await admin
      .from("payment_orders")
      .update({
        refund_status: refundStatus,
        refund_last_checked_at: checkedAt,
        ...(isRefunded ? { status: "refunded", refunded_at: checkedAt } : {}),
      })
      .eq("checkout_id", checkoutId)
      .eq("user_id", userData.user.id)
      .in("status", ["refund_pending", "refunded"]);

    if (updateError) {
      console.error("Refund status: failed to save status.", updateError.code);
      return NextResponse.json({ error: "ĐˇŃ‚Đ°Ń‚ŃŃ ĐżĐľĐ»ŃŃ‡ĐµĐ˝, Đ˝Đľ Đ˝Đµ ŃĐ´Đ°Đ»ĐľŃŃŚ ŃĐľŃ…Ń€Đ°Đ˝Đ¸Ń‚ŃŚ ĐµĐłĐľ Đ˛ Đ±Đ°Đ·Đµ. ĐťĐµ ĐľŃ‚ĐżŃ€Đ°Đ˛Đ»ŃŹĐą ĐżĐľĐ˛Ń‚ĐľŃ€Đ˝Ń‹Đą Đ˛ĐľĐ·Đ˛Ń€Đ°Ń‚.", refundStatus }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      checkoutId,
      refundId: order.refund_id,
      paymentId,
      refundStatus,
      orderStatus: isRefunded ? "refunded" : order.status,
      checkedAt,
      message: isRefunded
        ? "MAIB ĐżĐľĐ´Ń‚Đ˛ĐµŃ€Đ´Đ¸Đ» Đ·Đ°Đ˛ĐµŃ€ŃŃ‘Đ˝Đ˝Ń‹Đą Đ˛ĐľĐ·Đ˛Ń€Đ°Ń‚."
        : "ĐˇŃ‚Đ°Ń‚ŃŃ MAIB ĐľĐ±Đ˝ĐľĐ˛Đ»Ń‘Đ˝. Đ’ĐľĐ·Đ˛Ń€Đ°Ń‚ Đ˝Đµ ĐľŃ‚ĐĽĐµŃ‡ĐµĐ˝ Đ·Đ°Đ˛ĐµŃ€ŃŃ‘Đ˝Đ˝Ń‹ĐĽ; ĐżĐľĐ˛Ń‚ĐľŃ€Đ˝Ń‹Đą Đ·Đ°ĐżŃ€ĐľŃ Đ˝Đµ ĐľŃ‚ĐżŃ€Đ°Đ˛Đ»ŃŹĐ»ŃŃŹ.",
    }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Refund status route error.", {
      reason: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "request_error",
    });
    return NextResponse.json({ error: "ĐťĐµ ŃĐ´Đ°Đ»ĐľŃŃŚ ĐżŃ€ĐľĐ˛ĐµŃ€Đ¸Ń‚ŃŚ ŃŃ‚Đ°Ń‚ŃŃ Đ˛ĐľĐ·Đ˛Ń€Đ°Ń‚Đ°. ĐźĐľĐ˛Ń‚ĐľŃ€Đ˝Đľ Đ˛ĐľĐ·Đ˛Ń€Đ°Ń‚ Đ˝Đµ ĐľŃ‚ĐżŃ€Đ°Đ˛Đ»ŃŹĐą." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

