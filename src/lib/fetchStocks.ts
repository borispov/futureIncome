import fs from "fs";
import path from "path";
import yahooFinance from "yahoo-finance2";
import pino from "pino";
import getConsecutiveYears from "../../script/getConsecutiveYears";

import { champions } from "../../data/champions.json";

// -----------------------------
// Schema (our DB JSON)
// -----------------------------
export interface MetaData {
  company: string;
  shortName?: string;
  longBusinessSummary?: string;
  sector: string;
  industry: string;
  country: string;
  address?: string;
  phone?: string;
  website?: string;
  employees?: number;
}

export interface SummaryData {
  currency: string;
  marketCap: number | null;
  beta: number | null;
  price: {
    current: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    prevClose: number | null;
    dayChangePercent: number | null;
    volume: number | null;
    avgVolume3m: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    fiftyDayAverage: number | null;
    twoHundredDayAverage: number | null;
  };
  dividends: {
    increasingYears: number | null;
    rate: number | null;
    yield: number | null;
    payoutRatio: number | null;
    exDate?: string;
    lastDividend?: number | null;
  };
}

export interface KeyStatistics {
  sharesOutstanding: number | null;
  floatShares: number | null;
  insiderOwnership: number | null;
  institutionalOwnership: number | null;
  shortRatio: number | null;
  shortPercentFloat: number | null;
  priceToBook: number | null;
  enterpriseValue: number | null;
  enterpriseToRevenue: number | null;
  enterpriseToEbitda: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  trailingEPS: number | null;
  forwardEPS: number | null;
  bookValue: number | null;
  netIncomeToCommon?: number | null;
}

export interface Financials {
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome?: number | null;
  netIncome?: number | null;
  ebitda: number | null;
  freeCashFlow: number | null;
  operatingCashFlow: number | null;
  totalCash: number | null;
  totalDebt: number | null;
  debtToEquity: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  ebitdaMargin: number | null;
  fcfMargin?: number | null;
  earningsGrowth?: number | null;
  lastFiveYears?: {
    revenue: number | null;
    netIncome: number | null;
  }[] | null;
}

export interface Snapshot {
  timestamp: string;
  price: number | null;
  marketCap: number | null;
  pe: number | null;
  eps: number | null;
  dividendYield: number | null;
  debtEquity: number | null;
}

export interface StockFile {
  ticker: string;
  meta: MetaData;
  summary: SummaryData;
  statistics: KeyStatistics;
  financials: Financials;
  snapshots: Snapshot[];
  dividends: Record<string, number>;
  updatedAt: string;
}

// -----------------------------
// Config
// -----------------------------
const logger = pino({ level: "info" });
const DATA_DIR = "./data/stocks";
const MAX_AGE_DAYS = 7;

// -----------------------------
// Core
// -----------------------------

  // Fetch additional data: financials (TTM and YoY)

