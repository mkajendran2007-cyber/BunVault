import { NextResponse } from "next/server";

// Simple in-memory cache to prevent redundant external API calls and rate limits.
interface CacheEntry {
  price: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  currency: string;
  timestamp: number;
}

const priceCache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Support both singular 'symbol' and plural 'symbols' (comma separated)
  const symbolsParam = searchParams.get("symbols") || searchParams.get("symbol");

  if (!symbolsParam) {
    return NextResponse.json({ error: "Symbols required" }, { status: 400 });
  }

  // Split, remove duplicates and clean
  const symbols = Array.from(new Set(symbolsParam.split(",").map(s => s.trim()).filter(Boolean)));
  
  const results: Record<string, any> = {};
  const uncachedSymbols: string[] = [];

  // 1. Pull from Cache first
  const now = Date.now();
  for (const sym of symbols) {
    if (priceCache[sym] && (now - priceCache[sym].timestamp < CACHE_TTL_MS)) {
      results[sym] = {
        symbol: sym,
        price: priceCache[sym].price,
        previousClose: priceCache[sym].previousClose,
        change: priceCache[sym].change,
        changePercent: priceCache[sym].changePercent,
        currency: priceCache[sym].currency,
        timestamp: new Date(priceCache[sym].timestamp).toISOString(),
        cached: true
      };
    } else {
      uncachedSymbols.push(sym);
    }
  }

  if (uncachedSymbols.length === 0) {
    return NextResponse.json(results);
  }

  // 2. Categorize uncached symbols
  const customMetals = uncachedSymbols.filter(s => s === "GOLD_INR_1G" || s === "SILVER_INR_1G");
  const mutualFunds = uncachedSymbols.filter(s => /^\d{5,6}$/.test(s));
  const yahooSymbols = uncachedSymbols.filter(s => 
    s !== "GOLD_INR_1G" && s !== "SILVER_INR_1G" && !(/^\d{5,6}$/.test(s))
  );

  const fetchPromises: Promise<void>[] = [];

  // -- Category A: Custom Metals (Gold/Silver 1g INR)
  if (customMetals.length > 0) {
     fetchPromises.push((async () => {
        try {
           // Fetch both metal futures and USD/INR
           // We fetch once and reuse for both Gold and Silver if both requested
           const [gcRes, siRes, inrRes] = await Promise.all([
              fetch(`https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d`),
              fetch(`https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d`),
              fetch(`https://query1.finance.yahoo.com/v8/finance/chart/INR=X?interval=1d`)
           ]);

           const gcData = await gcRes.json().catch(() => null);
           const siData = await siRes.json().catch(() => null);
           const inrData = await inrRes.json().catch(() => null);

           if (inrData?.chart?.result?.[0]) {
              const inrResult = inrData.chart.result[0];
              const inrRate = inrResult.meta.regularMarketPrice;
              const inrPrev = inrResult.meta.chartPreviousClose || inrRate;
              const GRAMS_PER_OUNCE = 31.1034768;
              const calculatePrice = (usdOunce: number, inrConversion: number, multiplier: number) => (usdOunce / GRAMS_PER_OUNCE) * inrConversion * multiplier;

              // Helper function for processing
              const processMetal = (sym: string, data: any, multiplier: number) => {
                 if (data?.chart?.result?.[0]) {
                    const meta = data.chart.result[0].meta;
                    const usdPrice = meta.regularMarketPrice;
                    const usdPrev = meta.chartPreviousClose || usdPrice;
                    const currentINR = calculatePrice(usdPrice, inrRate, multiplier);
                    const prevINR = calculatePrice(usdPrev, inrPrev, multiplier);
                    const change = currentINR - prevINR;
                    
                    const entry = {
                       price: currentINR,
                       previousClose: prevINR,
                       change: change,
                       changePercent: prevINR > 0 ? (change / prevINR) * 100 : 0,
                       currency: "INR",
                       timestamp: now
                    };
                    priceCache[sym] = entry;
                    results[sym] = { ...entry, symbol: sym, timestamp: new Date().toISOString() };
                 }
              };

              if (customMetals.includes("GOLD_INR_1G")) processMetal("GOLD_INR_1G", gcData, 1.06);
              if (customMetals.includes("SILVER_INR_1G")) processMetal("SILVER_INR_1G", siData, 1.09);
           }
        } catch (e) {
           console.error("Metals fetch error:", e);
        }
     })());
  }

  // -- Category B: Mutual Funds (mfapi.in) - Parallel calls bounded
  mutualFunds.forEach(mfSymbol => {
     fetchPromises.push((async () => {
        try {
           const mfRes = await fetch(`https://api.mfapi.in/mf/${mfSymbol}`, { next: { revalidate: 300 } });
           const mfData = await mfRes.json();
           if (mfData.status === "SUCCESS" && mfData.data?.[0]) {
              const latestNav = parseFloat(mfData.data[0].nav);
              // Check for previous day's NAV if available to calculate daily change
              const prevNav = mfData.data[1] ? parseFloat(mfData.data[1].nav) : latestNav;
              const change = latestNav - prevNav;
              
              const entry = {
                 price: latestNav,
                 previousClose: prevNav,
                 change: change,
                 changePercent: prevNav > 0 ? (change / prevNav) * 100 : 0,
                 currency: "INR",
                 timestamp: now
              };
              priceCache[mfSymbol] = entry;
              results[mfSymbol] = { ...entry, symbol: mfSymbol, timestamp: new Date().toISOString() };
           }
        } catch (e) {
           console.error(`Mutual Fund ${mfSymbol} fetch error:`, e);
        }
     })());
  });

  // -- Category C: Yahoo Finance (Restored via permissive Chart API iterate)
  if (yahooSymbols.length > 0) {
     yahooSymbols.forEach(sym => {
        fetchPromises.push((async () => {
           try {
              // Pivot away from restricted 'quote' endpoint to permissive 'chart' endpoint
              const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d`);
              const data = await res.json();
              
              if (data.chart?.result?.[0]) {
                 const meta = data.chart.result[0].meta;
                 const price = meta.regularMarketPrice;
                 const prevClose = meta.chartPreviousClose || price;
                 const change = price - prevClose;
                 const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
                 const currency = meta.currency || "INR";

                 const entry = {
                    price: price,
                    previousClose: prevClose,
                    change: change,
                    changePercent: changePercent,
                    currency: currency,
                    timestamp: now
                 };
                 priceCache[sym] = entry;
                 results[sym] = { ...entry, symbol: sym, timestamp: new Date().toISOString() };
              }
           } catch (e) {
              console.error(`Yahoo Finance chart relay error for ${sym}:`, e);
           }
        })());
     });
  }

  // Wait for all categorization fetch queries to resolve
  await Promise.allSettled(fetchPromises);

  // Final pass: Ensure that if single symbol was requested we might want legacy flat response?
  // But modern API design usually handles multiple in object form.
  // For backwards compatibility, if ONE symbol was asked, AND it wasn't comma split origin, return object directly?
  // Wait, let's just standardize the response map. It's cleaner.
  // Let's check if request had only ONE item and fallback if necessary so we don't break anything immediately.
  // However, standardizing to `{ [symbol]: data }` is much safer. Let's do that but include fallback for simple singular return
  
  const isSingleQuery = symbolsParam.split(",").length === 1 && !symbolsParam.includes(",");
  
  if (isSingleQuery && symbols.length > 0) {
     const singleSym = symbols[0];
     if (results[singleSym]) {
        return NextResponse.json(results[singleSym]);
     } else {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 404 });
     }
  }

  // Return bulk format map
  return NextResponse.json(results);
}

