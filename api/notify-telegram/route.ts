// app/api/notify-telegram/route.ts
import { NextRequest, NextResponse } from "next/server";

// (опционально) отключим кеш
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { idea, email, domain, locale, userAgent, ts } = await req.json();

    if (!email || !/.+@.+\..+/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Текст сообщения в Telegram
    const text =
`New beta request:
• Idea: ${idea || "(empty)"}
• Email: ${email}
• Domain: ${domain}
• Locale: ${locale}
• UA: ${userAgent}
• Time: ${ts}`;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        { error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID" },
        { status: 500 }
      );
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const tgRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Важно: chat_id строкой (для отрицательных id супер-групп)
      body: JSON.stringify({ chat_id: String(chatId), text }),
    });

    if (!tgRes.ok) {
      const dbg = await tgRes.text();
      return NextResponse.json({ error: "Telegram error", dbg }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
