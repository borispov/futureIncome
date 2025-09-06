import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function RetirementCalc() {
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [monthly, setMonthly] = useState(800);
  const [currentAge, setCurrentAge] = useState(35);
  const [retireAge, setRetireAge] = useState(65);
  const [annualReturn, setAnnualReturn] = useState(7); // nominal, %
  const years = Math.max(0, retireAge - currentAge);

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  function compute() {
    const r = annualReturn / 100 / 12;
    let total = currentSavings;
    let contributed = currentSavings;
    const rows: any[] = [{ year: currentAge, value: total, contrib: contributed }];

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        total += monthly;
        contributed += monthly;
        total *= 1 + r;
      }
      rows.push({ year: currentAge + y, value: total, contrib: contributed });
    }

    setData(rows);
    setSummary(
      `At age ${retireAge}, portfolio ≈ ${fmt.format(total)}. Total contributions ≈ ${fmt.format(
        contributed
      )}.`
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => { e.preventDefault(); compute(); }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-white p-6 rounded-lg border shadow-sm text-sm"
      >
        <div>
          <label className="block font-medium">Current savings</label>
          <input type="number" value={currentSavings} onChange={(e)=>setCurrentSavings(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/>
        </div>
        <div>
          <label className="block font-medium">Monthly contribution</label>
          <input type="number" value={monthly} onChange={(e)=>setMonthly(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/>
        </div>
        <div>
          <label className="block font-medium">Current age</label>
          <input type="number" value={currentAge} onChange={(e)=>setCurrentAge(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/>
        </div>
        <div>
          <label className="block font-medium">Retirement age</label>
          <input type="number" value={retireAge} onChange={(e)=>setRetireAge(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/>
        </div>
        <div>
          <label className="block font-medium">Expected annual return (%)</label>
          <input type="number" step="0.1" value={annualReturn} onChange={(e)=>setAnnualReturn(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/>
        </div>
        <div className="flex items-end">
          <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded">Calculate</button>
        </div>
      </form>

      {summary && (
        <div className="space-y-3">
          <div className="bg-white border rounded p-3 text-sm">{summary}</div>
          <div className="bg-white border rounded p-3 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v)=>fmt.format(v as number)} width={80}/>
                <Tooltip formatter={(v:number)=>fmt.format(v)} />
                <Legend />
                <Line type="monotone" dataKey="value" name="Portfolio" stroke="#ea580c" dot={false}/>
                <Line type="monotone" dataKey="contrib" name="Contributions" stroke="#0d9488" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