async function parseStockData(ticker: string): Promise<StockFile> {
  logger.info({ ticker }, "Fetching stock data");

  // Let yahooFinance return loosely typed data
  let data: any = {};

  function getLastFiveYears(): Date {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 5);
    return startDate
  }
  const lastFiveYears = getLastFiveYears()

  try {
    data = await yahooFinance.quoteSummary(ticker, {
      period1: lastFiveYears,
      modules: [
        "price",
        "assetProfile",
        "summaryDetail",
        "defaultKeyStatistics",
        "financialData",
        "incomeStatementHistory", // revenue over period
        "cashflowStatementHistory" // netIncome over period
      ],
    });


  } catch(e) {
    logger.error({ ticker, err: e }, "Error fetching stock data");
    throw e;
  }

  const price = data.price ?? {};
  const profile = data.assetProfile ?? {};
  const summary = data.summaryDetail ?? {};
  const stats = data.defaultKeyStatistics ?? {};
  const fin = data.financialData ?? {};


    logger.info({ ticker }, "ADDING historical Revenue & Net Income stats ");
    let lastFiveYearsData = []
    // loop 4 times and each loop get { revenue } from incomeStatementHistory and { netIncome} from cashflowStatementHistory
    for (let i = 0; i < 4; i++) {
      const incomeItem = data.incomeStatementHistory?.incomeStatementHistory[i]
      const cashflowItem = data.cashflowStatementHistory?.cashflowStatements[i]
      lastFiveYearsData.push({
        date: incomeItem.endDate,
        revenue: incomeItem.totalRevenue,
        netIncome: cashflowItem.netIncome
      })
    }



  const meta: MetaData = {
    company: price.longName || "N/A",
    shortName: price.shortName,
    longBusinessSummary: profile.longBusinessSummary,
    sector: profile.sector || "N/A",
    industry: profile.industry || "N/A",
    country: profile.country || "N/A",
    address: profile.address1,
    phone: profile.phone,
    website: profile.website,
    employees: profile.fullTimeEmployees,
  };

  const summaryData: SummaryData = {
    currency: price.currency || "N/A",
    marketCap: price.marketCap ?? null,
    beta: summary.beta ?? null,
    price: {
      current: price.regularMarketPrice ?? null,
      open: price.regularMarketOpen ?? null,
      high: price.regularMarketDayHigh ?? null,
      low: price.regularMarketDayLow ?? null,
      prevClose: price.regularMarketPreviousClose ?? null,
      dayChangePercent: price.regularMarketChangePercent ?? null,
      volume: price.regularMarketVolume ?? null,
      avgVolume3m: summary.averageVolume ?? null,
      fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: summary.fiftyTwoWeekLow ?? null,
      fiftyDayAverage: summary.fiftyDayAverage ?? null,
      twoHundredDayAverage: summary.twoHundredDayAverage ?? null,
    },
    dividends: {
      increasingYears: await getConsecutiveYears(ticker),
      rate: summary.dividendRate ?? null,
      yield: summary.dividendYield ?? null,
      payoutRatio: summary.payoutRatio ?? null,
      exDate: summary.exDividendDate
        ? new Date(summary.exDividendDate).toISOString()
        : undefined,
      lastDividend: stats.lastDividendValue ?? null,
    },
  };

  const statistics: KeyStatistics = {
    sharesOutstanding: stats.sharesOutstanding ?? null,
    floatShares: stats.floatShares ?? null,
    insiderOwnership: stats.heldPercentInsiders ?? null,
    institutionalOwnership: stats.heldPercentInstitutions ?? null,
    shortRatio: stats.shortRatio ?? null,
    shortPercentFloat: stats.shortPercentOfFloat ?? null,
    priceToBook: stats.priceToBook ?? null,
    enterpriseValue: stats.enterpriseValue ?? null,
    enterpriseToRevenue: stats.enterpriseToRevenue ?? null,
    enterpriseToEbitda: stats.enterpriseToEbitda ?? null,
    trailingPE: stats.trailingPE ?? null,
    forwardPE: stats.forwardPE ?? null,
    trailingEPS: stats.trailingEps ?? null,
    forwardEPS: stats.forwardEps ?? null,
    bookValue: stats.bookValue ?? null,
    netIncomeToCommon: stats.netIncomeToCommon ?? null,
  };

  const fcf =
    fin.freeCashflow ??
    ((fin.operatingCashflow || 0) - (fin.capitalExpenditures || 0));

  const financials: Financials = {
    revenue: fin.totalRevenue ?? null,
    revenueGrowth: fin.revenueGrowth ?? null,
    grossProfit: fin.grossProfits ?? null,
    operatingIncome: fin.operatingIncome ?? null,
    netIncome: stats.netIncomeToCommon ?? null,
    ebitda: fin.ebitda ?? null,
    freeCashFlow: fcf,
    operatingCashFlow: fin.operatingCashflow ?? null,
    totalCash: fin.totalCash ?? null,
    totalDebt: fin.totalDebt ?? null,
    debtToEquity: fin.debtToEquity ?? null,
    returnOnAssets: fin.returnOnAssets ?? null,
    returnOnEquity: fin.returnOnEquity ?? null,
    grossMargin: fin.grossMargins ?? null,
    earningsGrowth: fin.earningsGrowth ?? null,
    operatingMargin: fin.operatingMargins ?? null,
    netMargin: fin.profitMargins ?? null, // same as Profit Margins
    ebitdaMargin: fin.ebitdaMargins ?? null,
    fcfMargin: fin.totalRevenue && fcf ? fcf / fin.totalRevenue : null,
    lastFiveYears: lastFiveYearsData ?? null,
  };

  const snapshot: Snapshot = {
    timestamp: new Date().toISOString(),
    price: price.regularMarketPrice ?? null,
    marketCap: price.marketCap ?? null,
    pe: stats.trailingPE ?? stats.forwardPE ?? null,
    eps: stats.trailingEps ?? null,
    dividendYield: summary.dividendYield ?? null,
    debtEquity: fin.debtToEquity ?? null,
  };

  console.log('last five year data: \n', financials.lastFiveYears)
  console.log('---------------')
  console.log('Revenue Growth...:\n', financials.revenueGrowth)
  // Dividend history
  const dividends: Record<string, number> = {};
  try {
    const hist = await yahooFinance.historical(ticker, {
      period1: "1970-01-01",
      interval: "1d",
      events: "dividends",
    });
    (hist as any[]).forEach((div) => {
      if (!div.dividends) return;
      const year = new Date(div.date).getFullYear().toString();
      dividends[year] = (dividends[year] || 0) + div.dividends;
    });
  } catch (err: any) {
    logger.warn({ ticker, err: err.message }, "Dividend history unavailable");
  }

  return {
    ticker: ticker.toUpperCase(),
    meta,
    summary: summaryData,
    statistics,
    financials,
    snapshots: [snapshot],
    dividends,
    updatedAt: new Date().toISOString(),
  };
}

// -----------------------------
// Save / Merge
// -----------------------------
function saveStockData(parsed: StockFile) {
  const filePath = path.join(DATA_DIR, `${parsed.ticker}.json`);
  let existing: StockFile | null = null;

  // if (fs.existsSync(filePath)) { // commented out to enable data filling manually
  if (false) {
    existing = JSON.parse(fs.readFileSync(filePath, "utf-8")) as StockFile;

    // freshness check
    if (existing.snapshots.length > 0) {
      const last = existing.snapshots[existing.snapshots.length - 1];
      const ageDays =
        (Date.now() - new Date(last.timestamp).getTime()) /
        (1000 * 60 * 60 * 24);

      if (ageDays < MAX_AGE_DAYS) {
        logger.info(
          { ticker: parsed.ticker, daysSince: ageDays.toFixed(2) },
          "Skipping fetch - data fresh"
        );
        return;
      }
    }
  }

  const updated: StockFile = {
    ...parsed,
    meta: existing?.meta || parsed.meta,
    snapshots: [...(existing?.snapshots || []), ...parsed.snapshots],
    dividends: { ...(existing?.dividends || {}), ...parsed.dividends },
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
  logger.info({ ticker: parsed.ticker }, "Saved stock file");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -----------------------------
// Main
// -----------------------------
async function main() {

  const tickers = [
    "NVDA", 
  ]

  for (const t of champions) {
    try {
      const parsed = await parseStockData(t);
      saveStockData(parsed);
    } catch (e: any) {
      logger.error({ ticker: t, error: e.message }, "Failed to fetch stock");
    }  
  sleep(1000);
}}

main();

