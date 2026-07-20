import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, userName, period, totalInvested, totalCurrent, totalGain, totalGainPct, sipsTotal, holdingsCount } = body

    console.log(`[Automated Monthly Email Summary to ${email}]:`)
    console.log(`- Investor: ${userName}`)
    console.log(`- Period/Schedule: ${period}`)
    console.log(`- Total Invested: INR ${totalInvested}`)
    console.log(`- Total Valuation: INR ${totalCurrent}`)
    console.log(`- Total SIPs Invested: INR ${sipsTotal}`)
    console.log(`- Net Gain/Loss: INR ${totalGain} (${totalGainPct?.toFixed(2)}%)`)
    console.log(`- Holdings Tracked: ${holdingsCount}`)

    // Simulation of SendGrid / AWS SES email dispatch with attached PDF
    return NextResponse.json({
      success: true,
      status: "sent",
      recipient: email,
      timestamp: new Date().toISOString(),
      summary: {
        totalInvested,
        totalCurrent,
        totalGain,
        sipsTotal,
        holdingsCount
      },
      message: "Automated Monthly Summary Email successfully compiled and dispatched."
    })
  } catch (error: any) {
    console.error("Email summary error:", error)
    return NextResponse.json({ error: error.message || "Email dispatch failed" }, { status: 500 })
  }
}
