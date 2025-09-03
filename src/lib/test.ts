import yahooFinance from "yahoo-finance2";

(async function() {
  const res = await yahooFinance.quoteSummary("CINF");
  const a = res.financialData
  console.log(a)
  
  const b = res.balanceSheetHistory
  const c = res.cashflowStatementHistory
  console.log(a)
  console.log(c)
})();
