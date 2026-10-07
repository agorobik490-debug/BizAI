import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getImageDetail(
  quality: string | undefined
): "low" | "high" {
  if (quality === "standard") {
    return "low";
  }

  return "high";
}

export async function POST(request: Request) {
  try {
    const {
      text,
      type,
      tone,
      language,
      quality,
      image,
      videoFrames,
    } = await request.json();

    if (!text?.trim()) {
      return Response.json(
        { error: "Текст не может быть пустым" },
        { status: 400 }
      );
    }

    const hasImage =
      typeof image === "string" &&
      image.startsWith("data:image/");

    const hasVideoFrames =
      Array.isArray(videoFrames) && videoFrames.length > 0;

    console.log("BizAI generate:", {
      hasImage,
      imageType:
        typeof image === "string"
          ? image.substring(0, 30)
          : typeof image,
      videoFrames: hasVideoFrames
        ? videoFrames.length
        : 0,
      quality,
    });

    let imageAnalysis = "";

    /*
     * ШАГ 1.
     * Если есть изображение — сначала отдельно анализируем его.
     */
    if (hasImage) {
      const visionResponse = await client.responses.create({
        model: "gpt-5.6-luna",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
Ты анализируешь изображение для сервиса BizAI.

Очень внимательно изучи изображение и опиши только то, что действительно видно.

Нужно определить:
- что изображено;
- какой товар, объект или сцена показаны;
- внешний вид;
- основные заметные характеристики;
- упаковку, логотипы и читаемый текст, если они действительно видны;
- цвета;
- обстановку;
- важные визуальные детали, которые могут помочь написать бизнес-пост.

Не придумывай характеристики, цену, бренд, модель, размеры, состав, преимущества или другие факты, если их нельзя достоверно определить по изображению.

Не спрашивай пользователя дополнительные данные.

Сделай максимально полезное визуальное описание для следующего шага генерации текста.
`,
              },
              {
                type: "input_image",
                image_url: image,
                detail: getImageDetail(quality),
              },
            ],
          },
        ],
      });

      imageAnalysis =
        visionResponse.output_text?.trim() || "";

      console.log(
        "BizAI image analysis:",
        imageAnalysis
      );
    }

    /*
     * ШАГ 2.
     * Создаём итоговый бизнес-текст.
     */
    const prompt = `
Ты — AI-помощник для малого бизнеса сервиса BizAI.

Создай готовый ${type.toLowerCase()}.

Тон: ${tone}
Язык: ${language}

Запрос пользователя:
${text}

${imageAnalysis
        ? `
АНАЛИЗ ЗАГРУЖЕННОГО ИЗОБРАЖЕНИЯ:

${imageAnalysis}

Очень важно:
- используй информацию из анализа изображения;
- делай текст конкретным относительно того, что изображено;
- не игнорируй изображение;
- не проси пользователя повторно описывать товар или объект;
- не придумывай факты, которых нет в запросе или анализе изображения.
`
        : ""
      }

${hasVideoFrames
        ? `
Пользователь также загрузил видео.

Для анализа переданы отдельные кадры из исходного видео.

Очень важно:
- используй только то, что действительно можно подтвердить по кадрам;
- не придумывай события, действия, результаты, счёт, даты, цифры или другие факты;
- не утверждай, что видел всё видео целиком;
- не утверждай, что слышал звук, речь или музыку;
- если информация не видна или не подтверждается кадрами, не выдумывай её;
- если на кадре читается текст или цифры, используй их только при достаточной уверенности.

Кадры являются только визуальным представлением исходного видео.
`
        : ""
      }

Очень важно:
- не выдумывай цену;
- не выдумывай скидки;
- не выдумывай наличие товара;
- не выдумывай ограниченный тираж или количество;
- не называй материал качественным, премиальным или натуральным, если это не подтверждено;
- не придумывай характеристики, которых нет в запросе или на изображении;
- используй конкретные визуальные детали изображения вместо общих фраз вроде "современный товар" или "стильный товар";
- если товар можно уверенно определить по изображению, обязательно назови его конкретно.

Требования:
- Пиши естественно и понятно.
- Пиши сразу готовый бизнес-текст.
- Не объясняй процесс создания.
- Не добавляй фразы вроде "Вот ваш текст".
- Не проси дополнительные данные, если уже есть достаточно информации из изображения или запроса.
`;

    const inputContent: any[] = [
      {
        type: "input_text",
        text: prompt,
      },
    ];

    /*
     * Если есть видео — добавляем его кадры
     * для дополнительного визуального анализа.
     */
    if (hasVideoFrames) {
      for (const frame of videoFrames) {
        if (
          typeof frame === "string" &&
          frame.startsWith("data:image/")
        ) {
          inputContent.push({
            type: "input_image",
            image_url: frame,
            detail: getImageDetail(quality),
          });
        }
      }
    }

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: [
        {
          role: "user",
          content: inputContent,
        },
      ],
    });

    return Response.json({
      result: response.output_text,
    });
  } catch (error) {
    console.error("AI generation error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}