// scripts/fetchStocks.js
import fs from "fs";
import path from "path";
import yahooFinance from "yahoo-finance2";
import pino from "pino";

const logger = pino({ level: "info" });
const DATA_DIR = "data/stocks";

// --- Utility for formatting numbers ---
function fmtNumber(n) {
  if (n === undefined || n === null || isNaN(n)) return "N/A";
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + " T";
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + " B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + " M";
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + " K";
  return n.toString();
}

// --- Parse and map Yahoo data onto our schema ---
async function parseStockData(ticker) {
  logger.info({ ticker }, "Fetching stock data");

  const modules = [
    "price",
    "assetProfile",
    "summaryDetail",
    "defaultKeyStatistics",
    "financialData",
  ];

  const data = await yahooFinance.quoteSummary(ticker);

  console.log(data)

  const price = data.price || {};
  const profile = data.assetProfile || {};
  const summary = data.summaryDetail || {};
  const stats = data.defaultKeyStatistics || {};
  const fin = data.financialData || {};

  
  // Meta (static-ish info)
  const meta = {
    company: price.longName || price.shortName || "N/A",
    sector: profile.sector || "N/A",
    industry: profile.industry || "N/A",
    country: profile.country || "N/A",
    currency: price.currency || "N/A",
  };

  // Snapshot (dynamic info)
  const snapshot = {
    timestamp: new Date().toISOString(),
    price: price.regularMarketPrice || null,
    marketCap: price.marketCap || null,
    pe: stats.trailingPE || stats.forwardPE || null,
    eps: stats.trailingEps || null,
    dividendYield: summary.dividendYield
      ? (summary.dividendYield * 100).toFixed(2) + "%"
      : "N/A",
    debtEquity: fin.debtToEquity || null,
  };

  // Dividend history (accumulative)
  const dividends = {};
  try {
    const hist = await yahooFinance.historical(ticker, {
      period1: "1970-01-01",
      interval: "1d",
      events: "dividends",
    });
    hist.forEach((div) => {
      const y = new Date(div.date).getFullYear();
      dividends[y] = (dividends[y] || 0) + div.dividends;
    });
  } catch (err) {
    logger.warn({ ticker, err: err.message }, "Dividend history unavailable");
  }

  return { ticker: ticker.toUpperCase(), meta, snapshot, dividends };
}

// --- Store parsed data into JSON ---

// --- Main loop ---
async function main() {
  const tickers = ["AFL"];
  for (const t of tickers) {
    try {
      const parsed = await parseStockData(t);
    } catch (e) {
      logger.error({ ticker: t, error: e.message }, "Failed to fetch stock");
    }
  }
}

main();
