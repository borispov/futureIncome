import React, { useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type Compounding = "Monthly" | "Yearly";

export default function DebtOrInvest() {
  const [principal, setPrincipal] = useState<number>(10000);
  const [years, setYears] = useState<number>(15);

  const [loanRate, setLoanRate] = useState<number>(10);
  const [compounding, setCompounding] = useState<Compounding>("Monthly");
  const [incomeTaxRate, setIncomeTaxRate] = useState<number>(35);
  const [loanTaxDeductible, setLoanTaxDeductible] = useState<"Yes" | "No">("Yes");

  const [investRate, setInvestRate] = useState<number>(7);
  const [investTaxRate, setInvestTaxRate] = useState<number>(0);

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  function compute() {
    const periodsPerYear = compounding === "Monthly" ? 12 : 1;

    const rDebt =
      (loanTaxDeductible === "Yes"
        ? loanRate * (1 - incomeTaxRate / 100)
        : loanRate) / 100;
    const rInv = (investRate * (1 - investTaxRate / 100)) / 100;

    let invest = principal;
    let debt = principal;
    const rows: any[] = [];

    for (let y = 0; y <= years; y++) {
      if (y > 0) {
        invest = invest * Math.pow(1 + rInv / periodsPerYear, periodsPerYear);
        debt = debt * Math.pow(1 + rDebt / periodsPerYear, periodsPerYear);
      }
      rows.push({
        year: `Year ${y}`,
        "Investment Value": invest,
        "Debt Cost": debt,
      });
    }

    setData(rows);
    setSummary(
      `After ${years} years, investing grows to ${fmt.format(
        rows[years]["Investment Value"]
      )}, while avoiding debt cost saves ${fmt.format(
        rows[years]["Debt Cost"]
      )}.`
    );
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          compute();
        }}
        className="space-y-6 bg-white p-6 rounded-lg border shadow-sm"
      >
        <h2 className="text-base font-semibold">Your Loan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Interest rate</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                step="0.1"
                value={loanRate}
                onChange={(e) => setLoanRate(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 text-right"
              />
              <span className="ml-2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Compounding</label>
            <select
              value={compounding}
              onChange={(e) => setCompounding(e.target.value as Compounding)}
              className="w-full border rounded px-2 py-1 mt-1"
            >
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Marginal tax rate (income)</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                step="0.1"
                value={incomeTaxRate}
                onChange={(e) => setIncomeTaxRate(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 text-right"
              />
              <span className="ml-2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Loan tax deductible?</label>
            <select
              value={loanTaxDeductible}
              onChange={(e) =>
                setLoanTaxDeductible(e.target.value as "Yes" | "No")
              }
              className="w-full border rounded px-2 py-1 mt-1"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>

        <h2 className="text-base font-semibold">Your Investment</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Expected return</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                step="0.1"
                value={investRate}
                onChange={(e) => setInvestRate(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 text-right"
              />
              <span className="ml-2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Tax rate on investment</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                step="0.1"
                value={investTaxRate}
                onChange={(e) => setInvestTaxRate(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 text-right"
              />
              <span className="ml-2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Extra money</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 text-right"
              />
              <span className="ml-2 text-gray-500">$</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Years</label>
          <input
            type="number"
            min={1}
            max={50}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-24 border rounded px-2 py-1 text-right mt-1"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Calculate
        </button>
      </form>

      {summary && (
        <div className="space-y-4">
          <div className="bg-white border rounded p-3 text-sm">{summary}</div>
          <div className="bg-white border rounded p-3">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => fmt.format(v as number)} width={80} />
                  <Tooltip formatter={(val: number) => fmt.format(val)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Investment Value"
                    stroke="#dc2626"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Debt Cost"
                    stroke="#0d9488"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
