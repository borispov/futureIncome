import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function CompoundCalc() {
  const [initial, setInitial] = useState(10000);
  const [monthly, setMonthly] = useState(300);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  function compute() {
    const r = rate / 100 / 12;
    let total = initial;
    let contributed = initial;
    const rows: any[] = [{ year: 0, value: total, contrib: contributed }];

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        total += monthly;
        contributed += monthly;
        total *= 1 + r;
      }
      rows.push({ year: y, value: total, contrib: contributed });
    }

    setData(rows);
    setSummary(`After ${years} years: ${fmt.format(total)} (contrib ${fmt.format(contributed)})`);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e)=>{e.preventDefault(); compute();}} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-white p-6 rounded-lg border shadow-sm text-sm">
        <div><label className="block font-medium">Initial</label><input type="number" value={initial} onChange={(e)=>setInitial(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div><label className="block font-medium">Monthly</label><input type="number" value={monthly} onChange={(e)=>setMonthly(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div><label className="block font-medium">Annual return (%)</label><input type="number" step="0.1" value={rate} onChange={(e)=>setRate(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div><label className="block font-medium">Years</label><input type="number" value={years} onChange={(e)=>setYears(+e.target.value)} className="w-full border rounded px-2 py-1 mt-1 text-right"/></div>
        <div className="flex items-end"><button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded">Calculate</button></div>
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
                <Line type="monotone" dataKey="value" name="Future Value" stroke="#ea580c" dot={false}/>
                <Line type="monotone" dataKey="contrib" name="Contributions" stroke="#0d9488" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
