import { NextResponse } from "next/server";

// This is the beginning of the "Backend Sync" stage.
// We will use this API route to fetch live prices securely from the server side,
// preventing CORS issues and hiding any API keys from the browser.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    // Custom logic for 1g Gold and Silver in INR
    if (symbol === "GOLD_INR_1G" || symbol === "SILVER_INR_1G") {
       const baseSymbol = symbol === "GOLD_INR_1G" ? "GC=F" : "SI=F";
       
       // Fetch both base metal and USD/INR rate
       const [metalRes, inrRes] = await Promise.all([
          fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${baseSymbol}?interval=1d`),
          fetch(`https://query1.finance.yahoo.com/v8/finance/chart/INR=X?interval=1d`)
       ]);
       
       const metalData = await metalRes.json();
       const inrData = await inrRes.json();
       
       if (!metalData.chart.error && !inrData.chart.error) {
          const metalResult = metalData.chart.result[0];
          const inrResult = inrData.chart.result[0];
          
          const metalPriceUSD = metalResult.meta.regularMarketPrice;
          const inrRate = inrResult.meta.regularMarketPrice;
          
          const metalPrevUSD = metalResult.meta.chartPreviousClose || metalPriceUSD;
          const inrPrev = inrResult.meta.chartPreviousClose || inrRate;
          
          // 1 Troy Ounce = 31.1034768 grams
          const GRAMS_PER_OUNCE = 31.1034768;
          
          // Calculate price for 1 gram in INR with a 9% premium (Import Duty + GST)
          const calculatePrice = (usdOunce: number, inrConversion: number) => {
             return (usdOunce / GRAMS_PER_OUNCE) * inrConversion * 1.09;
          };
          
          const currentPriceINR = calculatePrice(metalPriceUSD, inrRate);
          const prevPriceINR = calculatePrice(metalPrevUSD, inrPrev);
          
          const change = currentPriceINR - prevPriceINR;
          const changePercent = prevPriceINR > 0 ? (change / prevPriceINR) * 100 : 0;
          
          return NextResponse.json({
             symbol: symbol,
             price: currentPriceINR,
             previousClose: prevPriceINR,
             change: change,
             changePercent: changePercent,
             currency: "INR",
             timestamp: new Date().toISOString()
          });
       }
    }

    // If the symbol is a 5 or 6 digit number, it's likely an Indian Mutual Fund AMFI code.
    // We will use the free mfapi.in to fetch the exact latest NAV for Indian mutual funds.
    if (/^\d{5,6}$/.test(symbol)) {
       const mfRes = await fetch(`https://api.mfapi.in/mf/${symbol}`);
       const mfData = await mfRes.json();
       
       if (mfData.status === "SUCCESS" && mfData.data && mfData.data.length > 0) {
          const latestNav = parseFloat(mfData.data[0].nav);
          return NextResponse.json({
            symbol: symbol,
            price: latestNav,
            currency: "INR",
            timestamp: new Date().toISOString()
          });
       }
    }

    // Default to Yahoo Finance for Equities, Crypto, etc.
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`);
    const data = await res.json();

    if (data.chart.error) {
       return NextResponse.json({ error: data.chart.error.description }, { status: 404 });
    }

    const result = data.chart.result[0];
    const currentPrice = result.meta.regularMarketPrice;
    const previousClose = result.meta.chartPreviousClose || result.meta.previousClose || currentPrice;
    const currency = result.meta.currency;

    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    return NextResponse.json({
      symbol: symbol,
      price: currentPrice,
      previousClose: previousClose,
      change: change,
      changePercent: changePercent,
      currency: currency,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json({ error: "Failed to fetch live price" }, { status: 500 });
  }
}
