import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { idea, email, domain, locale, userAgent, ts } = await req.json();

    if (!email || !/.+@.+\..+/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const text =
`New beta request:
• Idea: ${idea || "(empty)"}
• Email: ${email}
• Domain: ${domain}
• Locale: ${locale}
• UA: ${userAgent}
• Time: ${ts}`;

    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_CHAT_ID!;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const tgRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!tgRes.ok) {
      const dbg = await tgRes.text();
      return NextResponse.json({ error: "TG error", dbg }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
