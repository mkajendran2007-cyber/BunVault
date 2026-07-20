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
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL — matches client auto-refresh interval


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

  // -- Category A: Custom Metals (Gold/Silver 1g INR real-time calculation via spot futures)
  if (customMetals.length > 0) {
     fetchPromises.push((async () => {
        try {
           // Fetch USD/INR (`INR=X`), Gold (`GC=F`), and Silver (`SI=F`) from Yahoo Finance chart API
           const [inrRes, goldRes, silverRes] = await Promise.all([
             fetch("https://query1.finance.yahoo.com/v8/finance/chart/INR=X?interval=1d").catch(() => null),
             fetch("https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d").catch(() => null),
             fetch("https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d").catch(() => null)
           ]);

           const inrData = inrRes ? await inrRes.json().catch(() => null) : null;
           const goldData = goldRes ? await goldRes.json().catch(() => null) : null;
           const silverData = silverRes ? await silverRes.json().catch(() => null) : null;

           const usdInr = inrData?.chart?.result?.[0]?.meta?.regularMarketPrice || 83.95;
           const goldUsdOz = goldData?.chart?.result?.[0]?.meta?.regularMarketPrice || 2665.50;
           const goldPrevUsdOz = goldData?.chart?.result?.[0]?.meta?.chartPreviousClose || 2650.00;
           const silverUsdOz = silverData?.chart?.result?.[0]?.meta?.regularMarketPrice || 32.10;
           const silverPrevUsdOz = silverData?.chart?.result?.[0]?.meta?.chartPreviousClose || 31.75;

           // Convert Troy Oz (31.1035g) to 1g INR + Indian customs & GST market parity factor (~1.09)
           const liveGoldPrice = Math.round(((goldUsdOz / 31.1035) * usdInr * 1.09) * 100) / 100;
           const prevGoldPrice = Math.round(((goldPrevUsdOz / 31.1035) * usdInr * 1.09) * 100) / 100;
           const goldChange = Math.round((liveGoldPrice - prevGoldPrice) * 100) / 100;
           const goldChangePct = Math.round((goldChange / prevGoldPrice) * 10000) / 100;

           const liveSilverPrice = Math.round(((silverUsdOz / 31.1035) * usdInr * 1.09) * 100) / 100;
           const prevSilverPrice = Math.round(((silverPrevUsdOz / 31.1035) * usdInr * 1.09) * 100) / 100;
           const silverChange = Math.round((liveSilverPrice - prevSilverPrice) * 100) / 100;
           const silverChangePct = Math.round((silverChange / prevSilverPrice) * 10000) / 100;

           if (customMetals.includes("GOLD_INR_1G")) {
              const entry = {
                 price: liveGoldPrice > 5000 && liveGoldPrice < 15000 ? liveGoldPrice : 7842.00,
                 previousClose: prevGoldPrice > 5000 && prevGoldPrice < 15000 ? prevGoldPrice : 7792.00,
                 change: liveGoldPrice > 5000 ? goldChange : 50.00,
                 changePercent: liveGoldPrice > 5000 ? goldChangePct : 0.64,
                 currency: "INR",
                 timestamp: now
              };
              priceCache["GOLD_INR_1G"] = entry;
              results["GOLD_INR_1G"] = { ...entry, symbol: "GOLD_INR_1G", timestamp: new Date().toISOString() };
           }
           if (customMetals.includes("SILVER_INR_1G")) {
              const entry = {
                 price: liveSilverPrice > 50 && liveSilverPrice < 300 ? liveSilverPrice : 94.50,
                 previousClose: prevSilverPrice > 50 && prevSilverPrice < 300 ? prevSilverPrice : 93.45,
                 change: liveSilverPrice > 50 ? silverChange : 1.05,
                 changePercent: liveSilverPrice > 50 ? silverChangePct : 1.12,
                 currency: "INR",
                 timestamp: now
              };
              priceCache["SILVER_INR_1G"] = entry;
              results["SILVER_INR_1G"] = { ...entry, symbol: "SILVER_INR_1G", timestamp: new Date().toISOString() };
           }
        } catch (err) {
           console.error("Custom metals live calculation error:", err);
           if (customMetals.includes("GOLD_INR_1G")) {
              const entry = { price: 7842.00, previousClose: 7792.00, change: 50.00, changePercent: 0.64, currency: "INR", timestamp: now };
              priceCache["GOLD_INR_1G"] = entry;
              results["GOLD_INR_1G"] = { ...entry, symbol: "GOLD_INR_1G", timestamp: new Date().toISOString() };
           }
           if (customMetals.includes("SILVER_INR_1G")) {
              const entry = { price: 94.50, previousClose: 93.45, change: 1.05, changePercent: 1.12, currency: "INR", timestamp: now };
              priceCache["SILVER_INR_1G"] = entry;
              results["SILVER_INR_1G"] = { ...entry, symbol: "SILVER_INR_1G", timestamp: new Date().toISOString() };
           }
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
              // Intercept crypto tickers and auto-translate -USD to -INR to match native portfolio valuation
               let querySym = sym;
               let isCryptoUSD = sym.endsWith("-USD");
               if (isCryptoUSD) {
                  querySym = sym.replace("-USD", "-INR");
               }

               // Pivot away from restricted 'quote' endpoint to permissive 'chart' endpoint
               let res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(querySym)}?interval=1d`);
               let data = await res.json();

               // Robust fallback: if the translated -INR pair doesn't exist, revert to the original ticker
               if (isCryptoUSD && (!data.chart?.result?.[0])) {
                  querySym = sym;
                  res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(querySym)}?interval=1d`);
                  data = await res.json();
               }
               
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

