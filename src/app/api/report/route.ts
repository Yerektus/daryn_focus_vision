import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3.8-flash";

const SYSTEM = `Ты детский физический терапевт. Родитель прислал итоги домашнего занятия ЛФК
с ребёнком с ДЦП: упражнение, его цель и числовые метрики с камеры (проценты времени с перекосом,
доля времени в кадре, число повторений, недоведённые повторения). Видео ты не видишь.

Формат ответа:
- три коротких пункта, каждый с новой строки, каждый начинается с «- »;
- первый пункт про то, что получилось хорошо;
- второй и третий про то, что поправить на следующем занятии, с конкретным действием;
- пиши по-русски, обращайся к родителю на «вы», спокойно и без оценок здоровья;
- не ставь диагнозов, не назначай лечение, не обещай результатов;
- каждый пункт не длиннее 20 слов;
- не используй длинное тире, ставь запятую или двоеточие.`;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY не задан, показан разбор по локальным правилам" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const ask = () =>
    fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": "Daryn Focus Vision",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
        max_tokens: 700,
        temperature: 0.5,
        // без этого рассуждающая модель отдаёт пустой content
        reasoning: { enabled: false },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify(body).slice(0, 4000) },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });

  try {
    let response = await ask();
    // провайдер иногда отдаёт короткий rate-limit: одна повторная попытка
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      response = await ask();
    }

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
    const report = (data.choices?.[0]?.message?.content ?? "")
      .replace(/\s*—\s*/g, ", ")
      .trim();
    return NextResponse.json({ report });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { error: timedOut ? "OpenRouter не ответил вовремя" : "Ошибка разбора" },
      { status: timedOut ? 504 : 500 },
    );
  }
}
