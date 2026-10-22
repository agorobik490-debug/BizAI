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

/**
 * Logs only a short, bounded view of the provider's error objects.
 * Never log client credentials or access tokens.
 */
function safeApiErrors(value: unknown): unknown {
  if (!Array.isArray(value)) return undefined;

  return value.slice(0, 5).map((item) => {
    if (typeof item === "string") return item.slice(0, 300);

    const obj = getObject(item);
    if (!obj) return "Unrecognized MAIB error";

    const safe: Record<string, unknown> = {};

    for (const key of ["code", "errorCode", "message", "errorMessage", "field"]) {
      const field = obj[key];
      if (typeof field === "string") safe[key] = field.slice(0, 300);
    }

    return Object.keys(safe).length > 0 ? safe : "MAIB returned an error object";
  });
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

    // Temporary sandbox amount; this is controlled server-side.
    const amount = 3.99;
    const currency = "MDL";

    // 1. Request a MAIB access token.
    const tokenResponse = await fetch(`${MAIB_BASE_URL}/v2/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
      }),
      cache: "no-store",
    });

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
            ? tokenData.message.slice(0, 300)
            : typeof tokenData?.error === "string"
              ? tokenData.error.slice(0, 300)
              : undefined,
        apiErrors: safeApiErrors(tokenData?.errors),
      });

      return NextResponse.json(
        { error: "Could not authenticate with MAIB." },
        { status: 502 }
      );
    }

    // 2. Create a hosted checkout session.
    const checkoutResponse = await fetch(`${MAIB_BASE_URL}/v2/checkouts`, {
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
    });

    const { data: checkoutData, raw } = await readResponse(checkoutResponse);

    const checkoutResult = getObject(checkoutData?.result);
    const checkoutUrl = checkoutResult?.checkoutUrl;

    const checkoutErrors = checkoutData?.errors;
    const hasApiErrors =
      Array.isArray(checkoutErrors) && checkoutErrors.length > 0;

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
      console.error("MAIB checkout creation failed:", {
        httpStatus: checkoutResponse.status,
        responseIsJson: checkoutData !== null,
        responseKeys: checkoutData ? Object.keys(checkoutData) : [],
        errors: safeApiErrors(checkoutErrors),
        resultKeys: checkoutResult ? Object.keys(checkoutResult) : [],
        apiOk: checkoutData?.ok,
        apiError:
          typeof checkoutData?.message === "string"
            ? checkoutData.message.slice(0, 300)
            : typeof checkoutData?.error === "string"
              ? checkoutData.error.slice(0, 300)
              : undefined,
        responsePreview: checkoutData ? undefined : raw.slice(0, 300),
      });

      return NextResponse.json(
        { error: "Could not create MAIB checkout. Check server logs." },
        { status: 502 }
      );
    }

    // Return only the hosted payment URL to the browser.
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("Checkout route error:", {
      message:
        error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "An unexpected payment error occurred." },
      { status: 500 }
    );
  }
}
