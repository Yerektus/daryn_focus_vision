import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3.8-flash";

const SYSTEM = `Ты детский физический терапевт, который ведёт домашнее занятие ЛФК с ребёнком с ДЦП.
Тебе приходят только числовые метрики позы с камеры (углы суставов, перекосы, число повторений). Изображения ты не видишь.

Правила ответа:
- ровно одна фраза на русском языке, не длиннее 12 слов;
- обращайся к ребёнку на «ты», тепло и спокойно;
- говори про одно конкретное действие: что поправить или чем похвалить;
- если метрики показывают сильный перекос или человек вне кадра, скажи, как встать;
- никаких диагнозов, оценок состояния здоровья и медицинских рекомендаций;
- если данные противоречивы, подбодри и напомни технику из подсказки упражнения;
- не используй длинное тире, ставь запятую или двоеточие.`;

type Payload = {
  exercise?: { title?: string; goal?: string; cue?: string; mode?: string };
  metrics?: Record<string, number | boolean | string>;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY не задан, работают локальные подсказки" },
      { status: 503 },
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter использует эти заголовки для атрибуции трафика
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": "Daryn Focus Vision",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
        max_tokens: 250,
        temperature: 0.6,
        // модели с рассуждениями иначе тратят весь бюджет токенов на reasoning
        // и возвращают пустой content
        reasoning: { enabled: false },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: JSON.stringify({
              exercise: body.exercise ?? {},
              metrics: body.metrics ?? {},
            }).slice(0, 4000),
          },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `OpenRouter: ${response.status} ${text.slice(0, 120)}` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const hint = (data.choices?.[0]?.message?.content ?? "")
      .replace(/\s*—\s*/g, ", ")
      .trim();

    return NextResponse.json({ hint });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "OpenRouter не ответил вовремя" : "Ошибка подсказки" },
      { status: timedOut ? 504 : 500 },
    );
  }
}
