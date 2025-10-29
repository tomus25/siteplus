// app/api/notify-telegram/route.ts
import { NextResponse } from "next/server";

// Гарантируем отсутствие кеша и всегда динамический ответ
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // ✂️ НИКАКИХ domain/locale/ua/time — только минимум
    // Формат:
    // 🆕 Новая заявка
    // Email: <email>        // если есть
    // Описание: <idea>      // если есть
    const lines: string[] = ["🆕 Новая заявка"];
    if (kind === "email" && typeof email === "string" && email.trim()) {
      lines.push(`Email: ${email.trim()}`);
    }
    if (typeof idea === "string" && idea.trim()) {
      lines.push(`Описание: ${idea.trim()}`);
    }

    const text = lines.join("\n");

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Без Markdown/HTML — plain text
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
