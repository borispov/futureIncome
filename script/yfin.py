import yfinance as yf

class StockInfo:
    def __init__(self, ticker: str):
        self.ticker = ticker.upper()
        self.stock = yf.Ticker(self.ticker)

    def get_info(self):
        info = self.stock.info

        company = info.get("longName") or info.get("shortName", "N/A")
        sector = info.get("sector", "N/A")
        industry = info.get("industry", "N/A")
        market_cap = info.get("marketCap", "N/A")
        pe_ratio = info.get("trailingPE") or info.get("forwardPE") or "N/A"
        eps = info.get("trailingEps", "N/A")

        # Dividend data
        dividend_rate = info.get("dividendRate", 0.0)
        dividend_yield = info.get("dividendYield", 0.0)
        dividend_yield = f"{dividend_yield*100:.2f}%" if dividend_yield else "N/A"

        # Manual payout ratio (Dividend / EPS)
        payout_ratio = "N/A"
        if dividend_rate and isinstance(eps, (int,float)) and eps > 0:
            payout_ratio = f"{(dividend_rate/eps)*100:.2f}%"

        debt_equity = info.get("debtToEquity", "N/A")

        # Earnings Yield (1 / PE)
        earnings_yield = "N/A"
        if isinstance(pe_ratio,(int,float)) and pe_ratio > 0:
            earnings_yield = f"{(1/pe_ratio)*100:.2f}%"

        return {
            "Ticker": self.ticker,
            "Company": company,
            "Sector": sector,
            "Industry": industry,
            "Market Cap": market_cap,
            "P/E Ratio": pe_ratio,
            "EPS (ttm)": eps,
            "Dividend per Share": dividend_rate if dividend_rate else "N/A",
            "Dividend Yield": dividend_yield,
            "Payout Ratio": payout_ratio,
            "Debt/Equity": debt_equity,
            "Earnings Yield %": earnings_yield
        }

    def get_dividend_history(self):
        divs = self.stock.dividends
        if divs.empty:
            return None

        yearly = divs.groupby(divs.index.year).sum()
        return yearly.to_dict()

def main():
    for t in ["JNJ","AAPL","MSFT"]:
        stock = StockInfo(t)
        info = stock.get_info()
        divs = stock.get_dividend_history()

        print("\n", "="*60)
        print(f"Stock Info for {info['Ticker']}")
        print("="*60)
        for k,v in info.items():
            print(f"{k:<20}: {v}")

        if divs:
            print("\nDividend History (per year):")
            for y,v in divs.items():
                print(f" {y}: {v:.2f}")
        else:
            print("\nNo dividend history available.")

if __name__=="__main__":
    main()
