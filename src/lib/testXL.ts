import XLSX from "xlsx";

// Load workbook
const workbook = XLSX.readFile("./data/CHAMPIONS-CCC.xlsx");

// Get first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets['All CCC'];

// Convert to JSON (array of arrays, with header row at index 0)
const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Extract header row
const headers = rows[0];
console.log("Headers:", headers[19]);

// Example: Find ticker in column B and grab years (E), DGR-3Y (T), DGR-5Y (U), DGR-10Y (Y)
function getRowForTicker(ticker: string) {
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[1]?.toString().toUpperCase() === ticker.toUpperCase()) {
      return row;
    }
  }
  return null;
}

const ticker = "JNJ";
const row = getRowForTicker(ticker);

if (row) {
  console.log(`Row for ${ticker}:`, row);
  console.log("Consecutive Years (E):", row[4]);
  console.log("3-Year DGR (T):", row[19]);
  console.log("5-Year DGR (U):", row[20]);
  console.log("10-Year DGR (Y):", row[21]);
} else {
  console.log(`Ticker ${ticker} not found in Excel file.`);
}
