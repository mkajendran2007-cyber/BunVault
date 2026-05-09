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
        .filter(item => item.schemeName.toLowerCase().includes(queryLower))
        .slice(0, 15)
        .map(item => ({
          name: item.schemeName,
          symbol: String(item.schemeCode),
          type: "Mutual Fund"
        }));
        
      return NextResponse.json(matches);
    } else if (type === "Equity") {
      const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${q}&quotesCount=20&newsCount=0`);
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
    }
    
    return NextResponse.json([]);
  } catch (e) {
    console.error("Search API error:", e);
    return NextResponse.json([]);
  }
}
