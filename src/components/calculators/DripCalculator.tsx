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

export default function DripCalculator() {
  const [initial, setInitial] = useState<number>(10000);
  const [monthly, setMonthly] = useState<number>(500);
  const [stopYear, setStopYear] = useState<number | null>(null);
  const [yieldPct, setYieldPct] = useState<number>(3); // dividend yield %
  const [divGrowth, setDivGrowth] = useState<number>(4); // dividend growth rate %
  const [priceAppreciation, setPriceAppreciation] = useState<number>(2); // stock price appreciation %
  const [years, setYears] = useState<number>(15);
  const [stopDripYear, setStopDripYear] = useState<number | null>(null);

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

function compute() {
  let total = initial;
  let contributions = initial;
  let dividendCash = 0;

  let divYield = yieldPct / 100;
  const monthlyDivGrowth = Math.pow(1 + divGrowth / 100, 1 / 12) - 1;
  const monthlyPriceAppreciation = Math.pow(1 + priceAppreciation / 100, 1 / 12) - 1;

  const rows: any[] = [];

  for (let y = 0; y <= years; y++) {
    if (y > 0) {
      for (let m = 0; m < 12; m++) {
        if (stopYear === null || y <= stopYear) {
          total += monthly;
          contributions += monthly;
        }

        const dividends = total * (divYield / 12);

        // ✅ If DRIP hasn’t stopped, reinvest dividends
        if (stopDripYear === null || y <= stopDripYear) {
          total += dividends;
        } else {
          dividendCash += dividends;
        }

        divYield *= 1 + monthlyDivGrowth;
        total *= 1 + monthlyPriceAppreciation;
      }
    }

    rows.push({
      year: `Year ${y}`,
      "Future Value": total,
      "Total Contributions": contributions,
      "Dividends Taken": dividendCash,
    });
  }

  const stopContribText =
    stopYear !== null && stopYear < years
      ? ` (contributions stopped at year ${stopYear})`
      : "";
  const stopDripText =
    stopDripYear !== null && stopDripYear < years
      ? ` DRIP stopped at year ${stopDripYear}, dividends taken as cash thereafter.`
      : "";

  setData(rows);
  setSummary(
    `After ${years} years, your contributions of ${fmt.format(
      contributions
    )} could grow to ${fmt.format(total)} with dividend growth and stock appreciation${stopContribText}.${stopDripText}`
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
        <h2 className="text-base font-semibold">DRIP Inputs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Initial investment</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                value={initial}
                onChange={(e) => setInitial(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 "
              />
              <span className="ml-2 text-gray-500">$</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Monthly contribution</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 "
              />
              <span className="ml-2 text-gray-500">$</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Dividend yield</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                step="0.1"
                value={yieldPct}
                onChange={(e) => setYieldPct(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 "
              />
              <span className="ml-2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Dividend growth rate</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                step="0.1"
                value={divGrowth}
                onChange={(e) => setDivGrowth(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 "
              />
              <span className="ml-2 text-gray-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Stock price appreciation</label>
            <div className="flex items-center mt-1">
              <input
                type="number"
                step="0.1"
                value={priceAppreciation}
                onChange={(e) => setPriceAppreciation(Number(e.target.value))}
                className="w-full border rounded px-2 py-1 "
              />
              <span className="ml-2 text-gray-500">%</span>
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
              className="w-full border rounded px-2 py-1 mt-1 "
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={stopYear !== null}
              onChange={(e) => setStopYear(e.target.checked ? years : null)}
              className="h-4 w-4"
            />
            Stop contributions early?
          </label>

          {stopYear !== null && (
            <div className="mt-2">
              <label className="block text-sm font-medium">Contribution stop year</label>
              <input
                type="number"
                min={0}
                max={years}
                value={stopYear}
                onChange={(e) => setStopYear(Number(e.target.value))}
                className="w-1/4 border rounded px-2 py-1 mt-1 text-left"
              />
            </div>
          )}
        </div>

<div className="sm:col-span-2 mt-2">
  <label className="flex items-center gap-2 text-sm font-medium">
    <input
      type="checkbox"
      checked={stopDripYear !== null}
      onChange={(e) => setStopDripYear(e.target.checked ? years : null)}
      className="h-4 w-4"
    />
    Stop reinvesting dividends early?
  </label>

  {stopDripYear !== null && (
    <div className="mt-2">
      <label className="block text-sm font-medium">DRIP stop year</label>
      <input
        type="number"
        min={0}
        max={years}
        value={stopDripYear}
        onChange={(e) => setStopDripYear(Number(e.target.value))}
        className="w-full border rounded px-2 py-1 mt-1 text-right"
      />
    </div>
  )}
</div>





        <button
          type="submit"
          className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
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
                    dataKey="Future Value"
                    stroke="#ea580c" // orange accent
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Total Contributions"
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
