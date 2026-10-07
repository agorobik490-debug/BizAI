import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        { error: "Требуется авторизация." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length).trim();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    if (!accessToken) {
      return Response.json(
        { error: "Недействительный токен авторизации." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return Response.json(
        { error: "Не удалось подтвердить пользователя." },
        { status: 401 }
      );
    }

    const { data: subscription, error: subscriptionError } =
      await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

    if (subscriptionError) {
      console.error("Ошибка проверки подписки:", subscriptionError);

      return Response.json(
        { error: "Не удалось проверить подписку." },
        { status: 500 }
      );
    }

    const isActivePro =
      subscription?.plan === "pro" &&
      subscription?.status === "active" &&
      (
        !subscription.expires_at ||
        new Date(subscription.expires_at).getTime() > Date.now()
      );

    if (!isActivePro) {
      return Response.json(
        {
          error:
            "Генерация изображений доступна только в BizAI Pro.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const prompt =
      typeof body?.prompt === "string"
        ? body.prompt.trim()
        : "";

    if (!prompt) {
      return Response.json(
        { error: "Введите описание изображения." },
        { status: 400 }
      );
    }

    if (prompt.length > 4000) {
      return Response.json(
        {
          error:
            "Описание изображения слишком длинное. Максимум — 4000 символов.",
        },
        { status: 400 }
      );
    }

    const image = await openai.images.generate({
      model: "gpt-image-2",
      prompt,
      size: "1024x1024",
    });

    const imageData = image.data?.[0]?.b64_json;

    if (!imageData) {
      return Response.json(
        { error: "AI не вернул изображение." },
        { status: 500 }
      );
    }

    return Response.json({
      image: `data:image/png;base64,${imageData}`,
    });
  } catch (error) {
    console.error("BizAI Pro image generation error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось создать изображение.",
      },
      { status: 500 }
    );
  }
}