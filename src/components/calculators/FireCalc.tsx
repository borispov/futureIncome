import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from "recharts";

const cf = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function FireCalc() {
  const [P0, setP0] = useState(50000);               // current portfolio
  const [monthly, setMonthly] = useState(1000);      // monthly contribution
  const [realReturn, setRealReturn] = useState(5);   // real annual %, after inflation/fees
  const [expenses, setExpenses] = useState(40000);   // annual expenses (today's money)
  const [wr, setWr] = useState(3.5);                 // withdrawal rate %

  const [nYears, setNYears] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [data, setData] = useState<any[]>([]);

  function compute() {
    const C = monthly * 12;
    const r = realReturn / 100;
    const Target = expenses / (wr / 100);

    // solve for n:
    let n: number;
    if (Math.abs(r) > 1e-10) {
      const X = (Target + C / r) / (P0 + C / r);
      n = Math.log(X) / Math.log(1 + r);
    } else {
      n = (Target - P0) / C;
    }
    const nClamped = Math.max(0, n);
    const years = Math.ceil(nClamped);

    // build projection per year (real terms)
    const rows: any[] = [];
    let value = P0;
    for (let y = 0; y <= years; y++) {
      if (y > 0) value = value * (1 + r) + C;
      rows.push({ year: y, value, target: Target });
    }

    setNYears(nClamped);
    setTarget(Target);
    setData(rows);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e)=>{e.preventDefault(); compute();}} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-white p-6 rounded-lg border shadow-sm text-sm">
        <div><label className="block font-medium">Current portfolio (P₀)</label><input type="number" value={P0} onChange={(e)=>setP0(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div><label className="block font-medium">Monthly contribution</label><input type="number" value={monthly} onChange={(e)=>setMonthly(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div><label className="block font-medium">Real return (r, %)</label><input type="number" step="0.1" value={realReturn} onChange={(e)=>setRealReturn(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div><label className="block font-medium">Annual expenses (today)</label><input type="number" value={expenses} onChange={(e)=>setExpenses(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div><label className="block font-medium">Withdrawal rate (%)</label><input type="number" step="0.1" value={wr} onChange={(e)=>setWr(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div className="flex items-end"><button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded">Calculate</button></div>
      </form>

      {nYears !== null && target !== null && (
        <div className="space-y-3">
          <div className="bg-white border rounded p-3 text-sm">
            Target (FI number): <b>{cf.format(target)}</b> · Time to FI: <b>{nYears.toFixed(2)} years</b>
          </div>
          <div className="bg-white border rounded p-3 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v)=>cf.format(v as number)} width={90}/>
                <Tooltip formatter={(v:number)=>cf.format(v)} />
                <Legend />
                <ReferenceLine y={target} stroke="#ef4444" strokeDasharray="4 4" label="Target" />
                <Line type="monotone" dataKey="value" name="Portfolio (real)" stroke="#ea580c" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500">
            Uses real (inflation-adjusted) return. If r≈0, formula falls back to linear: n = (Target−P₀)/C.
          </p>
        </div>
      )}
    </div>
  );
}
