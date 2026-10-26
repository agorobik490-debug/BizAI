
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";
const EXPECTED_AMOUNT = 3.99;
const EXPECTED_CURRENCY = "MDL";

export async function GET(request: NextRequest) {
  try {
    const checkoutId = request.nextUrl.searchParams.get("checkoutId");
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (
      !checkoutId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(checkoutId)
    ) {
      return NextResponse.json(
        { error: "Invalid checkoutId." },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
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
      console.error("Payment status environment configuration is incomplete.");
      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 500 }
      );
    }

    // Verify the signed-in user.
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
        { error: "Please sign in again." },
        { status: 401 }
      );
    }

    // Use the service role only on the server.
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Ensure this checkout belongs to the signed-in user.
    const { data: order, error: orderError } = await admin
      .from("payment_orders")
      .select("checkout_id, user_id, amount, currency, status")
      .eq("checkout_id", checkoutId)
      .maybeSingle();

    if (orderError) {
      console.error("Could not load payment order:", orderError.message);
      return NextResponse.json(
        { error: "Could not load payment order." },
        { status: 500 }
      );
    }

    if (!order || order.user_id !== userData.user.id) {
      return NextResponse.json(
        { error: "Payment order not found." },
        { status: 404 }
      );
    }

    // A previously activated order must not be applied again.
    if (order.status === "paid") {
      return NextResponse.json({
        status: "Completed",
        amount: Number(order.amount),
        currency: order.currency,
        verified: true,
        activated: true,
      });
    }

    if (order.status !== "pending") {
      return NextResponse.json({
        status: order.status,
        verified: false,
        activated: false,
      });
    }

    // Authenticate with MAIB.
    const tokenResponse = await fetch(
      `${MAIB_BASE_URL}/v2/auth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
        cache: "no-store",
      }
    );

    const tokenData = await tokenResponse.json();
    const token = tokenData?.result?.accessToken;
    const tokenType = tokenData?.result?.tokenType;

    if (
      !tokenResponse.ok ||
      typeof token !== "string" ||
      typeof tokenType !== "string" ||
      tokenData?.errors
    ) {
      console.error("MAIB authentication failed:", {
        httpStatus: tokenResponse.status,
      });
      return NextResponse.json(
        { error: "MAIB authentication failed." },
        { status: 502 }
      );
    }

    // Ask MAIB for the real checkout status.
    const statusResponse = await fetch(
      `${MAIB_BASE_URL}/v2/checkouts/${encodeURIComponent(checkoutId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `${tokenType} ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await statusResponse.json();


    if (
      !statusResponse.ok ||
      !data?.result ||
      data?.ok === false ||
      data?.errors
    ) {
      console.error("MAIB checkout status request failed:", {
        httpStatus: statusResponse.status,
        responseBody: JSON.stringify(data ?? null).slice(0, 2000),
      });

      return NextResponse.json(
        { error: "MAIB could not verify this checkout." },
        { status: 502 }
      );
    }


    const checkout = data.result;
    const status =
      typeof checkout.status === "string"
        ? checkout.status
        : "Unknown";

    const amount = Number(checkout.amount);
    const currency = checkout.currency;

    const verified =
      status === "Completed" &&
      Number.isFinite(amount) &&
      Math.round(amount * 100) === Math.round(EXPECTED_AMOUNT * 100) &&
      Math.round(Number(order.amount) * 100) ===
      Math.round(EXPECTED_AMOUNT * 100) &&
      currency === EXPECTED_CURRENCY &&
      order.currency === EXPECTED_CURRENCY;

    if (!verified) {
      return NextResponse.json({
        status,
        amount: Number.isFinite(amount) ? amount : null,
        currency: typeof currency === "string" ? currency : null,
        verified: false,
        activated: false,
      });
    }

    // Activate only after MAIB and the saved order both match.
    const { data: activation, error: activationError } =
      await admin.rpc("activate_bizai_pro", {
        p_checkout_id: checkoutId,
      });

    if (activationError || activation?.ok !== true) {
      console.error("Pro activation failed:", {
        message: activationError?.message,
        activationError: activation?.error,
      });
      return NextResponse.json(
        { error: "Payment verified, but Pro activation failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status,
      amount,
      currency,
      verified: true,
      activated: true,
      alreadyActivated: activation.already_activated === true,
    });
  } catch (error) {
    console.error(
      "Checkout status route error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Unexpected payment verification error." },
      { status: 500 }
    );
  }
}
