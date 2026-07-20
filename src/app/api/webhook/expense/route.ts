import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase admin client for background webhook ingestion
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, secret, user_id } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid request body. 'text' field containing SMS or notification string is required." },
        { status: 400 }
      )
    }

    // Optional secret key check if configured
    const expectedSecret = process.env.WEBHOOK_SECRET_KEY
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook secret." }, { status: 401 })
    }

    // 1. SMART NLP PARSER ENGINE
    const parsed = parseTransactionText(text)

    if (!parsed.amount || parsed.amount <= 0) {
      return NextResponse.json({
        success: false,
        message: "Could not extract a valid amount from the provided text.",
        rawText: text
      }, { status: 422 })
    }

    // 2. Resolve target user_id (if not explicitly passed, query the most recently active user from Supabase or allow client-side sync)
    let targetUserId = user_id
    if (!targetUserId && supabaseUrl && supabaseKey) {
       const { data: recentExpense } = await supabase
         .from("expenses")
         .select("user_id")
         .not("user_id", "is", null)
         .limit(1)
       if (recentExpense && recentExpense.length > 0) {
         targetUserId = recentExpense[0].user_id
       }
    }

    // 3. Construct Expense Record
    const expenseRecord = {
      user_id: targetUserId || "anon-webhook-user",
      date: new Date().toISOString().split("T")[0],
      amount: parsed.amount,
      category: parsed.category,
      category_icon: parsed.icon,
      description: parsed.description,
      payment_mode: parsed.paymentMode,
      type: parsed.type,
      created_at: new Date().toISOString()
    }

    // 4. Insert into Supabase (if configured)
    let dbStatus = "Stored locally or awaiting user sync"
    if (supabaseUrl && supabaseKey && targetUserId) {
      const { error } = await supabase.from("expenses").insert([expenseRecord])
      if (!error) {
        dbStatus = "Successfully inserted into Supabase cloud database"
      } else {
        dbStatus = `Supabase insert warning: ${error.message}`
      }
    }

    return NextResponse.json({
      success: true,
      message: "🎉 Transaction parsed and logged automatically!",
      data: expenseRecord,
      dbStatus
    }, { status: 200 })

  } catch (error: any) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

// Helper function: Smart NLP Transaction Parser
function parseTransactionText(text: string) {
  const clean = text.trim().replace(/\r?\n|\r/g, " ")

  // A. Extract Amount
  let amount = 0
  const amountRegex1 = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i
  const amountRegex2 = /(?:debited|spent|paid|amount of|sent)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i
  
  const match1 = clean.match(amountRegex1)
  const match2 = clean.match(amountRegex2)

  if (match1 && match1[1]) {
    amount = parseFloat(match1[1].replace(/,/g, ""))
  } else if (match2 && match2[1]) {
    amount = parseFloat(match2[1].replace(/,/g, ""))
  }

  // B. Extract Transaction Type (Expense vs Income vs Transfer)
  let type: "Expense" | "Income" | "Transfer" = "Expense"
  if (/(?:credited|received|salary|refund|cashback|added to)/i.test(clean) && !/(?:debited|spent|paid)/i.test(clean)) {
    type = "Income"
  } else if (/(?:credit card bill|repayment|transfer to own|card payment)/i.test(clean)) {
    type = "Transfer"
  }

  // C. Extract Payment Mode
  let paymentMode = "Bank Account"
  if (/(?:credit card|card xx|card ending|utkarsh|hdfc cc|icici cc|sbi card|amex)/i.test(clean)) {
    paymentMode = "Credit Card"
  } else if (/(?:gpay|google pay|upi|phonepe|paytm|bhim)/i.test(clean)) {
    paymentMode = "Bank Account (UPI)"
  } else if (/(?:cash|atm withdrawal)/i.test(clean)) {
    paymentMode = "Cash"
  }

  // D. Extract Merchant & Auto-Assign Category
  let category = "General Expense"
  let icon = "💸"
  let description = "GPay / Bank Transaction"

  const extractMerchant = () => {
    const merchantMatch = clean.match(/(?:to|at|info:|vpa|merchant|towards)\s+([A-Za-z0-9\s&._-]+?)(?:\s+(?:on|via|ref|upi|avl|from|inr|rs|date|\.|$))/i)
    if (merchantMatch && merchantMatch[1] && merchantMatch[1].trim().length > 2) {
      return merchantMatch[1].trim()
    }
    return null
  }

  const foundMerchant = extractMerchant()
  if (foundMerchant) {
    description = foundMerchant
  }

  const lower = clean.toLowerCase() + " " + description.toLowerCase()

  if (/(?:swiggy|zomato|restaurant|cafe|food|starbucks|mcdonalds|dominos|pizza|kfc|chai|bakery|dining)/i.test(lower)) {
    category = "Dining & Food"
    icon = "🍔"
  } else if (/(?:blinkit|zepto|instamart|bigbasket|grocery|supermarket|dmart|milk|vegetables|fruits|provisions)/i.test(lower)) {
    category = "Groceries"
    icon = "🛒"
  } else if (/(?:amazon|flipkart|myntra|zara|h&m|clothing|mall|shopping|retail|store|decathlon|croma)/i.test(lower)) {
    category = "Shopping"
    icon = "🛍️"
  } else if (/(?:uber|ola|rapido|metro|fuel|petrol|diesel|shell|hpcl|bpcl|parking|toll|fastag|cab)/i.test(lower)) {
    category = "Transportation"
    icon = "🚗"
  } else if (/(?:netflix|spotify|prime|hotstar|pvr|movie|cinema|bookmyshow|game|playstation|youtube)/i.test(lower)) {
    category = "Entertainment"
    icon = "🎬"
  } else if (/(?:bescom|airtel|jio|vi|vodafone|wifi|broadband|electricity|gas|water|bill|recharge)/i.test(lower)) {
    category = "Utilities"
    icon = "💡"
  } else if (/(?:pharmacy|apollo|1mg|doctor|hospital|medical|medicine|gym|fitness|clinic)/i.test(lower)) {
    category = "Healthcare"
    icon = "🏥"
  } else if (/(?:rent|maintenance|housing|society)/i.test(lower)) {
    category = "Rent & Housing"
    icon = "🏠"
  } else if (type === "Income") {
    category = "Salary / Income"
    icon = "💰"
    if (!foundMerchant) description = "Direct Credit / Income"
  }

  if (description === "GPay / Bank Transaction" && paymentMode === "Bank Account (UPI)") {
    description = `GPay UPI Spend (${category})`
  }

  return {
    amount,
    type,
    paymentMode,
    category,
    icon,
    description
  }
}
