
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAIB_BASE_URL = "https://sandbox.maibmerchants.md";

export async function GET(request: NextRequest) {
  try {
    const checkoutId = request.nextUrl.searchParams.get("checkoutId");

    if (!checkoutId || !/^[0-9a-f-]{36}$/i.test(checkoutId)) {
      return NextResponse.json(
        { error: "Invalid checkoutId" },
        { status: 400 }
      );
    }

    const clientId = process.env.MAIB_CLIENT_ID;
    const clientSecret = process.env.MAIB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("MAIB credentials are not configured");
      return NextResponse.json(
        { error: "Payment configuration is incomplete" },
        { status: 500 }
      );
    }

    const authResponse = await fetch(
      `${MAIB_BASE_URL}/v2/auth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
        cache: "no-store",
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData?.result?.accessToken) {
      console.error("MAIB authentication failed:", authResponse.status);
      return NextResponse.json(
        { error: "Could not authenticate with payment provider" },
        { status: 502 }
      );
    }

    const token = authData.result.accessToken;
    const tokenType = authData.result.tokenType || "Bearer";

    const statusResponse = await fetch(
      `${MAIB_BASE_URL}/v2/checkouts/${checkoutId}`,
      {
        headers: {
          Authorization: `${tokenType} ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await statusResponse.json();

    if (!statusResponse.ok || !data?.result) {
      console.error("MAIB checkout status failed:", {
        httpStatus: statusResponse.status,
        supportID: data?.supportID,
      });

      return NextResponse.json(
        { error: "Could not verify payment status with MAIB" },
        { status: 502 }
      );
    }

    const result = data.result;
    const status = result.status;
    const amount = Number(result.amount);
    const currency = result.currency;

    const verified =
      status === "Completed" &&
      amount === 3.99 &&
      currency === "MDL";

    return NextResponse.json({
      checkoutId,
      status,
      amount,
      currency,
      verified,
    });
  } catch (error) {
    console.error("Checkout status request failed:", error);

    return NextResponse.json(
      { error: "Internal payment verification error" },
      { status: 500 }
    );
  }
}
