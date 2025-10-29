// app/api/notify-telegram/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { kind, idea, email } = await req.json();

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { error: "Server is not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" },
        { status: 500 }
      );
    }

    // Текст «минимализм»: три пункта. Если email нет — только 2 пункта.
    const lines: string[] = ["🆕 Новая заявка"];
    if (kind === "email" && email) {
      lines.push(`Email: ${String(email).trim()}`);
    }
    if (idea) {
      lines.push(`Описание: ${String(idea).trim()}`);
    }

    const text = lines.join("\n");

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Без форматирования, чтобы не было сюрпризов с Markdown/HTML
      body: JSON.stringify({ chat_id: chatId, text }),
      cache: "no-store",
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      return NextResponse.json({ error: `Telegram error: ${err}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 400 });
  }
}
