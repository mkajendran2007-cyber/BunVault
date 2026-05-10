import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: "API_KEY_MISSING", 
        message: "Google Gemini API Key is not configured in system variables. Please add GEMINI_API_KEY to .env.local to enable intelligent insights."
      }, { status: 500 });
    }

    const body = await request.json();
    const { portfolioSummary, name, userQuestion, metrics } = body;

    if (!portfolioSummary) {
      return NextResponse.json({ error: "Payload missing" }, { status: 400 });
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";
    
    const contextData = `
      USER PROFILE: ${name || "Investor"}
      PORTFOLIO HOLDINGS: ${JSON.stringify(portfolioSummary, null, 2)}
      DERIVED METRICS (INTERNAL): ${JSON.stringify(metrics || {}, null, 2)}
    `;

    if (userQuestion) {
       // MODE: Direct Question Answer
       prompt = `
         You are a brilliant financial analyst for "Bun Vault" app.
         Context:
         ${contextData}

         User's specific question: "${userQuestion}"

         Instructions:
         1. Answer the question DIRECTLY and intelligently based ON the data provided.
         2. Keep explanations concise and insightful.
         3. Maintain a supportive, data-driven, friendly tone.
         4. STRICT RULE: NEVER use $ dollar signs. ALWAYS use ₹ rupees.
         5. Keep response strictly under 200 words.
         6. Format elegantly (use **bolding** and * bullets sparingly).
         7. Add very brief legal footer at the end: "Disclaimer: Generative AI insights are not certified financial advice."
       `;
    } else {
       // MODE: Default Full Briefing
       prompt = `
         You are a smart, friendly wealth advisor assistant for "Bun Vault", a modern Indian financial tracking app.
         Context:
         ${contextData}

         Instructions:
         1. Write a short, dynamic, and highly strategic summary of their current assets.
         2. Point out 2 positive strengths and 1 strategic area they should watch.
         3. IMPORTANT: NEVER use dollar symbols ($). ALWAYS use Rupee symbol (₹).
         4. Use clean bullets, bold critical terms, and concise sentences. Keep it under 220 words total.
         5. Add legal footer: "Disclaimer: Generative AI insights are not certified financial advice."
       `;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ analysis: responseText });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "API_FETCH_FAILED", message: error.message || "Failed to connect to Google AI." }, { status: 500 });
  }
}
