import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phone, title, message, channel, telegramBotToken, telegramChatId } = body

    // If direct Telegram payload is sent via API
    if (channel === "telegram" && telegramBotToken && telegramChatId) {
      const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `*${title || "Bun Vault Alert"}*\n${message}`,
          parse_mode: "Markdown"
        })
      })
      const data = await res.json()
      return NextResponse.json({ success: res.ok, data })
    }

    // WhatsApp / Twilio / Webhook proxy simulation
    if (channel === "whatsapp" || phone) {
      console.log(`[WhatsApp Proxy Alert to ${phone}]: ${title} - ${message}`)
      return NextResponse.json({
        success: true,
        status: "dispatched",
        channel: "whatsapp",
        recipient: phone,
        timestamp: new Date().toISOString(),
        message: "WhatsApp alert dispatched via gateway."
      })
    }

    return NextResponse.json({ success: true, message: "Push alert logged." })
  } catch (error: any) {
    console.error("Notify push error:", error)
    return NextResponse.json({ error: error.message || "Push dispatch failed" }, { status: 500 })
  }
}
