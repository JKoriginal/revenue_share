"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";
import { escapeHtml, printHtml } from "@/lib/print";

type MonthlyShare = {
  month: string;
  year: number;
  monthNumber: number;
  revenue: number;
  sectionShare: number;
  employeeShare: number;
};

export function MonthlyDistributionView({ data }: { data: MonthlyShare[] }) {
  const years = useMemo(() => Array.from(new Set(data.map((item) => item.year))).sort((a, b) => b - a), [data]);
  const [selectedYear, setSelectedYear] = useState(years[0]?.toString() || "");
  const yearData = useMemo(
    () => (selectedYear ? data.filter((item) => item.year === Number(selectedYear)) : data),
    [data, selectedYear]
  );
  const [selectedMonth, setSelectedMonth] = useState(yearData.at(-1)?.month || "");
  const visibleData = selectedMonth ? yearData.filter((item) => item.month === selectedMonth) : yearData;
  const selectedSummary = useMemo(
    () =>
      yearData.find((item) => item.month === selectedMonth) || {
        month: "No month",
        year: 0,
        monthNumber: 0,
        revenue: 0,
        sectionShare: 0,
        employeeShare: 0
      },
    [selectedMonth, yearData]
  );

  useEffect(() => {
    setSelectedYear((current) => current || years[0]?.toString() || "");
  }, [years]);

  useEffect(() => {
    setSelectedMonth(yearData.at(-1)?.month || "");
  }, [selectedYear, yearData]);

  function printSelectedMonth() {
    printHtml(
      "Revenue Distribution View",
      `
        <p>${escapeHtml(selectedSummary.month)}</p>
        <div class="summary">
          <div><strong>Monthly Revenue</strong><br>${escapeHtml(money(selectedSummary.revenue))}</div>
          <div><strong>Section Distribution</strong><br>${escapeHtml(money(selectedSummary.sectionShare))}</div>
          <div><strong>Employee Distribution</strong><br>${escapeHtml(money(selectedSummary.employeeShare))}</div>
        </div>
      `
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Revenue Distribution View</h2>
          <p className="mt-1 text-sm text-stone-500">View monthly revenue, section allocation, and employee distribution.</p>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            type="button"
            onClick={printSelectedMonth}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 md:w-[28rem]">
          <div>
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
          <div>
            <label>Month</label>
            <select className="mt-1.5" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
              {yearData.map((item) => (
                <option key={`${item.year}-${item.monthNumber}`} value={item.month}>
                  {item.month}
                </option>
              ))}
              {!yearData.length ? <option value="">No months available</option> : null}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-md bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Monthly Revenue</p>
          <p className="mt-1 text-lg font-bold text-ink">{money(selectedSummary.revenue)}</p>
        </div>
        <div className="rounded-md bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Section Distribution</p>
          <p className="mt-1 text-lg font-bold text-ink">{money(selectedSummary.sectionShare)}</p>
        </div>
        <div className="rounded-md bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Employee Distribution</p>
          <p className="mt-1 text-lg font-bold text-forest">{money(selectedSummary.employeeShare)}</p>
        </div>
      </div>

      <div className="mt-5 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visibleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => Number(value).toLocaleString("en-LK")} />
            <Legend />
            <Bar name="Revenue" dataKey="revenue" fill="#1f6f4a" radius={[5, 5, 0, 0]} />
            <Bar name="Section Distribution" dataKey="sectionShare" fill="#c98a20" radius={[5, 5, 0, 0]} />
            <Bar name="Employee Distribution" dataKey="employeeShare" fill="#64748b" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MonthlyDistributionSummary({ data }: { data: MonthlyShare[] }) {
  const years = useMemo(() => Array.from(new Set(data.map((item) => item.year))).sort((a, b) => b - a), [data]);
  const [selectedYear, setSelectedYear] = useState(years[0]?.toString() || "");
  const yearData = useMemo(
    () => (selectedYear ? data.filter((item) => item.year === Number(selectedYear)) : data),
    [data, selectedYear]
  );

  useEffect(() => {
    setSelectedYear((current) => current || years[0]?.toString() || "");
  }, [years]);

  function printSelectedYear() {
    const rows = yearData
      .map(
        (share) => `
          <tr>
            <td>${escapeHtml(share.month)}</td>
            <td>${escapeHtml(money(share.revenue))}</td>
            <td>${escapeHtml(money(share.sectionShare))}</td>
            <td>${escapeHtml(money(share.employeeShare))}</td>
          </tr>
        `
      )
      .join("");

    printHtml(
      "Monthly Distribution Summary",
      `<p>Year: ${escapeHtml(selectedYear)}</p><table><thead><tr><th>Month</th><th>Revenue</th><th>Section Distribution</th><th>Employee Distribution</th></tr></thead><tbody>${rows}</tbody></table>`
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Monthly Distribution Summary</h2>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            type="button"
            onClick={printSelectedYear}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
        <div className="w-full sm:w-40">
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
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="py-2 pr-4">Month</th>
              <th className="py-2 pr-4">Revenue</th>
              <th className="py-2 pr-4">Section Distribution</th>
              <th className="py-2 pr-4">Employee Distribution</th>
            </tr>
          </thead>
          <tbody>
            {yearData.map((share) => (
              <tr key={`${share.year}-${share.monthNumber}`} className="border-t border-stone-100">
                <td className="py-2 pr-4 font-semibold text-ink">{share.month}</td>
                <td className="py-2 pr-4">{money(share.revenue)}</td>
                <td className="py-2 pr-4">{money(share.sectionShare)}</td>
                <td className="py-2 pr-4 font-semibold text-forest">{money(share.employeeShare)}</td>
              </tr>
            ))}
            {!yearData.length ? (
              <tr>
                <td className="py-4 text-stone-500" colSpan={4}>
                  No monthly revenue distribution data for this year.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
