import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { kind, idea, email, domain } = await req.json();

    // Гео/ИП без запроса геолокации
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      (req as any).ip || "unknown";
    const country =
      req.headers.get("x-vercel-ip-country") || "unknown";

    // Валидация по типам событий
    if (kind === "idea") {
      if (!idea) return NextResponse.json({ error: "Missing idea" }, { status: 400 });
    } else if (kind === "email") {
      if (!email || !/.+@.+\\..+/.test(email)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
    }

    // Формируем разные тексты для TG
    const text =
      kind === "idea"
        ? `New visit (partial):
• Idea: ${idea || "(empty)"}
• Domain: ${domain}
• IP: ${ip}
• Country: ${country}`
        : `New submission (full):
• Idea: ${idea || "(empty)"}
• Email: ${email}
• Domain: ${domain}
• IP: ${ip}
• Country: ${country}`;

    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_CHAT_ID!;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const tgRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
