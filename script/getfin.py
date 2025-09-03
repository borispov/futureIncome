import requests, re, time, logging
from bs4 import BeautifulSoup
from typing import Dict

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ScrapingError(Exception): pass
class StockNotFoundError(ScrapingError): pass
class NetworkError(ScrapingError): pass

class StockScraper:
    def __init__(self, max_retries=3, retry_delay=2, request_delay=1):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'Mozilla/5.0'})
        self.max_retries, self.retry_delay, self.request_delay = max_retries, retry_delay, request_delay

    def _make_request(self, url: str, source: str="") -> requests.Response:
        for attempt in range(self.max_retries):
            try:
                r = self.session.get(url, timeout=15)
                if r.status_code == 404: raise StockNotFoundError(f"404 at {source}")
                if r.status_code in (403,429,500) or r.status_code >= 400:
                    raise NetworkError(f"HTTP {r.status_code} at {source}")
                if len(r.content) < 100: raise NetworkError(f"Response too short at {source}")
                return r
            except Exception as e:
                if attempt == self.max_retries-1: raise NetworkError(f"Request failed {source}: {e}")
                time.sleep(self.retry_delay*(2**attempt))

    def _validate_ticker(self, ticker: str) -> str:
        t = ticker.strip().upper()
        if not re.match(r'^[A-Z][A-Z0-9.\-]{0,6}$', t): raise ValueError("Invalid ticker")
        return t

    def get_finviz_data(self, ticker: str) -> Dict[str,str]:
        t = self._validate_ticker(ticker)
        base_url = f"https://finviz.com/quote.ashx?t={t}&p=d"
        soup = BeautifulSoup(self._make_request(base_url,"FinViz").content,'html.parser')

        table = soup.find('table',{'class':'snapshot-table2'})
        if not table:
            raise StockNotFoundError(f"{t} not found on FinViz (no snapshot table)")

        data={}
        for row in table.find_all('tr'):
            cells=row.find_all('td')
            for i in range(0,len(cells),2):
                if i+1<len(cells):
                    k,v=cells[i].get_text(strip=True),cells[i+1].get_text(strip=True)
                    if k and v: data[k]=v

        # Sector & Industry
        for a in soup.find_all('a', href=True):
            if "&f=sec_" in a['href']: data['Sector']=a.get_text(strip=True)
            if "&f=ind_" in a['href']: data['Industry']=a.get_text(strip=True)

        data['Company']=self._extract_company_name(soup,t)

        # --- Dividend Page ---
        div_url = base_url + "&ty=dv"
        div_soup = BeautifulSoup(self._make_request(div_url,"FinViz Dividends").content,'html.parser')
        # grab dividend est. again if exists
        div_table = div_soup.find('table',{'class':'snapshot-table2'})
        if div_table:
            for row in div_table.find_all('tr'):
                cells=row.find_all('td')
                for i in range(0,len(cells),2):
                    if i+1<len(cells):
                        k,v=cells[i].get_text(strip=True),cells[i+1].get_text(strip=True)
                        if k and v: data[k]=v

        # Normalize
        result = {
            'Ticker': t,
            'Company': data.get('Company','N/A'),
            'Sector': data.get('Sector','N/A'),
            'Industry': data.get('Industry','N/A'),
            'P/E Ratio': data.get('P/E', data.get('PE','N/A')),
            'Market Cap': data.get('Market Cap', data.get('Mkt Cap','N/A')),
            'Dividend Yield': data.get('Dividend Est.','N/A'),
            'Dividend': data.get('Dividend','N/A'),
            'EPS (ttm)': data.get('EPS (ttm)','N/A'),
            'Debt/Equity': data.get('Debt/Eq','N/A')
        }

        # --- Manual Payout Ratio ---
        result['Payout Ratio'] = self._calc_payout_ratio(result.get('Dividend'), result.get('EPS (ttm)'))

        return result

    def _calc_payout_ratio(self, dividend: str, eps: str) -> str:
        try:
            d = float(re.sub(r'[^\d.-]','',dividend))
            e = float(re.sub(r'[^\d.-]','',eps))
            if e > 0:
                return f"{(d/e)*100:.2f}%"
        except: pass
        return "N/A"

    def _extract_company_name(self,soup,t:str)->str:
        title=soup.find('title')
        if title:
            m=re.search(rf'{t}\s+(.*?)\s+Stock Quote',title.get_text(),re.I)
            if m: return m.group(1).strip()
        return "Unknown Company"

    def calculate_earnings_yield(self,pe:str)->str:
        try:
            val=float(re.sub(r'[^\d.-]','',pe))
            return f"{(1/val)*100:.2f}%" if val>0 else "N/A"
        except: return "N/A"

    def get_stock_info(self,ticker:str)->Dict[str,str]:
        r={'Ticker':ticker,'Status':'Unknown','Errors':[]}
        try:
            data=self.get_finviz_data(ticker)
            data['Earnings Yield %']=self.calculate_earnings_yield(data.get('P/E Ratio','N/A'))
            r.update(data)
            r['Status']="Success"
        except StockNotFoundError as e: r['Errors']+=[str(e)];r['Status']="Not Found"
        except NetworkError as e: r['Errors']+=[str(e)];r['Status']="Network Error"
        except ScrapingError as e: r['Errors']+=[str(e)];r['Status']="Scraping Error"
        except ValueError as e: r['Errors']+=[str(e)];r['Status']="Invalid Input"
        return r

def main():
    s=StockScraper()
    for t in ["JNJ","AAPL","MSFT"]:
        info=s.get_stock_info(t)
        print("\n",t, info)

if __name__=="__main__": main()
