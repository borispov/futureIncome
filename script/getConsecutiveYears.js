import puppeteer from "puppeteer";
import pino from "pino";

const logger = pino({ level: 'info' });


// put guard rails for this function with a proper logging to know the problem
export default async function getConsecutiveYears(ticker) {
  const url = `https://www.koyfin.com/company/${ticker}/dividends/`;
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    logger.info({ ticker, title }, 'Page loaded');
    const text = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("p"))
        .find(e => e.innerText.toLowerCase().includes("consecutive years"));
      return el ? el.innerText : null;
    });
    if (!text) {
      logger.error({ ticker }, 'Could not find consecutive years text');
      throw new Error("Could not find consecutive years text");
    }
    const match = text.match(/(\d+)\s+consecutive/i);
    return match ? parseInt(match[1], 10) : null;
  } catch (err) {
    logger.error({ ticker, err }, 'Error in getConsecutiveYears');
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        logger.error({ ticker, closeErr }, 'Error closing browser');
      }
    }
  }
}