"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, percent } from "@/lib/format";
import { escapeHtml, printHtml } from "@/lib/print";

type SectionShare = {
  sectionId: number;
  sectionName: string;
  year: number;
  amount: number;
  productCount: number;
};

export function SectionRevenueShareView({ data }: { data: SectionShare[] }) {
  const years = useMemo(() => Array.from(new Set(data.map((item) => item.year))).sort((a, b) => b - a), [data]);
  const [selectedYear, setSelectedYear] = useState(years[0]?.toString() || "");
  const yearData = useMemo(
    () => (selectedYear ? data.filter((item) => item.year === Number(selectedYear)) : data),
    [data, selectedYear]
  );
  const total = yearData.reduce((sum, item) => sum + item.amount, 0);
  const rankedSections = [...yearData].sort((a, b) => b.amount - a.amount);
  const chartData = rankedSections.slice(0, 10).map((item) => ({
    name: item.sectionName,
    amount: item.amount
  }));

  function printSelectedYear() {
    const rows = rankedSections
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.sectionName)}</td>
            <td>${escapeHtml(money(item.amount))}</td>
            <td>${escapeHtml(percent(total ? (item.amount / total) * 100 : 0))}</td>
            <td>${escapeHtml(item.productCount)}</td>
          </tr>
        `
      )
      .join("");

    printHtml(
      "Section by Section Revenue Share View",
      `<p>Year: ${escapeHtml(selectedYear)}</p><table><thead><tr><th>Section</th><th>Amount</th><th>Share</th><th>Products</th></tr></thead><tbody>${rows}</tbody></table>`
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Section by Section Revenue Share View</h2>
          <p className="mt-1 text-sm text-stone-500">Compare how distributed revenue is allocated across sections.</p>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            type="button"
            onClick={printSelectedYear}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
        <div className="w-full md:w-40">
          <label>Year</label>
          <select className="mt-1.5" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
            {!years.length ? <option value="">No years available</option> : null}
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={130} />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Bar name="Section Revenue Share" dataKey="amount" fill="#1f6f4a" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="max-h-80 overflow-auto rounded-md border border-stone-100">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">Section</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Share</th>
                <th className="px-3 py-2">Products</th>
              </tr>
            </thead>
            <tbody>
              {rankedSections.map((item) => (
                <tr key={item.sectionId} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-semibold text-ink">{item.sectionName}</td>
                  <td className="px-3 py-2">{money(item.amount)}</td>
                  <td className="px-3 py-2">{percent(total ? (item.amount / total) * 100 : 0)}</td>
                  <td className="px-3 py-2">{item.productCount}</td>
                </tr>
              ))}
              {!rankedSections.length ? (
                <tr>
                  <td className="px-3 py-4 text-stone-500" colSpan={4}>
                    No section revenue share data for this year.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
