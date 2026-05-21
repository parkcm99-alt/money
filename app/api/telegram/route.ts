import { NextResponse } from "next/server";

type TelegramRequestBody = {
  message?: unknown;
};

type TelegramApiResponse = {
  description?: string;
  ok?: boolean;
};

const missingEnvResponse = {
  ok: false,
  message: "텔레그램 환경변수가 설정되지 않았습니다."
} as const;

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return NextResponse.json(missingEnvResponse);
  }

  let body: TelegramRequestBody;

  try {
    body = (await request.json()) as TelegramRequestBody;
  } catch {
    return NextResponse.json({
      ok: false,
      message: "요청 본문을 읽을 수 없습니다."
    });
  }

  if (typeof body.message !== "string" || body.message.trim().length === 0) {
    return NextResponse.json({
      ok: false,
      message: "발송할 리포트 메시지가 없습니다."
    });
  }

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        body: JSON.stringify({
          chat_id: chatId,
          text: body.message
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    const result = (await telegramResponse.json()) as TelegramApiResponse;

    if (!telegramResponse.ok || !result.ok) {
      return NextResponse.json({
        ok: false,
        message: result.description || "텔레그램 발송에 실패했습니다."
      });
    }

    return NextResponse.json({
      ok: true,
      message: "텔레그램 리포트를 발송했습니다."
    });
  } catch {
    return NextResponse.json({
      ok: false,
      message: "텔레그램 API 호출 중 오류가 발생했습니다."
    });
  }
}
