# Future Dividend - King Stocks

A modern Astro-based web application for tracking dividend stocks, specifically Dividend Kings and Aristocrats. Built with React components and server-side API endpoints.

## Features

- **Dividend Tracking**: Monitor dividend yields, payment history, and ex-dividend dates
- **Stock Analysis**: View P/E ratios, market caps, and price changes
- **Preset Lists**: Built-in lists for Dividend Kings and Aristocrats
- **Custom Tickers**: Add your own stock symbols
- **Rate Limiting**: Built-in protection against Alpha Vantage API limits
- **Caching**: Server-side caching for improved performance

## Tech Stack

- **Astro**: Modern static site generator with hybrid rendering
- **React**: Interactive UI components
- **TypeScript**: Type-safe development
- **Alpha Vantage API**: Stock market data

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd futureIncome
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   Create a `.env` file in the root directory:
   ```env
   PUBLIC_ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```
   
   Get your free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Project Structure

```
src/
├── components/          # React components
│   └── StockTable.tsx  # Main stock table component
├── lib/                 # Utility functions
│   └── stockUtils.ts   # Stock data processing utilities
├── pages/               # Astro pages and API routes
│   ├── api/            # Server-side API endpoints
│   │   └── stocks/     # Stock data API
│   ├── index.astro     # Home page
│   └── king-stocks.astro # King stocks page
└── layouts/             # Page layouts
    └── BaseLayout.astro
```

## API Endpoints

- `GET /api/stocks/[ticker]?function=[type]` - Fetch stock data
  - `function=GLOBAL_QUOTE` - Current price and change
  - `function=OVERVIEW` - Company overview and fundamentals
  - `function=TIME_SERIES_MONTHLY_ADJUSTED` - Historical dividend data

## Environment Variables

- `PUBLIC_ALPHA_VANTAGE_API_KEY`: Your Alpha Vantage API key

## Notes

- Alpha Vantage free tier allows 5 requests per minute
- Data is cached server-side for 1 hour to minimize API calls
- The app gracefully handles rate limiting with user notifications
