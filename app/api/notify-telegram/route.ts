// app/api/notify-telegram/route.ts
import { NextResponse } from "next/server";

// Всегда динамически, без кэша
export const dynamic = "force-dynamic";
export const revalidate = 0;

function trimStr(v: unknown, max = 800) {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export async function POST(req: Request) {
  try {
    const { kind, idea, email } = await req.json();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      return NextResponse.json(
        { error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" },
        { status: 500 }
      );
    }

    const cleanIdea = trimStr(idea);
    const cleanEmail = trimStr(email, 256);

    // Форматируем 2 вида сообщений
    // 1) первичное (только описание)
    // 2) вторичное (добавлен email)
    let lines: string[] = [];

    if (kind === "email" && cleanEmail) {
      // Дополнение
      lines = [
        "✨ Новая заявка • Дополнение",
        `📧 Email: ${cleanEmail}`,
        cleanIdea ? `📝 Описание: ${cleanIdea}` : undefined,
      ].filter(Boolean) as string[];
    } else {
      // Первый вход
      lines = [
        "✨ Новая заявка • Первый вход",
        cleanIdea ? `📝 Описание: ${cleanIdea}` : "📝 Описание: —",
      ];
    }

    const text = lines.join("\n");

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Без Markdown/HTML — надёжный plain text
      body: JSON.stringify({ chat_id: chatId, text }),
      cache: "no-store",
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      return NextResponse.json({ error: `Telegram error: ${err}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Bad request" }, { status: 400 });
  }
}
