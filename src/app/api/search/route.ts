import { NextResponse } from "next/server";

let cachedMfList: any[] = [];
let lastFetched = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "Equity";

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "application/json"
    };

    if (type === "Mutual Fund") {
      const now = Date.now();
      // Cache for 1 hour to prevent excessive hits while keeping it fresh
      if (cachedMfList.length === 0 || now - lastFetched > 60 * 60 * 1000) {
        const res = await fetch("https://api.mfapi.in/mf");
        cachedMfList = await res.json();
        lastFetched = now;
      }
      
      const queryLower = q.toLowerCase();
      const matches = cachedMfList
        .filter(item => item.schemeName && item.schemeName.toLowerCase().includes(queryLower))
        .slice(0, 15)
        .map(item => ({
          name: item.schemeName,
          symbol: String(item.schemeCode),
          type: "Mutual Fund"
        }));
        
      return NextResponse.json(matches);
    } else if (type === "Equity") {
      const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=20&newsCount=0`, { headers });
      const data = await res.json();
      
      if (data.quotes) {
        const matches = data.quotes
          .filter((q: any) => q.quoteType === "EQUITY" || q.symbol.endsWith(".NS") || q.symbol.endsWith(".BO"))
          .slice(0, 15)
          .map((q: any) => ({
            name: q.shortname || q.longname || q.symbol,
            symbol: q.symbol,
            type: "Equity"
          }));
        return NextResponse.json(matches);
      }
    } else if (type === "Crypto") {
      const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=20&newsCount=0`, { headers });
      const data = await res.json();
      
      if (data.quotes) {
        const matches = data.quotes
          .filter((q: any) => q.quoteType === "CRYPTOCURRENCY")
          .slice(0, 15)
          .map((q: any) => {
             // Re-map global -USD ticker to local -INR ticker if needed
             const baseSymbol = q.symbol.endsWith("-USD") ? q.symbol.replace("-USD", "-INR") : q.symbol;
             return {
                name: q.shortname || q.longname || q.symbol,
                symbol: baseSymbol,
                type: "Crypto"
             };
          });
        return NextResponse.json(matches);
      }
    }
    
    return NextResponse.json([]);
  } catch (e) {
    console.error("Search API error:", e);
    return NextResponse.json([]);
  }
}
